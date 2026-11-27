"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  FileText,
  CheckCircle2,
  Loader2,
  MapPin,
  Utensils,
  DollarSign,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  Wifi,
  Wind,
  Zap,
  Shield,
  Coffee,
  Check,
  Image as ImageIcon,
  BedDouble,
  Layers,
  Bath,
  Star,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import MediaUploader, { UploadedMediaItem } from "@/components/media/MediaUploader";
import DocumentUploader from "@/components/ui/DocumentUploader";

const DEFAULT_AMENITIES = [
  { id: "wifi", name: "High-Speed Wi-Fi", icon: Wifi },
  { id: "ac", name: "Air Conditioning", icon: Wind },
  { id: "meals", name: "Three Homestyle Meals", icon: Utensils },
  { id: "power", name: "24/7 Power Backup", icon: Zap },
  { id: "cctv", name: "CCTV Surveillance & Guard", icon: Shield },
  { id: "ro", name: "Multi-Stage RO Water", icon: Coffee },
  { id: "laundry", name: "Washing Machine & Laundry", icon: Sparkles },
  { id: "housekeeping", name: "Daily Housekeeping", icon: Sparkles },
  { id: "parking", name: "Two-Wheeler & Car Parking", icon: Building },
  { id: "geyser", name: "24/7 Hot Water Geyser", icon: Zap },
];




function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultRole = searchParams?.get("role") || "CUSTOMER_TENANT";

  // Role: CUSTOMER_TENANT | PG_OWNER
  const [role, setRole] = useState(defaultRole);

  // Synchronize role from query parameters
  useEffect(() => {
    const roleParam = searchParams?.get("role");
    if (roleParam === "PG_OWNER" || roleParam === "CUSTOMER_TENANT") {
      setRole(roleParam);
    }
  }, [searchParams]);

  // Dynamic step navigation:
  // Tenant: Step 1 (Account) -> Step 2 (KYC) -> Step 3 (Success / Pending Approval)
  // Owner: Step 1 (Account) -> Step 2 (KYC & Bank) -> Step 3 (Rent Home & Photos) -> Step 4 (Success / Pending Approval)
  const [step, setStep] = useState<number>(1);

  // STEP 1: Account Credentials
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  // STEP 2: Owner KYC & Banking Details
  const [panNumber, setPanNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [kycDocUrl, setKycDocUrl] = useState("");

  // STEP 2: Tenant KYC Details
  const [idProofType, setIdProofType] = useState("Aadhaar Card");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [idProofDocUrl, setIdProofDocUrl] = useState("");

  // STEP 3 (Owner): Rent Home Property Details, Facilities & Photos
  const [propertyName, setPropertyName] = useState("");
  const [propertyDescription, setPropertyDescription] = useState("");
  const [propertyType, setPropertyType] = useState<"PG" | "RENTED_ROOM" | "FLAT" | "HOSTEL">("PG");
  const [genderPreference, setGenderPreference] = useState<"BOYS" | "GIRLS" | "COED">("COED");
  const [foodOption, setFoodOption] = useState<"NONE" | "BREAKFAST_ONLY" | "TWO_MEALS" | "THREE_MEALS">("THREE_MEALS");
  const [startingRent, setStartingRent] = useState(8500);
  const [securityDeposit, setSecurityDeposit] = useState(15000);
  const [maintenanceCharges, setMaintenanceCharges] = useState(0);
  const [electricityCharges, setElectricityCharges] = useState("As per sub-meter consumption");
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);
  const [gateClosingTime, setGateClosingTime] = useState("22:30");

  // Address & Exact Map Location (GPS coordinates)
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState(12.9352);
  const [longitude, setLongitude] = useState(77.6245);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [tcAccepted, setTcAccepted] = useState(false);

  // Quick City Coordinate presets for Owner signup map pin
  const handleCityPreset = (selectedCity: string) => {
    setCity(selectedCity);
    if (selectedCity === "Bangalore") {
      setLatitude(12.9352);
      setLongitude(77.6245);
      setState("Karnataka");
      setPincode("560034");
    } else if (selectedCity === "Pune") {
      setLatitude(18.5912);
      setLongitude(73.7389);
      setState("Maharashtra");
      setPincode("411057");
    } else if (selectedCity === "Hyderabad") {
      setLatitude(17.4401);
      setLongitude(78.3489);
      setState("Telangana");
      setPincode("500081");
    } else if (selectedCity === "Gurgaon" || selectedCity === "Delhi NCR") {
      setLatitude(28.4950);
      setLongitude(77.0895);
      setState("Haryana");
      setPincode("122002");
    } else if (selectedCity === "Mumbai") {
      setLatitude(19.1136);
      setLongitude(72.8697);
      setState("Maharashtra");
      setPincode("400069");
    }
  };

  // Detect current GPS location
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setDetectingLocation(false);
      },
      (err) => {
        console.warn("Geolocation error:", err);
        setDetectingLocation(false);
        alert("Could not access your location. Please check browser permissions or set coordinates manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Features & Facilities (Amenities)
  const [availableAmenities, setAvailableAmenities] = useState<any[]>(DEFAULT_AMENITIES);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>(["wifi", "ac", "meals", "power", "cctv", "ro"]);

  // Photos — managed by MediaUploader
  const [images, setImages] = useState<string[]>([]);
  const [uploadedMediaItems, setUploadedMediaItems] = useState<UploadedMediaItem[]>([]);
  const [propertyDocUrl, setPropertyDocUrl] = useState("");


  // Room & Bed Configuration (Owner Step 3)
  type RoomConfig = {
    roomNumber: string;
    floorNumber: number;
    sharingType: "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR_PLUS";
    bedCount: number;
    monthlyRent: number;
    securityDeposit: number;
    hasAttachedBath: boolean;
    hasBalcony: boolean;
    hasAirCondition: boolean;
  };
  const [rooms, setRooms] = useState<RoomConfig[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [addRoomForm, setAddRoomForm] = useState<RoomConfig>({
    roomNumber: "",
    floorNumber: 0,
    sharingType: "DOUBLE",
    bedCount: 2,
    monthlyRent: 8500,
    securityDeposit: 15000,
    hasAttachedBath: false,
    hasBalcony: false,
    hasAirCondition: false,
  });

  // Food Menu Configuration (Owner Step 3 - if food is available)
  const [menuItems, setMenuItems] = useState<{
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  }>({
    breakfast: ["Steamed Rice Cakes & Lentil Soup", "Crispy Crepes", "Flattened Rice / Semolina Upma", "Filter Coffee / Tea"],
    lunch: ["Steamed Rice", "Spiced Lentil Curry", "Seasonal Stir-fry Vegetables", "Fresh Flatbreads", "Yogurt & Pickle"],
    dinner: ["Soft Wheat Flatbreads", "Cottage Cheese Butter Curry", "Creamy Black Lentil Dal", "Cumin Rice", "Green Salad"],
    snacks: ["Evening Tea / Coffee", "Biscuits & Hot Snacks"],
  });
  const [newDishInput, setNewDishInput] = useState<{
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  }>({
    breakfast: "",
    lunch: "",
    dinner: "",
    snacks: "",
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Fetch real amenities from database
  useEffect(() => {
    fetch("/api/amenities")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.amenities && data.amenities.length > 0) {
          setAvailableAmenities(data.amenities);
          setSelectedAmenityIds(data.amenities.slice(0, 6).map((a: any) => a.id));
        }
      })
      .catch(() => {});
  }, []);

  const totalSteps = role === "PG_OWNER" ? 3 : 2;

  // Toggle amenity selection
  const toggleAmenity = (id: string) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };


  // Add a room
  const handleAddRoom = () => {
    if (!addRoomForm.roomNumber.trim()) return;
    setRooms((prev) => [...prev, { ...addRoomForm, roomNumber: addRoomForm.roomNumber.trim() }]);
    setAddRoomForm({
      roomNumber: "",
      floorNumber: 0,
      sharingType: "DOUBLE",
      bedCount: 2,
      monthlyRent: startingRent || 8500,
      securityDeposit: securityDeposit || 15000,
      hasAttachedBath: false,
      hasBalcony: false,
      hasAirCondition: false,
    });
    setShowAddRoom(false);
  };

  // Remove a room
  const handleRemoveRoom = (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const sharingTypeLabel: Record<string, string> = {
    SINGLE: "Single (1 bed)",
    DOUBLE: "Double (2 beds)",
    TRIPLE: "Triple (3 beds)",
    FOUR_PLUS: "4+ Sharing",
  };

  const floorLabel = (n: number) => {
    if (n === 0) return "Ground Floor";
    if (n === 1) return "1st Floor";
    if (n === 2) return "2nd Floor";
    if (n === 3) return "3rd Floor";
    return `${n}th Floor`;
  };

  // Dish handlers
  const handleAddDish = (meal: "breakfast" | "lunch" | "dinner" | "snacks") => {
    const val = newDishInput[meal]?.trim();
    if (val && !menuItems[meal].includes(val)) {
      setMenuItems((prev) => ({
        ...prev,
        [meal]: [...prev[meal], val],
      }));
      setNewDishInput((prev) => ({ ...prev, [meal]: "" }));
    }
  };

  const handleRemoveDish = (meal: "breakfast" | "lunch" | "dinner" | "snacks", index: number) => {
    setMenuItems((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((_, i) => i !== index),
    }));
  };


  // Step 1 Validation & Next
  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.trim() || !email.includes("@")) return setError("Please enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters long.");
    
    // Auto-fill bank account name if owner
    if (role === "PG_OWNER" && !bankAccountName) {
      setBankAccountName(name);
    }
    if (role === "PG_OWNER" && !propertyName) {
      setPropertyName(companyName ? `${companyName}` : `${name}'s Living Space`);
    }

    setStep(2);
  };

  // Step 2 Validation for Owner
  const handleOwnerStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!panNumber.trim()) return setError("PAN Card Number is required for verification.");
    if (!bankAccountNumber.trim() || !bankIfscCode.trim()) {
      return setError("Bank Account Number and IFSC Code are required for rent payouts.");
    }
    setStep(3);
  };

  // Step 2 Submission for Tenant (Final for Tenant)
  const handleTenantFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!idProofNumber.trim()) return setError("Government ID proof number is required.");
    if (!tcAccepted) return setError("Please review and accept the Terms & Conditions and Resident House Rules to continue.");

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role: "CUSTOMER_TENANT",
        idProofType,
        idProofNumber: idProofNumber.trim(),
        emergencyContact: emergencyContact.trim() || undefined,
        idProofDocumentUrl: idProofDocUrl.trim() || undefined,
        tcAccepted: true,
        tcVersion: "v1.0-2026",
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register account.");
      }

      setRegisteredEmail(email.trim());
      // Advance to success pending approval screen
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submission for Owner (Final for Owner)
  const handleOwnerFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!propertyName.trim()) return setError("Rent home / PG name is required.");
    if (!addressLine1.trim() || !locality.trim() || !city.trim()) {
      return setError("Property address, locality, and city are required.");
    }
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return setError("Valid GPS map latitude and longitude coordinates are required.");
    }
    if (images.length === 0) {
      return setError("Please add at least 1 rent home photo.");
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
        role: "PG_OWNER",
        companyName: companyName.trim() || propertyName.trim(),
        // Owner KYC
        panNumber: panNumber.trim().toUpperCase(),
        gstNumber: gstNumber.trim().toUpperCase() || undefined,
        bankAccountName: bankAccountName.trim() || name.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        bankIfscCode: bankIfscCode.trim().toUpperCase(),
        kycDocUrl: kycDocUrl.trim() || propertyDocUrl.trim() || undefined,
        // Property details
        propertyName: propertyName.trim(),
        propertyDescription: propertyDescription.trim() || undefined,
        propertyType,
        genderPreference,
        foodOption,
        startingRent: Number(startingRent),
        securityDeposit: Number(securityDeposit),
        maintenanceCharges: Number(maintenanceCharges),
        electricityCharges,
        noticePeriodDays: Number(noticePeriodDays),
        gateClosingTime,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        locality: locality.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim() || "560034",
        latitude: Number(latitude),
        longitude: Number(longitude),
        amenityIds: selectedAmenityIds,
        images,
        propertyDocUrl: propertyDocUrl.trim() || undefined,
        rooms: rooms.length > 0 ? rooms : undefined,
        menuItems: foodOption !== "NONE" ? menuItems : undefined,
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit property and owner registration.");
      }

      setRegisteredEmail(email.trim());
      // Advance to success pending approval screen
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your entries.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS SCREEN (Pending Admin Approval)
  const isSuccessScreen =
    (role === "CUSTOMER_TENANT" && step === 3) || (role === "PG_OWNER" && step === 4);

  if (isSuccessScreen) {
    return (
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-slate-200/50 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            Application Received Successfully
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account Submitted for Admin Approval
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            All your registration details and KYC documentation have been submitted to the StaySphere verification desk.
          </p>
        </div>

        {/* Verification Timeline Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-3.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>What happens next?</span>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-slate-900">Admin Document Review:</strong> Our administrative compliance team inspects your identity proofs, banking payout details{role === "PG_OWNER" ? ", rent home photos, and property features" : ""}.
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-slate-900">Login Details Sent to Email:</strong> Once approved, an official activation confirmation containing your login details and direct portal access will be delivered to:
                <div className="mt-1 font-mono font-bold text-blue-600 bg-white border border-blue-200 rounded-lg px-2.5 py-1 text-xs inline-block">
                  {registeredEmail || email}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-slate-900">Full Platform Access:</strong> You can then sign in securely to {role === "PG_OWNER" ? "your Owner Portal to manage beds and payouts" : "your Resident Dashboard to book stays and pay rent"}.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={role === "PG_OWNER" ? "/owner" : "/tenant"}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm text-center"
          >
            {role === "PG_OWNER" ? "Go to Owner Sign In" : "Go to Tenant Sign In"}
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full apple-card p-6 sm:p-10 space-y-6 modal-enter">
      {/* Top Header */}
      <div className="text-center space-y-2.5">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mx-auto shadow-sm">
          {step === 1 ? (
            <Building2 className="w-6 h-6 text-white" />
          ) : step === 2 ? (
            <ShieldCheck className="w-6 h-6 text-white" />
          ) : (
            <Building className="w-6 h-6 text-white" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {step === 1
            ? "Create an Account"
            : step === 2
            ? role === "PG_OWNER"
              ? "Owner KYC & Banking Setup"
              : "Resident ID Verification"
            : "Rent Home Details, Facilities & Photos"}
        </h2>

        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {step === 1
            ? "Join StaySphere for verified coliving stays and seamless property management"
            : step === 2
            ? role === "PG_OWNER"
              ? "Step 2 of 3: Submit identity & payout bank credentials for administrator approval"
              : "Step 2 of 2: Submit government identification for swift admin clearance"
            : "Step 3 of 3: Provide rent home photos, facility features & pricing"}
        </p>

        {/* Progress Bar - Apple Segmented Style */}
        <div className="pt-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 p-1 bg-black/[0.04] rounded-full text-xs font-semibold">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              step >= 1 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-black/10 text-slate-600"
              }`}>
                1
              </span>
              <span>Account</span>
            </div>

            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              step >= 2 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-black/10 text-slate-600"
              }`}>
                2
              </span>
              <span>KYC</span>
            </div>

            {role === "PG_OWNER" && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step >= 3 ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step >= 3 ? "bg-blue-600 text-white" : "bg-black/10 text-slate-600"
                }`}>
                  3
                </span>
                <span>Rent Home</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 1: BASIC ACCOUNT FORM (Both Roles)                   */}
      {/* ========================================================= */}
      {step === 1 && (
        <form onSubmit={handleStep1Next} className="space-y-4">
          {/* Role selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER_TENANT")}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 btn-press ${
                role === "CUSTOMER_TENANT"
                  ? "border-blue-600/40 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20 text-blue-950"
                  : "border-black/[0.08] bg-black/[0.02] hover:bg-white text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-2.5 rounded-xl transition-colors ${
                    role === "CUSTOMER_TENANT" ? "bg-blue-600 text-white" : "bg-black/[0.06] text-slate-600"
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                {role === "CUSTOMER_TENANT" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 tracking-tight">I'm looking for a PG</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Explore verified rooms, take 360° tours & book instantly.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("PG_OWNER")}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 btn-press ${
                role === "PG_OWNER"
                  ? "border-blue-600/40 bg-blue-50/50 shadow-sm ring-1 ring-blue-500/20 text-blue-950"
                  : "border-black/[0.08] bg-black/[0.02] hover:bg-white text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`p-2.5 rounded-xl transition-colors ${
                    role === "PG_OWNER" ? "bg-blue-600 text-white" : "bg-black/[0.06] text-slate-600"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                {role === "PG_OWNER" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 tracking-tight">I own a PG / Rent Home</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  List properties, upload photos, manage occupancy & payouts.
                </p>
              </div>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohit Sharma"
                className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rohit@example.com"
                className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your login approval notification and credentials will be sent to this email address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          {role === "PG_OWNER" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                PG / Business Brand Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Royal Orchid Living & Coliving"
                  className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password (Min 8 Characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/[0.03] border border-black/[0.08] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="apple-btn-primary w-full py-3 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>Continue to KYC & Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* STEP 2: TENANT KYC FORM                                   */}
      {/* ========================================================= */}
      {step === 2 && role === "CUSTOMER_TENANT" && (
        <form onSubmit={handleTenantFinalSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              All KYC documentation is verified by StaySphere administrators before granting full platform access.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Government ID Proof Type *
            </label>
            <select
              value={idProofType}
              onChange={(e) => setIdProofType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Passport">Passport</option>
              <option value="Voter ID">Voter ID</option>
              <option value="Driving License">Driving License</option>
              <option value="College Student ID">College Student ID</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              ID Proof Document Number *
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={idProofNumber}
                onChange={(e) => setIdProofNumber(e.target.value)}
                placeholder="e.g. 1234 5678 9012"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Emergency Contact Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 94371 11222 (Parent / Guardian)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <DocumentUploader
            label="Upload ID Proof Document (Aadhaar / Passport / Voter ID)"
            helperText="Upload PDF, JPG, PNG or WebP document (up to 15MB)"
            value={idProofDocUrl}
            onChange={setIdProofDocUrl}
            purpose="KYC"
          />

          {/* Terms & Conditions Acceptance Checkbox */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={tcAccepted}
                onChange={(e) => setTcAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                I have read and accept the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-bold text-blue-600 hover:underline"
                >
                  StaySphere Terms &amp; Conditions
                </Link>{" "}
                and Coliving Resident Rules. I acknowledge that my ID proof and details will be shared with the PG owner/operator for verification and approval.
              </span>
            </label>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Digital agreement timestamp &amp; version will be logged for owner verification.</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Registration...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit for Admin Approval</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* STEP 2: OWNER KYC & BANKING FORM                          */}
      {/* ========================================================= */}
      {step === 2 && role === "PG_OWNER" && (
        <form onSubmit={handleOwnerStep2Next} className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              StaySphere requires verified PAN and bank account credentials for compliant rent payouts and automated billing.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Owner PAN Card Number *
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              GSTIN (Optional)
            </label>
            <input
              type="text"
              maxLength={15}
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 29ABCDE1234F1Z5"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 mb-2">Bank Details for Direct Rent Payouts</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Account Beneficiary Name *
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  placeholder="Name as per bank passbook"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="11-16 digits"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Bank IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    value={bankIfscCode}
                    onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <DocumentUploader
            label="Upload Owner ID / Electricity Bill Proof Document"
            helperText="Upload PDF, JPG, PNG or WebP document (up to 15MB)"
            value={kycDocUrl}
            onChange={setKycDocUrl}
            purpose="KYC"
          />

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Rent Home Details & Photos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* STEP 3: OWNER RENT HOME DETAILS, PHOTOS & FACILITIES     */}
      {/* ========================================================= */}
      {step === 3 && role === "PG_OWNER" && (
        <form onSubmit={handleOwnerFinalSubmit} className="space-y-5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2">
            <Building className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              All rent home photos, documentation, and facility features submitted here will be displayed in detail in the Admin Panel for approval.
            </span>
          </div>

          {/* Section 1: Property Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
              1. Rent Home / PG Basic Details
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Property / Rent Home Name *
              </label>
              <input
                type="text"
                required
                value={propertyName}
                onChange={(e) => setPropertyName(e.target.value)}
                placeholder="e.g. Royal Orchid Luxury PG & Coliving"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="PG">PG (Paying Guest)</option>
                  <option value="RENTED_ROOM">Rented Room</option>
                  <option value="FLAT">Flat / Apartment</option>
                  <option value="HOSTEL">Hostel</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender Allowed</label>
                <select
                  value={genderPreference}
                  onChange={(e) => setGenderPreference(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="COED">Co-Ed (All)</option>
                  <option value="BOYS">Boys Only</option>
                  <option value="GIRLS">Girls Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Food Facility</label>
                <select
                  value={foodOption}
                  onChange={(e) => setFoodOption(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  <option value="THREE_MEALS">Three Meals (Breakfast, Lunch, Dinner)</option>
                  <option value="TWO_MEALS">Two Meals (Breakfast & Dinner)</option>
                  <option value="BREAKFAST_ONLY">Breakfast Only</option>
                  <option value="NONE">Self Cooking / None</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Property Description
              </label>
              <textarea
                rows={2}
                value={propertyDescription}
                onChange={(e) => setPropertyDescription(e.target.value)}
                placeholder="Mention nearby tech parks, colleges, metro stations and highlights..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Food Menu Section if Food is Available */}
            {foodOption !== "NONE" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                      <Utensils className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        Daily Food &amp; Dining Menu
                      </h4>
                      <p className="text-[10px] text-amber-700">
                        Specify dishes served to residents for each meal · Shown to admin and prospective tenants
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                    {foodOption === "THREE_MEALS"
                      ? "3 Meals + Snacks"
                      : foodOption === "TWO_MEALS"
                      ? "Breakfast & Dinner"
                      : "Breakfast Only"}
                  </span>
                </div>

                <div className="space-y-3">
                  {(
                    [
                      {
                        key: "breakfast" as const,
                        title: "Breakfast Menu",
                        emoji: "",
                        time: "7:30 AM – 9:30 AM",
                        presets: ["Steamed Rice Cakes & Lentil Soup", "Crispy Crepes", "Flattened Rice Flakes", "Fried Bread with Potato Curry", "Stuffed Flatbread", "Tea & Coffee"],
                      },
                      ...(foodOption === "THREE_MEALS"
                        ? [
                            {
                              key: "lunch" as const,
                              title: "Lunch Menu",
                              emoji: "",
                              time: "12:30 PM – 2:30 PM",
                              presets: ["Steamed Rice", "Yellow Lentil Curry", "Flatbreads", "Mixed Vegetable Curry", "Fresh Yogurt", "Pickle"],
                            },
                          ]
                        : []),
                      ...(foodOption === "THREE_MEALS" || foodOption === "TWO_MEALS"
                        ? [
                            {
                              key: "dinner" as const,
                              title: "Dinner Menu",
                              emoji: "",
                              time: "7:30 PM – 9:30 PM",
                              presets: ["Fresh Whole Wheat Flatbreads", "Cottage Cheese Curry", "Black Lentil Stew", "Cumin Rice", "Salad"],
                            },
                          ]
                        : []),
                      {
                        key: "snacks" as const,
                        title: "Evening Snacks & Beverages",
                        emoji: "",
                        time: "4:30 PM – 5:30 PM",
                        presets: ["Evening Tea / Coffee", "Biscuits", "Savory Pastries", "Crispy Vegetable Fritters", "Potato Sliders"],
                      },
                    ]
                  ).map((meal) => (
                    <div
                      key={meal.key}
                      className="rounded-xl border border-amber-200/80 bg-white p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{meal.emoji}</span>
                          <span>{meal.title}</span>
                          <span className="text-[10px] font-normal text-slate-500">({meal.time})</span>
                        </span>
                        <span className="text-[10px] font-semibold text-amber-800">
                          {menuItems[meal.key].length} item{menuItems[meal.key].length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Dish chips */}
                      <div className="flex flex-wrap gap-1.5 min-h-6">
                        {menuItems[meal.key].map((dish, dIdx) => (
                          <span
                            key={dIdx}
                            className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg px-2 py-0.5 text-xs font-medium"
                          >
                            <span>{dish}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDish(meal.key, dIdx)}
                              className="text-amber-600 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                              title="Remove dish"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {menuItems[meal.key].length === 0 && (
                          <span className="text-[11px] text-slate-400 italic">No dishes added yet</span>
                        )}
                      </div>

                      {/* Add dish input & Quick presets */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newDishInput[meal.key]}
                          onChange={(e) =>
                            setNewDishInput((prev) => ({ ...prev, [meal.key]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddDish(meal.key);
                            }
                          }}
                          placeholder={`Add dish to ${meal.title.toLowerCase()}...`}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddDish(meal.key)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      </div>

                      {/* Quick Add Presets */}
                      <div className="flex flex-wrap items-center gap-1 pt-0.5">
                        <span className="text-[10px] text-slate-400">Quick add:</span>
                        {meal.presets.map((preset) => {
                          const alreadyAdded = menuItems[meal.key].includes(preset);
                          if (alreadyAdded) return null;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setMenuItems((prev) => ({
                                  ...prev,
                                  [meal.key]: [...prev[meal.key], preset],
                                }));
                              }}
                              className="text-[10px] bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 rounded px-1.5 py-0.5 border border-slate-200 transition-colors cursor-pointer"
                            >
                              + {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Address & Location */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
              2. Complete Location & Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Street / Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="#124, 5th Cross, 7th Main"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Locality / Landmark *</label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Koramangala 4th Block, Near Forum"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Bangalore"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">State & PIN Code</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="560034"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Exact Google Map Location & GPS Coordinates */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-4 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Exact Google Map Location &amp; GPS Pinpoint *</h4>
                    <p className="text-[11px] text-slate-500">
                      Helps tenants calculate commute distance and navigate directly to your PG gate via Google Maps.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={detectingLocation}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting GPS...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pin Current Location</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick City Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-600 mr-1">Quick City Coordinates:</span>
                {["Bangalore", "Pune", "Hyderabad", "Gurgaon", "Mumbai"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCityPreset(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      city.toLowerCase() === c.toLowerCase()
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Exact Lat / Lng Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Latitude (e.g. 12.9352) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Longitude (e.g. 77.6245) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Live Interactive Google Map Preview */}
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                <div className="p-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Live Google Map Preview: {locality || addressLine1 || "Selected PG Location"}, {city}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open in Maps ↗
                  </a>
                </div>
                <div className="relative w-full h-[220px] bg-slate-100">
                  <iframe
                    title="Exact PG Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${latitude},${longitude}&hl=en;z=15&output=embed`}
                  />
                </div>
                <div className="p-2 bg-slate-50 text-[10px] text-slate-500 text-center border-t border-slate-200">
                  Exact GPS Pinpoint: {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)} · Ready for Tenant Route &amp; Distance Matrix
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Terms */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
              3. Pricing & Terms
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Starting Rent (₹/mo) *</label>
                <input
                  type="number"
                  required
                  value={startingRent}
                  onChange={(e) => setStartingRent(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Security Deposit (₹) *</label>
                <input
                  type="number"
                  required
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notice Period (Days)</label>
                <input
                  type="number"
                  value={noticePeriodDays}
                  onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gate Closing</label>
                <input
                  type="text"
                  value={gateClosingTime}
                  onChange={(e) => setGateClosingTime(e.target.value)}
                  placeholder="22:30"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Room & Bed Configuration */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-indigo-600" />
                4. Room &amp; Bed Configuration
                {rooms.length > 0 && (
                  <span className="ml-1 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5">
                    {rooms.length} room{rooms.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRoom((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {showAddRoom ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddRoom ? "Cancel" : "Add Room"}
              </button>
            </div>

            {/* Configured rooms list */}
            {rooms.length > 0 && (
              <div className="space-y-2">
                {rooms.map((room, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-slate-900">Room {room.roomNumber}</span>
                        <span className="rounded-md bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5">
                          {floorLabel(room.floorNumber)}
                        </span>
                        <span className="rounded-md bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5">
                          {sharingTypeLabel[room.sharingType] || room.sharingType}
                        </span>
                        <span className="rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5">
                          {room.bedCount} bed{room.bedCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
                        <span>&#8377;{room.monthlyRent.toLocaleString("en-IN")}/mo</span>
                        <span>Deposit: &#8377;{room.securityDeposit.toLocaleString("en-IN")}</span>
                        {room.hasAttachedBath && <span className="text-teal-600 font-semibold">Attached Bath</span>}
                        {room.hasBalcony && <span className="text-sky-600 font-semibold">Balcony</span>}
                        {room.hasAirCondition && <span className="text-blue-600 font-semibold">AC</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Room Form */}
            {showAddRoom && (
              <div className="rounded-xl border border-indigo-200 bg-white p-4 space-y-3 shadow-sm">
                <p className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> New Room Details
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Room No. *</label>
                    <input
                      type="text"
                      value={addRoomForm.roomNumber}
                      onChange={(e) => setAddRoomForm((f) => ({ ...f, roomNumber: e.target.value }))}
                      placeholder="101, 201, A1..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Floor</label>
                    <select
                      value={addRoomForm.floorNumber}
                      onChange={(e) => setAddRoomForm((f) => ({ ...f, floorNumber: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                    >
                      <option value={0}>Ground Floor</option>
                      <option value={1}>1st Floor</option>
                      <option value={2}>2nd Floor</option>
                      <option value={3}>3rd Floor</option>
                      <option value={4}>4th Floor</option>
                      <option value={5}>5th Floor</option>
                      <option value={6}>6th Floor+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Occupancy Type</label>
                    <select
                      value={addRoomForm.sharingType}
                      onChange={(e) => {
                        const st = e.target.value as "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR_PLUS";
                        const autoCount = st === "SINGLE" ? 1 : st === "DOUBLE" ? 2 : st === "TRIPLE" ? 3 : 4;
                        setAddRoomForm((f) => ({ ...f, sharingType: st, bedCount: autoCount }));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="SINGLE">Single Occupancy</option>
                      <option value="DOUBLE">Double Sharing</option>
                      <option value="TRIPLE">Triple Sharing</option>
                      <option value="FOUR_PLUS">4+ Sharing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">No. of Beds</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={addRoomForm.bedCount}
                      onChange={(e) => setAddRoomForm((f) => ({ ...f, bedCount: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Rent (&#8377;)</label>
                    <input
                      type="number"
                      value={addRoomForm.monthlyRent}
                      onChange={(e) => setAddRoomForm((f) => ({ ...f, monthlyRent: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Security Deposit (&#8377;)</label>
                    <input
                      type="number"
                      value={addRoomForm.securityDeposit}
                      onChange={(e) => setAddRoomForm((f) => ({ ...f, securityDeposit: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {(
                    [
                      { key: "hasAttachedBath", label: "Attached Bathroom", emoji: "" },
                      { key: "hasBalcony", label: "Balcony", emoji: "" },
                      { key: "hasAirCondition", label: "Air Conditioning", emoji: "" },
                    ] as const
                  ).map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAddRoomForm((f) => ({ ...f, [key]: !f[key] }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        addRoomForm[key]
                          ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                      {addRoomForm[key] && <Check className="w-3 h-3 text-indigo-600" />}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddRoom}
                  disabled={!addRoomForm.roomNumber.trim()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Room {addRoomForm.roomNumber ? `"${addRoomForm.roomNumber}"` : ""}
                </button>
              </div>
            )}

            {rooms.length === 0 && !showAddRoom && (
              <p className="rounded-xl border border-dashed border-slate-200 py-4 text-center text-[11px] text-slate-400">
                No rooms configured yet — click <strong>Add Room</strong> above to configure individual rooms, beds, floor &amp; amenities, or leave blank for a default single room.
              </p>
            )}
          </div>

          {/* Section 5: Features & Facilities (Amenities) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                5. Features &amp; Facilities (Select all that apply)
              </h3>
              <span className="text-[11px] font-semibold text-blue-600">
                {selectedAmenityIds.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {availableAmenities.map((amenity) => {
                const isSelected = selectedAmenityIds.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                        : "border-slate-200 bg-slate-50 hover:bg-white text-slate-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 text-white ${
                        isSelected ? "bg-blue-600" : "bg-slate-300"
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : null}
                    </div>
                    <span className="truncate">{amenity.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Rent Home Photos — Real Upload */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>6. Rent Home Photos ({uploadedMediaItems.length} uploaded)</span>
              </h3>
              <span className="text-[10px] text-slate-500">First uploaded photo becomes Cover Photo</span>
            </div>

            <MediaUploader
              kind="PHOTO"
              maxFiles={30}
              onMediaChange={(items) => {
                setUploadedMediaItems(items);
                // Keep images[] in sync for submission (store URLs)
                setImages(items.map((m) => m.url).filter(Boolean) as string[]);
              }}
            />
          </div>


          {/* Section 7: Property Documentation Proof */}
          <div className="pt-2">
            <DocumentUploader
              label="7. Property Ownership / Rent Agreement / Electricity Bill Document"
              helperText="Upload PDF or scanned document proof (up to 15MB)"
              value={propertyDocUrl}
              onChange={setPropertyDocUrl}
              purpose="PROPERTY_DOCUMENT"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Owner Application & Property Details...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Submit Owner & Property for Admin Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Already have an account?{" "}
        <Link
          href={role === "PG_OWNER" ? "/owner" : "/tenant"}
          className="text-blue-600 hover:underline font-bold"
        >
          {role === "PG_OWNER" ? "Sign in to Owner Portal" : "Sign in to Tenant Portal"}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#f5f5f7]">
      <Suspense fallback={<div className="text-xs text-slate-500">Loading registration...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
