import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-slate-700">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last revised: January 1, 2026 • StaySphere Technologies Pvt Ltd</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            1. Information We Collect
          </h2>
          <p className="text-slate-600">
            We collect personal information necessary to deliver transparent PG discoveries and reservations: your name, contact phone number, email address, government ID verification (when submitting KYC to property owners), and transaction identifiers associated with UPI Gateway payments.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            2. Payment Security
          </h2>
          <p className="text-slate-600">
            StaySphere does not store raw credit card numbers or UPI PINs. All monetary settlements are handled by PCI-DSS Level 1 certified payment gateway partner UPI Gateway via TLS 1.3 cryptographic channels and HMAC-SHA256 signature validation.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            3. Location & Geolocation Data
          </h2>
          <p className="text-slate-600">
            When utilizing the "How far from me?" commute calculator, your browser requests one-time client-side coordinates to calculate driving/walking distances via Google Maps Distance Matrix. Coordinates are never sold or permanently logged to track your physical movements.
          </p>
        </section>
      </div>
    </div>
  );
}
