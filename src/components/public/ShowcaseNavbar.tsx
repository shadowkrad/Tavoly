import React from "react";
import Link from "next/link";
import { UtensilsCrossed, Lock, CalendarCheck, Clock, MapPin, Phone } from "lucide-react";
import { TenantConfigResponse } from "@/types/taaaac";

interface ShowcaseNavbarProps {
  tenantConfig: TenantConfigResponse;
}

export function ShowcaseNavbar({ tenantConfig }: ShowcaseNavbarProps) {
  const { theme } = tenantConfig;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {theme.restaurantName || "Tavoly"}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                Ristorante & Bar
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {theme.tagline || "Sale, Tavoli & Cucina d'Autore"}
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href="#servizi" className="hover:text-blue-600 transition-colors">
            I Nostri Servizi
          </a>
          <a href="#prenota" className="hover:text-blue-600 transition-colors">
            Prenota un Tavolo
          </a>
          <a href="#contatti" className="hover:text-blue-600 transition-colors">
            Orari & Contatti
          </a>
        </nav>

        {/* CTA & Discreet Login Link */}
        <div className="flex items-center gap-3">
          <a
            href="#prenota"
            className="taaaac-btn-primary text-xs sm:text-sm px-4 py-2"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Prenota Ora</span>
          </a>

          {/* Discreet Staff Login */}
          <Link
            href="/login"
            title="Area Riservata Staff"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
