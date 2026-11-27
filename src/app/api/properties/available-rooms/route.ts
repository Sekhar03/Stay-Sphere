export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { PropertyVerificationStatus } from "@/lib/constants";

// GET /api/properties/available-rooms
// Returns all available rooms and individual beds across verified properties
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const propertyType = searchParams.get("propertyType"); // PG | RENTED_ROOM | FLAT | HOSTEL | ALL
    const sharingType = searchParams.get("sharingType"); // SINGLE | DOUBLE | TRIPLE | FOUR_PLUS
    const maxRent = searchParams.get("maxRent");
    const hasAttachedBath = searchParams.get("hasAttachedBath");
    const hasAirCondition = searchParams.get("hasAirCondition");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const propertyWhere: any = {
      isPublished: true,
      verificationStatus: PropertyVerificationStatus.APPROVED,
    };

    if (propertyType && propertyType !== "ALL") {
      propertyWhere.propertyType = propertyType;
    }

    if (city) {
      propertyWhere.address = {
        city: { contains: city },
      };
    }

    if (search) {
      propertyWhere.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { address: { city: { contains: search } } },
        { address: { locality: { contains: search } } },
      ];
    }

    const roomWhere: any = {
      isActive: true,
      property: propertyWhere,
      beds: {
        some: {
          status: "AVAILABLE",
        },
      },
    };

    if (sharingType && sharingType !== "ALL") {
      roomWhere.sharingType = sharingType;
    }

    if (maxRent) {
      roomWhere.monthlyRent = { lte: parseFloat(maxRent) };
    }

    if (hasAttachedBath === "true") {
      roomWhere.hasAttachedBath = true;
    }

    if (hasAirCondition === "true") {
      roomWhere.hasAirCondition = true;
    }

    const totalRooms = await prisma.room.count({ where: roomWhere });

    const rooms = await prisma.room.findMany({
      where: roomWhere,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { monthlyRent: "asc" },
      include: {
        property: {
          include: {
            address: true,
            media: {
              where: { isCover: true },
              take: 1,
            },
          },
        },
        beds: {
          where: { status: "AVAILABLE" },
          select: {
            id: true,
            bedNumber: true,
            status: true,
          },
        },
      },
    });

    const formatted = rooms.map((room) => ({
      roomId: room.id,
      roomNumber: room.roomNumber,
      floorNumber: room.floorNumber,
      sharingType: room.sharingType,
      monthlyRent: room.monthlyRent,
      securityDeposit: room.securityDeposit,
      hasAttachedBath: room.hasAttachedBath,
      hasBalcony: room.hasBalcony,
      hasAirCondition: room.hasAirCondition,
      availableBedsCount: room.beds.length,
      availableBeds: room.beds,
      property: {
        id: room.property.id,
        name: room.property.name,
        slug: room.property.slug,
        propertyType: room.property.propertyType,
        genderPreference: room.property.genderPreference,
        foodOption: room.property.foodOption,
        coverImage: room.property.media[0]?.url || "/images/room-placeholder.jpg",
        locality: room.property.address?.locality || "",
        city: room.property.address?.city || "",
        state: room.property.address?.state || "",
      },
    }));

    return NextResponse.json({
      rooms: formatted,
      pagination: {
        total: totalRooms,
        page,
        limit,
        totalPages: Math.ceil(totalRooms / limit),
      },
    });
  } catch (error) {
    console.error("Fetch available rooms error:", error);
    return NextResponse.json({ error: "Failed to fetch available rooms" }, { status: 500 });
  }
}
