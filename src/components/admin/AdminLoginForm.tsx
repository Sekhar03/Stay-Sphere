"use client";

import React, { useState } from "react";
import { ShieldAlert, Lock, Mail, AlertCircle, ArrowRight, KeyRound, Loader2 } from "lucide-react";

interface AdminLoginFormProps {
  onLoginSuccess?: () => void;
}

export default function AdminLoginForm({ onLoginSuccess }: AdminLoginFormProps) {
  const [email, setEmail] = useState("admin@staysphere.in");
  const [password, setPassword] = useState("AdminStaySphere2026!#");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (data.user?.role !== "SUPER_ADMIN") {
        throw new Error("Access restricted: This console is strictly for Super Administrators.");
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || "Invalid administrative credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminQuickLogin = () => {
    setEmail("admin@staysphere.in");
    setPassword("AdminStaySphere2026!#");
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950">
      {/* Card enters with modal-enter animation (centered) */}
      <div
        className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black/50 space-y-6 text-white"
        style={{ animation: "modalIn 260ms var(--ease-out) both" }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto"
            style={{ animation: "staggerIn 300ms var(--ease-out) 60ms both" }}
          >
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2
            className="text-2xl font-extrabold text-white"
            style={{ animation: "staggerIn 300ms var(--ease-out) 100ms both" }}
          >
            Administrative Console
          </h2>
          <p
            className="text-xs text-slate-400"
            style={{ animation: "staggerIn 300ms var(--ease-out) 130ms both" }}
          >
            Platform governance, KYC verification &amp; infrastructure settings
          </p>
        </div>

        {/* Error message — fades in */}
        {error && (
          <div
            className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2"
            style={{ animation: "staggerIn 200ms var(--ease-out) both" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Identity Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@staysphere.in"
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
                style={{
                  transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Master Security Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500"
                style={{
                  transition: "border-color 150ms var(--ease-out), box-shadow 150ms var(--ease-out)",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer btn-press"
            style={{
              transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out), opacity 150ms ease",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating Authority...
              </>
            ) : (
              <>
                Authorize Administrative Session
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* One-Click Fast Login for Super Admin */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleAdminQuickLogin}
            className="w-full p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-800 cursor-pointer flex items-center justify-between btn-press"
            style={{
              transition: "transform 160ms var(--ease-out), background-color 150ms var(--ease-out)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">Fill Super Admin Credentials</div>
                <div className="text-[10px] text-slate-400">admin@staysphere.in</div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-rose-400 uppercase bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-800/60">
              1-Click Demo
            </span>
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          All administrative actions and logins are cryptographically logged to the audit log.
        </p>
      </div>
    </div>
  );
}
