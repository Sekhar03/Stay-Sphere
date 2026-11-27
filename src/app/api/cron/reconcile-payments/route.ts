export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { reconcilePendingPayments } from "@/lib/payments/reconcile";

export async function GET() {
  try {
    const summary = await reconcilePendingPayments();
    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron reconcile-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reconcile payments" },
      { status: 500 }
    );
  }
}
