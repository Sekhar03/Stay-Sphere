import { describe, it, expect, beforeAll } from "vitest";
import prisma from "@/lib/db/prisma";
import { signToken } from "@/lib/auth/jwt";
import { Role, BedStatus, PaymentStatus } from "@/lib/constants";

describe("Senior QA Comprehensive Business Flow & E2E Test Suite", () => {
  let adminToken: string;
  let ownerToken: string;
  let tenantToken: string;
  let testPropertyId: string;
  let testRoomId: string;
  let testBedId: string;
  let createdTenantUserId: string;

  beforeAll(async () => {
    const adminUser = await prisma.user.findFirst({
      where: { role: Role.SUPER_ADMIN },
    });
    const ownerUser = await prisma.user.findFirst({
      where: { role: Role.PG_OWNER },
      include: { ownerProfile: true },
    });
    const tenantUser = await prisma.user.findFirst({
      where: {
        role: Role.CUSTOMER_TENANT,
        tenantProfile: { isKycVerified: true },
      },
    });

    const property = await prisma.pGProperty.findFirst({
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
      },
    });

    testPropertyId = property?.id || "";
    testRoomId = property?.rooms?.[0]?.id || "";
    testBedId = property?.rooms?.[0]?.beds?.[0]?.id || "";

    if (adminUser) {
      adminToken = signToken({
        userId: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: Role.SUPER_ADMIN,
      });
    }

    if (ownerUser) {
      ownerToken = signToken({
        userId: ownerUser.id,
        email: ownerUser.email,
        name: ownerUser.name,
        role: Role.PG_OWNER,
        ownerId: ownerUser.ownerProfile?.id,
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

  // FLOW 1: AUTH & REGISTRATION
  describe("Flow 1: User Registration & Authentication", () => {
    it("successfully registers a new customer without providing a phone number", async () => {
      const uniqueEmail = `qa_test_tenant_${Date.now()}@staysphere.in`;
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "QA New Tenant",
          email: uniqueEmail,
          password: "SecurePassword123!",
          role: "CUSTOMER_TENANT",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(uniqueEmail);
      createdTenantUserId = data.user.id;
    });

    it("successfully logs in with email and password", async () => {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tenant1@staysphere.in",
          password: "StaySphere@2026!",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.email).toBe("tenant1@staysphere.in");
      expect(data.redirectUrl).toBe("/dashboard");
    });
  });

  // FLOW 2: PROPERTY DISCOVERY & SEARCH
  describe("Flow 2: Property Discovery & Filter Flow", () => {
    it("returns approved public properties filtered by city", async () => {
      const res = await fetch("http://localhost:3000/api/properties?city=Bhubaneswar");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.properties)).toBe(true);
      expect(data.properties.length).toBeGreaterThan(0);
      data.properties.forEach((p: any) => {
        expect(p.address.city.toLowerCase()).toContain("bhubaneswar");
      });
    });

    it("returns detailed room and bed occupancy status for property", async () => {
      const res = await fetch(`http://localhost:3000/api/properties/${testPropertyId}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.property.id).toBe(testPropertyId);
      expect(Array.isArray(data.property.rooms)).toBe(true);
      expect(data.property.rooms.length).toBeGreaterThan(0);
      expect(Array.isArray(data.property.rooms[0].beds)).toBe(true);
    });
  });

  // FLOW 3: SITE VISIT SCHEDULING
  describe("Flow 3: In-Person Site Visit Flow", () => {
    let createdVisitId: string;

    it("allows a prospect to schedule a free site visit", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      const res = await fetch("http://localhost:3000/api/properties/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: testPropertyId,
          name: "Rohan Das",
          phone: "9876543210",
          email: "rohan.das@example.com",
          visitDate: tomorrow.toISOString().split("T")[0],
          timeSlot: "AFTERNOON",
          sharingInterest: "DOUBLE",
          notes: "Need parking space for two-wheeler",
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.visit).toBeDefined();
      expect(data.visit.status).toBe("SCHEDULED");
      createdVisitId = data.visit.id;
    });

    it("allows Admin to view and update visit status to COMPLETED", async () => {
      const res = await fetch("http://localhost:3000/api/admin/visits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${adminToken}`,
        },
        body: JSON.stringify({
          visitId: createdVisitId,
          status: "COMPLETED",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.visit.status).toBe("COMPLETED");
    });
  });

  // FLOW 4: KYC & BOOKING ALLOCATION
  describe("Flow 4: KYC Submission, Admin Clearance & Bed Booking", () => {
    let newTenantToken: string;
    let availableBedId: string;
    let availableRoomId: string;

    beforeAll(async () => {
      // Find an available bed
      const bed = await prisma.bed.findFirst({
        where: { status: BedStatus.AVAILABLE },
        include: { room: true },
      });
      if (bed) {
        availableBedId = bed.id;
        availableRoomId = bed.roomId;
      }

      newTenantToken = signToken({
        userId: createdTenantUserId,
        email: "qa_test@staysphere.in",
        name: "QA New Tenant",
        role: Role.CUSTOMER_TENANT,
      });
    });

    it("allows newly registered tenant to submit KYC documents", async () => {
      const res = await fetch("http://localhost:3000/api/user/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${newTenantToken}`,
        },
        body: JSON.stringify({
          idProofType: "Aadhaar Card",
          idProofNumber: "1234-5678-9012",
          emergencyContact: "+91 9437111222",
          idProofDocumentUrl: "https://example.com/aadhaar.pdf",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.profile.idProofNumber).toBe("1234-5678-9012");
    });

    it("allows tenant who submitted KYC to initiate bed reservation", async () => {
      if (!availableBedId || !availableRoomId) return;

      const res = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${newTenantToken}`,
        },
        body: JSON.stringify({
          propertyId: testPropertyId,
          roomId: availableRoomId,
          bedId: availableBedId,
          checkInDate: new Date().toISOString(),
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.booking).toBeDefined();
      expect(data.booking.status).toBe("AWAITING_PAYMENT");

      // Verify bed was set to RESERVED
      const bed = await prisma.bed.findUnique({ where: { id: availableBedId } });
      expect(bed?.status).toBe(BedStatus.RESERVED);

      // Clean up test bed reservation back to AVAILABLE
      await prisma.bed.update({
        where: { id: availableBedId },
        data: { status: BedStatus.AVAILABLE },
      });
    });
  });

  // FLOW 5: MAINTENANCE TICKETING
  describe("Flow 5: Maintenance Ticket Triage Flow", () => {
    let ticketId: string;

    it("allows tenant to raise a maintenance complaint", async () => {
      const res = await fetch("http://localhost:3000/api/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${tenantToken}`,
        },
        body: JSON.stringify({
          propertyId: testPropertyId,
          category: "PLUMBING",
          title: "Bathroom tap leaking",
          description: "Water continuously dripping under the sink",
          photos: ["https://example.com/tap.jpg"],
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.ticket.title).toBe("Bathroom tap leaking");
      expect(data.ticket.status).toBe("OPEN");
      ticketId = data.ticket.id;
    });

    it("allows Owner / Admin to update ticket to IN_PROGRESS and RESOLVED", async () => {
      const res = await fetch("http://localhost:3000/api/maintenance", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${adminToken}`,
        },
        body: JSON.stringify({
          ticketId,
          status: "RESOLVED",
          resolutionNote: "Plumber replaced the washer. Resolved.",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ticket.status).toBe("RESOLVED");
    });
  });

  // FLOW 6: OWNER STAFF MANAGEMENT
  describe("Flow 6: Staff Onboarding without Phone Number", () => {
    it("allows PG Owner to create a staff member without requiring a phone number", async () => {
      const uniqueStaffEmail = `qa_staff_${Date.now()}@staysphere.in`;
      const res = await fetch("http://localhost:3000/api/owner/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${ownerToken}`,
        },
        body: JSON.stringify({
          name: "Suresh Caretaker",
          email: uniqueStaffEmail,
          password: "StaffPassword123!",
          staffRole: "CARETAKER",
          propertyId: testPropertyId,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.staff.user.email).toBe(uniqueStaffEmail);
    });
  });

  // FLOW 7: 15-MINUTE BED HOLD & AUTO-EXPIRATION (Step 13, Step 15 & F4)
  describe("Flow 7: Bed Hold 15-Minute Expiry & Inventory Recovery", () => {
    it("automatically frees RESERVED beds whose 15-minute lock has expired", async () => {
      // Find room and bed
      const room = await prisma.room.findFirst({
        where: { propertyId: testPropertyId },
        include: { beds: true },
      });
      const bed = room?.beds?.[0];
      expect(bed).toBeDefined();

      // Ensure bed is available first
      await prisma.bed.update({
        where: { id: bed!.id },
        data: { status: BedStatus.AVAILABLE },
      });

      // Create a booking with an expired lock (lockExpiresAt in the past)
      const expiredBooking = await prisma.booking.create({
        data: {
          bookingReference: `TEST-EXP-${Date.now()}`,
          propertyId: testPropertyId,
          roomId: room!.id,
          bedId: bed!.id,
          tenantUserId: (await prisma.user.findFirst({ where: { role: Role.CUSTOMER_TENANT } }))!.id,
          checkInDate: new Date(),
          lockExpiresAt: new Date(Date.now() - 60 * 1000), // Expired 1 minute ago
          monthlyRent: room!.monthlyRent,
          bookingAmount: 2000,
          securityDeposit: 5000,
          totalPayableNow: 7000,
          status: "AWAITING_PAYMENT",
        },
      });

      // Mark bed as RESERVED (as booking would have done)
      await prisma.bed.update({
        where: { id: bed!.id },
        data: { status: BedStatus.RESERVED },
      });

      // Trigger cron/worker bed hold expiration
      const cronRes = await fetch("http://localhost:3000/api/cron/expire-holds");
      expect(cronRes.status).toBe(200);
      const cronData = await cronRes.json();
      expect(cronData.success).toBe(true);

      // Verify bed is back to AVAILABLE
      const updatedBed = await prisma.bed.findUnique({ where: { id: bed!.id } });
      expect(updatedBed?.status).toBe(BedStatus.AVAILABLE);

      // Verify booking status is EXPIRED
      const updatedBooking = await prisma.booking.findUnique({ where: { id: expiredBooking.id } });
      expect(updatedBooking?.status).toBe("EXPIRED");

      // Cleanup
      await prisma.booking.delete({ where: { id: expiredBooking.id } });
    });
  });

  // FLOW 8: SERVER-SIDE PAYMENT AMOUNT ENFORCEMENT (Step 14)
  describe("Flow 8: Server-Side Enforced Payment Order Amount", () => {
    it("enforces ₹2,000 token advance strictly from server DB regardless of client request body", async () => {
      // Create a test booking
      const room = await prisma.room.findFirst({
        where: { propertyId: testPropertyId },
        include: { beds: true },
      });
      const booking = await prisma.booking.create({
        data: {
          bookingReference: `TEST-PAY-${Date.now()}`,
          propertyId: testPropertyId,
          roomId: room!.id,
          bedId: room!.beds[0].id,
          tenantUserId: (await prisma.user.findFirst({ where: { role: Role.CUSTOMER_TENANT } }))!.id,
          checkInDate: new Date(),
          monthlyRent: room!.monthlyRent,
          bookingAmount: 2000,
          securityDeposit: 5000,
          totalPayableNow: 7000,
          status: "AWAITING_PAYMENT",
        },
      });

      // Client attempts to pass a tampered amount of ₹10 instead of ₹2,000
      const res = await fetch("http://localhost:3000/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${tenantToken}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: 10, // Tampered client amount
          paymentType: "BOOKING_ADVANCE",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      // Server must enforce ₹2,000 token advance!
      expect(data.amount).toBe(2000);

      // Verify DB record also has 2000
      const paymentRecord = await prisma.payment.findUnique({ where: { id: data.paymentId } });
      expect(paymentRecord?.amount).toBe(2000);

      // Cleanup
      await prisma.payment.delete({ where: { id: data.paymentId } });
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  // FLOW 9: TENANT CANCELLATION & BED RELEASE (Step F1)
  describe("Flow 9: Tenant Booking Cancellation and Bed Inventory Release", () => {
    it("allows tenant to cancel their own booking before move-in and releases bed", async () => {
      const room = await prisma.room.findFirst({
        where: { propertyId: testPropertyId },
        include: { beds: true },
      });
      const bed = room!.beds[0];

      // Create a booking for this tenant
      const booking = await prisma.booking.create({
        data: {
          bookingReference: `TEST-CAN-${Date.now()}`,
          propertyId: testPropertyId,
          roomId: room!.id,
          bedId: bed.id,
          tenantUserId: (await prisma.user.findFirst({ where: { role: Role.CUSTOMER_TENANT } }))!.id,
          checkInDate: new Date(Date.now() + 10 * 24 * 3600 * 1000), // 10 days in future
          monthlyRent: room!.monthlyRent,
          bookingAmount: 2000,
          securityDeposit: 5000,
          totalPayableNow: 7000,
          status: "AWAITING_PAYMENT",
        },
      });

      // Bed is RESERVED
      await prisma.bed.update({ where: { id: bed.id }, data: { status: BedStatus.RESERVED } });

      // Tenant calls cancel
      const res = await fetch("http://localhost:3000/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${tenantToken}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          status: "CANCELLED",
          remarks: "Change of plans",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.booking.status).toBe("CANCELLED");

      // Verify bed is released to AVAILABLE
      const updatedBed = await prisma.bed.findUnique({ where: { id: bed.id } });
      expect(updatedBed?.status).toBe(BedStatus.AVAILABLE);

      // Cleanup
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  // FLOW 10: OWNER NO-SHOW MARKING & BED RELEASE (Step F2)
  describe("Flow 10: Owner No-Show Marking and Bed Inventory Release", () => {
    it("allows Owner to mark an overdue booking as NO_SHOW and frees the bed back to AVAILABLE", async () => {
      const room = await prisma.room.findFirst({
        where: { propertyId: testPropertyId },
        include: { beds: true },
      });
      const bed = room!.beds[0];

      const booking = await prisma.booking.create({
        data: {
          bookingReference: `TEST-NS-${Date.now()}`,
          propertyId: testPropertyId,
          roomId: room!.id,
          bedId: bed.id,
          tenantUserId: (await prisma.user.findFirst({ where: { role: Role.CUSTOMER_TENANT } }))!.id,
          checkInDate: new Date(Date.now() - 24 * 3600 * 1000), // Yesterday (overdue)
          monthlyRent: room!.monthlyRent,
          bookingAmount: 2000,
          securityDeposit: 5000,
          totalPayableNow: 7000,
          status: "CONFIRMED",
        },
      });

      // Bed is RESERVED
      await prisma.bed.update({ where: { id: bed.id }, data: { status: BedStatus.RESERVED } });

      // Owner marks NO_SHOW
      const res = await fetch("http://localhost:3000/api/bookings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `staysphere_token=${ownerToken}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          status: "NO_SHOW",
          remarks: "Resident did not arrive on move-in day",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.booking.status).toBe("NO_SHOW");

      // Verify bed is freed to AVAILABLE
      const updatedBed = await prisma.bed.findUnique({ where: { id: bed.id } });
      expect(updatedBed?.status).toBe(BedStatus.AVAILABLE);

      // Cleanup
      await prisma.booking.delete({ where: { id: booking.id } });
    });
  });

  // FLOW 11: CIRCUIT BREAKER RESILIENCE & FALLBACK (Section 2.7)
  describe("Flow 11: Circuit Breaker Resilience & Graceful Fallback", () => {
    it("executes successfully when downstream service is healthy", async () => {
      const { CircuitBreaker } = await import("@/lib/circuitBreaker");
      const breaker = new CircuitBreaker({ name: "TestHealthyService", timeoutMs: 1000 });
      const result = await breaker.execute(async () => "healthy_result");
      expect(result).toBe("healthy_result");
      expect(breaker.state).toBe("CLOSED");
    });

    it("trips to OPEN state on repeated downstream failures and executes fallback", async () => {
      const { CircuitBreaker } = await import("@/lib/circuitBreaker");
      const breaker = new CircuitBreaker({
        name: "TestFailingService",
        timeoutMs: 200,
        failureThreshold: 2,
        resetTimeoutMs: 5000,
      });

      // Cause 2 failures
      try {
        await breaker.execute(async () => { throw new Error("Connection failed"); });
      } catch {}
      try {
        await breaker.execute(async () => { throw new Error("Connection failed"); });
      } catch {}

      expect(breaker.state).toBe("OPEN");

      // While OPEN, fallback is executed immediately without hitting broken service
      const fallbackResult = await breaker.execute(
        async () => "never_reached",
        async () => "graceful_fallback_result"
      );
      expect(fallbackResult).toBe("graceful_fallback_result");
    });
  });

  // FLOW 12: RELIABLE ASYNC OUTBOX PATTERN (Section 2.5)
  describe("Flow 12: Outbox Pattern Reliable Async Messaging", () => {
    it("creates an outbox record and dispatches it successfully", async () => {
      const { queueOutboxMessage, dispatchOutboxBatch } = await import("@/lib/queue/outbox");

      const testMsg = await queueOutboxMessage(null, "NOTIFICATION_BROADCAST", {
        userId: (await prisma.user.findFirst())!.id,
        title: "Test Outbox Notice",
        message: "Verifying transactional outbox delivery",
        link: "/dashboard",
      });

      expect(testMsg.id).toBeDefined();
      expect(testMsg.status).toBe("PENDING");

      // Trigger dispatch batch
      const dispatchSummary = await dispatchOutboxBatch(10);
      expect(dispatchSummary.dispatched).toBeGreaterThanOrEqual(1);

      // Verify DB record transitioned to DISPATCHED
      const updated = await prisma.outboxMessage.findUnique({ where: { id: testMsg.id } });
      expect(updated?.status).toBe("DISPATCHED");
      expect(updated?.dispatchedAt).toBeDefined();

      // Cleanup
      await prisma.outboxMessage.delete({ where: { id: testMsg.id } });
    });
  });

  // FLOW 13: 5-MINUTE PAYMENT RECONCILIATION WORKER (Section 2.4 & 2.6)
  describe("Flow 13: Payment Reconciliation Worker Execution", () => {
    it("successfully runs reconciliation job via cron endpoint", async () => {
      const res = await fetch("http://localhost:3000/api/cron/reconcile-payments");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.summary).toBeDefined();
      expect(typeof data.summary.scanned).toBe("number");
    });
  });
});


