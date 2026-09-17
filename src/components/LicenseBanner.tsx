import React from "react";
import { AlertTriangle, ShieldAlert, ExternalLink } from "lucide-react";
import { LicenseStatus } from "@/types/taaaac";

interface LicenseBannerProps {
  status: LicenseStatus;
  expiresAt?: string;
}

export function LicenseBanner({ status, expiresAt }: LicenseBannerProps) {
  if (status === "ATTIVO") {
    return null;
  }

  if (status === "SOSPESO") {
    return (
      <div className="bg-red-500 text-white px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-white" />
            <p className="text-sm font-medium">
              <span className="font-bold">Attenzione:</span> La licenza per questa istanza Tavoly risulta <strong>SOSPESA</strong> su Taaaac Core. Alcune funzionalità potrebbero essere limitate.
            </p>
          </div>
          <a
            href="https://taaaac.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-50 inline-flex items-center gap-1 transition-all"
          >
            Gestisci su Taaaac Core
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-white" />
          <p className="text-xs sm:text-sm font-medium">
            La licenza Taaaac per questo tenant è <span className="font-bold">IN SCADENZA</span>
            {expiresAt ? ` (entro il ${new Date(expiresAt).toLocaleDateString("it-IT")})` : ""}.
          </p>
        </div>
        <a
          href="https://taaaac.eu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg font-semibold inline-flex items-center gap-1 transition-all"
        >
          Rinnova licenza
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
