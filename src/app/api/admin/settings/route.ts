import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET() {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    let settings = await prisma.platformSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: {
          id: "global",
          platformFeePercent: 2.5,
          gstPercentage: 18.0,
          supportEmail: "support@staysphere.in",
          supportPhone: "+91 9876543210",
          enableEmailAlerts: true,
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch platform settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { platformFeePercent, gstPercentage, supportEmail, supportPhone, enableEmailAlerts } = body;
    const errors: string[] = [];

    const updateData: any = {};
    if (platformFeePercent !== undefined) {
      const value = Number(platformFeePercent);
      if (!Number.isFinite(value) || value < 0 || value > 100) errors.push("Platform fee must be between 0 and 100%.");
      else updateData.platformFeePercent = value;
    }
    if (gstPercentage !== undefined) {
      const value = Number(gstPercentage);
      if (!Number.isFinite(value) || value < 0 || value > 100) errors.push("GST must be between 0 and 100%.");
      else updateData.gstPercentage = value;
    }
    if (supportEmail !== undefined) {
      const value = String(supportEmail).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push("Enter a valid support email address.");
      else updateData.supportEmail = value;
    }
    if (supportPhone !== undefined) {
      const value = String(supportPhone).trim();
      if (value.length < 7 || value.length > 24) errors.push("Enter a valid support phone number.");
      else updateData.supportPhone = value;
    }
    if (enableEmailAlerts !== undefined) updateData.enableEmailAlerts = Boolean(enableEmailAlerts);

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    }

    const updated = await prisma.platformSettings.upsert({
      where: { id: "global" },
      update: updateData,
      create: {
        id: "global",
        platformFeePercent: 2.5,
        gstPercentage: 18.0,
        supportEmail: "support@staysphere.in",
        supportPhone: "+91 9876543210",
        enableEmailAlerts: true,
        ...updateData,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "PLATFORM_SETTINGS_UPDATED",
        entityType: "PLATFORM_SETTINGS",
        entityId: "global",
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update platform settings" }, { status: 500 });
  }
}
