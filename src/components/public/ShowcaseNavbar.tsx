import React from "react";
import Link from "next/link";
import { UtensilsCrossed, Lock, CalendarCheck } from "lucide-react";
import { TenantConfigResponse } from "@/types/taaaac";

interface ShowcaseNavbarProps {
  tenantConfig: TenantConfigResponse;
  takeawayEnabled?: boolean;
  showMenuLink?: boolean;
}

export function ShowcaseNavbar({ tenantConfig, takeawayEnabled, showMenuLink = true }: ShowcaseNavbarProps) {
  const { theme } = tenantConfig;
  const brandName = theme.restaurantName || "Tavoly";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand & Name */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 group">
          {theme.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme.logoUrl}
              alt={brandName}
              className="h-8 sm:h-10 w-auto max-w-[120px] sm:max-w-[160px] object-contain rounded-xl shrink-0"
            />
          ) : (
            <div
              style={{ backgroundColor: theme.primaryColor || "#064e3b" }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0"
            >
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate block leading-tight">
              {brandName}
            </span>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate hidden sm:block">
              {theme.tagline || "Sale, Tavoli & Cucina d'Autore"}
            </p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href="/#servizi" className="hover:text-emerald-700 transition-colors">
            I Nostri Servizi
          </a>
          {showMenuLink && (
            <Link href="/menu" className="hover:text-emerald-700 transition-colors inline-flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
              <span>Menù</span>
            </Link>
          )}
          {takeawayEnabled && (
            <Link href="/asporto" className="hover:text-emerald-700 transition-colors">
              Asporto
            </Link>
          )}
          <a href="/#contatti" className="hover:text-emerald-700 transition-colors">
            Orari &amp; Contatti
          </a>
        </nav>

        {/* CTA Minimale & Discreet Login Link */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/prenotazione"
            style={{ backgroundColor: theme.primaryColor || "#064e3b" }}
            className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 whitespace-nowrap flex items-center gap-1.5 shrink-0 text-white font-bold rounded-xl shadow-xs hover:opacity-95 transition"
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Prenota</span>
            <span className="hidden sm:inline">&nbsp;un Tavolo</span>
          </Link>

          {/* Discreet Staff Login */}
          <Link
            href="/login"
            title="Area Riservata Staff"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
