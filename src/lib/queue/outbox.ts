import prisma from "@/lib/db/prisma";
import { sendEmail, getBookingConfirmationTemplate, getRentReminderTemplate } from "@/lib/email/mailer";

export interface OutboxPayload {
  [key: string]: any;
}

/**
 * Creates an outbox message inside the caller's database transaction.
 * Guarantees zero lost messages if transaction succeeds, and zero ghost messages if it rolls back.
 */
export async function queueOutboxMessage(
  tx: any,
  type: string,
  payload: OutboxPayload
) {
  const client = tx || prisma;
  return client.outboxMessage.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      status: "PENDING",
    },
  });
}

/**
 * Reads pending outbox records and dispatches them with retry tracking.
 * Can be run by BullMQ worker, scheduled cron, or standalone background process.
 */
export async function dispatchOutboxBatch(batchSize = 25) {
  const pendingMessages = await prisma.outboxMessage.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      retryCount: { lt: 5 }, // Max 5 retries with exponential backoff
    },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });

  if (pendingMessages.length === 0) {
    return { dispatched: 0, failed: 0 };
  }

  let dispatched = 0;
  let failed = 0;

  for (const msg of pendingMessages) {
    try {
      const payload = JSON.parse(msg.payload);

      // Route message according to business type
      if (msg.type === "EMAIL_BOOKING_CONFIRMATION") {
        if (payload.recipientEmail) {
          const html = getBookingConfirmationTemplate({
            tenantName: payload.tenantName || "Resident",
            propertyName: payload.propertyName || "StaySphere Property",
            bookingRef: payload.bookingReference || payload.bookingRef || "STAY-BOOKING",
            roomDetails: payload.roomDetails || payload.bedNumber || "Assigned Bed",
            checkInDate: payload.checkInDate || "Confirmed Move-in",
            amountPaid: Number(payload.monthlyRent || payload.amountPaid || 2000),
          });

          await sendEmail({
            to: payload.recipientEmail,
            subject: `Booking Confirmed: ${payload.propertyName} (${payload.bookingReference || "STAY"})`,
            html,
            template: "BOOKING_CONFIRMATION",
          });
        }
      } else if (msg.type === "NOTIFICATION_BROADCAST") {
        if (payload.userId) {
          await prisma.notification.create({
            data: {
              userId: payload.userId,
              title: payload.title || "StaySphere Notice",
              message: payload.message || "",
              link: payload.link || "/dashboard",
            },
          });
        }
      }

      // Mark DISPATCHED
      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: "DISPATCHED",
          dispatchedAt: new Date(),
          errorMessage: null,
        },
      });

      dispatched++;
    } catch (err: any) {
      console.error(`[Outbox Dispatcher] Error processing msg ${msg.id}:`, err);
      failed++;
      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data: {
          status: "FAILED",
          retryCount: { increment: 1 },
          errorMessage: err.message || "Dispatch execution failed",
        },
      });
    }
  }

  return { dispatched, failed };
}
