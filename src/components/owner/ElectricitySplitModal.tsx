"use client";

import React, { useState, useEffect } from "react";
import { Zap, X, Loader2, CheckCircle2, AlertCircle, Share2, Users, ArrowRight } from "lucide-react";

interface ElectricitySplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialRoomId?: string;
}

export default function ElectricitySplitModal({
  isOpen,
  onClose,
  onSuccess,
  initialRoomId,
}: ElectricitySplitModalProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || "");

  const [previousReading, setPreviousReading] = useState<number>(1040);
  const [currentReading, setCurrentReading] = useState<number>(1185);
  const [ratePerUnit, setRatePerUnit] = useState<number>(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [splitResult, setSplitResult] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSplitResult(null);
      setError(null);
      return;
    }

    async function loadRooms() {
      setLoadingRooms(true);
      try {
        const res = await fetch("/api/owner/electricity");
        if (res.ok) {
          const data = await res.json();
          setRooms(data.rooms || []);
          if (!selectedRoomId && data.rooms?.length > 0) {
            // Pick first room with occupants if available
            const withOccupants = data.rooms.find((r: any) => r.occupiedBeds > 0);
            setSelectedRoomId(withOccupants?.roomId || data.rooms[0].roomId);
          }
        }
      } catch (e) {
        console.error("Failed to load rooms for electricity", e);
      } finally {
        setLoadingRooms(false);
      }
    }

    loadRooms();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRoom = rooms.find((r) => r.roomId === selectedRoomId);
  const occupantCount = currentRoom?.occupants?.length || 0;
  const netUnits = Math.max(0, currentReading - previousReading);
  const totalRoomBill = Math.round(netUnits * ratePerUnit);
  const perTenantShare = occupantCount > 0 ? Math.round(totalRoomBill / occupantCount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) return setError("Please select a room");
    if (currentReading < previousReading) return setError("Current reading cannot be lower than previous reading");
    if (occupantCount === 0) return setError("This room currently has no active tenants to split the bill with.");

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/owner/electricity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          previousReading,
          currentReading,
          ratePerUnit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to split electricity bill");
      }

      setSplitResult(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to calculate split");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Zap className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Sub-Meter Electricity Split</h3>
              <p className="text-xs text-slate-500">Record reading & split evenly across room occupants</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {splitResult ? (
          /* Success Screen */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-sm font-extrabold text-emerald-950">Bill Calculated & Split Successfully!</div>
              <p className="text-xs text-emerald-800">
                Total Room Bill: <strong>₹{splitResult.totalRoomBill}</strong> ({splitResult.netUnits} units)
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Occupant Share (₹{splitResult.perTenantShare} / resident)
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {splitResult.tenants?.map((t: any, i: number) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{t.tenantName}</div>
                      <div className="text-[10px] text-slate-400">{t.phone || "No phone listed"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">₹{t.shareAmount}</span>
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(
                            `Hi ${t.tenantName}, your Room ${splitResult.roomNumber} electricity sub-meter bill of ₹${t.shareAmount} (${splitResult.netUnits} units split) has been added to your monthly StaySphere ledger.`
                          );
                          window.open(`https://api.whatsapp.com/send?phone=${t.phone || ""}&text=${msg}`, "_blank");
                        }}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                        title="Send WhatsApp notice"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSplitResult(null);
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Room Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Room</label>
              {loadingRooms ? (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading rooms...</span>
                </div>
              ) : (
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-blue-500"
                >
                  {rooms.map((r) => (
                    <option key={r.roomId} value={r.roomId}>
                      Room {r.roomNumber} ({r.propertyName}) — {r.occupiedBeds} / {r.totalBeds} Active Tenants
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Active Occupants Badge */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700">Active Room Occupants:</span>
              </div>
              <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {occupantCount} {occupantCount === 1 ? "Tenant" : "Tenants"}
              </span>
            </div>

            {/* Meter Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Previous Meter Reading</label>
                <input
                  type="number"
                  required
                  value={previousReading}
                  onChange={(e) => setPreviousReading(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Meter Reading</label>
                <input
                  type="number"
                  required
                  value={currentReading}
                  onChange={(e) => setCurrentReading(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-blue-500"
                />
              </div>
            </div>

            {/* Rate Per Unit */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rate per Unit (₹)</label>
              <input
                type="number"
                step="0.5"
                required
                value={ratePerUnit}
                onChange={(e) => setRatePerUnit(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-blue-500"
              />
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                Live Calculation Preview
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div>
                  <div className="text-[10px] text-slate-500">Net Units</div>
                  <div className="font-mono font-black text-sm text-slate-800">{netUnits} kWh</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Total Room Bill</div>
                  <div className="font-mono font-black text-sm text-amber-700">₹{totalRoomBill}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Per Tenant Share</div>
                  <div className="font-mono font-black text-sm text-emerald-700">₹{perTenantShare}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || occupantCount === 0 || netUnits <= 0}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculating & Splitting...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Calculate & Apply Split</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
