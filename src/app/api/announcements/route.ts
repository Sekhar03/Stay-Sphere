export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    let announcements: any[] = [];

    if (auth.user.role === Role.SUPER_ADMIN) {
      announcements = await prisma.announcement.findMany({
        include: {
          owner: { include: { user: { select: { name: true, email: true } } } },
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (auth.user.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      if (!owner) return NextResponse.json({ announcements: [] });

      announcements = await prisma.announcement.findMany({
        where: { ownerId: owner.id },
        include: {
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (auth.user.role === Role.PG_STAFF) {
      const staff = await prisma.staffProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      if (!staff) return NextResponse.json({ announcements: [] });

      announcements = await prisma.announcement.findMany({
        where: {
          ownerId: staff.ownerId,
          OR: [
            { propertyId: null },
            staff.propertyId ? { propertyId: staff.propertyId } : {},
          ],
        },
        include: {
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Tenant: find current property
      const tenant = await prisma.tenantProfile.findUnique({
        where: { userId: auth.user.userId },
        include: {
          currentBed: {
            include: { room: { include: { property: true } } },
          },
          allocations: {
            where: { isActive: true },
            take: 1,
            include: {
              bed: { include: { room: { include: { property: true } } } },
            },
          },
        },
      });

      const propertyId = tenant?.currentBed?.room?.propertyId || tenant?.allocations?.[0]?.bed?.room?.propertyId;

      announcements = await prisma.announcement.findMany({
        where: {
          OR: propertyId ? [{ propertyId }, { propertyId: null }] : [{ propertyId: null }],
          targetRole: { in: ["ALL", "TENANTS"] },
        },
        include: {
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Fetch announcements error:", error);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const { title, content, priority, targetRole, propertyId } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    let ownerId: string | null = null;

    if (auth.user.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      ownerId = owner?.id || null;
    } else if (auth.user.role === Role.PG_STAFF) {
      const staff = await prisma.staffProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      ownerId = staff?.ownerId || null;
    } else if (auth.user.role === Role.SUPER_ADMIN) {
      const firstOwner = await prisma.ownerProfile.findFirst();
      ownerId = firstOwner?.id || null;
    }

    if (!ownerId) {
      return NextResponse.json({ error: "No owner organization found" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || "NORMAL",
        targetRole: targetRole || "ALL",
        propertyId: propertyId || null,
        ownerId,
      },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
