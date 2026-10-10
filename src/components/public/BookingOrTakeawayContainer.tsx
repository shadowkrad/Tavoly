"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UtensilsCrossed, ShoppingBag, Sparkles } from "lucide-react";
import { PublicBookingWidget, PublicShiftData } from "@/components/public/PublicBookingWidget";
import {
  PublicTakeawayWidget,
  PublicTakeawayDish,
} from "@/components/public/PublicTakeawayWidget";
import { TakeawaySettings } from "@/lib/takeaway-rules";

interface BookingOrTakeawayContainerProps {
  shifts: PublicShiftData[];
  takeawaySettings: TakeawaySettings;
  takeawayDishes: PublicTakeawayDish[];
  existingOrders: Array<{ pickupTime: string; pickupDate?: string | null }>;
  restaurantName: string;
  defaultTab?: "tavolo" | "asporto";
}

export function BookingOrTakeawayContainer({
  shifts,
  takeawaySettings,
  takeawayDishes,
  existingOrders,
  restaurantName,
  defaultTab = "tavolo",
}: BookingOrTakeawayContainerProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") || searchParams.get("tipo");

  const [activeTab, setActiveTab] = useState<"tavolo" | "asporto">(() => {
    if (takeawaySettings.enabled && (urlTab === "asporto" || defaultTab === "asporto")) {
      return "asporto";
    }
    return "tavolo";
  });

  useEffect(() => {
    if (urlTab === "asporto" && takeawaySettings.enabled) {
      setActiveTab("asporto");
    } else if (urlTab === "tavolo") {
      setActiveTab("tavolo");
    }
  }, [urlTab, takeawaySettings.enabled]);

  // Se l'asporto non è abilitato dall'esercente, mostra direttamente la prenotazione del tavolo
  if (!takeawaySettings.enabled) {
    return <PublicBookingWidget shifts={shifts} />;
  }

  return (
    <div className="space-y-6">
      {/* Selettore Tab Moderno & Mobile-Friendly */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex items-center gap-1.5 shadow-inner max-w-md w-full border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("tavolo")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "tavolo"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <UtensilsCrossed
              className={`w-4 h-4 ${
                activeTab === "tavolo" ? "text-emerald-600" : "text-slate-400"
              }`}
            />
            <span>Prenota Tavolo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("asporto")}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "asporto"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <ShoppingBag
              className={`w-4 h-4 ${
                activeTab === "asporto" ? "text-amber-600" : "text-slate-400"
              }`}
            />
            <span>Ordina Asporto</span>
            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              Ritiro
            </span>
          </button>
        </div>
      </div>

      {/* Contenuto Tab */}
      {activeTab === "tavolo" ? (
        <div>
          <PublicBookingWidget shifts={shifts} />
        </div>
      ) : (
        <div>
          <PublicTakeawayWidget
            settings={takeawaySettings}
            dishes={takeawayDishes}
            existingOrders={existingOrders}
            restaurantName={restaurantName}
          />
        </div>
      )}
    </div>
  );
}
