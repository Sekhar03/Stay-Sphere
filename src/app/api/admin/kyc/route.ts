export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, PropertyVerificationStatus } from "@/lib/constants";
import { sendEmail, getAccountApprovalTemplate, getAccountRejectionTemplate } from "@/lib/email/mailer";

// GET /api/admin/kyc?type=OWNER|TENANT|ALL&status=PENDING|VERIFIED|ALL
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "ALL"; // OWNER | TENANT | ALL
    const status = searchParams.get("status") || "ALL"; // PENDING | VERIFIED | ALL

    const isVerifiedFilter =
      status === "PENDING" ? false : status === "VERIFIED" ? true : undefined;

    const result: any = { owners: [], tenants: [] };

    if (type === "ALL" || type === "OWNER") {
      const ownerWhere: any = {};
      if (isVerifiedFilter !== undefined) ownerWhere.isKycVerified = isVerifiedFilter;

      const owners = await prisma.ownerProfile.findMany({
        where: ownerWhere,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
            },
          },
          properties: {
            include: {
              address: true,
              media: {
                orderBy: { sortOrder: "asc" },
              },
              mediaItems: {
                where: { status: "READY", deletedAt: null },
                select: { id: true, url: true, variants: true, blurData: true, isCover: true, sortOrder: true, purpose: true },
                orderBy: { sortOrder: "asc" },
              },
              propertyAmenities: {
                include: {
                  amenity: true,
                },
              },
              rooms: {
                include: {
                  beds: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      result.owners = owners.map((o) => ({
        profileId: o.id,
        profileType: "OWNER",
        userId: o.userId,
        name: o.user.name,
        email: o.user.email,
        phone: o.user.phone,
        isActive: o.user.isActive,
        companyName: o.companyName,
        panNumber: o.panNumber,
        gstNumber: o.gstNumber,
        bankAccountNumber: o.bankAccountNumber,
        bankIfscCode: o.bankIfscCode,
        bankAccountName: o.bankAccountName,
        kycDocUrl: o.kycDocUrl,
        isKycVerified: o.isKycVerified,
        rejectionReason: o.rejectionReason,
        propertyCount: o.properties.length,
        properties: o.properties.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          propertyType: p.propertyType,
          genderPreference: p.genderPreference,
          foodOption: p.foodOption,
          menuItems: (() => {
            try {
              return JSON.parse(p.menuItems || "{}");
            } catch {
              return {};
            }
          })(),
          noticePeriodDays: p.noticePeriodDays,
          gateClosingTime: p.gateClosingTime,
          rules: (() => {
            try {
              return JSON.parse(p.rules);
            } catch {
              return [];
            }
          })(),
          startingRent: p.startingRent,
          securityDeposit: p.securityDeposit,
          maintenanceCharges: p.maintenanceCharges,
          electricityCharges: p.electricityCharges,
          verificationStatus: p.verificationStatus,
          isPublished: p.isPublished,
          address: p.address,
          media: p.media,
          amenities: p.propertyAmenities.map((pa) => ({
            id: pa.amenity.id,
            name: pa.amenity.name,
            code: pa.amenity.code,
            iconName: pa.amenity.iconName,
            category: pa.amenity.category,
          })),
          rooms: p.rooms.map((r) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            floorNumber: r.floorNumber,
            sharingType: r.sharingType,
            monthlyRent: r.monthlyRent,
            securityDeposit: r.securityDeposit,
            hasAttachedBath: r.hasAttachedBath,
            hasBalcony: r.hasBalcony,
            hasAirCondition: r.hasAirCondition,
            bedCount: r.beds.length,
            beds: r.beds.map((b) => ({
              id: b.id,
              bedNumber: b.bedNumber,
              status: b.status,
            })),
          })),
        })),
        joinedAt: o.user.createdAt,
        submittedAt: o.createdAt,
      }));
    }

    if (type === "ALL" || type === "TENANT") {
      const tenantWhere: any = {};
      if (isVerifiedFilter !== undefined) tenantWhere.isKycVerified = isVerifiedFilter;

      const tenants = await prisma.tenantProfile.findMany({
        where: tenantWhere,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
            },
          },
          currentBed: {
            select: {
              bedNumber: true,
              room: {
                select: {
                  roomNumber: true,
                  property: { select: { id: true, name: true } },
                },
              },
            },
          },
          allocations: {
            where: { isActive: true },
            select: {
              id: true,
              bed: {
                select: {
                  bedNumber: true,
                  room: {
                    select: {
                      roomNumber: true,
                      property: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      result.tenants = tenants.map((t) => {
        const activeBed = t.currentBed || t.allocations?.[0]?.bed || null;
        const property = activeBed?.room?.property || null;

        return {
          profileId: t.id,
          profileType: "TENANT",
          userId: t.userId,
          name: t.user.name,
          email: t.user.email,
          phone: t.user.phone,
          isActive: t.user.isActive,
          idProofType: t.idProofType,
          idProofNumber: t.idProofNumber,
          idProofDocumentUrl: t.idProofDocumentUrl,
          kycDocUrl: t.idProofDocumentUrl,
          emergencyContact: t.emergencyContact,
          isKycVerified: t.isKycVerified,
          rejectionReason: t.rejectionReason,
          currentBed: activeBed
            ? `Bed ${activeBed.bedNumber}, Room ${activeBed.room?.roomNumber}`
            : null,
          propertyName: property?.name || null,
          joinedAt: t.user.createdAt,
          submittedAt: t.createdAt,
        };
      });
    }

    const summary = {
      pendingOwners: result.owners.filter((o: any) => !o.isKycVerified).length,
      verifiedOwners: result.owners.filter((o: any) => o.isKycVerified).length,
      pendingTenants: result.tenants.filter((t: any) => !t.isKycVerified).length,
      verifiedTenants: result.tenants.filter((t: any) => t.isKycVerified).length,
    };

    return NextResponse.json({ ...result, summary });
  } catch (error) {
    console.error("Admin KYC fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch KYC list" }, { status: 500 });
  }
}

// PATCH /api/admin/kyc — approve or reject KYC for owner or tenant
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const profileId = body.profileId;
    const profileType = body.profileType || body.type;
    const action = body.action;
    const rejectionReason = body.rejectionReason;

    if (!profileId || !profileType || !action) {
      return NextResponse.json(
        { error: "profileId, profileType (or type) and action are required" },
        { status: 400 }
      );
    }

    if (!["OWNER", "TENANT"].includes(profileType)) {
      return NextResponse.json({ error: "profileType must be OWNER or TENANT" }, { status: 400 });
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "action must be APPROVE or REJECT" }, { status: 400 });
    }

    const isApproved = action === "APPROVE";
    let targetUser: { id: string; email: string; name: string; role: string } | null = null;
    let propertyName: string | undefined = undefined;

    if (profileType === "OWNER") {
      const existing = await prisma.ownerProfile.findUnique({
        where: { id: profileId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          properties: { select: { id: true, name: true, verificationStatus: true } },
        },
      });

      if (!existing) {
        return NextResponse.json({ error: "Owner profile not found" }, { status: 404 });
      }

      targetUser = existing.user;
      propertyName = existing.properties[0]?.name || existing.companyName || undefined;

      // Update owner profile & user status atomically
      await prisma.$transaction(async (tx) => {
        await tx.ownerProfile.update({
          where: { id: profileId },
          data: {
            isKycVerified: isApproved,
            rejectionReason: isApproved ? null : rejectionReason || "Documents require revision",
          },
        });

        // Activate user account on approval, deactivate on reject
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            isActive: isApproved,
          },
        });

        // If approved, also approve any pending properties submitted by this owner
        if (isApproved) {
          await tx.pGProperty.updateMany({
            where: {
              ownerId: profileId,
              verificationStatus: PropertyVerificationStatus.PENDING_VERIFICATION,
            },
            data: {
              verificationStatus: PropertyVerificationStatus.APPROVED,
              isPublished: true,
            },
          });
        } else {
          // If rejected, unpublish properties
          await tx.pGProperty.updateMany({
            where: { ownerId: profileId },
            data: {
              verificationStatus: PropertyVerificationStatus.REJECTED,
              isPublished: false,
              rejectionReason: rejectionReason || "Owner KYC not verified",
            },
          });
        }
      });
    } else {
      const existing = await prisma.tenantProfile.findUnique({
        where: { id: profileId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      if (!existing) {
        return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 });
      }

      targetUser = existing.user;

      await prisma.$transaction(async (tx) => {
        await tx.tenantProfile.update({
          where: { id: profileId },
          data: {
            isKycVerified: isApproved,
            rejectionReason: isApproved ? null : rejectionReason || "Documents require revision",
          },
        });

        await tx.user.update({
          where: { id: existing.userId },
          data: {
            isActive: isApproved,
          },
        });
      });
    }

    // Determine domain / host URL for login button in email
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;
    const loginUrl = `${baseUrl}/login`;

    // Send email with login details upon approval or rejection
    if (targetUser?.email) {
      if (isApproved) {
        const emailHtml = getAccountApprovalTemplate({
          userName: targetUser.name,
          userEmail: targetUser.email,
          role: targetUser.role,
          loginUrl,
          propertyName,
        });

        await sendEmail({
          to: targetUser.email,
          subject: "🎉 Your StaySphere Account has been Approved! Login Details Inside",
          html: emailHtml,
          template: "ACCOUNT_APPROVAL",
        });
      } else {
        const rejectionHtml = getAccountRejectionTemplate({
          userName: targetUser.name,
          userEmail: targetUser.email,
          rejectionReason: rejectionReason || "Documents require revision",
        });

        await sendEmail({
          to: targetUser.email,
          subject: "StaySphere Account Verification Notice",
          html: rejectionHtml,
          template: "ACCOUNT_REJECTION",
        });
      }
    }

    // Create in-app notification for the user
    if (targetUser?.id) {
      await prisma.notification.create({
        data: {
          userId: targetUser.id,
          title: isApproved ? "KYC Verification Approved" : "KYC Verification Requires Action",
          message: isApproved
            ? `Your KYC documents and account have been verified and approved by StaySphere admin. Your login access is fully activated.`
            : `Your KYC verification was not approved. Reason: ${rejectionReason || "Please re-submit your documents."}`,
          isRead: false,
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: `KYC_${action}_${profileType}`,
        entityType: profileType === "OWNER" ? "OWNER_PROFILE" : "TENANT_PROFILE",
        entityId: profileId,
        metadata: JSON.stringify({
          action,
          profileType,
          rejectionReason: rejectionReason || null,
          adminId: auth.user.userId,
          userEmail: targetUser?.email,
          accountActivated: isApproved,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: isApproved
        ? `${profileType} approved successfully! User account activated and login details sent to ${targetUser?.email}.`
        : `${profileType} rejected. Notification sent to ${targetUser?.email}.`,
    });
  } catch (error) {
    console.error("Admin KYC update error:", error);
    return NextResponse.json({ error: "Failed to update KYC status" }, { status: 500 });
  }
}
