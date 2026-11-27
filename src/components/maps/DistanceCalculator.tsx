"use client";

import React, { useState } from "react";
import { Navigation, Clock, MapPin, AlertTriangle, Car, Footprints } from "lucide-react";

interface DistanceCalculatorProps {
  destLat: number;
  destLng: number;
  propertyName: string;
}

export default function DistanceCalculator({
  destLat,
  destLng,
  propertyName,
}: DistanceCalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"driving" | "walking">("driving");
  const [distanceData, setDistanceData] = useState<{
    distanceKm: number;
    durationMinutes: number;
    distanceText: string;
    durationText: string;
    source: string;
    googleMapsNavigationUrl: string;
  } | null>(null);

  const calculateDistance = (userLat: number, userLng: number, selectedMode: "driving" | "walking") => {
    setLoading(true);
    setError(null);

    fetch("/api/maps/distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        originLat: userLat,
        originLng: userLng,
        destLat,
        destLng,
        mode: selectedMode,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setDistanceData({
            ...res.data,
            googleMapsNavigationUrl: res.googleMapsNavigationUrl,
          });
        } else {
          setError(res.error || "Unable to calculate travel distance.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Network error connecting to distance calculation service.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGetLocation = (selectedMode: "driving" | "walking" = mode) => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        calculateDistance(position.coords.latitude, position.coords.longitude, selectedMode);
      },
      (geoError) => {
        setLoading(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("Location permission denied. Please allow location access in your browser settings.");
        } else {
          setError("Could not retrieve your location. Try again or check location settings.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-slate-800">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">How far from your current location?</h4>
            <p className="text-[11px] text-slate-500">Live road distance and estimated commute time</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode("driving");
              if (distanceData) handleGetLocation("driving");
            }}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              mode === "driving" ? "bg-white text-blue-600 font-bold shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drive</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("walking");
              if (distanceData) handleGetLocation("walking");
            }}
            className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-all ${
              mode === "walking" ? "bg-white text-blue-600 font-bold shadow-xs" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>
        </div>
      </div>

      {!distanceData ? (
        <div>
          <button
            type="button"
            onClick={() => handleGetLocation(mode)}
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locating & Checking Route...</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Calculate Commute from My Location</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-slate-900">{distanceData.distanceText}</div>
              <div className="text-xs text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                <span>~{distanceData.durationText} travel time ({mode})</span>
              </div>
            </div>
            <a
              href={distanceData.googleMapsNavigationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Start Navigation</span>
            </a>
          </div>
          <button
            type="button"
            onClick={() => handleGetLocation(mode)}
            className="text-[11px] text-slate-500 hover:text-slate-800 mt-2 block underline cursor-pointer"
          >
            Recalculate location
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2.5 flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
