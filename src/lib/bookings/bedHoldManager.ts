import prisma from "@/lib/db/prisma";
import { BedStatus, BookingStatus } from "@/lib/constants";

/**
 * Checks for and releases beds that were held/reserved for payment
 * but whose 15-minute checkout window has elapsed without confirmed payment.
 * Fulfills Step 13, Step 15 & Part F4 of the business plan.
 */
export async function releaseExpiredBedHolds(): Promise<{
  releasedCount: number;
  expiredBookings: string[];
}> {
  const now = new Date();

  // Find all bookings awaiting payment whose lock has expired
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.AWAITING_PAYMENT,
      lockExpiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      bookingReference: true,
      bedId: true,
      status: true,
    },
  });

  if (expiredBookings.length === 0) {
    return { releasedCount: 0, expiredBookings: [] };
  }

  let releasedCount = 0;
  const expiredIds: string[] = [];

  for (const b of expiredBookings) {
    try {
      await prisma.$transaction(async (tx) => {
        // 1. Mark booking EXPIRED
        await tx.booking.update({
          where: { id: b.id },
          data: { status: "EXPIRED" },
        });

        // 2. If bed is RESERVED, release it back to AVAILABLE
        if (b.bedId) {
          const bed = await tx.bed.findUnique({
            where: { id: b.bedId },
          });

          if (bed && bed.status === BedStatus.RESERVED) {
            await tx.bed.update({
              where: { id: b.bedId },
              data: { status: BedStatus.AVAILABLE },
            });
            releasedCount++;
          }
        }

        // 3. Record status history
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: b.id,
            fromStatus: b.status,
            toStatus: "EXPIRED",
            changedBy: "SYSTEM_HOLD_EXPIRY_WORKER",
            remarks: "Reservation hold expired after 15 minutes with no confirmed payment",
          },
        });
      });

      expiredIds.push(b.bookingReference);
    } catch (err) {
      console.error(`Failed to release hold for booking ${b.id}:`, err);
    }
  }

  return { releasedCount, expiredBookings: expiredIds };
}
