export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/jwt";
import { readFileBuffer, saveFileBuffer, buildStorageKey } from "@/lib/media/storage";
import { processServerImage } from "@/lib/media/serverCompressor";
import { MediaKind } from "@/lib/media/compress";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: mediaId } = await params;

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json({ error: "Media record not found" }, { status: 404 });
    }

    // Security check: Only the owner or an admin can finalize the upload
    if (media.ownerUserId !== session.userId && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If already READY, return early
    if (media.status === "READY") {
      return NextResponse.json({
        success: true,
        media,
        message: "Media already verified and ready",
      });
    }

    // Update status to PROCESSING
    await prisma.media.update({
      where: { id: media.id },
      data: { status: "PROCESSING" },
    });

    // 1. Read the uploaded raw bytes
    let rawBuffer: Buffer;
    try {
      rawBuffer = await readFileBuffer(media.storageKey);
    } catch (readErr: any) {
      await prisma.media.update({
        where: { id: media.id },
        data: {
          status: "FAILED",
          failureReason: "UPLOAD_FILE_MISSING: Raw upload stream could not be read from storage",
        },
      });
      return NextResponse.json(
        { error: "Uploaded file not found in storage bucket" },
        { status: 400 }
      );
    }

    // 2. Server compression pipeline (Sharp libvips: EXIF strip, variants, WebP, blur, bomb guard)
    let processed;
    try {
      processed = await processServerImage(rawBuffer, media.purpose as MediaKind);
    } catch (procErr: any) {
      console.error("[ImageWorker] Processing failure:", procErr);
      await prisma.media.update({
        where: { id: media.id },
        data: {
          status: "FAILED",
          failureReason: procErr.message || "IMAGE_PROCESSING_FAILED",
        },
      });
      return NextResponse.json(
        { error: `Image processing failed: ${procErr.message}` },
        { status: 422 }
      );
    }

    // 3. Save generated variants to final storage
    const variantsMeta: Record<string, any> = {};

    for (const [vName, vData] of Object.entries(processed.variants)) {
      const variantKey = buildStorageKey({
        visibility: media.visibility as "PUBLIC" | "PRIVATE",
        purpose: media.purpose,
        mediaId: media.id,
        userId: media.ownerUserId,
        propertyId: media.propertyId || undefined,
        ticketId: media.ticketId || undefined,
        variant: vName,
        hash: processed.sha256,
      });

      const saved = await saveFileBuffer(variantKey, vData.buffer, vData.contentType);
      variantsMeta[vName] = {
        key: saved.key,
        url: saved.url,
        width: vData.width,
        height: vData.height,
        bytes: vData.bytes,
      };
    }

    // Primary URL to display (prefer medium or large)
    const primaryUrl =
      variantsMeta.medium?.url ||
      variantsMeta.large?.url ||
      variantsMeta.preview?.url ||
      variantsMeta.thumb?.url;

    // 4. Update Media row with READY status and metadata
    const updatedMedia = await prisma.media.update({
      where: { id: media.id },
      data: {
        status: "READY",
        url: primaryUrl,
        variants: JSON.stringify(variantsMeta),
        blurData: processed.blurData,
        sha256: processed.sha256,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes,
      },
    });

    // 5. Backward compatibility sync:
    // If PROPERTY_PHOTO or PANORAMA, ensure it exists in PropertyMedia / VirtualTour
    if (media.propertyId && media.purpose === "PROPERTY_PHOTO") {
      await prisma.propertyMedia.create({
        data: {
          propertyId: media.propertyId,
          url: primaryUrl,
          isCover: media.isCover,
          sortOrder: media.sortOrder,
        },
      });
    } else if (media.propertyId && media.purpose === "PANORAMA") {
      await prisma.virtualTour.create({
        data: {
          propertyId: media.propertyId,
          roomId: media.roomId || null,
          title: "360° Panorama Room View",
          assetType: "PANORAMA_360",
          assetUrl: variantsMeta.large?.url || primaryUrl,
          sortOrder: media.sortOrder,
        },
      });
    }

    return NextResponse.json({
      success: true,
      media: updatedMedia,
      variants: variantsMeta,
      blurData: processed.blurData,
    });
  } catch (error: any) {
    console.error("Complete media upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to finalize media processing" },
      { status: 500 }
    );
  }
}
