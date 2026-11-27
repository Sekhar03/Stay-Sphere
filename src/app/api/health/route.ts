import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

export async function GET() {
  try {
    // Database liveness check (Section 2.10: Excludes 3rd parties so LB does not evict healthy instances)
    await prisma.$queryRaw`SELECT 1`;

    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: "HEALTHY",
      service: "StaySphere Platform",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: "CONNECTED",
      memory: {
        rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      },
      version: "1.0.0",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "DEGRADED",
        service: "StaySphere Platform",
        timestamp: new Date().toISOString(),
        database: "DISCONNECTED",
        error: error instanceof Error ? error.message : "Database probe failed",
      },
      { status: 503 }
    );
  }
}
