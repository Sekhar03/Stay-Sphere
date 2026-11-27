export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { verifyUpiWebhookSignature } from "@/lib/payments/upi-gateway";
import { PaymentStatus, BookingStatus } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // UPI Gateway sends timestamped signature in X-Signature: t={timestamp},v1={hmac}
    const signature =
      req.headers.get("x-signature") ||
      req.headers.get("x-webhook-signature") ||
      req.headers.get("x-gateway-signature") ||
      "";

    if (!verifyUpiWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);

    // Payload shape from mynkdev-21/upi-gateway SendWebhook job:
    // { event_id: "...", event: "order.paid"|"order.expired"|"order.failed", data: { order_id, client_order_id, amount, status, utr, ... } }
    const eventId = payload.event_id || payload.data?.order_id || `evt_${Date.now()}`;
    const eventType = payload.event; // "order.paid" | "order.expired" | "order.failed" | "order.under_review"
    const orderData = payload.data || {};
    const orderNo = orderData.order_id || payload.order_id;
    const clientOrderId = orderData.client_order_id || payload.client_order_id;

    // Idempotent processing check
    const existingEvent = await prisma.paymentWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.isHandled) {
      return NextResponse.json({ status: "already_processed" });
    }

    // Record webhook event in DB
    await prisma.paymentWebhookEvent.upsert({
      where: { eventId },
      update: {},
      create: {
        eventId,
        eventType: eventType || "unknown",
        payload: rawBody,
        isHandled: false,
      },
    });

    // Locate matching payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          ...(orderNo ? [{ razorpayOrderId: orderNo }] : []),
          ...(clientOrderId ? [{ receiptNumber: clientOrderId }] : []),
        ],
      },
    });

    // Handle order.paid (Payment captured)
    if (eventType === "order.paid") {
      const utr = orderData.utr || payload.utr;

      if (payment && payment.status !== PaymentStatus.SUCCESS) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              razorpayPaymentId: utr || `upi_txn_${Date.now()}`,
            },
          });

          if (payment.bookingId) {
            await tx.booking.update({
              where: { id: payment.bookingId },
              data: { status: BookingStatus.CONFIRMED },
            });
          }
        });
      }
    }
    // Handle order.expired or order.failed
    else if (eventType === "order.expired" || eventType === "order.failed") {
      if (payment && payment.status !== PaymentStatus.SUCCESS) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: `UPI Gateway webhook notified event: ${eventType}`,
          },
        });
      }
    }

    // Mark webhook event handled
    await prisma.paymentWebhookEvent.update({
      where: { eventId },
      data: { isHandled: true },
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("UPI Gateway webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
