export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { PaymentStatus, Role } from "@/lib/constants";

type SeriesPoint = {
  date: string;
  revenue: number;
  bookings: number;
  signups: number;
};

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function isoDay(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const parsedDays = Number.parseInt(searchParams.get("days") || "30", 10);
    const days = Math.min(90, Math.max(7, Number.isFinite(parsedDays) ? parsedDays : 30));

    const start = startOfUtcDay(new Date());
    start.setUTCDate(start.getUTCDate() - (days - 1));

    const [payments, bookings, users, properties, ticketGroups, paymentTypeGroups, overdueRent, failedPayments, pendingApprovals, activeAllocations] =
      await Promise.all([
        prisma.payment.findMany({
          where: { status: PaymentStatus.SUCCESS, createdAt: { gte: start } },
          select: { amount: true, createdAt: true, paymentType: true },
        }),
        prisma.booking.findMany({
          where: { createdAt: { gte: start } },
          select: { status: true, createdAt: true },
        }),
        prisma.user.findMany({
          where: { createdAt: { gte: start } },
          select: { role: true, createdAt: true },
        }),
        prisma.pGProperty.findMany({
          select: {
            id: true,
            name: true,
            verificationStatus: true,
            rooms: { select: { beds: { select: { status: true } } } },
            _count: { select: { bookings: true, reviews: true } },
          },
        }),
        prisma.maintenanceRequest.groupBy({ by: ["status"], _count: { id: true } }),
        prisma.payment.groupBy({
          by: ["paymentType"],
          where: { status: PaymentStatus.SUCCESS },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.rentSchedule.aggregate({
          where: { status: { in: ["DUE", "OVERDUE"] } },
          _sum: { totalPayable: true },
          _count: { id: true },
        }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.FAILED },
          _sum: { amount: true },
          _count: { id: true },
        }),
        prisma.pGProperty.count({ where: { verificationStatus: "PENDING_VERIFICATION" } }),
        prisma.tenantAllocation.count({ where: { isActive: true } }),
      ]);

    const seriesMap = new Map<string, SeriesPoint>();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);
      const key = isoDay(date);
      seriesMap.set(key, { date: key, revenue: 0, bookings: 0, signups: 0 });
    }

    for (const payment of payments) {
      const point = seriesMap.get(isoDay(payment.createdAt));
      if (point) point.revenue += Number(payment.amount || 0);
    }
    for (const booking of bookings) {
      const point = seriesMap.get(isoDay(booking.createdAt));
      if (point) point.bookings += 1;
    }
    for (const user of users) {
      const point = seriesMap.get(isoDay(user.createdAt));
      if (point) point.signups += 1;
    }

    const series = Array.from(seriesMap.values());
    const revenueTotal = series.reduce((sum, point) => sum + point.revenue, 0);
    const bookingsTotal = series.reduce((sum, point) => sum + point.bookings, 0);
    const signupsTotal = series.reduce((sum, point) => sum + point.signups, 0);

    const bookingStatusCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    const revenueByType = paymentTypeGroups
      .map((group) => ({
        type: group.paymentType,
        revenue: Number(group._sum.amount || 0),
        count: group._count.id,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const ticketCounts = ticketGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count.id;
      return acc;
    }, {});

    const occupancyByProperty = properties
      .map((property) => {
        const beds = property.rooms.flatMap((room) => room.beds);
        const occupied = beds.filter((bed) => bed.status === "OCCUPIED").length;
        const reserved = beds.filter((bed) => bed.status === "RESERVED").length;
        return {
          id: property.id,
          name: property.name,
          status: property.verificationStatus,
          totalBeds: beds.length,
          occupiedBeds: occupied,
          reservedBeds: reserved,
          occupancyRate: beds.length ? Math.round((occupied / beds.length) * 100) : 0,
          bookings: property._count.bookings,
          reviews: property._count.reviews,
        };
      })
      .sort((a, b) => b.occupancyRate - a.occupancyRate || b.bookings - a.bookings);

    return NextResponse.json({
      range: { days, start: start.toISOString() },
      series,
      totals: {
        revenue: revenueTotal,
        bookings: bookingsTotal,
        signups: signupsTotal,
        newTenants: users.filter((user) => user.role === Role.CUSTOMER_TENANT).length,
        activeTenants: activeAllocations,
        overdueRentAmount: Number(overdueRent._sum.totalPayable || 0),
        overdueRentCount: overdueRent._count.id,
        failedPaymentAmount: Number(failedPayments._sum.amount || 0),
        failedPaymentCount: failedPayments._count.id,
        pendingApprovals,
      },
      bookingStatusCounts,
      ticketCounts,
      revenueByType,
      occupancyByProperty,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch admin analytics" }, { status: 500 });
  }
}
