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
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate block leading-tight">
                {brandName}
              </span>
              <span className="hidden md:inline-block text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 shrink-0">
                Ristorante &amp; Bar
              </span>
            </div>
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
          <Link href="/prenotazione" className="hover:text-emerald-700 transition-colors">
            Prenota un Tavolo
          </Link>
          <a href="/#contatti" className="hover:text-emerald-700 transition-colors">
            Orari &amp; Contatti
          </a>
        </nav>

        {/* CTA & Discreet Login Link */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {showMenuLink && (
            <Link
              href="/menu"
              className="text-[11px] sm:text-sm px-2 sm:px-3.5 py-1.5 sm:py-2 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition"
            >
              <UtensilsCrossed className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600 shrink-0" />
              <span className="sm:hidden">Menù</span>
              <span className="hidden sm:inline">Menù Digitale</span>
            </Link>
          )}
          {takeawayEnabled && (
            <Link
              href="/asporto"
              className="text-[11px] sm:text-sm px-2 sm:px-3.5 py-1.5 sm:py-2 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold rounded-xl transition"
            >
              <span className="sm:hidden">🥡 Asporto</span>
              <span className="hidden sm:inline">🥡 Ordina Asporto</span>
            </Link>
          )}
          <Link
            href="/prenotazione"
            style={{ backgroundColor: theme.primaryColor || "#064e3b" }}
            className="text-[11px] sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 shrink-0 text-white font-bold rounded-xl shadow-xs hover:opacity-95 transition"
          >
            <CalendarCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
            <span>Prenota</span>
            <span className="hidden sm:inline">&nbsp;Ora</span>
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
