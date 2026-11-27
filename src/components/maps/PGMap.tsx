"use client";

import React from "react";
import { MapPin, ExternalLink } from "lucide-react";

interface PGMapProps {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
  city: string;
}

export default function PGMap({ latitude, longitude, name, address, city }: PGMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isRealKey = apiKey && !apiKey.includes("ReplaceWithYours");

  const mapUrl = isRealKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=15`
    : `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en;z=14&output=embed`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900">{name} Location</h4>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="relative w-full h-[320px] bg-slate-100">
        <iframe
          title={name}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={mapUrl}
        />
      </div>

      <div className="p-3 bg-slate-50 text-xs text-slate-600 flex items-center justify-between border-t border-slate-200">
        <span className="truncate mr-4">{address}, {city}</span>
        <span className="font-mono text-[11px] text-slate-400 shrink-0">
          {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
        </span>
      </div>
    </div>
  );
}
