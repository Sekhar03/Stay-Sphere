import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(searchParams.get("limit") || "50", 10) || 50));

    const and: any[] = [];
    if (action && action !== "ALL") and.push({ action });
    if (entityType && entityType !== "ALL") and.push({ entityType });
    if (search) {
      and.push({
        OR: [
          { action: { contains: search } },
          { entityType: { contains: search } },
          { entityId: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      });
    }
    const where = and.length ? { AND: and } : {};

    const [logs, total, actionGroups, entityGroups] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({ by: ["action"], _count: { id: true }, orderBy: { _count: { action: "desc" } } }),
      prisma.auditLog.groupBy({ by: ["entityType"], _count: { id: true } }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      actions: actionGroups.map((group) => ({ action: group.action, count: group._count.id })),
      entityTypes: entityGroups.map((group) => ({ entityType: group.entityType, count: group._count.id })),
    });
  } catch (error) {
    console.error("Admin audit log fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
