import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/jwt";
import { saveFileBuffer, buildStorageKey } from "@/lib/media/storage";
import prisma from "@/lib/db/prisma";
import crypto from "crypto";

// Allowed MIME types for documents & identity proofs
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession().catch(() => null);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const purpose = (formData.get("purpose") as string) || "KYC";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 15MB limit." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Please upload PDF, JPG, PNG, or WebP documents.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute SHA-256 for integrity and deduplication
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const mediaId = "doc_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const isPdf = mimeType === "application/pdf";
    const ext = isPdf ? "pdf" : "webp";

    const userId = session?.userId || "anonymous";
    const storageKey = `uploads/documents/${userId}/${mediaId}-${hash.slice(0, 8)}.${ext}`;

    const { url } = await saveFileBuffer(storageKey, buffer, mimeType);

    // Optionally create media record in DB if session is present
    if (session?.userId) {
      try {
        await prisma.media.create({
          data: {
            id: mediaId,
            ownerUserId: session.userId,
            purpose,
            visibility: "PRIVATE",
            status: "READY",
            sha256: hash,
            storageKey,
            url,
            bytes: buffer.length,
          },
        });
      } catch (dbErr) {
        // Non-blocking for unauthenticated signup flows
        console.warn("Media DB record creation skipped:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      url,
      mediaId,
      filename: file.name,
      size: file.size,
      mimeType,
    });
  } catch (error: any) {
    console.error("Document upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload document" },
      { status: 500 }
    );
  }
}
