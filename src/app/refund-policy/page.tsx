import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function RefundPolicyPage() {
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
          Refund & Cancellation Policy
        </h1>
        <p className="text-xs text-slate-400">Last revised: January 1, 2026 • StaySphere Technologies Pvt Ltd</p>
      </div>

      <div className="space-y-6 text-xs sm:text-sm leading-relaxed bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            1. Token Reservation Advance Refunds
          </h2>
          <p className="text-slate-600">
            Tenants who reserve a bed by paying a token advance (e.g. ₹2,000) are entitled to a 100% full refund if the cancellation request is submitted via the tenant dashboard within 24 hours of booking, provided the scheduled check-in date is at least 72 hours away.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            2. Security Deposit Return
          </h2>
          <p className="text-slate-600">
            Security deposits held during the tenant's stay are refunded in full within 7 business days following move-out inspection, minus any unsettled utility charges, room damage deductions, or failure to serve the contractual notice period (e.g., 30 days).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">
            3. Disputed or Failed UPI Transactions
          </h2>
          <p className="text-slate-600">
            In the event that an amount is debited from your bank account or credit card but the StaySphere booking status shows incomplete or failed, UPI Gateway automated reconciliation will reverse the funds to the original payment method within 3 to 5 banking days.
          </p>
        </section>
      </div>
    </div>
  );
}
