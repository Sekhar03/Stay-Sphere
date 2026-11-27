export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/jwt";
import { Role } from "@/lib/constants";
import { buildStorageKey, generateUploadUrl } from "@/lib/media/storage";
import { MediaKind } from "@/lib/media/compress";

const MAX_PHOTOS_PER_PROPERTY = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      purpose = "PROPERTY_PHOTO",
      fileType = "image/webp",
      size,
      sha256,
      propertyId,
      roomId,
      ticketId,
      stayId,
      isCover = false,
      sortOrder = 0,
    } = body;

    const kind: MediaKind = purpose as MediaKind;
    const visibility = purpose === "KYC" || purpose === "TICKET" ? "PRIVATE" : "PUBLIC";

    // 1. Cap checks: Max photos per property
    if (propertyId && (purpose === "PROPERTY_PHOTO" || purpose === "PANORAMA")) {
      const existingCount = await prisma.media.count({
        where: {
          propertyId,
          status: { in: ["PENDING", "PROCESSING", "READY"] },
          deletedAt: null,
        },
      });

      if (existingCount >= MAX_PHOTOS_PER_PROPERTY) {
        return NextResponse.json(
          { error: `Property photo limit reached (max ${MAX_PHOTOS_PER_PROPERTY} photos)` },
          { status: 400 }
        );
      }
    }

    // 2. Deduplication check by SHA-256 (Section 5 & 6)
    if (sha256) {
      const existingMedia = await prisma.media.findFirst({
        where: {
          sha256,
          status: "READY",
          deletedAt: null,
        },
      });

      if (existingMedia) {
        // Re-use existing media row for this property/context
        const clonedMedia = await prisma.media.create({
          data: {
            ownerUserId: session.userId,
            propertyId: propertyId || null,
            roomId: roomId || null,
            ticketId: ticketId || null,
            stayId: stayId || null,
            purpose,
            visibility,
            status: "READY",
            sha256,
            storageKey: existingMedia.storageKey,
            url: existingMedia.url,
            variants: existingMedia.variants,
            blurData: existingMedia.blurData,
            width: existingMedia.width,
            height: existingMedia.height,
            bytes: existingMedia.bytes,
            sortOrder,
            isCover,
          },
        });

        // Also sync to legacy PropertyMedia if needed
        if (propertyId && (purpose === "PROPERTY_PHOTO" || purpose === "PANORAMA")) {
          await prisma.propertyMedia.create({
            data: {
              propertyId,
              url: clonedMedia.url || "",
              isCover,
              sortOrder,
            },
          });
        }

        return NextResponse.json({
          mediaId: clonedMedia.id,
          isDuplicate: true,
          media: clonedMedia,
          message: "Deduplicated via existing SHA-256 fingerprint",
        });
      }
    }

    // 3. Create Media row in DB with PENDING status
    const media = await prisma.media.create({
      data: {
        ownerUserId: session.userId,
        propertyId: propertyId || null,
        roomId: roomId || null,
        ticketId: ticketId || null,
        stayId: stayId || null,
        purpose,
        visibility,
        status: "PENDING",
        sha256: sha256 || null,
        storageKey: "pending",
        sortOrder,
        isCover,
      },
    });

    // 4. Build canonical storage key
    const storageKey = buildStorageKey({
      visibility,
      purpose,
      mediaId: media.id,
      userId: session.userId,
      propertyId,
      ticketId,
      hash: sha256,
    });

    // Update media with allocated storage key
    await prisma.media.update({
      where: { id: media.id },
      data: { storageKey },
    });

    // 5. Generate Presigned / Direct upload URL
    const uploadDetails = await generateUploadUrl({
      mediaId: media.id,
      storageKey,
      fileType,
      maxSizeBytes: size || 15 * 1024 * 1024,
    });

    return NextResponse.json({
      mediaId: media.id,
      uploadUrl: uploadDetails.uploadUrl,
      method: uploadDetails.method,
      storageKey,
      headers: uploadDetails.headers,
      expiresAt: uploadDetails.expiresAt,
    });
  } catch (error: any) {
    console.error("Upload URL generation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate upload URL" },
      { status: 500 }
    );
  }
}
