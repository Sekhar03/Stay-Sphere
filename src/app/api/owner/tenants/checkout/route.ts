import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, BedStatus } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      bedId,
      allocationId,
      depositAmount = 15000,
      deductions = 0,
      deductionReason = "None",
      refundAmount,
      paymentMethod = "UPI",
      settlementNotes,
    } = body;

    if (!bedId && !allocationId) {
      return NextResponse.json({ error: "Bed ID or Allocation ID required" }, { status: 400 });
    }

    // 1. Find bed
    let targetBed: any = null;
    let alloc: any = null;

    if (bedId) {
      targetBed = await prisma.bed.findFirst({
        where: {
          OR: [
            { id: bedId },
            { bedNumber: bedId },
            { bedNumber: bedId.replace(/^Room\s*/i, "").trim() },
          ],
        },
        include: {
          room: true,
          allocations: {
            where: { isActive: true },
            take: 1,
            include: {
              tenantProfile: {
                include: { user: true },
              },
            },
          },
        },
      });
      alloc = targetBed?.allocations?.[0];
    }

    if (!alloc && allocationId) {
      alloc = await prisma.tenantAllocation.findUnique({
        where: { id: allocationId },
        include: {
          bed: { include: { room: true } },
          tenantProfile: { include: { user: true } },
        },
      });
      if (alloc) targetBed = alloc.bed;
    }

    if (!targetBed) {
      return NextResponse.json({ error: "Bed or active allocation not found" }, { status: 404 });
    }

    const tenantUser = alloc?.tenantProfile?.user;
    const finalRefund = refundAmount !== undefined ? parseFloat(refundAmount) : Math.max(0, parseFloat(depositAmount) - parseFloat(deductions));

    // 2. Free the Bed: set status to AVAILABLE
    await prisma.bed.update({
      where: { id: targetBed.id },
      data: { status: BedStatus.AVAILABLE },
    });

    // 3. Mark Allocation as inactive
    if (alloc) {
      await prisma.tenantAllocation.update({
        where: { id: alloc.id },
        data: {
          isActive: false,
          checkOutDate: new Date(),
        },
      });
    }

    // 4. Detach bed from tenant profile
    if (alloc?.tenantProfileId) {
      await prisma.tenantProfile.update({
        where: { id: alloc.tenantProfileId },
        data: { currentBedId: null },
      });
    }
    // Safeguard: Ensure no profile has this bed as currentBedId
    await prisma.tenantProfile.updateMany({
      where: { currentBedId: targetBed.id },
      data: { currentBedId: null },
    });

    // 5. Notify the departing tenant
    if (tenantUser?.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: tenantUser.id,
            title: "Checkout & Deposit Refund Complete",
            message: `Your checkout is complete. Deposit refund of ₹${finalRefund} (${paymentMethod}) has been processed.${deductions > 0 ? ` Deductions: ₹${deductions} (${deductionReason}).` : ""} Thank you for staying with StaySphere!`,
            link: "/dashboard",
          },
        });
      } catch (e) {
        console.warn("Checkout notification warning:", e);
      }
    }

    // 6. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "TENANT_CHECKOUT_SETTLED",
        entityType: "BED",
        entityId: targetBed.id,
        metadata: JSON.stringify({
          bedNumber: targetBed.bedNumber,
          tenantName: tenantUser?.name,
          depositAmount,
          deductions,
          deductionReason,
          finalRefund,
          paymentMethod,
          settlementNotes,
        }),
      },
    });

    return NextResponse.json({
      message: "Checkout processed and bed is now AVAILABLE",
      bedNumber: targetBed.bedNumber,
      status: BedStatus.AVAILABLE,
      refundSettled: finalRefund,
    });
  } catch (error: any) {
    console.error("Checkout settlement error:", error);
    return NextResponse.json({ error: error.message || "Failed to process checkout" }, { status: 500 });
  }
}
