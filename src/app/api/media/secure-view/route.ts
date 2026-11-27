import { NextRequest, NextResponse } from "next/server";
import { verifySignedUrl, readFileBuffer } from "@/lib/media/storage";
import { getServerSession } from "@/lib/auth/jwt";
import prisma from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const expires = parseInt(searchParams.get("expires") || "0", 10);
    const sig = searchParams.get("sig");
    const reason = searchParams.get("reason") || "Resident or Admin Verification";

    if (!key || !expires || !sig) {
      return NextResponse.json(
        { error: "Invalid or incomplete signed URL parameters" },
        { status: 400 }
      );
    }

    // 1. Cryptographic HMAC & expiration check
    const isValid = verifySignedUrl(key, expires, sig);
    if (!isValid) {
      return NextResponse.json(
        { error: "Signed URL has expired or has an invalid signature" },
        { status: 403 }
      );
    }

    // 2. Audit logging for compliance (Section 9: India's DPDP Act and audit requirement)
    const session = await getServerSession().catch(() => null);
    if (session?.userId) {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: "SECURE_MEDIA_ACCESS",
          entityType: "MEDIA",
          entityId: key,
          metadata: JSON.stringify({
            storageKey: key,
            accessReason: reason,
            ip: req.headers.get("x-forwarded-for") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          }),
        },
      }).catch((logErr) => console.warn("Audit logging non-blocking error:", logErr));
    }

    // 3. Read buffer
    const fileBuffer = await readFileBuffer(key);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Secure view access error:", error);
    return NextResponse.json(
      { error: "Requested secure document cannot be retrieved" },
      { status: 404 }
    );
  }
}
