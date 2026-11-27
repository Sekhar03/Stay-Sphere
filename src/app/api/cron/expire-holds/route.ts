import { NextResponse } from "next/server";
import { releaseExpiredBedHolds } from "@/lib/bookings/bedHoldManager";

export async function GET() {
  try {
    const result = await releaseExpiredBedHolds();
    return NextResponse.json({
      success: true,
      releasedCount: result.releasedCount,
      expiredBookings: result.expiredBookings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron expire-holds error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to expire holds" },
      { status: 500 }
    );
  }
}
