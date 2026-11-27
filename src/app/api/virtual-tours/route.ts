import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { createVirtualTourSchema } from "@/lib/validators";
import { Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const data = createVirtualTourSchema.parse(body);

    const property = await prisma.pGProperty.findUnique({
      where: { id: data.propertyId },
      include: { owner: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (auth.user.role !== Role.SUPER_ADMIN && property.owner.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Unauthorized for this property" }, { status: 403 });
    }

    const tour = await prisma.virtualTour.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        title: data.title,
        assetType: data.assetType,
        assetUrl: data.assetUrl,
        hotspotsJson: data.hotspotsJson || [],
      },
    });

    return NextResponse.json({ tour }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create virtual tour error:", error);
    return NextResponse.json({ error: "Failed to upload virtual tour asset" }, { status: 500 });
  }
}
