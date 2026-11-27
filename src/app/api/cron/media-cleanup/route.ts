export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/media-cleanup
 *
 * Nightly job that:
 *   1. Purges Media rows stuck in PENDING > 24 hours (and their incomplete uploads)
 *   2. Hard-deletes rows soft-deleted > 30 days (and their storage variants)
 *
 * Call this from your cron scheduler (Vercel Cron, GitHub Actions, etc.)
 * with header  x-cron-secret: <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  // Basic auth guard — same pattern as other cron routes
  const secret = req.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/media/cleanup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward the secret so the cleanup route can verify it too
        "x-cron-secret": process.env.CRON_SECRET ?? "",
      },
    });

    const data = await res.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cleanup: data,
    });
  } catch (error: any) {
    console.error("Cron media-cleanup error:", error);
    return NextResponse.json(
      { error: error.message || "Media cleanup failed" },
      { status: 500 }
    );
  }
}
