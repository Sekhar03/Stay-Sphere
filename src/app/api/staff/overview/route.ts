export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const staff = await prisma.staffProfile.findUnique({
      where: { userId: auth.user.userId },
      include: {
        property: {
          include: {
            address: true,
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
        owner: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff profile not found" }, { status: 404 });
    }

    let property = staff.property;
    if (!property) {
      property = await prisma.pGProperty.findFirst({
        where: staff.ownerId ? { ownerId: staff.ownerId } : undefined,
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

    if (property) {
      totalRooms = property.rooms.length;
      for (const room of property.rooms) {
        for (const bed of room.beds) {
          totalBeds++;
          if (bed.status === "OCCUPIED") occupiedBeds++;
          else if (bed.status === "AVAILABLE") vacantBeds++;
        }
      }
    }

    // Today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCheckIns, todayCheckOuts, activeTickets, announcements] = await Promise.all([
      property
        ? prisma.booking.findMany({
            where: {
              propertyId: property.id,
              status: { in: ["CONFIRMED", "AWAITING_PAYMENT"] },
              checkInDate: { gte: today, lt: tomorrow },
            },
            include: {
              tenantUser: { select: { name: true, phone: true, email: true } },
              room: true,
              bed: true,
            },
          })
        : [],
      property
        ? prisma.booking.findMany({
            where: {
              propertyId: property.id,
              status: "COMPLETED",
              updatedAt: { gte: today, lt: tomorrow },
            },
            include: {
              tenantUser: { select: { name: true, phone: true, email: true } },
              room: true,
            },
          })
        : [],
      property
        ? prisma.maintenanceRequest.findMany({
            where: {
              propertyId: property.id,
              status: { in: ["OPEN", "IN_PROGRESS"] },
            },
            include: {
              user: { select: { name: true, phone: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          })
        : [],
      prisma.announcement.findMany({
        where: {
          ownerId: staff.ownerId,
          OR: [{ propertyId: null }, staff.propertyId ? { propertyId: staff.propertyId } : {}],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      staff: {
        id: staff.id,
        role: staff.staffRole,
        permissions: JSON.parse(staff.permissions || "[]"),
        isActive: staff.isActive,
      },
      property: property
        ? {
            id: property.id,
            name: property.name,
            slug: property.slug,
            address: property.address,
            genderPreference: property.genderPreference,
            noticePeriodDays: property.noticePeriodDays,
            gateClosingTime: property.gateClosingTime,
            startingRent: property.startingRent,
          }
        : null,
      stats: {
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        todayCheckInsCount: todayCheckIns.length,
        todayCheckOutsCount: todayCheckOuts.length,
        activeTicketsCount: activeTickets.length,
      },
      todayCheckIns,
      todayCheckOuts,
      activeTickets,
      announcements,
    });
  } catch (error) {
    console.error("Staff overview error:", error);
    return NextResponse.json({ error: "Failed to fetch staff overview" }, { status: 500 });
  }
}
