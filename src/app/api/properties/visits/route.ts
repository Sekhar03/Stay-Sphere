import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getServerSession } from "@/lib/auth/jwt";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/rateLimit";

const createVisitSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  visitDate: z.string().min(1, "Visit date is required"),
  timeSlot: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  sharingInterest: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR_PLUS"]).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rateLimited = await enforceRateLimit(req, "properties:visits", 12, 60);
    if (rateLimited) return rateLimited;

    const body = await req.json();
    const parsed = createVisitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { propertyId, name, phone, email, visitDate, timeSlot, sharingInterest, notes } = parsed.data;

    const property = await prisma.pGProperty.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true, ownerId: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Optional logged-in user check
    const user = await getServerSession();
    const userId = user?.userId || null;

    const visit = await prisma.propertyVisit.create({
      data: {
        propertyId,
        userId,
        ownerId: property.ownerId,
        name,
        phone,
        email: email || null,
        visitDate: new Date(visitDate),
        timeSlot,
        sharingInterest: sharingInterest || null,
        notes: notes || null,
        status: "SCHEDULED",
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: {
              select: {
                locality: true,
                city: true,
                addressLine1: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Visit scheduled successfully",
        visit,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create property visit error:", error);
    return NextResponse.json(
      { error: "Failed to schedule property visit" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getServerSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    let where: any = {};

    if (user.role === "CUSTOMER_TENANT") {
      where.userId = user.userId;
    } else if (user.role === "PG_OWNER") {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: user.userId },
      });
      if (!owner) {
        return NextResponse.json({ visits: [] });
      }
      where.ownerId = owner.id;
      if (propertyId) where.propertyId = propertyId;
    }

    const visits = await prisma.propertyVisit.findMany({
      where,
      orderBy: { visitDate: "asc" },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({ visits });
  } catch (error: any) {
    console.error("Fetch visits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch property visits" },
      { status: 500 }
    );
  }
}
