import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, PropertyVerificationStatus, PaymentStatus } from "@/lib/constants";

export async function GET() {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const [
      totalUsers,
      totalOwners,
      totalProperties,
      pendingApprovals,
      totalVisits,
      totalBookings,
      totalActiveTenants,
      totalBeds,
      occupiedBeds,
      openTickets,
      paymentsSummary,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.CUSTOMER_TENANT } }),
      prisma.user.count({ where: { role: Role.PG_OWNER } }),
      prisma.pGProperty.count(),
      prisma.pGProperty.count({ where: { verificationStatus: PropertyVerificationStatus.PENDING_VERIFICATION } }),
      prisma.propertyVisit.count(),
      prisma.booking.count(),
      prisma.tenantAllocation.count({ where: { isActive: true } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "OCCUPIED" } }),
      prisma.maintenanceRequest.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return NextResponse.json({
      analytics: {
        totalUsers,
        totalOwners,
        totalProperties,
        pendingApprovals,
        totalVisits,
        totalBookings,
        totalActiveTenants,
        totalBeds,
        occupiedBeds,
        occupancyRate,
        openTickets,
        totalTransactions: paymentsSummary._count.id || 0,
        totalRevenue: Number(paymentsSummary._sum.amount || 0),
      },
      recentAuditLogs,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch platform analytics" }, { status: 500 });
  }
}
