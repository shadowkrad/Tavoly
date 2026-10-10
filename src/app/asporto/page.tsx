import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { ShowcaseNavbar } from "@/components/public/ShowcaseNavbar";
import {
  PublicTakeawayWidget,
  PublicTakeawayDish,
} from "@/components/public/PublicTakeawayWidget";
import { getTakeawaySettings } from "@/lib/takeaway-server";
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AsportoPage() {
  const [tenantConfig, takeawaySettings, rawTakeawayDishes, existingTakeawayOrders] =
    await Promise.all([
      getTenantConfig(),
      getTakeawaySettings(),
      prisma.menuItem.findMany({
        where: { isAvailable: true, isTakeaway: true },
        orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { name: "asc" }],
      }),
      prisma.takeawayOrder.findMany({
        where: { status: { not: "ANNULLATO" } },
        select: { pickupTime: true, pickupDate: true },
      }),
    ]);

  const takeawayDishes: PublicTakeawayDish[] = rawTakeawayDishes.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    price: d.price,
    description: d.description,
    imageUrl: d.imageUrl,
    allergens: d.allergens || "[]",
  }));

  const restaurantName = tenantConfig.theme.restaurantName || "Tavoly Restaurant";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ShowcaseNavbar tenantConfig={tenantConfig} takeawayEnabled={takeawaySettings.enabled} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Navigation & Status Badge */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Vetrina
          </Link>

          <Link
            href="/prenotazione"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Preferisci il tavolo in sala? Prenota qui
          </Link>
        </div>

        {/* Intestazione */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span>Asporto & Takeaway Ufficiale</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
            Ordina per Asporto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Scegli il tuo orario di ritiro al pass, seleziona i piatti che preferisci e ritira senza attese.
          </p>
        </div>

        {/* Card Contenuto */}
        <div className="taaaac-card p-6 sm:p-8 bg-white shadow-md border-slate-200/90 rounded-3xl">
          {takeawaySettings.enabled ? (
            <PublicTakeawayWidget
              settings={takeawaySettings}
              dishes={takeawayDishes}
              existingOrders={existingTakeawayOrders}
              restaurantName={restaurantName}
            />
          ) : (
            <div className="text-center py-16 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Asporto Online Temporaneamente Disattivato
              </h2>
              <p className="text-sm text-slate-500">
                Il servizio di ordinazione per asporto online non è attualmente attivo per questo locale.
                Puoi comunque prenotare il tuo tavolo per consumare comodamente al ristorante.
              </p>
              <div className="pt-4">
                <Link
                  href="/prenotazione"
                  className="taaaac-btn-primary inline-flex items-center gap-2 px-6 py-3"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Prenota un Tavolo al Ristorante</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-center text-xs">
        <p className="font-semibold text-white">{restaurantName}</p>
        <p className="mt-1">Tavoly Takeaway Engine · Taaaac Ecosystem</p>
      </footer>
    </div>
  );
}
