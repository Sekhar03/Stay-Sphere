import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const {
      companyName,
      panNumber,
      gstNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountName,
      kycDocUrl,
    } = body;

    const owner = await prisma.ownerProfile.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner profile not found" }, { status: 404 });
    }

    const updated = await prisma.ownerProfile.update({
      where: { id: owner.id },
      data: {
        companyName,
        panNumber,
        gstNumber,
        bankAccountNumber,
        bankIfscCode,
        bankAccountName,
        kycDocUrl: kycDocUrl || undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "OWNER_SETTINGS_UPDATED",
        entityType: "OWNER_PROFILE",
        entityId: owner.id,
      },
    });

    return NextResponse.json({ owner: updated });
  } catch (error) {
    console.error("Owner settings error:", error);
    return NextResponse.json({ error: "Failed to update owner settings" }, { status: 500 });
  }
}
