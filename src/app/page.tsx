"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MapPin,
  Compass,
  Users,
  Eye,
  Star,
  Shield,
  Wifi,
  Utensils,
  Zap,
  ArrowRight,
  RotateCcw,
  Calendar,
  SlidersHorizontal,
  Check,
  BedDouble,
  Layers,
  Clock,
  Coffee,
  Sparkles,
  Building,
  Wind,
  X,
  ChevronRight,
} from "lucide-react";
import ScheduleVisitModal from "@/components/booking/ScheduleVisitModal";
import SafeImage from "@/components/ui/SafeImage";
import CustomSelect from "@/components/ui/CustomSelect";

function titleCase(str?: string) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface PGPropertySummary {
  id: string;
  name: string;
  tagline: string | null;
  slug: string;
  city: string;
  locality: string;
  genderCategory: "MALE" | "FEMALE" | "UNISEX" | "BOYS" | "GIRLS" | "COED";
  propertyType?: string;
  foodIncluded: boolean;
  foodOption: string;
  menuItems: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
    snacks?: string[];
  };
  securityDeposit: number;
  maintenanceCharges: number;
  noticePeriodDays: number;
  gateClosingTime: string | null;
  featuredImage: string | null;
  variants?: any;
  blurData?: string | null;
  images: string[];
  averageRating: number;
  reviewCount: number;
  startingPrice: number;
  hasVirtualTour: boolean;
  rooms: any[];
  amenities: { id?: string; name: string; icon?: string | null; iconName?: string | null }[];
}

// ─── Map API response to card-ready shape ───────────────────────────────────
function mapProperty(p: any): PGPropertySummary {
  return {
    id: p.id,
    name: p.name,
    tagline: p.description || p.tagline,
    slug: p.slug,
    city: p.address?.city || p.city || "Bangalore",
    locality: p.address?.locality || p.locality || "",
    genderCategory: p.genderPreference || p.genderCategory || "UNISEX",
    propertyType: p.propertyType || "PG",
    foodIncluded: p.foodOption ? p.foodOption !== "NONE" : Boolean(p.foodIncluded),
    foodOption: p.foodOption || "NONE",
    menuItems: (() => {
      try {
        return typeof p.menuItems === "string" ? JSON.parse(p.menuItems) : p.menuItems || {};
      } catch {
        return {};
      }
    })(),
    securityDeposit: p.securityDeposit || 0,
    maintenanceCharges: p.maintenanceCharges || 0,
    noticePeriodDays: p.noticePeriodDays || 30,
    gateClosingTime: p.gateClosingTime || null,
    featuredImage: p.mediaItems?.[0]?.url || p.media?.[0]?.url || p.featuredImage || null,
    variants: p.mediaItems?.[0]?.variants || null,
    blurData: p.mediaItems?.[0]?.blurData || null,
    images:
      (p.mediaItems && p.mediaItems.length > 0
        ? p.mediaItems.map((m: any) => m.url)
        : p.media?.map((m: any) => m.url)) || p.images || [],
    averageRating: p.avgRating || p.averageRating || 0,
    reviewCount: p.reviewCount || 0,
    startingPrice: p.startingRent || p.startingPrice || 6500,
    hasVirtualTour: p.virtualTours?.length > 0 || Boolean(p.hasVirtualTour),
    rooms: p.rooms || [],
    amenities:
      p.propertyAmenities?.map((pa: any) => ({
        id: pa.amenity?.id,
        name: pa.amenity?.name,
        code: pa.amenity?.code,
        iconName: pa.amenity?.iconName,
      })) || p.amenities || [],
  };
}

export default function HomePage() {
  const [properties, setProperties] = useState<PGPropertySummary[]>([]);
  // `loading` is true only when we have NO cached data for the current filters.
  // When we have stale cache we keep showing it while re-fetching silently.
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  // Raw locality text (what the user is typing)
  const [localityInput, setLocalityInput] = useState("");
  // Debounced value that actually triggers the API fetch (300 ms delay)
  const [locality, setLocality] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [gender, setGender] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sharing, setSharing] = useState("");
  const [food, setFood] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [hasTourOnly, setHasTourOnly] = useState(false);

  // Visit modal state
  const [selectedVisitProperty, setSelectedVisitProperty] = useState<{
    id: string;
    name: string;
    address?: string;
  } | null>(null);

  // Dining menu modal state
  const [selectedMenuProperty, setSelectedMenuProperty] = useState<PGPropertySummary | null>(null);

  // ── Debounce locality input so we don't fire a request on every keystroke ──
  useEffect(() => {
    const timer = setTimeout(() => setLocality(localityInput), 300);
    return () => clearTimeout(timer);
  }, [localityInput]);

  // Synchronize with URL search parameters (e.g. from navbar dropdown or city selector)
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        const pt = sp.get("propertyType");
        if (pt !== null) setPropertyType(pt);
        const c = sp.get("city");
        if (c !== null) setCity(c);
        const loc = sp.get("locality");
        if (loc) { setLocalityInput(loc); setLocality(loc); }
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("staysphere:filter", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("staysphere:filter", syncFromUrl);
    };
  }, []);

  // ── In-memory SWR cache: key → list of cards ─────────────────────────────
  // Persists for the full session so filter toggling is instant on repeat visits.
  const cacheRef = React.useRef<Map<string, PGPropertySummary[]>>(new Map());
  const abortControllerRef = React.useRef<AbortController | null>(null);

  useEffect(() => {
    fetchProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, locality, propertyType, gender, maxPrice, sharing, food, sortBy, hasTourOnly]);

  const fetchProperties = async () => {
    const params = new URLSearchParams();
    if (city) params.append("city", city);
    if (locality) params.append("locality", locality);
    if (propertyType) params.append("propertyType", propertyType);
    if (gender) params.append("gender", gender);
    if (maxPrice) params.append("maxRent", maxPrice);
    if (sharing) params.append("sharing", sharing);
    if (food) params.append("food", food);
    if (sortBy) params.append("sortBy", sortBy);
    if (hasTourOnly) params.append("hasTour", "true");

    const cacheKey = params.toString() || "default";

    // ── Stale-While-Revalidate: show cached data instantly, re-fetch silently ──
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setProperties(cached);
      setLoading(false);
      // Still re-fetch in background to pick up any new listings
    } else {
      setLoading(true);
    }

    // Cancel any in-flight request for a previous filter set
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`/api/properties?${params.toString()}`, {
        signal: controller.signal,
        // Reuse browser HTTP cache (60 s) so identical filter combos skip the network
        next: { revalidate: 60 },
      } as RequestInit);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.properties || []).map(mapProperty);
        cacheRef.current.set(cacheKey, mapped);
        setProperties(mapped);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to fetch properties:", err);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleResetFilters = () => {
    setCity("");
    setLocalityInput("");
    setLocality("");
    setPropertyType("");
    setGender("");
    setMaxPrice("");
    setSharing("");
    setFood("");
    setSortBy("createdAt");
    setHasTourOnly(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero section */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Verified accommodations {city ? `in ${city}` : "across all locations"}
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
              Coliving spaces, PGs &amp; Rented Rooms
            </h1>

            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              Explore room layouts, verified owner amenities, meal plans &amp; rent terms, or schedule a free in-person visit with direct property managers.
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-8 bg-white rounded-2xl p-5 border border-black/[0.06] shadow-sm space-y-4">
            {/* Stay Type Category Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/[0.05]">
              <div className="hidden sm:flex flex-wrap items-center p-1 bg-black/[0.04] rounded-full gap-1 border border-black/[0.04]">
                {[
                  { value: "", label: "All Spaces" },
                  { value: "PG", label: "PG Hostels" },
                  { value: "RENTED_ROOM", label: "Private Rented Rooms" },
                  { value: "FLAT", label: "Flats & Apartments" },
                  { value: "HOSTEL", label: "Student Hostels" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPropertyType(opt.value)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer btn-press ${
                      propertyType === opt.value
                        ? "bg-white text-slate-900 shadow-sm shadow-black/10 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-black/[0.03]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Mobile / Compact Dropdown Selector */}
              <div className="sm:hidden w-full flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Space Type:</span>
                <div className="flex-1">
                  <CustomSelect
                    value={propertyType}
                    onChange={setPropertyType}
                    placeholder="All Spaces"
                    options={[
                      { value: "", label: "All Spaces" },
                      { value: "PG", label: "PG Hostels" },
                      { value: "RENTED_ROOM", label: "Private Rented Rooms" },
                      { value: "FLAT", label: "Flats & Apartments" },
                      { value: "HOSTEL", label: "Student Hostels" },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* City */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  City
                </label>
                <CustomSelect
                  value={city}
                  onChange={setCity}
                  placeholder="All Locations"
                  icon={<Building className="w-3.5 h-3.5" />}
                  options={[
                    { value: "", label: "All Locations" },
                    { value: "Bangalore", label: "Bangalore" },
                    { value: "Bhubaneswar", label: "Bhubaneswar" },
                    { value: "Delhi", label: "Delhi / NCR" },
                    { value: "Hyderabad", label: "Hyderabad" },
                    { value: "Pune", label: "Pune" },
                    { value: "Mumbai", label: "Mumbai" },
                  ]}
                />
              </div>

              {/* Locality */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Locality / Area
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={localityInput}
                    onChange={(e) => setLocalityInput(e.target.value)}
                    placeholder="e.g. Koramangala, Patia..."
                    className="w-full bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Occupancy */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Occupancy
                </label>
                <CustomSelect
                  value={gender}
                  onChange={setGender}
                  placeholder="All occupancy"
                  icon={<Users className="w-3.5 h-3.5" />}
                  options={[
                    { value: "", label: "All occupancy" },
                    { value: "BOYS", label: "Male / Boys" },
                    { value: "GIRLS", label: "Female / Girls" },
                    { value: "COED", label: "Coed / Unisex" },
                  ]}
                />
              </div>

              {/* Room Sharing */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Sharing type
                </label>
                <CustomSelect
                  value={sharing}
                  onChange={setSharing}
                  placeholder="Any sharing"
                  options={[
                    { value: "", label: "Any sharing" },
                    { value: "SINGLE", label: "Private (Single)" },
                    { value: "DOUBLE", label: "2 Sharing (Double)" },
                    { value: "TRIPLE", label: "3 Sharing (Triple)" },
                    { value: "FOUR_PLUS", label: "4+ Sharing" },
                  ]}
                />
              </div>

              {/* Monthly budget */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Max budget
                </label>
                <CustomSelect
                  value={maxPrice}
                  onChange={setMaxPrice}
                  placeholder="Any budget"
                  options={[
                    { value: "", label: "Any budget" },
                    { value: "8000", label: "Up to ₹8,000 / mo" },
                    { value: "12000", label: "Up to ₹12,000 / mo" },
                    { value: "16000", label: "Up to ₹16,000 / mo" },
                    { value: "25000", label: "Up to ₹25,000 / mo" },
                  ]}
                />
              </div>

              {/* Sort by */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Sort by
                </label>
                <CustomSelect
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="Recommended"
                  options={[
                    { value: "createdAt", label: "Recommended" },
                    { value: "priceAsc", label: "Price: Low to High" },
                    { value: "priceDesc", label: "Price: High to Low" },
                  ]}
                />
              </div>
            </div>

            {(localityInput || gender || maxPrice || sharing || food || hasTourOnly || sortBy !== "createdAt") && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Filtered results</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset all filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Property listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Available properties {city ? `in ${city}` : "across all locations"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified by field inspectors &amp; approved by administrators
            </p>
          </div>
          <span className="text-xs text-slate-600 font-medium self-start sm:self-auto border border-slate-200 bg-white px-2.5 py-1 rounded-md">
            {properties.length} results
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              /* Skeleton card – matches real card structure so there's no layout shift */
              <div
                key={n}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden flex flex-col animate-pulse"
              >
                {/* Image placeholder */}
                <div className="h-52 bg-slate-100 w-full" />
                {/* Content placeholder */}
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-10" />
                  </div>
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  {/* Amenity chips */}
                  <div className="flex gap-1 pt-1">
                    <div className="h-5 bg-emerald-50 border border-emerald-100 rounded-md w-16" />
                    <div className="h-5 bg-emerald-50 border border-emerald-100 rounded-md w-14" />
                    <div className="h-5 bg-emerald-50 border border-emerald-100 rounded-md w-20" />
                  </div>
                  {/* Room config */}
                  <div className="h-14 bg-indigo-50 rounded-lg border border-indigo-100" />
                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-2.5 bg-slate-100 rounded w-10" />
                      <div className="h-5 bg-slate-100 rounded w-20" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="h-7 bg-slate-100 rounded-full w-16" />
                      <div className="h-7 bg-slate-200 rounded-full w-20" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">
              No matching properties
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try adjusting your city, locality, sharing type, or price filter to view more listings.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((pg, index) => (
              <div
                key={pg.id}
                className="apple-card overflow-hidden flex flex-col"
                style={{
                  animation: `staggerIn 260ms var(--ease-out) ${Math.min(index * 35, 300)}ms both`,
                }}
              >
                {/* Photo & Badges */}
                <div className="relative h-52 w-full bg-slate-100 overflow-hidden">
                  <SafeImage
                    src={
                      pg.featuredImage ||
                      pg.images?.[0] ||
                      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
                    }
                    variants={pg.variants}
                    blurData={pg.blurData}
                    alt={pg.name}
                    fill
                    className="w-full h-full object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-900/85 text-white border border-white/20 shadow-xs">
                      {pg.propertyType === "RENTED_ROOM"
                        ? "Rented Room"
                        : pg.propertyType === "FLAT"
                        ? "Flat"
                        : pg.propertyType === "HOSTEL"
                        ? "Hostel"
                        : "PG Living"}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-900/85 text-white border border-white/20 shadow-xs">
                      {pg.genderCategory === "BOYS" || pg.genderCategory === "MALE"
                        ? "Male"
                        : pg.genderCategory === "GIRLS" || pg.genderCategory === "FEMALE"
                        ? "Female"
                        : "Unisex"}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/95 text-slate-800 border border-black/[0.08] shadow-xs flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  </div>

                  {pg.hasVirtualTour && (
                    <div className="absolute top-3 right-3 bg-white/95 text-slate-900 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-black/[0.08] shadow-xs">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      360° tour
                    </div>
                  )}

                  <div className="absolute bottom-2.5 right-2.5 bg-slate-900/85 text-white text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
                    {pg.images?.length || 1} photos
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {pg.locality ? `${pg.locality}, ${pg.city}` : pg.city}
                      </span>
                      {pg.averageRating > 0 && (
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="tabular-nums">{pg.averageRating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">
                            ({pg.reviewCount})
                          </span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mt-1">
                      {pg.name}
                    </h3>

                    {pg.tagline && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {pg.tagline}
                      </p>
                    )}
                  </div>

                  {/* 1. Verified Facilities & Features (Amenities filled by owner) */}
                  {pg.amenities && pg.amenities.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Verified Facilities &amp; Amenities:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {pg.amenities.slice(0, 5).map((a, aIdx) => (
                          <span
                            key={aIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
                          >
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate max-w-[130px]">{a.name}</span>
                          </span>
                        ))}
                        {pg.amenities.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                            +{pg.amenities.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Room & Bed Configuration (Filled during signup) */}
                  {pg.rooms && pg.rooms.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5 text-indigo-800">
                          <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            {Array.from(new Set(pg.rooms.map((r: any) => titleCase(r.sharingType)))).join(", ")} Sharing
                          </span>
                        </span>
                        <span className="text-slate-500 font-normal text-[10px]">
                          {pg.rooms.length} room{pg.rooms.length !== 1 ? "s" : ""}
                          {(() => {
                            const floors = Array.from(new Set(pg.rooms.map((r: any) => r.floorNumber))).sort();
                            if (floors.length === 0) return "";
                            return ` · ${floors.map((f: any) => f === 0 ? "Ground Floor" : `Floor ${f}`).join(", ")}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {pg.rooms.some((r: any) => r.hasAttachedBath) && (
                          <span className="px-1.5 py-0.5 rounded bg-white text-teal-700 border border-teal-200 font-medium">
                            Attached Bath
                          </span>
                        )}
                        {pg.rooms.some((r: any) => r.hasBalcony) && (
                          <span className="px-1.5 py-0.5 rounded bg-white text-sky-700 border border-sky-200 font-medium">
                            Balcony
                          </span>
                        )}
                        {pg.rooms.some((r: any) => r.hasAirCondition) && (
                          <span className="px-1.5 py-0.5 rounded bg-white text-blue-700 border border-blue-200 font-medium">
                            AC Room
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Food Facility & Daily Dining Menu (Filled during signup) */}
                  {pg.foodIncluded && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
                        <Utensils className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{titleCase(pg.foodOption || "THREE_MEALS")}</span>
                      </div>
                      {Object.keys(pg.menuItems || {}).some(
                        (k) => Array.isArray((pg.menuItems as any)[k]) && (pg.menuItems as any)[k].length > 0
                      ) && (
                        <button
                          type="button"
                          onClick={() => setSelectedMenuProperty(pg)}
                          className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          View Menu
                        </button>
                      )}
                    </div>
                  )}

                  {/* 4. Commercial Terms */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                    <span>Deposit: <strong className="text-slate-700">₹{pg.securityDeposit.toLocaleString("en-IN")}</strong></span>
                    <span>Notice: <strong className="text-slate-700">{pg.noticePeriodDays || 30} Days</strong></span>
                    {pg.gateClosingTime && <span>Gate: <strong className="text-slate-700">{pg.gateClosingTime}</strong></span>}
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block leading-tight">Starting</span>
                      <p className="text-base font-semibold text-slate-900 tabular-nums">
                        ₹{pg.startingPrice?.toLocaleString("en-IN")}
                        <span className="text-xs font-normal text-slate-500"> / mo</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedVisitProperty({
                            id: pg.id,
                            name: pg.name,
                            address: `${pg.locality}, ${pg.city}`,
                          })
                        }
                        className="btn-press py-1.5 px-3.5 bg-black/[0.04] hover:bg-black/[0.08] text-slate-700 text-xs font-medium rounded-full transition-all inline-flex items-center gap-1.5"
                        title="Schedule free physical visit"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Visit</span>
                      </button>

                      <Link
                        href={`/properties/${pg.id}`}
                        className="apple-btn-primary inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-medium rounded-full btn-press"
                      >
                        <span>Reserve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section id="why-us" className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl space-y-1 mb-8">
            <h2 className="text-lg font-semibold text-slate-900">
              Direct booking with verified tours
            </h2>
            <p className="text-xs text-slate-500">
              Review room layouts and amenities prior to reserving.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs">
                1
              </div>
              <h3 className="text-xs font-semibold text-slate-900">
                360° Room tours & free visits
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect room dimensions, attached bathrooms, study desks, and natural light via WebGL 3D, or book a free in-person site walkthrough.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs">
                2
              </div>
              <h3 className="text-xs font-semibold text-slate-900">
                Exact bed selection
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose the specific bed in the room: window-facing, doorway-side, or desk-adjacent with real-time status.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-xs">
                3
              </div>
              <h3 className="text-xs font-semibold text-slate-900">
                Transparent move-in breakdown
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See exact security deposit and rent terms upfront with zero hidden brokerages. Pay token advance securely via Razorpay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Property owner banner */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 rounded-xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[11px] font-medium text-slate-400">
              Property owners
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              List your PG property on StaySphere
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accept direct bookings, manage visit schedules, automate monthly rent reminders, and resolve tenant complaints on a single portal.
            </p>
          </div>
          <Link
            href="/register?role=PG_OWNER"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-md transition-colors whitespace-nowrap"
          >
            Register property
          </Link>
        </div>
      </section>

      {/* Schedule Visit Modal */}
      {selectedVisitProperty && (
        <ScheduleVisitModal
          isOpen={Boolean(selectedVisitProperty)}
          onClose={() => setSelectedVisitProperty(null)}
          propertyId={selectedVisitProperty.id}
          propertyName={selectedVisitProperty.name}
          propertyAddress={selectedVisitProperty.address}
        />
      )}

      {/* Daily Dining Menu Modal */}
      {selectedMenuProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedMenuProperty.name}</h3>
                  <p className="text-[11px] text-amber-700 font-semibold">
                    {titleCase(selectedMenuProperty.foodOption)} Included with Stay
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMenuProperty(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: "breakfast" as const, title: "Breakfast", time: "Morning (7:30 AM – 9:30 AM)" },
                ...(selectedMenuProperty.foodOption === "THREE_MEALS"
                  ? [{ key: "lunch" as const, title: "Lunch", time: "Afternoon (12:30 PM – 2:30 PM)" }]
                  : []),
                ...(selectedMenuProperty.foodOption === "THREE_MEALS" || selectedMenuProperty.foodOption === "TWO_MEALS"
                  ? [{ key: "dinner" as const, title: "Dinner", time: "Night (7:30 PM – 9:30 PM)" }]
                  : []),
                { key: "snacks" as const, title: "Evening Snacks", time: "Evening (4:30 PM – 5:30 PM)" },
              ].map((m) => {
                const dishes = selectedMenuProperty.menuItems?.[m.key] || [];
                return (
                  <div key={m.key} className="p-3 rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {m.title}
                      </span>
                      <span className="text-[10px] text-slate-500">{m.time}</span>
                    </div>
                    {dishes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {dishes.map((dish: string, dIdx: number) => (
                          <span
                            key={dIdx}
                            className="bg-white text-amber-900 border border-amber-200 rounded-md px-2 py-0.5 text-xs font-medium"
                          >
                            {dish}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Standard homestyle meal plan</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMenuProperty(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
