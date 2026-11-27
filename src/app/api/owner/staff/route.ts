import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, StaffRole, STAFF_ROLE_PERMISSIONS } from "@/lib/constants";
import { hashPassword } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: auth.user.userId },
      include: {
        properties: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner profile not found" }, { status: 404 });
    }

    const staffMembers = await prisma.staffProfile.findMany({
      where: { ownerId: owner.id },
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
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const parsedStaff = staffMembers.map((s) => ({
      ...s,
      permissions: JSON.parse(s.permissions || "[]"),
    }));

    return NextResponse.json({
      staff: parsedStaff,
      properties: owner.properties,
    });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return NextResponse.json({ error: "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, phone, password, staffRole, propertyId, customPermissions } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      );
    }

    // Determine permissions from preset or custom list
    const roleKey = (staffRole as StaffRole) || StaffRole.PROPERTY_MANAGER;
    const permissions =
      customPermissions && Array.isArray(customPermissions) && customPermissions.length > 0
        ? customPermissions
        : STAFF_ROLE_PERMISSIONS[roleKey] || [];

    const passwordHash = await hashPassword(password);

    const newStaffUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          passwordHash,
          role: Role.PG_STAFF,
          isActive: true,
          emailVerified: new Date(),
        },
      });

      const staff = await tx.staffProfile.create({
        data: {
          userId: user.id,
          ownerId: owner.id,
          propertyId: propertyId || null,
          staffRole: roleKey,
          permissions: JSON.stringify(permissions),
          isActive: true,
        },
        include: {
          property: {
            select: { id: true, name: true },
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: auth.user.userId,
          action: "STAFF_CREATED",
          entityType: "STAFF_PROFILE",
          entityId: staff.id,
          metadata: JSON.stringify({ email, staffRole: roleKey, propertyId }),
        },
      });

      return { user, staff };
    });

    return NextResponse.json(
      {
        message: "Staff member created successfully",
        staff: {
          ...newStaffUser.staff,
          permissions,
          user: {
            id: newStaffUser.user.id,
            name: newStaffUser.user.name,
            email: newStaffUser.user.email,
            phone: newStaffUser.user.phone,
            isActive: newStaffUser.user.isActive,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: error.message || "Failed to create staff member" }, { status: 500 });
  }
}
