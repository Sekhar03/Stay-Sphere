"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * The public marketing chrome (navbar + footer) should not wrap application
 * portals.  Those screens own their full-viewport layout and use a dark
 * operator theme, so rendering the public header above them looks broken.
 */
const PORTAL_PREFIXES = [
  "/admin",
  "/portal",
  "/dashboard",
  "/owner/dashboard",
  "/owner/properties",
  "/staff/dashboard",
  "/aapkapg",
  "/aapka-pg",
];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isPortal = PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isPortal) {
    return (
      <main className="flex min-h-screen flex-1 flex-col bg-[#070b14]">{children}</main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
