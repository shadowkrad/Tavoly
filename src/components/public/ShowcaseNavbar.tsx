import React from "react";
import Link from "next/link";
import { UtensilsCrossed, Lock, CalendarCheck, Clock, MapPin, Phone } from "lucide-react";
import { TenantConfigResponse } from "@/types/taaaac";

interface ShowcaseNavbarProps {
  tenantConfig: TenantConfigResponse;
  takeawayEnabled?: boolean;
}

export function ShowcaseNavbar({ tenantConfig, takeawayEnabled }: ShowcaseNavbarProps) {
  const { theme } = tenantConfig;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-2">
        {/* Brand & Name */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 group">
          {theme.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme.logoUrl}
              alt={theme.restaurantName || "Tavoly"}
              className="h-8 sm:h-10 w-auto max-w-[120px] sm:max-w-[160px] object-contain rounded-xl shrink-0"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate block leading-tight">
                {theme.restaurantName || "Tavoly"}
              </span>
              <span className="hidden md:inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                Ristorante & Bar
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate hidden sm:block">
              {theme.tagline || "Sale, Tavoli & Cucina d'Autore"}
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href="/#servizi" className="hover:text-blue-600 transition-colors">
            I Nostri Servizi
          </a>
          <Link href="/prenotazione" className="hover:text-blue-600 transition-colors">
            Prenota un Tavolo
          </Link>
          {takeawayEnabled && (
            <Link
              href="/asporto"
              className="hover:text-amber-600 text-amber-700 font-bold transition-colors flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
            >
              <span>🛍️ Ordina Asporto</span>
            </Link>
          )}
          <a href="/#contatti" className="hover:text-blue-600 transition-colors">
            Orari & Contatti
          </a>
        </nav>

        {/* CTA & Discreet Login Link */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/prenotazione"
            className="taaaac-btn-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Prenota Ora</span>
          </Link>

          {/* Discreet Staff Login */}
          <Link
            href="/login"
            title="Area Riservata Staff"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
