import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "StaySphere | Verified PG & Coliving in Bhubaneswar (Patia, KIIT, Infocity, ITER)",
  description:
    "Find and book fully furnished PGs and coliving spaces in Bhubaneswar with zero brokerage. Explore 360° virtual tours, reserve your specific bed, and pay rent online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased"
        suppressHydrationWarning
      >
        <SiteChrome>{children}</SiteChrome>
        {/* Sonner toast provider — global, appears above everything */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
