"use client";

import React, { useState } from "react";
import { ShoppingBag, Clock, Palette, Plus } from "lucide-react";
import { NewReservationModal } from "@/components/NewReservationModal";
import { ShiftsManagementModal, ServiceShiftItem } from "./ShiftsManagementModal";
import { TakeawayPanel, TakeawayItem } from "./TakeawayPanel";
import { ThemeSelectorModal } from "./ThemeSelectorModal";

interface TableOption {
  id: string;
  number: string;
  capacity: number;
  areaName: string;
  status: string;
}

interface DashboardHeaderActionsProps {
  tableOptions: TableOption[];
  shifts: ServiceShiftItem[];
  takeawayOrders: TakeawayItem[];
  currentPaletteId?: string;
  hasVendolyModule?: boolean;
}

export function DashboardHeaderActions({
  tableOptions,
  shifts,
  takeawayOrders,
  currentPaletteId,
  hasVendolyModule = true,
}: DashboardHeaderActionsProps) {
  const [isTakeawayOpen, setIsTakeawayOpen] = useState(false);
  const [isShiftsOpen, setIsShiftsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const pendingTakeawayCount = takeawayOrders.filter((o) => o.status !== "RITIRATO").length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Turni & Orari */}
      <button
        type="button"
        onClick={() => setIsShiftsOpen(true)}
        className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        title="Gestisci turni di servizio e capienza massima"
      >
        <Clock className="w-4 h-4 text-blue-600" />
        <span>Turni & Servizi</span>
      </button>

      {/* Asporto / Vendoly Channel Manager */}
      {hasVendolyModule && (
        <button
          type="button"
          onClick={() => setIsTakeawayOpen(true)}
          className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer relative"
          title="Gestisci ordini asporto del banco"
        >
          <ShoppingBag className="w-4 h-4 text-purple-600" />
          <span>Asporto Vendoly</span>
          {pendingTakeawayCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
              {pendingTakeawayCount}
            </span>
          )}
        </button>
      )}

      {/* Theme Palette */}
      <button
        type="button"
        onClick={() => setIsThemeOpen(true)}
        className="p-2 bg-white border border-slate-200/90 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
        title="Personalizza palette colori brand"
      >
        <Palette className="w-4 h-4 text-amber-600" />
      </button>

      {/* Nuova Prenotazione Modal */}
      <NewReservationModal tables={tableOptions} />

      {/* Modals */}
      <ShiftsManagementModal
        shifts={shifts}
        isOpen={isShiftsOpen}
        onClose={() => setIsShiftsOpen(false)}
      />

      <TakeawayPanel
        orders={takeawayOrders}
        isOpen={isTakeawayOpen}
        onClose={() => setIsTakeawayOpen(false)}
      />

      <ThemeSelectorModal
        currentPaletteId={currentPaletteId}
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />
    </div>
  );
}
