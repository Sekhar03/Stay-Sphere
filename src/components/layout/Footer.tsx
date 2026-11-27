import React from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-white tracking-tight">StaySphere</span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Verified coliving spaces and paying guest accommodations with 360° virtual room tours and direct bed reservations.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Physically verified rooms</span>
            </div>
          </div>

          {/* Hubs */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-200">
              Popular areas
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/?city=Bhubaneswar&locality=Patia" className="hover:text-slate-200 transition-colors">
                  Patia, Bhubaneswar
                </Link>
              </li>
              <li>
                <Link href="/?city=Bhubaneswar&locality=Khandagiri" className="hover:text-slate-200 transition-colors">
                  Khandagiri, Bhubaneswar
                </Link>
              </li>
              <li>
                <Link href="/?city=Bhubaneswar&locality=Jayadev+Vihar" className="hover:text-slate-200 transition-colors">
                  Jayadev Vihar, Bhubaneswar
                </Link>
              </li>
              <li>
                <Link href="/?city=Bhubaneswar&locality=Chandrasekharpur" className="hover:text-slate-200 transition-colors">
                  Chandrasekharpur, Bhubaneswar
                </Link>
              </li>
            </ul>
          </div>

          {/* Portals */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-200">
              Portals
            </p>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/tenant" className="hover:text-slate-200 transition-colors">
                  Tenant login
                </Link>
              </li>
              <li>
                <Link href="/register?role=PG_OWNER" className="hover:text-slate-200 transition-colors">
                  List property
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-slate-200 transition-colors">
                  Owner & Staff portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-slate-200 transition-colors">
                  Admin panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-200">
              Contact
            </p>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                <span>Patia, Bhubaneswar, Odisha 751024</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>+91 80 4568 2200</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>support@staysphere.in</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} StaySphere Technologies Inc.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link href="/refund-policy" className="hover:text-slate-300 transition-colors">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
