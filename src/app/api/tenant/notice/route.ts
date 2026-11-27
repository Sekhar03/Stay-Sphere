export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, BedStatus } from "@/lib/constants";

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
                property: true,
              },
            },
          },
        },
        allocations: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    let currentBed = tenantProfile?.currentBed;
    const allocation = tenantProfile?.allocations?.[0];

    if (!currentBed && allocation?.bedId) {
      currentBed = await prisma.bed.findUnique({
        where: { id: allocation.bedId },
        include: { room: { include: { property: true } } },
      }) as any;
    }

    if (!tenantProfile || !currentBed) {
      return NextResponse.json({ activeNotice: false });
    }

    const isNoticeActive = currentBed.status === "NOTICE" || Boolean(allocation?.checkOutDate);

    return NextResponse.json({
      activeNotice: isNoticeActive,
      bed: currentBed,
      allocation,
      noticePeriodDays: currentBed.room?.property?.noticePeriodDays || 30,
      checkOutDate: allocation?.checkOutDate || null,
    });
  } catch (error) {
    console.error("Fetch notice status error:", error);
    return NextResponse.json({ error: "Failed to fetch notice status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.CUSTOMER_TENANT]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { vacatingDate, reason, refundUpiOrBank, notes } = body;

    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: auth.user.userId },
      include: {
        user: { select: { name: true, phone: true, email: true } },
        currentBed: {
          include: {
            room: {
              include: {
                property: {
                  include: {
                    owner: true,
                  },
                },
              },
            },
          },
        },
        allocations: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    let currentBed = tenantProfile?.currentBed;
    const allocation = tenantProfile?.allocations?.[0];

    if (!currentBed && allocation?.bedId) {
      currentBed = await prisma.bed.findUnique({
        where: { id: allocation.bedId },
        include: { room: { include: { property: { include: { owner: true } } } } },
      }) as any;
    }

    if (!tenantProfile || !currentBed) {
      return NextResponse.json({ error: "No active PG stay found to serve notice for" }, { status: 400 });
    }

    const property = currentBed.room.property;
    const noticeDays = property?.noticePeriodDays || 30;

    let checkoutDateTime: Date;
    if (vacatingDate) {
      checkoutDateTime = new Date(vacatingDate);
    } else {
      checkoutDateTime = new Date();
      checkoutDateTime.setDate(checkoutDateTime.getDate() + noticeDays);
    }

    // 1. Update Bed status to NOTICE
    await prisma.bed.update({
      where: { id: currentBed.id },
      data: { status: BedStatus.NOTICE },
    });

    // 2. Update active allocation checkout date
    let updatedAlloc = null;
    if (allocation) {
      updatedAlloc = await prisma.tenantAllocation.update({
        where: { id: allocation.id },
        data: {
          checkOutDate: checkoutDateTime,
        },
      });
    }

    // 3. Notify Owner
    try {
      if (property.owner?.userId) {
        await prisma.notification.create({
          data: {
            userId: property.owner.userId,
            title: `Notice Served: Room ${currentBed.room.roomNumber} (${currentBed.bedNumber})`,
            message: `${tenantProfile.user.name} has served a ${noticeDays}-day notice. Expected Vacating Date: ${checkoutDateTime.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Reason: ${reason || "Relocating"}. Refund UPI/Bank: ${refundUpiOrBank || "Not specified"}.`,
            link: "/owner/dashboard?tab=rooms",
          },
        });
      }

      // 4. Notify Property Staff
      const staffList = await prisma.staffProfile.findMany({
        where: {
          OR: [{ propertyId: property.id }, { ownerId: property.ownerId }],
          isActive: true,
        },
      });

      for (const sp of staffList) {
        await prisma.notification.create({
          data: {
            userId: sp.userId,
            title: `Notice Period: Room ${currentBed.room.roomNumber}`,
            message: `${tenantProfile.user.name} vacating on ${checkoutDateTime.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}. Reason: ${reason || "Relocating"}.`,
            link: "/staff/dashboard?tab=tenants",
          },
        });
      }

      // 5. Notify Tenant Confirmation
      await prisma.notification.create({
        data: {
          userId: auth.user.userId,
          title: "Notice Period Active",
          message: `Your ${noticeDays}-day notice period is now active. Expected vacating date: ${checkoutDateTime.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}. Room inspection & deposit settlement will be done at checkout.`,
          link: "/dashboard?tab=accommodation",
        },
      });
    } catch (notifErr) {
      console.warn("Notice notifications warning:", notifErr);
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "TENANT_NOTICE_SERVED",
        entityType: "BED",
        entityId: currentBed.id,
        metadata: JSON.stringify({
          checkOutDate: checkoutDateTime,
          reason,
          refundUpiOrBank,
          notes,
        }),
      },
    });

    return NextResponse.json({
      message: "Notice period served successfully",
      checkOutDate: checkoutDateTime,
      bed: { ...currentBed, status: BedStatus.NOTICE },
      allocation: updatedAlloc,
    });
  } catch (error: any) {
    console.error("Serve notice error:", error);
    return NextResponse.json({ error: error.message || "Failed to serve notice" }, { status: 500 });
  }
}
