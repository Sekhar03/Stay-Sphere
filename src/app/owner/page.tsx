"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building,
  Loader2,
} from "lucide-react";

function OwnerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if owner or staff is already authenticated
  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            if (data.user.role === "PG_OWNER") {
              router.replace(redirect || "/owner/dashboard");
              return;
            } else if (data.user.role === "PG_STAFF") {
              router.replace(redirect || "/staff/dashboard");
              return;
            } else if (data.user.role === "SUPER_ADMIN") {
              router.replace("/admin");
              return;
            } else if (data.user.role === "CUSTOMER_TENANT") {
              router.replace("/dashboard");
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Session check error:", e);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkCurrentSession();
  }, [router, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (redirect && redirect !== "/") {
        router.push(redirect);
      } else if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else if (data.user.role === "PG_OWNER") {
        router.push("/owner/dashboard");
      } else if (data.user.role === "PG_STAFF") {
        router.push("/staff/dashboard");
      } else if (data.user.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid owner or staff credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("StaySphere@2026!");
    setError(null);
  };

  if (checkingAuth) {
    return (
      <div
        className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 text-center space-y-3"
        style={{ animation: "modalIn 260ms var(--ease-out) both" }}
      >
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
        <p className="text-xs text-slate-500 font-medium">Checking your session...</p>
      </div>
    );
  }

  return (
    <div
      className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 space-y-6"
      style={{ animation: "modalIn 260ms var(--ease-out) both" }}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div
          className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/20"
          style={{ animation: "staggerIn 300ms var(--ease-out) 60ms both" }}
        >
          <Briefcase className="w-6 h-6" />
        </div>
        <h2
          className="text-2xl font-black text-slate-900 tracking-tight"
          style={{ animation: "staggerIn 300ms var(--ease-out) 100ms both" }}
        >
          Owner &amp; Staff Login
        </h2>
        <p
          className="text-xs text-slate-500"
          style={{ animation: "staggerIn 300ms var(--ease-out) 130ms both" }}
        >
          Sign in to manage your properties, staff, tenants, and operations
        </p>
      </div>

      {error && (
        <div
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          style={{ animation: "staggerIn 200ms var(--ease-out) both" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Registered Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@staysphere.in"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
              style={{
                transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out)",
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
              style={{
                transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out)",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer btn-press"
          style={{
            transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), opacity 150ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In to Management Portal
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 1-Click Fast Logins for Owner & Staff */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
          1-Click Demo Accounts
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("owner1@staysphere.in")}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer btn-press"
            style={{
              transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px]">
              <Building className="w-3.5 h-3.5" />
              <span>PG Owner</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">owner1@staysphere.in</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("manager@staysphere.in")}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer btn-press"
            style={{
              transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[11px]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>PG Staff / Manager</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-0.5">manager@staysphere.in</div>
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="pt-2 text-center text-xs text-slate-500">
        New property host?{" "}
        <Link
          href="/register?role=PG_OWNER"
          className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline inline-flex items-center gap-1 transition-colors duration-150"
        >
          Register as PG Owner <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function OwnerLoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <Suspense
        fallback={
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading owner portal...
          </div>
        }
      >
        <OwnerLoginForm />
      </Suspense>
    </div>
  );
}
