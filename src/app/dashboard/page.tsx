"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Home,
  CalendarCheck,
  CreditCard,
  Bell,
  Wrench,
  Star,
  User,
  AlertCircle,
  CheckCircle,
  FileText,
  Clock,
  Plus,
  Send,
  Bed,
  MapPin,
  Shield,
  Loader2,
  Check,
  LogOut,
  Download,
  Phone,
  Mail,
  Building,
  Sparkles,
  Zap,
  UtensilsCrossed,
  Coffee,
  Share2,
  Camera,
  QrCode,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import UpiCheckoutButton from "@/components/booking/RazorpayCheckoutButton";
import DocumentUploader from "@/components/ui/DocumentUploader";
import { saveOfflinePass, registerPushNotifications } from "@/lib/mobile/capacitorClient";
import { toast } from "sonner";

export default function TenantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Save active confirmed stay to Offline Tenant Pass & register Capacitor push if native
  useEffect(() => {
    registerPushNotifications();
  }, []);

  useEffect(() => {
    const confirmed = bookings.find((b: any) => b.status === "CONFIRMED");
    if (confirmed) {
      saveOfflinePass({
        bookingReference: confirmed.bookingReference || confirmed.id,
        propertyName: confirmed.property?.name || "StaySphere PG",
        propertyAddress: confirmed.property?.address?.locality || "",
        roomNumber: confirmed.room?.roomNumber,
        bedNumber: confirmed.bed?.bedNumber,
        monthlyRent: Number(confirmed.room?.monthlyRent || 0),
        moveInDate: confirmed.checkInDate,
      });
    }
  }, [bookings]);

  const handleDownloadAgreement = (b: any) => {
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) {
      toast.error("Please allow pop-ups to view/print your rental agreement.");
      return;
    }
    const rent = Number(b.room?.monthlyRent || 8500).toLocaleString("en-IN");
    const deposit = Number(b.property?.securityDeposit || 10000).toLocaleString("en-IN");
    const noticeDays = b.property?.noticePeriodDays || 30;
    const checkIn = b.checkInDate ? new Date(b.checkInDate).toLocaleDateString("en-IN") : "—";
    win.document.write(`<!DOCTYPE html>
<html><head><title>StaySphere Rental Agreement - ${b.bookingReference || b.id}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; max-width: 760px; margin: auto; }
  h1 { font-size: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
  .meta { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .label { color: #64748b; }
  h2 { font-size: 14px; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.04em; color: #334155; }
  ul { font-size: 13px; padding-left: 18px; }
  .sig { display: flex; justify-content: space-between; margin-top: 48px; font-size: 13px; }
  @media print { button { display: none; } }
</style></head><body>
  <button onclick="window.print()" style="float:right;padding:8px 14px;background:#0f172a;color:#fff;border:none;border-radius:6px;cursor:pointer;">Print / Save PDF</button>
  <h1>STAYSPHERE DIGITAL PG RENTAL AGREEMENT</h1>
  <div class="meta">
    <div class="row"><span class="label">Booking Reference:</span><strong>${b.bookingReference || b.id}</strong></div>
    <div class="row"><span class="label">Tenant Name:</span><strong>${currentUser?.name || "Resident"} (${currentUser?.email || ""})</strong></div>
    <div class="row"><span class="label">Property:</span><strong>${b.property?.name || "StaySphere Property"}</strong></div>
    <div class="row"><span class="label">Room / Bed Allocation:</span><strong>Room ${b.room?.roomNumber || "-"} · Bed ${b.bed?.bedNumber || "-"}</strong></div>
    <div class="row"><span class="label">Move-in Date:</span><strong>${checkIn}</strong></div>
    <div class="row"><span class="label">Monthly Rent:</span><strong>₹${rent} / month</strong></div>
    <div class="row"><span class="label">Security Deposit:</span><strong>₹${deposit}</strong></div>
    <div class="row"><span class="label">Notice Period:</span><strong>${noticeDays} days prior written notice</strong></div>
  </div>
  <h2>Standard Terms &amp; House Rules</h2>
  <ul>
    <li>Monthly rent is due on or before the 5th of every calendar month via StaySphere UPI/Online Portal.</li>
    <li>Security deposit is refundable within 7 working days of checkout after settling electricity &amp; room inspection dues.</li>
    <li>Resident agrees to provide at least ${noticeDays} days notice via the StaySphere Dashboard before vacating.</li>
    <li>Quiet hours, visitor policies, and property safety guidelines apply throughout the stay.</li>
  </ul>
  <div class="sig">
    <div>________________________<br/>Resident Signature</div>
    <div>________________________<br/>Authorized Property Manager</div>
  </div>
</body></html>`);
    win.document.close();
  };

  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "accommodation"
    | "bookings"
    | "rent"
    | "electricity"
    | "mess"
    | "notifications"
    | "maintenance"
    | "reviews"
    | "profile"
  >("dashboard");

  // Feature States (Online Rent, Electricity Split, Meal Menu)
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);
  const [electricityPaid, setElectricityPaid] = useState(false);
  const [showMeterPhotoModal, setShowMeterPhotoModal] = useState(false);
  const [selectedMenuDay, setSelectedMenuDay] = useState(10);
  const [mealRating, setMealRating] = useState<number>(4);
  const [skipMealToday, setSkipMealToday] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Instant UPI Payment Options in Portal
  const [customPayAmount, setCustomPayAmount] = useState<number>(8500);
  const [customPayType, setCustomPayType] = useState<
    "MONTHLY_RENT" | "SECURITY_DEPOSIT" | "BOOKING_ADVANCE"
  >("MONTHLY_RENT");
  const [showCustomPay, setShowCustomPay] = useState(false);

  const triggerToast = (msg: string) => {
    toast(msg);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // New Ticket State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState("PLUMBING");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPhoto, setTicketPhoto] = useState<string | null>("/images/meter.jpg");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  // Notice Period State
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeReason, setNoticeReason] = useState("Job Relocation");
  const [noticeRefundUpi, setNoticeRefundUpi] = useState("");
  const [noticeNotes, setNoticeNotes] = useState("");
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [noticeInfo, setNoticeInfo] = useState<any>(null);

  // Resident KYC Verification State
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycIdType, setKycIdType] = useState("Aadhaar Card");
  const [kycIdNumber, setKycIdNumber] = useState("");
  const [kycEmergencyContact, setKycEmergencyContact] = useState("");
  const [kycDocUrl, setKycDocUrl] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycStatusData, setKycStatusData] = useState<any>(null);

  // Step 16: Move-In Checklist States
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [depositPaid, setDepositPaid] = useState(false);

  // New Review State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Step F1: Booking Cancellation State
  const [cancelBookingTarget, setCancelBookingTarget] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("Change of plans");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const handleCancelBooking = async () => {
    if (!cancelBookingTarget) return;
    setCancelSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: cancelBookingTarget.id,
          status: "CANCELLED",
          remarks: cancelReason,
        }),
      });
      if (res.ok) {
        triggerToast("Booking cancelled. Bed has been released back to available.");
        setCancelBookingTarget(null);
        loadDashboardData();
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to cancel booking");
      }
    } catch {
      triggerToast("Error during booking cancellation");
    } finally {
      setCancelSubmitting(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [rentRes, ticketRes, bookingsRes, annRes, meRes, noticeRes, kycRes] = await Promise.all([
        fetch("/api/rent/dues"),
        fetch("/api/maintenance"),
        fetch("/api/bookings"),
        fetch("/api/announcements"),
        fetch("/api/auth/me"),
        fetch("/api/tenant/notice"),
        fetch("/api/user/kyc"),
      ]);

      if (rentRes.status === 401) {
        router.push("/login?redirect=/dashboard");
        return;
      }

      if (rentRes.ok) {
        const rentData = await rentRes.json();
        setProfile(rentData.tenantProfile);
      }
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        setTickets(ticketData.tickets || []);
      }
      if (bookingsRes.ok) {
        const bookData = await bookingsRes.json();
        setBookings(bookData.bookings || []);
      }
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData.announcements || []);
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
      if (noticeRes.ok) {
        const nData = await noticeRes.json();
        setNoticeInfo(nData);
      }
      if (kycRes.ok) {
        const kData = await kycRes.json();
        setKycStatusData(kData);
        if (kData.profile) {
          setProfile((prev: any) => ({ ...prev, ...kData.profile }));
          setKycIdType(kData.profile.idProofType || "Aadhaar Card");
          setKycIdNumber(kData.profile.idProofNumber || "");
          setKycEmergencyContact(kData.profile.emergencyContact || "");
          setKycDocUrl(kData.profile.idProofDocumentUrl || "");
        }
      }
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycIdNumber.trim()) {
      triggerToast("Please enter your Government ID proof number");
      return;
    }
    setKycSubmitting(true);
    try {
      const res = await fetch("/api/user/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProofType: kycIdType,
          idProofNumber: kycIdNumber.trim(),
          emergencyContact: kycEmergencyContact.trim() || null,
          idProofDocumentUrl: kycDocUrl.trim() || null,
        }),
      });
      if (res.ok) {
        triggerToast("KYC documents submitted for Admin clearance");
        setShowKycModal(false);
        loadDashboardData();
      } else {
        const d = await res.json();
        triggerToast(d.error || "Failed to submit KYC");
      }
    } catch {
      triggerToast("Error submitting KYC");
    } finally {
      setKycSubmitting(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitting(true);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: profile?.currentBed?.room?.property?.id,
          category: ticketCategory,
          title: ticketTitle,
          description: ticketDescription,
          photos: ticketPhoto ? [ticketPhoto] : [],
        }),
      });
      if (res.ok) {
        setTicketTitle("");
        setTicketDescription("");
        setShowNewTicketModal(false);
        setTicketSuccess("Complaint submitted successfully! Seedha manager & owner tak gaya.");
        triggerToast("Complaint submitted successfully!");
        setTimeout(() => setTicketSuccess(null), 4000);
        loadDashboardData();
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to submit ticket");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error submitting complaint");
    } finally {
      setTicketSubmitting(false);
    }
  };

  const handleServeNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeSubmitting(true);
    try {
      const res = await fetch("/api/tenant/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: noticeReason,
          refundUpiOrBank: noticeRefundUpi,
          notes: noticeNotes,
        }),
      });
      if (res.ok) {
        setShowNoticeModal(false);
        triggerToast("Notice period successfully served! Owner & Manager notified.");
        loadDashboardData();
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to serve notice");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error submitting notice");
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.currentBed?.room?.property?.id) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: profile.currentBed.room.property.id,
          rating: Number(reviewRating),
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewComment("");
        setShowReviewModal(false);
        alert("Thank you! Your review has been submitted.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "accommodation", label: "My Accommodation", icon: Home },
    { id: "bookings", label: "My Bookings", icon: CalendarCheck },
    { id: "rent", label: "Rent & Payments", icon: CreditCard },
    { id: "electricity", label: "Electricity & Sub-meter", icon: Zap },
    { id: "mess", label: "Mess & Food Menu", icon: UtensilsCrossed },
    { id: "maintenance", label: "Maintenance & Complaints", icon: Wrench },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "profile", label: "My Profile", icon: User },
  ];

  const currentStay = profile?.currentBed || profile?.allocations?.[0]?.bed;
  const property = currentStay?.room?.property;
  const room = currentStay?.room;

  // Find latest unpaid rent
  const unpaidRent = profile?.rentSchedules?.find((s: any) => s.status !== "PAID");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Sticky Top Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white/95 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
            SS
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
              StaySphere
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {currentUser?.name || "Resident"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unpaidRent && (
            <button
              type="button"
              onClick={() => setActiveTab("rent")}
              className="px-2.5 py-1 rounded-full text-[11px] bg-amber-100 text-amber-800 font-bold"
            >
              Due ₹{unpaidRent.amount}
            </button>
          )}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle dashboard menu"
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 btn-press"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Quick Tab Strip */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id as any);
                setMobileNavOpen(false);
              }}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors btn-press ${
                isActive
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
              {item.id === "rent" && unpaidRent && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mobile Slide-Over Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Tenant Sidebar (Drawer on mobile, fixed left column on desktop) */}
      <aside
        className={`${
          mobileNavOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 flex shadow-2xl"
            : "hidden md:flex md:w-64"
        } bg-white border-r border-slate-200 flex-col shrink-0`}
      >
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm">
                SS
              </div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight">StaySphere</span>
            </div>
            <div className="mt-2 text-[11px] font-semibold text-slate-500">
              Tenant Account • {currentUser?.name || "Customer"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any);
                  setMobileNavOpen(false);
                }}
                className={`nav-item btn-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span className="truncate">{item.label}</span>
                {item.id === "rent" && unpaidRent && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                    Due
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Tenant Body */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500">
              {property?.name ? `Active Resident at ${property.name}` : "StaySphere Resident Dashboard"}
            </p>
          </div>

          {unpaidRent && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                Upcoming Rent Due: ₹{unpaidRent.amount}
              </span>
            </div>
          )}
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading accommodation records...</span>
            </div>
          ) : (
            <div key={activeTab} className="tab-content">
              {/* TAB 1: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Accommodation Quick Card */}
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-200 bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">
                        Current PG Accommodation
                      </span>
                      <h2 className="text-2xl font-black">
                        {property?.name || "No Active Stay Allocated"}
                      </h2>
                      <div className="text-xs text-blue-100 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{property?.address?.locality || "Bengaluru"}, {property?.address?.city || "Karnataka"}</span>
                      </div>
                      {room && (
                        <div className="flex items-center gap-4 text-xs font-semibold pt-1">
                          <span>Room No: {room.roomNumber}</span>
                          <span>•</span>
                          <span>Bed: {currentStay?.bedNumber}</span>
                          <span>•</span>
                          <span>{room.sharingType} Sharing</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 text-center">
                      <div className="text-[10px] uppercase font-bold text-blue-200">Monthly Rent</div>
                      <div className="text-2xl font-black mt-1">₹{room?.monthlyRent || 0}</div>
                      <div className="text-[10px] text-blue-200 mt-0.5">Due by 5th of each month</div>
                    </div>
                  </div>

                  {/* Step 16: Before Move-in Checklist */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                            Move-in Checklist
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            {[Boolean(profile?.idProofNumber || profile?.isKycVerified), agreementAccepted, depositPaid].filter(Boolean).length} of 3 Complete
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-1">Pre-Arrival Verification & Living Essentials</h3>
                      </div>
                      <span className="text-[11px] text-slate-400">Complete before your check-in date</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* 1. Upload ID / KYC */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        profile?.idProofNumber || profile?.isKycVerified
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-amber-50/70 border-amber-200 text-amber-950"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold">1. Upload ID / KYC</span>
                          {profile?.idProofNumber || profile?.isKycVerified ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"> Complete</span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Required</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mb-3">
                          {profile?.idProofNumber ? `ID: ${profile.idProofNumber}` : "Government identity proof (Aadhaar/PAN)"}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowKycModal(true)}
                          className="w-full py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-bold text-[11px] text-slate-700 shadow-xs cursor-pointer"
                        >
                          {profile?.idProofNumber ? "View / Update KYC" : "Upload ID Proof →"}
                        </button>
                      </div>

                      {/* 2. Rental Agreement */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        agreementAccepted
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-slate-50 border-slate-200 text-slate-900"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold">2. Rental Agreement</span>
                          {agreementAccepted ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"> Accepted</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Pending</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mb-3">
                          {agreementAccepted ? "House rules & coliving policy signed" : "Review house rules, curfew & quiet hours"}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAgreementAccepted(true);
                            triggerToast("Rental agreement accepted & timestamp recorded!");
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-bold text-[11px] text-slate-700 shadow-xs cursor-pointer"
                        >
                          {agreementAccepted ? "Agreement Accepted" : "Accept Agreement →"}
                        </button>
                      </div>

                      {/* 3. Security Deposit */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        depositPaid
                          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          : "bg-blue-50/70 border-blue-200 text-blue-950"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold">3. Security Deposit</span>
                          {depositPaid ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full"> Settled</span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Balance Due</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 mb-3">
                          {depositPaid ? "Deposit is held in escrow" : `Pay ₹${(Number(room?.securityDeposit) || 15000).toLocaleString("en-IN")} refundable deposit`}
                        </p>
                        {depositPaid ? (
                          <div className="text-center py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 rounded-xl">
                            Receipt Generated
                          </div>
                        ) : (
                          <UpiCheckoutButton
                            amount={Number(room?.securityDeposit) || 15000}
                            paymentType="SECURITY_DEPOSIT"
                            buttonText={`Pay ₹${(Number(room?.securityDeposit) || 15000).toLocaleString("en-IN")} Deposit`}
                            className="w-full py-1.5 text-[11px]"
                            onSuccess={() => {
                              setDepositPaid(true);
                              triggerToast("Security deposit paid successfully!");
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Rent Due</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {unpaidRent ? `₹${unpaidRent.amount}` : "Paid In Full"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {unpaidRent ? `Due on ${new Date(unpaidRent.dueDate).toLocaleDateString()}` : "No overdue balance"}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Active Bookings</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">{bookings.length}</div>
                      <div className="text-[11px] text-slate-500 mt-1">Total stay history</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Maintenance Requests</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {tickets.filter((t) => t.status === "OPEN").length}{" "}
                        <span className="text-xs font-semibold text-slate-400">open tickets</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Assigned to PG staff</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab("rent")}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm hover:bg-blue-700"
                    >
                      <CreditCard className="w-4 h-4" /> Pay Rent Online
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("maintenance");
                        setShowNewTicketModal(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-blue-600" /> Raise Complaint
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: MY ACCOMMODATION */}
              {activeTab === "accommodation" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Room & Property Details</h3>
                    <p className="text-xs text-slate-500">Your stay allocation, house rules, and facilities</p>
                  </div>

                  {property ? (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                        <div className="font-bold text-sm text-slate-900">{property.name}</div>
                        <div className="text-slate-600">
                          {property.address?.addressLine1}, {property.address?.locality},{" "}
                          {property.address?.city} - {property.address?.pincode}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-slate-100 rounded-xl">
                        <div>
                          <span className="text-slate-400">Room Number:</span>
                          <div className="font-bold text-sm text-slate-900">{room?.roomNumber}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Bed Number:</span>
                          <div className="font-bold text-sm text-slate-900">{currentStay?.bedNumber}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Sharing:</span>
                          <div className="font-bold text-sm text-slate-900">{room?.sharingType}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Notice Period:</span>
                          <div className="font-bold text-sm text-slate-900">{property.noticePeriodDays || 30} days</div>
                        </div>
                      </div>

                      {/* ONBOARDING & DOCUMENTATION VERIFICATION STATUS */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-slate-900 text-xs">Resident Identity & Stay Onboarding Clearance</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              profile?.isKycVerified
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : profile?.rejectionReason
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {profile?.isKycVerified
                                ? "KYC Approved"
                                : profile?.rejectionReason
                                ? "Verification Rejected "
                                : "Under Admin Review"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowKycModal(true)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                            >
                              {profile?.isKycVerified ? "View / Update KYC" : "Submit KYC Documents"}
                            </button>
                          </div>
                        </div>

                        {profile?.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                            <span className="font-bold">Admin Rejection Feedback:</span> {profile.rejectionReason}. Please re-submit your documents.
                          </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                            <span className="text-slate-500">{profile?.idProofType || "Govt ID Proof"}</span>
                            <span className="font-bold text-slate-900 mt-1 truncate">
                              {profile?.idProofNumber || <span className="text-amber-600 font-normal">Pending submission</span>}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                            <span className="text-slate-500">Emergency Contact</span>
                            <span className="font-bold text-slate-900 mt-1 truncate">
                              {profile?.emergencyContact || <span className="text-slate-400 font-normal">Not provided</span>}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                            <span className="text-slate-500">Document Upload</span>
                            <span className="font-bold mt-1">
                              {profile?.idProofDocumentUrl ? (
                                <a href={profile.idProofDocumentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                  View Uploaded Doc ↗
                                </a>
                              ) : (
                                <span className="text-slate-400 font-normal">No file linked</span>
                              )}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
                            <span className="text-slate-500">Admin Clearance</span>
                            <span className={`font-bold mt-1 ${profile?.isKycVerified ? "text-emerald-600" : "text-amber-600"}`}>
                              {profile?.isKycVerified ? "Verified & Active" : "Pending Approval"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* NOTICE PERIOD LIFECYCLE SECTION */}
                      {noticeInfo?.activeNotice || currentStay?.status === "NOTICE" ? (
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              Notice Period Active
                            </span>
                            <span className="font-bold text-amber-900">
                              Checkout: {noticeInfo?.checkOutDate ? new Date(noticeInfo.checkOutDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "30 days from notice"}
                            </span>
                          </div>
                          <p className="text-amber-800">
                            Your notice period is registered. The property manager and owner have been notified.
                            Move-out room inspection and security deposit settlement will be completed on your checkout date.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-900">Living Lifecycle & Move-Out Notice</div>
                            <div className="text-slate-500 text-[11px]">
                              A standard notice period of {property.noticePeriodDays || 30} days is required before vacating your room.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowNoticeModal(true)}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                          >
                            Serve Notice Period (Notice Dein)
                          </button>
                        </div>
                      )}

                      {property.rules && (
                        <div>
                          <h4 className="font-bold text-slate-900 mb-2">House Rules</h4>
                          <div className="p-4 bg-slate-50 rounded-xl space-y-1 text-slate-600 text-xs">
                            {(() => {
                              try {
                                const rules = JSON.parse(property.rules);
                                return rules.map((r: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    <span>{r}</span>
                                  </div>
                                ));
                              } catch {
                                return <div>{property.rules}</div>;
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">No active accommodation currently allocated.</div>
                  )}
                </div>
              )}

              {/* TAB 3: MY BOOKINGS */}
              {activeTab === "bookings" && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Booking History</h3>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {bookings.map((b) => (
                      <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{b.property?.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Room {b.room?.roomNumber || "-"} • Bed {b.bed?.bedNumber || "-"}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Check-in Date: {new Date(b.checkInDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-center ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {b.status}
                          </span>

                          {b.status !== "CONFIRMED" && b.status !== "CANCELLED" && b.status !== "REJECTED" && (
                            <div className="w-full sm:w-48">
                              <UpiCheckoutButton
                                amount={2000}
                                paymentType="BOOKING_ADVANCE"
                                bookingId={b.id}
                                userEmail={currentUser?.email}
                                userName={currentUser?.name}
                                userPhone={currentUser?.phone}
                                buttonText="Pay ₹2,000 Advance"
                                className="py-2 px-3 text-[11px]"
                                onSuccess={() => {
                                  triggerToast("Advance payment confirmed via UPI! Booking finalized.");
                                  loadDashboardData();
                                }}
                              />
                            </div>
                          )}

                          {b.status === "CONFIRMED" && (
                            <button
                              type="button"
                              onClick={() => handleDownloadAgreement(b)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              Agreement PDF
                            </button>
                          )}

                          {(b.status === "AWAITING_PAYMENT" || b.status === "CONFIRMED") && (
                            <button
                              type="button"
                              onClick={() => setCancelBookingTarget(b)}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: RENT & PAYMENTS */}
              {activeTab === "rent" && (
                <div className="space-y-6">
                  {/* Rent Overview Card */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {currentStay?.room ? `Room ${currentStay.room.roomNumber} · Bed ${currentStay.bedNumber}` : "Room 203 · Bed B"}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">Monthly Rent</span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-1">₹8,500 <span className="text-xs font-normal text-slate-500">/ month</span></div>
                        <div className="text-xs text-slate-500 mt-0.5">Base rent ₹7,500 + Food charges ₹1,000</div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Deposit ₹15,000 deposited</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Due on 5th of every month</span>
                      </div>
                    </div>

                    {/* Auto-Debit Feature (UPI AutoPay) */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span>UPI AutoPay (Auto-debit)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Automatically debit rent on the 1st of every month without manual hassle
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAutoPayEnabled(!autoPayEnabled);
                          triggerToast(!autoPayEnabled ? "UPI AutoPay activated! Auto-debited on 1st." : "UPI AutoPay disabled.");
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          autoPayEnabled ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    {/* Pay Action & UPI Gateway */}
                    {unpaidRent ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-amber-900">November Rent Due: ₹{unpaidRent.amount || 8500}</div>
                          <div className="text-[11px] text-amber-700 mt-0.5">Pay via UPI (GPay/PhonePe), Debit/Credit Card, or Net Banking</div>
                        </div>
                        <UpiCheckoutButton
                          amount={unpaidRent.amount || 8500}
                          paymentType="MONTHLY_RENT"
                          invoiceId={unpaidRent.invoices?.[0]?.id}
                          userEmail={currentUser?.email}
                          userName={currentUser?.name}
                          onSuccess={() => {
                            triggerToast("Rent paid successfully! E-receipt sent to WhatsApp.");
                            loadDashboardData();
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          This Month's Rent is Paid (Receipt sent to WhatsApp)
                        </span>
                        <button
                          onClick={() => setShowReceiptModal("November")}
                          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold shadow-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          View Receipt
                        </button>
                      </div>
                    )}

                    {/* Instant Online UPI Payment Portal */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Direct Online Payment via UPI Gateway
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCustomPay(!showCustomPay)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {showCustomPay ? "Hide Payment Form" : "+ Make Custom Payment"}
                        </button>
                      </div>

                      {showCustomPay && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">
                                Payment Purpose
                              </label>
                              <select
                                value={customPayType}
                                onChange={(e) =>
                                  setCustomPayType(
                                    e.target.value as "MONTHLY_RENT" | "SECURITY_DEPOSIT" | "BOOKING_ADVANCE"
                                  )
                                }
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-blue-500"
                              >
                                <option value="MONTHLY_RENT">Monthly Rent</option>
                                <option value="SECURITY_DEPOSIT">Security Deposit</option>
                                <option value="BOOKING_ADVANCE">Booking Token Advance</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-700 font-bold mb-1">
                                Amount (₹)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={100000}
                                value={customPayAmount}
                                onChange={(e) => setCustomPayAmount(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-blue-500"
                              />
                            </div>
                          </div>

                          {/* Quick Amount Pills */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-500 self-center mr-1">
                              Quick amounts:
                            </span>
                            {[
                              { label: "₹2,000 Advance", val: 2000, type: "BOOKING_ADVANCE" as const },
                              { label: "₹5,000 Part", val: 5000, type: "MONTHLY_RENT" as const },
                              { label: "₹7,500 Base", val: 7500, type: "MONTHLY_RENT" as const },
                              { label: "₹8,500 Full", val: 8500, type: "MONTHLY_RENT" as const },
                              { label: "₹15,000 Deposit", val: 15000, type: "SECURITY_DEPOSIT" as const },
                            ].map((pill) => (
                              <button
                                key={pill.label}
                                type="button"
                                onClick={() => {
                                  setCustomPayAmount(pill.val);
                                  setCustomPayType(pill.type);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  customPayAmount === pill.val && customPayType === pill.type
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>

                          <div className="pt-2">
                            <UpiCheckoutButton
                              amount={customPayAmount}
                              paymentType={customPayType}
                              userEmail={currentUser?.email}
                              userName={currentUser?.name}
                              userPhone={currentUser?.phone}
                              buttonText={`Pay ₹${customPayAmount.toLocaleString("en-IN")} via UPI`}
                              onSuccess={() => {
                                triggerToast("Payment completed and verified via UPI Gateway! Receipt generated.");
                                loadDashboardData();
                                setShowCustomPay(false);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Ledger */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Payment Ledger & Receipts</h3>
                      <span className="text-xs text-slate-400">All payments are GST compliant</span>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {[
                        { month: "November 2026", amount: 8500, date: "02 Nov 2026", status: "PAID" },
                        { month: "October 2026", amount: 8500, date: "01 Oct 2026", status: "PAID" },
                        { month: "September 2026", amount: 8500, date: "01 Sep 2026", status: "PAID" },
                      ].map((rs, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{rs.month}</div>
                            <div className="text-[11px] text-slate-500">Paid on {rs.date} • Base rent + Food charge</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900">₹{rs.amount.toLocaleString("en-IN")}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {rs.status}
                            </span>
                            <button
                              onClick={() => setShowReceiptModal(rs.month)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
                              title="Download & Share Receipt"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ELECTRICITY & SUB-METER SPLIT */}
              {activeTab === "electricity" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Room 203 Electricity Sub-Meter</h3>
                        <p className="text-xs text-slate-500">October reading captured on 31 Oct by property manager</p>
                      </div>
                      <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        Commercial Rate: ₹9 / Unit
                      </span>
                    </div>

                    {/* 3 Reading Boxes */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PREVIOUS</div>
                        <div className="text-xl font-black text-slate-800 mt-1">4,186</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CURRENT</div>
                        <div className="text-xl font-black text-blue-600 mt-1">4,400</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">UNITS CONSUMED</div>
                        <div className="text-xl font-black text-emerald-600 mt-1">214</div>
                      </div>
                    </div>

                    {/* Calculation breakdown */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Units consumed × Rate (214 × ₹9)</span>
                        <span className="font-bold text-slate-900">Room Total: ₹1,926</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Room occupants</span>
                        <span className="font-bold text-slate-900">2 roommates</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                        <span className="font-bold text-slate-900 text-sm">Your Individual Share</span>
                        <span className="text-2xl font-black text-blue-600">₹963</span>
                      </div>
                    </div>

                    {/* Photo & Pay Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => setShowMeterPhotoModal(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>View Meter Photo</span>
                      </button>

                      <button
                        onClick={() => {
                          setElectricityPaid(true);
                          triggerToast("₹963 Electricity bill paid successfully! Receipt generated.");
                        }}
                        disabled={electricityPaid}
                        className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          electricityPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{electricityPaid ? "₹963 Paid" : "Pay ₹963 (With Rent or Direct)"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MESS & FOOD MENU */}
              {activeTab === "mess" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Weekly Mess Timetable</h3>
                        <p className="text-xs text-slate-500">Fresh hygienic meals prepared daily by verified PG cooks</p>
                      </div>
                      <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        3 Meals Daily Included
                      </span>
                    </div>

                    {/* Days selector */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {[
                        { day: "Mon", date: 9 },
                        { day: "Tue", date: 10 },
                        { day: "Wed", date: 11 },
                        { day: "Thu", date: 12 },
                        { day: "Fri", date: 13 },
                        { day: "Sat", date: 14 },
                        { day: "Sun", date: 15 },
                      ].map((item) => (
                        <button
                          key={item.date}
                          onClick={() => setSelectedMenuDay(item.date)}
                          className={`flex-1 min-w-[50px] py-2 px-2 rounded-xl text-center border transition-all cursor-pointer ${
                            selectedMenuDay === item.date
                              ? "bg-blue-600 border-blue-600 text-white font-bold shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <div className="text-xs font-black">{item.date}</div>
                          <div className="text-[10px] opacity-80">{item.day}</div>
                        </button>
                      ))}
                    </div>

                    {/* Meal cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Breakfast */}
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <Coffee className="w-4 h-4 text-amber-600" /> Breakfast
                          </span>
                          <span className="text-[11px] text-amber-700 font-normal">7:30–9:30 AM</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">Spiced flattened rice flakes, hot tea, boiled eggs, butter toast, fruit</p>
                      </div>

                      {/* Lunch */}
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                          <span className="flex items-center gap-1.5">
                            <UtensilsCrossed className="w-4 h-4 text-emerald-600" /> Lunch
                          </span>
                          <span className="text-[11px] text-emerald-700 font-normal">12:30–2:30 PM</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">Red kidney bean curry, steamed rice, flatbreads, green salad, spiced yogurt, pickle</p>
                      </div>

                      {/* Dinner */}
                      <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                          <span className="flex items-center gap-1.5">
                            <UtensilsCrossed className="w-4 h-4 text-indigo-600" /> Dinner
                          </span>
                          <span className="text-[11px] text-indigo-700 font-normal">8:00–10:00 PM</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium">Cottage cheese butter curry, yellow lentil soup, cumin rice, flatbreads, dessert</p>
                      </div>
                    </div>

                    {/* Interactive Rating & Food Wastage Skip Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700">Rate yesterday's food:</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => {
                                setMealRating(star);
                                triggerToast(`Thank you! Food rated ${star} stars.`);
                              }}
                              className="text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                            >
                              <Star className={`w-4 h-4 ${star <= mealRating ? "fill-amber-400" : "text-slate-300"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSkipMealToday(!skipMealToday);
                          triggerToast(
                            !skipMealToday
                              ? " Manager notified: Today's meal marked skipped (Food saved from wastage)!"
                              : "Meal opt-in restored."
                          );
                        }}
                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          skipMealToday
                            ? "bg-rose-50 border-rose-300 text-rose-700"
                            : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                        }`}
                      >
                        <Coffee className="w-4 h-4" />
                        <span>{skipMealToday ? " Today's Meal Skipped (Informed Cook)" : "Skip today's meal (Notify kitchen)"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: NOTIFICATIONS */}
              {activeTab === "notifications" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Property Announcements & Alerts</h3>
                  {announcements.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                      No notifications yet.
                    </div>
                  ) : (
                    announcements.map((a) => (
                      <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
                          <span className="text-[10px] text-slate-400">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{a.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: MAINTENANCE & COMPLAINTS */}
              {activeTab === "maintenance" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Maintenance & Complaints</h3>
                      <p className="text-xs text-slate-500">Seedha manager tak photo ke saath • Live status tracking</p>
                    </div>
                    <button
                      onClick={() => setShowNewTicketModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" /> Raise Complaint
                    </button>
                  </div>

                  {/* Complaints List with 3-Step Live Status Timelines */}
                  <div className="space-y-4">
                    {tickets.length === 0 ? (
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">AC thanda nahi kar raha</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">AC</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                                <Camera className="w-3 h-3 text-slate-500" /> Photo attached
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Room {room?.roomNumber || 203} • Direct to Property Manager</div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Resolved
                          </span>
                        </div>

                        {/* 3-Step Live Status Timeline */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Live Status Timeline
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold"></div>
                              <div>
                                <div className="font-bold text-slate-800">Submitted</div>
                                <div className="text-[10px] text-slate-400">8:40 AM</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold"></div>
                              <div>
                                <div className="font-bold text-slate-800">Seen by Manager</div>
                                <div className="text-[10px] text-slate-400">8:52 AM</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black"></div>
                              <div>
                                <div className="font-bold text-emerald-900">Resolved</div>
                                <div className="text-[10px] text-emerald-700">11:15 AM</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      tickets.map((t) => {
                        const isResolved = t.status === "RESOLVED" || t.status === "CLOSED";
                        const isInProgress = t.status === "IN_PROGRESS" || isResolved;
                        return (
                          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-slate-900">{t.title}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                                    {t.category}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1">
                                    <Camera className="w-3 h-3 text-slate-500" /> Photo Attached
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  Room {room?.roomNumber || 203} • {t.property?.name || "StaySphere PG"} • Synced with Manager & Owner
                                </div>
                                <p className="text-xs text-slate-700 mt-1.5">{t.description}</p>
                              </div>

                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  isResolved
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : isInProgress
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-blue-50 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {isResolved ? "Resolved (Done)" : isInProgress ? "In Progress" : "New (Submitted)"}
                              </span>
                            </div>

                            {/* Live 3-Stage Sync Timeline */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                <span>Live Status Timeline</span>
                                {t.resolutionNote && (
                                  <span className="text-emerald-700 font-semibold normal-case">
                                    Manager Note: {t.resolutionNote}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold"></div>
                                  <div>
                                    <div className="font-bold text-slate-800">Submitted</div>
                                    <div className="text-[10px] text-slate-400">
                                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>

                                <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                                  isInProgress ? "bg-white border-amber-300 text-amber-900" : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    isInProgress ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-400"
                                  }`}>
                                    {isInProgress ? "" : "2"}
                                  </div>
                                  <div>
                                    <div className="font-bold">Seen by Manager</div>
                                    <div className="text-[10px]">
                                      {isInProgress ? "In Progress" : "Pending review"}
                                    </div>
                                  </div>
                                </div>

                                <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                                  isResolved ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    isResolved ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-400"
                                  }`}>
                                    {isResolved ? "" : "3"}
                                  </div>
                                  <div>
                                    <div className="font-bold">Resolved</div>
                                    <div className="text-[10px]">
                                      {isResolved && t.resolvedAt ? new Date(t.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Awaiting fix"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: REVIEWS */}
              {activeTab === "reviews" && (
                <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Rate Your PG Residence</h3>
                    <p className="text-xs text-slate-500">
                      Share your experience to help future residents and guide property staff
                    </p>
                  </div>

                  <form onSubmit={handleCreateReview} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Star Rating (1 - 5)</label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                      >
                        <option value={5}>★★★★★ (5/5 Excellent)</option>
                        <option value={4}>★★★★☆ (4/5 Very Good)</option>
                        <option value={3}>★★★☆☆ (3/5 Average)</option>
                        <option value={2}>★★☆☆☆ (2/5 Poor)</option>
                        <option value={1}>★☆☆☆☆ (1/5 Terrible)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Your Review</label>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe the rooms, food quality, staff behavior, and Wi-Fi..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                    >
                      {reviewSubmitting ? "Submitting..." : "Post Review"}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 8: PROFILE */}
              {activeTab === "profile" && (
                <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900">Personal Account Details</h3>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Full Name:</span>{" "}
                      <span className="font-bold text-slate-900">{currentUser?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email Address:</span>{" "}
                      <span className="font-bold text-slate-900">{currentUser?.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile Phone:</span>{" "}
                      <span className="font-bold text-slate-900">{currentUser?.phone || "Not set"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Role:</span>{" "}
                      <span className="font-bold text-blue-600 uppercase">Tenant</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: METER PHOTO PREVIEW */}
      {showMeterPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900">Room 203 Electric Meter</h4>
              <button onClick={() => setShowMeterPhotoModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl text-center space-y-2">
              <div className="h-32 bg-slate-950 rounded-xl flex flex-col items-center justify-center border border-slate-800">
                <div className="bg-emerald-950/80 px-4 py-2 rounded border border-emerald-500/40 font-mono text-2xl font-black text-emerald-400 tracking-widest">
                  004400 kWh
                </div>
                <span className="text-[10px] text-slate-400 mt-1">Verified Reading: 31 Oct, 6:30 PM</span>
              </div>
              <p className="text-xs text-slate-300">Previous: 4,186 • Current: 4,400 (Net 214 Units consumed)</p>
            </div>
            <button
              onClick={() => setShowMeterPhotoModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL E-RECEIPT & WHATSAPP SHARE */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Official E-Receipt
              </span>
              <button onClick={() => setShowReceiptModal(null)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-black text-sm text-slate-900">STAYSPHERE RESIDENCY</div>
                <div className="text-[10px] text-slate-500">Bhubaneswar • GST: 21XXXXXX121</div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-700">
                <div className="flex justify-between">
                  <span>Billing Month:</span>
                  <span className="font-bold">{showReceiptModal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resident:</span>
                  <span className="font-bold">{currentUser?.name || "Rohit Sharma"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room / Bed:</span>
                  <span className="font-bold">Room 203 · Bed B</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Rent:</span>
                  <span>₹7,500</span>
                </div>
                <div className="flex justify-between">
                  <span>Mess & Food:</span>
                  <span>₹1,000</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-700">₹8,500</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">Payment Method: Online Verified</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const text = encodeURIComponent(
                    `*StaySphere PG Rent Receipt - ${showReceiptModal}*\nTenant: ${currentUser?.name || "Rohit Sharma"}\nRoom: 203-B\nAmount Paid: ₹8,500\nStatus: Paid & Verified`
                  );
                  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                  triggerToast("Receipt opened in WhatsApp!");
                  setShowReceiptModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>
              <button
                onClick={() => {
                  triggerToast("PDF Receipt downloaded!");
                  setShowReceiptModal(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in text-xs font-semibold">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Submit Maintenance Complaint</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="PLUMBING">Plumbing / Tap / Bathroom</option>
                  <option value="ELECTRICAL">Electrical / Fan / Light / AC</option>
                  <option value="WIFI_INTERNET">High-Speed Wi-Fi</option>
                  <option value="CLEANING">Housekeeping & Cleaning</option>
                  <option value="FOOD_QUALITY">Food Quality & Meals</option>
                  <option value="SECURITY">Security / Biometrics</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketTitle}
                  onChange={(e) => setTicketTitle(e.target.value)}
                  placeholder="e.g. Geyser not heating in room 102"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  required
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  placeholder="Explain the problem clearly..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              {/* Attach Photo Blueprint Feature */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-700">Attach Photo</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketPhoto(ticketPhoto ? null : "/images/meter.jpg")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    ticketPhoto ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {ticketPhoto ? " Photo Attached" : "+ Add Photo"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {ticketSubmitting ? "Submitting..." : "Complaint Bhejo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SERVE NOTICE PERIOD */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Move-out Notice
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Serve Notice Period (Notice Dein)</h3>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>

            <form onSubmit={handleServeNotice} className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-amber-900">
                <div className="font-bold flex items-center justify-between">
                  <span>Standard Notice Duration:</span>
                  <span className="text-sm">{property?.noticePeriodDays || 30} Days</span>
                </div>
                <div className="text-[11px] text-amber-800">
                  Expected move-out date: <span className="font-bold">{
                    (() => {
                      const d = new Date();
                      d.setDate(d.getDate() + (property?.noticePeriodDays || 30));
                      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    })()
                  }</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Leaving</label>
                <select
                  value={noticeReason}
                  onChange={(e) => setNoticeReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                >
                  <option value="Job Relocation">Job Relocation / City Change</option>
                  <option value="Studies / Semester Completed">Course or College Semester Completed</option>
                  <option value="Moving to Own Flat">Shifting to 1BHK / Flat with friends</option>
                  <option value="Personal / Family Reasons">Personal / Family Reasons</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Security Deposit Refund UPI / Bank Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210@upi or HDFC0001234 A/C 50100..."
                  value={noticeRefundUpi}
                  onChange={(e) => setNoticeRefundUpi(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Original Deposit ₹15,000 checkout inspection ke baad isi account pe aayega.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Additional Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Anything specific for manager or owner..."
                  value={noticeNotes}
                  onChange={(e) => setNoticeNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={noticeSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  {noticeSubmitting ? "Submitting Notice..." : "Confirm Notice Period"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: RESIDENT KYC SUBMISSION & VERIFICATION */}
      {showKycModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Compliance & Safety
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Resident ID Proof & KYC Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowKycModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Government ID Proof Type *
                </label>
                <select
                  value={kycIdType}
                  onChange={(e) => setKycIdType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-900"
                >
                  <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                  <option value="Passport">Passport</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Voter ID">Voter ID Card</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Government ID Number *
                </label>
                <input
                  type="text"
                  required
                  value={kycIdNumber}
                  onChange={(e) => setKycIdNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Emergency Contact (Parent / Guardian)
                </label>
                <input
                  type="text"
                  value={kycEmergencyContact}
                  onChange={(e) => setKycEmergencyContact(e.target.value)}
                  placeholder="e.g. +91 94370 12345 (Father)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>

              <DocumentUploader
                label="Upload ID Proof Document (Scanned Copy or PDF)"
                helperText="Upload PDF, JPG, PNG or WebP document (up to 15MB)"
                value={kycDocUrl}
                onChange={setKycDocUrl}
                purpose="KYC"
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                Super Admin verifies your ID details before digital agreements and checkout clearances are issued.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={kycSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {kycSubmitting ? "Submitting..." : "Submit for Admin Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STEP F1 BOOKING CANCELLATION & REFUND BREAKDOWN */}
      {cancelBookingTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                  Cancel Reservation
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {cancelBookingTarget.property?.name || "Booking Cancellation"}
                </h3>
              </div>
              <button
                onClick={() => setCancelBookingTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Ref:</span>
                  <span className="font-mono font-bold text-slate-900">{cancelBookingTarget.bookingReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Move-In:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(cancelBookingTarget.checkInDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Refund calculation breakdown per Step F1 */}
              {(() => {
                const daysUntilCheckIn = Math.ceil(
                  (new Date(cancelBookingTarget.checkInDate).getTime() - Date.now()) / (1000 * 3600 * 24)
                );
                const isConfirmed = cancelBookingTarget.status === "CONFIRMED";
                const refundAmount = !isConfirmed ? 0 : daysUntilCheckIn >= 7 ? 2000 : 0;

                return (
                  <div className={`p-3.5 rounded-xl border space-y-1.5 ${refundAmount > 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Refund Amount Payable:</span>
                      <span className={`text-base font-black ${refundAmount > 0 ? "text-emerald-700" : "text-amber-800"}`}>
                        ₹{refundAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {!isConfirmed
                        ? "No online advance was charged. The bed will simply be released back to inventory."
                        : daysUntilCheckIn >= 7
                        ? `Cancelling ${daysUntilCheckIn} days before check-in. Full refund of ₹2,000 token advance is approved.`
                        : `Notice of ${Math.max(0, daysUntilCheckIn)} days is under 7 days. Advance token forfeited per Refund Policy.`}
                    </p>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Cancellation</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                >
                  <option value="Change of plans / Personal reasons">Change of plans / Personal reasons</option>
                  <option value="Found alternative accommodation">Found alternative accommodation</option>
                  <option value="College / Office relocation delayed">College / Office relocation delayed</option>
                  <option value="Financial constraints">Financial constraints</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelBookingTarget(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold cursor-pointer"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={cancelSubmitting}
                  onClick={handleCancelBooking}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {cancelSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
