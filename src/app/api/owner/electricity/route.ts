export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

// GET /api/owner/electricity - Get all rooms with current active tenants for meter reading
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

    const properties = await prisma.pGProperty.findMany({
      where: propertyFilter,
      select: {
        id: true,
        name: true,
        address: {
          select: {
            city: true,
          },
        },
        rooms: {
          where: { isActive: true },
          select: {
            id: true,
            roomNumber: true,
            floorNumber: true,
            sharingType: true,
            beds: {
              select: {
                id: true,
                bedNumber: true,
                status: true,
                allocations: {
                  where: { isActive: true },
                  take: 1,
                  select: {
                    id: true,
                    tenantProfileId: true,
                    tenantProfile: {
                      select: {
                        id: true,
                        user: { select: { id: true, name: true, phone: true, email: true } },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { roomNumber: "asc" },
        },
      },
    });

    const formattedRooms = properties.flatMap((p: any) =>
      p.rooms.map((r: any) => {
        const activeOccupants = r.beds
          .map((b: any) => {
            const alloc = b.allocations[0];
            if (!alloc) return null;
            return {
              allocationId: alloc.id,
              tenantProfileId: alloc.tenantProfileId,
              userId: alloc.tenantProfile?.user?.id,
              name: alloc.tenantProfile?.user?.name,
              phone: alloc.tenantProfile?.user?.phone,
              bedNumber: b.bedNumber,
            };
          })
          .filter(Boolean);

        return {
          propertyId: p.id,
          propertyName: p.name,
          city: p.address?.city || "Bangalore",
          roomId: r.id,
          roomNumber: r.roomNumber,
          floor: r.floorNumber,
          sharingType: r.sharingType,
          totalBeds: r.beds.length,
          occupiedBeds: activeOccupants.length,
          occupants: activeOccupants,
        };
      })
    );

    return NextResponse.json({ rooms: formattedRooms });
  } catch (error) {
    console.error("Fetch rooms for electricity error:", error);
    return NextResponse.json({ error: "Failed to fetch room meter data" }, { status: 500 });
  }
}

// POST /api/owner/electricity - Split meter bill across room occupants and update rent schedules
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      roomId,
      previousReading,
      currentReading,
      ratePerUnit = 10,
      billingMonth, // e.g. "2026-11-01"
      notes,
    } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const prev = Number(previousReading) || 0;
    const curr = Number(currentReading) || 0;

    if (curr < prev) {
      return NextResponse.json(
        { error: "Current reading cannot be lower than previous reading" },
        { status: 400 }
      );
    }

    const netUnits = curr - prev;
    const rate = Number(ratePerUnit) || 10;
    const totalRoomBill = Math.round(netUnits * rate);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        property: { select: { id: true, name: true, ownerId: true } },
        beds: {
          include: {
            allocations: {
              where: { isActive: true },
              take: 1,
              include: {
                tenantProfile: {
                  include: { user: { select: { id: true, name: true, phone: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Collect all active tenants in this room
    const activeTenants = room.beds
      .flatMap((b) => b.allocations)
      .filter((a) => a.isActive && a.tenantProfile)
      .map((a) => ({
        tenantProfileId: a.tenantProfileId,
        userId: a.tenantProfile.user.id,
        name: a.tenantProfile.user.name,
        phone: a.tenantProfile.user.phone,
        bedId: a.bedId,
      }));

    if (activeTenants.length === 0) {
      return NextResponse.json(
        {
          error: "No active tenants currently occupy this room to split the electricity bill.",
          totalBill: totalRoomBill,
          netUnits,
        },
        { status: 400 }
      );
    }

    const perTenantShare = Math.round(totalRoomBill / activeTenants.length);
    const billingDate = billingMonth ? new Date(billingMonth) : new Date();
    // Normalize to first of month
    const startOfMonth = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1);
    const dueDate = new Date(billingDate.getFullYear(), billingDate.getMonth(), 5);

    // Apply charges in a database transaction
    const settledTenants = await prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const tenant of activeTenants) {
        // Find or create RentSchedule for this month
        let schedule = await tx.rentSchedule.findFirst({
          where: {
            tenantProfileId: tenant.tenantProfileId,
            billingMonth: startOfMonth,
          },
        });

        if (schedule) {
          // Add electricity charge to existing schedule
          schedule = await tx.rentSchedule.update({
            where: { id: schedule.id },
            data: {
              amount: schedule.amount + perTenantShare,
              totalPayable: schedule.totalPayable + perTenantShare,
            },
          });
        } else {
          // Create new schedule if none exists
          schedule = await tx.rentSchedule.create({
            data: {
              tenantProfileId: tenant.tenantProfileId,
              billingMonth: startOfMonth,
              dueDate: dueDate,
              amount: perTenantShare,
              totalPayable: perTenantShare,
              status: "DUE",
            },
          });
        }

        // Send In-App notification to tenant
        try {
          await tx.notification.create({
            data: {
              userId: tenant.userId,
              title: `Electricity Bill Calculated: Room ${room.roomNumber}`,
              message: `Sub-meter reading: ${netUnits} units @ ₹${rate}/unit = ₹${totalRoomBill}. Split across ${activeTenants.length} occupants: Your share is ₹${perTenantShare}. Added to your ${startOfMonth.toLocaleString("en-IN", { month: "short", year: "numeric" })} bill.`,
              link: "/dashboard",
            },
          });
        } catch (e) {
          console.warn("Notification create warning:", e);
        }

        results.push({
          tenantName: tenant.name,
          phone: tenant.phone,
          shareAmount: perTenantShare,
          scheduleId: schedule.id,
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: "SUB_METER_BILL_SPLIT",
          entityType: "ROOM",
          entityId: room.id,
          metadata: JSON.stringify({
            roomNumber: room.roomNumber,
            propertyName: room.property.name,
            previousReading: prev,
            currentReading: curr,
            netUnits,
            ratePerUnit: rate,
            totalRoomBill,
            occupantsCount: activeTenants.length,
            perTenantShare,
            notes,
          }),
        },
      });

      return results;
    });

    return NextResponse.json({
      message: `Electricity bill of ₹${totalRoomBill} successfully split among ${activeTenants.length} occupants!`,
      roomNumber: room.roomNumber,
      netUnits,
      ratePerUnit: rate,
      totalRoomBill,
      perTenantShare,
      tenants: settledTenants,
    });
  } catch (error: any) {
    console.error("Sub-meter bill split error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate electricity bill split" },
      { status: 500 }
    );
  }
}
