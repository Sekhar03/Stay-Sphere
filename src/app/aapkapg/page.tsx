"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Coffee,
  Wrench,
  Users,
  CreditCard,
  QrCode,
  Share2,
  Send,
  FileText,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Phone,
  ArrowLeft,
  Sparkles,
  Info,
  Calendar,
  DollarSign,
  Download,
  Check,
  RotateCcw,
  Camera,
  Star,
  Copy,
  ExternalLink,
  Lock,
  Building,
  KeyRound,
  UtensilsCrossed,
  Layers,
  ChevronDown,
} from "lucide-react";

// Types
type Role = "TENANT" | "MANAGER" | "OWNER" | "LOGIN";
type ScreenId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Language = "hi" | "en";

interface ComplaintItem {
  id: number;
  title: string;
  category: "AC" | "WiFi" | "Plumbing" | "Cleaning" | "Geyser" | "Door";
  room: string;
  status: "New" | "In Progress" | "Done";
  timeLogged: string;
  managerSeenTime: string | null;
  resolvedTime: string | null;
  hasPhoto: boolean;
}

interface MeterEntry {
  room: string;
  previous: number;
  current: number;
  units: number;
  bill: number;
  photoUrl?: string;
  sent: boolean;
}

interface OverdueTenant {
  id: string;
  initials: string;
  name: string;
  room: string;
  amount: number;
  status: "2 days overdue" | "Reminder sent" | "Due today";
  phone: string;
}

interface BedSlot {
  code: string;
  room: string;
  bed: "A" | "B";
  status: "occupied" | "vacant" | "notice";
  tenantName?: string;
  rent: number;
  daysVacant?: number;
}

export default function StaySpherePGSuiteApp() {
  // Navigation & View state
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(1);
  const [viewMode, setViewMode] = useState<"phone" | "expanded">("phone");
  const [lang, setLang] = useState<Language>("en");
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auth & Roles
  const [activeRole, setActiveRole] = useState<Role>("TENANT");
  const [loginPhone, setLoginPhone] = useState("+91 98765 43210");
  const [loginOtp, setLoginOtp] = useState(["3", "8", "1", "6"]);
  const [selectedLoginRole, setSelectedLoginRole] = useState<Role>("TENANT");

  // Read URL params on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role")?.toUpperCase();
      const screenParam = params.get("screen");
      if (
        roleParam === "TENANT" ||
        roleParam === "MANAGER" ||
        roleParam === "OWNER" ||
        roleParam === "LOGIN"
      ) {
        switchRole(roleParam as Role);
      }
      if (screenParam) {
        const num = parseInt(screenParam, 10);
        if (num >= 1 && num <= 10) {
          jumpToScreen(num as ScreenId);
        }
      }
    }
  }, []);

  // Screen 1: Online Rent
  const [rentPaid, setRentPaid] = useState(true);
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);

  // Screen 2: Electricity Bill
  const [billPaid, setBillPaid] = useState(false);
  const [showMeterPhoto, setShowMeterPhoto] = useState(false);

  // Screen 3: Complaint (Tenant)
  const [selectedComplaintCategory, setSelectedComplaintCategory] = useState<
    "AC" | "WiFi" | "Plumbing" | "Cleaning" | "Geyser" | "Door"
  >("AC");
  const [newComplaintText, setNewComplaintText] = useState("");
  const [complaints, setComplaints] = useState<ComplaintItem[]>([
    {
      id: 1,
      title: "Air Conditioner not cooling properly",
      category: "AC",
      room: "Room 203",
      status: "Done",
      timeLogged: "8:40 AM",
      managerSeenTime: "8:52 AM",
      resolvedTime: "11:15 AM",
      hasPhoto: true,
    },
    {
      id: 2,
      title: "WiFi slow speed in evening",
      category: "WiFi",
      room: "Room 108",
      status: "In Progress",
      timeLogged: "9:15 AM",
      managerSeenTime: "9:30 AM",
      resolvedTime: null,
      hasPhoto: false,
    },
    {
      id: 3,
      title: "Geyser auto-cut not working",
      category: "Geyser",
      room: "Room 301",
      status: "New",
      timeLogged: "10:10 AM",
      managerSeenTime: null,
      resolvedTime: null,
      hasPhoto: true,
    },
    {
      id: 4,
      title: "2nd floor corridor cleaning required",
      category: "Cleaning",
      room: "Room 2nd floor",
      status: "Done",
      timeLogged: "7:20 AM",
      managerSeenTime: "7:40 AM",
      resolvedTime: "9:00 AM",
      hasPhoto: false,
    },
    {
      id: 5,
      title: "Door lock latch loose",
      category: "Door",
      room: "Room 105",
      status: "New",
      timeLogged: "10:05 AM",
      managerSeenTime: null,
      resolvedTime: null,
      hasPhoto: false,
    },
  ]);

  // Screen 4: Meal Menu
  const [selectedMenuDay, setSelectedMenuDay] = useState(10);
  const [foodRating, setFoodRating] = useState<number>(4);
  const [skipFoodToday, setSkipFoodToday] = useState(false);

  // Screen 5: Meter Reading (Manager)
  const [ratePerUnit, setRatePerUnit] = useState(9);
  const [meterList, setMeterList] = useState<MeterEntry[]>([
    { room: "101", previous: 3912, current: 4108, units: 196, bill: 1764, sent: true },
    { room: "102", previous: 5240, current: 5402, units: 162, bill: 1458, sent: true },
    { room: "203", previous: 4186, current: 4400, units: 214, bill: 1926, sent: false },
    { room: "204", previous: 2950, current: 3121, units: 171, bill: 1539, sent: true },
    { room: "301", previous: 6005, current: 6190, units: 185, bill: 1665, sent: false },
  ]);

  // Screen 7: New Tenant (Manager)
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

  // Screen 8: Owner Ledger
  const [overdueList, setOverdueList] = useState<OverdueTenant[]>([
    { id: "1", initials: "RS", name: "Rahul S.", room: "Room 102", amount: 8500, status: "2 days overdue", phone: "9876543201" },
    { id: "2", initials: "NP", name: "Neha P.", room: "Room 204", amount: 8000, status: "2 days overdue", phone: "9876543202" },
    { id: "3", initials: "AK", name: "Amit K.", room: "Room 301", amount: 9000, status: "Reminder sent", phone: "9876543203" },
    { id: "4", initials: "VT", name: "Vikram T.", room: "Room 108", amount: 8500, status: "Reminder sent", phone: "9876543204" },
  ]);

  // Screen 9: Vacant Bed List (Owner)
  const [beds, setBeds] = useState<BedSlot[]>([
    { code: "101-A", room: "101", bed: "A", status: "occupied", tenantName: "Prakash V.", rent: 7500 },
    { code: "101-B", room: "101", bed: "B", status: "occupied", tenantName: "Anil R.", rent: 7500 },
    { code: "102-A", room: "102", bed: "A", status: "occupied", tenantName: "Rahul S.", rent: 7500 },
    { code: "102-B", room: "102", bed: "B", status: "occupied", tenantName: "Deepak M.", rent: 7500 },
    { code: "103-A", room: "103", bed: "A", status: "occupied", tenantName: "Sumit T.", rent: 7500 },
    { code: "103-B", room: "103", bed: "B", status: "occupied", tenantName: "Pooja D.", rent: 7500 },
    { code: "104-A", room: "104", bed: "A", status: "vacant", rent: 7500, daysVacant: 14 },
    { code: "104-B", room: "104", bed: "B", status: "occupied", tenantName: "Gaurav K.", rent: 7500 },
    { code: "105-A", room: "105", bed: "A", status: "occupied", tenantName: "Karan J.", rent: 7500 },
    { code: "105-B", room: "105", bed: "B", status: "occupied", tenantName: "Mohit C.", rent: 7500 },
    { code: "106-A", room: "106", bed: "A", status: "occupied", tenantName: "Arun P.", rent: 7500 },
    { code: "106-B", room: "106", bed: "B", status: "occupied", tenantName: "Sahil G.", rent: 7500 },
    { code: "107-A", room: "107", bed: "A", status: "occupied", tenantName: "Rajeev N.", rent: 7500 },
    { code: "107-B", room: "107", bed: "B", status: "occupied", tenantName: "Manish H.", rent: 7500 },
    { code: "108-A", room: "108", bed: "A", status: "occupied", tenantName: "Vikram T.", rent: 7500 },
    { code: "108-B", room: "108", bed: "B", status: "notice", tenantName: "Kunal S.", rent: 7500 },
    { code: "201-A", room: "201", bed: "A", status: "occupied", tenantName: "Aditya V.", rent: 7500 },
    { code: "201-B", room: "201", bed: "B", status: "occupied", tenantName: "Prashant L.", rent: 7500 },
    { code: "202-A", room: "202", bed: "A", status: "occupied", tenantName: "Harshita B.", rent: 7500 },
    { code: "202-B", room: "202", bed: "B", status: "vacant", rent: 7500, daysVacant: 7 },
  ]);

  const [selectedBedForDetail, setSelectedBedForDetail] = useState<BedSlot | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Helper trigger toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Switch role and update default screen
  const switchRole = (newRole: Role) => {
    setActiveRole(newRole);
    if (newRole === "TENANT") setCurrentScreen(1);
    else if (newRole === "MANAGER") setCurrentScreen(5);
    else if (newRole === "OWNER") setCurrentScreen(8);
    else if (newRole === "LOGIN") setCurrentScreen(10);
  };

  // Sync role when jumping to screen
  const jumpToScreen = (sId: ScreenId) => {
    setCurrentScreen(sId);
    if (sId >= 1 && sId <= 4) setActiveRole("TENANT");
    else if (sId >= 5 && sId <= 7) setActiveRole("MANAGER");
    else if (sId >= 8 && sId <= 9) setActiveRole("OWNER");
    else if (sId === 10) setActiveRole("LOGIN");
  };

  // Screen Map Info
  const screensMeta = [
    { id: 1, title: "Online Rent", role: "TENANT", time: "9:05", sub: "Rent & Deposit" },
    { id: 2, title: "Electricity Bill", role: "TENANT", time: "9:08", sub: "Meter split" },
    { id: 3, title: "Complaints", role: "TENANT", time: "8:40", sub: "Photo & Status" },
    { id: 4, title: "Food Menu", role: "TENANT", time: "7:45", sub: "Skip & Rating" },
    { id: 5, title: "Meter Readings", role: "MANAGER", time: "6:30", sub: "Auto bill calculation" },
    { id: 6, title: "Complaint Tracker", role: "MANAGER", time: "10:20", sub: "Action board" },
    { id: 7, title: "New Tenant Onboarding", role: "MANAGER", time: "5:15", sub: "Docs & Bed occupied" },
    { id: 8, title: "Rent & Deposit Ledger", role: "OWNER", time: "9:30", sub: "Ledger & Reminders" },
    { id: 9, title: "Live Vacant Beds", role: "OWNER", time: "11:00", sub: "38 Occupied, 2 Vacant" },
    { id: 10, title: "Role Login", role: "LOGIN", time: "7:30", sub: "Mobile OTP" },
  ];

  // Actions
  const handlePayRent = () => {
    setRentPaid(true);
    setShowPayModal(false);
    triggerToast("₹8,500 Paid Successfully! Receipt sent to WhatsApp");
  };

  const handleSendReminder = (tenantId: string, name: string, phone: string, amount: number) => {
    setOverdueList((prev) =>
      prev.map((b) => (b.id === tenantId ? { ...b, status: "Reminder sent" } : b))
    );
    const text = encodeURIComponent(
      `Hello ${name}, your PG rent of ₹${amount.toLocaleString(
        "en-IN"
      )} is due. Please pay via the provided UPI link or the StaySphere app. Thank you - StaySphere`
    );
    triggerToast(`WhatsApp reminder dispatched to ${name} (${phone})`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleShareVacantBeds = () => {
    const text = encodeURIComponent(
      `*Vacant Beds Available @ StaySphere PG!* 
We have vacant beds available in Room 104-A and Room 202-B.
✨ Facilities: AC, High Speed WiFi, 3 Times Fresh Mess Food, Daily Cleaning, Sub-meter Electricity.
Rent: ₹7,500/month.
Book directly or schedule a visit: https://staysphere.in/vacancies`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
    triggerToast("Vacant beds link generated and opened in WhatsApp!");
  };

  const handleSaveNewTenant = () => {
    // Mark bed occupied in beds
    setBeds((prev) =>
      prev.map((b) =>
        b.code === newTenantForm.roomBed
          ? { ...b, status: "occupied", tenantName: newTenantForm.name }
          : b
      )
    );
    triggerToast(`New Tenant "${newTenantForm.name}" saved in Room ${newTenantForm.roomBed}! Bed marked Occupied.`);
    // Jump to bed list or manager dashboard
    jumpToScreen(9);
  };

  const handleSendAllBills = () => {
    setMeterList((prev) => prev.map((m) => ({ ...m, sent: true })));
    triggerToast("Electricity bills sent to all room tenants via WhatsApp & SMS!");
  };

  const handleAddComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaintText.trim()) return;
    const newC: ComplaintItem = {
      id: Date.now(),
      title: newComplaintText,
      category: selectedComplaintCategory,
      room: "Room 203",
      status: "New",
      timeLogged: "Just now",
      managerSeenTime: null,
      resolvedTime: null,
      hasPhoto: true,
    };
    setComplaints([newC, ...complaints]);
    setNewComplaintText("");
    triggerToast("Complaint submitted! Sent directly to property manager.");
  };

  const handleStatusChange = (cId: number, nextStatus: "New" | "In Progress" | "Done") => {
    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === cId) {
          return {
            ...c,
            status: nextStatus,
            managerSeenTime: nextStatus !== "New" ? c.managerSeenTime || "Just now" : null,
            resolvedTime: nextStatus === "Done" ? "Resolved just now" : null,
          };
        }
        return c;
      })
    );
    triggerToast(`Complaint status updated to "${nextStatus}"!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar / Master Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Back to StaySphere Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold tracking-tight text-white">
                      StaySphere
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                      PG Suite · 10 Screens
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    StaySphere automated online rent collection, electricity split & live vacant bed management
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & View Switchers */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === "hi" ? "en" : "hi")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                title="Toggle Hindi / English"
              >
                <span className="text-emerald-400"></span>
                <span>{lang === "hi" ? "हिन्दी / Hinglish" : "English"}</span>
              </button>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
                <button
                  onClick={() => setViewMode("phone")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === "phone"
                      ? "bg-emerald-500 text-slate-950 shadow-sm font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone Mockup</span>
                </button>
                <button
                  onClick={() => setViewMode("expanded")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    viewMode === "expanded"
                      ? "bg-emerald-500 text-slate-950 shadow-sm font-semibold"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Expanded View</span>
                </button>
              </div>

              {/* Blueprint Summary Modal Trigger */}
              <button
                onClick={() => setShowBlueprintModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden md:inline">Blueprint Guide</span>
                <span className="md:hidden">Guide</span>
              </button>
            </div>
          </div>
        </div>

        {/* 10 Screens Ribbon Switcher */}
        <div className="border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Screens:
            </span>
            {screensMeta.map((s) => {
              const isActive = currentScreen === s.id;
              const roleBadgeColor =
                s.role === "TENANT"
                  ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
                  : s.role === "MANAGER"
                  ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                  : s.role === "OWNER"
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-purple-500/40 text-purple-300 bg-purple-500/10";

              return (
                <button
                  key={s.id}
                  onClick={() => jumpToScreen(s.id as ScreenId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-100 text-slate-900 shadow-md scale-[1.02] font-semibold"
                      : "bg-slate-800/70 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? "bg-slate-900 text-white" : "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {s.id}
                  </span>
                  <span>{s.title}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${roleBadgeColor}`}
                  >
                    {s.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Showcase Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center justify-center">
        {/* Dynamic Toast */}
        {toastMessage && (
          <div className="fixed top-24 z-50 animate-bounce bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-slate-950" />
            <span className="text-xs sm:text-sm">{toastMessage}</span>
          </div>
        )}

        {/* Role Tab Selector Bar */}
        <div className="w-full max-w-xl mb-6 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-1 shadow-xl">
          <button
            onClick={() => switchRole("TENANT")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeRole === "TENANT"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tenant (4 screens)</span>
          </button>
          <button
            onClick={() => switchRole("MANAGER")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeRole === "MANAGER"
                ? "bg-amber-600 text-white shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Manager (3 screens)</span>
          </button>
          <button
            onClick={() => switchRole("OWNER")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeRole === "OWNER"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Owner (2 screens)</span>
          </button>
          <button
            onClick={() => switchRole("LOGIN")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeRole === "LOGIN"
                ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline">Login</span>
          </button>
        </div>

        {/* CONTAINER: Phone View vs Expanded View */}
        <div
          className={`w-full transition-all duration-300 flex justify-center ${
            viewMode === "phone" ? "max-w-[420px]" : "max-w-4xl"
          }`}
        >
          {/* Authentic Smartphone Chassis */}
          <div
            className={`w-full bg-slate-900 rounded-[44px] p-3 sm:p-4 border-[6px] sm:border-[8px] border-slate-700 shadow-2xl ring-1 ring-slate-800 relative transition-all ${
              viewMode === "expanded" ? "rounded-3xl border-slate-800 p-6" : ""
            }`}
          >
            {/* Dynamic Island / Phone Top Speaker (in phone view) */}
            {viewMode === "phone" && (
              <div className="flex justify-center mb-2">
                <div className="w-28 h-4 bg-slate-950 rounded-full flex items-center justify-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
                  <div className="w-2 h-2 rounded-full bg-blue-900/60" />
                </div>
              </div>
            )}

            {/* In-App Screen Canvas */}
            <div className="bg-slate-950 rounded-[32px] overflow-hidden border border-slate-800/80 min-h-[640px] flex flex-col justify-between text-slate-100">
              {/* Phone Status Bar */}
              <div className="bg-slate-900/90 px-4 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">
                    {screensMeta.find((s) => s.id === currentScreen)?.time || "9:30"}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-blue-400 tracking-wide uppercase font-bold text-[10px]">
                    STAYSPHERE · {activeRole} DEMO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
                    <div className="h-full w-3.5 bg-emerald-400 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* Subheader: Screen Title & Badge */}
              <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    SCREEN {currentScreen} / 10 · {activeRole}
                  </div>
                  <h2 className="text-lg font-black tracking-tight text-white">
                    {screensMeta.find((s) => s.id === currentScreen)?.title}
                  </h2>
                </div>

                {/* Quick Screen navigation pills */}
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentScreen <= 1}
                    onClick={() => jumpToScreen((currentScreen - 1) as ScreenId)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
                    title="Previous Screen"
                  >
                    ←
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-300 px-1">
                    {currentScreen}/10
                  </span>
                  <button
                    disabled={currentScreen >= 10}
                    onClick={() => jumpToScreen((currentScreen + 1) as ScreenId)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-700"
                    title="Next Screen"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* ======================================================== */}
              {/* SCREEN CONTENT AREA (1 to 10) */}
              {/* ======================================================== */}
              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
                {/* ---------------------------------------------------- */}
                {/* SCREEN 1: ONLINE RENT (TENANT)                       */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 1 && (
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-900 border border-blue-500/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-slate-300">
                          My Rent
                        </span>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                          Room 203 · Bed B
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 my-2">
                        <span className="text-3xl font-extrabold text-white">₹8,500</span>
                        <span className="text-xs text-slate-400">/ month</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Security Deposit ₹15,000 Held</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        rentPaid
                          ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                          : "bg-rose-950/50 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {rentPaid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-400" />
                        )}
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider">
                            {rentPaid
                              ? "NOVEMBER RENT PAID"
                              : "NOVEMBER RENT DUE (₹8,500)"}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Rent ₹7,500 + Meals ₹1,000
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setRentPaid(!rentPaid)}
                        className="text-[10px] underline text-slate-400 hover:text-white"
                        title="Toggle status to test"
                      >
                        [Test toggle]
                      </button>
                    </div>

                    {/* Payment Action */}
                    {!rentPaid ? (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>PAY NOW (UPI · Card · Net Banking)</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          Receipt sent to WhatsApp
                        </span>
                        <button
                          onClick={() => setShowReceiptModal("November")}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-bold border border-slate-700"
                        >
                          View Receipt
                        </button>
                      </div>
                    )}

                    {/* Auto-Debit Feature (UPI AutoPay) */}
                    <div className="p-3.5 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>UPI AutoPay (Auto-debit)</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Auto-debits on the 1st of every month
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAutoPayEnabled(!autoPayEnabled);
                          triggerToast(
                            !autoPayEnabled
                              ? "UPI AutoPay Activated! Automatically pays on the 1st."
                              : "UPI AutoPay Deactivated."
                          );
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                          autoPayEnabled ? "bg-emerald-500 justify-end" : "bg-slate-700 justify-start"
                        }`}
                      >
                        <div className="w-4 h-4 bg-white rounded-full shadow-md" />
                      </button>
                    </div>

                    {/* Previous Months History */}
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {lang === "hi" ? "Pichhle mahine" : "Past Months"}
                      </div>

                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">October</div>
                            <div className="text-[11px] text-slate-400">Paid · 2 Oct · ₹8,500</div>
                          </div>
                          <button
                            onClick={() => setShowReceiptModal("October")}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold hover:bg-blue-600/30 transition-colors"
                          >
                            Receipt
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white">September</div>
                            <div className="text-[11px] text-slate-400">Paid · 1 Sep · ₹8,500</div>
                          </div>
                          <button
                            onClick={() => setShowReceiptModal("September")}
                            className="px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold hover:bg-blue-600/30 transition-colors"
                          >
                            Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 2: ELECTRICITY BILL (TENANT)                  */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Electricity Bill</h3>
                        <p className="text-xs text-slate-400">Room 203 · October</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                        Rate: ₹9 / Unit
                      </span>
                    </div>

                    {/* 3 Reading Boxes */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">PREVIOUS</div>
                        <div className="text-lg font-black text-slate-200 mt-1">4,186</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">CURRENT</div>
                        <div className="text-lg font-black text-emerald-400 mt-1">4,400</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] font-bold uppercase text-slate-400">UNITS</div>
                        <div className="text-lg font-black text-blue-400 mt-1">214</div>
                      </div>
                    </div>

                    {/* Meter Details & Math */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white">Room 203 Sub-meter</span>
                        <span className="text-[11px] text-slate-400">
                          Reading: 31 Oct · Verified by Manager
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Units 214 × ₹9</span>
                          <span className="font-semibold text-white">Room Total ₹1,926</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Room Occupants</span>
                          <span className="font-semibold text-white">2</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                          <span className="font-bold text-emerald-400 text-sm">Your Share</span>
                          <span className="text-2xl font-black text-emerald-400">₹963</span>
                        </div>
                      </div>
                    </div>

                    {/* Meter Photo preview button */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Camera className="w-4 h-4 text-blue-400" />
                        <span>Meter photo attached</span>
                      </div>
                      <button
                        onClick={() => setShowMeterPhoto(true)}
                        className="px-2.5 py-1 rounded-md bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-semibold hover:bg-blue-600/30"
                      >
                        View Photo
                      </button>
                    </div>

                    {/* Pay with rent button */}
                    <button
                      onClick={() => {
                        setBillPaid(true);
                        triggerToast("₹963 Electricity bill paid! Receipt saved.");
                      }}
                      disabled={billPaid}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                        billPaid
                          ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{billPaid ? "₹963 Paid" : "Pay ₹963 with rent"}</span>
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 3: COMPLAINT (TENANT)                          */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Complaints</h3>
                      <p className="text-xs text-slate-400">Direct to property manager with photo</p>
                    </div>

                    {/* Quick Category Selector */}
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        ISSUE CATEGORY
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(["AC", "WiFi", "Plumbing", "Cleaning"] as const).map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedComplaintCategory(cat)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                              selectedComplaintCategory === cat
                                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                                : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit form */}
                    <form onSubmit={handleAddComplaint} className="space-y-2">
                      <div className="relative">
                        <textarea
                          value={newComplaintText}
                          onChange={(e) => setNewComplaintText(e.target.value)}
                          placeholder="Describe your issue... (e.g. AC not cooling properly)"
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Complaint</span>
                      </button>
                    </form>

                    {/* Active Tracked Complaint (from Blueprint) */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-bold text-white">Air Conditioner not cooling properly</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Room 203 · photo attached
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          Resolved
                        </span>
                      </div>

                      {/* Status Timeline Tracker */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Status Timeline
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                             
                            </div>
                            <span className="text-slate-300">Complaint logged</span>
                            <span className="text-[11px] text-slate-400 ml-auto">8:40 AM</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                             
                            </div>
                            <span className="text-slate-300">Manager reviewed</span>
                            <span className="text-[11px] text-slate-400 ml-auto">8:52 AM</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                             
                            </div>
                            <span className="text-emerald-400 font-bold">Issue resolved</span>
                            <span className="text-[11px] text-emerald-400 ml-auto">11:15 AM</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 4: MEAL MENU (TENANT)                         */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 4 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Daily Meal Menu</h3>
                      <p className="text-xs text-slate-400">Weekly schedule · updated daily</p>
                    </div>

                    {/* Week date row */}
                    <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
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
                          className={`flex-1 min-w-[38px] py-2 px-1 rounded-xl text-center flex flex-col items-center gap-0.5 border transition-all ${
                            selectedMenuDay === item.date
                              ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850"
                          }`}
                        >
                          <span className="text-xs font-black">{item.date}</span>
                          <span className="text-[10px] opacity-80">{item.day}</span>
                        </button>
                      ))}
                    </div>

                    {/* Meals Breakdown */}
                    <div className="space-y-2.5">
                      {/* Nashta */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5" />
                            Nashta
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">7:30–9:30</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">Poha + chai, bread butter</p>
                      </div>

                      {/* Lunch */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                          <span className="flex items-center gap-1.5">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            Lunch
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">12:30–2:30</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">
                          Rajma chawal, roti, salad, boondi raita
                        </p>
                      </div>

                      {/* Dinner */}
                      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-400 mb-1">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            Dinner
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">8:00–10:00</span>
                        </div>
                        <p className="text-xs text-slate-200 font-medium">
                          Paneer, dal, roti, kheer, salad
                        </p>
                      </div>
                    </div>

                    {/* Interactive Food Rating */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Kal ka lunch kaisa tha?
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => {
                              setFoodRating(star);
                              triggerToast(`Thank you! Lunch ko ${star} stars rating mili.`);
                            }}
                            className="p-0.5 text-amber-400 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= foodRating ? "fill-amber-400" : "text-slate-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Wastage prevention toggle */}
                    <button
                      onClick={() => {
                        setSkipFoodToday(!skipFoodToday);
                        triggerToast(
                          !skipFoodToday
                            ? " Manager notified: Meal skipped for today (Zero food wastage!)."
                            : "Meal opt-in reactivated!"
                        );
                      }}
                      className={`w-full py-3 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${
                        skipFoodToday
                          ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                          : "bg-slate-900 hover:bg-slate-850 border-slate-700 text-slate-200"
                      }`}
                    >
                      <Coffee className="w-4 h-4" />
                      <span>
                        {skipFoodToday ? " Meal skipped for today" : "Skip today's meal"}
                      </span>
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 5: METER READING (MANAGER)                    */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Meter Readings</h3>
                        <p className="text-xs text-slate-400">All room entries & automatic unit split</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Rate setting</span>
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400">
                          <span>₹</span>
                          <input
                            type="number"
                            value={ratePerUnit}
                            onChange={(e) => setRatePerUnit(Number(e.target.value) || 9)}
                            className="w-10 bg-slate-900 border border-slate-700 rounded px-1 text-center font-bold text-white"
                          />
                          <span>/ unit</span>
                        </div>
                      </div>
                    </div>

                    {/* Table of rooms */}
                    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
                      <div className="grid grid-cols-4 p-2.5 bg-slate-850 font-bold text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <span>ROOM</span>
                        <span>PREVIOUS</span>
                        <span>CURRENT</span>
                        <span className="text-right">BILL</span>
                      </div>

                      <div className="divide-y divide-slate-800/60">
                        {meterList.map((m) => (
                          <div key={m.room} className="grid grid-cols-4 p-2.5 items-center">
                            <span className="font-bold text-white">{m.room}</span>
                            <span className="text-slate-400 font-mono">{m.previous}</span>
                            <span className="text-emerald-400 font-mono font-bold">{m.current}</span>
                            <span className="text-right font-bold text-white">
                              ₹{(m.current - m.previous) * ratePerUnit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
                      <span>Automatic Calculation • ₹{ratePerUnit} / unit</span>
                      <button
                        onClick={() => triggerToast("New meter photo captured & uploaded!")}
                        className="flex items-center gap-1 text-blue-400 font-semibold"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Add Photo</span>
                      </button>
                    </div>

                    {/* Send bills action */}
                    <button
                      onClick={handleSendAllBills}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Sabko bill bhejo (1-Tap WhatsApp & App)</span>
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 6: COMPLAINT LIST (MANAGER)                   */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 6 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Complaints</h3>
                      <p className="text-xs text-slate-400">Aaj · {complaints.length} complaints</p>
                    </div>

                    {/* 3 Metric Pills */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-center">
                        <div className="text-lg font-black text-blue-400">
                          {complaints.filter((c) => c.status === "New").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-blue-300">Naye</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                        <div className="text-lg font-black text-amber-400">
                          {complaints.filter((c) => c.status === "In Progress").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-amber-300">In Progress</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                        <div className="text-lg font-black text-emerald-400">
                          {complaints.filter((c) => c.status === "Done").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-emerald-300">Done</div>
                      </div>
                    </div>

                    {/* Complaints List with inline status toggle */}
                    <div className="space-y-2">
                      {complaints.map((c) => (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{c.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{c.room}</div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={c.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  c.id,
                                  e.target.value as "New" | "In Progress" | "Done"
                                )
                              }
                              className={`text-[11px] font-bold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer ${
                                c.status === "Done"
                                  ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                                  : c.status === "In Progress"
                                  ? "bg-amber-950 border-amber-500 text-amber-300"
                                  : "bg-blue-950 border-blue-500 text-blue-300"
                              }`}
                            >
                              <option value="New">New</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Done">Done</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 7: NEW TENANT (MANAGER)                       */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 7 && (
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">New Tenant</h3>
                        <p className="text-xs text-slate-400">Entry with document verification</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                        Room {newTenantForm.roomBed}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          SELECT VACANT BED
                        </label>
                        <select
                          value={newTenantForm.roomBed}
                          onChange={(e) =>
                            setNewTenantForm({ ...newTenantForm, roomBed: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium focus:outline-none"
                        >
                          <option value="104-A">Room 104 · Bed A (Vacant - 14 days)</option>
                          <option value="202-B">Room 202 · Bed B (Vacant - 7 days)</option>
                          <option value="108-B">Room 108 · Bed B (On Notice)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          FULL NAME
                        </label>
                        <input
                          type="text"
                          value={newTenantForm.name}
                          onChange={(e) =>
                            setNewTenantForm({ ...newTenantForm, name: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          PHONE
                        </label>
                        <input
                          type="text"
                          value={newTenantForm.phone}
                          onChange={(e) =>
                            setNewTenantForm({ ...newTenantForm, phone: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            RENT / MONTH
                          </label>
                          <div className="font-bold text-emerald-400 text-sm bg-slate-950 p-2 rounded-lg border border-slate-700">
                            ₹7,500
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            SECURITY DEPOSIT
                          </label>
                          <div className="font-bold text-white text-sm bg-slate-950 p-2 rounded-lg border border-slate-700">
                            ₹15,000
                          </div>
                        </div>
                      </div>

                      {/* Documents Checklist */}
                      <div className="pt-2 border-t border-slate-800">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          DOCUMENTS
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewTenantForm({
                                ...newTenantForm,
                                idProof: !newTenantForm.idProof,
                              })
                            }
                            className={`p-2 rounded-lg border flex items-center gap-2 text-left transition-colors ${
                              newTenantForm.idProof
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>ID proof</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setNewTenantForm({
                                ...newTenantForm,
                                photo: !newTenantForm.photo,
                              })
                            }
                            className={`p-2 rounded-lg border flex items-center gap-2 text-left transition-colors ${
                              newTenantForm.photo
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setNewTenantForm({
                                ...newTenantForm,
                                agreement: !newTenantForm.agreement,
                              })
                            }
                            className={`p-2 rounded-lg border flex items-center gap-2 text-left transition-colors ${
                              newTenantForm.agreement
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Agreement</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setNewTenantForm({
                                ...newTenantForm,
                                policeVerification: !newTenantForm.policeVerification,
                              })
                            }
                            className={`p-2 rounded-lg border flex items-center gap-2 text-left transition-colors ${
                              newTenantForm.policeVerification
                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                                : "bg-slate-950 border-slate-800 text-slate-400"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Police verif.</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Bed {newTenantForm.roomBed} ab apne aap "occupied" ho jayega</span>
                    </div>

                    <button
                      onClick={handleSaveNewTenant}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Save Tenant</span>
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* ---------------------------------------------------- */}
                {/* SCREEN 8: RENT & DEPOSIT LEDGER (OWNER)              */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 8 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">Rent Ledger</h3>
                        <p className="text-xs text-slate-400">November · 38 / 40 beds occupied</p>
                      </div>
                      <button
                        onClick={() => triggerToast("Monthly Ledger Report PDF downloaded!")}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700"
                        title="Download Ledger Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Report</span>
                      </button>
                    </div>

                    {/* Big KPI Cards */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/30">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        COLLECTED THIS MONTH
                      </span>
                      <div className="text-3xl font-extrabold text-white my-1">₹2,58,000</div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                        <span className="text-rose-400 font-semibold">Overdue ₹34,000 · 4 pending</span>
                        <span className="text-slate-300">Deposit ₹5,70,000</span>
                      </div>
                    </div>

                    {/* Overdue rent list */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        OVERDUE RENT (PENDING)
                      </div>

                      <div className="space-y-2">
                        {overdueList.map((tenant) => (
                          <div
                            key={tenant.id}
                            className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">
                                {tenant.initials}
                              </div>
                              <div>
                                <div className="font-bold text-white">
                                  {tenant.room} · {tenant.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {tenant.status === "Reminder sent" ? (
                                    <span className="text-emerald-400 font-medium">
                                      Reminder sent
                                    </span>
                                  ) : (
                                    <span className="text-rose-400 font-medium">
                                      {tenant.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1">
                              <div className="font-extrabold text-white">
                                ₹{tenant.amount.toLocaleString("en-IN")}
                              </div>
                              {tenant.status !== "Reminder sent" && (
                                <button
                                  onClick={() =>
                                    handleSendReminder(
                                      tenant.id,
                                      tenant.name,
                                      tenant.phone,
                                      tenant.amount
                                    )
                                  }
                                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1"
                                >
                                  <Send className="w-2.5 h-2.5" />
                                  <span>Reminder</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 9: VACANT BED LIST (OWNER)                    */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 9 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Vacant Beds</h3>
                      <p className="text-xs text-slate-400">Live · room occupancy</p>
                    </div>

                    {/* Status Counters */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                        <div className="text-xl font-black text-emerald-400">
                          {beds.filter((b) => b.status === "occupied").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-emerald-300">
                          Occupied
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center">
                        <div className="text-xl font-black text-rose-400">
                          {beds.filter((b) => b.status === "vacant").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-rose-300">Vacant</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
                        <div className="text-xl font-black text-amber-400">
                          {beds.filter((b) => b.status === "notice").length}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-amber-300">
                          Notice
                        </div>
                      </div>
                    </div>

                    {/* Bed Grid */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        BED MATRIX (TAP TO INSPECT)
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {beds.map((b) => {
                          const isVacant = b.status === "vacant";
                          const isNotice = b.status === "notice";

                          return (
                            <button
                              key={b.code}
                              onClick={() => setSelectedBedForDetail(b)}
                              className={`p-2 rounded-xl text-center border transition-all text-xs font-mono font-bold ${
                                isVacant
                                  ? "bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse shadow-sm"
                                  : isNotice
                                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              <div>{b.code}</div>
                              <div className="text-[9px] font-sans font-normal opacity-70">
                                {isVacant ? "VACANT" : isNotice ? "NOTICE" : "OCCUPIED"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revenue Loss Alert */}
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                      <span>2 vacant beds · ₹15,000 / month revenue loss</span>
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    </div>

                    {/* Share Vacancy Link */}
                    <button
                      onClick={handleShareVacantBeds}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share vacant beds link (WhatsApp)</span>
                    </button>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* SCREEN 10: LOGIN (LOGIN)                             */}
                {/* ---------------------------------------------------- */}
                {currentScreen === 10 && (
                  <div className="space-y-4 py-2">
                    <div className="text-center space-y-1">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl mx-auto shadow-lg shadow-blue-500/20">
                        <Building className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-white">StaySphere PG Login</h3>
                      <p className="text-xs text-slate-400">Har kisi ko sirf apna kaam dikhega</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          MOBILE NUMBER
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono font-medium focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            OTP
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setLoginOtp(["3", "8", "1", "6"]);
                              triggerToast("Demo OTP 3 8 1 6 autofilled!");
                            }}
                            className="text-[10px] text-emerald-400 hover:underline"
                          >
                            Autofill Demo OTP
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {loginOtp.map((digit, i) => (
                            <input
                              key={i}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                const copy = [...loginOtp];
                                copy[i] = e.target.value;
                                setLoginOtp(copy);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-center text-lg font-mono font-bold text-emerald-400 focus:outline-none"
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          SELECT YOUR ROLE
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["TENANT", "MANAGER", "OWNER"] as const).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setSelectedLoginRole(r)}
                              className={`py-2 px-1 rounded-xl text-center border text-xs font-bold transition-all ${
                                selectedLoginRole === r
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-md"
                                  : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              {r === "TENANT" ? "Tenant" : r === "MANAGER" ? "Manager" : "Owner"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        switchRole(selectedLoginRole);
                        triggerToast(`Logged in successfully as ${selectedLoginRole}!`);
                      }}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Login</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ======================================================== */}
              {/* ROLE-SPECIFIC BOTTOM NAVIGATION TABS                     */}
              {/* ======================================================== */}
              <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center justify-around text-[10px] font-bold">
                {activeRole === "TENANT" && (
                  <>
                    <button
                      onClick={() => jumpToScreen(1)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 1 ? "text-emerald-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Rent</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(2)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 2 ? "text-emerald-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Bill</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(3)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 3 ? "text-emerald-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Complaint</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(4)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 4 ? "text-emerald-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>Menu</span>
                    </button>
                  </>
                )}

                {activeRole === "MANAGER" && (
                  <>
                    <button
                      onClick={() => jumpToScreen(5)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 5 ? "text-amber-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>Rooms</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(5)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 5 ? "text-amber-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>Meter</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(6)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 6 ? "text-amber-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>Complaints</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(7)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 7 ? "text-amber-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Tenants</span>
                    </button>
                  </>
                )}

                {activeRole === "OWNER" && (
                  <>
                    <button
                      onClick={() => jumpToScreen(8)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 8 ? "text-emerald-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Ledger</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(9)}
                      className={`flex flex-col items-center gap-1 transition-colors ${
                        currentScreen === 9 ? "text-emerald-400" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>Beds</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(8)}
                      className={`flex flex-col items-center gap-1 transition-colors text-slate-400 hover:text-white`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Tenants</span>
                    </button>
                    <button
                      onClick={() => jumpToScreen(10)}
                      className={`flex flex-col items-center gap-1 transition-colors text-slate-400 hover:text-white`}
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </>
                )}

                {activeRole === "LOGIN" && (
                  <div className="w-full text-center text-[10px] text-slate-400 py-1">
                    Select a role above or enter OTP to continue
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* MODALS & OVERLAYS                                            */}
      {/* ============================================================ */}

      {/* PAYMENT MODAL (Screen 1) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Pay Rent Online</h3>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-300">Amount Due:</span>
              <span className="text-xl font-black text-emerald-400">₹8,500</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod("upi")}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                  paymentMethod === "upi"
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>UPI (GPay / PhonePe / Paytm / QR)</span>
                </div>
                {paymentMethod === "upi" && <Check className="w-4 h-4 text-blue-400" />}
              </button>

              <button
                onClick={() => setPaymentMethod("card")}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                  paymentMethod === "card"
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  <span>Debit / Credit Card</span>
                </div>
                {paymentMethod === "card" && <Check className="w-4 h-4 text-blue-400" />}
              </button>

              <button
                onClick={() => setPaymentMethod("netbanking")}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between ${
                  paymentMethod === "netbanking"
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>Net Banking (All Indian Banks)</span>
                </div>
                {paymentMethod === "netbanking" && <Check className="w-4 h-4 text-blue-400" />}
              </button>
            </div>

            <button
              onClick={handlePayRent}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
            >
              Confirm & Pay ₹8,500
            </button>
          </div>
        </div>
      )}

      {/* RECEIPT VIEW MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official E-Receipt
              </span>
              <button
                onClick={() => setShowReceiptModal(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ×
              </button>
            </div>

            <div className="p-4 bg-white text-slate-900 rounded-2xl space-y-3 font-mono text-xs">
              <div className="text-center pb-2 border-b border-slate-200">
                <div className="font-black text-sm">STAYSPHERE RESIDENCY</div>
                <div className="text-[10px] text-slate-500">Bhubaneswar · GST: 21XXXXXX121</div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Month:</span>
                  <span className="font-bold">{showReceiptModal} 2026</span>
                </div>
                <div className="flex justify-between">
                  <span>Tenant:</span>
                  <span className="font-bold">Rohit Sharma</span>
                </div>
                <div className="flex justify-between">
                  <span>Room / Bed:</span>
                  <span className="font-bold">203 - B</span>
                </div>
                <div className="flex justify-between">
                  <span>Rent:</span>
                  <span>₹7,500</span>
                </div>
                <div className="flex justify-between">
                  <span>Food charges:</span>
                  <span>₹1,000</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                  <span>Total Paid:</span>
                  <span className="text-emerald-700">₹8,500</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">Status: Verified Online</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  triggerToast("Receipt sent to your WhatsApp number!");
                  setShowReceiptModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>
              <button
                onClick={() => {
                  triggerToast("PDF downloaded!");
                  setShowReceiptModal(null);
                }}
                className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METER PHOTO MODAL (Screen 2) */}
      {showMeterPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Room 203 Electric Meter</h4>
              <button
                onClick={() => setShowMeterPhoto(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ×
              </button>
            </div>
            {/* Visual simulation of digital electric meter */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-2">
              <div className="w-full h-32 bg-slate-800 rounded-xl flex flex-col items-center justify-center border border-slate-700">
                <div className="bg-emerald-950/80 px-4 py-2 rounded border border-emerald-500/40 font-mono text-2xl font-black text-emerald-400 tracking-widest">
                  004400 kWh
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Captured by Manager on 31 Oct, 6:30 PM
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Previous Reading: 4,186 · Current Reading: 4,400 (Net 214 Units)
              </p>
            </div>
            <button
              onClick={() => setShowMeterPhoto(false)}
              className="w-full py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* BED DETAIL MODAL (Screen 9) */}
      {selectedBedForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xs w-full p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Bed {selectedBedForDetail.code}</span>
              <button
                onClick={() => setSelectedBedForDetail(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ×
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-bold uppercase ${
                    selectedBedForDetail.status === "vacant"
                      ? "text-rose-400"
                      : selectedBedForDetail.status === "notice"
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {selectedBedForDetail.status}
                </span>
              </div>
              {selectedBedForDetail.tenantName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Tenant:</span>
                  <span className="font-bold text-white">{selectedBedForDetail.tenantName}</span>
                </div>
              )}
              {selectedBedForDetail.daysVacant && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Days Vacant:</span>
                  <span className="font-bold text-rose-400">
                    {selectedBedForDetail.daysVacant} days
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Rent:</span>
                <span className="font-bold text-white">₹{selectedBedForDetail.rent}</span>
              </div>
            </div>

            {selectedBedForDetail.status === "vacant" && (
              <button
                onClick={() => {
                  setSelectedBedForDetail(null);
                  setNewTenantForm((prev) => ({
                    ...prev,
                    roomBed: selectedBedForDetail.code,
                  }));
                  jumpToScreen(7);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Assign New Tenant Here
              </button>
            )}
          </div>
        </div>
      )}

      {/* BLUEPRINT SUMMARY MODAL */}
      {showBlueprintModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Blueprint Reference
                </span>
                <h3 className="text-lg font-black text-white">
                  StaySphere: 10 Screens PG Architecture
                </h3>
              </div>
              <button
                onClick={() => setShowBlueprintModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Offline Problems vs Online Solutions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/20 space-y-2">
                <div className="font-bold text-rose-400 uppercase tracking-wider">
                  OFFLINE · 3 MAJOR PAIN POINTS
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p>
                    <strong className="text-white">1. Rent Collection:</strong> Manual paper registers, chasing payment dates, and cash reconciliation.
                  </p>
                  <p>
                    <strong className="text-white">2. Electricity Split:</strong> Reading meters manually, room disputes, and manual calculator splits.
                  </p>
                  <p>
                    <strong className="text-white">3. Vacant Beds:</strong> Delayed notice on vacancies leading to lost revenue and empty beds.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-2">
                <div className="font-bold text-emerald-400 uppercase tracking-wider">
                  ONLINE · 1 UNIFIED APP ACROSS 3 ROLES
                </div>
                <div className="space-y-1 text-slate-300">
                  <p>
                    <strong className="text-white">Tenant (4 screens):</strong> Online Rent,
                    Electricity Bill, Complaint with Photo, Food Menu.
                  </p>
                  <p>
                    <strong className="text-white">Manager (3 screens):</strong> Meter Reading,
                    Complaint List, New Tenant Entry.
                  </p>
                  <p>
                    <strong className="text-white">Owner (2 screens):</strong> Rent & Deposit
                    Ledger, Live Vacant Bed List.
                  </p>
                  <p>
                    <strong className="text-white">Login (1 screen):</strong> Safe role-based OTP
                    access.
                  </p>
                </div>
              </div>
            </div>

            {/* 10 Screens Directory */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                10 SCREENS CATALOG (CLICK TO JUMP)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {screensMeta.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setShowBlueprintModal(false);
                      jumpToScreen(s.id as ScreenId);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-white">
                        {s.id}. {s.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.sub}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {s.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aur kya jud sakta hai */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-emerald-400">Aur kya jud sakta hai:</span>
              <p className="text-slate-400">
                + WhatsApp Business API · + UPI AutoPay · + Multiple PG branches · + Smart Meter
                sync · + Hindi & English interface
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
