export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const payments = await prisma.payment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            property: { select: { name: true } },
            tenantUser: { select: { name: true, email: true, phone: true } },
          },
        },
        invoice: {
          include: {
            tenantProfile: {
              include: {
                user: { select: { name: true, email: true, phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formattedPayments = payments.map((p) => ({
      ...p,
      user: p.booking?.tenantUser || p.invoice?.tenantProfile?.user || null,
    }));

    const rentSchedules = await prisma.rentSchedule.findMany({
      include: {
        tenantProfile: {
          include: {
            user: { select: { name: true, email: true } },
            currentBed: {
              include: {
                room: { include: { property: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { dueDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ payments: formattedPayments, rentSchedules });
  } catch (error) {
    console.error("Admin fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
