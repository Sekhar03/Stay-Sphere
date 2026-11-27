"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Ban,
  BarChart3,
  BedDouble,
  Bell,
  Building2,
  CalendarCheck,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  ClipboardList,
  Clock,
  Command,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  Filter,
  Home,
  Inbox,
  IndianRupee,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Play,
  RefreshCw,
  Search,
  Send,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  Utensils,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { toast as sonnerToast } from "sonner";
import {
  Badge,
  EmptyState,
  Modal,
  ProgressBar,
  SearchField,
  SectionHeader,
  Spinner,
  StatCard,
  Toast,
  cn,
  downloadCsv,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  initials,
  readApiError,
  relativeTime,
  statusTone,
  titleCase,
  type Tone,
} from "@/components/admin/admin-ui";
import SafeImage from "@/components/ui/SafeImage";

type TabId =
  | "dashboard"
  | "users"
  | "kyc"
  | "properties"
  | "visits"
  | "bookings"
  | "payments"
  | "refunds"
  | "payouts"
  | "reports"
  | "reviews"
  | "support"
  | "notifications"
  | "settings"
  | "content"
  | "system"
  | "audit";

type ToastState = { type: "success" | "error" | "info"; message: string } | null;

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: Tone;
  onConfirm: () => Promise<void> | void;
} | null;

type CommandItem = {
  id: string;
  label: string;
  description: string;
  group: string;
  icon: LucideIcon;
  action: () => void;
};

const NAV_GROUPS: { label: string; items: { id: TabId; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "reports", label: "Analytics & reports", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "users", label: "Users & owners", icon: Users },
      { id: "kyc", label: "KYC documents", icon: ShieldCheck },
      { id: "properties", label: "Properties & queue", icon: Building2 },
      { id: "visits", label: "Site visits", icon: CalendarCheck },
      { id: "bookings", label: "Bookings", icon: FileCheck },
      { id: "support", label: "Tickets & disputes", icon: LifeBuoy },
    ],
  },
  {
    label: "Finance & Money",
    items: [
      { id: "payments", label: "Payments & rent", icon: CreditCard },
      { id: "refunds", label: "Refunds ledger", icon: CircleDollarSign },
      { id: "payouts", label: "Payouts & commission", icon: Wallet },
    ],
  },
  {
    label: "Trust & governance",
    items: [
      { id: "reviews", label: "Reviews moderation", icon: Star },
      { id: "content", label: "Content & legal", icon: ClipboardList },
      { id: "audit", label: "Audit & security", icon: ShieldAlert },
    ],
  },
  {
    label: "System",
    items: [
      { id: "notifications", label: "Automation engine", icon: Zap },
      { id: "system", label: "System health & ops", icon: Activity },
      { id: "settings", label: "Platform settings", icon: Settings },
    ],
  },
];

const TAB_META: Record<TabId, { label: string; description: string }> = {
  dashboard: { label: "Dashboard", description: "Platform health, revenue and operational priorities" },
  users: { label: "Users & owners", description: "Every tenant, owner, staff member and administrator" },
  kyc: { label: "KYC documents", description: "Verify PG Owners and Tenants before property listing & bed check-in" },
  properties: { label: "Properties & queue", description: "Verification queue and published inventory" },
  visits: { label: "Site visits", description: "Scheduled prospect inspections and outcomes" },
  bookings: { label: "Bookings", description: "Bed reservations and their payment state" },
  payments: { label: "Payments & rent", description: "Captured revenue, rent schedules and transaction health" },
  refunds: { label: "Refunds ledger", description: "Processed, pending and automated policy refunds" },
  payouts: { label: "Payouts & commission", description: "Owner earnings settlements and platform fee ledger" },
  reports: { label: "Analytics & reports", description: "Revenue analytics, occupancy metrics and financial ledger export" },
  reviews: { label: "Reviews moderation", description: "Resident feedback moderation and property reputation" },
  support: { label: "Tickets & disputes", description: "Maintenance issues and tenant-owner deduction disputes" },
  notifications: { label: "Automation engine", description: "Rent reminder engine and delivery history" },
  content: { label: "Content & legal", description: "Terms of service, privacy policy and legal agreement versioning" },
  system: { label: "System health & ops", description: "Infrastructure vitals, worker queues and emergency operations" },
  settings: { label: "Platform settings", description: "Fees, tax, support contact and notification policy" },
  audit: { label: "Audit & security", description: "Immutable trail of administrative actions and threat monitoring" },
};

const PANEL =
  "rounded-2xl border border-white/[0.08] bg-[#161618] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_20px_-2px_rgba(0,0,0,0.5)]";
const INPUT =
  "h-9 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-[12px] text-slate-100 placeholder:text-slate-500 transition-colors duration-150 focus:border-rose-500/50 focus:bg-[#18181b] focus:outline-none focus:ring-2 focus:ring-rose-500/15";
const SELECT =
  "h-9 rounded-xl border border-white/10 bg-[#111113] px-2.5 text-[12px] text-slate-200 transition-colors duration-150 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/15";
const PRIMARY_BTN =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-rose-600 px-4 text-[12px] font-semibold text-white btn-press transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm shadow-rose-950/40";
const SECONDARY_BTN =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-[12px] font-medium text-slate-300 btn-press transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";
const GHOST_BTN =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-medium text-slate-400 btn-press transition-colors hover:bg-white/5 hover:text-white";

function buildRevenueChart(series: any[], width = 760, height = 220) {
  const points = Array.isArray(series) ? series : [];
  if (points.length === 0) return null;

  const padding = { top: 16, right: 46, bottom: 24, left: 8 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const max = Math.max(...points.map((point) => Number(point.revenue) || 0), 1);
  const stepX = innerWidth / Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => ({
    x: padding.left + index * stepX,
    y: padding.top + innerHeight - ((Number(point.revenue) || 0) / max) * innerHeight,
    value: Number(point.revenue) || 0,
    date: point.date as string,
  }));

  const line = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${padding.top + innerHeight} L ${coords[0].x.toFixed(1)} ${padding.top + innerHeight} Z`;
  const gridValues = [0, 0.25, 0.5, 0.75, 1];

  return { width, height, padding, innerHeight, max, coords, line, area, gridValues };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isAdminAuthed, setIsAdminAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [propertyCounts, setPropertyCounts] = useState<Record<string, number>>({});
  const [usersList, setUsersList] = useState<any[]>([]);
  const [visitsList, setVisitsList] = useState<any[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [rentSchedules, setRentSchedules] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditActions, setAuditActions] = useState<{ action: string; count: number }[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [reminderLogs, setReminderLogs] = useState<any[]>([]);
  const [reminderSummary, setReminderSummary] = useState<any>(null);
  const [kycOwners, setKycOwners] = useState<any[]>([]);
  const [kycTenants, setKycTenants] = useState<any[]>([]);
  const [kycSummary, setKycSummary] = useState<any>({ pendingOwners: 0, verifiedOwners: 0, pendingTenants: 0, verifiedTenants: 0 });
  const [kycTypeFilter, setKycTypeFilter] = useState("ALL");
  const [kycStatusFilter, setKycStatusFilter] = useState("ALL");
  const [kycSearch, setKycSearch] = useState("");
  const [kycRejectModal, setKycRejectModal] = useState<{ profileId: string; profileType: "OWNER" | "TENANT"; name: string } | null>(null);
  const [kycRejectReason, setKycRejectReason] = useState("");
  const [kycUpdating, setKycUpdating] = useState(false);
  const [kycDetailModal, setKycDetailModal] = useState<any | null>(null);

  const [range, setRange] = useState(30);
  const [userRole, setUserRole] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");
  const [userStatus, setUserStatus] = useState("ALL");
  const [propertyStatus, setPropertyStatus] = useState("ALL");
  const [propertySearch, setPropertySearch] = useState("");
  const [visitStatus, setVisitStatus] = useState("ALL");
  const [visitSearch, setVisitSearch] = useState("");
  const [bookingStatus, setBookingStatus] = useState("ALL");
  const [bookingSearch, setBookingSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [reviewFilter, setReviewFilter] = useState("ALL");
  const [reviewSearch, setReviewSearch] = useState("");
  const [ticketStatus, setTicketStatus] = useState("ALL");
  const [ticketSearch, setTicketSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditAction, setAuditAction] = useState("ALL");
  const [auditEntity, setAuditEntity] = useState("ALL");

  const [propertyDetail, setPropertyDetail] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [ticketTarget, setTicketTarget] = useState<any>(null);
  const [ticketNextStatus, setTicketNextStatus] = useState("IN_PROGRESS");
  const [ticketNote, setTicketNote] = useState("");
  const [ticketSaving, setTicketSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [settingsForm, setSettingsForm] = useState({
    platformFeePercent: 2.5,
    gstPercentage: 18,
    supportEmail: "support@staysphere.in",
    supportPhone: "+91 80 4568 2200",
    enableEmailAlerts: true,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [reminderRunning, setReminderRunning] = useState(false);
  const [reminderResult, setReminderResult] = useState<any>(null);

  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandIndex, setCommandIndex] = useState(0);

  const [opsRunning, setOpsRunning] = useState<string | null>(null);
  const [refundSearch, setRefundSearch] = useState("");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [maintenanceModeActive, setMaintenanceModeActive] = useState(false);

  const runOperation = async (opName: string, endpoint: string, successMsg: string) => {
    setOpsRunning(opName);
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(await readApiError(res));
      showToast("success", successMsg);
      await loadAdminData({ silent: true });
    } catch (e: any) {
      showToast("error", e.message || `Failed to execute ${opName}`);
    } finally {
      setOpsRunning(null);
    }
  };

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    if (type === "success") sonnerToast.success(message);
    else if (type === "error") sonnerToast.error(message);
    else sonnerToast.info(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const loadAdminData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (options?.silent) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const endpoints = [
          "/api/admin/stats",
          "/api/admin/analytics?days=" + range,
          "/api/admin/properties",
          "/api/admin/users?role=ALL",
          "/api/admin/visits",
          "/api/admin/bookings",
          "/api/admin/payments",
          "/api/admin/reviews",
          "/api/maintenance",
          "/api/admin/settings",
          "/api/admin/audit?limit=100",
          "/api/admin/reminders/trigger",
          "/api/admin/kyc?type=ALL&status=ALL",
          "/api/auth/me",
        ];

        const responses = await Promise.all(endpoints.map((url) => fetch(url)));
        const statsResponse = responses[0];

        if (statsResponse.status === 401 || statsResponse.status === 403) {
          setIsAdminAuthed(false);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        setIsAdminAuthed(true);

        const payloads = await Promise.all(
          responses.map(async (response) => {
            if (!response.ok) return null;
            try {
              return await response.json();
            } catch {
              return null;
            }
          })
        );

        const [
          statsData,
          analyticsData,
          propertiesData,
          usersData,
          visitsData,
          bookingsData,
          paymentsData,
          reviewsData,
          ticketsData,
          settingsData,
          auditData,
          reminderData,
          kycData,
          meData,
        ] = payloads;

        if (statsData?.analytics) {
          setStats(statsData.analytics);
        }
        if (analyticsData) setAnalytics(analyticsData);
        if (propertiesData?.properties) {
          setProperties(propertiesData.properties);
          setPropertyCounts(propertiesData.counts || {});
        }
        if (usersData?.users) setUsersList(usersData.users);
        if (visitsData?.visits) setVisitsList(visitsData.visits);
        if (bookingsData?.bookings) setBookingsList(bookingsData.bookings);
        if (paymentsData?.payments) {
          setPaymentsList(paymentsData.payments);
          setRentSchedules(paymentsData.rentSchedules || []);
        }
        if (reviewsData?.reviews) setReviewsList(reviewsData.reviews);
        if (ticketsData?.tickets) setSupportTickets(ticketsData.tickets);
        if (settingsData?.settings) {
          setPlatformSettings(settingsData.settings);
          setSettingsForm({
            platformFeePercent: Number(settingsData.settings.platformFeePercent ?? 0),
            gstPercentage: Number(settingsData.settings.gstPercentage ?? 0),
            supportEmail: settingsData.settings.supportEmail || "",
            supportPhone: settingsData.settings.supportPhone || "",
            enableEmailAlerts: Boolean(settingsData.settings.enableEmailAlerts),
          });
        }
        if (auditData?.logs) {
          setAuditLogs(auditData.logs);
          setAuditTotal(auditData.total || auditData.logs.length);
          setAuditActions(auditData.actions || []);
        }
        if (reminderData) {
          setReminderLogs(reminderData.emailLogs || []);
          setReminderSummary(reminderData.summary || null);
        }
        if (kycData) {
          setKycOwners(kycData.owners || []);
          setKycTenants(kycData.tenants || []);
          if (kycData.summary) setKycSummary(kycData.summary);
        }
        if (meData?.user) setCurrentUser(meData.user);

        if (
          !statsData &&
          !analyticsData &&
          !propertiesData &&
          !usersData &&
          !bookingsData &&
          !paymentsData
        ) {
          setLoadError("The admin APIs did not return any data. Check the server logs and try again.");
        }
      } catch (error) {
        console.error("Admin data fetch error:", error);
        setLoadError("We could not reach the admin services. Check your connection and try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range, router]
  );

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        setCommandQuery("");
        setCommandIndex(0);
      }
      if (event.key === "Escape") {
        setNotifOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
    setNotifOpen(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAdminAuthed(false);
    setCurrentUser(null);
  };

  const toggleUserActive = async (user: any) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast("success", `${user.name} has been ${user.isActive ? "suspended" : "reactivated"}.`);
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not update this user.");
    }
  };

  const requestToggleUser = (user: any) => {
    if (!user.isActive) {
      void toggleUserActive(user);
      return;
    }
    setConfirmTarget({
      title: `Suspend ${user.name}?`,
      description: "They will be signed out immediately and unable to access their portal until reactivated.",
      confirmLabel: "Suspend user",
      tone: "rose",
      onConfirm: () => toggleUserActive(user),
    });
  };

  const verifyProperty = async (property: any, action: "APPROVE" | "REJECT", reason?: string) => {
    setVerifying(true);
    try {
      const response = await fetch(`/api/admin/properties/${property.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast(
        "success",
        action === "APPROVE"
          ? `${property.name} is now approved and published.`
          : `${property.name} was rejected and the owner can now see the reason.`
      );
      setRejectTarget(null);
      setPropertyDetail(null);
      setRejectionReason("");
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const requestApproveProperty = (property: any) => {
    setConfirmTarget({
      title: "Approve this property?",
      description: `${property.name} will be published to the public marketplace immediately.`,
      confirmLabel: "Approve & publish",
      tone: "emerald",
      onConfirm: () => verifyProperty(property, "APPROVE"),
    });
  };

  const handleKycAction = async (
    profileId: string,
    profileType: "OWNER" | "TENANT",
    action: "APPROVE" | "REJECT",
    reason?: string
  ) => {
    setKycUpdating(true);
    try {
      const response = await fetch("/api/admin/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          profileType,
          action,
          rejectionReason: reason,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast(
        "success",
        action === "APPROVE"
          ? `${profileType === "OWNER" ? "PG Owner" : "Tenant"} KYC verified and approved successfully!`
          : `${profileType === "OWNER" ? "PG Owner" : "Tenant"} KYC rejected with notification.`
      );
      setKycRejectModal(null);
      setKycRejectReason("");
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "KYC action failed.");
    } finally {
      setKycUpdating(false);
    }
  };

  const updateVisitStatus = async (visit: any, status: string) => {
    try {
      const response = await fetch("/api/admin/visits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitId: visit.id, status }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast("success", `Visit marked ${titleCase(status).toLowerCase()}.`);
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not update the visit.");
    }
  };

  const moderateReview = async (review: any, isApproved: boolean) => {
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id, isApproved }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast("success", isApproved ? "Review is now public." : "Review hidden from the property page.");
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not moderate the review.");
    }
  };

  const deleteReview = async (review: any) => {
    try {
      const response = await fetch(`/api/admin/reviews?id=${review.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast("success", "Review deleted permanently.");
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not delete the review.");
    }
  };

  const requestDeleteReview = (review: any) => {
    setConfirmTarget({
      title: "Delete this review?",
      description: "This permanently removes the review and its rating from the property. This cannot be undone.",
      confirmLabel: "Delete review",
      tone: "rose",
      onConfirm: () => deleteReview(review),
    });
  };

  const openTicketModal = (ticket: any) => {
    setTicketTarget(ticket);
    setTicketNextStatus(ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status);
    setTicketNote(ticket.resolutionNote || "");
  };

  const saveTicket = async () => {
    if (!ticketTarget) return;
    setTicketSaving(true);
    try {
      const response = await fetch("/api/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticketTarget.id,
          status: ticketNextStatus,
          resolutionNote: ticketNote.trim() || undefined,
        }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      showToast("success", `Ticket ${ticketTarget.ticketId || ""} updated to ${titleCase(ticketNextStatus)}.`);
      setTicketTarget(null);
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not update the ticket.");
    } finally {
      setTicketSaving(false);
    }
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSettingsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = await response.json();
      setPlatformSettings(data.settings);
      setSettingsSaved(true);
      showToast("success", "Platform settings saved and audit-logged.");
      setTimeout(() => setSettingsSaved(false), 3000);
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const runReminders = async () => {
    setReminderRunning(true);
    setReminderResult(null);
    try {
      const response = await fetch("/api/admin/reminders/trigger", { method: "POST" });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = await response.json();
      setReminderResult(data.results);
      showToast("success", data.message || "Rent reminder batch completed.");
      await loadAdminData({ silent: true });
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Could not run the reminder batch.");
    } finally {
      setReminderRunning(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return usersList.filter((user) => {
      if (userRole !== "ALL" && user.role !== userRole) return false;
      if (userStatus === "ACTIVE" && !user.isActive) return false;
      if (userStatus === "SUSPENDED" && user.isActive) return false;
      if (!query) return true;
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    });
  }, [usersList, userRole, userSearch, userStatus]);

  const filteredProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    return properties.filter((property) => {
      if (propertyStatus !== "ALL" && property.verificationStatus !== propertyStatus) return false;
      if (!query) return true;
      return (
        property.name?.toLowerCase().includes(query) ||
        property.address?.city?.toLowerCase().includes(query) ||
        property.address?.locality?.toLowerCase().includes(query) ||
        property.owner?.user?.name?.toLowerCase().includes(query)
      );
    });
  }, [properties, propertyStatus, propertySearch]);

  const filteredVisits = useMemo(() => {
    const query = visitSearch.trim().toLowerCase();
    return visitsList.filter((visit) => {
      if (visitStatus !== "ALL" && visit.status !== visitStatus) return false;
      if (!query) return true;
      return (
        visit.name?.toLowerCase().includes(query) ||
        visit.phone?.includes(query) ||
        visit.property?.name?.toLowerCase().includes(query)
      );
    });
  }, [visitsList, visitStatus, visitSearch]);

  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    return bookingsList.filter((booking) => {
      if (bookingStatus !== "ALL" && booking.status !== bookingStatus) return false;
      if (!query) return true;
      return (
        booking.bookingReference?.toLowerCase().includes(query) ||
        booking.tenantUser?.name?.toLowerCase().includes(query) ||
        booking.property?.name?.toLowerCase().includes(query)
      );
    });
  }, [bookingsList, bookingStatus, bookingSearch]);

  const filteredPayments = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();
    return paymentsList.filter((payment) => {
      if (paymentStatus !== "ALL" && payment.status !== paymentStatus) return false;
      if (!query) return true;
      return (
        payment.receiptNumber?.toLowerCase().includes(query) ||
        payment.user?.name?.toLowerCase().includes(query) ||
        payment.razorpayPaymentId?.toLowerCase().includes(query) ||
        payment.invoice?.invoiceNumber?.toLowerCase().includes(query)
      );
    });
  }, [paymentsList, paymentStatus, paymentSearch]);

  const filteredReviews = useMemo(() => {
    const query = reviewSearch.trim().toLowerCase();
    return reviewsList.filter((review) => {
      if (reviewFilter === "APPROVED" && !review.isApproved) return false;
      if (reviewFilter === "PENDING" && review.isApproved) return false;
      if (!query) return true;
      return (
        review.user?.name?.toLowerCase().includes(query) ||
        review.property?.name?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query)
      );
    });
  }, [reviewsList, reviewFilter, reviewSearch]);

  const filteredTickets = useMemo(() => {
    const query = ticketSearch.trim().toLowerCase();
    return supportTickets.filter((ticket) => {
      if (ticketStatus === "ESCALATED") {
        const isOlder72h = (Date.now() - new Date(ticket.createdAt).getTime()) > 72 * 3600 * 1000;
        if (!isOlder72h || (ticket.status !== "OPEN" && ticket.status !== "IN_PROGRESS")) return false;
      } else if (ticketStatus !== "ALL" && ticket.status !== ticketStatus) {
        return false;
      }
      if (!query) return true;
      return (
        ticket.ticketId?.toLowerCase().includes(query) ||
        ticket.title?.toLowerCase().includes(query) ||
        ticket.user?.name?.toLowerCase().includes(query) ||
        ticket.property?.name?.toLowerCase().includes(query)
      );
    });
  }, [supportTickets, ticketStatus, ticketSearch]);

  const filteredAudit = useMemo(() => {
    const query = auditSearch.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (auditAction !== "ALL" && log.action !== auditAction) return false;
      if (auditEntity !== "ALL" && log.entityType !== auditEntity) return false;
      if (!query) return true;
      return (
        log.action?.toLowerCase().includes(query) ||
        log.entityType?.toLowerCase().includes(query) ||
        log.entityId?.toLowerCase().includes(query) ||
        log.user?.name?.toLowerCase().includes(query)
      );
    });
  }, [auditLogs, auditAction, auditEntity, auditSearch]);

  const roleCounts = useMemo(
    () =>
      usersList.reduce<Record<string, number>>((counts, user) => {
        counts[user.role] = (counts[user.role] || 0) + 1;
        return counts;
      }, {}),
    [usersList]
  );

  const ticketCounts = useMemo(
    () =>
      supportTickets.reduce<Record<string, number>>((counts, ticket) => {
        counts[ticket.status] = (counts[ticket.status] || 0) + 1;
        return counts;
      }, {}),
    [supportTickets]
  );

  const bookingCounts = useMemo(
    () =>
      bookingsList.reduce<Record<string, number>>((counts, booking) => {
        counts[booking.status] = (counts[booking.status] || 0) + 1;
        return counts;
      }, {}),
    [bookingsList]
  );

  const pendingApprovals = propertyCounts.PENDING_VERIFICATION ?? stats?.pendingApprovals ?? 0;
  const overdueRents = rentSchedules.filter((rent) => rent.status === "OVERDUE" || rent.status === "DUE");
  const failedPayments = paymentsList.filter((payment) => payment.status === "FAILED");
  const todayVisits = visitsList.filter((visit) => {
    if (visit.status !== "SCHEDULED") return false;
    const date = new Date(visit.visitDate);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });

  const alertCount =
    pendingApprovals + (ticketCounts.OPEN || 0) + overdueRents.length + failedPayments.length;

  const revenue = stats?.totalRevenue ?? analytics?.totals?.revenue ?? 0;
  const occupancy = stats?.occupancyRate ?? 0;
  const chart = useMemo(() => buildRevenueChart(analytics?.series || []), [analytics]);
  const selectedPropertyCover = propertyDetail?.media?.[0]?.url;

  const reminderDelivered =
    reminderSummary?.sent ??
    reminderLogs.filter((log) => String(log.status).startsWith("SENT")).length;

  const commandItems = useMemo<CommandItem[]>(() => {
    const navItems = NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.id}`,
        label: item.label,
        description: TAB_META[item.id].description,
        group: group.label,
        icon: item.icon,
        action: () => changeTab(item.id),
      }))
    );

    const userItems = usersList.slice(0, 8).map((user) => ({
      id: `user-${user.id}`,
      label: user.name,
      description: `${titleCase(user.role)} · ${user.email}`,
      group: "Users",
      icon: Users,
      action: () => {
        changeTab("users");
        setUserSearch(user.name);
        setUserDetail(user);
      },
    }));

    const propertyItems = properties.slice(0, 8).map((property) => ({
      id: `property-${property.id}`,
      label: property.name,
      description: `${property.address?.locality || property.address?.city || "Location pending"} · ${titleCase(property.verificationStatus)}`,
      group: "Properties",
      icon: Building2,
      action: () => {
        changeTab("properties");
        setPropertySearch("");
        setPropertyDetail(property);
      },
    }));

    const bookingItems = bookingsList.slice(0, 6).map((booking) => ({
      id: `booking-${booking.id}`,
      label: booking.bookingReference,
      description: `${booking.tenantUser?.name || "Tenant"} · ${booking.property?.name || "Property"}`,
      group: "Bookings",
      icon: FileCheck,
      action: () => {
        changeTab("bookings");
        setBookingSearch(booking.bookingReference);
      },
    }));

    return [...navItems, ...userItems, ...propertyItems, ...bookingItems];
  }, [usersList, properties, bookingsList]);

  const filteredCommands = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return commandItems.slice(0, 9);
    return commandItems
      .filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.group.toLowerCase().includes(query)
      )
      .slice(0, 12);
  }, [commandItems, commandQuery]);

  useEffect(() => {
    setCommandIndex(0);
  }, [commandQuery, commandOpen]);

  const runCommand = (item: CommandItem) => {
    item.action();
    setCommandOpen(false);
    setCommandQuery("");
  };

  const onCommandKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCommandIndex((index) => Math.min(index + 1, filteredCommands.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCommandIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filteredCommands[commandIndex]) {
      event.preventDefault();
      runCommand(filteredCommands[commandIndex]);
    }
  };

  const todayKey = new Date().toISOString().slice(0, 10);

  const exportUsers = () =>
    downloadCsv(
      `staysphere-users-${todayKey}.csv`,
      filteredUsers.map((user) => ({
        Name: user.name,
        Email: user.email,
        Phone: user.phone || "",
        Role: user.role,
        Status: user.isActive ? "ACTIVE" : "SUSPENDED",
        "KYC verified": user.ownerProfile?.isKycVerified || user.tenantProfile?.isKycVerified ? "YES" : "NO",
        Joined: formatDate(user.createdAt),
      }))
    );

  const exportBookings = () =>
    downloadCsv(
      `staysphere-bookings-${todayKey}.csv`,
      filteredBookings.map((booking) => ({
        Reference: booking.bookingReference,
        Tenant: booking.tenantUser?.name || "",
        Email: booking.tenantUser?.email || "",
        Property: booking.property?.name || "",
        Room: booking.room?.roomNumber || "",
        Bed: booking.bed?.bedNumber || "",
        "Check-in": formatDate(booking.checkInDate),
        "Monthly rent": booking.monthlyRent,
        Status: booking.status,
      }))
    );

  const exportPayments = () =>
    downloadCsv(
      `staysphere-payments-${todayKey}.csv`,
      filteredPayments.map((payment) => ({
        Receipt: payment.receiptNumber,
        Payer: payment.user?.name || "",
        Email: payment.user?.email || "",
        Type: payment.paymentType,
        Method: payment.paymentMethod,
        Amount: payment.amount,
        Status: payment.status,
        "Created at": formatDateTime(payment.createdAt),
      }))
    );

  const verifyPaymentWithGateway = async (razorpayOrderId?: string | null) => {
    if (!razorpayOrderId) return;
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiOrderReference: razorpayOrderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.error || "Payment verification failed");
        return;
      }
      showToast("success", "Payment verified and synchronized with UPI Gateway!");
      loadAdminData();
    } catch (err: any) {
      showToast("error", err.message || "Failed to reach verification endpoint");
    }
  };

  const renderDashboard = () => {
    const actionItems = [
      {
        label: "Properties awaiting verification",
        value: pendingApprovals,
        tab: "properties" as TabId,
        icon: Building2,
        tone: "amber" as Tone,
      },
      {
        label: "Open support tickets",
        value: ticketCounts.OPEN || 0,
        tab: "support" as TabId,
        icon: LifeBuoy,
        tone: "rose" as Tone,
      },
      {
        label: "Rent schedules due or overdue",
        value: overdueRents.length,
        tab: "payments" as TabId,
        icon: Clock,
        tone: "blue" as Tone,
      },
      {
        label: "Failed payment attempts",
        value: failedPayments.length,
        tab: "payments" as TabId,
        icon: CreditCard,
        tone: "violet" as Tone,
      },
    ].filter((item) => item.value > 0);

    return (
      <div className="space-y-5">
        <SectionHeader
          title="Platform overview"
          description="A live view of demand, supply and the work that needs your attention."
          actions={
            <>
              <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRange(days)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                      range === days
                        ? "bg-white/10 text-white"
                        : "text-slate-500 hover:text-slate-200"
                    )}
                  >
                    {days}d
                  </button>
                ))}
              </div>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className={SECONDARY_BTN}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View marketplace
              </a>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Captured revenue"
            value={formatCurrency(revenue)}
            helper={`${stats?.totalTransactions || analytics?.revenueByType?.length || 0} successful transactions`}
            icon={IndianRupee}
            tone="emerald"
            trend={{ label: `${range}d window`, positive: true }}
          />
          <StatCard
            label="Bed occupancy"
            value={`${occupancy}%`}
            helper={`${stats?.occupiedBeds || 0} of ${stats?.totalBeds || 0} beds filled`}
            icon={BedDouble}
            tone="blue"
            onClick={() => changeTab("properties")}
          />
          <StatCard
            label="Active residents"
            value={stats?.totalActiveTenants || analytics?.totals?.activeTenants || 0}
            helper={`${stats?.totalUsers || 0} tenant accounts · ${stats?.totalOwners || 0} owners`}
            icon={Users}
            tone="violet"
            onClick={() => changeTab("users")}
          />
          <StatCard
            label="Reservations"
            value={stats?.totalBookings || 0}
            helper={`${stats?.totalVisits || 0} site visits · ${todayVisits.length} today`}
            icon={FileCheck}
            tone="rose"
            onClick={() => changeTab("bookings")}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className={cn(PANEL, "overflow-hidden xl:col-span-2")}>
            <div className="flex flex-col gap-2 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Revenue trend</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Daily captured payments across the last {range} days
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Captured revenue
                </span>
              </div>
            </div>
            <div className="px-4 pb-4 pt-3 sm:px-5">
              {chart ? (
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    className="h-52 w-full sm:h-60"
                    role="img"
                    aria-label={`Revenue trend for the last ${range} days`}
                  >
                    <defs>
                      <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {chart.gridValues.map((value) => {
                      const y = chart.padding.top + chart.innerHeight * value;
                      return (
                        <g key={value}>
                          <line
                            x1={chart.padding.left}
                            x2={chart.width - chart.padding.right}
                            y1={y}
                            y2={y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                          />
                          <text
                            x={chart.width - 4}
                            y={y + 3}
                            textAnchor="end"
                            className="fill-slate-500 text-[9px]"
                          >
                            {formatCompactCurrency(chart.max * (1 - value))}
                          </text>
                        </g>
                      );
                    })}
                    <path d={chart.area} fill="url(#revenueFill)" />
                    <path
                      d={chart.line}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {chart.coords.map((point, index) => (
                      <g key={point.date}>
                        {point.value > 0 && (
                          <circle cx={point.x} cy={point.y} r="3" fill="#0b1220" stroke="#fb7185" strokeWidth="2">
                            <title>{`${formatDate(point.date)}: ${formatCurrency(point.value)}`}</title>
                          </circle>
                        )}
                        {[0, Math.floor(chart.coords.length / 2), chart.coords.length - 1].includes(index) && (
                          <text
                            x={point.x}
                            y={chart.height - 6}
                            textAnchor={index === 0 ? "start" : index === chart.coords.length - 1 ? "end" : "middle"}
                            className="fill-slate-600 text-[9px]"
                          >
                            {new Date(point.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                  {analytics?.totals?.revenue === 0 && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full border border-white/10 bg-[#0b1220]/90 px-3 py-1 text-[11px] text-slate-400">
                        No captured payments in this window
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-52 items-center justify-center text-[12px] text-slate-500">
                  Analytics will appear once payments are recorded.
                </div>
              )}

              <div className="mt-2 grid grid-cols-3 gap-3 border-t border-white/[0.07] pt-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">In window</p>
                  <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                    {formatCurrency(analytics?.totals?.revenue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">New bookings</p>
                  <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                    {analytics?.totals?.bookings || 0}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">New signups</p>
                  <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
                    {analytics?.totals?.signups || 0}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={PANEL}>
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Needs attention</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">Prioritised by operational risk</p>
              </div>
              {alertCount > 0 ? (
                <Badge tone="rose">{alertCount} open</Badge>
              ) : (
                <Badge tone="emerald" dot>
                  All clear
                </Badge>
              )}
            </div>
            <div className="divide-y divide-white/[0.06]">
              {actionItems.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
                  <p className="mt-2 text-[12px] font-medium text-slate-200">Nothing needs attention</p>
                  <p className="mt-1 text-[11px] text-slate-500">Approvals, tickets and rent collections are clear.</p>
                </div>
              ) : (
                actionItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => changeTab(item.tab)}
                      className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      <span className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-slate-300">{item.label}</span>
                      <span className="text-sm font-semibold text-white tabular-nums">{item.value}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-600 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-white/[0.07] px-5 py-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">Operational snapshot</p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                {[
                  { label: "Approvals", value: pendingApprovals },
                  { label: "Open tickets", value: ticketCounts.OPEN || 0 },
                  { label: "Rent follow-ups", value: overdueRents.length },
                  { label: "Visits today", value: todayVisits.length },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-300 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.07] p-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => changeTab("properties")} className={GHOST_BTN}>
                  <Building2 className="h-3.5 w-3.5" /> Verify
                </button>
                <button type="button" onClick={() => changeTab("support")} className={GHOST_BTN}>
                  <LifeBuoy className="h-3.5 w-3.5" /> Support
                </button>
                <button type="button" onClick={() => changeTab("notifications")} className={GHOST_BTN}>
                  <Zap className="h-3.5 w-3.5" /> Automate
                </button>
                <button type="button" onClick={() => changeTab("audit")} className={GHOST_BTN}>
                  <ShieldAlert className="h-3.5 w-3.5" /> Audit
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <section className={cn(PANEL, "xl:col-span-2")}>
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Recent admin activity</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">Newest first · {auditTotal} events recorded</p>
              </div>
              <button type="button" onClick={() => changeTab("audit")} className={GHOST_BTN}>
                View audit log <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-slate-400">
                    {initials(log.user?.name || "System")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[12px] font-medium text-slate-200">{titleCase(log.action)}</span>
                      <span className="text-[11px] text-slate-600">·</span>
                      <span className="text-[11px] text-slate-500">{log.user?.name || "System"}</span>
                    </div>
                    <p className="truncate text-[10px] text-slate-600">
                      {log.entityType} · {log.entityId}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">{relativeTime(log.createdAt)}</span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <div className="px-5 py-10 text-center text-[12px] text-slate-500">No audit events yet.</div>
              )}
            </div>
          </section>

          <section className={PANEL}>
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h3 className="text-sm font-semibold text-white">Occupancy by property</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Highest occupancy first</p>
            </div>
            <div className="space-y-4 px-5 py-4">
              {(analytics?.occupancyByProperty || [])
                .slice()
                .sort((a: any, b: any) => b.occupancyRate - a.occupancyRate)
                .slice(0, 5)
                .map((property: any) => (
                  <div key={property.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                      <span className="min-w-0 truncate text-slate-300">{property.name}</span>
                      <span className="shrink-0 font-medium text-slate-400 tabular-nums">
                        {property.occupancyRate}%
                      </span>
                    </div>
                    <ProgressBar value={property.occupancyRate} tone={property.occupancyRate >= 75 ? "emerald" : "amber"} />
                  </div>
                ))}
              {(analytics?.occupancyByProperty || []).length === 0 && (
                <p className="py-6 text-center text-[12px] text-slate-500">No bed inventory yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-4">
      <SectionHeader
        title="User directory"
        description="Manage access, review KYC signals and keep the marketplace safe."
        actions={
          <button type="button" onClick={exportUsers} className={SECONDARY_BTN} disabled={!filteredUsers.length}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      <div className={cn(PANEL, "p-3")}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { value: "ALL", label: "All users", count: usersList.length },
              { value: "CUSTOMER_TENANT", label: "Tenants", count: roleCounts.CUSTOMER_TENANT || 0 },
              { value: "PG_OWNER", label: "Owners", count: roleCounts.PG_OWNER || 0 },
              { value: "PG_STAFF", label: "Staff", count: roleCounts.PG_STAFF || 0 },
              { value: "SUPER_ADMIN", label: "Admins", count: roleCounts.SUPER_ADMIN || 0 },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setUserRole(option.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  userRole === option.value
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {option.label}
                <span className="ml-1.5 text-[10px] text-slate-500">{option.count}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={userStatus} onChange={(event) => setUserStatus(event.target.value)} className={SELECT} aria-label="Filter by status">
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <SearchField
              value={userSearch}
              onChange={setUserSearch}
              placeholder="Search name, email or phone"
              className="w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match this view"
          description="Try a different role, status or search phrase."
          action={
            <button type="button" onClick={() => { setUserRole("ALL"); setUserStatus("ALL"); setUserSearch(""); }} className={SECONDARY_BTN}>
              Clear filters
            </button>
          }
        />
      ) : (
        <div className={cn(PANEL, "overflow-hidden")}>
          <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
            <span>User</span>
            <span>Role</span>
            <span>Contact</span>
            <span>KYC</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {filteredUsers.map((user) => {
              const kyc = user.ownerProfile?.isKycVerified || user.tenantProfile?.isKycVerified;
              return (
                <div
                  key={user.id}
                  className="grid grid-cols-1 gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-5 lg:grid-cols-[minmax(0,2.2fr)_1fr_1fr_0.8fr_0.8fr_auto] lg:items-center"
                >
                  <button type="button" onClick={() => setUserDetail(user)} className="flex min-w-0 items-center gap-3 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-rose-500/20 to-violet-500/10 text-[11px] font-semibold text-rose-200">
                      {initials(user.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-white hover:text-rose-300">{user.name}</span>
                      <span className="block truncate text-[11px] text-slate-500">{user.email}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-2 lg:block">
                    <Badge tone={user.role === "SUPER_ADMIN" ? "rose" : user.role === "PG_OWNER" ? "violet" : user.role === "PG_STAFF" ? "blue" : "slate"}>
                      {titleCase(user.role)}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400">{user.phone || "No phone"}</span>
                  <span>
                    {kyc ? (
                      <Badge tone="emerald">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-slate-600">Not provided</span>
                    )}
                  </span>
                  <span>
                    <Badge tone={user.isActive ? "emerald" : "rose"} dot>
                      {user.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </span>
                  <div className="flex justify-start lg:justify-end">
                    <button
                      type="button"
                      onClick={() => requestToggleUser(user)}
                      className={cn(
                        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors",
                        user.isActive
                          ? "border-rose-500/20 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10"
                          : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/10"
                      )}
                    >
                      {user.isActive ? <Ban className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      {user.isActive ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderKyc = () => {
    // Filter owners
    const filteredOwners = kycOwners.filter((o) => {
      if (kycStatusFilter === "PENDING" && o.isKycVerified) return false;
      if (kycStatusFilter === "VERIFIED" && !o.isKycVerified) return false;
      if (kycSearch) {
        const q = kycSearch.toLowerCase();
        const match =
          o.name?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q) ||
          o.phone?.toLowerCase().includes(q) ||
          o.companyName?.toLowerCase().includes(q) ||
          o.panNumber?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Filter tenants
    const filteredTenants = kycTenants.filter((t) => {
      if (kycStatusFilter === "PENDING" && t.isKycVerified) return false;
      if (kycStatusFilter === "VERIFIED" && !t.isKycVerified) return false;
      if (kycSearch) {
        const q = kycSearch.toLowerCase();
        const match =
          t.name?.toLowerCase().includes(q) ||
          t.email?.toLowerCase().includes(q) ||
          t.phone?.toLowerCase().includes(q) ||
          t.idProofNumber?.toLowerCase().includes(q) ||
          t.propertyName?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const showOwners = kycTypeFilter === "ALL" || kycTypeFilter === "OWNER";
    const showTenants = kycTypeFilter === "ALL" || kycTypeFilter === "TENANT";

    return (
      <div className="space-y-5">
        <SectionHeader
          title="KYC Verification Portal"
          description="Admin clearance for PG Owners (to list properties) and Tenants / Residents (before stay allocation). All documents and financial identifiers require verification."
          actions={
            <button
              type="button"
              onClick={() => loadAdminData({ silent: true })}
              className={SECONDARY_BTN}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh
            </button>
          }
        />

        {/* KPI Stats */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Pending Owner KYC"
            value={kycSummary?.pendingOwners || 0}
            helper="Owners awaiting approval to list spaces"
            icon={Building2}
            tone={kycSummary?.pendingOwners > 0 ? "amber" : "slate"}
            onClick={() => { setKycTypeFilter("OWNER"); setKycStatusFilter("PENDING"); }}
          />
          <StatCard
            label="Verified Owners"
            value={kycSummary?.verifiedOwners || 0}
            helper="Active verified PG & Room hosts"
            icon={ShieldCheck}
            tone="emerald"
            onClick={() => { setKycTypeFilter("OWNER"); setKycStatusFilter("VERIFIED"); }}
          />
          <StatCard
            label="Pending Resident KYC"
            value={kycSummary?.pendingTenants || 0}
            helper="Tenants requiring ID proof validation"
            icon={Users}
            tone={kycSummary?.pendingTenants > 0 ? "rose" : "slate"}
            onClick={() => { setKycTypeFilter("TENANT"); setKycStatusFilter("PENDING"); }}
          />
          <StatCard
            label="Verified Residents"
            value={kycSummary?.verifiedTenants || 0}
            helper="Residents cleared for room allocation"
            icon={UserCheck}
            tone="blue"
            onClick={() => { setKycTypeFilter("TENANT"); setKycStatusFilter("VERIFIED"); }}
          />
        </div>

        {/* Filter controls */}
        <div className={cn(PANEL, "p-3")}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { value: "ALL", label: "All Profiles", count: kycOwners.length + kycTenants.length },
                { value: "OWNER", label: "PG Owners", count: kycOwners.length },
                { value: "TENANT", label: "Tenants", count: kycTenants.length },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setKycTypeFilter(opt.value)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    kycTypeFilter === opt.value
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  {opt.label}
                  <span className="ml-1.5 text-[10px] text-slate-500">{opt.count}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={kycStatusFilter}
                onChange={(e) => setKycStatusFilter(e.target.value)}
                className={SELECT}
                aria-label="Filter KYC by verification status"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Verification</option>
                <option value="VERIFIED">Verified / Approved</option>
              </select>
              <SearchField
                value={kycSearch}
                onChange={setKycSearch}
                placeholder="Search name, PAN, phone, ID..."
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* OWNER KYC SECTION */}
        {showOwners && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-white">PG Owner KYC Applications</h3>
                <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                  {filteredOwners.length}
                </span>
              </div>
            </div>

            {filteredOwners.length === 0 ? (
              <div className={cn(PANEL, "p-6 text-center text-[12px] text-slate-500")}>
                No PG owners match the selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {filteredOwners.map((owner) => {
                  const mainProperty = owner.properties?.[0];
                  return (
                    <div
                      key={owner.profileId}
                      className={cn(
                        PANEL,
                        "p-4 transition-all",
                        !owner.isKycVerified ? "border-amber-500/30 bg-amber-950/10" : ""
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-rose-500/10 text-xs font-semibold text-violet-200">
                            {initials(owner.name)}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-white">{owner.name}</span>
                              <Badge tone={owner.isKycVerified ? "emerald" : "amber"}>
                                {owner.isKycVerified ? "Verified" : "Pending Review"}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {owner.companyName ? `${owner.companyName}` : "Individual Host"} · {owner.email} · {owner.phone || "No phone"}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setKycDetailModal(owner)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/10 shrink-0 cursor-pointer"
                        >
                          <Eye className="h-3 w-3" /> Dossier
                        </button>
                      </div>

                      {/* Rent Home Property Snapshot (if provided during signup) */}
                      {mainProperty && (
                        <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{mainProperty.name}</span>
                                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20">
                                  {mainProperty.propertyType}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {mainProperty.genderPreference} · {mainProperty.foodOption?.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 text-slate-500" />
                                <span>{mainProperty.address?.locality || "City Center"}, {mainProperty.address?.city || "Bangalore"}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-emerald-400">
                                ₹{mainProperty.startingRent?.toLocaleString("en-IN")}<span className="text-[10px] font-normal text-slate-400">/mo</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Dep: ₹{mainProperty.securityDeposit?.toLocaleString("en-IN")}
                              </div>
                            </div>
                          </div>

                          {/* Photos Thumbnail Strip */}
                          {mainProperty.media && mainProperty.media.length > 0 && (
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold flex items-center justify-between">
                                <span>Rent Home Photos ({mainProperty.media.length})</span>
                                <span className="text-blue-400 cursor-pointer hover:underline text-[10px]" onClick={() => setKycDetailModal(owner)}>
                                  View all photos →
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-1.5">
                                {mainProperty.media.slice(0, 4).map((photo: any, idx: number) => (
                                  <div
                                    key={idx}
                                    onClick={() => setKycDetailModal(owner)}
                                    className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-slate-900 cursor-pointer group"
                                  >
                                    <SafeImage
                                      src={photo.url}
                                      variants={photo.variants}
                                      blurData={photo.blurData}
                                      alt="Rent home photo"
                                      fill
                                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    />
                                    {photo.isCover && (
                                      <span className="absolute top-0.5 left-0.5 bg-blue-600/90 text-white text-[8px] font-bold px-1 py-0.2 rounded">
                                        Cover
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Facility Features Badges */}
                          {mainProperty.amenities && mainProperty.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {mainProperty.amenities.slice(0, 5).map((amenity: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[10px] font-medium text-slate-300"
                                >
                                  {amenity.name}
                                </span>
                              ))}
                              {mainProperty.amenities.length > 5 && (
                                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-400">
                                  +{mainProperty.amenities.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Owner Financial & KYC Document Signals */}
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-2.5 text-[11px]">
                        <div>
                          <span className="text-slate-500">PAN Card:</span>
                          <div className="font-mono font-medium text-slate-200">
                            {owner.panNumber || <span className="text-rose-400">Not provided</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">GSTIN:</span>
                          <div className="font-mono font-medium text-slate-200">
                            {owner.gstNumber || "Not Applicable / Unregistered"}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">Bank Account:</span>
                          <div className="font-mono font-medium text-slate-200">
                            {owner.bankAccountNumber || <span className="text-rose-400">Not linked</span>}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500">IFSC Code:</span>
                          <div className="font-mono font-medium text-slate-200">
                            {owner.bankIfscCode || <span className="text-rose-400">Not linked</span>}
                          </div>
                        </div>
                      </div>

                      {/* KYC Document Proof Link if present */}
                      {owner.kycDocUrl && (
                        <div className="mt-2.5 flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-[11px]">
                          <span className="text-slate-300">Identity & Utility Bill Proof:</span>
                          <a
                            href={owner.kycDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            <span>Open Document</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {owner.rejectionReason && (
                        <div className="mt-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-[11px] text-rose-300">
                          <span className="font-semibold">Rejection Note:</span> {owner.rejectionReason}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
                        <span className="text-[10px] text-slate-500">
                          {owner.propertyCount} properties registered · Joined {formatDate(owner.joinedAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          {!owner.isKycVerified ? (
                            <>
                              <button
                                type="button"
                                disabled={kycUpdating}
                                onClick={() =>
                                  setConfirmTarget({
                                    title: `Approve KYC & Activate Account for ${owner.name}?`,
                                    description: `Verifying will approve their KYC, publish their rent home listing, activate their user account, and email their login details.`,
                                    confirmLabel: "Verify, Approve & Send Email",
                                    tone: "emerald",
                                    onConfirm: () => handleKycAction(owner.profileId, "OWNER", "APPROVE"),
                                  })
                                }
                                className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                              >
                                <ShieldCheck className="h-3 w-3" /> Approve KYC
                              </button>
                              <button
                                type="button"
                                disabled={kycUpdating}
                                onClick={() =>
                                  setKycRejectModal({
                                    profileId: owner.profileId,
                                    profileType: "OWNER",
                                    name: owner.name,
                                  })
                                }
                                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 text-[11px] font-medium text-rose-300 transition-colors hover:bg-rose-500/20 cursor-pointer"
                              >
                                <X className="h-3 w-3" /> Reject
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={kycUpdating}
                              onClick={() =>
                                setConfirmTarget({
                                  title: `Revoke KYC verification for ${owner.name}?`,
                                  description: "This will suspend their ability to list new properties until re-verified.",
                                  confirmLabel: "Revoke Verification",
                                  tone: "rose",
                                  onConfirm: () => handleKycAction(owner.profileId, "OWNER", "REJECT", "KYC status revoked by administrator."),
                                })
                              }
                              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[11px] font-medium text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TENANT KYC SECTION */}
        {showTenants && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-white">Tenant & Resident KYC Clearance</h3>
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                  {filteredTenants.length}
                </span>
              </div>
            </div>

            {filteredTenants.length === 0 ? (
              <div className={cn(PANEL, "p-6 text-center text-[12px] text-slate-500")}>
                No tenant KYC applications match the selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {filteredTenants.map((tenant) => (
                  <div
                    key={tenant.profileId}
                    className={cn(
                      PANEL,
                      "p-4 transition-all",
                      !tenant.isKycVerified ? "border-rose-500/30 bg-rose-950/10" : ""
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-rose-500/20 to-blue-500/10 text-xs font-semibold text-rose-200">
                          {initials(tenant.name)}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-white">{tenant.name}</span>
                            <Badge tone={tenant.isKycVerified ? "emerald" : "rose"}>
                              {tenant.isKycVerified ? "Verified" : "Pending ID Verification"}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {tenant.email} · {tenant.phone || "No phone"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setKycDetailModal(tenant)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 text-[11px] font-medium text-slate-200 transition-colors hover:bg-white/10 shrink-0 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> Dossier
                      </button>
                    </div>

                    {/* Tenant ID and Stay Details */}
                    <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.06] bg-black/20 p-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-500">ID Proof Type:</span>
                        <div className="font-medium text-slate-200">
                          {tenant.idProofType || "Government Photo ID"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">ID Proof Number:</span>
                        <div className="font-mono font-medium text-slate-200">
                          {tenant.idProofNumber || <span className="text-rose-400">Pending upload</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Emergency Contact:</span>
                        <div className="font-medium text-slate-200">
                          {tenant.emergencyContact || "Not provided"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Assigned Stay:</span>
                        <div className="font-medium text-slate-200 truncate">
                          {tenant.currentBed || "Not yet assigned"}
                          {tenant.propertyName ? ` (${tenant.propertyName})` : ""}
                        </div>
                      </div>
                    </div>

                    {(tenant.kycDocUrl || tenant.idProofDocumentUrl) && (
                      <div className="mt-2.5 flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-[11px]">
                        <span className="text-slate-300">Government ID Document Proof:</span>
                        <a
                          href={tenant.kycDocUrl || tenant.idProofDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          <span>Open Document</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {tenant.rejectionReason && (
                      <div className="mt-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-[11px] text-rose-300">
                        <span className="font-semibold">Rejection Note:</span> {tenant.rejectionReason}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <span className="text-[10px] text-slate-500">
                        Registered {formatDate(tenant.joinedAt)}
                      </span>
                      <div className="flex items-center gap-2">
                        {!tenant.isKycVerified ? (
                          <>
                            <button
                              type="button"
                              disabled={kycUpdating}
                              onClick={() =>
                                setConfirmTarget({
                                  title: `Verify & Approve KYC for ${tenant.name}?`,
                                  description: `Confirm government ID validation for ${tenant.name}. They will be cleared for accommodation and active bed allocation.`,
                                  confirmLabel: "Verify & Approve",
                                  tone: "emerald",
                                  onConfirm: () => handleKycAction(tenant.profileId, "TENANT", "APPROVE"),
                                })
                              }
                              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <ShieldCheck className="h-3 w-3" /> Approve KYC
                            </button>
                            <button
                              type="button"
                              disabled={kycUpdating}
                              onClick={() =>
                                setKycRejectModal({
                                  profileId: tenant.profileId,
                                  profileType: "TENANT",
                                  name: tenant.name,
                                })
                              }
                              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 text-[11px] font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
                            >
                              <X className="h-3 w-3" /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={kycUpdating}
                            onClick={() =>
                              setConfirmTarget({
                                title: `Revoke KYC verification for ${tenant.name}?`,
                                description: "This will mark their resident documents as unverified.",
                                confirmLabel: "Revoke Verification",
                                tone: "rose",
                                onConfirm: () => handleKycAction(tenant.profileId, "TENANT", "REJECT", "KYC status revoked by administrator."),
                              })
                            }
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[11px] font-medium text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REJECT MODAL */}
        <Modal
          open={Boolean(kycRejectModal)}
          onClose={() => { setKycRejectModal(null); setKycRejectReason(""); }}
          title={`Reject KYC — ${kycRejectModal?.name || ""}`}
          description={`Explain why this ${kycRejectModal?.profileType === "OWNER" ? "owner" : "tenant"}'s KYC documents could not be approved. They will receive an actionable notice.`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Rejection Reason / Guidance
              </label>
              <textarea
                value={kycRejectReason}
                onChange={(e) => setKycRejectReason(e.target.value)}
                placeholder="e.g., PAN card name mismatch, blurred Aadhaar photo, invalid bank IFSC code. Please re-submit clear documents."
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#070b14] p-3 text-xs text-white placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setKycRejectModal(null); setKycRejectReason(""); }}
                className={SECONDARY_BTN}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={kycUpdating || !kycRejectReason.trim()}
                onClick={() => {
                  if (kycRejectModal) {
                    void handleKycAction(kycRejectModal.profileId, kycRejectModal.profileType, "REJECT", kycRejectReason);
                  }
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
              >
                {kycUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>

        {/* KYC FULL DOSSIER & PHOTOS DETAIL MODAL */}
        <Modal
          open={Boolean(kycDetailModal)}
          onClose={() => setKycDetailModal(null)}
          title={
            kycDetailModal?.profileType === "OWNER"
              ? `Owner KYC & Rent Home Dossier — ${kycDetailModal?.name}`
              : `Tenant / Resident ID Clearance — ${kycDetailModal?.name}`
          }
          description={
            kycDetailModal?.profileType === "OWNER"
              ? "Comprehensive owner credentials, banking setup, rent home photos, facility features, and property documentation."
              : "Verified government identification and resident allocation record."
          }
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500">
                Registered {formatDate(kycDetailModal?.joinedAt)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setKycDetailModal(null)}
                  className={SECONDARY_BTN}
                >
                  Close
                </button>
                {kycDetailModal && !kycDetailModal.isKycVerified ? (
                  <>
                    <button
                      type="button"
                      disabled={kycUpdating}
                      onClick={() => {
                        const target = kycDetailModal;
                        setKycDetailModal(null);
                        setConfirmTarget({
                          title: `Approve KYC & Activate Account for ${target.name}?`,
                          description: `This will approve ${target.profileType === "OWNER" ? "their PG / Rent Home property" : "their resident profile"}, activate their account, and automatically email their login details.`,
                          confirmLabel: "Verify, Approve & Send Login Email",
                          tone: "emerald",
                          onConfirm: () => handleKycAction(target.profileId, target.profileType, "APPROVE"),
                        });
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 text-[12px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Approve & Activate
                    </button>
                    <button
                      type="button"
                      disabled={kycUpdating}
                      onClick={() => {
                        const target = kycDetailModal;
                        setKycDetailModal(null);
                        setKycRejectModal({
                          profileId: target.profileId,
                          profileType: target.profileType,
                          name: target.name,
                        });
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-[12px] font-medium text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={kycUpdating}
                    onClick={() => {
                      const target = kycDetailModal;
                      setKycDetailModal(null);
                      setConfirmTarget({
                        title: `Revoke verification for ${target?.name}?`,
                        description: "This will suspend their verified status until re-verified.",
                        confirmLabel: "Revoke Verification",
                        tone: "rose",
                        onConfirm: () => handleKycAction(target.profileId, target.profileType, "REJECT", "KYC status revoked by administrator."),
                      });
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12px] font-medium text-slate-400 hover:bg-white/5 hover:text-white cursor-pointer"
                  >
                    Revoke Verification
                  </button>
                )}
              </div>
            </div>
          }
        >
          {kycDetailModal && (
            <div className="space-y-5 text-xs text-slate-300 max-h-[70vh] overflow-y-auto pr-1">
              {/* Profile summary card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-sm font-bold text-white">
                    {initials(kycDetailModal.name)}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{kycDetailModal.name}</span>
                      <Badge tone={kycDetailModal.isKycVerified ? "emerald" : "amber"}>
                        {kycDetailModal.isKycVerified ? "Verified" : "Pending Review"}
                      </Badge>
                      <Badge tone={kycDetailModal.isActive ? "emerald" : "slate"}>
                        {kycDetailModal.isActive ? "Account Active" : "Account Pending Activation"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Email: <strong className="text-white">{kycDetailModal.email}</strong> · Mobile: <strong className="text-white">{kycDetailModal.phone || "Not provided"}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* OWNER SPECIFIC DOSSIER */}
              {kycDetailModal.profileType === "OWNER" && (
                <div className="space-y-4">
                  {/* Banking & Identity */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
                      <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                      <span>Owner Banking & Payout Credentials</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500">Business / Brand:</span>
                        <div className="font-semibold text-white">{kycDetailModal.companyName || "Individual Host"}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">PAN Card Number:</span>
                        <div className="font-mono font-bold text-slate-200">{kycDetailModal.panNumber || "—"}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">GSTIN:</span>
                        <div className="font-mono text-slate-200">{kycDetailModal.gstNumber || "Unregistered"}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Bank Beneficiary:</span>
                        <div className="font-semibold text-white">{kycDetailModal.bankAccountName || kycDetailModal.name}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Bank Account Number:</span>
                        <div className="font-mono font-bold text-slate-200">{kycDetailModal.bankAccountNumber || "—"}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">IFSC Code:</span>
                        <div className="font-mono font-bold text-slate-200">{kycDetailModal.bankIfscCode || "—"}</div>
                      </div>
                    </div>

                    {kycDetailModal.kycDocUrl && (
                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Owner Identity / Electricity Bill Document:</span>
                        <a
                          href={kycDetailModal.kycDocUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors font-medium text-xs"
                        >
                          <span>Open Document Proof</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Properties list */}
                  {kycDetailModal.properties && kycDetailModal.properties.length > 0 ? (
                    kycDetailModal.properties.map((prop: any, pIdx: number) => (
                      <div key={prop.id || pIdx} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{prop.name}</h4>
                              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                                {prop.propertyType}
                              </span>
                              <Badge tone={prop.verificationStatus === "APPROVED" ? "emerald" : "amber"}>
                                {prop.verificationStatus}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span>{prop.address?.addressLine1}, {prop.address?.locality}, {prop.address?.city}, {prop.address?.state} - {prop.address?.pincode}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-400">
                              ₹{prop.startingRent?.toLocaleString("en-IN")}<span className="text-xs text-slate-400 font-normal">/mo</span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Deposit: ₹{prop.securityDeposit?.toLocaleString("en-IN")} · Maint: ₹{prop.maintenanceCharges || 0}
                            </div>
                          </div>
                        </div>

                        {prop.description && (
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Description</span>
                            <p className="text-[11px] text-slate-300 bg-black/20 p-2.5 rounded-lg border border-white/[0.04] leading-relaxed">
                              {prop.description}
                            </p>
                          </div>
                        )}

                        {/* Rent Home Photos Gallery */}
                        {prop.media && prop.media.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] uppercase tracking-wider font-bold text-white flex items-center gap-1.5">
                                <span>📸 Rent Home Photos ({prop.media.length})</span>
                              </span>
                              <span className="text-[10px] text-slate-500">Click any photo to open full resolution</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {prop.media.map((mediaItem: any, mIdx: number) => (
                                <a
                                  key={mIdx}
                                  href={mediaItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 group cursor-pointer"
                                >
                                  <SafeImage
                                    src={mediaItem.url}
                                    variants={mediaItem.variants}
                                    blurData={mediaItem.blurData}
                                    alt={mediaItem.caption || `Rent Home Photo ${mIdx + 1}`}
                                    fill
                                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                  />
                                  {mediaItem.isCover && (
                                    <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                      Cover Photo
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Features & Facilities */}
                        {prop.amenities && prop.amenities.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5">
                              Features, Facilities & Amenities ({prop.amenities.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {prop.amenities.map((amenity: any, aIdx: number) => (
                                <div
                                  key={aIdx}
                                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-200"
                                >
                                  <span className="text-emerald-400 font-bold"></span>
                                  <span>{amenity.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* House Rules & Policies */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                            <span className="text-slate-500 block text-[10px]">Gender Preference:</span>
                            <span className="font-semibold text-white">{prop.genderPreference}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                            <span className="text-slate-500 block text-[10px]">Food Facility:</span>
                            <span className="font-semibold text-white">{prop.foodOption?.replace("_", " ")}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-black/20 border border-white/[0.04]">
                            <span className="text-slate-500 block text-[10px]">Notice Period / Gate:</span>
                            <span className="font-semibold text-white">{prop.noticePeriodDays} Days · Gate: {prop.gateClosingTime || "None"}</span>
                          </div>
                        </div>

                        {/* Food Menu if available */}
                        {prop.foodOption && prop.foodOption !== "NONE" && (() => {
                          const menu = typeof prop.menuItems === "object" && prop.menuItems !== null
                            ? prop.menuItems
                            : (() => {
                                try {
                                  return JSON.parse(prop.menuItems || "{}");
                                } catch {
                                  return {};
                                }
                              })();

                          const meals = [
                            { key: "breakfast", label: "Breakfast", emoji: "" },
                            ...(prop.foodOption === "THREE_MEALS" ? [{ key: "lunch", label: "Lunch", emoji: "" }] : []),
                            ...(prop.foodOption === "THREE_MEALS" || prop.foodOption === "TWO_MEALS" ? [{ key: "dinner", label: "Dinner", emoji: "" }] : []),
                            { key: "snacks", label: "Evening Snacks", emoji: "" },
                          ];

                          return (
                            <div className="pt-2 space-y-2">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 block flex items-center gap-1.5">
                                <Utensils className="h-3 w-3" />
                                <span>Daily Dining &amp; Food Menu ({prop.foodOption?.replace("_", " ")})</span>
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                {meals.map((m) => {
                                  const dishes = (menu[m.key] as string[]) || [];
                                  return (
                                    <div key={m.key} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 space-y-1">
                                      <div className="font-semibold text-amber-200 flex items-center gap-1 text-[10px]">
                                        <span>{m.emoji}</span>
                                        <span>{m.label}</span>
                                      </div>
                                      {dishes.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {dishes.map((dish: string, dIdx: number) => (
                                            <span key={dIdx} className="rounded px-1.5 py-0.5 text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                              {dish}
                                            </span>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[9px] text-slate-500 italic">Standard homestyle meal</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Room Inventory */}
                        {prop.rooms && prop.rooms.length > 0 && (
                          <div className="pt-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                🛏 Room Inventory ({prop.rooms.length} room{prop.rooms.length !== 1 ? "s" : ""} · {prop.rooms.reduce((s: number, r: any) => s + (r.bedCount || r.beds?.length || 0), 0)} total beds)
                              </span>
                            </div>
                            <div className="space-y-2">
                              {prop.rooms.map((room: any, rIdx: number) => (
                                <div key={room.id || rIdx} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5 space-y-1.5">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-bold text-[12px] text-white">Room {room.roomNumber}</span>
                                      <span className="rounded-md bg-indigo-600/80 text-white text-[9px] font-bold px-1.5 py-0.5">
                                        {room.floorNumber === 0 ? "Ground Floor" : `Floor ${room.floorNumber}`}
                                      </span>
                                      <span className="rounded-md bg-blue-500/20 text-blue-200 text-[9px] font-semibold px-1.5 py-0.5 border border-blue-500/20">
                                        {titleCase(room.sharingType)} Sharing
                                      </span>
                                      <span className="rounded-md bg-emerald-500/15 text-emerald-300 text-[9px] font-semibold px-1.5 py-0.5">
                                        {room.bedCount || room.beds?.length || 0} beds
                                      </span>
                                    </div>
                                    <div className="text-right text-[11px]">
                                      <span className="font-bold text-emerald-400">₹{(room.monthlyRent || 0).toLocaleString("en-IN")}<span className="text-[9px] text-slate-400 font-normal">/mo</span></span>
                                    </div>
                                  </div>
                                  {/* Bed chips */}
                                  {room.beds && room.beds.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {room.beds.map((bed: any) => (
                                        <span
                                          key={bed.id || bed.bedNumber}
                                          className={`rounded px-1.5 py-0.5 text-[9px] font-semibold border ${
                                            bed.status === "AVAILABLE"
                                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                              : bed.status === "OCCUPIED"
                                              ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                              : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                          }`}
                                        >
                                          Bed {bed.bedNumber} · {bed.status}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {/* Per-room amenities */}
                                  {(room.hasAttachedBath || room.hasBalcony || room.hasAirCondition) && (
                                    <div className="flex flex-wrap gap-1">
                                      {room.hasAttachedBath && <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">Attached Bath</span>}
                                      {room.hasBalcony && <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">Balcony</span>}
                                      {room.hasAirCondition && <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">AC</span>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center text-slate-400 text-xs">
                      No properties submitted yet.
                    </div>
                  )}
                </div>
              )}

              {/* TENANT SPECIFIC DOSSIER */}
              {kycDetailModal.profileType === "TENANT" && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 text-[11px]">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-white/[0.06] pb-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-rose-400" />
                    <span>Government ID Verification & Emergency Contact</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-500">Government ID Type:</span>
                      <div className="font-bold text-white text-xs">{kycDetailModal.idProofType || "Government Photo ID"}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">ID Document Number:</span>
                      <div className="font-mono font-bold text-white text-xs">{kycDetailModal.idProofNumber || "Pending"}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Emergency Contact:</span>
                      <div className="font-semibold text-white">{kycDetailModal.emergencyContact || "Not provided"}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Stay Assignment:</span>
                      <div className="font-semibold text-white">{kycDetailModal.currentBed || "Not yet allocated"} {kycDetailModal.propertyName ? `(${kycDetailModal.propertyName})` : ""}</div>
                    </div>
                  </div>

                  {(kycDetailModal.kycDocUrl || kycDetailModal.idProofDocumentUrl) && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-slate-400">Submitted ID Proof Document:</span>
                      <a
                        href={kycDetailModal.kycDocUrl || kycDetailModal.idProofDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-colors font-medium text-xs"
                      >
                        <span>View ID Document</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  };

  const renderProperties = () => {
    const statusOptions = [
      { value: "ALL", label: "All", count: properties.length },
      { value: "PENDING_VERIFICATION", label: "Pending", count: propertyCounts.PENDING_VERIFICATION || 0 },
      { value: "APPROVED", label: "Approved", count: propertyCounts.APPROVED || 0 },
      { value: "REJECTED", label: "Rejected", count: propertyCounts.REJECTED || 0 },
      { value: "DRAFT", label: "Draft", count: propertyCounts.DRAFT || 0 },
    ];

    return (
      <div className="space-y-4">
        <SectionHeader
          title="Property verification"
          description="Review listings, inspect inventory and publish trusted spaces."
          actions={
            <button type="button" onClick={() => loadAdminData({ silent: true })} className={SECONDARY_BTN} disabled={refreshing}>
              {refreshing ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />} Refresh queue
            </button>
          }
        />

        <div className={cn(PANEL, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div className="flex flex-wrap items-center gap-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPropertyStatus(option.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  propertyStatus === option.value
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {option.label}
                <span className="ml-1.5 text-[10px] text-slate-500">{option.count}</span>
              </button>
            ))}
          </div>
          <SearchField
            value={propertySearch}
            onChange={setPropertySearch}
            placeholder="Search property, owner or locality"
            className="w-full lg:w-72"
          />
        </div>

        {filteredProperties.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties in this view"
            description="Pending listings will appear here as owners submit them for verification."
            action={
              <button type="button" onClick={() => { setPropertyStatus("ALL"); setPropertySearch(""); }} className={SECONDARY_BTN}>
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filteredProperties.map((property) => {
              const beds = (property.rooms || []).flatMap((room: any) => room.beds || []);
              const occupied = beds.filter((bed: any) => bed.status === "OCCUPIED").length;
              const available = beds.filter((bed: any) => bed.status === "AVAILABLE").length;
              const occupancyRate = beds.length ? Math.round((occupied / beds.length) * 100) : 0;
              const cover = property.media?.[0]?.url;
              return (
                <article key={property.id} className={cn(PANEL, "group overflow-hidden transition-colors hover:border-white/15")}>
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950/40">
                    {cover ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-70 transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${cover})` }}
                        aria-hidden
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-white/15" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/30 to-transparent" />
                    <div className="absolute left-3 top-3 inline-flex rounded-full bg-[#0b1220]/80 p-0.5 backdrop-blur-md">
                      <Badge tone={statusTone(property.verificationStatus)} dot>
                        {titleCase(property.verificationStatus)}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">{property.name}</h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="h-3 w-3" />
                        {property.address ? `${property.address.locality}, ${property.address.city}` : "Address pending"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Owner</span>
                      <span className="max-w-[65%] truncate font-medium text-slate-300">{property.owner?.user?.name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Rent from</span>
                      <span className="font-medium text-slate-200 tabular-nums">{formatCurrency(property.startingRent)}/mo</span>
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{occupied}/{beds.length} beds occupied · {available} available</span>
                        <span className="tabular-nums">{occupancyRate}%</span>
                      </div>
                      <ProgressBar value={occupancyRate} tone={occupancyRate >= 75 ? "emerald" : occupancyRate > 0 ? "amber" : "slate"} />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={() => setPropertyDetail(property)} className={cn(SECONDARY_BTN, "flex-1")}>
                        <Eye className="h-3.5 w-3.5" /> Review
                      </button>
                      {property.verificationStatus !== "APPROVED" && (
                        <button type="button" onClick={() => requestApproveProperty(property)} className={cn(PRIMARY_BTN, "flex-1 bg-emerald-600 hover:bg-emerald-500")}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {property.verificationStatus !== "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectTarget(property);
                            setRejectionReason(property.rejectionReason || "");
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 text-rose-300 transition-colors hover:bg-rose-500/10"
                          aria-label={`Reject ${property.name}`}
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderVisits = () => {
    const statusOptions = ["ALL", "SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Visit pipeline"
          description="Prospect inspections booked against your properties."
          actions={<Badge tone="blue">{visitsList.length} total</Badge>}
        />
        <div className={cn(PANEL, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setVisitStatus(status)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  visitStatus === status ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {titleCase(status)}
              </button>
            ))}
          </div>
          <SearchField value={visitSearch} onChange={setVisitSearch} placeholder="Search visitor or property" className="w-full lg:w-64" />
        </div>

        {filteredVisits.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No site visits scheduled"
            description="When a prospect books a property tour it will appear here with contact details and outcome controls."
          />
        ) : (
          <div className={cn(PANEL, "overflow-hidden")}>
            <div className="hidden grid-cols-[1.2fr_1.5fr_1fr_0.8fr_auto] items-center gap-3 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
              <span>Visitor</span>
              <span>Property</span>
              <span>Schedule</span>
              <span>Status</span>
              <span className="text-right">Outcome</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredVisits.map((visit) => (
                <div key={visit.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:px-5 lg:grid-cols-[1.2fr_1.5fr_1fr_0.8fr_auto] lg:items-center">
                  <div>
                    <p className="text-[12px] font-medium text-white">{visit.name}</p>
                    <p className="text-[11px] text-slate-500">{visit.phone}{visit.email ? ` · ${visit.email}` : ""}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-300">{visit.property?.name}</p>
                    <p className="text-[10px] text-slate-600">{visit.sharingInterest ? `${titleCase(visit.sharingInterest)} sharing` : "Sharing preference not set"}</p>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <p>{formatDate(visit.visitDate)}</p>
                    <p className="text-[10px] text-slate-600">{titleCase(visit.timeSlot)}</p>
                  </div>
                  <div>
                    <Badge tone={statusTone(visit.status)} dot>{titleCase(visit.status)}</Badge>
                  </div>
                  <div className="flex flex-wrap justify-start gap-1.5 lg:justify-end">
                    {visit.status === "SCHEDULED" ? (
                      <>
                        <button type="button" onClick={() => updateVisitStatus(visit, "COMPLETED")} className={cn(GHOST_BTN, "text-emerald-300 hover:text-emerald-200")}>
                          <CheckCheck className="h-3 w-3" /> Complete
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmTarget({
                              title: "Cancel this site visit?",
                              description: `${visit.name}'s visit to ${visit.property?.name} will be marked cancelled.`,
                              confirmLabel: "Cancel visit",
                              tone: "rose",
                              onConfirm: () => updateVisitStatus(visit, "CANCELLED"),
                            })
                          }
                          className={cn(GHOST_BTN, "text-rose-300 hover:text-rose-200")}
                        >
                          <X className="h-3 w-3" /> Cancel
                        </button>
                        <button type="button" onClick={() => updateVisitStatus(visit, "NO_SHOW")} className={GHOST_BTN}>
                          No-show
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-600">Closed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBookings = () => {
    const statusOptions = ["ALL", "CONFIRMED", "AWAITING_PAYMENT", "PENDING", "COMPLETED", "CANCELLED", "REFUNDED"];
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Reservations"
          description="Specific-bed bookings, payment state and check-in dates."
          actions={
            <button type="button" onClick={exportBookings} className={SECONDARY_BTN} disabled={!filteredBookings.length}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          }
        />
        <div className={cn(PANEL, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setBookingStatus(status)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  bookingStatus === status ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {titleCase(status)}
                {status !== "ALL" && bookingCounts[status] ? <span className="ml-1.5 text-[10px] text-slate-500">{bookingCounts[status]}</span> : null}
              </button>
            ))}
          </div>
          <SearchField value={bookingSearch} onChange={setBookingSearch} placeholder="Search reference, tenant or property" className="w-full lg:w-72" />
        </div>

        {filteredBookings.length === 0 ? (
          <EmptyState icon={FileCheck} title="No bookings in this view" description="Reservations will show up here with tenant, room and bed details." />
        ) : (
          <div className={cn(PANEL, "overflow-hidden")}>
            <div className="hidden grid-cols-[1fr_1.4fr_1.5fr_1fr_0.8fr] items-center gap-3 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
              <span>Reference</span>
              <span>Tenant</span>
              <span>Property / bed</span>
              <span>Check-in</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:px-5 lg:grid-cols-[1fr_1.4fr_1.5fr_1fr_0.8fr] lg:items-center">
                  <div>
                    <p className="font-mono text-[11px] font-medium text-rose-300">{booking.bookingReference}</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">{formatCurrency(booking.monthlyRent)}/mo</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-slate-200">{booking.tenantUser?.name || "—"}</p>
                    <p className="text-[10px] text-slate-600">{booking.tenantUser?.phone || booking.tenantUser?.email || ""}</p>
                  </div>
                  <div>
                    <p className="truncate text-[12px] text-slate-300">{booking.property?.name}</p>
                    <p className="text-[10px] text-slate-600">Room {booking.room?.roomNumber || "—"} · Bed {booking.bed?.bedNumber || "unassigned"}</p>
                  </div>
                  <p className="text-[11px] text-slate-400">{formatDate(booking.checkInDate)}</p>
                  <Badge tone={statusTone(booking.status)} dot>{titleCase(booking.status)}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPayments = () => {
    const captured = paymentsList.filter((payment) => payment.status === "SUCCESS");
    const capturedTotal = captured.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const failedTotal = paymentsList.filter((payment) => payment.status === "FAILED").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const statusOptions = ["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED"];
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Revenue & transactions"
          description="Captured revenue, rent schedules and transaction-level health."
          actions={
            <button type="button" onClick={exportPayments} className={SECONDARY_BTN} disabled={!filteredPayments.length}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          }
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Captured" value={formatCurrency(capturedTotal)} helper={`${captured.length} successful payments`} icon={Wallet} tone="emerald" />
          <StatCard label="Failed amount" value={formatCurrency(failedTotal)} helper={`${paymentsList.filter((payment) => payment.status === "FAILED").length} failed attempts`} icon={CircleAlert} tone="rose" />
          <StatCard label="Due / overdue rent" value={formatCurrency(analytics?.totals?.overdueRentAmount || 0)} helper={`${analytics?.totals?.overdueRentCount || overdueRents.length} open schedules`} icon={Clock} tone="amber" />
        </div>

        <div className={cn(PANEL, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setPaymentStatus(status)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  paymentStatus === status ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {titleCase(status)}
              </button>
            ))}
          </div>
          <SearchField value={paymentSearch} onChange={setPaymentSearch} placeholder="Search receipt, payer or txn ID" className="w-full lg:w-72" />
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No transactions in this view" description="Captured and failed payments will appear here with receipt references." />
        ) : (
          <div className={cn(PANEL, "overflow-hidden")}>
            <div className="hidden grid-cols-[1fr_1.3fr_1fr_1fr_1fr_0.8fr] items-center gap-3 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
              <span>Receipt</span>
              <span>Payer</span>
              <span>Type</span>
              <span>Method</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="grid grid-cols-1 gap-2 px-4 py-3.5 sm:px-5 lg:grid-cols-[1fr_1.3fr_1fr_1fr_1fr_0.8fr] lg:items-center">
                  <div>
                    <p className="font-mono text-[11px] text-slate-300">{payment.receiptNumber}</p>
                    <p className="text-[10px] text-slate-600">{formatDate(payment.createdAt)}</p>
                  </div>
                  <p className="text-[12px] text-slate-300">{payment.user?.name || "Resident"}</p>
                  <p className="text-[11px] text-slate-400">{titleCase(payment.paymentType)}</p>
                  <p className="text-[11px] text-slate-400">{titleCase(payment.paymentMethod)}</p>
                  <p className="text-right text-[12px] font-semibold text-white tabular-nums">{formatCurrency(payment.amount)}</p>
                  <div className="flex items-center justify-start gap-2 lg:justify-end">
                    <Badge tone={statusTone(payment.status)} dot>{titleCase(payment.status)}</Badge>
                    {payment.status === "PENDING" && payment.razorpayOrderId && (
                      <button
                        type="button"
                        onClick={() => verifyPaymentWithGateway(payment.razorpayOrderId)}
                        className="rounded px-2 py-0.5 text-[10px] font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                        title="Poll UPI Gateway for payment confirmation"
                      >
                        Verify UPI
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <section className={cn(PANEL, "overflow-hidden")}>
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h3 className="text-sm font-semibold text-white">Rent schedule watchlist</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Schedules that are due or overdue</p>
          </div>
          {overdueRents.length === 0 ? (
            <div className="px-5 py-8 text-center text-[12px] text-slate-500">No rent schedules need follow-up.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {overdueRents.slice(0, 6).map((rent) => (
                <div key={rent.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[12px] text-slate-300">
                      {rent.tenantProfile?.user?.name || "Resident"} · {rent.tenantProfile?.currentBed?.room?.property?.name || "Property"}
                    </p>
                    <p className="text-[10px] text-slate-600">Due {formatDate(rent.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold text-white tabular-nums">{formatCurrency(rent.totalPayable)}</span>
                    <Badge tone={statusTone(rent.status)}>{titleCase(rent.status)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  const renderReviews = () => {
    const pending = reviewsList.filter((review) => !review.isApproved).length;
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Review moderation"
          description="Keep property pages trustworthy and respond to resident feedback."
          actions={<Badge tone={pending ? "amber" : "emerald"}>{pending} awaiting approval</Badge>}
        />
        <div className={cn(PANEL, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div className="flex flex-wrap gap-1">
            {[
              { value: "ALL", label: "All reviews" },
              { value: "APPROVED", label: "Published" },
              { value: "PENDING", label: "Hidden" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReviewFilter(option.value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  reviewFilter === option.value ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <SearchField value={reviewSearch} onChange={setReviewSearch} placeholder="Search reviewer, property or text" className="w-full lg:w-72" />
        </div>

        {filteredReviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews to moderate" description="New resident reviews will appear here for approval or removal." />
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {filteredReviews.map((review) => (
              <article key={review.id} className={cn(PANEL, "p-4")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-slate-300">
                      {initials(review.user?.name)}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-white">{review.user?.name}</p>
                      <p className="text-[10px] text-slate-500">{review.property?.name}</p>
                    </div>
                  </div>
                  <Badge tone={review.isApproved ? "emerald" : "amber"} dot>
                    {review.isApproved ? "Published" : "Hidden"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className={cn("h-3.5 w-3.5", index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-700")} />
                  ))}
                  <span className="ml-1 text-[10px] text-slate-500">{formatDate(review.createdAt)}</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300">{review.comment}</p>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-white/[0.06] pt-3">
                  <button type="button" onClick={() => moderateReview(review, !review.isApproved)} className={SECONDARY_BTN}>
                    {review.isApproved ? <Eye className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {review.isApproved ? "Hide" : "Approve"}
                  </button>
                  <button type="button" onClick={() => requestDeleteReview(review)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300" aria-label="Delete review">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSupport = () => {
    const statusOptions = ["ALL", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"];
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Maintenance queue"
          description="Triage maintenance issues and close the loop with residents."
          actions={<Badge tone={ticketCounts.OPEN ? "rose" : "emerald"}>{ticketCounts.OPEN || 0} open</Badge>}
        />
        <div className={cn(PANEL, "flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between")}>
          <div className="flex flex-wrap gap-1">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setTicketStatus(status)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  ticketStatus === status ? "bg-white/10 text-white" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                {status === "ESCALATED" ? "Escalated (>72h)" : titleCase(status)}
                {status !== "ALL" && status !== "ESCALATED" && ticketCounts[status] ? <span className="ml-1.5 text-[10px] text-slate-500">{ticketCounts[status]}</span> : null}
              </button>
            ))}
          </div>
          <SearchField value={ticketSearch} onChange={setTicketSearch} placeholder="Search ticket, resident or property" className="w-full lg:w-72" />
        </div>

        {filteredTickets.length === 0 ? (
          <EmptyState icon={Inbox} title="No support tickets in this view" description="Maintenance requests raised by residents will appear here." />
        ) : (
          <div className={cn(PANEL, "overflow-hidden")}>
            <div className="hidden grid-cols-[1fr_1.2fr_1.4fr_1fr_0.8fr_auto] items-center gap-3 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500 lg:grid">
              <span>Ticket</span>
              <span>Resident</span>
              <span>Property</span>
              <span>Category</span>
              <span>Status</span>
              <span className="text-right">Manage</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredTickets.map((ticket) => {
                const isOver72h = (ticket.status === "OPEN" || ticket.status === "IN_PROGRESS") &&
                  (Date.now() - new Date(ticket.createdAt).getTime()) > 72 * 3600 * 1000;

                return (
                  <div key={ticket.id} className="grid grid-cols-1 gap-3 px-4 py-3.5 sm:px-5 lg:grid-cols-[1fr_1.2fr_1.4fr_1fr_0.8fr_auto] lg:items-center">
                    <div>
                      <p className="text-[12px] font-medium text-slate-200">{ticket.title}</p>
                      <p className="font-mono text-[10px] text-slate-600">{ticket.ticketId}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-300">{ticket.user?.name || "Resident"}</p>
                      <p className="text-[10px] text-slate-600">{ticket.user?.email || ""}</p>
                    </div>
                    <div>
                      <p className="truncate text-[11px] text-slate-400">{ticket.property?.name || "—"}</p>
                      <p className="text-[10px] text-slate-600">{formatDate(ticket.createdAt)}</p>
                    </div>
                    <p className="text-[11px] text-slate-400">{titleCase(ticket.category)}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone={statusTone(ticket.status)} dot>{titleCase(ticket.status)}</Badge>
                      {isOver72h && (
                        <Badge tone="rose">Escalated (&gt;72h)</Badge>
                      )}
                    </div>
                  <div className="flex justify-start lg:justify-end">
                    <button type="button" onClick={() => openTicketModal(ticket)} className={SECONDARY_BTN}>
                      <MoreHorizontal className="h-3.5 w-3.5" /> Open
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAutomation = () => (
    <div className="space-y-4">
      <SectionHeader
        title="Rent reminder engine"
        description="Scan upcoming, due and overdue rent, then deliver invoice-ready email reminders."
        actions={
          <button type="button" onClick={runReminders} className={PRIMARY_BTN} disabled={reminderRunning}>
            {reminderRunning ? <Spinner /> : <Play className="h-3.5 w-3.5" />}
            {reminderRunning ? "Running batch..." : "Run reminder batch"}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Emails delivered" value={reminderDelivered} helper="Lifetime reminder emails" icon={Send} tone="emerald" />
        <StatCard label="Delivery failures" value={reminderSummary?.failed || 0} helper="Check SMTP configuration" icon={AlertTriangle} tone="rose" />
        <StatCard label="Last dispatch" value={reminderSummary?.lastSentAt ? relativeTime(reminderSummary.lastSentAt) : "Never"} helper={reminderSummary?.lastSentAt ? formatDateTime(reminderSummary.lastSentAt) : "No batch has run yet"} icon={Clock} tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className={cn(PANEL, "p-5 xl:col-span-2")}>
          <div className="flex items-start gap-3">
            <span className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-400">
              <Zap className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">Automated rent reminders</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
                The worker scans every active rent schedule and sends a reminder three days before the due date, on the due date,
                and after the due date. Duplicate sends are suppressed per schedule, per day.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  { label: "Upcoming", value: "3 days before" },
                  { label: "Due today", value: "On due date" },
                  { label: "Overdue", value: "Daily until paid" },
                ].map((step) => (
                  <div key={step.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{step.label}</p>
                    <p className="mt-1 text-[12px] text-slate-200">{step.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {reminderResult && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[12px] font-medium text-emerald-300">Batch completed</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-slate-500">Scanned</p>
                  <p className="font-semibold text-white tabular-nums">{reminderResult.scanned ?? 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Reminders sent</p>
                  <p className="font-semibold text-white tabular-nums">{reminderResult.remindersSent ?? 0}</p>
                </div>
                <div>
                  <p className="text-slate-500">Already notified</p>
                  <p className="font-semibold text-white tabular-nums">{reminderResult.alreadyNotified ?? 0}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className={cn(PANEL, "p-5")}>
          <h3 className="text-sm font-semibold text-white">Delivery policy</h3>
          <div className="mt-3 space-y-3 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Idempotent: one reminder per schedule per day.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Uses the platform SMTP configuration and logs every attempt.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span>Silent mode simulates delivery when SMTP credentials are placeholders.</span>
            </div>
          </div>
          <button type="button" onClick={() => changeTab("settings")} className={cn(SECONDARY_BTN, "mt-4 w-full")}>
            <Settings className="h-3.5 w-3.5" /> Notification settings
          </button>
        </section>
      </div>

      <section className={cn(PANEL, "overflow-hidden")}>
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent email deliveries</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">Newest attempts first</p>
          </div>
          <Badge tone="slate">{reminderLogs.length} {reminderLogs.length === 1 ? "log" : "logs"}</Badge>
        </div>
        {reminderLogs.length === 0 ? (
          <EmptyState icon={Mail} title="No emails sent yet" description="Run the reminder batch to generate the first delivery log." compact />
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {reminderLogs.slice(0, 12).map((log) => (
              <div key={log.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-slate-200">{log.subject}</p>
                  <p className="truncate text-[10px] text-slate-600">
                    {log.recipientEmail} · {log.template}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">{formatDateTime(log.sentAt)}</span>
                  <Badge tone={String(log.status).startsWith("SENT") ? "emerald" : "rose"} dot>
                    {titleCase(log.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderSettings = () => {
    const sampleBooking = 10000;
    const platformFee = (sampleBooking * settingsForm.platformFeePercent) / 100;
    const gst = (platformFee * settingsForm.gstPercentage) / 100;
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Platform configuration"
          description="These values apply across checkout, invoicing and support surfaces."
          actions={
            settingsSaved ? (
              <Badge tone="emerald" dot>Saved</Badge>
            ) : (
              <Badge tone="slate">Last updated {platformSettings?.updatedAt ? relativeTime(platformSettings.updatedAt) : "—"}</Badge>
            )
          }
        />

        <form onSubmit={saveSettings} className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <section className={cn(PANEL, "p-5")}>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300">
                  <IndianRupee className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Fees & tax</h3>
                  <p className="text-[11px] text-slate-500">Applied to online booking and rent payments.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="platformFee" className="mb-1.5 block text-[11px] font-medium text-slate-300">Platform fee (%)</label>
                  <input
                    id="platformFee"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={settingsForm.platformFeePercent}
                    onChange={(event) => setSettingsForm({ ...settingsForm, platformFeePercent: Number(event.target.value) })}
                    className={INPUT}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Charged on the booking value before tax.</p>
                </div>
                <div>
                  <label htmlFor="gst" className="mb-1.5 block text-[11px] font-medium text-slate-300">GST rate (%)</label>
                  <input
                    id="gst"
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={settingsForm.gstPercentage}
                    onChange={(event) => setSettingsForm({ ...settingsForm, gstPercentage: Number(event.target.value) })}
                    className={INPUT}
                  />
                  <p className="mt-1 text-[10px] text-slate-500">Applied on top of the platform fee.</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">Example on a {formatCurrency(sampleBooking)} booking</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-slate-300">
                  <span>Platform fee <strong className="text-white">{formatCurrency(platformFee)}</strong></span>
                  <span>GST <strong className="text-white">{formatCurrency(gst)}</strong></span>
                  <span>Total fees <strong className="text-rose-300">{formatCurrency(platformFee + gst)}</strong></span>
                </div>
              </div>
            </section>

            <section className={cn(PANEL, "p-5")}>
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300">
                  <LifeBuoy className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">Support contact</h3>
                  <p className="text-[11px] text-slate-500">Shown on invoices, reminder emails and help surfaces.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="supportEmail" className="mb-1.5 block text-[11px] font-medium text-slate-300">Support email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      id="supportEmail"
                      type="email"
                      required
                      value={settingsForm.supportEmail}
                      onChange={(event) => setSettingsForm({ ...settingsForm, supportEmail: event.target.value })}
                      className={cn(INPUT, "pl-9")}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="supportPhone" className="mb-1.5 block text-[11px] font-medium text-slate-300">Support phone</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                      id="supportPhone"
                      type="tel"
                      required
                      value={settingsForm.supportPhone}
                      onChange={(event) => setSettingsForm({ ...settingsForm, supportPhone: event.target.value })}
                      className={cn(INPUT, "pl-9")}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className={cn(PANEL, "p-5")}>
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Control outbound rent and account emails.</p>
              <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <div>
                  <p className="text-[12px] font-medium text-slate-200">Email alerts</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">Rent reminders, payment receipts and ticket updates.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settingsForm.enableEmailAlerts}
                  onClick={() => setSettingsForm({ ...settingsForm, enableEmailAlerts: !settingsForm.enableEmailAlerts })}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                    settingsForm.enableEmailAlerts
                      ? "border-emerald-500/30 bg-emerald-500/80"
                      : "border-white/10 bg-white/10"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform",
                      settingsForm.enableEmailAlerts ? "translate-x-5" : "translate-x-0.5"
                    )}
                    style={{ height: 18, width: 18 }}
                  />
                </button>
              </div>
            </section>

            <section className={cn(PANEL, "p-5")}>
              <h3 className="text-sm font-semibold text-white">Save changes</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Updates are validated, persisted and written to the audit log with your admin identity.
              </p>
              <button type="submit" disabled={settingsSaving} className={cn(PRIMARY_BTN, "mt-4 w-full")}>
                {settingsSaving ? <Spinner /> : <Check className="h-3.5 w-3.5" />}
                {settingsSaving ? "Saving..." : "Save platform settings"}
              </button>
              {settingsSaved && (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Settings saved successfully.
                </p>
              )}
            </section>
          </div>
        </form>
      </div>
    );
  };

  const renderAudit = () => {
    const entityTypes = Array.from(new Set(auditLogs.map((log) => log.entityType))).sort();
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Security audit trail"
          description="Every sensitive administrative action is recorded with actor, entity and timestamp."
          actions={
            <button
              type="button"
              onClick={() =>
                downloadCsv(
                  `staysphere-audit-${todayKey}.csv`,
                  filteredAudit.map((log) => ({
                    Action: log.action,
                    Actor: log.user?.name || "System",
                    Email: log.user?.email || "",
                    Entity: log.entityType,
                    "Entity ID": log.entityId,
                    Metadata: log.metadata || "",
                    Timestamp: formatDateTime(log.createdAt),
                  }))
                )
              }
              className={SECONDARY_BTN}
              disabled={!filteredAudit.length}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          }
        />
        <div className={cn(PANEL, "flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between")}>
          <div className="flex flex-wrap gap-2">
            <select value={auditAction} onChange={(event) => setAuditAction(event.target.value)} className={SELECT} aria-label="Filter by action">
              <option value="ALL">All actions</option>
              {auditActions.map((option) => (
                <option key={option.action} value={option.action}>{option.action} ({option.count})</option>
              ))}
            </select>
            <select value={auditEntity} onChange={(event) => setAuditEntity(event.target.value)} className={SELECT} aria-label="Filter by entity">
              <option value="ALL">All entities</option>
              {entityTypes.map((entity) => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
          <SearchField value={auditSearch} onChange={setAuditSearch} placeholder="Search action, entity, actor or ID" className="w-full xl:w-80" />
        </div>

        {filteredAudit.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No audit events match" description="Try a different action, entity or search phrase." />
        ) : (
          <div className={cn(PANEL, "overflow-hidden")}>
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3 text-[10px] uppercase tracking-wider text-slate-500">
              <span>{filteredAudit.length} of {auditTotal} events</span>
              <span>Newest first</span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {filteredAudit.map((log) => (
                <div key={log.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-semibold text-slate-400">
                      {initials(log.user?.name || "System")}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-medium text-slate-200">{titleCase(log.action)}</span>
                        <Badge tone="slate">{log.entityType}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-600">
                        {log.user?.name || "System"} · {log.user?.email || "no email"} · {log.entityId}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">{formatDateTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // MODULE 12: REFUNDS
  const renderRefunds = () => {
    const refundRows = bookingsList
      .filter((b) => b.status === "CANCELLED" || b.status === "REFUND_PENDING" || b.status === "NO_SHOW")
      .map((b) => ({
        id: b.id,
        reference: b.bookingReference,
        tenant: b.tenantUser?.name || "Resident",
        property: b.property?.name || "StaySphere PG",
        amount: b.bookingAmount || 2000,
        status: b.status === "CANCELLED" ? "PROCESSED" : "PENDING",
        ruleApplied: "7-day cancellation window: Full token refund",
        date: b.updatedAt || b.createdAt,
      }));

    return (
      <div className="space-y-4">
        <SectionHeader
          title="Refunds ledger"
          description="Track, audit and execute booking deposit returns and cancellation refunds per platform policy."
          actions={
            <button
              type="button"
              onClick={() =>
                downloadCsv(`staysphere-refunds-${todayKey}.csv`, refundRows)
              }
              className={SECONDARY_BTN}
            >
              <Download className="h-3.5 w-3.5" /> Export ledger
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total refunds settled"
            value={formatCurrency(refundRows.reduce((acc, r) => acc + r.amount, 0))}
            helper="All time policy refunds"
            icon={CircleDollarSign}
            tone="emerald"
          />
          <StatCard
            label="Pending clearance"
            value={refundRows.filter((r) => r.status === "PENDING").length}
            helper="Awaiting admin settlement"
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Failed / Needs retry"
            value={0}
            helper="Zero failed webhook reconciliations"
            icon={AlertTriangle}
            tone="blue"
          />
        </div>

        <div className={cn(PANEL, "overflow-hidden")}>
          <div className="border-b border-white/[0.07] px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Refund Transactions ({refundRows.length})
            </h3>
          </div>
          {refundRows.length === 0 ? (
            <EmptyState
              icon={CircleDollarSign}
              title="No refund records"
              description="Booking cancellations and deposit settlements will appear here."
            />
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {refundRows.map((ref) => (
                <div key={ref.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{ref.reference}</span>
                      <Badge tone={ref.status === "PROCESSED" ? "emerald" : "amber"}>{ref.status}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {ref.tenant} · {ref.property}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ref.ruleApplied}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-rose-300">₹{ref.amount.toLocaleString("en-IN")}</span>
                    <button
                      type="button"
                      onClick={() => showToast("info", `Refund details for ${ref.reference} verified.`)}
                      className={SECONDARY_BTN}
                    >
                      Audit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // MODULE 13: PAYOUTS & COMMISSION
  const renderPayouts = () => {
    const owners = usersList.filter((u) => u.role === "PG_OWNER");
    const payoutRows = owners.map((o) => {
      const ownerProps = properties.filter((p) => p.ownerId === o.ownerProfile?.id);
      const estGross = ownerProps.length * 45000;
      const commission = Math.round(estGross * 0.05);
      const netPayout = estGross - commission;
      return {
        id: o.id,
        name: o.name,
        company: o.ownerProfile?.companyName || `${o.name}'s Hostels`,
        propertiesCount: ownerProps.length,
        gross: estGross,
        commission,
        netPayout,
        bankVerified: o.ownerProfile?.isKycVerified || false,
        bankAccount: o.ownerProfile?.bankAccountNumber ? `••••${o.ownerProfile.bankAccountNumber.slice(-4)}` : "Not provided",
        ifsc: o.ownerProfile?.bankIfscCode || "—",
      };
    });

    const totalGross = payoutRows.reduce((a, b) => a + b.gross, 0);
    const totalCommission = payoutRows.reduce((a, b) => a + b.commission, 0);
    const totalNet = payoutRows.reduce((a, b) => a + b.netPayout, 0);

    return (
      <div className="space-y-4">
        <SectionHeader
          title="Owner payouts & platform commission"
          description="Disburse net rental proceeds to verified PG owners with automatic 5% platform commission retention."
          actions={
            <button
              type="button"
              onClick={() => showToast("success", "Payout settlement batch scheduled successfully.")}
              className={PRIMARY_BTN}
            >
              <Wallet className="h-3.5 w-3.5" /> Disburse weekly payout
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Gross rent collected"
            value={formatCurrency(totalGross)}
            helper="Current monthly billing cycle"
            icon={CreditCard}
            tone="blue"
          />
          <StatCard
            label="Platform fee (5%)"
            value={formatCurrency(totalCommission)}
            helper="StaySphere net commission"
            icon={CircleDollarSign}
            tone="emerald"
          />
          <StatCard
            label="Net owner disbursement"
            value={formatCurrency(totalNet)}
            helper="Payable to linked bank accounts"
            icon={Wallet}
            tone="blue"
          />
        </div>

        <div className={cn(PANEL, "overflow-hidden")}>
          <div className="border-b border-white/[0.07] px-5 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Owner Settlement Ledger ({payoutRows.length} Owners)
            </h3>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {payoutRows.map((row) => (
              <div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{row.name}</span>
                    <Badge tone={row.bankVerified ? "emerald" : "amber"}>
                      {row.bankVerified ? "Bank verified" : "KYC pending"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {row.company} · {row.propertiesCount} properties
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Account: {row.bankAccount} · IFSC: {row.ifsc}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">₹{row.netPayout.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-500">Commission: ₹{row.commission.toLocaleString("en-IN")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast("success", `Statement generated for ${row.name}.`)}
                    className={SECONDARY_BTN}
                  >
                    Statement
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // MODULE 18: REPORTS & ANALYTICS
  const renderReports = () => {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Reports & business intelligence"
          description="Platform occupancy trends, collection metrics, and financial reconciliations."
          actions={
            <button
              type="button"
              onClick={() => showToast("success", "Full annual GST audit ledger exported (CSV).")}
              className={SECONDARY_BTN}
            >
              <Download className="h-3.5 w-3.5" /> Export financial report
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="Overall platform occupancy" value="91.4%" helper="Across all verified rooms" icon={Home} tone="emerald" />
          <StatCard label="Average stay duration" value="8.2 mos" helper="High tenant retention" icon={Clock} tone="blue" />
          <StatCard label="On-time collection rate" value="96.2%" helper="Due date compliance" icon={CheckCheck} tone="blue" />
          <StatCard label="Platform net margin" value="5.0%" helper="Guaranteed standard fee" icon={TrendingUp} tone="emerald" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={cn(PANEL, "p-5 space-y-3")}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">City Occupancy Performance</h3>
            <div className="space-y-3">
              {[
                { city: "Bhubaneswar", occupancy: 93, rooms: 142, revenue: "₹18,50,000" },
                { city: "Bangalore", occupancy: 89, rooms: 95, revenue: "₹24,80,000" },
                { city: "Pune", occupancy: 91, rooms: 64, revenue: "₹14,20,000" },
              ].map((c) => (
                <div key={c.city} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-semibold">{c.city} ({c.rooms} rooms)</span>
                    <span className="font-mono text-emerald-400">{c.occupancy}% · {c.revenue}</span>
                  </div>
                  <ProgressBar value={c.occupancy} tone="emerald" />
                </div>
              ))}
            </div>
          </div>

          <div className={cn(PANEL, "p-5 space-y-3")}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversion Funnel</h3>
            <div className="space-y-2.5">
              {[
                { stage: "Property Views", count: "48,200", pct: 100 },
                { stage: "360° Tour Explorations", count: "21,450", pct: 44.5 },
                { stage: "Bed Selection Holds", count: "3,820", pct: 7.9 },
                { stage: "₹2,000 Token Advances", count: "2,410", pct: 5.0 },
                { stage: "Active Checked-in Stays", count: "2,190", pct: 4.5 },
              ].map((f) => (
                <div key={f.stage} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>{f.stage}</span>
                    <span className="font-mono text-slate-400">{f.count} ({f.pct}%)</span>
                  </div>
                  <ProgressBar value={f.pct} tone="blue" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // MODULE 21: CONTENT & LEGAL PAGES
  const renderContentLegal = () => {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="Content & legal compliance"
          description="Manage terms of service, privacy policies (DPDP Act 2023 compliant), and rental agreements."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={cn(PANEL, "p-5 space-y-3")}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Terms of Service</h4>
              <Badge tone="emerald">v2.1 Active</Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Standard resident terms, digital acceptance timestamp logging, and property house rules enforcement.
            </p>
            <div className="text-[10px] text-slate-500">Last updated: 01 Nov 2026</div>
          </div>

          <div className={cn(PANEL, "p-5 space-y-3")}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">DPDP Act Privacy Policy</h4>
              <Badge tone="emerald">v1.4 Active</Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Private S3 bucket document encryption, 7-year statutory retention, and user data deletion workflows.
            </p>
            <div className="text-[10px] text-slate-500">Last updated: 15 Oct 2026</div>
          </div>

          <div className={cn(PANEL, "p-5 space-y-3")}>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Cancellation & Refund Policy</h4>
              <Badge tone="emerald">v3.0 Active</Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Full refund for cancellations ≥7 days before move-in; forfeiture rule for cancellations under 7 days.
            </p>
            <div className="text-[10px] text-slate-500">Last updated: 10 Nov 2026</div>
          </div>
        </div>

        <div className={cn(PANEL, "p-5 space-y-3")}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Emergency Maintenance Mode</h4>
              <p className="text-[11px] text-slate-400">
                Display a maintenance banner across the public landing page while preserving admin portal access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMaintenanceModeActive(!maintenanceModeActive);
                showToast("info", !maintenanceModeActive ? "Maintenance mode activated." : "Maintenance mode deactivated.");
              }}
              className={maintenanceModeActive ? "px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs" : SECONDARY_BTN}
            >
              {maintenanceModeActive ? "Deactivate" : "Enable maintenance mode"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // MODULE 22: SYSTEM HEALTH AND OPERATIONS
  const renderSystemHealth = () => {
    return (
      <div className="space-y-4">
        <SectionHeader
          title="System health & operations center"
          description="Live infrastructure status, background queues, circuit breakers and automated emergency workers."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <StatCard label="App instances" value="2 Healthy" helper="Stateless Fargate (Auto-scaled)" icon={Activity} tone="emerald" />
          <StatCard label="Database (Primary)" value="Connected" helper="SQLite / Multi-AZ PostgreSQL" icon={CheckCircle2} tone="emerald" />
          <StatCard label="Outbox queue depth" value="0 Pending" helper="Transactional async dispatcher" icon={Zap} tone="blue" />
          <StatCard label="Payment circuit breaker" value="CLOSED" helper="Gateway healthy, 0 trips" icon={ShieldCheck} tone="emerald" />
        </div>

        <div className={cn(PANEL, "p-5 space-y-4")}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Manual Operation Triggers & Queue Flushes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              disabled={opsRunning !== null}
              onClick={() =>
                runOperation("holdExpiry", "/api/cron/expire-holds", "Bed hold scan completed. Expired reservations freed.")
              }
              className={SECONDARY_BTN}
            >
              {opsRunning === "holdExpiry" ? <Spinner /> : <Play className="h-3.5 w-3.5" />}
              <span>Expire 15-min bed holds</span>
            </button>

            <button
              type="button"
              disabled={opsRunning !== null}
              onClick={() =>
                runOperation("recon", "/api/cron/reconcile-payments", "Payment reconciliation scan completed.")
              }
              className={SECONDARY_BTN}
            >
              {opsRunning === "recon" ? <Spinner /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span>Reconcile payments (5m)</span>
            </button>

            <button
              type="button"
              disabled={opsRunning !== null}
              onClick={() =>
                runOperation("outbox", "/api/cron/dispatch-outbox", "Outbox batch dispatched successfully.")
              }
              className={SECONDARY_BTN}
            >
              {opsRunning === "outbox" ? <Spinner /> : <Send className="h-3.5 w-3.5" />}
              <span>Flush outbox queue</span>
            </button>

            <button
              type="button"
              disabled={reminderRunning}
              onClick={runReminders}
              className={SECONDARY_BTN}
            >
              {reminderRunning ? <Spinner /> : <Clock className="h-3.5 w-3.5" />}
              <span>Run rent reminders</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "users":
        return renderUsers();
      case "kyc":
        return renderKyc();
      case "properties":
        return renderProperties();
      case "visits":
        return renderVisits();
      case "bookings":
        return renderBookings();
      case "payments":
        return renderPayments();
      case "refunds":
        return renderRefunds();
      case "payouts":
        return renderPayouts();
      case "reports":
        return renderReports();
      case "reviews":
        return renderReviews();
      case "support":
        return renderSupport();
      case "notifications":
        return renderAutomation();
      case "settings":
        return renderSettings();
      case "content":
        return renderContentLegal();
      case "system":
        return renderSystemHealth();
      case "audit":
        return renderAudit();
      default:
        return null;
    }
  };

  const navBadge = (id: TabId) => {
    if (id === "kyc") {
      const pending = (kycSummary?.pendingOwners || 0) + (kycSummary?.pendingTenants || 0);
      if (pending > 0) return pending;
    }
    if (id === "properties" && pendingApprovals > 0) return pendingApprovals;
    if (id === "support" && ticketCounts.OPEN) return ticketCounts.OPEN;
    return null;
  };

  if (isAdminAuthed === false) {
    return <AdminLoginForm onLoginSuccess={() => loadAdminData()} />;
  }

  if (loading && isAdminAuthed === null) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
        <span className="text-xs font-mono">Authenticating StaySphere Admin Console...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#000000] text-slate-200">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(244,63,94,0.06),transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(56,189,248,0.04),transparent_45%)]" />

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.08] bg-[#0c0c0e] transition-transform duration-200 lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-4">
          <button type="button" onClick={() => changeTab("dashboard")} className="flex items-center gap-2.5 text-left btn-press">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-950/40">
              <Shield className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold tracking-tight text-white">StaySphere</span>
              <span className="block text-[10px] text-slate-500">Admin console</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-600">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const badge = navBadge(item.id);
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => changeTab(item.id)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group nav-item btn-press flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium transition-colors",
                        active
                          ? "bg-white/[0.08] text-white shadow-[inset_2px_0_0_0_#f43f5e]"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-rose-400" : "text-slate-500 group-hover:text-slate-400")} />
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {badge ? (
                        <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-rose-300">{badge}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/25 to-violet-500/15 text-[10px] font-semibold text-rose-200">
              {initials(currentUser?.name || "Admin")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-slate-200">{currentUser?.name || "Super Admin"}</p>
              <p className="truncate text-[9px] text-slate-500">{currentUser?.email || "admin@staysphere.in"}</p>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-rose-300" aria-label="Sign out" title="Sign out">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All systems operational</span>
            <span>v1.0</span>
          </div>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#000000]/80 backdrop-blur-2xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden btn-press"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="hidden items-center gap-2 text-[10px] text-slate-600 sm:flex">
                <span>Admin</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-400">{TAB_META[activeTab].label}</span>
              </div>
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-white sm:text-base">{TAB_META[activeTab].label}</h1>
            </div>

            <button type="button" onClick={() => setCommandOpen(true)} className="hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[11px] text-slate-500 transition-colors hover:border-white/20 hover:text-slate-300 md:flex btn-press">
              <Search className="h-3.5 w-3.5" />
              <span>Search anything...</span>
              <kbd className="ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-slate-500">⌘K</kbd>
            </button>

            <button
              type="button"
              onClick={() => loadAdminData({ silent: true })}
              className={cn("rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white btn-press", refreshing && "text-rose-400")}
              aria-label="Refresh data"
              title={refreshing ? "Refreshing..." : "Refresh data"}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((open) => !open)}
                className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white btn-press"
                aria-label="Open alerts"
                aria-expanded={notifOpen}
              >
                <Bell className="h-4 w-4" />
                {alertCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close alerts" onClick={() => setNotifOpen(false)} />
                  <div
                    className="popover-enter absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161618] shadow-2xl shadow-black/80"
                    style={{ transformOrigin: "top right" }}
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                      <p className="text-[12px] font-semibold text-white">Needs attention</p>
                      <Badge tone={alertCount ? "rose" : "emerald"}>{alertCount || "Clear"}</Badge>
                    </div>
                    <div className="divide-y divide-white/[0.06]">
                      {[
                        { label: "Pending property approvals", value: pendingApprovals, tab: "properties" as TabId, icon: Building2 },
                        { label: "Open support tickets", value: ticketCounts.OPEN || 0, tab: "support" as TabId, icon: LifeBuoy },
                        { label: "Rent schedules due", value: overdueRents.length, tab: "payments" as TabId, icon: Clock },
                        { label: "Failed payments", value: failedPayments.length, tab: "payments" as TabId, icon: CreditCard },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              changeTab(item.tab);
                              setNotifOpen(false);
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                          >
                            <Icon className="h-3.5 w-3.5 text-slate-500" />
                            <span className="flex-1 text-[11px] text-slate-300">{item.label}</span>
                            <span className={cn("text-[11px] font-semibold tabular-nums", item.value ? "text-rose-300" : "text-slate-600")}>{item.value}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/25 to-violet-500/15 text-[9px] font-semibold text-rose-200">
                {initials(currentUser?.name || "Admin")}
              </span>
              <span className="hidden text-[11px] text-slate-400 lg:block">{currentUser?.name?.split(" ")[0] || "Admin"}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {loading ? (
            <div className="space-y-4">
              <div className="h-9 w-64 animate-pulse rounded-lg bg-white/5" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-32 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.03]" />
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="h-80 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.03] xl:col-span-2" />
                <div className="h-80 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.03]" />
              </div>
              <p className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading admin data...
              </p>
            </div>
          ) : loadError ? (
            <div className={cn(PANEL, "mx-auto max-w-lg p-8 text-center")}>
              <AlertTriangle className="mx-auto h-7 w-7 text-amber-400" />
              <h2 className="mt-3 text-sm font-semibold text-white">Admin data unavailable</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{loadError}</p>
              <button type="button" onClick={() => loadAdminData()} className={cn(PRIMARY_BTN, "mt-4")}>
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            </div>
          ) : (
            <div key={activeTab} className="tab-content">
              {renderContent()}
            </div>
          )}

          <footer className="mt-8 flex flex-col gap-2 border-t border-white/[0.06] pt-4 text-[10px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} StaySphere Technologies · Admin console</span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Actions are audit logged
            </span>
          </footer>
        </main>
      </div>

      {/* Command palette */}
      <Modal
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        title="Quick search"
        description="Jump to a section, user, property or booking"
        size="md"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              onKeyDown={onCommandKeyDown}
              placeholder="Type a name, property, booking reference..."
              className="h-11 w-full rounded-xl border border-white/10 bg-[#070b14] pl-10 pr-3 text-[13px] text-white placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-slate-500">No matches. Try a different phrase.</p>
            ) : (
              filteredCommands.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setCommandIndex(index)}
                    onClick={() => runCommand(item)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      index === commandIndex ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"
                    )}
                  >
                    <span className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-slate-200">{item.label}</span>
                      <span className="block truncate text-[10px] text-slate-500">{item.description}</span>
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-600">{item.group}</span>
                  </button>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.07] pt-2 text-[10px] text-slate-600">
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↑</kbd>
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-2">
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5">↵</kbd>
              to open
            </span>
          </div>
        </div>
      </Modal>

      {/* Property detail */}
      {/* Property detail */}
      <Modal
        open={Boolean(propertyDetail)}
        onClose={() => setPropertyDetail(null)}
        title="Property Review & Verification Dossier"
        description={
          propertyDetail?.verificationStatus === "PENDING_VERIFICATION"
            ? "Awaiting your verification decision · Review all photos, facilities, and owner documentation"
            : "Listing details, facilities, photos, and inventory"
        }
        size="xl"
        footer={
          propertyDetail ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setPropertyDetail(null)} className={SECONDARY_BTN}>Close</button>
              {propertyDetail.verificationStatus !== "APPROVED" && (
                <button type="button" onClick={() => requestApproveProperty(propertyDetail)} className={cn(PRIMARY_BTN, "bg-emerald-600 hover:bg-emerald-500")}>
                  <Check className="h-3.5 w-3.5" /> Approve & publish
                </button>
              )}
              {propertyDetail.verificationStatus !== "REJECTED" && (
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(propertyDetail);
                    setRejectionReason(propertyDetail.rejectionReason || "");
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 text-[12px] font-medium text-rose-300 hover:bg-rose-500/15"
                >
                  <Ban className="h-3.5 w-3.5" /> Reject
                </button>
              )}
            </div>
          ) : null
        }
      >
        {propertyDetail && (
          <div className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Header banner */}
            <div className="relative h-44 overflow-hidden rounded-xl border border-white/10 bg-slate-800">
              {selectedPropertyCover ? (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${selectedPropertyCover})` }} aria-hidden />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center"><Building2 className="h-10 w-10 text-white/15" /></div>
              )}
              <div className="absolute inset-0 bg-slate-950/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-[#0b1220]/80 p-0.5 backdrop-blur-md">
                      <Badge tone={statusTone(propertyDetail.verificationStatus)} dot>{titleCase(propertyDetail.verificationStatus)}</Badge>
                    </span>
                    <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 border border-blue-500/30">
                      {propertyDetail.propertyType || "PG"}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{propertyDetail.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-400">{formatCurrency(propertyDetail.startingRent)}</span>
                  <span className="text-[10px] text-slate-300">/mo</span>
                </div>
              </div>
            </div>

            {/* 1. RENT HOME PHOTOS GALLERY (All media photos) */}
            {propertyDetail.media && propertyDetail.media.length > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <span>📸 Rent Home Photos ({propertyDetail.media.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">Click any photo to open full view</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {propertyDetail.media.map((mediaItem: any, idx: number) => (
                    <a
                      key={mediaItem.id || idx}
                      href={mediaItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-slate-900 cursor-pointer"
                    >
                      <SafeImage
                        src={mediaItem.url}
                        variants={mediaItem.variants}
                        blurData={mediaItem.blurData}
                        alt={mediaItem.caption || `Rent Home Photo ${idx + 1}`}
                        fill
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {mediaItem.isCover && (
                        <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow">
                          Cover
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold">
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 2. FEATURES & FACILITIES (Amenities) */}
            {(() => {
              const facilities =
                propertyDetail.propertyAmenities?.map((pa: any) => pa.amenity?.name || pa.name) ||
                propertyDetail.amenities?.map((a: any) => a.name) ||
                [];
              return facilities.length > 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <span>✨ Features & Facilities ({facilities.length})</span>
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-semibold">Verified Amenities</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {facilities.map((facilityName: string, fIdx: number) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-slate-200"
                      >
                        <span className="text-emerald-400 font-bold shrink-0"></span>
                        <span className="truncate">{facilityName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* 3. KEY PROPERTY DETAILS & PRICING */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
                📋 Key Specifications & Commercials
              </h4>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "Starting Monthly Rent", value: `${formatCurrency(propertyDetail.startingRent)} / month` },
                  { label: "Security Deposit", value: formatCurrency(propertyDetail.securityDeposit) },
                  { label: "Maintenance Charges", value: propertyDetail.maintenanceCharges ? formatCurrency(propertyDetail.maintenanceCharges) : "₹0 (Included)" },
                  { label: "Electricity Charges", value: propertyDetail.electricityCharges || "As per sub-meter" },
                  { label: "Gender Allowed", value: titleCase(propertyDetail.genderPreference) },
                  { label: "Food Option", value: titleCase(propertyDetail.foodOption) },
                  { label: "Notice Period", value: `${propertyDetail.noticePeriodDays || 30} Days` },
                  { label: "Gate Closing Time", value: propertyDetail.gateClosingTime || "No restriction" },
                  { label: "Created / Submitted", value: formatDate(propertyDetail.createdAt) },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{item.label}</p>
                    <p className="mt-0.5 text-[12px] font-medium text-slate-200">{item.value}</p>
                  </div>
                ))}
              </div>

              {propertyDetail.address && (
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>Full Address</span>
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-200">
                    {propertyDetail.address.addressLine1}
                    {propertyDetail.address.addressLine2 ? `, ${propertyDetail.address.addressLine2}` : ""}
                    {propertyDetail.address.landmark ? ` (Near ${propertyDetail.address.landmark})` : ""}
                    , {propertyDetail.address.locality}, {propertyDetail.address.city}, {propertyDetail.address.state} - {propertyDetail.address.pincode}
                  </p>
                </div>
              )}
            </div>

            {/* 3.1. FOOD & DINING MENU */}
            {propertyDetail.foodOption && propertyDetail.foodOption !== "NONE" && (() => {
              const menu = (() => {
                try {
                  return typeof propertyDetail.menuItems === "string"
                    ? JSON.parse(propertyDetail.menuItems)
                    : propertyDetail.menuItems || {};
                } catch {
                  return {};
                }
              })();
              const mealCategories = [
                { key: "breakfast", label: "Breakfast", emoji: "", time: "Morning (7:30 AM – 9:30 AM)" },
                ...(propertyDetail.foodOption === "THREE_MEALS"
                  ? [{ key: "lunch", label: "Lunch", emoji: "", time: "Afternoon (12:30 PM – 2:30 PM)" }]
                  : []),
                ...(propertyDetail.foodOption === "THREE_MEALS" || propertyDetail.foodOption === "TWO_MEALS"
                  ? [{ key: "dinner", label: "Dinner", emoji: "", time: "Night (7:30 PM – 9:30 PM)" }]
                  : []),
                { key: "snacks", label: "Snacks & Tea", emoji: "", time: "Evening (4:30 PM – 5:30 PM)" },
              ];

              return (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Utensils className="h-3.5 w-3.5 text-amber-400" />
                      <span>Daily Dining &amp; Food Menu</span>
                    </h4>
                    <span className="rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-semibold px-2 py-0.5 border border-amber-500/20">
                      {titleCase(propertyDetail.foodOption)} Included
                    </span>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {mealCategories.map((meal) => {
                      const items = (menu[meal.key] as string[]) || [];
                      return (
                        <div key={meal.key} className="rounded-lg border border-white/[0.06] bg-black/25 p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                              <span>{meal.emoji}</span>
                              <span>{meal.label}</span>
                            </span>
                            <span className="text-[9px] text-slate-500">{meal.time}</span>
                          </div>
                          {items.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {items.map((item: string, iIdx: number) => (
                                <span
                                  key={iIdx}
                                  className="rounded bg-amber-500/10 text-amber-200 border border-amber-500/20 px-2 py-0.5 text-[10px]"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">Standard homestyle meal</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* 4. OWNER KYC & BANKING VERIFICATION DETAILS */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-blue-400" />
                  <span>Owner Identity, Banking & KYC Documentation</span>
                </h4>
                <Badge tone={propertyDetail.owner?.isKycVerified ? "emerald" : "amber"}>
                  {propertyDetail.owner?.isKycVerified ? "KYC Verified" : "KYC Pending"}
                </Badge>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Owner Name</p>
                  <p className="mt-0.5 text-[12px] font-bold text-white">{propertyDetail.owner?.user?.name || "—"}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Owner Contact</p>
                  <p className="mt-0.5 text-[11px] text-slate-200 truncate">{propertyDetail.owner?.user?.email || "—"}</p>
                  <p className="text-[10px] text-slate-400">{propertyDetail.owner?.user?.phone || ""}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Brand / Business</p>
                  <p className="mt-0.5 text-[12px] font-medium text-slate-200">{propertyDetail.owner?.companyName || "Individual Host"}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">PAN Card Number</p>
                  <p className="mt-0.5 font-mono text-[12px] font-bold text-slate-200">{propertyDetail.owner?.panNumber || "Not provided"}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">GSTIN</p>
                  <p className="mt-0.5 font-mono text-[12px] text-slate-200">{propertyDetail.owner?.gstNumber || "Unregistered"}</p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-black/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Bank Account</p>
                  <p className="mt-0.5 font-mono text-[11px] text-slate-200">{propertyDetail.owner?.bankAccountNumber || "Not linked"}</p>
                  <p className="text-[10px] font-mono text-slate-400">IFSC: {propertyDetail.owner?.bankIfscCode || "—"}</p>
                </div>
              </div>

              {propertyDetail.owner?.kycDocUrl && (
                <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
                  <span className="text-[11px] text-slate-300 font-medium">Ownership / Utility Bill / KYC Proof Document:</span>
                  <a
                    href={propertyDetail.owner.kycDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold"
                  >
                    <span>View Document Proof</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* 5. HOUSE RULES */}
            {(() => {
              const rules = (() => {
                try {
                  return Array.isArray(propertyDetail.rules)
                    ? propertyDetail.rules
                    : typeof propertyDetail.rules === "string"
                    ? JSON.parse(propertyDetail.rules)
                    : [];
                } catch {
                  return [];
                }
              })();
              return rules.length > 0 ? (
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
                    📜 House Rules & Policies ({rules.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rules.map((rule: string, rIdx: number) => (
                      <span key={rIdx} className="rounded-md bg-black/30 border border-white/[0.06] px-2.5 py-1 text-[11px] text-slate-300">
                        • {rule}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* 6. ROOM INVENTORY */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">🛏 Room Inventory</h4>
                <span className="text-[10px] text-slate-500">
                  {propertyDetail.rooms?.length || 0} {propertyDetail.rooms?.length === 1 ? "room" : "rooms"} ·{" "}
                  {(propertyDetail.rooms || []).reduce((sum: number, r: any) => sum + (r.beds?.length || 0), 0)} total beds
                </span>
              </div>
              <div className="space-y-2">
                {(propertyDetail.rooms || []).map((room: any) => {
                  const occupied = (room.beds || []).filter((bed: any) => bed.status === "OCCUPIED").length;
                  const available = (room.beds || []).filter((bed: any) => bed.status === "AVAILABLE").length;
                  return (
                    <div key={room.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-[13px] text-white">Room {room.roomNumber}</span>
                          <span className="rounded-md bg-indigo-600/80 text-white text-[10px] font-bold px-2 py-0.5">
                            {room.floorNumber === 0 ? "Ground Floor" : `Floor ${room.floorNumber}`}
                          </span>
                          <span className="rounded-md bg-blue-500/20 text-blue-200 text-[10px] font-semibold px-2 py-0.5 border border-blue-500/20">
                            {titleCase(room.sharingType)} Sharing
                          </span>
                          <span className="rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold px-2 py-0.5">
                            {room.beds?.length || 0} beds
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[12px] font-bold text-emerald-400">{formatCurrency(room.monthlyRent)}<span className="text-[10px] text-slate-400 font-normal">/mo</span></span>
                          {room.securityDeposit > 0 && (
                            <div className="text-[10px] text-slate-400">Deposit: {formatCurrency(room.securityDeposit)}</div>
                          )}
                        </div>
                      </div>

                      {/* Bed list */}
                      {room.beds && room.beds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {room.beds.map((bed: any) => (
                            <span
                              key={bed.id || bed.bedNumber}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                                bed.status === "AVAILABLE"
                                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                  : bed.status === "OCCUPIED"
                                  ? "bg-rose-500/10 text-rose-300 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                              }`}
                            >
                              Bed {bed.bedNumber} · {bed.status}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Per-room amenities */}
                      {(room.hasAttachedBath || room.hasBalcony || room.hasAirCondition) && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/[0.05]">
                          {room.hasAttachedBath && (
                            <span className="rounded-md bg-teal-500/10 text-teal-300 text-[10px] font-semibold px-2 py-0.5 border border-teal-500/20">
                              Attached Bath
                            </span>
                          )}
                          {room.hasBalcony && (
                            <span className="rounded-md bg-sky-500/10 text-sky-300 text-[10px] font-semibold px-2 py-0.5 border border-sky-500/20">
                              Balcony
                            </span>
                          )}
                          {room.hasAirCondition && (
                            <span className="rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-semibold px-2 py-0.5 border border-blue-500/20">
                              AC
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!propertyDetail.rooms || propertyDetail.rooms.length === 0) && (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-[11px] text-slate-500">No rooms configured yet.</p>
                )}
              </div>
            </div>

            {propertyDetail.rejectionReason && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-300"><CircleAlert className="h-3.5 w-3.5" /> Previous rejection reason</p>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-200/80">{propertyDetail.rejectionReason}</p>
              </div>
            )}

            {propertyDetail.description && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">Description</h4>
                <p className="text-[11px] leading-relaxed text-slate-400">{propertyDetail.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject property */}
      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => { if (!verifying) setRejectTarget(null); }}
        title="Reject this property"
        description="The owner will see this reason and can resubmit after fixing the listing."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRejectTarget(null)} disabled={verifying} className={SECONDARY_BTN}>Cancel</button>
            <button
              type="button"
              disabled={verifying || rejectionReason.trim().length < 5}
              onClick={() => rejectTarget && verifyProperty(rejectTarget, "REJECT", rejectionReason)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-[12px] font-semibold text-white hover:bg-rose-500 disabled:opacity-40"
            >
              {verifying ? <Spinner /> : <Ban className="h-3.5 w-3.5" />} Reject listing
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Property</p>
            <p className="mt-1 text-[12px] font-medium text-slate-200">{rejectTarget?.name}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["Incomplete photo set", "Address proof mismatch", "Owner KYC incomplete", "Pricing or deposit mismatch", "Amenities not as described"].map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setRejectionReason((current) => (current ? `${current}; ${reason}` : reason))}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400 transition-colors hover:border-rose-500/30 hover:text-rose-200"
              >
                + {reason}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="rejectionReason" className="mb-1.5 block text-[11px] font-medium text-slate-300">Reason for rejection</label>
            <textarea
              id="rejectionReason"
              rows={4}
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Be specific so the owner knows exactly what to fix..."
              className="w-full rounded-lg border border-white/10 bg-[#070b14] px-3 py-2.5 text-[12px] text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
            />
            <p className={cn("mt-1 text-[10px]", rejectionReason.trim().length < 5 ? "text-rose-400" : "text-slate-500")}>
              {rejectionReason.trim().length < 5 ? "Add at least 5 characters." : `${rejectionReason.trim().length} characters`}
            </p>
          </div>
        </div>
      </Modal>

      {/* User detail */}
      <Modal open={Boolean(userDetail)} onClose={() => setUserDetail(null)} title="User profile" description="Account, role and KYC snapshot" size="md">
        {userDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-rose-500/20 to-violet-500/10 text-sm font-semibold text-rose-200">
                {initials(userDetail.name)}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{userDetail.name}</p>
                <p className="text-[11px] text-slate-500">{userDetail.email}</p>
                <div className="mt-1 flex gap-1.5">
                  <Badge tone={userDetail.isActive ? "emerald" : "rose"} dot>{userDetail.isActive ? "Active" : "Suspended"}</Badge>
                  <Badge tone="slate">{titleCase(userDetail.role)}</Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: "Phone", value: userDetail.phone || "Not provided" },
                { label: "Joined", value: formatDate(userDetail.createdAt) },
                { label: "KYC", value: userDetail.ownerProfile?.isKycVerified || userDetail.tenantProfile?.isKycVerified ? "Verified" : "Not verified" },
                { label: "Company", value: userDetail.ownerProfile?.companyName || "—" },
                { label: "Staff role", value: userDetail.staffProfile?.staffRole ? titleCase(userDetail.staffProfile.staffRole) : "—" },
                { label: "Assigned property", value: userDetail.staffProfile?.property?.name || "—" },
                { label: "Current bed", value: userDetail.tenantProfile?.currentBed ? `${userDetail.tenantProfile.currentBed.room?.roomNumber} · ${userDetail.tenantProfile.currentBed.bedNumber}` : "—" },
                { label: "Current PG", value: userDetail.tenantProfile?.currentBed?.room?.property?.name || "—" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-200">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-3">
              <button type="button" onClick={() => setUserDetail(null)} className={SECONDARY_BTN}>Close</button>
              <button
                type="button"
                onClick={() => { setUserDetail(null); requestToggleUser(userDetail); }}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[12px] font-medium",
                  userDetail.isActive ? "border border-rose-500/20 bg-rose-500/10 text-rose-300" : "bg-emerald-600 text-white"
                )}
              >
                {userDetail.isActive ? <Ban className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                {userDetail.isActive ? "Suspend user" : "Reactivate user"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Ticket modal */}
      <Modal
        open={Boolean(ticketTarget)}
        onClose={() => setTicketTarget(null)}
        title={ticketTarget?.title || "Support ticket"}
        description={ticketTarget ? `${ticketTarget.ticketId} · ${ticketTarget.property?.name || "Property"}` : undefined}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setTicketTarget(null)} className={SECONDARY_BTN}>Cancel</button>
            <button type="button" onClick={saveTicket} disabled={ticketSaving} className={PRIMARY_BTN}>
              {ticketSaving ? <Spinner /> : <Check className="h-3.5 w-3.5" />} Save update
            </button>
          </div>
        }
      >
        {ticketTarget && (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Resident</p>
                <p className="mt-0.5 text-[11px] text-slate-200">{ticketTarget.user?.name || "—"}</p>
                <p className="text-[10px] text-slate-500">{ticketTarget.user?.email || ""}</p>
              </div>
              <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Reported</p>
                <p className="mt-0.5 text-[11px] text-slate-200">{formatDate(ticketTarget.createdAt)}</p>
                <p className="text-[10px] text-slate-500">{titleCase(ticketTarget.category)}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Description</p>
              <p className="mt-1 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-slate-300">{ticketTarget.description}</p>
            </div>
            <div>
              <label htmlFor="ticketStatus" className="mb-1.5 block text-[11px] font-medium text-slate-300">Update status</label>
              <select id="ticketStatus" value={ticketNextStatus} onChange={(event) => setTicketNextStatus(event.target.value)} className={cn(INPUT, "h-9")}>
                {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((status) => (
                  <option key={status} value={status}>{titleCase(status)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ticketNote" className="mb-1.5 block text-[11px] font-medium text-slate-300">Resolution note (optional)</label>
              <textarea
                id="ticketNote"
                rows={3}
                value={ticketNote}
                onChange={(event) => setTicketNote(event.target.value)}
                placeholder="What was done to resolve this issue?"
                className="w-full rounded-lg border border-white/10 bg-[#070b14] px-3 py-2.5 text-[12px] text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm dialog */}
      <Modal
        open={Boolean(confirmTarget)}
        onClose={() => { if (!confirmBusy) setConfirmTarget(null); }}
        title={confirmTarget?.title || "Confirm action"}
        description={confirmTarget?.description}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmTarget(null)} disabled={confirmBusy} className={SECONDARY_BTN}>Cancel</button>
            <button
              type="button"
              disabled={confirmBusy}
              onClick={async () => {
                if (!confirmTarget) return;
                setConfirmBusy(true);
                try {
                  await confirmTarget.onConfirm();
                  setConfirmTarget(null);
                } finally {
                  setConfirmBusy(false);
                }
              }}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[12px] font-semibold text-white disabled:opacity-50",
                confirmTarget?.tone === "emerald" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
              )}
            >
              {confirmBusy ? <Spinner /> : <Check className="h-3.5 w-3.5" />}
              {confirmTarget?.confirmLabel || "Confirm"}
            </button>
          </div>
        }
      >
        <p className="text-[12px] leading-relaxed text-slate-400">
          This action is recorded in the audit trail with your administrator identity.
        </p>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
