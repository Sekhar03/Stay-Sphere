import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";
import { releaseExpiredBedHolds } from "@/lib/bookings/bedHoldManager";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fulfill Step 13/15: Real-time cleanup of expired 15-minute bed locks
    await releaseExpiredBedHolds();

    const property = await prisma.pGProperty.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        address: true,
        owner: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
        propertyAmenities: {
          include: {
            amenity: true,
          },
        },
        media: {
          orderBy: { sortOrder: "asc" },
        },
        mediaItems: {
          where: { status: "READY", deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        virtualTours: {
          orderBy: { sortOrder: "asc" },
          include: {
            room: true,
          },
        },
        rooms: {
          where: { isActive: true },
          include: {
            beds: true,
          },
          orderBy: { monthlyRent: "asc" },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const ratingsCount = property.reviews.length;
    const avgRating =
      ratingsCount > 0
        ? property.reviews.reduce((acc, r) => acc + r.rating, 0) / ratingsCount
        : 0;

    return NextResponse.json({
      property: {
        ...property,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount: ratingsCount,
      },
    });
  } catch (error) {
    console.error("Fetch property detail error:", error);
    return NextResponse.json({ error: "Failed to fetch property details" }, { status: 500 });
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
    const property = await prisma.pGProperty.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (auth.user.role !== Role.SUPER_ADMIN && property.owner.userId !== auth.user.userId) {
      return NextResponse.json({ error: "Forbidden: Not your property" }, { status: 403 });
    }

    await prisma.pGProperty.delete({ where: { id } });

    return NextResponse.json({ message: "Property deleted successfully" });
  } catch (error) {
    console.error("Delete property error:", error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}
