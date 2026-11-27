import { describe, it, expect } from "vitest";
import { verifyRazorpaySignature, verifyWebhookSignature } from "@/lib/payments/razorpay";
import { verifyUpiWebhookSignature, createUpiOrder, getUpiOrder } from "@/lib/payments/upi-gateway";
import crypto from "crypto";

describe("Razorpay Signature Verification (Legacy Compatibility)", () => {
  const secret = process.env.RAZORPAY_KEY_SECRET || "staysphere_razorpay_secret_key_production";
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "staysphere_whsec_secret_validation_signature";

  it("should verify valid client checkout signature correctly", () => {
    const orderId = "order_9A33XWu170gUtm";
    const paymentId = "pay_29Ae07HxikGQAM";

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid = verifyRazorpaySignature(orderId, paymentId, expectedSignature);
    expect(isValid).toBe(true);
  });

  it("should reject tampered or invalid client signature", () => {
    const orderId = "order_9A33XWu170gUtm";
    const paymentId = "pay_29Ae07HxikGQAM";
    const fraudulentSignature = "fake_signature_hash_0000000000000000000000000000";

    const isValid = verifyRazorpaySignature(orderId, paymentId, fraudulentSignature);
    expect(isValid).toBe(false);
  });

  it("should verify webhook signature correctly", () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_test123", amount: 200000 } } },
    });

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    const isValid = verifyWebhookSignature(payload, expectedSignature);
    expect(isValid).toBe(true);
  });

  it("should reject tampered webhook payload", () => {
    const payload = '{"event":"payment.captured"}';
    const tamperedPayload = '{"event":"payment.failed"}';

    const validSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    const isValid = verifyWebhookSignature(tamperedPayload, validSig);
    expect(isValid).toBe(false);
  });
});

describe("UPI Gateway (mynkdev-21/upi-gateway) Verification Suite", () => {
  const webhookSecret = process.env.UPI_GATEWAY_WEBHOOK_SECRET || "whsec_staysphere_webhook_secret_key";

  it("should verify a valid timestamped HMAC-SHA256 signature (t=...,v1=...)", () => {
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      event_id: "evt_test_123",
      event: "order.paid",
      data: {
        order_id: "ORD_TEST_999",
        client_order_id: "RCPT-1001",
        amount: "5000.00",
        status: "paid",
        utr: "412345678901",
      },
    });

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${now}.${body}`)
      .digest("hex");

    const header = `t=${now},v1=${signature}`;
    const isValid = verifyUpiWebhookSignature(body, header);
    expect(isValid).toBe(true);
  });

  it("should reject expired webhook timestamp (>5 minutes old replay attack)", () => {
    const sixMinutesAgo = Math.floor(Date.now() / 1000) - 360;
    const body = JSON.stringify({ event: "order.paid" });

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${sixMinutesAgo}.${body}`)
      .digest("hex");

    const header = `t=${sixMinutesAgo},v1=${signature}`;
    const isValid = verifyUpiWebhookSignature(body, header);
    expect(isValid).toBe(false);
  });

  it("should reject tampered webhook body", () => {
    const now = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({ event: "order.paid" });
    const tamperedBody = JSON.stringify({ event: "order.paid", amount: "0.01" });

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(`${now}.${body}`)
      .digest("hex");

    const header = `t=${now},v1=${signature}`;
    const isValid = verifyUpiWebhookSignature(tamperedBody, header);
    expect(isValid).toBe(false);
  });

  it("should reject malformed signature header", () => {
    const body = JSON.stringify({ event: "order.paid" });
    expect(verifyUpiWebhookSignature(body, "invalid_header")).toBe(false);
    expect(verifyUpiWebhookSignature(body, null)).toBe(false);
  });

  it("should generate simulated dev orders when gateway is not active", async () => {
    const order = await createUpiOrder({
      amount: 1500,
      clientOrderId: `RCPT-TEST-${Date.now()}`,
      note: "Test advance",
    });

    expect(order.orderId).toBeDefined();
    expect(order.paymentUrl).toContain("/pay/");
    expect(order.status).toBe("pending");

    const status = await getUpiOrder(order.orderId);
    expect(status.status).toBe("paid");
  });
});
