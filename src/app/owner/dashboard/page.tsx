"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building,
  Image as ImageIcon,
  Bed,
  Users,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Wrench,
  Megaphone,
  UserPlus,
  Settings,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ChevronRight,
  Loader2,
  Trash2,
  Eye,
  Filter,
  Check,
  X,
  FileText,
  UserCheck,
  KeyRound,
  Download,
  Send,
  LogOut,
  Sparkles,
  Share2,
  Zap,
  Menu,
} from "lucide-react";
import { STAFF_ROLE_PERMISSIONS, StaffRole } from "@/lib/constants";
import UpiCheckoutButton from "@/components/booking/RazorpayCheckoutButton";
import ElectricitySplitModal from "@/components/owner/ElectricitySplitModal";
import { toast } from "sonner";

export default function OwnerDashboardPage() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "properties"
    | "visits"
    | "media"
    | "rooms"
    | "tenants"
    | "bookings"
    | "rent"
    | "reports"
    | "maintenance"
    | "announcements"
    | "staff"
    | "settings"
  >("dashboard");

  // Rent overdue list and bed matrix
  const [ownerOverdueList, setOwnerOverdueList] = useState([
    { id: "1", initials: "RS", name: "Rahul S.", room: "Room 102", amount: 8500, status: "2 days overdue", phone: "9876543201" },
    { id: "2", initials: "NP", name: "Neha P.", room: "Room 204", amount: 8000, status: "2 days overdue", phone: "9876543202" },
    { id: "3", initials: "AK", name: "Amit K.", room: "Room 301", amount: 9000, status: "Reminder sent", phone: "9876543203" },
    { id: "4", initials: "VT", name: "Vikram T.", room: "Room 108", amount: 8500, status: "Reminder sent", phone: "9876543204" },
  ]);

  const [liveBeds, setLiveBeds] = useState<any[]>([
    { code: "101-A", room: "101", status: "occupied", tenant: "Prakash V.", rent: 7500 },
    { code: "101-B", room: "101", status: "occupied", tenant: "Anil R.", rent: 7500 },
    { code: "102-A", room: "102", status: "occupied", tenant: "Rahul S.", rent: 7500 },
    { code: "102-B", room: "102", status: "occupied", tenant: "Deepak M.", rent: 7500 },
    { code: "103-A", room: "103", status: "occupied", tenant: "Sumit T.", rent: 7500 },
    { code: "103-B", room: "103", status: "occupied", tenant: "Pooja D.", rent: 7500 },
    { code: "104-A", room: "104", status: "vacant", daysVacant: 14, rent: 7500 },
    { code: "104-B", room: "104", status: "occupied", tenant: "Gaurav K.", rent: 7500 },
    { code: "105-A", room: "105", status: "occupied", tenant: "Karan J.", rent: 7500 },
    { code: "105-B", room: "105", status: "occupied", tenant: "Mohit C.", rent: 7500 },
    { code: "106-A", room: "106", status: "occupied", tenant: "Arun P.", rent: 7500 },
    { code: "106-B", room: "106", status: "occupied", tenant: "Sahil G.", rent: 7500 },
    { code: "107-A", room: "107", status: "occupied", tenant: "Rajeev N.", rent: 7500 },
    { code: "107-B", room: "107", status: "occupied", tenant: "Manish H.", rent: 7500 },
    { code: "108-A", room: "108", status: "occupied", tenant: "Vikram T.", rent: 7500 },
    { code: "108-B", room: "108", status: "notice", tenant: "Kunal S.", rent: 7500 },
    { code: "201-A", room: "201", status: "occupied", tenant: "Aditya V.", rent: 7500 },
    { code: "201-B", room: "201", status: "occupied", tenant: "Prashant L.", rent: 7500 },
    { code: "202-A", room: "202", status: "occupied", tenant: "Harshita B.", rent: 7500 },
    { code: "202-B", room: "202", status: "vacant", daysVacant: 7, rent: 7500 },
  ]);

  const [selectedBedInfo, setSelectedBedInfo] = useState<any>(null);

  const [overview, setOverview] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rentSchedules, setRentSchedules] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff Modal state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("StaySphere@2026!");
  const [staffRole, setStaffRole] = useState<StaffRole>(StaffRole.PROPERTY_MANAGER);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [customPerms, setCustomPerms] = useState<string[]>([]);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);

  // Announcement Modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annPriority, setAnnPriority] = useState("NORMAL");
  const [annTarget, setAnnTarget] = useState("ALL");
  const [annSubmitting, setAnnSubmitting] = useState(false);

  // Manual Rent Modal
  const [showManualRentModal, setShowManualRentModal] = useState(false);
  const [selectedRentSchedule, setSelectedRentSchedule] = useState<any>(null);
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState("CASH");
  const [manualRef, setManualRef] = useState("");

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    companyName: "",
    panNumber: "",
    gstNumber: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankAccountName: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [tenantList, setTenantList] = useState<any[]>([]);

  // Tenant Document Viewer Modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalTenant, setDocModalTenant] = useState<any>(null);

  // Reject tenant docs modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTenantId, setRejectTenantId] = useState("");
  const [rejectTenantName, setRejectTenantName] = useState("");

  // Sub-meter Electricity Modal
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [electricityModalRoomId, setElectricityModalRoomId] = useState<string | undefined>(undefined);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  // Onboarding & Checkout Modal states for Owner
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedOnboardBed, setSelectedOnboardBed] = useState<any>(null);
  const [onboardForm, setOnboardForm] = useState({
    name: "Rohit Sharma",
    phone: "+91 98765 43210",
    rent: 7500,
    deposit: 15000,
    idProof: true,
    photo: true,
    agreement: true,
    policeVerification: true,
  });
  const [onboardSubmitting, setOnboardSubmitting] = useState(false);

  const [showOwnerCheckoutModal, setShowOwnerCheckoutModal] = useState(false);
  const [ownerCheckoutDeductions, setOwnerCheckoutDeductions] = useState(0);
  const [ownerCheckoutReason, setOwnerCheckoutReason] = useState("Move-out inspection clear");
  const [ownerCheckoutSubmitting, setOwnerCheckoutSubmitting] = useState(false);

  useEffect(() => {
    loadAllOwnerData();
  }, []);

  const loadAllOwnerData = async () => {
    setLoading(true);
    try {
      const [overviewRes, propsRes, visitsRes, bookingsRes, rentRes, ticketsRes, annRes, staffRes, bedsRes, tenantsRes] =
        await Promise.all([
          fetch("/api/owner/overview"),
          fetch("/api/properties"),
          fetch("/api/properties/visits"),
          fetch("/api/bookings"),
          fetch("/api/owner/rent"),
          fetch("/api/maintenance"),
          fetch("/api/announcements"),
          fetch("/api/owner/staff"),
          fetch("/api/owner/beds"),
          fetch("/api/owner/tenants"),
        ]);

      if (overviewRes.status === 401 || overviewRes.status === 403) {
        router.push("/portal/owner?redirect=/owner/dashboard");
        return;
      }

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data);
        if (data.owner) {
          setSettingsForm({
            companyName: data.owner.companyName || "",
            panNumber: data.owner.panNumber || "",
            gstNumber: data.owner.gstNumber || "",
            bankAccountNumber: data.owner.bankAccountNumber || "",
            bankIfscCode: data.owner.bankIfscCode || "",
            bankAccountName: data.owner.bankAccountName || "",
          });
        }
      }

      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties || []);
      }
      if (visitsRes.ok) {
        const data = await visitsRes.json();
        setVisits(data.visits || []);
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
      if (staffRes.ok) {
        const data = await staffRes.json();
        setStaffList(data.staff || []);
      }
      if (tenantsRes.ok) {
        const data = await tenantsRes.json();
        setTenantList(data.tenants || data.allocations || []);
      }
      if (bedsRes.ok) {
        const data = await bedsRes.json();
        if (data.beds && data.beds.length > 0) {
          setLiveBeds((prev) => {
            const merged = prev.map((defaultBed) => {
              const found = data.beds.find((b: any) => b.code === defaultBed.code || b.bedNumber === defaultBed.code);
              if (found) {
                return { ...defaultBed, ...found };
              }
              return defaultBed;
            });
            for (const b of data.beds) {
              if (!merged.some((m) => m.code === (b.code || b.bedNumber))) {
                merged.push({ ...b, code: b.code || b.bedNumber });
              }
            }
            return merged;
          });
        }
      }
    } catch (e) {
      console.error("Owner data load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTenantDocs = async (tenantProfileId: string, name: string) => {
    try {
      const res = await fetch("/api/owner/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantProfileId, action: "APPROVE", isKycVerified: true }),
      });
      if (res.ok) {
        toast.success(`Documents & KYC approved for ${name}!`);
        setShowDocModal(false);
        loadAllOwnerData();
      } else {
        toast.error("Failed to approve documents");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error approving documents");
    }
  };

  const handleRejectTenantDocs = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    setRejectSubmitting(true);
    try {
      const res = await fetch("/api/owner/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantProfileId: rejectTenantId,
          action: "REJECT",
          rejectionReason: rejectReason.trim(),
        }),
      });
      if (res.ok) {
        toast.success(`Documents rejected for ${rejectTenantName}. Tenant notified.`);
        setShowRejectModal(false);
        setRejectReason("");
        loadAllOwnerData();
      } else {
        toast.error("Failed to reject documents");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error rejecting documents");
    } finally {
      setRejectSubmitting(false);
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
          resolutionNote: newStatus === "RESOLVED" ? "Resolved by PG Owner" : undefined,
        }),
      });
      if (res.ok) {
        toast.success(`Complaint status changed to ${newStatus}! Tenant & staff updated.`);
        loadAllOwnerData();
      } else {
        toast.error("Failed to update complaint");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error updating ticket");
    }
  };

  const handleOwnerOnboardTenant = async () => {
    if (!selectedOnboardBed && !liveBeds.find((b) => b.status === "vacant")) {
      toast.error("No vacant bed available for onboarding");
      return;
    }
    const targetBedCode = selectedOnboardBed?.bedNumber || selectedOnboardBed?.code || liveBeds.find((b) => b.status === "vacant")?.bedNumber || "104-A";
    setOnboardSubmitting(true);
    try {
      const res = await fetch("/api/owner/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: onboardForm.name,
          phone: onboardForm.phone,
          bedId: targetBedCode,
          monthlyRent: onboardForm.rent,
          securityDeposit: onboardForm.deposit,
          idProofType: "Aadhaar Card",
          idProofNumber: "VERIFIED-UIDAI-9912",
          agreementSigned: onboardForm.agreement,
          policeVerificationStatus: onboardForm.policeVerification ? "VERIFIED" : "PENDING",
        }),
      });
      if (res.ok) {
        setShowOnboardModal(false);
        setSelectedOnboardBed(null);
        toast.success(`Tenant ${onboardForm.name} onboarded! Bed ${targetBedCode} is now OCCUPIED`);
        loadAllOwnerData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to onboard tenant");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error during onboarding");
    } finally {
      setOnboardSubmitting(false);
    }
  };

  const handleOwnerCheckout = async () => {
    if (!selectedBedInfo) return;
    setOwnerCheckoutSubmitting(true);
    try {
      const originalDeposit = selectedBedInfo.securityDeposit || 15000;
      const refund = Math.max(0, originalDeposit - ownerCheckoutDeductions);
      const res = await fetch("/api/owner/tenants/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bedId: selectedBedInfo.id || selectedBedInfo.bedNumber || selectedBedInfo.code,
          allocationId: selectedBedInfo.allocationId,
          depositAmount: originalDeposit,
          deductions: ownerCheckoutDeductions,
          deductionReason: ownerCheckoutReason,
          refundAmount: refund,
          paymentMethod: "UPI",
        }),
      });
      if (res.ok) {
        setShowOwnerCheckoutModal(false);
        setSelectedBedInfo(null);
        toast.success(`Bed checkout settled! Deposit refund ₹${refund} processed. Bed is now VACANT`);
        loadAllOwnerData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to process checkout");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error during checkout");
    } finally {
      setOwnerCheckoutSubmitting(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffSubmitting(true);
    setStaffSuccess(null);
    try {
      const res = await fetch("/api/owner/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
          password: staffPassword,
          staffRole,
          propertyId: selectedPropertyId || undefined,
          customPermissions: customPerms.length > 0 ? customPerms : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff member");

      setStaffSuccess(`Staff member created! Login credentials: ${staffEmail} / ${staffPassword}`);
      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      loadAllOwnerData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleToggleStaffActive = async (staffId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/owner/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        loadAllOwnerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/owner/staff/${staffId}`, { method: "DELETE" });
      if (res.ok) loadAllOwnerData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingAction = async (bookingId: string, status: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      if (res.ok) loadAllOwnerData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: annPriority,
          targetRole: annTarget,
        }),
      });
      if (res.ok) {
        setAnnTitle("");
        setAnnContent("");
        setShowAnnouncementModal(false);
        loadAllOwnerData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnnSubmitting(false);
    }
  };

  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRentSchedule) return;
    try {
      const res = await fetch("/api/owner/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentScheduleId: selectedRentSchedule.id,
          amount: manualAmount,
          paymentMethod: manualMethod,
          referenceNumber: manualRef,
        }),
      });
      if (res.ok) {
        setShowManualRentModal(false);
        setSelectedRentSchedule(null);
        setManualAmount("");
        setManualRef("");
        loadAllOwnerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      const res = await fetch("/api/owner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/owner");
    router.refresh();
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "properties", label: "My Properties", icon: Building },
    { id: "visits", label: "Tenant Visits", icon: CalendarCheck },
    { id: "media", label: "Media & 360 Tours", icon: ImageIcon },
    { id: "rooms", label: "Rooms & Beds", icon: Bed },
    { id: "tenants", label: "Tenants", icon: Users },
    { id: "bookings", label: "Bookings", icon: CalendarCheck },
    { id: "rent", label: "Rent & Payments", icon: CreditCard },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "staff", label: "Staff Management", icon: UserPlus },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Sticky Top Bar */}
      <div className="md:hidden sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0">
            SP
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-white text-sm tracking-tight leading-tight">
              StaySphere
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-semibold text-slate-400">Owner Portal</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle owner menu"
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
                  ? "bg-indigo-600 text-white shadow-xs"
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

      {/* 12-Item Sidebar (Drawer on mobile, fixed left column on desktop) */}
      <aside
        className={`${
          mobileNavOpen
            ? "fixed inset-y-0 left-0 z-50 w-72 flex shadow-2xl"
            : "hidden md:flex md:w-64"
        } bg-slate-900 text-slate-300 flex-col shrink-0 border-r border-slate-800 transition-all duration-300`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
                SP
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">StaySphere</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-semibold text-slate-400">Owner Portal</span>
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
                style={{ WebkitTapHighlightColor: "transparent" }}
                className={`nav-item btn-press w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="truncate">{item.label}</span>
                {item.id === "staff" && staffList.length > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-indigo-300 font-bold">
                    {staffList.length}
                  </span>
                )}
                {item.id === "bookings" && bookings.filter((b) => b.status === "AWAITING_PAYMENT").length > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                    {bookings.filter((b) => b.status === "AWAITING_PAYMENT").length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            style={{ WebkitTapHighlightColor: "transparent" }}
            className="btn-press nav-item w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 capitalize">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500">
              {overview?.owner?.companyName || "Organization Management Portal"} • Multi-Property Control
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/owner/properties/new"
              className="btn-press px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Plus className="w-4 h-4" /> Add Property
            </Link>
            <button
              onClick={() => {
                setActiveTab("staff");
                setShowAddStaffModal(true);
              }}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="btn-press px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-indigo-600" /> Invite Staff
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="text-xs font-medium">Loading management data...</span>
            </div>
          ) : (
            <>
              {/* Owner KYC Banner */}
              {overview?.owner && !overview?.owner?.isKycVerified && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0 text-amber-800">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-amber-950">KYC Verification Pending Admin Approval</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">Mandatory</span>
                      </div>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Your owner profile & financial details (PAN: {overview?.owner?.panNumber || "Not linked"}, Bank: {overview?.owner?.bankAccountNumber || "Not linked"}) must be approved by StaySphere Admin before you can publish properties to the public marketplace.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-2.5 py-1">
                      Under Admin Review
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 1: DASHBOARD */}
              {activeTab === "dashboard" && (
                <div className="tab-content space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                      style={{ animation: "staggerIn 280ms var(--ease-out) 0ms both" }}
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase">Properties</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {overview?.stats?.totalProperties || properties.length}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Managed locations</div>
                    </div>

                    <div
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                      style={{ animation: "staggerIn 280ms var(--ease-out) 60ms both" }}
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase">Rooms & Beds</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {overview?.stats?.totalRooms || 0}{" "}
                        <span className="text-sm font-semibold text-slate-400">
                          / {overview?.stats?.totalBeds || 0} beds
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                        {overview?.stats?.occupiedBeds || 0} occupied • {overview?.stats?.vacantBeds || 0} vacant
                      </div>
                    </div>

                    <div
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                      style={{ animation: "staggerIn 280ms var(--ease-out) 120ms both" }}
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase">Active Tenants</div>
                      <div className="text-2xl font-black text-slate-900 mt-1">
                        {overview?.stats?.totalTenants || 0}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Across all properties</div>
                    </div>

                    <div
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
                      style={{ animation: "staggerIn 280ms var(--ease-out) 180ms both" }}
                    >
                      <div className="text-xs font-bold text-slate-400 uppercase">Staff Team</div>
                      <div className="text-2xl font-black text-indigo-600 mt-1">
                        {overview?.stats?.staffCount || staffList.length}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Employees with role access</div>
                    </div>
                  </div>

                  {/* Financial Quick Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
                      <div className="text-xs font-bold text-indigo-300 uppercase">Rent Collected (This Month)</div>
                      <div className="text-3xl font-black mt-2">
                        ₹{(overview?.stats?.totalMonthlyRentCollected || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-indigo-200 mt-2">
                        Online UPI + Recorded Cash Collections
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-xs font-bold text-slate-400 uppercase">Pending Rent Collection</div>
                      <div className="text-3xl font-black text-amber-600 mt-2">
                        ₹{(overview?.stats?.totalPendingRent || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Pending dues across tenant schedules
                      </div>
                    </div>
                  </div>

                  {/* Occupancy, Collection Efficiency & Dues Aging */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Collection Efficiency</div>
                      <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
                        {overview?.stats?.collectionEfficiency ?? 100}%
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${overview?.stats?.collectionEfficiency ?? 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Dues 0–7 Days</div>
                      <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                        ₹{(overview?.stats?.duesAging?.bucket0to7 || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Current &amp; grace window</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Dues 8–30 Days</div>
                      <div className="text-xl font-black text-amber-600 mt-1 tabular-nums">
                        ₹{(overview?.stats?.duesAging?.bucket8to30 || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Follow-up recommended</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Dues 30+ Days</div>
                      <div className="text-xl font-black text-rose-600 mt-1 tabular-nums">
                        ₹{(overview?.stats?.duesAging?.bucket30Plus || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Urgent escalation</div>
                    </div>
                  </div>

                  {/* Recent Bookings */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Recent Booking Requests</h3>
                      <button
                        onClick={() => setActiveTab("bookings")}
                        style={{ WebkitTapHighlightColor: "transparent" }}
                        className="btn-press text-xs font-bold text-indigo-600 hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    {bookings.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No booking requests yet.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {bookings.slice(0, 5).map((b) => (
                          <div key={b.id} className="p-4 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{b.tenantUser?.name || "Tenant"}</div>
                              <div className="text-slate-500 text-[11px]">
                                {b.property?.name} • Room {b.room?.roomNumber || "-"}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.status === "CONFIRMED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : b.status === "AWAITING_PAYMENT"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {b.status}
                              </span>
                              {b.status === "AWAITING_PAYMENT" && (
                                <button
                                  onClick={() => handleBookingAction(b.id, "CONFIRMED")}
                                  style={{ WebkitTapHighlightColor: "transparent" }}
                                  className="btn-press px-2 py-1 rounded bg-indigo-600 text-white font-bold text-[10px]"
                                >
                                  Approve
                                </button>
                              )}
                              {b.status === "CONFIRMED" && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {new Date(b.checkInDate).getTime() < Date.now() && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                      Overdue arrival
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleBookingAction(b.id, "CHECKED_IN")}
                                    style={{ WebkitTapHighlightColor: "transparent" }}
                                    className="btn-press px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                                  >
                                    Mark as Checked In
                                  </button>
                                  {new Date(b.checkInDate).getTime() < Date.now() && (
                                    <button
                                      onClick={() => handleBookingAction(b.id, "NO_SHOW")}
                                      style={{ WebkitTapHighlightColor: "transparent" }}
                                      className="btn-press px-2 py-1 rounded bg-slate-700 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                                      title="Mark resident as No-show and release bed"
                                    >
                                      Mark No-show
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MY PROPERTIES */}
              {activeTab === "properties" && (
                <div className="tab-content space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Registered PG Properties</h3>
                    <Link
                      href="/owner/properties/new"
                      className="btn-press px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Register New PG
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((p) => (
                      <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                              {p.genderPreference}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 mt-1">{p.name}</h4>
                            <p className="text-[11px] text-slate-500">{p.address?.locality || p.address?.city}</p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.verificationStatus === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : p.verificationStatus === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {p.verificationStatus === "REJECTED" ? "Action Required" : p.verificationStatus}
                          </span>
                        </div>

                        {p.rejectionReason && (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-0.5">
                            <span className="font-bold">Admin Feedback:</span>
                            <p className="italic">"{p.rejectionReason}"</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                          <div>
                            <span className="text-slate-400">Rent starts:</span>{" "}
                            <span className="font-bold">₹{p.startingRent}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Rooms:</span>{" "}
                            <span className="font-bold">{p.rooms?.length || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            href={`/properties/${p.slug || p.id}`}
                            className="flex-1 text-center py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                          >
                            Public Page
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2.5: TENANT VISITS */}
              {activeTab === "visits" && (
                <div className="tab-content space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Tenant Physical Visit Schedules</h3>
                      <p className="text-xs text-slate-500">Coordinate and greet prospective residents scheduling in-person room walkthroughs</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                      {visits.length} Total Visits
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    {visits.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No in-person visits booked for your properties yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {visits.map((v) => (
                          <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{v.name}</span>
                                <a href={`tel:${v.phone}`} className="text-blue-600 font-semibold hover:underline">
                                  {v.phone}
                                </a>
                                {v.email && <span className="text-slate-400">• {v.email}</span>}
                              </div>
                              <p className="text-slate-600">
                                Property: <strong className="text-slate-800">{v.property?.name}</strong>
                              </p>
                              <div className="text-[11px] text-slate-500">
                                Preferred Date: <span className="font-semibold text-slate-800">{new Date(v.visitDate).toLocaleDateString()}</span> ({v.timeSlot.toLowerCase()})
                                {v.sharingInterest && <span> • Interest: {v.sharingInterest.toLowerCase()} sharing</span>}
                              </div>
                              {v.notes && (
                                <p className="text-[11px] text-slate-500 italic">"{v.notes}"</p>
                              )}
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-center ${
                                v.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : v.status === "CANCELLED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {v.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MEDIA & 360 TOURS */}
              {activeTab === "media" && (
                <div className="tab-content bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Virtual Tours & Media Assets</h3>
                  <p className="text-xs text-slate-500">
                    Upload 360-degree panoramic imagery and photos for your PG properties.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.map((p) => (
                      <div key={p.id} className="border border-slate-200 p-4 rounded-xl space-y-2">
                        <div className="font-bold text-xs text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {p.media?.length || 0} media items • {p.virtualTours?.length || 0} virtual tours
                        </div>
                        <Link
                          href={`/properties/${p.slug || p.id}`}
                          className="inline-block text-xs font-bold text-indigo-600 hover:underline"
                        >
                          View 3D Tour & Images →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: ROOMS & BEDS (VACANT BED LIVE LIST) */}
              {activeTab === "rooms" && (
                <div className="tab-content space-y-6">
                  {/* Live Vacancy Tracker Header */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Vacant Bed List • Live Room Occupancy</h3>
                        <p className="text-xs text-slate-500">Live occupancy matrix across rooms and beds</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setElectricityModalRoomId(undefined);
                            setShowElectricityModal(true);
                          }}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                          className="btn-press px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Split Meter Bill</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const vacant = liveBeds.find((b) => b.status === "vacant");
                            setSelectedOnboardBed(vacant || null);
                            setShowOnboardModal(true);
                          }}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                          className="btn-press px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>Onboard New Tenant</span>
                        </button>

                        <button
                          onClick={() => {
                            const vacantList = liveBeds
                              .filter((b) => b.status === "vacant")
                              .map((b) => b.code || b.bedNumber)
                              .slice(0, 3)
                              .join(", ");
                            const text = encodeURIComponent(
                              `*Available Beds @ StaySphere PG!* \nAvailable beds: ${vacantList || "Room 104-A, Room 202-B"}. \n✨ Facilities: AC, High Speed WiFi, 3 Times Fresh Mess Food, Daily Cleaning, Sub-meter Electricity.\nRent: ₹7,500/month.\nBook directly: https://staysphere.in/vacancies`
                            );
                            window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                            toast.success("Vacant bed links opened in WhatsApp to share!");
                          }}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                          className="btn-press px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share Vacant Beds (WhatsApp)</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary Counters */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <div className="text-2xl font-black text-emerald-700">
                          {liveBeds.filter((b) => b.status === "occupied").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mt-0.5">Occupied</div>
                      </div>
                      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
                        <div className="text-2xl font-black text-rose-700">
                          {liveBeds.filter((b) => b.status === "vacant").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-800 mt-0.5">Vacant</div>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                        <div className="text-2xl font-black text-amber-700">
                          {liveBeds.filter((b) => b.status === "notice").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mt-0.5">Notice Period</div>
                      </div>
                    </div>

                    {/* Bed Matrix Grid */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Interactive Bed Matrix (Click bed to view status)
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                        {liveBeds.map((b) => {
                          const isVacant = b.status === "vacant";
                          const isNotice = b.status === "notice";
                          return (
                            <button
                              key={b.code}
                              onClick={() => setSelectedBedInfo(b)}
                              style={{ WebkitTapHighlightColor: "transparent" }}
                              className={`btn-press p-2.5 rounded-xl text-center border font-mono text-xs font-bold transition-all cursor-pointer ${
                                isVacant
                                  ? "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-200"
                                  : isNotice
                                  ? "bg-amber-50 border-amber-300 text-amber-800"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <div>{b.code}</div>
                              <div className="text-[8px] font-sans font-normal opacity-80 mt-0.5">
                                {isVacant ? "VACANT" : isNotice ? "NOTICE" : "OCCUPIED"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revenue Loss Alert */}
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900 font-semibold">
                      <span>2 vacant beds • ₹15,000 / month revenue loss (Each vacant bed results in monthly rent loss)</span>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    </div>
                  </div>

                  {/* Standard Property Room List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {properties.map((p) => (
                      <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <div className="font-bold text-sm text-slate-900">{p.name}</div>
                        <div className="space-y-2">
                          {(p.rooms || []).map((r: any) => (
                            <div key={r.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-900">Room {r.roomNumber}</span>
                                <span className="text-slate-400 text-[10px] ml-2">({r.sharingType})</span>
                                <div className="text-[11px] text-slate-500 font-semibold">₹{r.monthlyRent} / month</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-indigo-600">
                                  {r.beds?.length || 0} beds
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setElectricityModalRoomId(r.id);
                                    setShowElectricityModal(true);
                                  }}
                                  style={{ WebkitTapHighlightColor: "transparent" }}
                                  className="btn-press p-1 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 border border-amber-200 transition-colors cursor-pointer"
                                  title="Calculate & split sub-meter bill"
                                >
                                  <Zap className="w-3 h-3 text-amber-600" />
                                  <span>Split</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: TENANT MANAGEMENT */}
              {activeTab === "tenants" && (
                <div className="tab-content bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Active Residents Roster & KYC Document Verification</h3>
                      <p className="text-xs text-slate-500">Live verification status for Aadhaar, photo, agreement and police verification</p>
                    </div>
                    <button
                      onClick={() => setShowOnboardModal(true)}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      <span>Onboard New Tenant</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {tenantList.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No active tenants assigned yet.</div>
                    ) : (
                      tenantList.map((t: any) => {
                        const user = t.user || t.tenant?.user;
                        const roomNumber = t.currentBed?.room?.roomNumber || t.room?.roomNumber || "—";
                        const bedNumber = t.currentBed?.bedNumber || t.bed?.bedNumber || "—";
                        const isVerified = t.isKycVerified || t.tenant?.isKycVerified;
                        const idProofType = t.idProofType || t.tenant?.idProofType || "Aadhaar Card";
                        const idProofNumber = t.idProofNumber || t.tenant?.idProofNumber;
                        const idProofDocUrl = t.idProofDocumentUrl || t.tenant?.idProofDocumentUrl;
                        const photoUrl = t.photoUrl || t.user?.avatarUrl || t.tenant?.user?.avatarUrl;
                        const tcAcceptedAt = t.tcAcceptedAt || t.tenant?.tcAcceptedAt;
                        const tcVersion = t.tcVersion || t.tenant?.tcVersion;
                        const kycStatus = t.kycStatus || t.tenant?.kycStatus || "PENDING";
                        const rejectionReason = t.rejectionReason || t.tenant?.rejectionReason;

                        return (
                          <div key={t.id || user?.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                              {/* Tenant Info */}
                              <div className="space-y-1.5 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-extrabold text-slate-900 text-sm">{user?.name || "Resident"}</span>
                                  {roomNumber !== "—" && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                      Room {roomNumber} · Bed {bedNumber}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    kycStatus === "APPROVED"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : kycStatus === "REJECTED"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    {kycStatus === "APPROVED" ? "KYC Approved" : kycStatus === "REJECTED" ? "Docs Rejected" : "Pending Verification"}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500">
                                  {user?.email} {user?.phone && <> • {user.phone}</>}
                                </div>

                                {/* Document Verification Checkpoints */}
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                                  {/* ID Proof */}
                                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                                    idProofNumber ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-rose-50 text-rose-600 border-rose-200"
                                  }`}>
                                    {idProofType}{idProofNumber ? ` ···${idProofNumber.slice(-4)}` : " — Missing"}
                                  </span>

                                  {/* Photo */}
                                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                                    photoUrl ? "bg-slate-100 text-slate-700 border-slate-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}>
                                    Photo: {photoUrl ? "Uploaded" : "Not uploaded"}
                                  </span>

                                  {/* ID Doc URL */}
                                  {idProofDocUrl ? (
                                    <a
                                      href={idProofDocUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                                    >
                                      View ID Doc ↗
                                    </a>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                                      ID Doc: Not uploaded
                                    </span>
                                  )}

                                  {/* T&C Acceptance */}
                                  <span className={`px-2 py-0.5 rounded font-semibold border ${
                                    tcAcceptedAt ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"
                                  }`}>
                                    {tcAcceptedAt
                                      ? `T&C Accepted (${tcVersion || "v1.0"}) · ${new Date(tcAcceptedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
                                      : "T&C: Not Accepted"}
                                  </span>
                                </div>

                                {/* Rejection Reason if rejected */}
                                {kycStatus === "REJECTED" && rejectionReason && (
                                  <div className="mt-1 px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                                    <span className="font-bold">Rejection Reason:</span> {rejectionReason}
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                                {/* Always show View Documents button */}
                                <button
                                  type="button"
                                  onClick={() => { setDocModalTenant(t); setShowDocModal(true); }}
                                  style={{ WebkitTapHighlightColor: "transparent" }}
                                  className="btn-press px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer border border-slate-200 flex items-center gap-1.5 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Documents
                                </button>

                                {kycStatus !== "APPROVED" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveTenantDocs(t.id, user?.name || "Resident")}
                                      style={{ WebkitTapHighlightColor: "transparent" }}
                                      className="btn-press px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      Approve KYC
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectTenantId(t.id);
                                        setRejectTenantName(user?.name || "Resident");
                                        setRejectReason("");
                                        setShowRejectModal(true);
                                      }}
                                      style={{ WebkitTapHighlightColor: "transparent" }}
                                      className="btn-press px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs cursor-pointer border border-rose-200 flex items-center gap-1.5 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                    All Docs Verified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}



              {/* TAB 6: BOOKINGS */}
              {activeTab === "bookings" && (
                <div className="tab-content bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900">Stay Bookings</h3>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {bookings.map((b) => (
                      <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{b.tenantUser?.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.property?.name} • Room {b.room?.roomNumber || "-"} • Bed {b.bed?.bedNumber || "-"}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Check-in: {new Date(b.checkInDate).toLocaleDateString()}
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
                          {b.status === "AWAITING_PAYMENT" && (
                            <>
                              <button
                                onClick={() => handleBookingAction(b.id, "CONFIRMED")}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                className="btn-press px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px]"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => handleBookingAction(b.id, "REJECTED")}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                className="btn-press px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {b.status === "CONFIRMED" && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {new Date(b.checkInDate).getTime() < Date.now() && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Overdue arrival
                                </span>
                              )}
                              <button
                                onClick={() => handleBookingAction(b.id, "CHECKED_IN")}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                className="btn-press px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Mark as Checked In
                              </button>
                              {new Date(b.checkInDate).getTime() < Date.now() && (
                                <button
                                  onClick={() => handleBookingAction(b.id, "NO_SHOW")}
                                  style={{ WebkitTapHighlightColor: "transparent" }}
                                  className="btn-press px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                                  title="Mark resident as No-show and release bed"
                                >
                                  Mark No-show
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: RENT & PAYMENTS (RENT & DEPOSIT LEDGER) */}
              {activeTab === "rent" && (
                <div className="tab-content space-y-6">
                  {/* Rent & Deposit Ledger Overview */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Rent & Deposit Ledger</h3>
                        <p className="text-xs text-slate-500">Current cycle • 38 / 40 beds occupied</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setElectricityModalRoomId(undefined);
                            setShowElectricityModal(true);
                          }}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                          className="btn-press px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Split Electricity Bill</span>
                        </button>

                        <button
                          onClick={() => toast.success("Monthly rent statement exported & downloaded!")}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                          className="btn-press px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Rent Report</span>
                        </button>
                      </div>
                    </div>

                    {/* 3 Large KPI Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">COLLECTED THIS MONTH</span>
                        <div className="text-3xl font-black text-emerald-700 mt-1">₹2,58,000</div>
                        <div className="text-xs text-emerald-800 mt-1 font-medium">92% collection rate • 38 beds paid</div>
                      </div>

                      <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">OVERDUE RENT (PENDING)</span>
                        <div className="text-3xl font-black text-rose-700 mt-1">₹34,000</div>
                        <div className="text-xs text-rose-800 mt-1 font-medium">4 tenants pending • Due date 5th passed</div>
                      </div>

                      <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">SECURITY DEPOSITS HELD</span>
                        <div className="text-3xl font-black text-blue-700 mt-1">₹5,70,000</div>
                        <div className="text-xs text-blue-800 mt-1 font-medium">Held securely across active residents</div>
                      </div>
                    </div>

                    {/* Overdue Rent List with 1-Click WhatsApp Reminders */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Overdue Tenants List
                        </h4>
                        <span className="text-[11px] text-slate-400">Automatic reminder templates via WhatsApp</span>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                        {ownerOverdueList.map((tenant, idx) => (
                          <div
                            key={tenant.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            style={{ animation: `staggerIn 280ms var(--ease-out) ${idx * 50}ms both` }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                                {tenant.initials}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{tenant.name} • <span className="font-medium text-slate-500">{tenant.room}</span></div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {tenant.status === "Reminder sent" ? (
                                    <span className="text-emerald-600 font-semibold">Reminder sent (WhatsApp sent)</span>
                                  ) : (
                                    <span className="text-rose-600 font-semibold">{tenant.status}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-black text-sm text-slate-900">₹{tenant.amount.toLocaleString("en-IN")}</div>
                                <div className="text-[10px] text-slate-400">Monthly rent</div>
                              </div>

                              {tenant.status !== "Reminder sent" ? (
                                <button
                                  onClick={() => {
                                    setOwnerOverdueList(
                                      ownerOverdueList.map((item) =>
                                        item.id === tenant.id ? { ...item, status: "Reminder sent" } : item
                                      )
                                    );
                                    const text = encodeURIComponent(
                                      `Hello ${tenant.name}, your StaySphere PG rent of ₹${tenant.amount.toLocaleString(
                                        "en-IN"
                                      )} is currently due. Please complete the payment through the app or UPI. Thank you - StaySphere`
                                    );
                                    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
                                    toast.success(`Reminder dispatched to ${tenant.name} via WhatsApp!`);
                                  }}
                                  style={{ WebkitTapHighlightColor: "transparent" }}
                                  className="btn-press px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Send Reminder</span>
                                </button>
                              ) : (
                                <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                                  Reminder Sent
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Existing Rent Invoices Ledger */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">All Rent Invoices</h4>
                    </div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {rentSchedules.map((rs) => (
                        <div key={rs.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">{rs.tenant?.user?.name || "Tenant"}</div>
                            <div className="text-[11px] text-slate-500">
                              Due Date: {new Date(rs.dueDate).toLocaleDateString()} • {rs.month}/{rs.year}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm text-slate-900">₹{rs.amount}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rs.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {rs.status}
                            </span>
                            {rs.status !== "PAID" && (
                              <button
                                onClick={() => {
                                  setSelectedRentSchedule(rs);
                                  setManualAmount(String(rs.amount));
                                  setShowManualRentModal(true);
                                }}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                className="btn-press px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Record Payment
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: REPORTS & ANALYTICS */}
              {activeTab === "reports" && (
                <div className="tab-content bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Financial Reports & Occupancy Export</h3>
                      <p className="text-xs text-slate-500">Download statements for accounting and GST filing</p>
                    </div>
                    <button
                      onClick={() => alert("CSV statement generated & downloaded.")}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Statement (CSV)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Collected</div>
                      <div className="text-xl font-black text-slate-900 mt-1">
                        ₹{(overview?.stats?.totalMonthlyRentCollected || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Dues</div>
                      <div className="text-xl font-black text-amber-600 mt-1">
                        ₹{(overview?.stats?.totalPendingRent || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Occupancy Rate</div>
                      <div className="text-xl font-black text-emerald-600 mt-1">
                        {overview?.stats?.totalBeds
                          ? Math.round(((overview?.stats?.occupiedBeds || 0) / overview.stats.totalBeds) * 100)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: MAINTENANCE & COMPLAINTS */}
              {activeTab === "maintenance" && (
                <div className="tab-content bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Tenant Maintenance Requests</h3>
                      <p className="text-xs text-slate-500">Live operational sync between tenants, staff & PG owner</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">Total: {tickets.length} tickets</span>
                  </div>
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">No active maintenance tickets.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {tickets.map((t) => (
                        <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{t.title}</span>
                              <span className="text-[10px] font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50">
                                {t.category}
                              </span>
                              <span className="text-[10px] font-bold text-slate-600 px-2 py-0.5 rounded bg-slate-100">
                                {t.user?.tenantProfile?.currentBed
                                  ? `Room ${t.user.tenantProfile.currentBed.room?.roomNumber || "101"} (${t.user.tenantProfile.currentBed.bedNumber || "A"})`
                                  : t.user?.tenantProfile?.allocations?.[0]?.bed
                                  ? `Room ${t.user.tenantProfile.allocations[0].bed.room?.roomNumber || "101"} (${t.user.tenantProfile.allocations[0].bed.bedNumber || "A"})`
                                  : "Room 101"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-1">{t.description}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Reported by {t.user?.name || "Resident"} ({t.user?.phone || "No phone"}) at{" "}
                              {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={t.status}
                              onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                              style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 border focus:outline-none cursor-pointer ${
                                t.status === "RESOLVED" || t.status === "CLOSED"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                                  : t.status === "IN_PROGRESS"
                                  ? "bg-amber-50 border-amber-300 text-amber-800"
                                  : "bg-blue-50 border-blue-300 text-blue-800"
                              }`}
                            >
                              <option value="OPEN">Open (New)</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="RESOLVED">Resolved (Done)</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 10: ANNOUNCEMENTS */}
              {activeTab === "announcements" && (
                <div className="tab-content space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Broadcast Announcements</h3>
                    <button
                      onClick={() => setShowAnnouncementModal(true)}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> New Notice
                    </button>
                  </div>

                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{a.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 11: STAFF MANAGEMENT (Key SaaS Capability) */}
              {activeTab === "staff" && (
                <div className="tab-content space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Staff & Employee Accounts</h3>
                      <p className="text-xs text-slate-500">
                        Create dedicated accounts for Property Managers, Receptionists, Accountants, and Maintenance Staff
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start"
                    >
                      <UserPlus className="w-4 h-4" /> Create Staff Account
                    </button>
                  </div>

                  {/* Staff List */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {staffList.length === 0 ? (
                      <div className="p-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        <div className="text-sm font-bold text-slate-900">No staff members created yet</div>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Delegate operations safely without sharing your master owner login.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {staffList.map((s) => (
                          <div key={s.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-sm text-slate-900">{s.user?.name}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {s.staffRole.replace("_", " ")}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                  }`}
                                >
                                  {s.isActive ? "Active" : "Disabled"}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                <span>{s.user?.email}</span>
                                <span>•</span>
                                <span>{s.user?.phone || "No phone"}</span>
                                <span>•</span>
                                <span>Property: {s.property?.name || "All Owner Properties"}</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(s.permissions || []).map((perm: string) => (
                                  <span key={perm} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                                    {perm}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start md:self-center">
                              <button
                                onClick={() => handleToggleStaffActive(s.id, s.isActive)}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                className={`btn-press px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                                  s.isActive
                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                {s.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteStaff(s.id)}
                                style={{ WebkitTapHighlightColor: "transparent" }}
                                className="btn-press p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 12: SETTINGS */}
              {activeTab === "settings" && (
                <div className="tab-content max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Owner Business & Bank Details</h3>
                    <p className="text-xs text-slate-500">
                      Configure your payout bank account for direct tenant rent disbursements
                    </p>
                  </div>

                  {settingsSaved && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Settings updated successfully!</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company / Trade Name</label>
                      <input
                        type="text"
                        value={settingsForm.companyName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                        style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                        <input
                          type="text"
                          value={settingsForm.panNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, panNumber: e.target.value })}
                          style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">GST Number</label>
                        <input
                          type="text"
                          value={settingsForm.gstNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, gstNumber: e.target.value })}
                          style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-900 mb-3">Bank Payout Account</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Beneficiary Name</label>
                          <input
                            type="text"
                            value={settingsForm.bankAccountName}
                            onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountName: e.target.value })}
                            style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                            <input
                              type="text"
                              value={settingsForm.bankAccountNumber}
                              onChange={(e) => setSettingsForm({ ...settingsForm, bankAccountNumber: e.target.value })}
                              style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                            <input
                              type="text"
                              value={settingsForm.bankIfscCode}
                              onChange={(e) => setSettingsForm({ ...settingsForm, bankIfscCode: e.target.value })}
                              style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={settingsSaving}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                    >
                      {settingsSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Business Settings"
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* MODAL: CREATE STAFF ACCOUNT */}
      {showAddStaffModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add Staff Account</h3>
                <p className="text-xs text-slate-500">
                  Assign staff sub-roles with preset or customized permissions
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {staffSuccess}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Verma"
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="ramesh@staysphere.in"
                    style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temporary Initial Password *</label>
                <input
                  type="text"
                  required
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                />
              </div>

              {/* Staff Sub-Role Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Role Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { role: StaffRole.PROPERTY_MANAGER, label: "Property Manager", desc: "Bookings, tenants, rooms" },
                    { role: StaffRole.RECEPTIONIST, label: "Receptionist", desc: "Check-in/out, guests" },
                    { role: StaffRole.ACCOUNTANT, label: "Accountant", desc: "Rent, invoices, ledger" },
                    { role: StaffRole.MAINTENANCE_STAFF, label: "Maintenance", desc: "Complaints & repair tasks" },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => {
                        setStaffRole(r.role);
                        setCustomPerms(STAFF_ROLE_PERMISSIONS[r.role] || []);
                      }}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className={`btn-press p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        staffRole === r.role
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign to Property</label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                >
                  <option value="">All Owner Properties (Unrestricted)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={staffSubmitting}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2"
                >
                  {staffSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Save Staff Account"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BROADCAST ANNOUNCEMENT */}
      {showAnnouncementModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Broadcast Notice</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi Maintenance Tomorrow"
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Content *</label>
                <textarea
                  required
                  rows={3}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Details of the announcement..."
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value)}
                    style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Audience</label>
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs"
                  >
                    <option value="ALL">All (Tenants & Staff)</option>
                    <option value="TENANTS">Tenants Only</option>
                    <option value="STAFF">Staff Only</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={annSubmitting}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2"
                >
                  {annSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Publish Notice"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL RENT RECORDING */}
      {showManualRentModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Record Rent Collection</h3>
              <button
                onClick={() => setShowManualRentModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordManualPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI_OFFLINE">UPI QR / PhonePe / GPay</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. Cash collected by Reception"
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualRentModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2 rounded-xl border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Record Offline
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Or Instant Online Collection via UPI Gateway
              </div>
              <UpiCheckoutButton
                amount={Number(manualAmount) || 7500}
                paymentType="MONTHLY_RENT"
                invoiceId={selectedRentSchedule?.invoices?.[0]?.id}
                buttonText={`Collect ₹${(Number(manualAmount) || 7500).toLocaleString("en-IN")} via UPI`}
                className="py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700"
                onSuccess={() => {
                  setShowManualRentModal(false);
                  toast.success("UPI payment successful! Rent recorded.");
                  loadAllOwnerData();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE BED INSPECTION */}
      {selectedBedInfo && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
        >
          <div
            className="bg-white rounded-3xl max-w-xs w-full p-6 shadow-2xl space-y-4"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Bed {selectedBedInfo.code}</span>
              <button
                onClick={() => setSelectedBedInfo(null)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press text-slate-400 hover:text-slate-600 text-sm"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className={`font-bold uppercase ${
                  selectedBedInfo.status === "vacant"
                    ? "text-rose-600"
                    : selectedBedInfo.status === "notice"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}>
                  {selectedBedInfo.status}
                </span>
              </div>
              {selectedBedInfo.tenant && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Resident:</span>
                  <span className="font-bold text-slate-900">{selectedBedInfo.tenant}</span>
                </div>
              )}
              {selectedBedInfo.tenantPhone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-bold text-slate-900">{selectedBedInfo.tenantPhone}</span>
                </div>
              )}
              {selectedBedInfo.daysVacant && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Vacancy Duration:</span>
                  <span className="font-bold text-rose-600">{selectedBedInfo.daysVacant} days vacant</span>
                </div>
              )}
              {selectedBedInfo.checkOutDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Move-Out Date:</span>
                  <span className="font-bold text-amber-700">{new Date(selectedBedInfo.checkOutDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Monthly Rent:</span>
                <span className="font-bold text-slate-900">₹{selectedBedInfo.rent || selectedBedInfo.monthlyRent || 7500}</span>
              </div>
            </div>

            {selectedBedInfo.status === "vacant" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOnboardBed(selectedBedInfo);
                  setSelectedBedInfo(null);
                  setShowOnboardModal(true);
                }}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Onboard Tenant to Bed {selectedBedInfo.code}
              </button>
            )}

            {selectedBedInfo.status === "notice" && (
              <button
                type="button"
                onClick={() => {
                  setShowOwnerCheckoutModal(true);
                }}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
              >
                Process Move-Out & Settle Deposit
              </button>
            )}

            <button
              onClick={() => setSelectedBedInfo(null)}
              style={{ WebkitTapHighlightColor: "transparent" }}
              className="btn-press w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: OWNER ONBOARD NEW TENANT */}
      {showOnboardModal && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Owner Direct Entry
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">New Tenant Onboarding</h3>
              </div>
              <button
                onClick={() => setShowOnboardModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press text-slate-400 hover:text-slate-600 text-sm"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Vacant Bed</label>
                <select
                  value={selectedOnboardBed?.bedNumber || selectedOnboardBed?.code || "104-A"}
                  onChange={(e) => {
                    const found = liveBeds.find((b) => (b.bedNumber || b.code) === e.target.value);
                    setSelectedOnboardBed(found || { bedNumber: e.target.value });
                  }}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900"
                >
                  {liveBeds.filter((b) => b.status === "vacant").length > 0 ? (
                    liveBeds
                      .filter((b) => b.status === "vacant")
                      .map((b) => (
                        <option key={b.id || b.code} value={b.code || b.bedNumber}>
                          Bed {b.code || b.bedNumber} (Vacant)
                        </option>
                      ))
                  ) : (
                    <option value="104-A">Bed 104-A (Vacant)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tenant Full Name</label>
                <input
                  type="text"
                  value={onboardForm.name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={onboardForm.phone}
                  onChange={(e) => setOnboardForm({ ...onboardForm, phone: e.target.value })}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Rent</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                    ₹7,500
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Security Deposit</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                    ₹15,000
                  </div>
                </div>
              </div>

              {/* KYC Document Checklist */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Documents Verification Checklist</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnboardForm({ ...onboardForm, idProof: !onboardForm.idProof })}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`btn-press p-2 rounded-xl border flex items-center gap-1.5 text-left cursor-pointer transition-colors ${
                      onboardForm.idProof ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>ID Proof</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardForm({ ...onboardForm, photo: !onboardForm.photo })}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`btn-press p-2 rounded-xl border flex items-center gap-1.5 text-left cursor-pointer transition-colors ${
                      onboardForm.photo ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardForm({ ...onboardForm, agreement: !onboardForm.agreement })}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`btn-press p-2 rounded-xl border flex items-center gap-1.5 text-left cursor-pointer transition-colors ${
                      onboardForm.agreement ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Agreement</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardForm({ ...onboardForm, policeVerification: !onboardForm.policeVerification })}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                    className={`btn-press p-2 rounded-xl border flex items-center gap-1.5 text-left cursor-pointer transition-colors ${
                      onboardForm.policeVerification ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Police Verif.</span>
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bed will automatically become "BHARA (Occupied)" in the live matrix</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={onboardSubmitting}
                  onClick={handleOwnerOnboardTenant}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-sm flex items-center gap-2"
                >
                  {onboardSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Onboarding...
                    </>
                  ) : (
                    "Save Tenant"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OWNER PROCESS MOVE-OUT & SETTLE DEPOSIT */}
      {showOwnerCheckoutModal && selectedBedInfo && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Move-Out Final Settlement
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  Bed {selectedBedInfo.code || selectedBedInfo.bedNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowOwnerCheckoutModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press text-slate-400 hover:text-slate-600 text-sm"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">{selectedBedInfo.tenant || selectedBedInfo.tenantName || "Resident"}</div>
                <div className="text-[11px] text-slate-500">Security Deposit Collected: ₹{selectedBedInfo.securityDeposit || 15000}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deductions (Damages / Pending Electricity)</label>
                <input
                  type="number"
                  value={ownerCheckoutDeductions}
                  onChange={(e) => setOwnerCheckoutDeductions(Math.max(0, Number(e.target.value)))}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-rose-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deduction Reason / Notes</label>
                <input
                  type="text"
                  value={ownerCheckoutReason}
                  onChange={(e) => setOwnerCheckoutReason(e.target.value)}
                  style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-emerald-900">Final Security Deposit Refund:</span>
                <span className="text-base font-black text-emerald-700">
                  ₹{Math.max(0, (selectedBedInfo.securityDeposit || 15000) - ownerCheckoutDeductions).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="text-[11px] text-slate-500">
                Bed will immediately be freed back to "VACANT (Available)" in the live 40-bed matrix.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOwnerCheckoutModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2.5 rounded-xl border border-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={ownerCheckoutSubmitting}
                  onClick={handleOwnerCheckout}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer flex items-center gap-2"
                >
                  {ownerCheckoutSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Settling...
                    </>
                  ) : (
                    "Complete Move-Out & Settle Refund"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TENANT DOCUMENT VIEWER */}
      {showDocModal && docModalTenant && (() => {
        const t = docModalTenant;
        const user = t.user || t.tenant?.user;
        const idProofType = t.idProofType || t.tenant?.idProofType || "Aadhaar Card";
        const idProofNumber = t.idProofNumber || t.tenant?.idProofNumber;
        const idProofDocUrl = t.idProofDocumentUrl || t.tenant?.idProofDocumentUrl;
        const photoUrl = t.photoUrl || user?.avatarUrl || t.tenant?.user?.avatarUrl;
        const tcAcceptedAt = t.tcAcceptedAt || t.tenant?.tcAcceptedAt;
        const tcVersion = t.tcVersion || t.tenant?.tcVersion;
        const tcAcceptedIp = t.tcAcceptedIp || t.tenant?.tcAcceptedIp;
        const kycStatus = t.kycStatus || t.tenant?.kycStatus || "PENDING";
        const emergencyContact = t.emergencyContact || t.tenant?.emergencyContact;
        return (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            style={{ animation: "overlayIn 200ms ease both" }}
            onClick={() => setShowDocModal(false)}
          >
            <div
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden"
              style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Tenant KYC Review</span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">{user?.name || "Resident"}</h3>
                  <p className="text-xs text-slate-400">{user?.email} · {user?.phone || "No phone"}</p>
                </div>
                <button
                  onClick={() => setShowDocModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press text-slate-400 hover:text-white text-xl cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* KYC Status Banner */}
                <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold border ${
                  kycStatus === "APPROVED" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  kycStatus === "REJECTED" ? "bg-rose-50 text-rose-800 border-rose-200" :
                  "bg-amber-50 text-amber-800 border-amber-200"
                }`}>
                  {kycStatus === "APPROVED" ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>KYC Status: {kycStatus}</span>
                </div>

                {/* Photo */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Profile Photo</h4>
                  {photoUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={photoUrl} alt="Tenant Photo" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs" />
                      <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-semibold hover:underline">View Full Size ↗</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Photo not uploaded by tenant
                    </div>
                  )}
                </div>

                {/* ID Proof */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Government ID Proof</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Type</p>
                      <p className="font-semibold text-slate-900">{idProofType}</p>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">ID Number</p>
                      <p className="font-mono font-semibold text-slate-900">{idProofNumber || <span className="text-rose-500">Not provided</span>}</p>
                    </div>
                  </div>
                  {idProofDocUrl ? (
                    <a
                      href={idProofDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs hover:bg-blue-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Open ID Proof Document</span>
                      <span className="ml-auto text-blue-500">↗</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" /> ID document not uploaded — owner cannot verify
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {emergencyContact && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Emergency Contact</h4>
                    <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900">{emergencyContact}</div>
                  </div>
                )}

                {/* Terms & Conditions */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Terms &amp; Conditions Acceptance</h4>
                  {tcAcceptedAt ? (
                    <div className="px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        T&amp;C Accepted — {tcVersion || "v1.0-2026"}
                      </div>
                      <p className="text-[11px] text-emerald-700 pl-6">
                        Accepted on: <span className="font-bold">{new Date(tcAcceptedAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</span>
                      </p>
                      {tcAcceptedIp && (
                        <p className="text-[10px] text-emerald-600 pl-6 font-mono">IP: {tcAcceptedIp}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" /> Terms &amp; Conditions not accepted by tenant
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className="btn-press px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Close
                </button>
                {kycStatus !== "APPROVED" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDocModal(false);
                        setRejectTenantId(t.id);
                        setRejectTenantName(user?.name || "Resident");
                        setRejectReason("");
                        setShowRejectModal(true);
                      }}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-sm cursor-pointer border border-rose-200 flex items-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" /> Reject Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveTenantDocs(t.id, user?.name || "Resident")}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      className="btn-press px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" /> Approve KYC &amp; Verify
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: REJECT TENANT DOCUMENTS */}
      {showRejectModal && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ animation: "overlayIn 200ms ease both" }}
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            style={{ animation: "modalIn 220ms var(--ease-out) both", transformOrigin: "center" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Document Rejection</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">Reject Documents for {rejectTenantName}</h3>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press text-slate-400 hover:text-slate-600 text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              The tenant will be notified with your rejection reason and asked to re-submit updated documents.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Aadhaar card image is blurry / Incorrect ID number provided / Photo missing..."
                style={{ transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)" }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectSubmitting || !rejectReason.trim()}
                onClick={handleRejectTenantDocs}
                style={{ WebkitTapHighlightColor: "transparent" }}
                className="btn-press px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {rejectSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><X className="w-4 h-4" /> Reject &amp; Notify Tenant</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SUB-METER ELECTRICITY SPLIT */}
      <ElectricitySplitModal
        isOpen={showElectricityModal}
        onClose={() => setShowElectricityModal(false)}
        initialRoomId={electricityModalRoomId}
        onSuccess={() => {
          toast.success("Electricity bill split applied & notifications dispatched!");
          loadAllOwnerData();
        }}
      />
    </div>
  );
}
