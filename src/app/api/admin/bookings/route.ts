export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        tenantUser: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, name: true, slug: true } },
        room: { select: { id: true, roomNumber: true, sharingType: true, monthlyRent: true } },
        bed: { select: { id: true, bedNumber: true } },
        payments: {
          select: { id: true, amount: true, status: true, paymentMethod: true, paymentType: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Admin fetch bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
