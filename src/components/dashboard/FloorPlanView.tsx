"use client";

import React, { useState } from "react";
import {
  Calendar,
  Users,
  Clock,
  ShoppingBag,
  Palette,
  Plus,
  CalendarCheck2,
  Layers,
} from "lucide-react";
import { TableCanvasBoard, TableItem } from "./TableCanvasBoard";
import { ReservationsDrawer } from "./ReservationsDrawer";
import { NewReservationModal } from "@/components/NewReservationModal";
import { ShiftsManagementModal, ServiceShiftItem } from "./ShiftsManagementModal";
import { TakeawayPanel, TakeawayItem } from "./TakeawayPanel";
import { ThemeSelectorModal } from "./ThemeSelectorModal";
import { AreasManagementModal } from "./AreasManagementModal";
import { CustomerProfileMapItem } from "@/components/ReservationsList";

interface Area {
  id: string;
  name: string;
  description?: string | null;
  orderIndex?: number;
}

interface ReservationItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  guestCount: number;
  timeSlot: string;
  status: string;
  notes: string | null;
  whatsappSent: boolean;
  isWalkIn?: boolean;
  tableId: string | null;
  table: {
    number: string;
    area: {
      name: string;
    };
  } | null;
}

interface FloorPlanViewProps {
  tables: TableItem[];
  areas: Area[];
  reservations: ReservationItem[];
  customerProfiles: Record<string, CustomerProfileMapItem>;
  serviceShifts: ServiceShiftItem[];
  takeawayOrders: TakeawayItem[];
  paletteId: string;
  hasVendolyModule: boolean;
  hasWhatsAppModule: boolean;
  restaurantName: string;
}

export function FloorPlanView({
  tables,
  areas,
  reservations,
  customerProfiles,
  serviceShifts,
  takeawayOrders,
  paletteId,
  hasVendolyModule,
  hasWhatsAppModule,
  restaurantName,
}: FloorPlanViewProps) {
  const [isReservationsOpen, setIsReservationsOpen] = useState(false);
  const [isShiftsOpen, setIsShiftsOpen] = useState(false);
  const [isTakeawayOpen, setIsTakeawayOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [isAreasOpen, setIsAreasOpen] = useState(false);

  // Calcoli metriche compatti
  const totalTables = tables.length;
  const freeTables = tables.filter((t) => t.status === "LIBERO").length;
  const occupiedTables = tables.filter((t) => t.status === "OCCUPATO").length;
  const billTables = tables.filter((t) => t.status === "CONTO").length;
  const totalGuestsToday = reservations
    .filter((r) => r.status !== "ANNULLATA")
    .reduce((acc, curr) => acc + curr.guestCount, 0);
  const activeReservationsCount = reservations.filter(
    (r) => r.status !== "ANNULLATA" && r.status !== "COMPLETATA"
  ).length;
  const pendingTakeawayCount = takeawayOrders.filter((o) => o.status !== "RITIRATO").length;

  const tablesCountByArea = tables.reduce((acc, t) => {
    acc[t.areaId] = (acc[t.areaId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tableOptions = tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    areaName: t.area.name,
    status: t.status,
  }));

  return (
    <div className="space-y-4">
      {/* HEADER COMPATTO: TITOLO, STATS PILL & AZIONI (RIGA SINGOLA) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sinistra: Titolo essenziale & Indicatori di Stato Inline */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Mappa Tavoli
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Live
            </span>
          </div>

          {/* Pill Metriche Compatte a riga singola (Zero Card Ingombranti) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{freeTables}/{totalTables} Liberi</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200/80 rounded-xl font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{occupiedTables} Occupati</span>
            </div>

            {billTables > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-xl font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{billTables} Conto</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl font-semibold">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>{totalGuestsToday} Coperti</span>
            </div>
          </div>
        </div>

        {/* Destra: Azioni Rapide Console */}
        <div className="flex items-center gap-2">
          {/* Tasto Cassetto Prenotazioni (A Scomparsa) */}
          <button
            type="button"
            onClick={() => setIsReservationsOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-xs ${
              isReservationsOpen
                ? "bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30"
                : "bg-white text-slate-800 border-slate-200/90 hover:bg-slate-50"
            }`}
            title="Apri cassetto prenotazioni del servizio"
          >
            <CalendarCheck2 className={`w-4 h-4 ${isReservationsOpen ? "text-white" : "text-blue-600"}`} />
            <span>Prenotazioni</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                isReservationsOpen ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
              }`}
            >
              {activeReservationsCount}
            </span>
          </button>

          {/* Turni & Servizi */}
          <button
            type="button"
            onClick={() => setIsShiftsOpen(true)}
            className="p-2 bg-white border border-slate-200/90 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer hidden lg:flex"
            title="Turni di Servizio & Orari"
          >
            <Clock className="w-4 h-4 text-slate-500" />
          </button>

          {/* Asporto / Vendoly Channel */}
          {hasVendolyModule && (
            <button
              type="button"
              onClick={() => setIsTakeawayOpen(true)}
              className="px-2.5 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-xs transition-colors cursor-pointer relative"
              title="Ordini Asporto & Delivery"
            >
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Asporto</span>
              {pendingTakeawayCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">
                  {pendingTakeawayCount}
                </span>
              )}
            </button>
          )}

          {/* Gestione Stanze / Sale */}
          <button
            type="button"
            onClick={() => setIsAreasOpen(true)}
            className="p-2 bg-white border border-slate-200/90 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Gestisci Stanze & Sale (Crea, Rinomina, Elimina)"
          >
            <Layers className="w-4 h-4 text-blue-600" />
          </button>

          {/* Palette */}
          <button
            type="button"
            onClick={() => setIsThemeOpen(true)}
            className="p-2 bg-white border border-slate-200/90 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Personalizza Colori Brand"
          >
            <Palette className="w-4 h-4 text-amber-600" />
          </button>

          {/* Nuova Prenotazione */}
          <button
            type="button"
            onClick={() => setIsNewReservationOpen(true)}
            className="taaaac-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuova Prenotazione</span>
            <span className="sm:hidden">Nuova</span>
          </button>
        </div>
      </div>

      {/* PLANIMETRIA SALA A PIENO SCHERMO (100% WIDTH) */}
      <div className="w-full">
        <TableCanvasBoard
          tables={tables}
          areas={areas}
          reservations={reservations}
          onOpenAreasModal={() => setIsAreasOpen(true)}
        />
      </div>

      {/* CASSETTO PRENOTAZIONI SLIDE-OVER */}
      <ReservationsDrawer
        isOpen={isReservationsOpen}
        onClose={() => setIsReservationsOpen(false)}
        reservations={reservations}
        hasWhatsAppModule={hasWhatsAppModule}
        customerProfiles={customerProfiles}
        restaurantName={restaurantName}
        onNewReservationClick={() => setIsNewReservationOpen(true)}
      />

      {/* MODAL NUOVA PRENOTAZIONE */}
      <NewReservationModal
        tables={tableOptions}
        isOpen={isNewReservationOpen}
        onClose={() => setIsNewReservationOpen(false)}
        showTrigger={false}
      />

      {/* MODALI AUSILIARI */}
      <AreasManagementModal
        areas={areas}
        tablesCountByArea={tablesCountByArea}
        isOpen={isAreasOpen}
        onClose={() => setIsAreasOpen(false)}
      />

      <ShiftsManagementModal
        shifts={serviceShifts}
        isOpen={isShiftsOpen}
        onClose={() => setIsShiftsOpen(false)}
      />

      <TakeawayPanel
        orders={takeawayOrders}
        isOpen={isTakeawayOpen}
        onClose={() => setIsTakeawayOpen(false)}
      />

      <ThemeSelectorModal
        currentPaletteId={paletteId}
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
      />
    </div>
  );
}
