import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { staffRole, propertyId, permissions, isActive } = body;

    const staff = await prisma.staffProfile.findUnique({
      where: { id },
      include: { owner: true, user: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (auth.user.role !== Role.SUPER_ADMIN && staff.owner.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: any = {};
    if (staffRole) updateData.staffRole = staffRole;
    if (propertyId !== undefined) updateData.propertyId = propertyId || null;
    if (permissions && Array.isArray(permissions)) updateData.permissions = JSON.stringify(permissions);
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
      // Also update User account active state
      await prisma.user.update({
        where: { id: staff.userId },
        data: { isActive: Boolean(isActive) },
      });
    }

    const updated = await prisma.staffProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        property: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "STAFF_UPDATED",
        entityType: "STAFF_PROFILE",
        entityId: id,
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      staff: {
        ...updated,
        permissions: JSON.parse(updated.permissions || "[]"),
      },
    });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { id } = await params;
    const staff = await prisma.staffProfile.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    if (auth.user.role !== Role.SUPER_ADMIN && staff.owner.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Deleting the user will cascade delete StaffProfile
    await prisma.user.delete({
      where: { id: staff.userId },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "STAFF_DELETED",
        entityType: "STAFF_PROFILE",
        entityId: id,
      },
    });

    return NextResponse.json({ message: "Staff member removed successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}
