import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        iconName: true,
        category: true,
      },
    });

    return NextResponse.json({ amenities });
  } catch (error) {
    console.error("Failed to fetch amenities:", error);
    return NextResponse.json({ error: "Failed to fetch amenities" }, { status: 500 });
  }
}
