export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { getUpiOrder } from "@/lib/payments/upi-gateway";
import { BedStatus, BookingStatus, PaymentStatus } from "@/lib/constants";
import { sendEmail, getBookingConfirmationTemplate } from "@/lib/email/mailer";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { upiOrderReference, bookingId, invoiceId, utr: userEnteredUtr } = body;

    if (!upiOrderReference) {
      return NextResponse.json({ error: "upiOrderReference is required" }, { status: 400 });
    }

    // Verify payment status with UPI gateway (mynkdev-21/upi-gateway GET /api/v1/orders/{orderNo})
    const { status, utr: gatewayUtr } = await getUpiOrder(upiOrderReference);
    const finalUtr = gatewayUtr || userEnteredUtr || `upi_txn_${Date.now()}`;

    if (status !== "paid") {
      // Record failure if the gateway marked it failed or expired
      if (status === "failed" || status === "expired") {
        await prisma.payment.updateMany({
          where: { razorpayOrderId: upiOrderReference },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: `UPI Gateway returned ${status} status`,
          },
        });
        return NextResponse.json(
          { error: `Payment ${status} on UPI Gateway.`, status },
          { status: 400 }
        );
      }

      if (status === "review") {
        // Return 200 so the frontend can read the status field without treating it as an HTTP error
        return NextResponse.json(
          {
            success: false,
            status: "review",
            message:
              "Payment is under manual UTR review. Property manager will confirm within 24 hours.",
          },
          { status: 200 }
        );
      }

      // pending
      return NextResponse.json(
        {
          error: "Payment not detected yet. Please complete the UPI transaction and try again.",
          status: "pending",
        },
        { status: 402 }
      );
    }

    // Check if payment was already verified and settled (idempotency guard)
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId: upiOrderReference },
      include: {
        booking: {
          include: {
            bed: true,
            room: true,
            property: true,
            tenantUser: true,
          },
        },
        invoice: {
          include: {
            rentSchedule: true,
          },
        },
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (existingPayment.status === PaymentStatus.SUCCESS) {
      return NextResponse.json({
        success: true,
        message: "Payment already verified and finalized.",
        result: {
          payment: existingPayment,
          booking: existingPayment.booking,
          invoice: existingPayment.invoice,
        },
      });
    }

    // Atomic transaction to settle payment, activate tenant allocation & finalize booking
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { razorpayOrderId: upiOrderReference },
        data: {
          razorpayPaymentId: finalUtr,
          razorpaySignature: "upi-gateway-verified",
          status: PaymentStatus.SUCCESS,
        },
      });

      // 1. If linked to a Booking
      if (payment.bookingId) {
        const booking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: BookingStatus.CONFIRMED,
            statusHistory: {
              create: {
                fromStatus: BookingStatus.AWAITING_PAYMENT,
                toStatus: BookingStatus.CONFIRMED,
                changedBy: auth.user.userId,
                remarks: `Payment captured via UPI Gateway (UTR: ${finalUtr})`,
              },
            },
          },
          include: {
            bed: true,
            room: true,
            property: true,
            tenantUser: true,
          },
        });

        // Mark bed as OCCUPIED
        if (booking.bedId) {
          await tx.bed.update({
            where: { id: booking.bedId },
            data: { status: BedStatus.OCCUPIED },
          });

          // Link to tenant profile
          const tenantProfile = await tx.tenantProfile.findUnique({
            where: { userId: booking.tenantUserId },
          });

          if (tenantProfile) {
            await tx.tenantProfile.update({
              where: { id: tenantProfile.id },
              data: { currentBedId: booking.bedId },
            });

            await tx.tenantAllocation.create({
              data: {
                tenantProfileId: tenantProfile.id,
                bedId: booking.bedId,
                bookingId: booking.id,
                checkInDate: booking.checkInDate,
                monthlyRent: booking.monthlyRent,
                rentDueDay: 5,
                isActive: true,
              },
            });

            // Generate initial confirmed Invoice
            const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            await tx.invoice.create({
              data: {
                invoiceNumber,
                tenantProfileId: tenantProfile.id,
                amount: payment.amount,
                totalAmount: payment.amount,
                isPaid: true,
              },
            });
          }
        }

        return { payment, booking };
      }

      // 2. If linked to an Invoice (Monthly rent payment)
      if (payment.invoiceId) {
        const invoice = await tx.invoice.update({
          where: { id: payment.invoiceId },
          data: { isPaid: true },
          include: { rentSchedule: true },
        });

        if (invoice.rentScheduleId) {
          await tx.rentSchedule.update({
            where: { id: invoice.rentScheduleId },
            data: {
              status: "PAID",
              paidAt: new Date(),
            },
          });
        }

        return { payment, invoice };
      }

      return { payment };
    });

    // Send confirmation email asynchronously
    if ("booking" in result && result.booking) {
      const b = result.booking;
      const html = getBookingConfirmationTemplate({
        tenantName: b.tenantUser.name,
        propertyName: b.property.name,
        bookingRef: b.bookingReference,
        checkInDate: format(new Date(b.checkInDate), "dd MMMM yyyy"),
        amountPaid: Number(result.payment.amount),
        roomDetails: `Room ${b.room.roomNumber} (${b.bed?.bedNumber || "Assigned"})`,
      });

      sendEmail({
        to: b.tenantUser.email,
        subject: `Booking Confirmed: ${b.property.name} (${b.bookingReference})`,
        html,
        template: "BOOKING_CONFIRMED",
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and booking finalized.",
      result,
    });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
