import React from "react";
import { UtensilsCrossed, MessageSquare, Award, RefreshCw, CheckCircle2, ShieldAlert, AlertCircle } from "lucide-react";
import { TenantConfigResponse, AddonModule } from "@/types/taaaac";

interface HeaderProps {
  tenantConfig: TenantConfigResponse;
}

const MODULE_LABELS: Record<AddonModule, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  WHATSAPP_REMINDERS: { label: "WhatsApp Bot", icon: MessageSquare },
  LOYALTY_CARD: { label: "Loyalty Card", icon: Award },
  VENDOLY_CHANNEL_MANAGER: { label: "Vendoly Sync", icon: RefreshCw },
  DIGITAL_MENU_SYNC: { label: "Menu Digitale", icon: UtensilsCrossed },
  ADVANCED_ANALYTICS: { label: "Analytics Pro", icon: RefreshCw },
};

export function Header({ tenantConfig }: HeaderProps) {
  const { theme, licenseStatus, enabledModules, domain } = tenantConfig;

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {theme.restaurantName || "Tavoly"}
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                Taaaac Ecosystem
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {theme.tagline || "Gestione Sale & Prenotazioni Smart"} • <span className="text-slate-400">{domain}</span>
            </p>
          </div>
        </div>

        {/* Status & Add-on Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* License Status Badge */}
          <div
            className={`taaaac-badge border ${
              licenseStatus === "ATTIVO"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : licenseStatus === "IN_SCADENZA"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {licenseStatus === "ATTIVO" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : licenseStatus === "IN_SCADENZA" ? (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            )}
            <span>Licenza {licenseStatus}</span>
          </div>

          {/* Add-ons Modules Badges */}
          {enabledModules.map((mod) => {
            const info = MODULE_LABELS[mod];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <div
                key={mod}
                className="taaaac-badge bg-slate-100 text-slate-700 border border-slate-200/80"
                title={`Modulo Taaaac Core abilitato: ${mod}`}
              >
                <Icon className="w-3.5 h-3.5 text-blue-600" />
                <span>{info.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
