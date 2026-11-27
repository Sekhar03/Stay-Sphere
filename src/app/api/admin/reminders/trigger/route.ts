export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/rbac";
import { Role } from "@/lib/constants";
import prisma from "@/lib/db/prisma";

export async function POST() {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    // Load the queue module only when a batch is actually dispatched. The GET
    // endpoint below is a read-only log view and should never open a Redis
    // connection (Redis is optional in local/development setups).
    const { executeRentReminderBatch } = await import("@/lib/queue/rentQueue");
    const results = await executeRentReminderBatch();

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: auth.user.userId,
        action: "MANUAL_RENT_REMINDER_TRIGGER",
        entityType: "RentSchedule",
        entityId: "BATCH_RUN",
        metadata: JSON.stringify(results),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rent reminders triggered successfully",
      results,
    });
  } catch (error) {
    console.error("Trigger reminders error:", error);
    return NextResponse.json({ error: "Failed to trigger reminders" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requireAuth([Role.SUPER_ADMIN]);
    if ("errorResponse" in auth) return auth.errorResponse;

    const [emailLogs, statusGroups, lastLog] = await Promise.all([
      prisma.emailLog.findMany({
        orderBy: { sentAt: "desc" },
        take: 50,
        select: {
          id: true,
          recipientEmail: true,
          template: true,
          subject: true,
          status: true,
          errorDetails: true,
          sentAt: true,
          rentSchedule: {
            select: {
              billingMonth: true,
              dueDate: true,
              totalPayable: true,
              tenantProfile: {
                select: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
      }),
      prisma.emailLog.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.emailLog.findFirst({ orderBy: { sentAt: "desc" }, select: { sentAt: true } }),
    ]);

    const counts = statusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count.id;
      return acc;
    }, {});

    return NextResponse.json({
      emailLogs,
      summary: {
        total: statusGroups.reduce((sum, group) => sum + group._count.id, 0),
        sent: (counts.SENT || 0) + (counts.SENT_SIMULATED || 0),
        failed: counts.FAILED || 0,
        lastSentAt: lastLog?.sentAt || null,
      },
    });
  } catch (error) {
    console.error("Fetch email logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
