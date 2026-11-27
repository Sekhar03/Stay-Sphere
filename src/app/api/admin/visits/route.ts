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

    const visits = await prisma.propertyVisit.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: {
              select: {
                city: true,
                locality: true,
              },
            },
            owner: {
              select: {
                user: {
                  select: {
                    name: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json({ visits });
  } catch (error) {
    console.error("Admin visits fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch property visits" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { visitId, status } = body;
    const allowedStatuses = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];

    if (!visitId || !status) {
      return NextResponse.json({ error: "Visit ID and status are required" }, { status: 400 });
    }
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid visit status" }, { status: 400 });
    }

    const updated = await prisma.propertyVisit.update({
      where: { id: visitId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "PROPERTY_VISIT_UPDATED",
        entityType: "PROPERTY_VISIT",
        entityId: visitId,
        metadata: JSON.stringify({ status }),
      },
    });

    return NextResponse.json({ visit: updated });
  } catch (error) {
    console.error("Admin update visit error:", error);
    return NextResponse.json({ error: "Failed to update visit status" }, { status: 500 });
  }
}
