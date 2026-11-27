export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

/**
 * Admin property inventory.
 *
 * This is intentionally separate from `/api/properties`, which only exposes
 * published + approved listings to the public.  Operators need to see drafts,
 * pending and rejected properties too.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (status && status !== "ALL") {
      where.verificationStatus = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { address: { locality: { contains: search } } },
        { address: { city: { contains: search } } },
        { owner: { user: { name: { contains: search } } } },
      ];
    }

    const [properties, statusGroups] = await Promise.all([
      prisma.pGProperty.findMany({
        where,
        include: {
          address: true,
          media: {
            select: { id: true, url: true, caption: true, isCover: true, sortOrder: true },
            orderBy: { sortOrder: "asc" },
          },
          mediaItems: {
            where: { status: "READY", deletedAt: null },
            select: { id: true, url: true, variants: true, blurData: true, isCover: true, sortOrder: true, purpose: true },
            orderBy: { sortOrder: "asc" },
          },
          owner: {
            include: {
              user: { select: { id: true, name: true, email: true, phone: true } },
            },
          },
          rooms: {
            select: {
              id: true,
              roomNumber: true,
              floorNumber: true,
              sharingType: true,
              monthlyRent: true,
              securityDeposit: true,
              hasAttachedBath: true,
              hasBalcony: true,
              hasAirCondition: true,
              beds: { select: { id: true, bedNumber: true, status: true } },
            },
            orderBy: [{ floorNumber: "asc" }, { roomNumber: "asc" }],
          },
          propertyAmenities: {
            include: {
              amenity: true,
            },
          },
          _count: { select: { bookings: true, reviews: true, propertyVisits: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.pGProperty.groupBy({
        by: ["verificationStatus"],
        _count: { id: true },
      }),
    ]);

    const counts = statusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.verificationStatus] = group._count.id;
      return acc;
    }, {});

    return NextResponse.json({
      properties,
      counts: {
        ...counts,
        ALL: statusGroups.reduce((sum, group) => sum + group._count.id, 0),
      },
    });
  } catch (error) {
    console.error("Admin fetch properties error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
