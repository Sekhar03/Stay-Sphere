"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  MapPin,
  Shield,
  LogOut,
  Menu,
  X,
  Home,
  CheckCircle2,
  ChevronDown,
  User,
  Building,
  ShieldCheck,
  LayoutGrid,
  GraduationCap,
  DoorClosed,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const SPACE_OPTIONS = [
  {
    value: "",
    label: "All Spaces",
    pillLabel: "All Spaces",
    Icon: LayoutGrid,
    href: "/?propertyType=",
    tagline: "All verified living options in the city",
  },
  {
    value: "PG",
    label: "PG Hostels",
    pillLabel: "PG Hostels",
    Icon: Building2,
    href: "/?propertyType=PG",
    tagline: "Boys, Girls & Coed managed PGs with food & WiFi",
  },
  {
    value: "RENTED_ROOM",
    label: "Private Rented Rooms",
    pillLabel: "Private Rented Rooms",
    Icon: DoorClosed,
    href: "/?propertyType=RENTED_ROOM",
    tagline: "Independent single & double rented rooms",
  },
  {
    value: "FLAT",
    label: "Flats & Apartments",
    pillLabel: "Flats & Apartments",
    Icon: Home,
    href: "/?propertyType=FLAT",
    tagline: "1BHK, 2BHK & 3BHK flats and coliving",
  },
  {
    value: "HOSTEL",
    label: "Student Hostels",
    pillLabel: "Student Hostels",
    Icon: GraduationCap,
    href: "/?propertyType=HOSTEL",
    tagline: "Budget student accommodation near campus",
  },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Bhubaneswar");
  const [spacesDropdownOpen, setSpacesDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [currentPropertyType, setCurrentPropertyType] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const loginDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCurrentPropertyType = () => {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        setCurrentPropertyType(sp.get("propertyType") || "");
      }
    };
    updateCurrentPropertyType();
    window.addEventListener("popstate", updateCurrentPropertyType);
    window.addEventListener("staysphere:filter", updateCurrentPropertyType);
    return () => {
      window.removeEventListener("popstate", updateCurrentPropertyType);
      window.removeEventListener("staysphere:filter", updateCurrentPropertyType);
    };
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSpacesDropdownOpen(false);
      }
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setLoginDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSpace = (opt: typeof SPACE_OPTIONS[0]) => {
    setSpacesDropdownOpen(false);
    setMobileMenuOpen(false);
    setCurrentPropertyType(opt.value);
    router.push(opt.href);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("staysphere:filter"));
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const prevRole = currentUser?.role;
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      if (prevRole === "SUPER_ADMIN") {
        router.push("/admin");
      } else if (prevRole === "PG_OWNER" || prevRole === "PG_STAFF") {
        router.push("/owner");
      } else {
        router.push("/tenant");
      }
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-black/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 py-0" style={{ height: "60px" }}>
          {/* Brand & City selector */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="flex items-center gap-2.5 btn-press"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#0077ed] to-[#0071e3] flex items-center justify-center text-white shadow-sm shadow-blue-500/25">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                StaySphere
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1.5 border border-black/[0.06] bg-black/[0.03] px-3 py-1.5 rounded-full text-xs text-slate-600 transition-colors duration-150 focus-within:border-blue-400 focus-within:bg-white">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  router.push(`/?city=${e.target.value}`);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("staysphere:filter"));
                  }
                }}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
              >
                <option value="Bhubaneswar">Bhubaneswar (All)</option>
                <option value="Patia">Patia</option>
                <option value="Chandrasekharpur">Chandrasekharpur</option>
                <option value="Jayadev Vihar">Jayadev Vihar</option>
                <option value="Khandagiri">Khandagiri</option>
                <option value="Saheed Nagar">Saheed Nagar</option>
              </select>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs text-slate-600">
            {/* Living Spaces Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setSpacesDropdownOpen(!spacesDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer btn-press ${
                  spacesDropdownOpen || currentPropertyType
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <span>
                  {currentPropertyType
                    ? SPACE_OPTIONS.find((s) => s.value === currentPropertyType)?.pillLabel || "Living Spaces"
                    : "Living Spaces"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    spacesDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                  }`}
                  style={{ transitionTimingFunction: "var(--ease-out)" }}
                />
              </button>

              {/* Floating Menu Popover — scales from trigger, not center */}
              {spacesDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white p-2 shadow-xl shadow-slate-900/10 border border-slate-200/80 z-50"
                  style={{
                    animation: "popoverIn 180ms var(--ease-out) both",
                    transformOrigin: "top left",
                  }}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Explore Living Options
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {SPACE_OPTIONS.map((opt) => {
                      const isActive = currentPropertyType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectSpace(opt)}
                          className={`w-full flex items-start gap-3 rounded-xl p-2.5 text-left transition-colors duration-100 cursor-pointer btn-press ${
                            isActive
                              ? "bg-blue-50 text-blue-900 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          <opt.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold">{opt.label}</span>
                              {isActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 mt-0.5">
                              {opt.tagline}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/"
              onClick={() => {
                setCurrentPropertyType("");
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("staysphere:filter"));
                }
              }}
              className={`px-3 py-2 rounded-lg transition-colors duration-150 font-medium ${
                pathname === "/" && !currentPropertyType
                  ? "text-slate-900 bg-slate-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              All Stays
            </Link>
            <Link
              href="/#why-us"
              className="px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150"
            >
              How it works
            </Link>
            <Link
              href="/register?role=PG_OWNER"
              className="px-3 py-2 rounded-lg font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors duration-150"
            >
              List your PG / Space
            </Link>
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.role === "SUPER_ADMIN" ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 transition-colors duration-150 hover:bg-slate-200 btn-press"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                ) : currentUser.role === "PG_OWNER" ? (
                  <Link
                    href="/owner/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 transition-colors duration-150 hover:bg-slate-200 btn-press"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Owner portal
                  </Link>
                ) : currentUser.role === "PG_STAFF" ? (
                  <Link
                    href="/staff/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 transition-colors duration-150 hover:bg-slate-200 btn-press"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Staff
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 transition-colors duration-150 hover:bg-slate-200 btn-press"
                  >
                    <Home className="w-3.5 h-3.5" />
                    Resident
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-800">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {currentUser.role.replace("_", " ").toLowerCase()}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-1.5 rounded-lg text-slate-400 transition-colors duration-150 hover:text-slate-700 hover:bg-slate-100 btn-press"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Log in Dropdown */}
                <div className="relative" ref={loginDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                    className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-medium text-slate-700 bg-black/[0.04] hover:bg-black/[0.08] transition-all cursor-pointer btn-press"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    <span>Log in</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                        loginDropdownOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                      style={{ transitionTimingFunction: "var(--ease-out)" }}
                    />
                  </button>

                  {loginDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white/95 backdrop-blur-2xl p-2 shadow-2xl shadow-black/15 border border-black/[0.08] z-50"
                      style={{
                        animation: "popoverIn 180ms var(--ease-out) both",
                        transformOrigin: "top right",
                      }}
                    >
                      <div className="px-3 py-1.5 border-b border-black/[0.05] text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Select Portal
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <Link
                          href="/tenant"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl transition-colors duration-100 text-slate-700 hover:bg-black/[0.04] hover:text-blue-600"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">Tenant Login</div>
                            <div className="text-[10px] text-slate-400">Residents & bookings</div>
                          </div>
                        </Link>

                        <Link
                          href="/owner"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl transition-colors duration-100 text-slate-700 hover:bg-black/[0.04] hover:text-indigo-600"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">Owner & Staff</div>
                            <div className="text-[10px] text-slate-400">Manage rooms & beds</div>
                          </div>
                        </Link>

                        <div className="border-t border-black/[0.05] my-1" />

                        <Link
                          href="/admin"
                          onClick={() => setLoginDropdownOpen(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl transition-colors duration-100 text-slate-600 hover:bg-black/[0.04] hover:text-rose-600"
                        >
                          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">Admin Console</div>
                            <div className="text-[10px] text-slate-400">Super admin governance</div>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href="/register"
                  className="apple-btn-primary inline-flex items-center justify-center py-1.5 px-4 text-xs font-medium text-white shadow-xs btn-press"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150 btn-press"
              aria-label="Toggle navigation menu"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer — Modern iOS Card Sheet design */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 shadow-2xl"
          style={{
            animation: "popoverIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
            transformOrigin: "top center",
          }}
        >
          {/* iOS Section: Living Options Grid */}
          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/60">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Explore Spaces
              </span>
              <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {SPACE_OPTIONS.map((opt) => {
                const isActive = currentPropertyType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectSpace(opt)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                        : "bg-white hover:bg-slate-100/80 text-slate-700 border border-slate-200/50 shadow-xs"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <opt.Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] leading-tight truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200/60 shadow-xs divide-y divide-slate-100">
            <Link
              href="/"
              onClick={() => {
                setCurrentPropertyType("");
                setMobileMenuOpen(false);
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("staysphere:filter"));
                }
              }}
              className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>Explore All Stays</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/#why-us"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <span>How StaySphere Works</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/register?role=PG_OWNER"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50/60 rounded-xl transition-colors"
            >
              <span>List your PG / Property</span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Owner</span>
            </Link>
          </div>

          {/* Portals & Auth Action Card */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-3 gap-2">
              <Link
                href="/tenant"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-1 text-center text-[11px] font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Tenant Login
              </Link>
              <Link
                href="/owner"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-1 text-center text-[11px] font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Owner / Staff
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-1 text-center text-[11px] font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Admin
              </Link>
            </div>

            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              <span>Create Account / Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
