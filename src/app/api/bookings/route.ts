import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { createBookingSchema } from "@/lib/validators";
import { BedStatus, BookingStatus, Role } from "@/lib/constants";
import { releaseExpiredBedHolds } from "@/lib/bookings/bedHoldManager";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    // Fulfill Step 13/15: Real-time cleanup of expired 15-minute bed locks
    await releaseExpiredBedHolds();

    const body = await req.json();
    const data = createBookingSchema.parse(body);

    // Verify Resident KYC clearance before allowing booking / stay allocation
    if (auth.user.role === Role.CUSTOMER_TENANT) {
      let tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: auth.user.userId },
      });

      if (!tenantProfile) {
        tenantProfile = await prisma.tenantProfile.create({
          data: { userId: auth.user.userId },
        });
      }

      if (!tenantProfile.isKycVerified && !tenantProfile.idProofNumber) {
        return NextResponse.json(
          {
            error:
              "Resident KYC Clearance Required: In accordance with living regulations, your government identity proof must be submitted in your Dashboard before reserving accommodation.",
            kycPending: true,
          },
          { status: 403 }
        );
      }
    }

    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: {
        property: true,
        beds: true,
      },
    });

    if (!room || !room.isActive) {
      return NextResponse.json({ error: "Selected room is not available" }, { status: 404 });
    }

    // Atomic transaction with bed locking to prevent race conditions & double bookings
    const result = await prisma.$transaction(async (tx) => {
      // Find an available bed (or the requested bedId)
      let targetBedId = data.bedId;

      if (targetBedId) {
        const bed = await tx.bed.findUnique({
          where: { id: targetBedId },
        });

        if (!bed || bed.roomId !== room.id || bed.status !== BedStatus.AVAILABLE) {
          throw new Error("The selected bed is no longer available. Please select another bed.");
        }
      } else {
        const availableBed = await tx.bed.findFirst({
          where: {
            roomId: room.id,
            status: BedStatus.AVAILABLE,
          },
        });

        if (!availableBed) {
          throw new Error("No available beds in this room. Please select a different room type.");
        }
        targetBedId = availableBed.id;
      }

      // Lock bed for 15 minutes while tenant completes UPI Gateway checkout
      const lockExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await tx.bed.update({
        where: { id: targetBedId },
        data: { status: BedStatus.RESERVED },
      });

      const bookingReference = `STAY-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Calculate initial payable: 1 Month Rent or Booking Advance + Security Deposit
      const bookingAdvance = Number(room.monthlyRent);
      const deposit = Number(room.securityDeposit);
      const totalPayableNow = bookingAdvance + deposit;

      const booking = await tx.booking.create({
        data: {
          bookingReference,
          propertyId: room.propertyId,
          roomId: room.id,
          bedId: targetBedId,
          tenantUserId: auth.user.userId,
          checkInDate: new Date(data.checkInDate),
          lockExpiresAt,
          monthlyRent: room.monthlyRent,
          bookingAmount: bookingAdvance,
          securityDeposit: deposit,
          totalPayableNow,
          status: BookingStatus.AWAITING_PAYMENT,
          statusHistory: {
            create: {
              fromStatus: BookingStatus.PENDING,
              toStatus: BookingStatus.AWAITING_PAYMENT,
              changedBy: auth.user.userId,
              remarks: "Booking initiated; awaiting online payment",
            },
          },
        },
        include: {
          property: true,
          room: true,
          bed: true,
        },
      });

      return booking;
    });

    return NextResponse.json({ booking: result }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Booking error:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    // Fulfill Step 13/15: Real-time cleanup of expired 15-minute bed locks
    await releaseExpiredBedHolds();

    let bookings;
    if (auth.user.role === Role.CUSTOMER_TENANT) {
      bookings = await prisma.booking.findMany({
        where: { tenantUserId: auth.user.userId },
        include: {
          property: { include: { address: true } },
          room: true,
          bed: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (auth.user.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      bookings = await prisma.booking.findMany({
        where: owner?.id ? { property: { ownerId: owner.id } } : undefined,
        include: {
          tenantUser: { select: { name: true, email: true, phone: true } },
          property: true,
          room: true,
          bed: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (auth.user.role === Role.PG_STAFF) {
      const staff = await prisma.staffProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      const propertyFilter = staff?.propertyId
        ? { id: staff.propertyId }
        : staff?.ownerId
        ? { ownerId: staff.ownerId }
        : undefined;
      bookings = await prisma.booking.findMany({
        where: propertyFilter ? { property: propertyFilter } : undefined,
        include: {
          tenantUser: { select: { name: true, email: true, phone: true } },
          property: true,
          room: true,
          bed: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      bookings = await prisma.booking.findMany({
        include: {
          tenantUser: { select: { name: true, email: true, phone: true } },
          property: true,
          room: true,
          bed: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return NextResponse.json({ error: "Failed to retrieve bookings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { bookingId, status, remarks } = body;

    if (!bookingId || !status) {
      return NextResponse.json({ error: "Booking ID and status required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true, bed: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Role-based permission enforcement:
    // Tenants can only cancel their own bookings (before move-in)
    if (auth.user.role === Role.CUSTOMER_TENANT) {
      if (booking.tenantUserId !== auth.user.userId) {
        return NextResponse.json({ error: "Forbidden: Not your booking" }, { status: 403 });
      }
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "Tenants may only request booking cancellation" }, { status: 403 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: bookingId },
        data: { status },
      });

      // Update bed status & allocation if confirmed or cancelled
      if (booking.bedId) {
        if (status === "CONFIRMED" || status === "CHECKED_IN") {
          await tx.bed.update({
            where: { id: booking.bedId },
            data: { status: BedStatus.OCCUPIED },
          });

          let tp = await tx.tenantProfile.findUnique({ where: { userId: booking.tenantUserId } });
          if (!tp) {
            tp = await tx.tenantProfile.create({
              data: {
                userId: booking.tenantUserId,
                currentBedId: booking.bedId,
                isKycVerified: true,
              },
            });
          } else {
            await tx.tenantProfile.update({
              where: { id: tp.id },
              data: { currentBedId: booking.bedId },
            });
          }

          const existingAlloc = await tx.tenantAllocation.findFirst({
            where: { bookingId: booking.id },
          });
          if (!existingAlloc) {
            await tx.tenantAllocation.create({
              data: {
                tenantProfileId: tp.id,
                bedId: booking.bedId,
                bookingId: booking.id,
                checkInDate: booking.checkInDate,
                monthlyRent: booking.monthlyRent,
                isActive: true,
              },
            });
          }

          // Step 17: Automatically generate upcoming rent schedule
          const checkIn = new Date(booking.checkInDate);
          const billingMonth = new Date(checkIn.getFullYear(), checkIn.getMonth(), 1);
          const dueDate = new Date(checkIn.getFullYear(), checkIn.getMonth(), 5);

          const existingSchedule = await tx.rentSchedule.findFirst({
            where: {
              tenantProfileId: tp.id,
              billingMonth,
            },
          });

          if (!existingSchedule) {
            await tx.rentSchedule.create({
              data: {
                tenantProfileId: tp.id,
                billingMonth,
                dueDate,
                amount: Number(booking.monthlyRent),
                lateFee: 0,
                totalPayable: Number(booking.monthlyRent),
                status: "UPCOMING",
              },
            });
          }
        } else if (status === "CANCELLED" || status === "REJECTED" || status === "COMPLETED" || status === "NO_SHOW") {
          await tx.bed.update({
            where: { id: booking.bedId },
            data: { status: BedStatus.AVAILABLE },
          });

          await tx.tenantAllocation.updateMany({
            where: { bookingId: booking.id },
            data: { isActive: false, checkOutDate: new Date() },
          });
        }
      }

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: booking.status,
          toStatus: status,
          changedBy: auth.user.name,
          remarks: remarks || `Status updated to ${status}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: "BOOKING_STATUS_CHANGED",
          entityType: "BOOKING",
          entityId: bookingId,
          metadata: JSON.stringify({ from: booking.status, to: status, remarks }),
        },
      });

      return b;
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
