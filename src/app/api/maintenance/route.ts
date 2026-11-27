export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { createMaintenanceRequestSchema } from "@/lib/validators";
import { Role } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    const data = createMaintenanceRequestSchema.parse(body);

    let propId = data.propertyId;
    let roomLabel = "Room";

    // Auto-resolve propertyId and room if not provided or to ensure accuracy
    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: auth.user.userId },
      include: {
        currentBed: {
          include: { room: { include: { property: { include: { owner: true } } } } },
        },
        allocations: {
          where: { isActive: true },
          take: 1,
          include: {
            bed: {
              include: { room: { include: { property: { include: { owner: true } } } } },
            },
          },
        },
      },
    });

    if (tenantProfile?.currentBed?.room) {
      if (!propId) {
        propId = tenantProfile.currentBed.room.propertyId;
      }
      roomLabel = `Room ${tenantProfile.currentBed.room.roomNumber} (Bed ${tenantProfile.currentBed.bedNumber})`;
    } else if (tenantProfile?.allocations?.[0]?.bed?.room) {
      const b = tenantProfile.allocations[0].bed;
      if (!propId) {
        propId = b.room.propertyId;
      }
      roomLabel = `Room ${b.room.roomNumber} (Bed ${b.bedNumber})`;
    }

    if (!propId) {
      const firstProp = await prisma.pGProperty.findFirst();
      propId = firstProp?.id;
    }

    if (!propId) {
      return NextResponse.json({ error: "No active property found for this ticket" }, { status: 400 });
    }

    const ticketId = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const ticket = await prisma.maintenanceRequest.create({
      data: {
        ticketId,
        propertyId: propId,
        userId: auth.user.userId,
        category: data.category,
        title: data.title,
        description: data.description,
        photos: JSON.stringify(data.photos || []),
        status: "OPEN",
      },
      include: {
        user: { select: { name: true, phone: true } },
        property: { select: { name: true } },
      },
    });

    // Notify Owner & Property Staff
    try {
      const property = await prisma.pGProperty.findUnique({
        where: { id: propId },
        include: { owner: true },
      });

      if (property?.owner?.userId) {
        await prisma.notification.create({
          data: {
            userId: property.owner.userId,
            title: `New Complaint: ${ticket.title}`,
            message: `${ticket.user.name} reported a ${ticket.category} issue for ${roomLabel}: "${ticket.description}"`,
            link: "/owner/dashboard?tab=maintenance",
          },
        });
      }

      // Notify staff assigned to property
      const staffProfiles = await prisma.staffProfile.findMany({
        where: {
          OR: [{ propertyId: propId }, { ownerId: property?.ownerId || "" }],
          isActive: true,
        },
      });

      for (const sp of staffProfiles) {
        await prisma.notification.create({
          data: {
            userId: sp.userId,
            title: `New Maintenance: ${ticket.title}`,
            message: `${ticket.user.name} reported [${ticket.category}] in ${roomLabel}`,
            link: "/staff/dashboard?tab=maintenance",
          },
        });
      }
    } catch (notifErr) {
      console.warn("Failed to create ticket notifications:", notifErr);
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: any) {
    if (error?.errors) {
      return NextResponse.json({ error: error.errors[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("Maintenance ticket error:", error);
    return NextResponse.json({ error: "Failed to submit maintenance request" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if ("errorResponse" in auth) return auth.errorResponse;

    const userSelect = {
      id: true,
      name: true,
      email: true,
      phone: true,
      tenantProfile: {
        include: {
          currentBed: {
            include: { room: true },
          },
          allocations: {
            where: { isActive: true },
            take: 1,
            include: {
              bed: { include: { room: true } },
            },
          },
        },
      },
    };

    let tickets;
    if (auth.user.role === Role.CUSTOMER_TENANT) {
      tickets = await prisma.maintenanceRequest.findMany({
        where: { userId: auth.user.userId },
        include: {
          property: { select: { id: true, name: true } },
          user: { select: userSelect },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (auth.user.role === Role.PG_OWNER) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      const propertyFilter = owner?.id ? { ownerId: owner.id } : undefined;
      tickets = await prisma.maintenanceRequest.findMany({
        where: propertyFilter ? { property: propertyFilter } : undefined,
        include: {
          user: { select: userSelect },
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (auth.user.role === Role.PG_STAFF) {
      const staff = await prisma.staffProfile.findUnique({
        where: { userId: auth.user.userId },
      });
      const propertyFilter = staff?.propertyId
        ? { id: staff.propertyId }
        : staff?.ownerId
        ? { ownerId: staff.ownerId }
        : undefined;
      tickets = await prisma.maintenanceRequest.findMany({
        where: propertyFilter ? { property: propertyFilter } : undefined,
        include: {
          user: { select: userSelect },
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      tickets = await prisma.maintenanceRequest.findMany({
        include: {
          user: { select: userSelect },
          property: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Fetch maintenance tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.PG_OWNER, Role.PG_STAFF, Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const body = await req.json();
    let { ticketId, status, resolutionNote } = body;

    if (!ticketId || !status) {
      return NextResponse.json({ error: "Ticket ID and status required" }, { status: 400 });
    }

    // Map status
    let normalizedStatus = status.toUpperCase();
    if (normalizedStatus === "NEW" || normalizedStatus === "OPEN") normalizedStatus = "OPEN";
    if (normalizedStatus === "IN PROGRESS" || normalizedStatus === "IN_PROGRESS") normalizedStatus = "IN_PROGRESS";
    if (normalizedStatus === "DONE" || normalizedStatus === "RESOLVED") normalizedStatus = "RESOLVED";

    // Find ticket by cuid id or public ticketId
    const existing = await prisma.maintenanceRequest.findFirst({
      where: {
        OR: [
          { id: ticketId },
          { ticketId: ticketId },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const updateData: any = { status: normalizedStatus };
    if (resolutionNote) updateData.resolutionNote = resolutionNote;
    if (normalizedStatus === "RESOLVED" || normalizedStatus === "CLOSED") {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    // Notify Tenant that their ticket status was updated
    try {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          title: `Ticket ${normalizedStatus === "RESOLVED" ? "Resolved" : "Update: " + normalizedStatus}`,
          message: `Aapki complaint "${updated.title}" status update: ${normalizedStatus}.${resolutionNote ? ` Note: ${resolutionNote}` : ""}`,
          link: "/dashboard?tab=maintenance",
        },
      });
    } catch (notifErr) {
      console.warn("Notification error:", notifErr);
    }

    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "MAINTENANCE_TICKET_UPDATED",
        entityType: "MAINTENANCE_REQUEST",
        entityId: ticketId,
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ ticket: updated });
  } catch (error) {
    console.error("Update maintenance error:", error);
    return NextResponse.json({ error: "Failed to update maintenance request" }, { status: 500 });
  }
}
