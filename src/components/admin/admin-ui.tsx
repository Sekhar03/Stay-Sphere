"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx, { type ClassValue } from "clsx";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type Tone = "rose" | "emerald" | "amber" | "blue" | "violet" | "slate";

const toneStyles: Record<Tone, { badge: string; icon: string; bar: string; dot: string }> = {
  rose: {
    badge: "border-rose-500/25 bg-rose-500/10 text-rose-300",
    icon: "border-rose-500/20 bg-rose-500/10 text-rose-400",
    bar: "bg-rose-500",
    dot: "bg-rose-400",
  },
  emerald: {
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    bar: "bg-emerald-500",
    dot: "bg-emerald-400",
  },
  amber: {
    badge: "border-amber-500/25 bg-amber-500/10 text-amber-300",
    icon: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    bar: "bg-amber-500",
    dot: "bg-amber-400",
  },
  blue: {
    badge: "border-sky-500/25 bg-sky-500/10 text-sky-300",
    icon: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    bar: "bg-sky-500",
    dot: "bg-sky-400",
  },
  violet: {
    badge: "border-violet-500/25 bg-violet-500/10 text-violet-300",
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    bar: "bg-violet-500",
    dot: "bg-violet-400",
  },
  slate: {
    badge: "border-white/10 bg-white/5 text-slate-300",
    icon: "border-white/10 bg-white/5 text-slate-300",
    bar: "bg-slate-500",
    dot: "bg-slate-400",
  },
};

export function Badge({
  children,
  tone = "slate",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        toneStyles[tone].badge,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", toneStyles[tone].dot)} />}
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "rose",
  trend,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  trend?: { label: string; positive?: boolean };
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#161618] p-5 text-left",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_20px_-2px_rgba(0,0,0,0.5)]",
        onClick && "cursor-pointer btn-press card-interactive hover:border-white/15 hover:bg-[#1c1c1f]"
      )}
      style={{
        transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[12px] font-medium tracking-wide text-slate-400">{label}</span>
        <span
          className={cn("rounded-xl border p-2 transition-transform duration-200", toneStyles[tone].icon)}
          style={{ transitionTimingFunction: "var(--ease-out)" }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {helper && <span className="text-[11px] text-slate-500">{helper}</span>}
        {trend && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              trend.positive === false
                ? "bg-rose-500/10 text-rose-400"
                : "bg-emerald-500/10 text-emerald-400"
            )}
          >
            {trend.label}
          </span>
        )}
      </div>
      {/* Ambient glow on hover */}
      <div
        className={cn(
          "pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full opacity-0 blur-2xl",
          "transition-opacity duration-300 group-hover:opacity-30",
          toneStyles[tone].bar
        )}
      />
    </Component>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-[17px] font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="mt-0.5 text-[12px] text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  className,
  shortcut,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  shortcut?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-white/10 bg-[#0b1220] pl-9 pr-16 text-[12px] text-slate-100 placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-2 focus:ring-rose-500/15"
        style={{
          transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
        }}
      />
      {shortcut ? (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-sans text-[10px] text-slate-500">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] text-center",
        compact ? "px-5 py-10" : "px-6 py-16"
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-slate-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-6"
      style={{ animation: "overlayIn 200ms ease both" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        className={cn(
          "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#161618]/95 backdrop-blur-2xl shadow-2xl shadow-black/80 sm:rounded-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]",
          sizes[size]
        )}
        style={{
          /* Modals keep transform-origin: center — they aren't trigger-anchored */
          animation: "modalIn 220ms var(--ease-out) both",
          transformOrigin: "center",
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {description && <p className="mt-0.5 text-[12px] text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-slate-500 transition-colors duration-150 hover:bg-white/5 hover:text-white btn-press"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-white/[0.07] px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** @deprecated Use Sonner's toast() instead — it's globally available via layout.tsx */
export function Toast({
  toast,
  onDismiss,
}: {
  toast: { type: "success" | "error" | "info"; message: string } | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;
  const palette = {
    success: { icon: CheckCircle2, className: "border-emerald-500/25 text-emerald-300" },
    error: { icon: AlertTriangle, className: "border-rose-500/25 text-rose-300" },
    info: { icon: Info, className: "border-sky-500/25 text-sky-300" },
  };
  const Icon = palette[toast.type].icon;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end"
      style={{ animation: "toastIn 320ms var(--ease-out) both" }}
    >
      <div
        role="status"
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border bg-[#0d1424]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur",
          palette[toast.type].className
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="flex-1 text-[12px] leading-relaxed text-slate-200">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded p-0.5 text-slate-500 hover:text-white transition-colors duration-150 btn-press"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = "emerald" }: { value: number; tone?: Tone }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div
        className={cn("h-full rounded-full progress-fill", toneStyles[tone].bar)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value || 0);
  return `₹${numeric.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatCompactCurrency(value: number | string | null | undefined) {
  const numeric = Number(value || 0);
  if (numeric >= 10000000) return `₹${(numeric / 10000000).toFixed(1)}Cr`;
  if (numeric >= 100000) return `₹${(numeric / 100000).toFixed(1)}L`;
  if (numeric >= 1000) return `₹${(numeric / 1000).toFixed(1)}k`;
  return `₹${Math.round(numeric)}`;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (Math.abs(minutes) < 1) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return `${days}d ago`;
  return formatDate(date);
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const UPPERCASE_TOKENS = new Set(["PG", "KYC", "GST", "UPI", "ID", "SMS", "API", "CSV", "OTP"]);
const WORD_OVERRIDES: Record<string, string> = { COED: "Co-ed" };

export function titleCase(value?: string | null) {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) => {
      if (UPPERCASE_TOKENS.has(word.toUpperCase())) return word.toUpperCase();
      if (WORD_OVERRIDES[word.toUpperCase()]) return WORD_OVERRIDES[word.toUpperCase()];
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function statusTone(status?: string | null): Tone {
  const normalized = (status || "").toUpperCase();
  if (["APPROVED", "SUCCESS", "CONFIRMED", "COMPLETED", "RESOLVED", "PAID", "ACTIVE", "SENT"].includes(normalized)) {
    return "emerald";
  }
  if (["PENDING", "PENDING_VERIFICATION", "AWAITING_PAYMENT", "OPEN", "DUE", "UPCOMING", "IN_PROGRESS", "SCHEDULED", "PROCESSING"].includes(normalized)) {
    return "amber";
  }
  if (["REJECTED", "FAILED", "CANCELLED", "OVERDUE", "SUSPENDED", "NO_SHOW", "REFUND_PENDING"].includes(normalized)) {
    return "rose";
  }
  if (["RESERVED", "DRAFT", "WAIVED", "CLOSED"].includes(normalized)) return "blue";
  return "slate";
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    return /[",\n\r]/.test(text) ? `"${text}"` : text;
  };

  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function readApiError(response: Response, fallback = "Something went wrong. Please try again.") {
  try {
    const data = await response.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}
