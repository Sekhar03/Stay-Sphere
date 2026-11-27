"use client";

import React, { useEffect, useState } from "react";
import { BedStatus, SharingType } from "@/lib/constants";
import { BedDouble, CheckCircle2, Clock, Lock, Wind, Bath, Sun } from "lucide-react";

export interface RoomWithBeds {
  id: string;
  roomNumber: string;
  floorNumber: number;
  sharingType: SharingType;
  monthlyRent: number | string;
  securityDeposit: number | string;
  hasAttachedBath: boolean;
  hasBalcony: boolean;
  hasAirCondition: boolean;
  beds: {
    id: string;
    bedNumber: string;
    status: BedStatus;
  }[];
}

interface BedSelectorProps {
  rooms: RoomWithBeds[];
  selectedRoomId: string | null;
  selectedBedId: string | null;
  onSelectRoom: (roomId: string) => void;
  onSelectBed: (bedId: string) => void;
  /** Optional ISO timestamp when an active bed reservation lock expires */
  holdExpiresAt?: string | null;
}

export default function BedSelector({
  rooms,
  selectedRoomId,
  selectedBedId,
  onSelectRoom,
  onSelectBed,
  holdExpiresAt,
}: BedSelectorProps) {
  const activeRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingSeconds(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const holdLabel = remainingSeconds > 0
    ? `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="space-y-6">
      {/* Room Category Cards */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Step 1: Choose Room Sharing Type & Floor
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rooms.map((room) => {
            const isSelected = room.id === activeRoom?.id;
            const availableBeds = room.beds.filter((b) => b.status === BedStatus.AVAILABLE).length;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  onSelectRoom(room.id);
                  const firstAvailable = room.beds.find((b) => b.status === BedStatus.AVAILABLE);
                  if (firstAvailable) onSelectBed(firstAvailable.id);
                }}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-600/30"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Room {room.roomNumber}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Floor {room.floorNumber}
                  </span>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-bold text-blue-700">
                    {room.sharingType.replace("_", " ")}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                    ₹{Number(room.monthlyRent).toLocaleString("en-IN")}
                    <span className="text-[11px] font-normal text-slate-500"> /month</span>
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span
                    className={`font-semibold ${
                      availableBeds > 0 ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {availableBeds > 0 ? `${availableBeds} beds available` : "Full"}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {room.hasAirCondition && <span title="AC"><Wind className="w-3.5 h-3.5 text-blue-500" /></span>}
                    {room.hasAttachedBath && <span title="Attached Washroom"><Bath className="w-3.5 h-3.5 text-indigo-500" /></span>}
                    {room.hasBalcony && <span title="Balcony"><Sun className="w-3.5 h-3.5 text-amber-500" /></span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bed Layout Grid for Active Room */}
      {activeRoom && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-slate-900">
                Step 2: Select Your Preferred Bed (Room {activeRoom.roomNumber})
              </span>
              <p className="text-[11px] text-slate-500">
                Click an unoccupied bed to reserve it.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              {holdLabel && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold tabular-nums">
                  <Clock className="w-3 h-3" /> Hold: {holdLabel}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> On Hold
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Occupied
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {activeRoom.beds.map((bed) => {
              const isSelected = selectedBedId === bed.id;
              const isAvailable = bed.status === BedStatus.AVAILABLE;
              const isReserved = bed.status === BedStatus.RESERVED;

              return (
                <button
                  key={bed.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelectBed(bed.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20"
                      : isAvailable
                      ? "border-emerald-300 bg-white hover:border-emerald-500 text-slate-800"
                      : isReserved
                      ? "border-amber-200 bg-amber-50/70 text-amber-700 cursor-not-allowed opacity-85"
                      : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BedDouble className={`w-4 h-4 ${isSelected ? "text-white" : isAvailable ? "text-emerald-600" : isReserved ? "text-amber-500" : "text-slate-400"}`} />
                    <span className="font-bold text-xs">Bed #{bed.bedNumber}</span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase block ${
                      isSelected
                        ? "text-blue-100"
                        : isAvailable
                        ? "text-emerald-700"
                        : isReserved
                        ? "text-amber-700"
                        : "text-slate-400"
                    }`}
                  >
                    {isSelected ? "Selected" : isAvailable ? "Available" : isReserved ? "On Hold (15m)" : "Occupied"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
