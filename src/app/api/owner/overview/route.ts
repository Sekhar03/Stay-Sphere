export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    let owner = await prisma.ownerProfile.findUnique({
      where: { userId: auth.user.userId },
      include: {
        properties: {
          include: {
            address: true,
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
      },
    });

    if (!owner && auth.user.role === Role.SUPER_ADMIN) {
      owner = await prisma.ownerProfile.findFirst({
        include: {
          properties: {
            include: {
              address: true,
              rooms: {
                include: {
                  beds: true,
                },
              },
            },
          },
        },
      });
    }

    if (!owner) {
      return NextResponse.json({ error: "Owner profile not found" }, { status: 404 });
    }

    let properties = owner.properties;
    if (properties.length === 0 && auth.user.role === Role.SUPER_ADMIN) {
      properties = await prisma.pGProperty.findMany({
        include: {
          address: true,
          rooms: {
            include: { beds: true },
          },
        },
      });
    }

    let totalRooms = 0;
    let totalBeds = 0;
    let occupiedBeds = 0;
    let vacantBeds = 0;

    properties.forEach((p) => {
      totalRooms += p.rooms.length;
      p.rooms.forEach((r) => {
        r.beds.forEach((b) => {
          totalBeds++;
          if (b.status === "OCCUPIED") occupiedBeds++;
          else if (b.status === "AVAILABLE") vacantBeds++;
        });
      });
    });

    const propertyIds = properties.map((p) => p.id);

    const [bookings, activeAllocations, rentSchedules, staffCount] = await Promise.all([
      prisma.booking.findMany({
        where: { propertyId: { in: propertyIds } },
        include: {
          tenantUser: { select: { name: true, email: true, phone: true } },
          property: { select: { name: true } },
          room: true,
          bed: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.tenantAllocation.count({
        where: {
          bed: { room: { propertyId: { in: propertyIds } } },
          isActive: true,
        },
      }),
      prisma.rentSchedule.findMany({
        where: {
          tenantProfile: {
            currentBed: { room: { propertyId: { in: propertyIds } } },
          },
        },
      }),
      prisma.staffProfile.count({
        where: { ownerId: owner.id },
      }),
    ]);

    let totalMonthlyRentCollected = 0;
    let totalPendingRent = 0;

    rentSchedules.forEach((rs) => {
      if (rs.status === "PAID") {
        totalMonthlyRentCollected += rs.amount;
      } else {
        totalPendingRent += rs.amount;
      }
    });

    return NextResponse.json({
      owner: {
        id: owner.id,
        companyName: owner.companyName,
        isKycVerified: owner.isKycVerified,
        panNumber: owner.panNumber,
        gstNumber: owner.gstNumber,
        bankAccountNumber: owner.bankAccountNumber,
        bankIfscCode: owner.bankIfscCode,
        bankAccountName: owner.bankAccountName,
      },
      stats: {
        totalProperties: properties.length,
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        totalTenants: activeAllocations,
        totalMonthlyRentCollected,
        totalPendingRent,
        staffCount,
      },
      properties,
      recentBookings: bookings,
    });
  } catch (error) {
    console.error("Owner overview error:", error);
    return NextResponse.json({ error: "Failed to fetch owner overview" }, { status: 500 });
  }
}
