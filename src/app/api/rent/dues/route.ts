import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET() {
  try {
    const auth = await requireAuth([Role.CUSTOMER_TENANT]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: auth.user.userId },
      include: {
        currentBed: {
          include: {
            room: {
              include: {
                property: {
                  include: { address: true },
                },
              },
            },
          },
        },
        rentSchedules: {
          orderBy: { dueDate: "desc" },
          include: {
            invoices: {
              include: { payments: true },
            },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { payments: true },
        },
        allocations: {
          where: { isActive: true },
          take: 1,
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    property: {
                      include: { address: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tenantProfile) {
      return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 });
    }

    return NextResponse.json({ tenantProfile });
  } catch (error) {
    console.error("Fetch rent dues error:", error);
    return NextResponse.json({ error: "Failed to fetch rent details" }, { status: 500 });
  }
}
