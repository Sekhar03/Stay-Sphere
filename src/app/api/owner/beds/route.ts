export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    let propertyFilter: any = {};
    if (auth.user.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      if (owner?.id) {
        propertyFilter = { ownerId: owner.id };
      }
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

    let properties = await prisma.pGProperty.findMany({
      where: propertyFilter,
      include: {
        rooms: {
          include: {
            beds: {
              include: {
                currentTenant: {
                  include: {
                    user: { select: { id: true, name: true, phone: true, email: true } },
                  },
                },
                allocations: {
                  where: { isActive: true },
                  take: 1,
                  include: {
                    tenantProfile: {
                      include: {
                        user: { select: { id: true, name: true, phone: true, email: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // If no properties match specific filter, fallback only for Super Admin
    if (properties.length === 0 && auth.user.role === Role.SUPER_ADMIN) {
      properties = await prisma.pGProperty.findMany({
        include: {
          rooms: {
            include: {
              beds: {
                include: {
                  currentTenant: {
                    include: {
                      user: { select: { id: true, name: true, phone: true, email: true } },
                    },
                  },
                  allocations: {
                    where: { isActive: true },
                    take: 1,
                    include: {
                      tenantProfile: {
                        include: {
                          user: { select: { id: true, name: true, phone: true, email: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    const allBeds: any[] = [];
    let occupiedCount = 0;
    let vacantCount = 0;
    let noticeCount = 0;

    for (const prop of properties) {
      for (const room of prop.rooms) {
        for (const bed of room.beds) {
          const activeAlloc = bed.allocations?.[0];
          const tenant = activeAlloc?.tenantProfile?.user || bed.currentTenant?.user;
          const status = bed.status || "AVAILABLE";

          if (status === "OCCUPIED") occupiedCount++;
          else if (status === "NOTICE") noticeCount++;
          else vacantCount++;

          allBeds.push({
            id: bed.id,
            bedNumber: bed.bedNumber,
            code: bed.bedNumber,
            roomNumber: room.roomNumber,
            roomId: room.id,
            propertyName: prop.name,
            propertyId: prop.id,
            monthlyRent: activeAlloc?.monthlyRent || room.monthlyRent,
            securityDeposit: room.securityDeposit || 15000,
            status: status === "OCCUPIED" ? "occupied" : status === "NOTICE" ? "notice" : "vacant",
            rawStatus: status,
            tenantName: tenant?.name || null,
            tenantPhone: tenant?.phone || null,
            tenantEmail: tenant?.email || null,
            allocationId: activeAlloc?.id || null,
            checkInDate: activeAlloc?.checkInDate || null,
            checkOutDate: activeAlloc?.checkOutDate || null,
          });
        }
      }
    }

    return NextResponse.json({
      beds: allBeds,
      stats: {
        total: allBeds.length,
        occupied: occupiedCount,
        vacant: vacantCount,
        notice: noticeCount,
        potentialLoss: vacantCount * 7500,
      },
    });
  } catch (error) {
    console.error("Fetch beds error:", error);
    return NextResponse.json({ error: "Failed to fetch beds matrix" }, { status: 500 });
  }
}
