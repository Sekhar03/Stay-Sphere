"use client";

import React from "react";
import { ShieldCheck, Info } from "lucide-react";

interface MoveInCostBreakdownProps {
  monthlyRent: number;
  securityDeposit: number;
  tokenAmount?: number;
  sharingType?: string;
  foodIncluded?: boolean;
}

export default function MoveInCostBreakdown({
  monthlyRent,
  securityDeposit,
  tokenAmount = 2000,
  sharingType,
  foodIncluded,
}: MoveInCostBreakdownProps) {
  const remainingAtCheckin = Math.max(0, monthlyRent + securityDeposit - tokenAmount);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-900">
          Transparent Move-in Cost Estimator
        </h4>
        <span className="text-[11px] text-slate-500 font-medium">
          Zero Brokerage
        </span>
      </div>

      <div className="space-y-2 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">1st Month Rent ({sharingType || "Room"})</span>
          <span className="font-medium text-slate-900 tabular-nums">
            ₹{monthlyRent?.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600 flex items-center gap-1">
            Security Deposit (Refundable)
            <span title="100% refundable upon move-out subject to notice period" className="cursor-help">
              <Info className="w-3 h-3 text-slate-400" />
            </span>
          </span>
          <span className="font-medium text-slate-900 tabular-nums">
            ₹{securityDeposit?.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600">Brokerage & Processing Fee</span>
          <span className="font-medium text-emerald-600">₹0 (Free)</span>
        </div>

        <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-semibold text-slate-900">
          <span>Total Move-in Cost</span>
          <span className="text-sm tabular-nums">
            ₹{(monthlyRent + securityDeposit)?.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
        <div className="flex items-center justify-between font-medium">
          <span>Pay Today to Reserve Bed:</span>
          <span className="text-blue-700 font-bold tabular-nums">₹{tokenAmount.toLocaleString("en-IN")}</span>
        </div>
        <p className="text-[11px] text-blue-700 leading-relaxed">
          Balance ₹{remainingAtCheckin.toLocaleString("en-IN")} is paid directly upon physical room possession.
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Refundable security deposit protected under StaySphere resident agreement</span>
      </div>
    </div>
  );
}
