import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/db/prisma";
import { signToken } from "@/lib/auth/jwt";
import { Role } from "@/lib/constants";

describe("Admin Portal End-to-End API Suite", () => {
  let adminToken: string;
  let tenantToken: string;
  let testPropertyId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });
    const tenantUser = await prisma.user.findFirst({
      where: { role: Role.CUSTOMER_TENANT },
    });

    const property = await prisma.pGProperty.findFirst();
    testPropertyId = property?.id || "";

    if (adminUser) {
      adminToken = signToken({
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: Role.SUPER_ADMIN,
      });
    }

    if (tenantUser) {
      tenantToken = signToken({
        userId: tenantUser.id,
        email: tenantUser.email,
        name: tenantUser.name,
        role: Role.CUSTOMER_TENANT,
      });
    }
  });

  it("denies access to admin stats when unauthenticated or tenant", async () => {
    // Unauthenticated
    const resUnauth = await fetch("http://localhost:3000/api/admin/stats");
    expect(resUnauth.status).toBe(401);

    // Tenant role forbidden
    const resTenant = await fetch("http://localhost:3000/api/admin/stats", {
      headers: {
        Cookie: `staysphere_token=${tenantToken}`,
      },
    });
    expect(resTenant.status).toBe(403);
  }, 15000);

  it("allows super admin to query full platform analytics", async () => {
    const res = await fetch("http://localhost:3000/api/admin/stats", {
      headers: {
        Cookie: `staysphere_token=${adminToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.analytics).toBeDefined();
    expect(data.analytics.totalUsers).toBeGreaterThanOrEqual(1);
    expect(data.analytics.totalProperties).toBeGreaterThanOrEqual(1);
    expect(data.analytics.totalVisits).toBeDefined();
  });

  it("allows super admin to view and update physical site visits", async () => {
    // 1. Create a visit first via public endpoint
    const createRes = await fetch("http://localhost:3000/api/properties/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: testPropertyId,
        name: "Test Prospective Resident",
        phone: "9876543210",
        visitDate: new Date().toISOString(),
        timeSlot: "MORNING",
        sharingInterest: "DOUBLE",
        notes: "Automated test visit",
      }),
    });
    expect(createRes.status).toBe(201);
    const { visit } = await createRes.json();
    expect(visit.id).toBeDefined();

    // 2. Fetch from admin visits endpoint
    const adminVisitsRes = await fetch("http://localhost:3000/api/admin/visits", {
      headers: {
        Cookie: `staysphere_token=${adminToken}`,
      },
    });
    expect(adminVisitsRes.status).toBe(200);
    const visitsData = await adminVisitsRes.json();
    expect(visitsData.visits.some((v: any) => v.id === visit.id)).toBe(true);

    // 3. Update status to COMPLETED
    const patchRes = await fetch("http://localhost:3000/api/admin/visits", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `staysphere_token=${adminToken}`,
      },
      body: JSON.stringify({
        visitId: visit.id,
        status: "COMPLETED",
      }),
    });
    expect(patchRes.status).toBe(200);

    // Clean up
    await prisma.propertyVisit.delete({ where: { id: visit.id } });
  });

  it("returns the complete property inventory, including non-public listings", async () => {
    const res = await fetch("http://localhost:3000/api/admin/properties", {
      headers: {
        Cookie: `staysphere_token=${adminToken}`,
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.properties)).toBe(true);
    expect(data.properties.length).toBeGreaterThan(0);
    expect(data.counts.ALL).toBeGreaterThanOrEqual(data.properties.length);
    // The admin queue must be able to see rejected/pending listings, unlike /api/properties.
    expect(data.properties.some((property: any) => property.verificationStatus !== "APPROVED")).toBe(true);
  });

  it("returns daily analytics and occupancy snapshots", async () => {
    const res = await fetch("http://localhost:3000/api/admin/analytics?days=7", {
      headers: {
        Cookie: `staysphere_token=${adminToken}`,
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.series).toHaveLength(7);
    expect(data.totals).toBeDefined();
    expect(Array.isArray(data.occupancyByProperty)).toBe(true);
  });

  it("returns a filtered audit trail", async () => {
    const res = await fetch("http://localhost:3000/api/admin/audit?limit=10&action=USER_LOGIN", {
      headers: {
        Cookie: `staysphere_token=${adminToken}`,
      },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.logs)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(data.logs.length);
    expect(data.logs.every((log: any) => log.action === "USER_LOGIN")).toBe(true);
  });

  it("requires a rejection reason before rejecting a property", async () => {
    const res = await fetch(`http://localhost:3000/api/admin/properties/${testPropertyId}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `staysphere_token=${adminToken}`,
      },
      body: JSON.stringify({ action: "REJECT" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/rejection reason/i);
  });

  it("fetches platform settings and allows updates", async () => {
    const getRes = await fetch("http://localhost:3000/api/admin/settings", {
      headers: {
        Cookie: `staysphere_token=${adminToken}`,
      },
    });
    expect(getRes.status).toBe(200);
    const { settings } = await getRes.json();
    expect(settings).toBeDefined();

    const patchRes = await fetch("http://localhost:3000/api/admin/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `staysphere_token=${adminToken}`,
      },
      body: JSON.stringify({
        platformFeePercent: 2.5,
        gstPercentage: 18.0,
        supportEmail: "support@staysphere.in",
        supportPhone: "+91 80 4568 2200",
        enableEmailAlerts: true,
      }),
    });
    expect(patchRes.status).toBe(200);
  });
});
