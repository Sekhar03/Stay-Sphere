"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building,
  CalendarCheck,
  Users,
  CreditCard,
  Wrench,
  Megaphone,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  X,
  Plus,
  Lock,
  LogOut,
  Loader2,
  MapPin,
  Bed,
  Sparkles,
  Zap,
  Camera,
  Send,
  UserCheck,
  FileText,
  ShieldCheck,
  Share2,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

export default function StaffDashboardPage() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "property"
    | "bookings"
    | "tenants"
    | "meter"
    | "rent"
    | "maintenance"
    | "announcements"
    | "profile"
  >("dashboard");

  // Staff Operations (Meter Reading, Complaint Tracker, New Tenant)
  const [ratePerUnit, setRatePerUnit] = useState(9);
  const [meterList, setMeterList] = useState([
    { room: "101", previous: 3912, current: 4108, units: 196, bill: 1764, sent: true },
    { room: "102", previous: 5240, current: 5402, units: 162, bill: 1458, sent: true },
    { room: "203", previous: 4186, current: 4400, units: 214, bill: 1926, sent: false },
    { room: "204", previous: 2950, current: 3121, units: 171, bill: 1539, sent: true },
    { room: "301", previous: 6005, current: 6190, units: 185, bill: 1665, sent: false },
  ]);

  const [managerComplaints, setManagerComplaints] = useState<any[]>([
    { id: 1, title: "AC cooling issue", room: "Room 203", status: "Done", time: "8:40 AM", category: "ELECTRICAL", tenantName: "Rohit S.", description: "AC cooling issue" },
    { id: 2, title: "WiFi slow speed in evening", room: "Room 108", status: "In Progress", time: "9:15 AM", category: "WIFI_INTERNET", tenantName: "Vikram T.", description: "WiFi lag" },
    { id: 3, title: "Geyser auto-cut not working", room: "Room 301", status: "New", time: "10:10 AM", category: "ELECTRICAL", tenantName: "Amit K.", description: "Geyser thermostat" },
    { id: 4, title: "Corridor cleaning required", room: "2nd Floor", status: "Done", time: "7:20 AM", category: "CLEANING", tenantName: "Floor Rep", description: "Corridor clean" },
    { id: 5, title: "Door lock issue", room: "Room 105", status: "New", time: "10:05 AM", category: "OTHER", tenantName: "Karan J.", description: "Lock loose" },
  ]);

  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newTenantForm, setNewTenantForm] = useState({
    roomBed: "104-A",
    name: "Rohit Sharma",
    phone: "+91 98765 43318",
    rent: 7500,
    deposit: 15000,
    idProof: true,
    photo: true,
    agreement: true,
    policeVerification: true,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    toast(msg);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [staffData, setStaffData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rentSchedules, setRentSchedules] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [liveBeds, setLiveBeds] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tenantList, setTenantList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);

  // Notice checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedNoticeBed, setSelectedNoticeBed] = useState<any>(null);
  const [checkoutDeductions, setCheckoutDeductions] = useState(0);
  const [checkoutReason, setCheckoutReason] = useState("Room inspection clear - no damage");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  // Manual payment modal state
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [refNote, setRefNote] = useState("");

  // Update ticket resolution
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    setLoading(true);
    try {
      const [overviewRes, bookingsRes, rentRes, ticketsRes, annRes, bedsRes, tenantsRes] = await Promise.all([
        fetch("/api/staff/overview"),
        fetch("/api/bookings"),
        fetch("/api/owner/rent"),
        fetch("/api/maintenance"),
        fetch("/api/announcements"),
        fetch("/api/owner/beds"),
        fetch("/api/owner/tenants"),
      ]);

      if (overviewRes.status === 401 || overviewRes.status === 403) {
        router.push("/portal/owner?redirect=/staff/dashboard");
        return;
      }

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setStaffData(data);
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json();
        setBookings(data.bookings || []);
      }
      if (rentRes.ok) {
        const data = await rentRes.json();
        setRentSchedules(data.rentSchedules || []);
      }
      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
      }
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
      if (bedsRes.ok) {
        const data = await bedsRes.json();
        setLiveBeds(data.beds || []);
      }
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenantList(data.tenants || data.allocations || []);
      }
    } catch (e) {
      console.error("Staff load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTenantDocs = async (tenantProfileId: string, name: string) => {
    try {
      const res = await fetch("/api/owner/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantProfileId, isKycVerified: true }),
      });
      if (res.ok) {
        triggerToast(`Documents & KYC approved for ${name}!`);
        loadStaffData();
      } else {
        triggerToast("Failed to approve documents");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error approving documents");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          status: newStatus,
          resolutionNote: newStatus === "RESOLVED" || newStatus === "Done" ? "Resolved by Property Staff" : undefined,
        }),
      });
      if (res.ok) {
        triggerToast(`Status changed to ${newStatus}! Tenant screen updated live.`);
        loadStaffData();
      } else {
        triggerToast("Failed to update ticket");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error updating ticket");
    }
  };

  const handleSaveOnboardTenant = async () => {
    if (!newTenantForm.name || !newTenantForm.roomBed) {
      triggerToast("Please provide name and select a bed");
      return;
    }
    setOnboardingSubmitting(true);
    try {
      const res = await fetch("/api/owner/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTenantForm.name,
          phone: newTenantForm.phone,
          bedId: newTenantForm.roomBed,
          monthlyRent: newTenantForm.rent,
          securityDeposit: newTenantForm.deposit,
          idProofType: "Aadhaar Card",
          idProofNumber: "VERIFIED-UIDAI-4819",
          agreementSigned: newTenantForm.agreement,
          policeVerificationStatus: newTenantForm.policeVerification ? "VERIFIED" : "PENDING",
        }),
      });
      if (res.ok) {
        setShowNewTenantModal(false);
        triggerToast(`Tenant ${newTenantForm.name} onboarded! Bed ${newTenantForm.roomBed} is now OCCUPIED`);
        loadStaffData();
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to onboard tenant");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error during onboarding");
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  const handleCompleteCheckout = async () => {
    if (!selectedNoticeBed) return;
    setCheckoutSubmitting(true);
    try {
      const originalDeposit = selectedNoticeBed.securityDeposit || 15000;
      const refund = Math.max(0, originalDeposit - checkoutDeductions);
      const res = await fetch("/api/owner/tenants/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedId: selectedNoticeBed.id || selectedNoticeBed.bedNumber,
          allocationId: selectedNoticeBed.allocationId,
          depositAmount: originalDeposit,
          deductions: checkoutDeductions,
          deductionReason: checkoutReason,
          refundAmount: refund,
          paymentMethod: "UPI",
        }),
      });
      if (res.ok) {
        setShowCheckoutModal(false);
        setSelectedNoticeBed(null);
        triggerToast(`Bed ${selectedNoticeBed.bedNumber} checked out! Status is now VACANT (AVAILABLE). Deposit ₹${refund} refund processed.`);
        loadStaffData();
      } else {
        const err = await res.json();
        triggerToast(err.error || "Failed to process checkout");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error processing checkout");
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const hasPermission = (permission: string) => {
    return staffData?.staff?.permissions?.includes(permission) || false;
  };

  const handleBookingAction = async (bookingId: string, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      if (res.ok) loadStaffData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          status: "RESOLVED",
          resolutionNote: resolutionNote || "Resolved by property staff",
        }),
      });
      if (res.ok) {
        setSelectedTicket(null);
        setResolutionNote("");
        loadStaffData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;
    try {
      const res = await fetch("/api/owner/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentScheduleId: selectedSchedule.id,
          amount,
          paymentMethod: method,
          referenceNumber: refNote,
        }),
      });
      if (res.ok) {
        setShowPayModal(false);
        setSelectedSchedule(null);
        setAmount("");
        setRefNote("");
        loadStaffData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/owner");
    router.refresh();
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "property", label: "Property View", icon: Building },
    { id: "meter", label: "Meter Readings & Bills", icon: Zap },
    { id: "tenants", label: "Tenants & Onboarding", icon: Users },
    { id: "bookings", label: "Booking Operations", icon: CalendarCheck },
    { id: "rent", label: "Rent & Collections", icon: CreditCard },
    { id: "maintenance", label: "Maintenance & Complaints", icon: Wrench },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "profile", label: "Staff Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Sticky Top Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
            ST
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-white text-sm tracking-tight leading-tight">
              StaySphere
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-semibold text-slate-300 truncate">
                Staff • {staffData?.staff?.role?.replace("_", " ") || "Operations"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle staff menu"
          className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 btn-press"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Horizontal Quick Tab Strip */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
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
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* 8-Item Staff Sidebar (Drawer on mobile, fixed left column on desktop) */}
      <aside
        className={`${
          mobileNavOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 flex shadow-2xl"
            : "hidden md:flex md:w-64"
        } bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800`}
      >
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
                ST
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">StaySphere</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-semibold text-slate-300">
                Staff • {staffData?.staff?.role?.replace("_", " ") || "Property Operations"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
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
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="btn-press w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Staff Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500">
              Assigned: {staffData?.property?.name || "All Owner Facilities"} • Role:{" "}
              {staffData?.staff?.role?.replace("_", " ")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Role Scoped Access
            </span>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Loading assigned property records...</span>
            </div>
          ) : (
            <div key={activeTab} className="tab-content">
              {/* TAB 1: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Property Overview Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Assigned Property</div>
                      <div className="text-base font-extrabold text-slate-900 mt-1 truncate">
                        {staffData?.property?.name || "All Facilities"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {staffData?.property?.address?.locality || "Bangalore"}
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Rooms & Beds</div>
                      <div className="text-xl font-black text-slate-900 mt-1">
                        {staffData?.stats?.totalRooms || 0}{" "}
                        <span className="text-xs font-semibold text-slate-400">
                          / {staffData?.stats?.totalBeds || 0} beds
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                        {staffData?.stats?.occupiedBeds || 0} occupied • {staffData?.stats?.vacantBeds || 0} vacant
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Today's Check-ins</div>
                      <div className="text-2xl font-black text-blue-600 mt-1">
                        {staffData?.stats?.todayCheckInsCount || 0}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Scheduled arrivals</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Open Maintenance</div>
                      <div className="text-2xl font-black text-amber-600 mt-1">
                        {staffData?.stats?.activeTicketsCount || 0}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Requires inspection</div>
                    </div>
                  </div>

                  {/* Operational Action Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Active Tickets */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-sm text-slate-900">Urgent Maintenance Items</h3>
                        <button
                          onClick={() => setActiveTab("maintenance")}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {(staffData?.activeTickets || []).length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">No open tickets.</div>
                      ) : (
                        <div className="space-y-2">
                          {(staffData?.activeTickets || []).map((t: any) => (
                            <div key={t.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{t.title}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  {t.status}
                                </span>
                              </div>
                              <p className="text-slate-500 text-[11px]">{t.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Owner Notices */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-sm text-slate-900">Owner Notices & Policy</h3>
                        <button
                          onClick={() => setActiveTab("announcements")}
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          View All
                        </button>
                      </div>
                      {(staffData?.announcements || []).length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">No announcements.</div>
                      ) : (
                        <div className="space-y-2">
                          {(staffData?.announcements || []).map((a: any) => (
                            <div key={a.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                              <div className="font-bold text-slate-900">{a.title}</div>
                              <p className="text-slate-500 text-[11px]">{a.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROPERTY VIEW */}
              {activeTab === "property" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900">Assigned Property Details</h3>
                  {staffData?.property ? (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                        <div className="text-base font-bold text-slate-900">{staffData.property.name}</div>
                        <div className="text-slate-600 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {staffData.property.address?.addressLine1}, {staffData.property.address?.locality},{" "}
                            {staffData.property.address?.city} - {staffData.property.address?.pincode}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                          <div>
                            <span className="text-slate-400">Gender Preference:</span>{" "}
                            <span className="font-bold">{staffData.property.genderPreference}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Gate Closing Time:</span>{" "}
                            <span className="font-bold">{staffData.property.gateClosingTime || "11:00 PM"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Notice Period:</span>{" "}
                            <span className="font-bold">{staffData.property.noticePeriodDays} days</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Starting Rent:</span>{" "}
                            <span className="font-bold">₹{staffData.property.startingRent}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Unrestricted property assignment.</div>
                  )}
                </div>
              )}

              {/* TAB 3: BOOKINGS */}
              {activeTab === "bookings" && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Check-in & Booking Requests</h3>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {bookings.map((b) => (
                      <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{b.tenantUser?.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.property?.name} • Room {b.room?.roomNumber || "-"} • Bed {b.bed?.bedNumber || "-"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Phone: {b.tenantUser?.phone || "N/A"} • Check-in:{" "}
                            {new Date(b.checkInDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-700"
                                : b.status === "AWAITING_PAYMENT"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {b.status}
                          </span>
                          {b.status === "AWAITING_PAYMENT" && hasPermission("booking.approve") && (
                            <button
                              onClick={() => handleBookingAction(b.id, "CONFIRMED")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === "CONFIRMED" && hasPermission("booking.checkin") && (
                            <button
                              onClick={() => handleBookingAction(b.id, "COMPLETED")}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Check-In Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: METER READINGS & BILLS */}
              {activeTab === "meter" && (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Room-Wise Meter Readings & Auto-Billing</h3>
                        <p className="text-xs text-slate-500">October reading cycle • Bill calculation automatic per unit</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Rate per Unit:</span>
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-900">
                          <span>₹</span>
                          <input
                            type="number"
                            value={ratePerUnit}
                            onChange={(e) => setRatePerUnit(Number(e.target.value) || 9)}
                            className="w-10 bg-transparent text-center font-bold text-blue-600 focus:outline-none"
                          />
                          <span className="text-slate-400 font-normal">/ unit</span>
                        </div>
                      </div>
                    </div>

                    {/* Meter Reading Table */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                      <div className="grid grid-cols-5 p-3 bg-slate-50 font-bold text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <span>ROOM</span>
                        <span>PREVIOUS</span>
                        <span>CURRENT</span>
                        <span>UNITS</span>
                        <span className="text-right">CALCULATED BILL</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {meterList.map((m) => {
                          const units = m.current - m.previous;
                          const bill = units * ratePerUnit;
                          return (
                            <div key={m.room} className="grid grid-cols-5 p-3.5 items-center">
                              <span className="font-bold text-slate-900">Room {m.room}</span>
                              <span className="font-mono text-slate-600">{m.previous}</span>
                              <div>
                                <input
                                  type="number"
                                  value={m.current}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    setMeterList(
                                      meterList.map((item) =>
                                        item.room === m.room ? { ...item, current: val } : item
                                      )
                                    );
                                  }}
                                  className="w-20 bg-blue-50/60 border border-blue-200 rounded-lg px-2 py-1 font-mono font-bold text-blue-700 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <span className="font-mono text-slate-700 font-semibold">{units} units</span>
                              <div className="text-right">
                                <span className="font-bold text-slate-900 text-sm">₹{bill.toLocaleString("en-IN")}</span>
                                <div className="text-[10px] text-slate-400">
                                  {m.sent ? <span className="text-emerald-600 font-medium">Bill sent</span> : "Pending dispatch"}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <button
                        onClick={() => triggerToast("New meter photo captured & verified!")}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4 text-blue-600" />
                        <span>Upload Meter Photo</span>
                      </button>

                      <button
                        onClick={() => {
                          setMeterList(meterList.map((m) => ({ ...m, sent: true })));
                          triggerToast("All room tenants notified with electric bills via WhatsApp & SMS!");
                        }}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Sabko Bill Bhejo (1-Tap WhatsApp & SMS)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TENANTS */}
              {activeTab === "tenants" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Tenant Roster & Onboarding</h3>
                      <p className="text-xs text-slate-500">Document verification, bed assignment & move-out lifecycle</p>
                    </div>
                    <button
                      onClick={() => setShowNewTenantModal(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Onboard New Tenant</span>
                    </button>
                  </div>

                  {/* Notice Period Live Watchlist */}
                  {liveBeds.filter((b) => b.status === "notice").length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                          Notice Period Watchlist ({liveBeds.filter((b) => b.status === "notice").length} Beds)
                        </span>
                        <span className="text-xs text-amber-900 font-semibold">Vacating soon • Settle deposit upon departure</span>
                      </div>
                      <div className="divide-y divide-amber-200/60 text-xs">
                        {liveBeds
                          .filter((b) => b.status === "notice")
                          .map((b) => (
                            <div key={b.id || b.bedNumber} className="py-2.5 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900">Room {b.roomNumber} · Bed {b.bedNumber}</span>
                                <span className="text-slate-600 ml-2">({b.tenantName || "Tenant on notice"})</span>
                                <div className="text-[11px] text-amber-800">
                                  Expected Move-out: {b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : "In 30 days"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedNoticeBed(b);
                                  setShowCheckoutModal(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                              >
                                Process Move-Out & Settle Deposit
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Tenant Roster & Documents Verification Ledger */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Active Resident Roster & KYC Document Status
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {tenantList.length > 0 ? `${tenantList.length} verified residents` : "Resident documentation database"}
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs">
                      {tenantList.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">No active residents recorded yet.</div>
                      ) : (
                        tenantList.map((t: any) => {
                          const user = t.user || t.tenant?.user;
                          const roomNumber = t.currentBed?.room?.roomNumber || t.room?.roomNumber || "101";
                          const bedNumber = t.currentBed?.bedNumber || t.bed?.bedNumber || "A";
                          const isVerified = t.isKycVerified || t.tenant?.isKycVerified;
                          const idProof = t.idProofType || "Aadhaar Card";

                          return (
                            <div key={t.id || user?.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-sm">{user?.name || "Resident"}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                    Room {roomNumber} · Bed {bedNumber}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}>
                                    {isVerified ? "KYC Approved" : "Pending Approval"}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500">
                                  {user?.email} • {user?.phone || "+91 98765 43210"}
                                </div>

                                {/* 4 Document Checkpoints from Blueprint */}
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                    ID Proof: {idProof} (UIDAI)
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                    Photo: Uploaded
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                    📝 Agreement: Signed
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                                    👮 Police Verification: Done
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {!isVerified ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveTenantDocs(t.id, user?.name || "Resident")}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                                  >
                                    Approve Documents / KYC
                                  </button>
                                ) : (
                                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                                    All Documents Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: RENT & COLLECTIONS */}
              {activeTab === "rent" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Rent Status & Payment Recording</h3>
                      <p className="text-xs text-slate-500">Authorized staff can record cash and offline payments</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="divide-y divide-slate-100 text-xs">
                      {rentSchedules.map((rs) => (
                        <div key={rs.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">{rs.tenant?.user?.name}</div>
                            <div className="text-[11px] text-slate-500">
                              Month: {rs.month}/{rs.year} • Due Date: {new Date(rs.dueDate).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-slate-900">₹{rs.amount}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rs.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {rs.status}
                            </span>
                            {rs.status !== "PAID" && hasPermission("rent.collect") && (
                              <button
                                onClick={() => {
                                  setSelectedSchedule(rs);
                                  setAmount(String(rs.amount));
                                  setShowPayModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Collect Cash / UPI
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: MAINTENANCE & COMPLAINTS TRACKER */}
              {activeTab === "maintenance" && (() => {
                const liveTickets = tickets.map((t) => {
                  const normStatus =
                    t.status === "RESOLVED" || t.status === "CLOSED"
                      ? "Done"
                      : t.status === "IN_PROGRESS"
                      ? "In Progress"
                      : "New";
                  const roomName = t.user?.tenantProfile?.currentBed
                    ? `Room ${t.user.tenantProfile.currentBed.room?.roomNumber || "203"} (${t.user.tenantProfile.currentBed.bedNumber || "A"})`
                    : t.user?.tenantProfile?.allocations?.[0]?.bed
                    ? `Room ${t.user.tenantProfile.allocations[0].bed.room?.roomNumber} (${t.user.tenantProfile.allocations[0].bed.bedNumber})`
                    : "Room 101";
                  return {
                    id: t.id,
                    title: t.title,
                    room: roomName,
                    status: normStatus,
                    time: new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    category: t.category,
                    tenantName: t.user?.name || "Tenant",
                    tenantPhone: t.user?.phone || null,
                    description: t.description,
                  };
                });

                const displayComplaints = [
                  ...liveTickets,
                  ...managerComplaints.filter((mc) => !liveTickets.some((lt) => lt.title === mc.title)),
                ];

                const newCount = displayComplaints.filter((c) => c.status === "New").length;
                const inProgressCount = displayComplaints.filter((c) => c.status === "In Progress").length;
                const doneCount = displayComplaints.filter((c) => c.status === "Done").length;

                return (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Complaints & Operations Board</h3>
                        <p className="text-xs text-slate-500">Live complaint tracker • Status updates sync directly to tenant screen</p>
                      </div>
                    </div>

                    {/* 3 Metric Pills */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-center">
                        <div className="text-2xl font-black text-blue-700">{newCount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 mt-0.5">New</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                        <div className="text-2xl font-black text-amber-700">{inProgressCount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">In Progress</div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-2xl font-black text-emerald-700">{doneCount}</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mt-0.5">Done (Resolved)</div>
                      </div>
                    </div>

                    {/* Complaints List with direct status update */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Complaints Queue</h4>
                        <span className="text-[11px] text-slate-400">Total: {displayComplaints.length} tickets</span>
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {displayComplaints.map((c) => (
                          <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{c.title}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {c.room}
                                </span>
                                {c.category && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                    {c.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {c.description} • Reported by {c.tenantName} at {c.time}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={c.status}
                                onChange={(e) => handleUpdateTicketStatus(c.id.toString(), e.target.value)}
                                className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${
                                  c.status === "Done"
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                    : c.status === "In Progress"
                                    ? "bg-amber-50 border-amber-300 text-amber-800"
                                    : "bg-blue-50 border-blue-300 text-blue-800"
                                }`}
                              >
                                <option value="New">New</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done (Resolved)</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* TAB 7: ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">Owner Broadcasts</h3>
                  {announcements.map((a) => (
                    <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 8: PROFILE & PERMISSIONS */}
              {activeTab === "profile" && (
                <div className="max-w-xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-base font-extrabold text-slate-900">Staff Account & Granted Permissions</h3>
                  <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400">Staff Role Preset:</span>{" "}
                      <span className="font-bold uppercase text-slate-900">{staffData?.staff?.role}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Assigned Facility:</span>{" "}
                      <span className="font-bold text-slate-900">{staffData?.property?.name || "Global"}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Granted RBAC Permissions</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(staffData?.staff?.permissions || []).map((p: string) => (
                        <span
                          key={p}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Security Boundary
                    </div>
                    <div className="mt-1 text-[11px]">
                      Staff accounts are prevented from viewing owner bank credentials, modifying pricing, or accessing
                      unassigned properties.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL: ONBOARD NEW TENANT */}
      {showNewTenantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Onboarding Entry
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">New Tenant Onboarding</h3>
              </div>
              <button onClick={() => setShowNewTenantModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Vacant Bed</label>
                <select
                  value={newTenantForm.roomBed}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, roomBed: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                >
                  {liveBeds.filter((b) => b.status === "vacant").length > 0 ? (
                    liveBeds
                      .filter((b) => b.status === "vacant")
                      .map((b) => (
                        <option key={b.id || b.bedNumber} value={b.bedNumber}>
                          Room {b.roomNumber} · Bed {b.bedNumber} (Vacant)
                        </option>
                      ))
                  ) : (
                    <>
                      <option value="104-A">Room 104 · Bed A (Vacant - 14 days)</option>
                      <option value="202-B">Room 202 · Bed B (Vacant - 7 days)</option>
                      <option value="108-B">Room 108 · Bed B (On Notice)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tenant Full Name</label>
                <input
                  type="text"
                  value={newTenantForm.name}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  value={newTenantForm.phone}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rent / Month</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 text-sm">
                    ₹7,500
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Security Deposit</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm">
                    ₹15,000
                  </div>
                </div>
              </div>

              {/* Document verification checklist */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-2">Documents Verification Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTenantForm({ ...newTenantForm, idProof: !newTenantForm.idProof })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                      newTenantForm.idProof ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>ID Proof</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTenantForm({ ...newTenantForm, photo: !newTenantForm.photo })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                      newTenantForm.photo ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTenantForm({ ...newTenantForm, agreement: !newTenantForm.agreement })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                      newTenantForm.agreement ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Agreement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTenantForm({ ...newTenantForm, policeVerification: !newTenantForm.policeVerification })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-colors ${
                      newTenantForm.policeVerification ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Police Verif.</span>
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bed {newTenantForm.roomBed} automatically marked "Occupied" upon saving</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={onboardingSubmitting}
                  onClick={handleSaveOnboardTenant}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  {onboardingSubmitting ? "Saving Tenant..." : "Save Tenant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PROCESS MOVE-OUT & SETTLE DEPOSIT */}
      {showCheckoutModal && selectedNoticeBed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Move-Out Final Settlement
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Room {selectedNoticeBed.roomNumber} · Bed {selectedNoticeBed.bedNumber}
                </h3>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">×</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">{selectedNoticeBed.tenantName || "Resident"}</div>
                <div className="text-[11px] text-slate-500">Security Deposit Collected: ₹{selectedNoticeBed.securityDeposit || 15000}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deductions (Damages / Pending Power Bill)</label>
                <input
                  type="number"
                  value={checkoutDeductions}
                  onChange={(e) => setCheckoutDeductions(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-rose-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspection Notes / Reason</label>
                <input
                  type="text"
                  value={checkoutReason}
                  onChange={(e) => setCheckoutReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-emerald-900">Final Security Deposit Refund:</span>
                <span className="text-base font-black text-emerald-700">
                  ₹{Math.max(0, (selectedNoticeBed.securityDeposit || 15000) - checkoutDeductions).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Bed will immediately be marked "AVAILABLE" (Vacant) for new tenants across StaySphere platform.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={checkoutSubmitting}
                  onClick={handleCompleteCheckout}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  {checkoutSubmitting ? "Processing..." : "Complete Move-Out & Settle Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Record Rent Collection</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                >
                  <option value="CASH">Cash in Hand</option>
                  <option value="UPI_OFFLINE">UPI QR / PhonePe / GPay</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt Note</label>
                <input
                  type="text"
                  value={refNote}
                  onChange={(e) => setRefNote(e.target.value)}
                  placeholder="e.g. Received at reception counter"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
