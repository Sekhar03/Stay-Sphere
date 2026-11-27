export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { dispatchOutboxBatch } from "@/lib/queue/outbox";

export async function GET() {
  try {
    const result = await dispatchOutboxBatch(50);
    return NextResponse.json({
      success: true,
      dispatched: result.dispatched,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron dispatch-outbox error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch outbox batch" },
      { status: 500 }
    );
  }
}
