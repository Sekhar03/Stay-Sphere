"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Compass,
  Star,
  ShieldCheck,
  Check,
  Calendar,
  Share2,
  AlertCircle,
  Wifi,
  Utensils,
  Zap,
  ArrowLeft,
  ChevronRight,
  Shield,
  Layers,
  BedDouble,
  Bath,
  Wind,
  Sun,
} from "lucide-react";
import PanoramaViewer from "@/components/viewer-3d/PanoramaViewer";
import PGMap from "@/components/maps/PGMap";
import DistanceCalculator from "@/components/maps/DistanceCalculator";
import BedSelector from "@/components/booking/BedSelector";
import UpiCheckoutButton from "@/components/booking/RazorpayCheckoutButton";
import ScheduleVisitModal from "@/components/booking/ScheduleVisitModal";
import MoveInCostBreakdown from "@/components/booking/MoveInCostBreakdown";
import SafeImage from "@/components/ui/SafeImage";

function titleCase(str?: string) {
  if (!str) return "";
  return str
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: overview, tour, rooms, location, reviews
  const [activeTab, setActiveTab] = useState<
    "overview" | "tour" | "rooms" | "location" | "reviews"
  >("overview");

  // Selected Room & Bed
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [bookingStep, setBookingStep] = useState<"SELECT" | "CONFIRM" | "SUCCESS">(
    "SELECT"
  );
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Schedule visit modal state
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [bookingKycPending, setBookingKycPending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/properties/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Property not found");
        return res.json();
      })
      .then((data) => {
        setProperty(data.property);
        if (data.property.rooms && data.property.rooms.length > 0) {
          // Preselect room that has available beds (or first room as fallback)
          const roomWithAvailBed =
            data.property.rooms.find((r: any) =>
              r.beds?.some((b: any) => b.status === "AVAILABLE")
            ) || data.property.rooms[0];

          setSelectedRoomId(roomWithAvailBed.id);
          const firstAvailBed = roomWithAvailBed.beds?.find(
            (b: any) => b.status === "AVAILABLE"
          );
          if (firstAvailBed) {
            setSelectedBedId(firstAvailBed.id);
          } else if (roomWithAvailBed.beds?.[0]) {
            setSelectedBedId(roomWithAvailBed.beds[0].id);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/4" />
          <div className="h-80 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-900">Property not found</h2>
        <p className="text-slate-500 text-xs mt-1">{error || "Invalid property identifier"}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to listings
        </Link>
      </div>
    );
  }

  const activeRoom = property.rooms?.find((r: any) => r.id === selectedRoomId);
  const activeBed = activeRoom?.beds?.find((b: any) => b.id === selectedBedId);
  const virtualTourUrl =
    property.virtualTours?.[0]?.panoramaUrl ||
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=2000&q=80";

  const handleCreateBooking = async () => {
    let bedToBook = selectedBedId;
    let roomToBook = selectedRoomId;

    // Auto-resolve bed if not explicitly set
    if (!bedToBook && activeRoom) {
      const avail = activeRoom.beds?.find((b: any) => b.status === "AVAILABLE");
      if (avail) {
        bedToBook = avail.id;
        setSelectedBedId(avail.id);
      }
    }

    // If active room has no available beds, try to switch to a room that has an available bed
    if (!bedToBook) {
      const altRoom = property.rooms?.find((r: any) =>
        r.beds?.some((b: any) => b.status === "AVAILABLE")
      );
      if (altRoom) {
        const altBed = altRoom.beds?.find((b: any) => b.status === "AVAILABLE");
        if (altBed) {
          roomToBook = altRoom.id;
          bedToBook = altBed.id;
          setSelectedRoomId(altRoom.id);
          setSelectedBedId(altBed.id);
        }
      }
    }

    if (!roomToBook) {
      setBookingError("Please select a room sharing option first.");
      return;
    }

    const currentRoom = property.rooms?.find((r: any) => r.id === roomToBook);
    const hasAvailableBed = currentRoom?.beds?.some((b: any) => b.status === "AVAILABLE");
    if (!hasAvailableBed && !bedToBook) {
      setBookingError("This sharing option is currently fully occupied. Please select an available room option above.");
      return;
    }

    if (!currentUser) {
      router.push(`/login?redirect=/properties/${property.slug || property.id}`);
      return;
    }

    setBookingLoading(true);
    setBookingError(null);
    setBookingKycPending(false);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          roomId: roomToBook,
          bedId: bedToBook || undefined,
          checkInDate: new Date(checkInDate).toISOString(),
          monthlyRent: Number(currentRoom?.monthlyRent || property.startingRent),
          securityDeposit: Number(property.securityDeposit || currentRoom?.securityDeposit || 5000),
          tokenAmount: 2000,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.kycPending) {
          setBookingKycPending(true);
        }
        throw new Error(data.error || "Failed to initiate bed reservation");
      }

      setCreatedBooking(data.booking);
      setBookingStep("CONFIRM");
    } catch (err: any) {
      setBookingError(err.message || "Failed to initiate reservation");
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link
            href={`/?city=${property.address?.city || "Bhubaneswar"}`}
            className="hover:text-slate-800 transition-colors"
          >
            {property.address?.city || "Bhubaneswar"}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 font-medium truncate">{property.name}</span>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                property.propertyType === "RENTED_ROOM"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : property.propertyType === "FLAT"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : property.propertyType === "HOSTEL"
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}>
                {property.propertyType === "RENTED_ROOM"
                  ? "Private Rented Room"
                  : property.propertyType === "FLAT"
                  ? "Flat / Apartment"
                  : property.propertyType === "HOSTEL"
                  ? "Student Hostel"
                  : "PG Hostel"}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-900 text-white">
                {property.genderCategory === "BOYS" || property.genderCategory === "MALE" || property.genderPreference === "BOYS"
                  ? "Male"
                  : property.genderCategory === "GIRLS" || property.genderCategory === "FEMALE" || property.genderPreference === "GIRLS"
                  ? "Female"
                  : "Unisex"}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-600" /> Verified space
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
              {property.name}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {property.address?.addressLine1 ? `${property.address.addressLine1}, ` : ""}
              {property.address?.locality ? `${property.address.locality}, ` : ""}
              {property.address?.city || "Bhubaneswar"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisitModalOpen(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Schedule free visit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: property.name,
                    url: window.location.href,
                  });
                }
              }}
              className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Share listing"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-xl overflow-hidden relative">
          <div className="md:col-span-2 h-64 sm:h-80 relative bg-slate-200 overflow-hidden">
            <SafeImage
              src={
                property.mediaItems?.[0]?.url ||
                property.media?.[0]?.url ||
                property.images?.[0] ||
                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80"
              }
              variants={property.mediaItems?.[0]?.variants}
              blurData={property.mediaItems?.[0]?.blurData}
              alt={property.name}
              fill
              priority
              className="w-full h-full object-cover"
            />
          </div>

          <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-80">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="relative bg-slate-100 overflow-hidden">
                <SafeImage
                  src={
                    property.mediaItems?.[idx]?.url ||
                    property.media?.[idx]?.url ||
                    property.images?.[idx] ||
                    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
                  }
                  variants={property.mediaItems?.[idx]?.variants}
                  blurData={property.mediaItems?.[idx]?.blurData}
                  alt={`${property.name} view ${idx}`}
                  fill
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-6 text-xs overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "tour", label: "360° Room tour" },
            { id: "rooms", label: "Select bed" },
            { id: "location", label: "Location & commute" },
            { id: "reviews", label: `Reviews (${property.reviews?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`nav-item btn-press pb-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer font-medium ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content & Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 2-column view */}
          <div className="lg:col-span-2 space-y-6">
            <div key={activeTab} className="tab-content space-y-6">
              {/* OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    About this property
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </p>
                </div>

                {/* Available Sharing Tiers & Configured Rooms */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-blue-600" />
                      Room & Bed Configuration
                    </h3>
                    <span className="text-[11px] font-medium text-slate-500">
                      {property.rooms?.length || 0} room{property.rooms?.length !== 1 ? "s" : ""} configured
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {property.rooms?.map((rm: any) => {
                      const availCount = rm.beds?.filter((b: any) => b.status === "AVAILABLE").length || 0;
                      const isSelected = rm.id === selectedRoomId;
                      return (
                        <div
                          key={rm.id}
                          onClick={() => {
                            setSelectedRoomId(rm.id);
                            const firstAvail = rm.beds?.find((b: any) => b.status === "AVAILABLE");
                            setSelectedBedId(firstAvail ? firstAvail.id : null);
                            setBookingError(null);
                          }}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all relative ${
                            isSelected
                              ? "bg-blue-50/70 border-blue-600 shadow-xs ring-2 ring-blue-600/20"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">
                              Room {rm.roomNumber || "101"}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {rm.floorNumber === 0 ? "Ground Floor" : `Floor ${rm.floorNumber}`}
                            </span>
                          </div>

                          <div className="mt-2">
                            <p className="text-xs font-bold text-blue-700 capitalize">
                              {titleCase(rm.sharingType)} Sharing
                            </p>
                            <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                              ₹{Number(rm.monthlyRent).toLocaleString("en-IN")}
                              <span className="text-[11px] font-normal text-slate-500"> /mo</span>
                            </p>
                            {rm.securityDeposit && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Security Deposit: ₹{Number(rm.securityDeposit).toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>

                          {/* Room Amenities */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                            {rm.hasAttachedBath && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                                <Bath className="w-3 h-3 text-teal-600" /> Attached Bath
                              </span>
                            )}
                            {rm.hasBalcony && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-medium">
                                <Sun className="w-3 h-3 text-sky-600" /> Balcony
                              </span>
                            )}
                            {rm.hasAirCondition && (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                                <Wind className="w-3 h-3 text-blue-600" /> AC
                              </span>
                            )}
                          </div>

                          {/* Bed status summary */}
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span
                              className={`font-semibold ${
                                availCount > 0 ? "text-emerald-700" : "text-rose-600"
                              }`}
                            >
                              {availCount > 0 ? `${availCount} beds free` : "Fully occupied"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {rm.beds?.length || 1} total beds
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Amenities */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Included amenities &amp; facilities
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {property.propertyAmenities?.map((pa: any) => (
                      <div
                        key={pa.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{pa.amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Meal Schedule & Food Facility */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-amber-600" />
                        Food &amp; Dining Service
                      </h3>
                      <p className="text-xs text-slate-500">
                        {property.foodIncluded
                          ? "Hygienic home-style food audited for health and freshness"
                          : "Self-cooking facilities available for residents"}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                      {property.foodIncluded
                        ? `${titleCase(property.foodOption || "THREE_MEALS")} Included`
                        : "No Food / Self-Cooking"}
                    </span>
                  </div>

                  {property.foodIncluded ? (
                    (() => {
                      const menu: {
                        breakfast?: string[];
                        lunch?: string[];
                        dinner?: string[];
                        snacks?: string[];
                      } = (() => {
                        try {
                          return typeof property.menuItems === "string"
                            ? JSON.parse(property.menuItems)
                            : property.menuItems || {};
                        } catch {
                          return {};
                        }
                      })();

                      const mealSlots = [
                        { key: "breakfast" as const, title: "Breakfast", time: "7:30 AM – 9:30 AM" },
                        ...(property.foodOption === "THREE_MEALS" || !property.foodOption
                          ? [{ key: "lunch" as const, title: "Lunch", time: "12:30 PM – 2:30 PM" }]
                          : []),
                        ...(property.foodOption === "THREE_MEALS" || property.foodOption === "TWO_MEALS" || !property.foodOption
                          ? [{ key: "dinner" as const, title: "Dinner", time: "7:30 PM – 10:00 PM" }]
                          : []),
                        { key: "snacks" as const, title: "Evening Snacks", time: "4:30 PM – 5:30 PM" },
                      ];

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {mealSlots.map((m) => {
                            const dishes = menu[m.key] || [];
                            return (
                              <div
                                key={m.key}
                                className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-xs text-slate-900">
                                    {m.title}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">{m.time}</span>
                                </div>
                                {dishes.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
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
                                  <p className="text-[11px] text-slate-400 italic">
                                    Fresh home-cooked daily meal
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                      Food is not included with this accommodation. Residents have access to a shared kitchen or induction plate for preparing self-cooked meals.
                    </div>
                  )}
                </div>

                {/* House Rules */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    House policies
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500">Notice period:</span>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {property.noticePeriodDays || 30} days prior to departure
                      </p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500">Gate timings:</span>
                      <p className="font-medium text-slate-900 mt-0.5">
                        {property.gateCloseTime || "11:00 PM (Biometric access 24/7)"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 360 TOUR */}
            {activeTab === "tour" && (
              <div className="space-y-3 bg-white border border-slate-200 rounded-xl p-5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-blue-600" />
                    360° Room inspection
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drag around to view the room proportions, wardrobe layout, and natural lighting.
                  </p>
                </div>

                <div className="h-[440px] rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                  <PanoramaViewer
                    panoramaUrl={virtualTourUrl}
                    title={`${property.name} - 360 Tour`}
                  />
                </div>
              </div>
            )}

            {/* ROOMS & BEDS */}
            {activeTab === "rooms" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Bed position & selection
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your exact bed. Your selected bed number will be written into your booking agreement.
                  </p>
                </div>

                <BedSelector
                  rooms={property.rooms}
                  selectedRoomId={selectedRoomId}
                  selectedBedId={selectedBedId}
                  onSelectRoom={(roomId) => setSelectedRoomId(roomId)}
                  onSelectBed={(bedId) => setSelectedBedId(bedId)}
                />
              </div>
            )}

            {/* LOCATION */}
            {activeTab === "location" && (
              <div className="space-y-4">
                <PGMap
                  latitude={Number(property.address?.latitude || 20.2961)}
                  longitude={Number(property.address?.longitude || 85.8245)}
                  name={property.name}
                  address={`${property.address?.addressLine1 || ""}, ${property.address?.locality || ""}`}
                  city={property.address?.city || "Bhubaneswar"}
                />

                <DistanceCalculator
                  destLat={Number(property.address?.latitude || 20.2961)}
                  destLng={Number(property.address?.longitude || 85.8245)}
                  propertyName={property.name}
                />
              </div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Resident reviews
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verified reviews from tenants who stayed at {property.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-900 font-semibold text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{property.avgRating?.toFixed(1) || "4.8"}</span>
                  </div>
                </div>

                {property.reviews && property.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {property.reviews.map((rev: any) => (
                      <div
                        key={rev.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {rev.user?.name || "Resident"}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Verified resident
                            </span>
                          </div>
                          <span className="text-amber-500 text-xs">
                            {"★".repeat(rev.rating)}
                            {"☆".repeat(5 - rev.rating)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No resident reviews published yet.
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:col-span-1 space-y-4">
            <div className="sticky top-20 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-xs text-slate-500 block">Monthly rent</span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    ₹{Number(activeRoom?.monthlyRent || property.startingRent || 6500).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-500">per month</span>
                </div>
              </div>

              {/* Move-in Estimator */}
              <MoveInCostBreakdown
                monthlyRent={Number(activeRoom?.monthlyRent || property.startingRent || 6500)}
                securityDeposit={Number(property.securityDeposit || 5000)}
                tokenAmount={2000}
                sharingType={activeRoom?.sharingType || "Room"}
                foodIncluded={property.foodIncluded}
              />

              {/* Room Sharing & Bed Selector inside Booking Widget */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Room Sharing Option</span>
                  {activeRoom && (
                    <span className="text-[11px] font-normal text-slate-500">
                      {activeRoom.beds?.filter((b: any) => b.status === "AVAILABLE").length || 0} beds free
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {property.rooms?.map((rm: any) => {
                    const isSelected = rm.id === selectedRoomId;
                    const avail = rm.beds?.filter((b: any) => b.status === "AVAILABLE").length || 0;
                    return (
                      <button
                        key={rm.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoomId(rm.id);
                          const firstAvail = rm.beds?.find((b: any) => b.status === "AVAILABLE");
                          setSelectedBedId(firstAvail ? firstAvail.id : null);
                          setBookingError(null);
                        }}
                        className={`p-2 rounded-lg text-left border text-[11px] transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 text-blue-900 font-bold ring-1 ring-blue-500/30"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="capitalize truncate font-bold text-slate-900">
                          {rm.sharingType.toLowerCase()} sharing
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-0.5">
                          <span>₹{Number(rm.monthlyRent).toLocaleString("en-IN")}/mo</span>
                          <span className={avail > 0 ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                            {avail > 0 ? `${avail} left` : "Full"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bed Picker */}
                {activeRoom && activeRoom.beds && activeRoom.beds.length > 0 && (
                  <div className="pt-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Select Bed Assignment
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRoom.beds.map((b: any) => {
                        const isSelected = b.id === selectedBedId;
                        const isAvail = b.status === "AVAILABLE";
                        return (
                          <button
                            key={b.id}
                            type="button"
                            disabled={!isAvail}
                            onClick={() => {
                              setSelectedBedId(b.id);
                              setBookingError(null);
                            }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                              !isAvail
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through"
                                : isSelected
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-500"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                            }`}
                          >
                            Bed {b.bedNumber} {!isAvail && "(Occupied)"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Move-in Date picker */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Planned move-in date
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              {bookingError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{bookingError}</span>
                  </div>
                  {bookingKycPending && (
                    <Link
                      href="/dashboard?tab=accommodation"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Complete KYC in Dashboard →
                    </Link>
                  )}
                </div>
              )}

              {/* Actions */}
              {bookingStep === "SELECT" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={bookingLoading}
                    onClick={handleCreateBooking}
                    className="w-full py-2.5 px-3 rounded-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>{bookingLoading ? "Reserving..." : "Reserve bed (₹2,000 token)"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitModalOpen(true)}
                    className="w-full py-2 px-3 rounded-md text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    Schedule free site visit first
                  </button>
                </div>
              )}

              {bookingStep === "CONFIRM" && createdBooking && (
                <div className="space-y-3 pt-1">
                  <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                    Bed reserved temporarily. Complete the ₹2,000 token advance to lock your confirmation.
                  </div>

                  <UpiCheckoutButton
                    amount={2000}
                    paymentType="BOOKING_ADVANCE"
                    bookingId={createdBooking.id}
                    userEmail={currentUser?.email}
                    userName={currentUser?.name}
                    userPhone={currentUser?.phone}
                    onSuccess={() => {
                      setBookingStep("SUCCESS");
                    }}
                    buttonText="Pay ₹2,000 advance via UPI"
                    className="w-full py-2.5"
                  />
                </div>
              )}

              {bookingStep === "SUCCESS" && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    Reservation confirmed
                  </h4>
                  <p className="text-xs text-slate-600">
                    Your advance was captured. The property manager has been informed.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-block mt-1 py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  >
                    View resident dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        isOpen={visitModalOpen}
        onClose={() => setVisitModalOpen(false)}
        propertyId={property.id}
        propertyName={property.name}
        propertyAddress={`${property.address?.addressLine1 || ""}, ${property.address?.locality || ""}`}
      />
    </div>
  );
}
