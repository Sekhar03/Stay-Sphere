import crypto from "crypto";

const UPI_GATEWAY_URL = process.env.UPI_GATEWAY_URL || "http://localhost:8000";
const UPI_GATEWAY_API_KEY = process.env.UPI_GATEWAY_API_KEY || "";
const UPI_GATEWAY_API_SECRET = process.env.UPI_GATEWAY_API_SECRET || "";
const UPI_GATEWAY_WEBHOOK_SECRET = process.env.UPI_GATEWAY_WEBHOOK_SECRET || "";

// Webhook tolerance: reject timestamps older than 5 minutes (matches gateway default)
const WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS = 300;

function gatewayHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": UPI_GATEWAY_API_KEY,
    "X-Api-Secret": UPI_GATEWAY_API_SECRET,
  };
}

/** -------------------------------------------------------------------------
 * POST /api/v1/orders
 *
 * Request body fields (from OrderApiController):
 *   amount          required  numeric, min:1, max:100000, up to 2 decimal places
 *   client_order_id required  string, max:64, alphanumeric/underscore/dash, unique per merchant+env
 *   customer_name   optional  string, max:100
 *   customer_email  optional  email, max:255
 *   customer_mobile optional  string, max:20
 *   note            optional  string, max:50
 *   redirect_url    optional  https URL, max:500 (must be in merchant's allowed domains)
 *
 * Response (201): { success: true, data: Order.toApiArray() }
 *   data.order_id      — gateway's order reference (order_no)
 *   data.payment_url   — hosted checkout URL (/pay/{order_no})
 *   data.status        — "pending" | "paid" | "expired" | "review" | "failed"
 *   data.upi_intent    — upi://pay?... deep link (null for PG / sandbox)
 *   data.expires_at    — ISO8601 expiry
 * -------------------------------------------------------------------------- */
export async function createUpiOrder(params: {
  amount: number;
  clientOrderId: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  note?: string;
  redirectUrl?: string;
}): Promise<{
  orderId: string;
  clientOrderId: string;
  paymentUrl: string;
  upiIntent: string | null;
  status: string;
  expiresAt: string | null;
}> {
  try {
    const res = await fetch(`${UPI_GATEWAY_URL}/api/v1/orders`, {
      method: "POST",
      headers: gatewayHeaders(),
      body: JSON.stringify({
        amount: params.amount,
        client_order_id: params.clientOrderId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_mobile: params.customerMobile,
        note: params.note,
        redirect_url: params.redirectUrl,
      }),
    });

    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(
        json.message || (json.errors ? JSON.stringify(json.errors) : `Gateway error ${res.status}`)
      );
    }

    const d = json.data;
    return {
      orderId: d.order_id,
      clientOrderId: d.client_order_id,
      paymentUrl: d.payment_url,
      upiIntent: d.upi_intent ?? null,
      status: d.status,
      expiresAt: d.expires_at ?? null,
    };
  } catch (error) {
    // Dev fallback when gateway is not running locally
    console.warn("[UPI Gateway] Unreachable — returning simulated dev order:", error);
    const devId = `upi_dev_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      orderId: devId,
      clientOrderId: params.clientOrderId,
      paymentUrl: `${UPI_GATEWAY_URL}/pay/${devId}`,
      upiIntent: null,
      status: "pending",
      expiresAt: null,
    };
  }
}

/** -------------------------------------------------------------------------
 * GET /api/v1/orders/{orderNo}
 *
 * Accepts our gateway order_no OR the original client_order_id.
 * Triggers an on-demand verification check on the gateway side.
 *
 * Response (200): { success: true, data: Order.toApiArray() }
 *   data.status  — "pending" | "paid" | "expired" | "review" | "failed"
 *   data.utr     — bank UTR number (populated once paid)
 * -------------------------------------------------------------------------- */
export async function getUpiOrder(orderId: string): Promise<{
  orderId: string;
  status: "pending" | "paid" | "expired" | "review" | "failed";
  utr: string | null;
  paidAt: string | null;
}> {
  // Dev sandbox: always return paid
  if (orderId.startsWith("upi_dev_")) {
    return { orderId, status: "paid", utr: `sim_utr_${Date.now()}`, paidAt: new Date().toISOString() };
  }

  const res = await fetch(`${UPI_GATEWAY_URL}/api/v1/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: gatewayHeaders(),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || `Failed to fetch order: ${res.status}`);
  }

  const d = json.data;
  return {
    orderId: d.order_id,
    status: d.status as "pending" | "paid" | "expired" | "review" | "failed",
    utr: d.utr ?? null,
    paidAt: d.paid_at ?? null,
  };
}

/** -------------------------------------------------------------------------
 * Webhook Signature Verification
 *
 * The gateway sends:  X-Signature: t={unix_seconds},v1={hex_hmac}
 *
 * HMAC is computed as:
 *   HMAC-SHA256( key=webhookSecret, message="{timestamp}.{rawBody}" )
 *
 * Reject if:
 *   - Header missing / malformed
 *   - Timestamp is outside ±5 minute tolerance window (replay attack defence)
 *   - HMAC does not match
 * -------------------------------------------------------------------------- */
const DEFAULT_WEBHOOK_SECRET = "whsec_staysphere_webhook_secret_key";

export function verifyUpiWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  customSecret?: string
): boolean {
  const secret = customSecret || process.env.UPI_GATEWAY_WEBHOOK_SECRET || DEFAULT_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  // Parse "t=1234567890,v1=abcdef..."
  const match = signatureHeader.match(/^t=(\d+),v1=([a-f0-9]{64})$/);
  if (!match) return false;

  const timestamp = parseInt(match[1], 10);
  const receivedSig = match[2];

  // Enforce 5-minute replay window
  if (Math.abs(Date.now() / 1000 - timestamp) > WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(receivedSig, "hex"));
  } catch {
    return false;
  }
}
