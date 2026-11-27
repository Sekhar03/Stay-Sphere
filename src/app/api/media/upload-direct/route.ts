import { NextRequest, NextResponse } from "next/server";
import { saveFileBuffer } from "@/lib/media/storage";
import { getServerSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const mediaId = searchParams.get("mediaId");

    if (!key || !mediaId) {
      return NextResponse.json(
        { error: "Missing required query parameters: key and mediaId" },
        { status: 400 }
      );
    }

    // Verify media belongs to user and matches preallocated storage key (prevents arbitrary file overwrite)
    const mediaRecord = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!mediaRecord || mediaRecord.ownerUserId !== session.userId) {
      return NextResponse.json(
        { error: "Forbidden: Media record does not exist or access is denied" },
        { status: 403 }
      );
    }

    if (mediaRecord.storageKey !== key) {
      return NextResponse.json(
        { error: "Invalid storage key for allocated mediaId" },
        { status: 400 }
      );
    }

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty upload stream" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") || "image/webp";
    await saveFileBuffer(key, buffer, contentType);

    return NextResponse.json({
      success: true,
      mediaId,
      storageKey: key,
      bytes: buffer.length,
      message: "Direct file stream written successfully",
    });
  } catch (error: any) {
    console.error("Direct upload stream error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process upload stream" },
      { status: 500 }
    );
  }
}
