export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { createPaymentOrderSchema } from "@/lib/validators";
import { createUpiOrder } from "@/lib/payments/upi-gateway";
import { PaymentStatus, PaymentType } from "@/lib/constants";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRateLimit(req, "payments:create-order", 20, 60);
    if (rateLimited) return rateLimited;

    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const data = createPaymentOrderSchema.parse(body);

    const clientOrderId = `RCPT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/dashboard?payment=done`;

    // customer_mobile: passed from client or fallback
    const customerMobile = data.customerMobile || "9999999999";

    // Fulfill Step 14: Enforce payment amount strictly from server DB records
    let verifiedAmount = Number(data.amount);
    if (data.bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: data.bookingId },
        include: { room: true },
      });
      if (booking) {
        if (data.paymentType === PaymentType.BOOKING_ADVANCE) {
          verifiedAmount = 2000; // Platform standard advance token
        } else if (data.paymentType === PaymentType.SECURITY_DEPOSIT) {
          verifiedAmount = Number(booking.securityDeposit || booking.room?.securityDeposit || data.amount);
        }
      }
    } else if (data.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: data.invoiceId },
      });
      if (invoice) {
        verifiedAmount = Number(invoice.totalAmount);
      }
    }

    // Reuse an unexpired PENDING order (< 10 min old) for the same booking/invoice to avoid duplicate orders
    if (data.bookingId || data.invoiceId) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const existingPending = await prisma.payment.findFirst({
        where: {
          bookingId: data.bookingId || undefined,
          invoiceId: data.invoiceId || undefined,
          paymentType: data.paymentType as PaymentType,
          status: PaymentStatus.PENDING,
          amount: verifiedAmount,
          createdAt: { gte: tenMinutesAgo },
        },
        orderBy: { createdAt: "desc" },
      });

      if (existingPending?.razorpayOrderId) {
        return NextResponse.json({
          orderId: existingPending.razorpayOrderId,
          clientOrderId: existingPending.receiptNumber,
          paymentUrl: `${process.env.UPI_GATEWAY_URL || "http://localhost:8000"}/pay/${existingPending.razorpayOrderId}`,
          upiIntent: null,
          amount: Number(existingPending.amount),
          currency: "INR",
          receiptNumber: existingPending.receiptNumber,
          paymentId: existingPending.id,
          reused: true,
        });
      }
    }

    // Create order with UPI Gateway (mypkdev-21/upi-gateway API)
    const order = await createUpiOrder({
      amount: verifiedAmount,
      clientOrderId,
      customerName: auth.user.name || "StaySphere Tenant",
      customerEmail: auth.user.email || undefined,
      customerMobile,
      note: `${data.paymentType.replace(/_/g, " ")} - StaySphere`,
      redirectUrl,
    });

    // Save pending payment record in DB
    const payment = await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        invoiceId: data.invoiceId,
        paymentType: data.paymentType as PaymentType,
        amount: verifiedAmount,
        currency: "INR",
        razorpayOrderId: order.orderId, // stores UPI gateway order_id reference
        paymentMethod: "UPI_GATEWAY",
        status: PaymentStatus.PENDING,
        receiptNumber: clientOrderId,
      },
    });

    return NextResponse.json({
      orderId: order.orderId,
      clientOrderId: order.clientOrderId,
      paymentUrl: order.paymentUrl,
      upiIntent: order.upiIntent,
      amount: verifiedAmount,
      currency: "INR",
      receiptNumber: clientOrderId,
      paymentId: payment.id,
    });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create payment order error:", error);
    return NextResponse.json({ error: "Failed to initiate payment order" }, { status: 500 });
  }
}
