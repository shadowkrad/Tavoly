import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KitchenDisplayView } from "@/components/dashboard/KitchenDisplayView";
import { ChefHat, Settings, ArrowRight, Tv } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CucinaDashboardPage() {
  const [kdsSetting, restaurantSetting] = await Promise.all([
    prisma.localSetting.findUnique({
      where: { key: "kds_enabled" },
    }),
    prisma.localSetting.findUnique({
      where: { key: "restaurant_name" },
    }),
  ]);

  const isKdsEnabled = kdsSetting ? kdsSetting.value === "true" : false;
  const restaurantName = restaurantSetting ? restaurantSetting.value : "Osteria dei Tavoli";

  if (!isKdsEnabled) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
          <ChefHat className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monitor Cucina KDS Disattivato
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Il modulo Monitor Cucina (KDS) è attualmente disabilitato nelle impostazioni di sala.
            Attivalo per visualizzare le comande in arrivo sul monitor in tempo reale.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard/impostazioni"
            className="taaaac-btn-primary px-5 py-2.5 text-xs inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span>Vai a Impostazioni e Attiva KDS</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner rapido per aprire lo schermo intero su TV / Monitor Cucina */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-3.5 px-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-800/80 text-emerald-300 flex items-center justify-center shrink-0">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm">
              Vuoi dedicare un monitor o una TV a parete in cucina?
            </div>
            <div className="text-[11px] text-emerald-200">
              Apri la visualizzazione a tutto schermo (senza barre laterali) pensata per i cuochi al pass.
            </div>
          </div>
        </div>
        <Link
          href="/cucina"
          target="_blank"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <span>Apri a Schermo Intero</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <KitchenDisplayView restaurantName={restaurantName} isStandalone={false} />
    </div>
  );
}
