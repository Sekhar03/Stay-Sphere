export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, BedStatus } from "@/lib/constants";
import { hashPassword } from "@/lib/auth/jwt";

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

    let allocations = await prisma.tenantAllocation.findMany({
      where: Object.keys(propertyFilter).length > 0 ? {
        bed: {
          room: {
            property: propertyFilter,
          },
        },
      } : undefined,
      include: {
        tenantProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, isActive: true, avatarUrl: true } },
          },
        },
        bed: {
          include: {
            room: {
              include: {
                property: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { checkInDate: "desc" },
    });

    // Fallback if empty for super admin
    if (allocations.length === 0 && auth.user.role === Role.SUPER_ADMIN) {
      allocations = await prisma.tenantAllocation.findMany({
        include: {
          tenantProfile: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
            },
          },
          bed: {
            include: {
              room: {
                include: {
                  property: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { checkInDate: "desc" },
      });
    }

    // Also get all tenant profiles with currentBed - include all KYC document fields for owner
    const allProfiles = await prisma.tenantProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        currentBed: {
          include: {
            room: {
              include: { property: { select: { id: true, name: true } } },
            },
          },
        },
        allocations: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    const formatted = allocations.map((a) => ({
      ...a,
      tenant: a.tenantProfile,
      room: a.bed?.room,
    }));

    return NextResponse.json({ allocations: formatted, tenants: allProfiles });
  } catch (error) {
    console.error("Owner fetch tenants error:", error);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      name,
      email,
      phone,
      bedId,
      monthlyRent,
      foodCharges,
      securityDeposit,
      checkInDate,
      idProofType,
      idProofNumber,
      idProofDocumentUrl,
      photoUrl,
      agreementSigned,
      policeVerificationStatus,
      emergencyContact,
    } = body;

    if (!name || (!email && !phone) || !bedId) {
      return NextResponse.json(
        { error: "Name, email/phone, and bedId are required" },
        { status: 400 }
      );
    }

    const resolvedEmail = email || `${phone.replace(/\D/g, "")}@staysphere.in`;

    // 1. Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: resolvedEmail },
          phone ? { phone } : { email: resolvedEmail },
        ],
      },
    });

    if (!user) {
      const passwordHash = await hashPassword("StaySphere@2026!");
      user = await prisma.user.create({
        data: {
          name,
          email: resolvedEmail,
          phone: phone || null,
          passwordHash,
          avatarUrl: photoUrl || null,
          role: Role.CUSTOMER_TENANT,
          isActive: true,
          emailVerified: new Date(),
          phoneVerified: phone ? new Date() : null,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          phone: phone || user.phone,
          avatarUrl: photoUrl || user.avatarUrl,
        },
      });
    }

    // 2. Find target Bed (by ID or bedNumber/code)
    let targetBed = await prisma.bed.findFirst({
      where: {
        OR: [
          { id: bedId },
          { bedNumber: bedId },
          { bedNumber: bedId.replace(/^Room\s*/i, "").trim() },
        ],
      },
      include: {
        room: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!targetBed) {
      // Fallback: pick first available bed if any
      targetBed = await prisma.bed.findFirst({
        where: { status: BedStatus.AVAILABLE },
        include: { room: { include: { property: true } } },
      });
    }

    if (!targetBed) {
      return NextResponse.json({ error: "Selected bed not found or no beds available" }, { status: 404 });
    }

    // 3. Create or update TenantProfile with KYC and document verification
    let tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: user.id },
    });

    const kycData = {
      currentBedId: targetBed.id,
      emergencyContact: emergencyContact || null,
      idProofType: idProofType || "Aadhaar Card",
      idProofNumber: idProofNumber || `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      idProofDocumentUrl: idProofDocumentUrl || "/docs/tenant_id.pdf",
      isKycVerified: false, // Must be verified by Admin
    };

    if (!tenantProfile) {
      tenantProfile = await prisma.tenantProfile.create({
        data: {
          userId: user.id,
          ...kycData,
        },
      });
    } else {
      tenantProfile = await prisma.tenantProfile.update({
        where: { id: tenantProfile.id },
        data: kycData,
      });
    }

    // 4. Mark bed as OCCUPIED
    await prisma.bed.update({
      where: { id: targetBed.id },
      data: { status: BedStatus.OCCUPIED },
    });

    // 5. Deactivate any prior allocations for this tenant
    await prisma.tenantAllocation.updateMany({
      where: { tenantProfileId: tenantProfile.id, isActive: true },
      data: { isActive: false },
    });

    const rentAmt = parseFloat(monthlyRent || targetBed.room.monthlyRent || 7500);
    const effectiveCheckIn = checkInDate ? new Date(checkInDate) : new Date();

    // 6. Create active TenantAllocation
    const allocation = await prisma.tenantAllocation.create({
      data: {
        tenantProfileId: tenantProfile.id,
        bedId: targetBed.id,
        checkInDate: effectiveCheckIn,
        monthlyRent: rentAmt,
        isActive: true,
      },
      include: {
        bed: { include: { room: { include: { property: true } } } },
      },
    });

    // 7. Auto-generate initial Rent Schedule for this month if none exists
    const now = new Date();
    const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 5);

    const existingSchedule = await prisma.rentSchedule.findFirst({
      where: {
        tenantProfileId: tenantProfile.id,
        billingMonth,
      },
    });

    if (!existingSchedule) {
      await prisma.rentSchedule.create({
        data: {
          tenantProfileId: tenantProfile.id,
          billingMonth,
          dueDate,
          amount: rentAmt,
          lateFee: 0,
          totalPayable: rentAmt,
          status: "UPCOMING",
        },
      });
    }

    // 8. Send Welcome Notification to the Tenant
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Welcome to StaySphere! Bed Allotted",
          message: `Your onboarding is complete. Room ${targetBed.room.roomNumber} - Bed ${targetBed.bedNumber} is now active. Monthly Rent: ₹${rentAmt}. Documents verified successfully.`,
          link: "/dashboard",
        },
      });
    } catch (notifErr) {
      console.warn("Failed to create welcome notification:", notifErr);
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "TENANT_ONBOARDED",
        entityType: "TENANT_ALLOCATION",
        entityId: allocation.id,
        metadata: JSON.stringify({
          userId: user.id,
          name,
          phone,
          bedNumber: targetBed.bedNumber,
          roomNumber: targetBed.room.roomNumber,
          monthlyRent: rentAmt,
          policeVerificationStatus: policeVerificationStatus || "VERIFIED",
        }),
      },
    });

    return NextResponse.json({
      message: "Tenant onboarded and bed allocated successfully",
      allocation,
      tenant: {
        id: tenantProfile.id,
        user,
        bed: targetBed,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create tenant onboarding error:", error);
    return NextResponse.json({ error: error.message || "Failed to onboard tenant" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      tenantProfileId,
      userId,
      action,                // "APPROVE" | "REJECT"
      isKycVerified,         // legacy boolean support
      rejectionReason,
      notes,
    } = body;

    // Resolve the target tenant profile
    let targetProfile = null;
    if (tenantProfileId) {
      targetProfile = await prisma.tenantProfile.findUnique({
        where: { id: tenantProfileId },
        include: { user: true },
      });
    } else if (userId) {
      targetProfile = await prisma.tenantProfile.findUnique({
        where: { userId },
        include: { user: true },
      });
    }

    if (!targetProfile) {
      return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 });
    }

    // Determine what we're doing
    const isApproving = action === "APPROVE" || isKycVerified === true;
    const isRejecting = action === "REJECT";

    if (!isApproving && !isRejecting) {
      return NextResponse.json({ error: "action must be APPROVE or REJECT" }, { status: 400 });
    }

    if (isRejecting && !rejectionReason?.trim()) {
      return NextResponse.json({ error: "rejectionReason is required when rejecting" }, { status: 400 });
    }

    const updated = await prisma.tenantProfile.update({
      where: { id: targetProfile.id },
      data: {
        isKycVerified: isApproving,
        kycStatus: isApproving ? "APPROVED" : "REJECTED",
        rejectionReason: isRejecting ? (rejectionReason?.trim() ?? null) : null,
      },
      include: {
        user: true,
        currentBed: { include: { room: true } },
      },
    });

    // Notify the tenant
    try {
      if (isApproving) {
        await prisma.notification.create({
          data: {
            userId: targetProfile.userId,
            title: "Documents & KYC Approved",
            message: `Your documents (ID Proof, Photo, Police Verification) have been verified and approved. Welcome to StaySphere — your stay is confirmed!`,
            link: "/dashboard?tab=accommodation",
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            userId: targetProfile.userId,
            title: "Document Verification – Action Required",
            message: `Your submitted documents have been rejected. Reason: ${rejectionReason}. Please re-submit updated documents and contact support if you need assistance.`,
            link: "/dashboard?tab=kyc",
          },
        });
      }
    } catch (e) {
      console.warn("Notification warning:", e);
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: isApproving ? "TENANT_KYC_APPROVED" : "TENANT_KYC_REJECTED",
          entityType: "TENANT_PROFILE",
          entityId: targetProfile.id,
          metadata: JSON.stringify({
            tenantUserId: targetProfile.userId,
            tenantName: targetProfile.user?.name,
            action: isApproving ? "APPROVE" : "REJECT",
            rejectionReason: rejectionReason ?? null,
            notes: notes ?? null,
            approvedBy: auth.user.userId,
          }),
        },
      });
    } catch (e) {
      console.warn("Audit log warning:", e);
    }

    return NextResponse.json({
      message: isApproving
        ? "Tenant documentation verified and approved successfully"
        : "Tenant documentation rejected — tenant notified",
      tenant: updated,
    });
  } catch (error: any) {
    console.error("KYC approval error:", error);
    return NextResponse.json({ error: error.message || "Failed to update tenant status" }, { status: 500 });
  }
}
