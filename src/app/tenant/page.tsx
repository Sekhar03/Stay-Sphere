"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, User, Sparkles, Loader2 } from "lucide-react";

function TenantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if tenant is already authenticated
  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            if (data.user.role === "CUSTOMER_TENANT") {
              router.replace(redirect || "/dashboard");
              return;
            } else if (data.user.role === "PG_OWNER") {
              router.replace("/owner/dashboard");
              return;
            } else if (data.user.role === "PG_STAFF") {
              router.replace("/staff/dashboard");
              return;
            } else if (data.user.role === "SUPER_ADMIN") {
              router.replace("/admin");
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
      } else if (data.user.role === "CUSTOMER_TENANT") {
        router.push("/dashboard");
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
      setError(err.message || "Invalid tenant credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTenantLogin = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("StaySphere@2026!");
    setError(null);
  };

  if (checkingAuth) {
    return (
      <div
        className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 text-center space-y-3"
        style={{ animation: "modalIn 260ms var(--ease-out) both" }}
      >
        <Loader2 className="w-6 h-6 border-blue-600 animate-spin mx-auto text-blue-600" />
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
          className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20"
          style={{ animation: "staggerIn 300ms var(--ease-out) 60ms both" }}
        >
          <User className="w-6 h-6" />
        </div>
        <h2
          className="text-2xl font-black text-slate-900 tracking-tight"
          style={{ animation: "staggerIn 300ms var(--ease-out) 100ms both" }}
        >
          Tenant &amp; Resident Login
        </h2>
        <p
          className="text-xs text-slate-500"
          style={{ animation: "staggerIn 300ms var(--ease-out) 130ms both" }}
        >
          Access your bed allocation, rent receipts, electricity split &amp; food menu
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2"
          style={{ animation: "staggerIn 200ms var(--ease-out) both" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenant1@staysphere.in"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/15"
              style={{
                transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out), background-color 150ms var(--ease-out)",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer btn-press"
          style={{
            transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), opacity 150ms ease",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In to Resident Dashboard
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* 1-Click Demo Login */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
          1-Click Demo Tenant Accounts
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickTenantLogin("tenant1@staysphere.in")}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer btn-press"
            style={{
              transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="text-[11px] font-bold text-slate-800">Rahul Sharma</div>
            <div className="text-[10px] text-slate-500 truncate">tenant1@staysphere.in</div>
          </button>
          <button
            type="button"
            onClick={() => handleQuickTenantLogin("tenant2@staysphere.in")}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-left cursor-pointer btn-press"
            style={{
              transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="text-[11px] font-bold text-slate-800">Pooja Patel</div>
            <div className="text-[10px] text-slate-500 truncate">tenant2@staysphere.in</div>
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="pt-2 text-center text-xs text-slate-500">
        New resident?{" "}
        <Link
          href="/register?role=CUSTOMER_TENANT"
          className="font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-colors duration-150"
        >
          Create Tenant Account <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function TenantLoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <Suspense
        fallback={
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        }
      >
        <TenantLoginForm />
      </Suspense>
    </div>
  );
}
