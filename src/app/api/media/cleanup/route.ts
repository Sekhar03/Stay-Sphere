export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/jwt";
import { Role } from "@/lib/constants";
import { deleteStorageKey } from "@/lib/media/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.role !== Role.SUPER_ADMIN) {
      // Allow internal cron jobs with cron secret header
      const cronSecret = req.headers.get("x-cron-secret");
      if (cronSecret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Find and purge PENDING rows older than 24 hours (abandoned uploads)
    const abandonedMedia = await prisma.media.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    for (const item of abandonedMedia) {
      if (item.storageKey && item.storageKey !== "pending") {
        await deleteStorageKey(item.storageKey);
      }
    }

    const purgedPending = await prisma.media.deleteMany({
      where: {
        status: "PENDING",
        createdAt: { lt: twentyFourHoursAgo },
      },
    });

    // 2. Permanently purge soft-deleted media older than 30 days
    const softDeleted = await prisma.media.findMany({
      where: {
        deletedAt: { lt: thirtyDaysAgo },
      },
    });

    for (const item of softDeleted) {
      if (item.storageKey) {
        await deleteStorageKey(item.storageKey);
      }
    }

    const purgedDeleted = await prisma.media.deleteMany({
      where: {
        deletedAt: { lt: thirtyDaysAgo },
      },
    });

    // 3. Storage statistics summary (Section 6 & 10)
    const totalMedia = await prisma.media.count({ where: { status: "READY" } });
    const storageStats = await prisma.media.groupBy({
      by: ["purpose"],
      _sum: { bytes: true },
      _count: { id: true },
      where: { status: "READY" },
    });

    return NextResponse.json({
      success: true,
      cleanedPendingCount: purgedPending.count,
      purgedSoftDeletedCount: purgedDeleted.count,
      totalActiveMedia: totalMedia,
      storageStats,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Media cleanup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute media cleanup" },
      { status: 500 }
    );
  }
}
