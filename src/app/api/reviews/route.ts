export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { createReviewSchema } from "@/lib/validators";
import { Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.CUSTOMER_TENANT]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const data = createReviewSchema.parse(body);

    // Verify tenant has booked or stayed at this PG
    const hasBooked = await prisma.booking.findFirst({
      where: {
        tenantUserId: auth.user.userId,
        propertyId: data.propertyId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    });

    const hasStayed = await prisma.tenantAllocation.findFirst({
      where: {
        tenantProfile: { userId: auth.user.userId },
        bed: { room: { propertyId: data.propertyId } },
      },
    });

    const currentStay = await prisma.tenantProfile.findFirst({
      where: {
        userId: auth.user.userId,
        currentBed: { room: { propertyId: data.propertyId } },
      },
    });

    if (!hasBooked && !hasStayed && !currentStay) {
      return NextResponse.json(
        { error: "Only verified tenants who have stayed at this PG can post a review." },
        { status: 403 }
      );
    }

    const review = await prisma.review.create({
      data: {
        propertyId: data.propertyId,
        userId: auth.user.userId,
        rating: data.rating,
        comment: data.comment,
        photos: JSON.stringify(data.photos || []),
        isApproved: true,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
