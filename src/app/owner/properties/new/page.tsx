"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building,
  MapPin,
  Shield,
  DollarSign,
  Utensils,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Compass,
  Bed,
  Plus,
  Trash2,
} from "lucide-react";
import MediaUploader, { UploadedMediaItem } from "@/components/media/MediaUploader";

export default function RegisterPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState<"PG" | "RENTED_ROOM" | "FLAT" | "HOSTEL">("PG");
  const [genderPreference, setGenderPreference] = useState("COED");
  const [foodOption, setFoodOption] = useState("THREE_MEALS");
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [gateClosingTime, setGateClosingTime] = useState("22:30");
  const [startingRent, setStartingRent] = useState(8500);
  const [securityDeposit, setSecurityDeposit] = useState(15000);
  const [maintenanceCharges, setMaintenanceCharges] = useState(0);
  const [electricityCharges, setElectricityCharges] = useState("As per sub-meter consumption");
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);

  // Address & Exact Map Location state
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [locality, setLocality] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState(12.9352);
  const [longitude, setLongitude] = useState(77.6245);

  // Amenities catalog & selected IDs
  const [amenities, setAmenities] = useState<any[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([]);

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Rooms setup
  const [rooms, setRooms] = useState([
    { roomNumber: "101", floorNumber: 1, sharingType: "DOUBLE", monthlyRent: 9500, securityDeposit: 19000, bedCount: 2 },
  ]);

  useEffect(() => {
    // Check owner authentication and KYC verification status
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.ownerProfile) {
          setKycVerified(Boolean(data.user.ownerProfile.isKycVerified));
        }
      })
      .catch(() => {});

    // Fetch available amenities from API
    fetch("/api/properties") // or fetch amenities catalog
      .then((res) => res.json())
      .catch(() => {});

    // Load default amenities list
    setAmenities([
      { id: "wifi", name: "High-Speed Wi-Fi" },
      { id: "ac", name: "Air Conditioning" },
      { id: "meals", name: "Three Homestyle Meals" },
      { id: "power", name: "24/7 Power Backup" },
      { id: "cctv", name: "CCTV Surveillance" },
      { id: "biometric", name: "Biometric Entry" },
      { id: "laundry", name: "Washing Machine & Laundry" },
      { id: "ro", name: "RO Water Purifier" },
      { id: "housekeeping", name: "Daily Housekeeping" },
      { id: "parking", name: "Two-Wheeler Parking" },
    ]);
  }, []);

  // Quick City Coordinate presets
  const handleCityPreset = (selectedCity: string) => {
    setCity(selectedCity);
    if (selectedCity === "Bangalore") {
      setLatitude(12.9352);
      setLongitude(77.6245);
      setState("Karnataka");
    } else if (selectedCity === "Pune") {
      setLatitude(18.5912);
      setLongitude(73.7389);
      setState("Maharashtra");
    } else if (selectedCity === "Hyderabad") {
      setLatitude(17.4401);
      setLongitude(78.3489);
      setState("Telangana");
    } else if (selectedCity === "Gurgaon") {
      setLatitude(28.4950);
      setLongitude(77.0895);
      setState("Haryana");
    } else if (selectedCity === "Mumbai") {
      setLatitude(19.1136);
      setLongitude(72.8697);
      setState("Maharashtra");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        description,
        propertyType,
        genderPreference,
        foodOption,
        noticePeriodDays: Number(noticePeriodDays),
        gateClosingTime,
        rules: ["No smoking inside rooms", "Visitors allowed in common lounge till 9 PM", "Maintain quiet hours after 10 PM"],
        startingRent: Number(startingRent),
        securityDeposit: Number(securityDeposit),
        maintenanceCharges: Number(maintenanceCharges),
        electricityCharges,
        address: {
          addressLine1,
          addressLine2: addressLine2 || undefined,
          landmark: landmark || undefined,
          locality,
          area: area || locality,
          city,
          state,
          pincode,
          latitude: Number(latitude),
          longitude: Number(longitude),
        },
        amenityIds: selectedAmenityIds,
        images: imageUrls,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register property");
      }

      // Automatically create the rooms and generate beds configured in form
      if (data.property?.id && rooms && rooms.length > 0) {
        for (const rm of rooms) {
          try {
            await fetch("/api/rooms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                propertyId: data.property.id,
                roomNumber: rm.roomNumber,
                floorNumber: Number(rm.floorNumber || 1),
                sharingType: rm.sharingType || "DOUBLE",
                monthlyRent: Number(rm.monthlyRent || startingRent),
                securityDeposit: Number(rm.securityDeposit || securityDeposit),
                bedCount: Number(rm.bedCount || 2),
                hasAttachedBath: true,
                hasBalcony: false,
                hasAirCondition: false,
              }),
            });
          } catch (rmErr) {
            console.warn("Room creation warning:", rmErr);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/owner/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Owner Dashboard
          </Link>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
            Property Registration & Map Pinpoint
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <h1 className="text-xl sm:text-2xl font-extrabold">Register a New PG / Coliving Property</h1>
            <p className="text-xs text-slate-300 mt-1">
              Submit exact map coordinates, room details, and amenities. Properties undergo a swift admin verification before going live.
            </p>
          </div>

          {success ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900">Property Registered Successfully!</h2>
              <p className="text-xs text-slate-500">Redirecting you to your owner dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 text-xs">
              {kycVerified === false && (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-amber-950">KYC Clearance Required</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      StaySphere requires Super Admin verification of your PAN and Bank account details before your listings can be approved for live public bookings. You can register your property now, and it will be reviewed alongside your KYC status.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* 1. Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building className="w-4 h-4 text-blue-600" />
                  1. Basic Property Information & Living Type
                </h3>

                {/* Living Space Type Selector */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Living Space Type *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "PG", label: "PG Hostel", desc: "Shared rooms, meals, housekeeping" },
                      { id: "RENTED_ROOM", label: "Private Rented Room", desc: "Independent room with key" },
                      { id: "FLAT", label: "Flat / Apartment", desc: "1BHK, 2BHK, 3BHK flats" },
                      { id: "HOSTEL", label: "Student Hostel", desc: "Near colleges and universities" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPropertyType(t.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          propertyType === t.id
                            ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-600"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs">{t.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">PG / Property Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. StaySphere Elite Luxury Men's PG"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Detailed Description *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe the rooms, food quality, security, power backup, and neighborhood vibe..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender Accommodation Type *</label>
                    <select
                      value={genderPreference}
                      onChange={(e) => setGenderPreference(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    >
                      <option value="BOYS">Boys Only</option>
                      <option value="GIRLS">Girls Only</option>
                      <option value="COED">👫 Unisex / Co-living</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Food / Mess Option *</label>
                    <select
                      value={foodOption}
                      onChange={(e) => setFoodOption(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    >
                      <option value="THREE_MEALS">3 Homestyle Meals Included</option>
                      <option value="TWO_MEALS">🍛 2 Meals (Breakfast & Dinner)</option>
                      <option value="BREAKFAST_ONLY">🍞 Breakfast Only</option>
                      <option value="NONE">No Food (Self-Cooking Kitchen)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Notice Period (Days)</label>
                    <input
                      type="number"
                      value={noticePeriodDays}
                      onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gate Closing Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 11:00 PM"
                      value={gateClosingTime}
                      onChange={(e) => setGateClosingTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Exact Map Location & Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  2. Exact Map Location & Address (Pinpoint)
                </h3>

                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-center justify-between">
                  <span className="font-medium">Quick City Preset (Auto-sets coordinates & state):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Bangalore", "Pune", "Hyderabad", "Gurgaon", "Mumbai"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCityPreset(c)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          city === c ? "bg-blue-600 text-white shadow-xs" : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      required
                      placeholder="Building No, Street Name, Society"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      placeholder="Floor, Wing, Landmark reference"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Locality / Area *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Koramangala 5th Block / Hinjewadi Phase 1"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">State *</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">6-Digit PIN Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 560034"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Latitude (GPS Pin) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Longitude (GPS Pin) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Pricing & Charges */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  3. Pricing & Security Deposit
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Starting Monthly Rent (₹) *</label>
                    <input
                      type="number"
                      required
                      value={startingRent}
                      onChange={(e) => setStartingRent(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Security Deposit (₹) *</label>
                    <input
                      type="number"
                      required
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Maintenance Charges (₹/mo)</label>
                    <input
                      type="number"
                      value={maintenanceCharges}
                      onChange={(e) => setMaintenanceCharges(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Amenities */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Compass className="w-4 h-4 text-purple-600" />
                  4. Property Amenities
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((am) => {
                    const isChecked = selectedAmenityIds.includes(am.id);
                    return (
                      <label
                        key={am.id}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          isChecked ? "bg-blue-50 border-blue-300 font-bold text-blue-900" : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAmenityIds([...selectedAmenityIds, am.id]);
                            } else {
                              setSelectedAmenityIds(selectedAmenityIds.filter((id) => id !== am.id));
                            }
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span>{am.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 5. Property Photos */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Building className="w-4 h-4 text-amber-600" />
                  5. Property Photos (Upload Photos or Add URLs)
                </h3>

                <MediaUploader
                  kind="PHOTO"
                  maxFiles={20}
                  onMediaChange={(items) => {
                    const uploadedUrls = items.map((m) => m.url).filter(Boolean);
                    if (uploadedUrls.length > 0) {
                      setImageUrls((prev) => Array.from(new Set([...uploadedUrls, ...prev])));
                    }
                  }}
                />

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-600">Selected Photo URLs ({imageUrls.length}):</div>
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const updated = [...imageUrls];
                          updated[idx] = e.target.value;
                          setImageUrls(updated);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="url"
                      placeholder="Paste optional external image URL (Unsplash / Cloudinary / S3)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl) {
                          setImageUrls([...imageUrls, newImageUrl]);
                          setNewImageUrl("");
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-200 flex justify-end gap-4">
                <Link
                  href="/owner/dashboard"
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 font-bold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Register & Submit for Verification</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
