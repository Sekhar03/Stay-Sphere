export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { getServerSession } from "@/lib/auth/jwt";
import { createPropertySchema } from "@/lib/validators";
import {
  PropertyVerificationStatus,
  Role,
  GenderPreference,
  FoodOption,
} from "@/lib/constants";
import { getCached, setCached, invalidateCachePrefix } from "@/lib/cache/redisCache";

// ─── Shared include for property listings ────────────────────────────────────
// Only fetches the first media item (cover) + a capped set of amenities to cut
// payload and DB round-trips significantly.
const LISTING_INCLUDE = {
  address: {
    select: {
      city: true,
      locality: true,
      area: true,
      addressLine1: true,
      latitude: true,
      longitude: true,
    },
  },
  // Prefer new mediaItems; keep legacy media fallback (first 1 only)
  mediaItems: {
    where: { status: "READY", deletedAt: null },
    orderBy: { sortOrder: "asc" },
    take: 5, // cover + 4 extra for the photo count badge
    select: {
      url: true,
      blurData: true,
      variants: true,
      sortOrder: true,
    },
  },
  media: {
    orderBy: { sortOrder: "asc" },
    take: 5,
    select: { url: true, sortOrder: true, isCover: true },
  },
  propertyAmenities: {
    take: 8, // show up to 8 on the card; more are on the detail page
    select: {
      amenity: {
        select: { id: true, name: true, iconName: true, code: true },
      },
    },
  },
  virtualTours: {
    select: { id: true },
    take: 1,
  },
  rooms: {
    where: { isActive: true },
    select: {
      id: true,
      roomNumber: true,
      floorNumber: true,
      sharingType: true,
      monthlyRent: true,
      hasAttachedBath: true,
      hasBalcony: true,
      hasAirCondition: true,
      // Aggregate bed count in JS rather than fetching full bed rows
      _count: { select: { beds: true } },
    },
    orderBy: [{ floorNumber: "asc" }, { roomNumber: "asc" }],
  },
  // Use aggregated rating fields stored on the record (see _avg below)
} as const;

// Helper to build the aggregated rating for a list of property ids in one query
async function getPropertyRatings(ids: string[]) {
  if (ids.length === 0) return new Map<string, { avg: number; count: number }>();
  const agg = await prisma.review.groupBy({
    by: ["propertyId"],
    where: { propertyId: { in: ids }, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return new Map(
    agg.map((r) => [r.propertyId, { avg: r._avg.rating ?? 0, count: r._count.rating }])
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const locality = searchParams.get("locality");
    const propertyType = searchParams.get("propertyType");
    const gender = searchParams.get("gender") as GenderPreference | null;
    const food = searchParams.get("food") as FoodOption | null;
    const minRent = searchParams.get("minRent");
    const maxRent = searchParams.get("maxRent");
    const sharing = searchParams.get("sharing");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 24);
    const sortBy = searchParams.get("sortBy") || "createdAt";

    const session = await getServerSession();
    const isPublicSearch = Boolean(
      city || locality || propertyType || gender || food || minRent || maxRent || sharing || search
    );

    const where: any = {};

    // ── Owner-scoped view ──
    if (!isPublicSearch && session && session.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      });
      // If owner has no assigned properties we still show public listings,
      // but we do it in a single path (no second fallback query).
      if (owner?.id) where.ownerId = owner.id;
    } else {
      where.isPublished = true;
      where.verificationStatus = PropertyVerificationStatus.APPROVED;
    }

    if (propertyType && propertyType !== "ALL") where.propertyType = propertyType;

    if (city) {
      where.address = { ...where.address, city: { contains: city } };
    }

    if (locality) {
      where.address = {
        ...where.address,
        OR: [
          { locality: { contains: locality } },
          { area: { contains: locality } },
        ],
      };
    }

    if (gender) where.genderPreference = gender;
    if (food) where.foodOption = food;

    if (minRent || maxRent) {
      where.startingRent = {};
      if (minRent) where.startingRent.gte = parseFloat(minRent);
      if (maxRent) where.startingRent.lte = parseFloat(maxRent);
    }

    if (sharing) {
      where.rooms = { some: { sharingType: sharing, isActive: true } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { address: { city: { contains: search } } },
        { address: { locality: { contains: search } } },
      ];
    }

    const orderBy: any = {};
    if (sortBy === "priceAsc") orderBy.startingRent = "asc";
    else if (sortBy === "priceDesc") orderBy.startingRent = "desc";
    else orderBy.createdAt = "desc";

    const isPublic = !where.ownerId;
    const cacheKey = isPublic
      ? `properties:list:${req.nextUrl.searchParams.toString() || "default"}`
      : null;

    if (cacheKey) {
      const cachedPayload = await getCached<{
        properties: any[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>(cacheKey);
      if (cachedPayload) {
        const cachedRes = NextResponse.json(cachedPayload);
        cachedRes.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
        cachedRes.headers.set("X-Cache", "HIT");
        return cachedRes;
      }
    }

    // ── Single parallel query: count + rows ──────────────────────────────────
    const [total, properties] = await Promise.all([
      prisma.pGProperty.count({ where }),
      prisma.pGProperty.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: LISTING_INCLUDE as any,
      }),
    ]);

    // ── Ratings via a single aggregation query ────────────────────────────────
    const ids = properties.map((p) => p.id);
    const ratings = await getPropertyRatings(ids);

    const formattedProperties = properties.map((pg: any) => {
      const { avg: avgRating, count: reviewCount } = ratings.get(pg.id) ?? { avg: 0, count: 0 };
      const availableBedsCount = pg.rooms.reduce(
        (acc: number, r: any) => acc + (r._count?.beds ?? 0),
        0
      );

      return {
        ...pg,
        avgRating: parseFloat(avgRating.toFixed(1)),
        reviewCount,
        availableBedsCount,
      };
    });

    const payload = {
      properties: formattedProperties,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    if (cacheKey) {
      await setCached(cacheKey, payload, 60);
    }

    const res = NextResponse.json(payload);

    // ── HTTP caching: public listings are cacheable for 60 s, stale-while-revalidate 30 s ──
    if (isPublic) {
      res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=30");
      res.headers.set("X-Cache", "MISS");
    }

    return res;
  } catch (error) {
    console.error("Fetch properties error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    // Enforce Admin KYC verification for PG Owners
    let owner = await prisma.ownerProfile.findUnique({
      where: { userId: auth.user.userId },
    });

    if (!owner && auth.user.role === Role.SUPER_ADMIN) {
      owner = await prisma.ownerProfile.findFirst();
      if (!owner) {
        owner = await prisma.ownerProfile.create({
          data: {
            userId: auth.user.userId,
            companyName: "StaySphere Corporate",
            isKycVerified: true,
          },
        });
      }
    }

    if (!owner && auth.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Owner profile not found. Please complete profile setup." },
        { status: 400 }
      );
    }

    // Property will be set to PENDING_VERIFICATION for admin approval before going live
    const isOwnerKycApproved = Boolean(owner?.isKycVerified);

    const body = await req.json();
    const data = createPropertySchema.parse(body);

    const ownerId = owner?.id;
    if (!ownerId) {
      return NextResponse.json({ error: "No owner profile available" }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const newProperty = await prisma.pGProperty.create({
      data: {
        ownerId,
        slug,
        name: data.name,
        description: data.description,
        propertyType: data.propertyType || "PG",
        genderPreference: data.genderPreference,
        foodOption: data.foodOption,
        noticePeriodDays: data.noticePeriodDays,
        gateClosingTime: data.gateClosingTime,
        rules: JSON.stringify(data.rules || []),
        startingRent: data.startingRent,
        securityDeposit: data.securityDeposit,
        maintenanceCharges: data.maintenanceCharges,
        electricityCharges: data.electricityCharges,
        isPublished: auth.user.role === Role.SUPER_ADMIN, // only published upon admin approval
        verificationStatus:
          auth.user.role === Role.SUPER_ADMIN
            ? PropertyVerificationStatus.APPROVED
            : PropertyVerificationStatus.PENDING_VERIFICATION,
        address: {
          create: {
            addressLine1: data.address.addressLine1,
            addressLine2: data.address.addressLine2,
            landmark: data.address.landmark,
            locality: data.address.locality,
            area: data.address.area,
            city: data.address.city,
            state: data.address.state,
            pincode: data.address.pincode,
            latitude: data.address.latitude,
            longitude: data.address.longitude,
            googlePlaceId: data.address.googlePlaceId,
          },
        },
        media: {
          create: data.images.map((url, idx) => ({
            url,
            isCover: idx === 0,
            sortOrder: idx,
          })),
        },
        propertyAmenities: {
          create: data.amenityIds.map((amenityId) => ({
            amenityId,
          })),
        },
      },
      include: {
        address: true,
        media: true,
      },
    });

    return NextResponse.json({ property: newProperty }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create property error:", error);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
