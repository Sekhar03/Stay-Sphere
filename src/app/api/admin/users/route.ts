export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";
import { sendEmail, getAccountApprovalTemplate } from "@/lib/email/mailer";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const where: any = {};
    if (role && role !== "ALL") {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        ownerProfile: {
          select: { id: true, companyName: true, isKycVerified: true },
        },
        staffProfile: {
          select: {
            id: true,
            staffRole: true,
            property: { select: { id: true, name: true } },
          },
        },
        tenantProfile: {
          select: {
            id: true,
            isKycVerified: true,
            currentBed: {
              select: {
                bedNumber: true,
                room: { select: { roomNumber: true, property: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { userId, isActive, role, isKycVerified } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (role) updateData.role = role;

    if (isKycVerified !== undefined) {
      await prisma.ownerProfile.updateMany({
        where: { userId },
        data: { isKycVerified: Boolean(isKycVerified) },
      });
      await prisma.tenantProfile.updateMany({
        where: { userId },
        data: { isKycVerified: Boolean(isKycVerified) },
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If account was activated, send login details email
    if (isActive === true || isKycVerified === true) {
      try {
        const protocol = req.headers.get("x-forwarded-proto") || "http";
        const host = req.headers.get("host") || "localhost:3000";
        const loginUrl = `${protocol}://${host}/login`;

        const emailHtml = getAccountApprovalTemplate({
          userName: updated.name,
          userEmail: updated.email,
          role: updated.role,
          loginUrl,
        });

        await sendEmail({
          to: updated.email,
          subject: "🎉 Your StaySphere Account has been Approved! Login Details Inside",
          html: emailHtml,
          template: "ACCOUNT_APPROVAL",
        });
      } catch (emailErr) {
        console.warn("Could not dispatch approval email from admin users tab:", emailErr);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "ADMIN_USER_UPDATED",
        entityType: "USER",
        entityId: userId,
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
