export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { createRoomSchema } from "@/lib/validators";
import { Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const data = createRoomSchema.parse(body);

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

    // Create room and generate beds in an atomic transaction
    const newRoom = await prisma.$transaction(async (tx) => {
      const room = await tx.room.create({
        data: {
          propertyId: data.propertyId,
          roomNumber: data.roomNumber,
          floorNumber: data.floorNumber,
          sharingType: data.sharingType,
          monthlyRent: data.monthlyRent,
          securityDeposit: data.securityDeposit,
          hasAttachedBath: data.hasAttachedBath,
          hasBalcony: data.hasBalcony,
          hasAirCondition: data.hasAirCondition,
        },
      });

      // Generate bed labels: Bed-1, Bed-2, or Bed-A, Bed-B...
      const bedLetters = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const bedData = Array.from({ length: data.bedCount }).map((_, index) => ({
        roomId: room.id,
        bedNumber: `Bed-${bedLetters[index] || index + 1}`,
      }));

      await tx.bed.createMany({
        data: bedData,
      });

      return tx.room.findUnique({
        where: { id: room.id },
        include: { beds: true },
      });
    });

    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
