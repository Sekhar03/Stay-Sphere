import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role, PropertyVerificationStatus } from "@/lib/constants";
import { invalidateCachePrefix } from "@/lib/cache/redisCache";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body; // action: "APPROVE" or "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "REJECT" && (!rejectionReason || !String(rejectionReason).trim())) {
      return NextResponse.json(
        { error: "A rejection reason is required so the owner can fix the listing." },
        { status: 400 }
      );
    }

    const property = await prisma.pGProperty.findUnique({ where: { id }, select: { id: true } });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const updated = await prisma.pGProperty.update({
      where: { id },
      data: {
        verificationStatus:
          action === "APPROVE"
            ? PropertyVerificationStatus.APPROVED
            : PropertyVerificationStatus.REJECTED,
        isPublished: action === "APPROVE",
        rejectionReason: action === "REJECT" ? String(rejectionReason).trim() : null,
      },
    });

    await invalidateCachePrefix("properties:list:");

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: action === "APPROVE" ? "PROPERTY_APPROVED" : "PROPERTY_REJECTED",
        entityType: "PGProperty",
        entityId: id,
        metadata: JSON.stringify({ rejectionReason }),
      },
    });

    return NextResponse.json({ property: updated });
  } catch (error) {
    console.error("Property verification error:", error);
    return NextResponse.json({ error: "Failed to update property status" }, { status: 500 });
  }
}
