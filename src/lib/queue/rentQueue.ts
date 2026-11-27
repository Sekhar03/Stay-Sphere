import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import prisma from "@/lib/db/prisma";
import { sendEmail, getRentReminderTemplate } from "@/lib/email/mailer";
import { format, addDays, isSameDay, isBefore } from "date-fns";

const redisUrl = process.env.REDIS_URL;

let redisConnection: Redis | null = null;
if (redisUrl) {
  try {
    redisConnection = new Redis(redisUrl, {
      // Redis is optional for the reminder scan (it can run directly), so do
      // not keep an infinite reconnect loop alive when it is unavailable.
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: (times) => (times > 2 ? null : Math.min(times * 250, 1000)),
    });
    redisConnection.on("error", (err) => {
      // Graceful error logging without crashing node process
      console.warn("[Redis] Connection notice:", err.message);
    });
  } catch (e) {
    console.warn("[Redis] Initialization failed:", e);
    redisConnection = null;
  }
}

export const RENT_REMINDER_QUEUE_NAME = "rent-reminders";

export const rentReminderQueue = redisConnection
  ? new Queue(RENT_REMINDER_QUEUE_NAME, { connection: redisConnection })
  : null;

/**
 * Idempotently generate monthly RentSchedule invoices for all active tenant
 * allocations for the current billing month (1st of month -> due on 5th).
 */
export async function generateMonthlyRentInvoices(referenceDate = new Date()): Promise<number> {
  const billingMonth = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1)
  );
  const dueDate = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 5)
  );

  const activeAllocations = await prisma.tenantAllocation.findMany({
    where: { isActive: true },
    include: {
      bed: {
        include: {
          room: true,
        },
      },
    },
  });

  let created = 0;
  for (const alloc of activeAllocations) {
    const monthlyRent = Number(alloc.bed?.room?.monthlyRent || 0);
    if (!monthlyRent || monthlyRent <= 0) continue;

    const existing = await prisma.rentSchedule.findUnique({
      where: {
        tenantProfileId_billingMonth: {
          tenantProfileId: alloc.tenantProfileId,
          billingMonth,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.rentSchedule.create({
        data: {
          tenantProfileId: alloc.tenantProfileId,
          billingMonth,
          dueDate,
          amount: monthlyRent,
          lateFee: 0,
          totalPayable: monthlyRent,
          status: referenceDate > dueDate ? "DUE" : "UPCOMING",
        },
      });
      created++;
    }
  }

  return created;
}

/**
 * Core business logic that executes the rent reminder check across all active tenants.
 * Can be triggered directly by Cron/API or via BullMQ worker!
 */
export async function executeRentReminderBatch() {
  console.log("⏰ [Rent Scheduler] Starting automated rent reminder scan...");
  const today = new Date();

  try {
    const generated = await generateMonthlyRentInvoices(today);
    if (generated > 0) {
      console.log(`🧾 [Rent Scheduler] Generated ${generated} monthly rent invoice(s).`);
    }
  } catch (err) {
    console.warn("[Rent Scheduler] Invoice generation warning:", err);
  }

  // Find all UPCOMING or DUE or OVERDUE rent schedules
  const schedules = await prisma.rentSchedule.findMany({
    where: {
      status: { in: ["UPCOMING", "DUE", "OVERDUE"] },
    },
    include: {
      tenantProfile: {
        include: {
          user: true,
          allocations: {
            where: { isActive: true },
            include: {
              bed: {
                include: {
                  room: {
                    include: {
                      property: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      emailLogs: true,
    },
  });

  const results = {
    scanned: schedules.length,
    remindersSent: 0,
    alreadyNotified: 0,
  };

  for (const schedule of schedules) {
    const tenant = schedule.tenantProfile.user;
    const allocation = schedule.tenantProfile.allocations[0];
    const property = allocation?.bed.room.property;
    const room = allocation?.bed.room;

    if (!property || !room) continue;

    const dueDate = new Date(schedule.dueDate);
    let reminderType: "UPCOMING" | "DUE_TODAY" | "OVERDUE" | null = null;

    // 1. 5 Days before due date as per Step 19 specification
    const fiveDaysBefore = addDays(dueDate, -5);
    if (isSameDay(today, fiveDaysBefore) || (isBefore(fiveDaysBefore, today) && isBefore(today, dueDate))) {
      reminderType = "UPCOMING";
    }
    // 2. On Due Date
    else if (isSameDay(today, dueDate)) {
      reminderType = "DUE_TODAY";
    }
    // 3. Overdue (e.g. +2 or +5 days)
    else if (isBefore(dueDate, today)) {
      reminderType = "OVERDUE";
      // Update DB status to OVERDUE if still marked UPCOMING or DUE
      if (schedule.status !== "OVERDUE") {
        await prisma.rentSchedule.update({
          where: { id: schedule.id },
          data: { status: "OVERDUE" },
        });
      }
    }

    if (!reminderType) continue;

    // Idempotency: check if an email was already sent today for this schedule
    const alreadySentToday = schedule.emailLogs.some(
      (log) => isSameDay(new Date(log.sentAt), today) && log.status.startsWith("SENT")
    );

    if (alreadySentToday) {
      results.alreadyNotified++;
      continue;
    }

    // Dispatch email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const payUrl = `${appUrl}/tenant/rent?scheduleId=${schedule.id}`;

    const html = getRentReminderTemplate({
      tenantName: tenant.name,
      propertyName: property.name,
      roomNumber: room.roomNumber,
      amount: Number(schedule.totalPayable),
      dueDate: format(dueDate, "dd MMMM yyyy"),
      status: reminderType,
      payUrl,
    });

    const subject =
      reminderType === "OVERDUE"
        ? `[Urgent] Rent Payment Overdue for ${property.name}`
        : reminderType === "DUE_TODAY"
        ? `Rent Payment Due Today - ${property.name}`
        : `Upcoming Rent Reminder - ${property.name}`;

    await sendEmail({
      to: tenant.email,
      subject,
      html,
      template: `RENT_REMINDER_${reminderType}`,
      rentScheduleId: schedule.id,
    });

    results.remindersSent++;
  }

  console.log(` [Rent Scheduler] Completed: ${results.remindersSent} sent, ${results.alreadyNotified} already notified.`);
  return results;
}

/**
 * Initializes BullMQ Worker if Redis is active
 */
export function initRentWorker() {
  if (!redisConnection) return null;

  const worker = new Worker(
    RENT_REMINDER_QUEUE_NAME,
    async (job: Job) => {
      console.log(`Processing BullMQ job: ${job.name} (ID: ${job.id})`);
      return await executeRentReminderBatch();
    },
    { connection: redisConnection }
  );

  worker.on("completed", (job) => {
    console.log(`Rent reminder job ${job.id} completed!`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Rent reminder job ${job?.id} failed with error:`, err);
  });

  return worker;
}
