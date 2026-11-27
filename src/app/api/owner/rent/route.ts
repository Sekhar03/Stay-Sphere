export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, RentScheduleStatus, PaymentStatus, PaymentMethod, PaymentType } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    let propertyFilter: any = {};

    if (auth.user.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      if (owner?.id) propertyFilter = { ownerId: owner.id };
    } else if (auth.user.role === Role.PG_STAFF) {
      const staff = await prisma.staffProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      if (staff?.propertyId) {
        propertyFilter = { id: staff.propertyId };
      } else if (staff?.ownerId) {
        propertyFilter = { ownerId: staff.ownerId };
      }
    }

    let schedules = await prisma.rentSchedule.findMany({
      where: Object.keys(propertyFilter).length > 0 ? {
        tenantProfile: {
          OR: [
            { currentBed: { room: { property: propertyFilter } } },
            { allocations: { some: { bed: { room: { property: propertyFilter } } } } },
          ],
        },
      } : undefined,
      include: {
        tenantProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
            currentBed: {
              include: {
                room: {
                  include: {
                    property: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        invoices: {
          include: { payments: true },
        },
      },
      orderBy: { dueDate: "desc" },
    });

    if (schedules.length === 0 && auth.user.role === Role.SUPER_ADMIN) {
      schedules = await prisma.rentSchedule.findMany({
        include: {
          tenantProfile: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
              currentBed: {
                include: {
                  room: {
                    include: {
                      property: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
          invoices: {
            include: { payments: true },
          },
        },
        orderBy: { dueDate: "desc" },
      });
    }

    const formattedSchedules = schedules.map((rs) => {
      const bDate = new Date(rs.billingMonth);
      return {
        ...rs,
        month: bDate.getMonth() + 1,
        year: bDate.getFullYear(),
        tenant: rs.tenantProfile,
      };
    });

    return NextResponse.json({ rentSchedules: formattedSchedules });
  } catch (error) {
    console.error("Owner fetch rent error:", error);
    return NextResponse.json({ error: "Failed to fetch rent records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { rentScheduleId, amount, paymentMethod, referenceNumber, notes } = body;

    if (!rentScheduleId || !amount) {
      return NextResponse.json({ error: "Rent Schedule ID and amount are required" }, { status: 400 });
    }

    const schedule = await prisma.rentSchedule.findUnique({
      where: { id: rentScheduleId },
      include: { tenantProfile: { include: { user: true } } },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Rent schedule not found" }, { status: 404 });
    }

    const bDate = new Date(schedule.billingMonth);
    const month = bDate.getMonth() + 1;
    const year = bDate.getFullYear();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark schedule as PAID
      const updatedSchedule = await tx.rentSchedule.update({
        where: { id: rentScheduleId },
        data: {
          status: RentScheduleStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 2. Create invoice if not exists
      const invoiceNumber = `INV-${year}${String(month).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          tenantProfileId: schedule.tenantProfileId,
          rentScheduleId: schedule.id,
          amount: parseFloat(amount),
          totalAmount: parseFloat(amount),
          isPaid: true,
        },
      });

      // 3. Create payment record
      const receiptNumber = referenceNumber || `REC-${Date.now()}`;
      const payment = await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: parseFloat(amount),
          paymentType: PaymentType.MONTHLY_RENT,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          status: PaymentStatus.SUCCESS,
          receiptNumber,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: "MANUAL_RENT_COLLECTION",
          entityType: "RENT_SCHEDULE",
          entityId: rentScheduleId,
          metadata: JSON.stringify({ amount, paymentMethod, receiptNumber, notes }),
        },
      });

      return { updatedSchedule, payment, invoice };
    });

    return NextResponse.json({
      message: "Payment recorded successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Record manual payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
