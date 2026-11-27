"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  X,
  Smartphone,
  ShieldCheck,
  Clock,
  Info,
  RefreshCw,
} from "lucide-react";

interface UpiCheckoutButtonProps {
  amount: number;
  paymentType: "BOOKING_ADVANCE" | "SECURITY_DEPOSIT" | "MONTHLY_RENT";
  bookingId?: string;
  invoiceId?: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess?: (paymentResult: any) => void;
  className?: string;
  buttonText?: string;
}

type VerifyStatus = "idle" | "polling" | "paid" | "pending" | "review" | "expired" | "failed";

export default function UpiCheckoutButton({
  amount,
  paymentType,
  bookingId,
  invoiceId,
  userEmail = "tenant@staysphere.in",
  userName = "Valued Tenant",
  userPhone = "9876543210",
  onSuccess,
  className = "",
  buttonText,
}: UpiCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Active Order details from UPI Gateway
  const [orderData, setOrderData] = useState<{
    orderId: string;
    clientOrderId?: string;
    paymentUrl: string;
    upiIntent?: string;
    amount: number;
  } | null>(null);

  // Modal interactions
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(900); // 15:00 minutes
  const [desktopAppNotice, setDesktopAppNotice] = useState<string | null>(null);

  // Platform detection (safe for SSR)
  const [platform, setPlatform] = useState<{
    isMobile: boolean;
    isAndroid: boolean;
    isIOS: boolean;
    isNative: boolean;
  }>({ isMobile: false, isAndroid: false, isIOS: false, isNative: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isNative = Boolean((window as any).Capacitor?.isNativePlatform?.());
    setPlatform({
      isMobile: isAndroid || isIOS || isNative,
      isAndroid,
      isIOS,
      isNative,
    });
  }, []);

  // Verification status state machine
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyMessage, setVerifyMessage] = useState<string>("");
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  // Merchant VPA for dynamic UPI QR
  const merchantVpa = process.env.NEXT_PUBLIC_UPI_ID || "sekhar.parida@ptaxis";
  const merchantName = process.env.NEXT_PUBLIC_UPI_NAME || "Sekhar Parida";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Countdown timer for order expiry ──────────────────────────────────────
  useEffect(() => {
    if (!showModal || timeLeft <= 0 || success) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev > 0 ? prev - 1 : 0;
        if (next === 0) setVerifyStatus("expired");
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showModal, timeLeft, success]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Core verify call (shared by manual & auto-poll) ───────────────────────
  const callVerify = useCallback(
    async (orderId: string, utr?: string): Promise<VerifyStatus> => {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            upiOrderReference: orderId,
            bookingId,
            invoiceId,
            utr: utr?.trim() || undefined,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) return "paid";

        // Backend sends { status, error } for non-paid states
        const backendStatus: string = data.status || "";
        if (backendStatus === "review") return "review";
        if (backendStatus === "failed") return "failed";
        if (backendStatus === "expired") return "expired";
        return "pending";
      } catch {
        return "pending";
      }
    },
    [bookingId, invoiceId]
  );

  // ── Auto-polling: every 8 s while modal open, timer alive, not settled ────
  useEffect(() => {
    if (!showModal || !orderData || success) return;
    if (verifyStatus === "paid" || verifyStatus === "expired" || verifyStatus === "failed") return;

    const startPolling = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(async () => {
        if (!isMountedRef.current) return;
        const status = await callVerify(orderData.orderId);
        if (!isMountedRef.current) return;

        if (status === "paid") {
          clearInterval(pollIntervalRef.current!);
          setVerifyStatus("paid");
          setSuccess(true);
          setTimeout(() => {
            if (!isMountedRef.current) return;
            setShowModal(false);
            onSuccess?.({ autoVerified: true });
          }, 1500);
        } else if (status === "failed" || status === "expired") {
          clearInterval(pollIntervalRef.current!);
          setVerifyStatus(status);
        }
        // pending / review — keep polling
      }, 8000);
    };

    startPolling();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [showModal, orderData, success, verifyStatus, callVerify, onSuccess]);

  // ── Create order ──────────────────────────────────────────────────────────
  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const sanitizedPhone = userPhone
        ? userPhone.replace(/\D/g, "").slice(-10)
        : "9876543210";

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentType,
          bookingId,
          invoiceId,
          customerMobile: sanitizedPhone || "9876543210",
        }),
      });

      const data = await orderRes.json();
      if (!orderRes.ok) throw new Error(data.error || "Failed to create payment order.");

      setOrderData(data);
      setTimeLeft(900);
      setVerifyStatus("idle");
      setVerifyMessage("");
      setDesktopAppNotice(null);
      setUtrInput("");
      setSuccess(false);
      setShowModal(true);

      // On mobile browsers or Capacitor Android/iOS app, automatically launch available UPI payment app
      if (typeof window !== "undefined") {
        const ua = navigator.userAgent || "";
        const isAndroid = /Android/i.test(ua);
        const isMobileOrNative =
          isAndroid ||
          /iPhone|iPad|iPod/i.test(ua) ||
          Boolean((window as any).Capacitor?.isNativePlatform?.());

        if (isMobileOrNative) {
          const cleanRef = String(data.orderId || "ORDREF").replace(/[^a-zA-Z0-9_-]/g, "");
          const query = `pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(
            merchantName
          )}&am=${Number(data.amount || amount).toFixed(2)}&cu=INR&tr=${encodeURIComponent(
            cleanRef
          )}&tn=${encodeURIComponent(`StaySphere ${paymentType.replace(/_/g, " ")}`)}`;
          const launchUri = data.upiIntent || `upi://pay?${query}`;
          try {
            const link = document.createElement("a");
            link.href = launchUri;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch {
            try {
              window.location.href = launchUri;
            } catch {
              // Modal remains open with one-tap GPay / PhonePe / Paytm buttons
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Payment initialization failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Manual verify (triggered by button click) ─────────────────────────────
  const handleVerify = async () => {
    if (!orderData || verifyStatus === "expired") return;
    setVerifyStatus("polling");
    setVerifyMessage("");

    const status = await callVerify(orderData.orderId, utrInput);

    if (!isMountedRef.current) return;
    setVerifyStatus(status);

    switch (status) {
      case "paid":
        setSuccess(true);
        // Stop the background poll
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setTimeout(() => {
          if (!isMountedRef.current) return;
          setShowModal(false);
          onSuccess?.({ manualVerified: true });
        }, 1500);
        break;
      case "review":
        setVerifyMessage(
          "Your UTR has been submitted for manual review. The property manager will confirm within 24 hours."
        );
        break;
      case "failed":
        setVerifyMessage("This payment was declined or cancelled. Please start a new payment.");
        break;
      case "expired":
        setVerifyMessage("This order has expired. Please close and start a new payment.");
        break;
      default:
        setVerifyMessage("Payment not detected yet. Please complete the UPI transfer and try again.");
    }
  };

  // ── Build UPI intent & QR ─────────────────────────────────────────────────
  const orderRefId = (orderData?.orderId || "ORDREF").replace(/[^a-zA-Z0-9_-]/g, "");
  const upiQuery = `pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${amount.toFixed(2)}&cu=INR&tr=${encodeURIComponent(orderRefId)}&tn=${encodeURIComponent(
    `StaySphere ${paymentType.replace(/_/g, " ")}`
  )}`;
  const upiIntentUri = orderData?.upiIntent || `upi://pay?${upiQuery}`;

  // Platform-specific deep links:
  // Android Chrome & WebView support `intent://pay?...#Intent;scheme=upi;package=...;end;`
  // iOS Safari supports custom app schemes (`tez://`, `phonepe://`, `paytmmp://`, `bhim://`)
  const queryPart = upiIntentUri.includes("?") ? upiIntentUri.split("?")[1] : upiQuery;
  const buildAppUri = (androidPkg: string, iosScheme: string) => {
    if (platform.isAndroid || platform.isNative) {
      return `intent://pay?${queryPart}#Intent;scheme=upi;package=${androidPkg};end;`;
    }
    if (platform.isIOS) {
      return `${iosScheme}${queryPart}`;
    }
    return upiIntentUri;
  };

  const upiApps = [
    {
      name: "Google Pay",
      short: "GPay",
      href: buildAppUri("com.google.android.apps.nbu.paisa.user", "tez://upi/pay?"),
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    },
    {
      name: "PhonePe",
      short: "PhonePe",
      href: buildAppUri("com.phonepe.app", "phonepe://pay?"),
      color: "text-purple-700",
      bg: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    },
    {
      name: "Paytm",
      short: "Paytm",
      href: buildAppUri("net.one97.paytm", "paytmmp://pay?"),
      color: "text-sky-700",
      bg: "bg-sky-50 border-sky-200 hover:bg-sky-100",
    },
    {
      name: "BHIM",
      short: "BHIM",
      href: buildAppUri("in.org.npci.upiapp", "bhim://upi/pay?"),
      color: "text-orange-700",
      bg: "bg-orange-50 border-orange-200 hover:bg-orange-100",
    },
  ];

  const handleUpiAppClick = (e: React.MouseEvent<HTMLAnchorElement>, appName: string) => {
    if (!platform.isMobile) {
      e.preventDefault();
      setDesktopAppNotice(
        `Direct ${appName} app launch works on mobile phones. On desktop, scan the QR code with ${appName} on your phone.`
      );
      return;
    }
    setDesktopAppNotice(null);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(
    upiIntentUri
  )}`;

  // ── Status banner helpers ─────────────────────────────────────────────────
  const StatusBanner = () => {
    if (verifyStatus === "idle" || verifyStatus === "polling" || verifyStatus === "paid") return null;

    if (verifyStatus === "pending") {
      return (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
          <span>{verifyMessage || "Payment not detected yet. Wait a moment and try again."}</span>
        </div>
      );
    }

    if (verifyStatus === "review") {
      return (
        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
          <span>{verifyMessage}</span>
        </div>
      );
    }

    if (verifyStatus === "failed" || verifyStatus === "expired") {
      return (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
          <span>{verifyMessage}</span>
        </div>
      );
    }

    return null;
  };

  const isVerifyDisabled =
    verifyStatus === "polling" ||
    verifyStatus === "paid" ||
    verifyStatus === "failed" ||
    verifyStatus === "expired" ||
    timeLeft === 0;

  return (
    <div className="w-full">
      {success && !showModal ? (
        <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Payment Verified &amp; Confirmed!</span>
        </div>
      ) : (
        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 cursor-pointer ${className}`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating UPI QR Code...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>{buttonText || `Pay ₹${amount.toLocaleString("en-IN")} via UPI`}</span>
            </>
          )}
        </button>
      )}

      {error && !showModal && (
        <div className="mt-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ── UPI CHECKOUT MODAL ───────────────────────────────────────────── */}
      {showModal && orderData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl ring-1 ring-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-5 relative my-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              title="Close payment window"
            >
              <X className="w-4 h-4" />
            </button>

            {/* ── Left Column: Summary & Timer (Dark Navy) ─────────────── */}
            <div className="md:col-span-2 bg-slate-950 text-white p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-sm text-white shadow-md">
                    SS
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Paying to</div>
                    <div className="font-bold text-sm text-white truncate">{merchantName}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Amount</div>
                  <div className="text-3xl sm:text-4xl font-black text-white tabular-nums tracking-tight mt-0.5">
                    ₹{amount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-blue-300 font-medium mt-1">
                    {paymentType.replace(/_/g, " ")}
                  </div>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Order Ref</span>
                    <span className="font-mono text-slate-200 text-[11px] truncate max-w-[120px]">
                      {orderData.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Payee VPA</span>
                    <span className="font-mono text-slate-200 text-[11px]">{merchantVpa}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Customer</span>
                    <span className="text-slate-200 text-[11px] truncate max-w-[120px]">{userName}</span>
                  </div>
                </div>
              </div>

              {/* Expiry Countdown */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-3 relative z-10">
                <div className="w-11 h-11 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  {timeLeft > 0 ? (
                    <>
                      <div className="text-xs font-bold text-slate-200">
                        Expires in:{" "}
                        <span className="font-mono text-amber-400">{formatTimer(timeLeft)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Complete payment before timer expires</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs font-bold text-rose-400">Order Expired</div>
                      <div className="text-[10px] text-slate-400">Please start a new payment</div>
                    </>
                  )}
                </div>
              </div>

              {/* Auto-polling indicator */}
              {verifyStatus !== "paid" && verifyStatus !== "failed" && verifyStatus !== "expired" && timeLeft > 0 && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Auto-detecting payment…</span>
                </div>
              )}
            </div>

            {/* ── Right Column: QR Code & UPI Apps (White) ─────────────── */}
            <div className="md:col-span-3 p-5 sm:p-7 flex flex-col justify-between space-y-4">
              {success ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Payment Successful!</h3>
                  <p className="text-xs text-slate-600 max-w-xs">
                    Your payment of ₹{amount.toLocaleString("en-IN")} was verified. Redirecting…
                  </p>
                </div>
              ) : (
                <>
                  {/* Direct Clickable UPI App Launchers (Primary on Mobile) */}
                  <div className="space-y-2">
                    <div className="text-center">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {platform.isMobile ? "Tap to Open UPI App & Pay" : "Scan & Pay with any UPI App"}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {platform.isMobile
                          ? "Select Google Pay, PhonePe, Paytm, or BHIM to pay instantly"
                          : "Open GPay, PhonePe, Paytm, or BHIM on your phone to scan"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {upiApps.map((app) => (
                        <a
                          key={app.name}
                          href={app.href}
                          onClick={(e) => handleUpiAppClick(e, app.name)}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all text-center flex items-center justify-center gap-1 shadow-xs ${app.bg} ${app.color}`}
                        >
                          <span>{app.short}</span>
                        </a>
                      ))}
                    </div>

                    {/* Direct Mobile UPI Intent Button */}
                    <a
                      href={upiIntentUri}
                      onClick={(e) => handleUpiAppClick(e, "your UPI app")}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open Any UPI App on This Phone</span>
                    </a>

                    {desktopAppNotice && (
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
                        <span>{desktopAppNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* Dynamic QR Code */}
                  <div className="relative mx-auto p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImageUrl}
                      alt="UPI Payment QR Code"
                      width={180}
                      height={180}
                      className="w-40 h-40 rounded-lg object-contain"
                    />
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified NPCI Dynamic UPI QR</span>
                    </div>
                  </div>

                  {/* Copy VPA Row */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="text-left">
                      <div className="text-[10px] text-slate-400 font-semibold">UPI ID</div>
                      <div className="font-mono text-slate-800 text-[11px] font-bold">{merchantVpa}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(merchantVpa);
                        setCopiedVpa(true);
                        setTimeout(() => setCopiedVpa(false), 2000);
                      }}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors"
                    >
                      {copiedVpa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedVpa ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  {/* Optional UTR input */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      UTR / Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="e.g. 423984710293 (12-digit bank UTR)"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-blue-500"
                    />
                  </div>

                  {/* Status Banner (pending/review/failed/expired) */}
                  <StatusBanner />

                  {/* Verify Button */}
                  {timeLeft > 0 && verifyStatus !== "failed" ? (
                    <button
                      onClick={handleVerify}
                      disabled={isVerifyDisabled}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition-all cursor-pointer"
                    >
                      {verifyStatus === "polling" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying with UPI Gateway…</span>
                        </>
                      ) : verifyStatus === "pending" ? (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Check Again</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>I&apos;ve completed the payment — Verify Now</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-slate-200 text-slate-500 shadow-sm cursor-not-allowed"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{verifyStatus === "failed" ? "Payment Failed" : "Order Expired"}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
