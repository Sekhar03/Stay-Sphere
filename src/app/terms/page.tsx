import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-slate-700">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Terms and Conditions
        </h1>
        <p className="text-xs text-slate-400">
          Last revised: January 1, 2026 • StaySphere Technologies Pvt Ltd
        </p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            1. Platform Scope & Acceptance
          </h2>
          <p className="text-slate-600">
            StaySphere operates an accommodation discovery and management platform connecting Paying Guest (PG) operators ("Property Owners") with individuals seeking accommodation ("Tenants"). By creating an account, browsing listings, viewing 360° virtual tours, or reserving a bed, you agree to these Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            2. Bed Reservations & Token Deposits
          </h2>
          <p className="text-slate-600">
            When a tenant reserves a bed and pays a token advance via UPI Gateway, the bed is temporarily or definitively held in accordance with the host PG's check-in schedule. Token amounts contribute directly toward the first month's rental and security deposit upon move-in check-in.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            3. Monthly Rent Schedules & Late Charges
          </h2>
          <p className="text-slate-600">
            Monthly rent dues are generated according to the executed lease agreement (commonly the 1st to 5th of each calendar month). Tenants agree to pay on or before the due date. Failure to settle rent on time triggers automated reminder notifications and may incur late penalties defined in the property agreement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            4. Property Rules & Decorum
          </h2>
          <p className="text-slate-600">
            Tenants are expected to observe quiet hours, guest policies, gate timings, and restrictions established by the PG owner. Violations may lead to lease termination and forfeiture of the security deposit in accordance with the signed agreement.
          </p>
        </section>
      </div>
    </div>
  );
}
