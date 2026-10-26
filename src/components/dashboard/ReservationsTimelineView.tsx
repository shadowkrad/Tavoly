"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  UtensilsCrossed,
  Wine,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Clock3,
} from "lucide-react";
import { BookingItem, BookingTableOption } from "./BookingsManagementView";
import { CustomerProfileMapItem } from "@/components/ReservationsList";

interface ReservationsTimelineViewProps {
  reservations: BookingItem[];
  tables: BookingTableOption[];
  customerProfiles: Record<string, CustomerProfileMapItem>;
  onSelectReservation: (r: BookingItem) => void;
  onOpenNewModal: (params?: { defaultDate?: string; defaultTime?: string; defaultTableId?: string }) => void;
}

type TimelineSubMode = "GIORNO" | "SETTIMANA";
type ShiftFilter = "TUTTI" | "PRANZO" | "CENA";

// Orari standard per i servizi
const PRANZO_SLOTS = ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
const CENA_SLOTS = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];

function formatToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseYMD(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getStartOfWeek(d: Date): Date {
  const res = new Date(d);
  const day = res.getDay();
  const diff = res.getDate() - day + (day === 0 ? -6 : 1); // Lunedì
  res.setDate(diff);
  res.setHours(0, 0, 0, 0);
  return res;
}

function getWeekDays(startMonday: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startMonday);
    d.setDate(startMonday.getDate() + i);
    days.push(d);
  }
  return days;
}

const STATUS_COLOR_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  IN_ATTESA: {
    bg: "bg-amber-50 hover:bg-amber-100",
    border: "border-amber-300",
    text: "text-amber-900",
    badge: "bg-amber-200 text-amber-900",
  },
  CONFERMATA: {
    bg: "bg-blue-50 hover:bg-blue-100",
    border: "border-blue-300",
    text: "text-blue-900",
    badge: "bg-blue-200 text-blue-900",
  },
  SEDUTI: {
    bg: "bg-emerald-50 hover:bg-emerald-100",
    border: "border-emerald-400 shadow-xs",
    text: "text-emerald-900",
    badge: "bg-emerald-200 text-emerald-900 font-black",
  },
  COMPLETATA: {
    bg: "bg-slate-100 hover:bg-slate-200",
    border: "border-slate-300",
    text: "text-slate-700",
    badge: "bg-slate-200 text-slate-800",
  },
  ANNULLATA: {
    bg: "bg-rose-50 hover:bg-rose-100 opacity-60",
    border: "border-rose-300 line-through",
    text: "text-rose-900",
    badge: "bg-rose-200 text-rose-900",
  },
};

export function ReservationsTimelineView({
  reservations,
  tables,
  customerProfiles,
  onSelectReservation,
  onOpenNewModal,
}: ReservationsTimelineViewProps) {
  const todayStr = useMemo(() => formatToYMD(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatToYMD(d);
  }, []);

  // Modalità Giorno o Settimana
  const [subMode, setSubMode] = useState<TimelineSubMode>("GIORNO");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Filtro Turno & Area
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("TUTTI");
  const [areaFilter, setAreaFilter] = useState<string>("TUTTE");

  // Elenco unico delle sale / aree dai tavoli
  const uniqueAreas = useMemo(() => {
    const set = new Set<string>();
    tables.forEach((t) => {
      if (t.areaName) set.add(t.areaName);
    });
    return Array.from(set);
  }, [tables]);

  // Tavoli filtrati per area
  const filteredTables = useMemo(() => {
    if (areaFilter === "TUTTE") return tables;
    return tables.filter((t) => t.areaName === areaFilter);
  }, [tables, areaFilter]);

  // Aree raggruppate per visualizzazione header colonne
  const tablesByArea = useMemo(() => {
    const map = new Map<string, BookingTableOption[]>();
    filteredTables.forEach((t) => {
      const arr = map.get(t.areaName) || [];
      arr.push(t);
      map.set(t.areaName, arr);
    });
    return map;
  }, [filteredTables]);

  // Navigazione temporale giorno
  const handleShiftDay = (delta: number) => {
    const current = parseYMD(selectedDate);
    current.setDate(current.getDate() + delta);
    setSelectedDate(formatToYMD(current));
  };

  // Navigazione temporale settimana
  const handleShiftWeek = (deltaWeeks: number) => {
    const current = parseYMD(selectedDate);
    current.setDate(current.getDate() + deltaWeeks * 7);
    setSelectedDate(formatToYMD(current));
  };

  // Date della settimana per vista settimanale
  const startOfWeek = useMemo(() => getStartOfWeek(parseYMD(selectedDate)), [selectedDate]);
  const weekDays = useMemo(() => getWeekDays(startOfWeek), [startOfWeek]);

  // Normalizzatore data prenotazione
  const getReservationDateStr = (dateVal: string | Date): string => {
    if (!dateVal) return todayStr;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return todayStr;
    return formatToYMD(d);
  };

  // Prenotazioni del giorno selezionato
  const dayReservations = useMemo(() => {
    return reservations.filter((r) => getReservationDateStr(r.date) === selectedDate);
  }, [reservations, selectedDate]);

  // Prenotazioni senza tavolo assegnato nel giorno
  const unassignedReservations = useMemo(() => {
    return dayReservations.filter((r) => !r.tableId && r.status !== "ANNULLATA");
  }, [dayReservations]);

  // Lookup rapido prenotazioni: key = `${tableId}_${timeSlot}`
  const reservationLookup = useMemo(() => {
    const map = new Map<string, BookingItem>();
    dayReservations.forEach((r) => {
      if (r.tableId && r.timeSlot) {
        map.set(`${r.tableId}_${r.timeSlot}`, r);
      }
    });
    return map;
  }, [dayReservations]);

  // Slot orari attivi in base al filtro turno
  const activeTimeSlots = useMemo(() => {
    if (shiftFilter === "PRANZO") return PRANZO_SLOTS;
    if (shiftFilter === "CENA") return CENA_SLOTS;
    return [...PRANZO_SLOTS, ...CENA_SLOTS];
  }, [shiftFilter]);

  // Metriche del giorno
  const dayStats = useMemo(() => {
    const valid = dayReservations.filter((r) => r.status !== "ANNULLATA");
    const totalGuests = valid.reduce((sum, r) => sum + r.guestCount, 0);
    const seated = valid.filter((r) => r.status === "SEDUTI").length;
    const pending = valid.filter((r) => r.status === "IN_ATTESA").length;
    return {
      count: valid.length,
      totalGuests,
      seated,
      pending,
      unassigned: unassignedReservations.length,
    };
  }, [dayReservations, unassignedReservations]);

  // Formattazione data giorno
  const formattedDayTitle = useMemo(() => {
    const d = parseYMD(selectedDate);
    return d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* BARRA CONTROLLI SUPERIORE: VISTE, NAVIGAZIONE E FILTRI */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Switch Sub-Mode: Giorno vs Settimana */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setSubMode("GIORNO")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                subMode === "GIORNO"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Griglia Oraria Giorno</span>
            </button>
            <button
              type="button"
              onClick={() => setSubMode("SETTIMANA")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                subMode === "SETTIMANA"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
              <span>Agenda Settimana</span>
            </button>
          </div>

          {/* Navigatore Temporale */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => (subMode === "GIORNO" ? handleShiftDay(-1) : handleShiftWeek(-1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Oggi
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === tomorrowStr
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Domani
            </button>

            {/* Date Picker Manuale */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => (subMode === "GIORNO" ? handleShiftDay(1) : handleShiftWeek(1))}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Riga 2: Titolo Data, Filtri Turno e Sala */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div>
            <div className="text-base font-black text-slate-900 capitalize flex items-center gap-2">
              <span>{formattedDayTitle}</span>
              {selectedDate === todayStr && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Oggi
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
              <span>{dayStats.count} prenotazioni</span>
              <span>•</span>
              <span className="font-bold text-slate-700">{dayStats.totalGuests} coperti</span>
              {dayStats.seated > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">{dayStats.seated} accomodati</span>
                </>
              )}
              {dayStats.unassigned > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">⚠️ {dayStats.unassigned} senza tavolo</span>
                </>
              )}
            </div>
          </div>

          {/* Filtro Turno e Filtro Sala */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Turno Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setShiftFilter("TUTTI")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  shiftFilter === "TUTTI" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Tutti i turni
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter("PRANZO")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  shiftFilter === "PRANZO" ? "bg-white text-amber-900 shadow-xs" : "text-slate-600"
                }`}
              >
                <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                <span>Pranzo</span>
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter("CENA")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  shiftFilter === "CENA" ? "bg-white text-purple-900 shadow-xs" : "text-slate-600"
                }`}
              >
                <Wine className="w-3 h-3 text-purple-600" />
                <span>Cena</span>
              </button>
            </div>

            {/* Sala Dropdown */}
            {uniqueAreas.length > 1 && (
              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="TUTTE">Tutte le sale ({tables.length} tavoli)</option>
                {uniqueAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* STRIP PRENOTAZIONI SENZA TAVOLO ASSEGNATO (se presenti) */}
      {unassignedReservations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                {unassignedReservations.length} Prenotazioni senza tavolo assegnato:
              </span>
            </div>
            <span className="text-[11px] text-amber-700">Clicca su una scheda per assegnare il tavolo</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {unassignedReservations.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectReservation(r)}
                className="p-2.5 bg-white rounded-xl border border-amber-200 text-left hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="text-xs font-black text-slate-900 truncate">{r.customerName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{r.timeSlot}</span>
                    <span>•</span>
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>{r.guestCount}p</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
                  Assegna
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW: GRIGLIA GIORNO (TIMELINE TAVOLI / FASCE ORARIE) */}
      {subMode === "GIORNO" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full border-collapse min-w-[700px]">
              {/* Header: Area e Tavoli */}
              <thead>
                {/* Livello 1: Raggruppamento per Sala */}
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600">
                  <th className="p-3 text-left w-24 sticky left-0 bg-slate-100 z-20 border-r border-slate-200">
                    Fascia Oraria
                  </th>
                  {Array.from(tablesByArea.entries()).map(([areaName, tbls]) => (
                    <th
                      key={areaName}
                      colSpan={tbls.length}
                      className="p-2 text-center border-r border-slate-200 uppercase tracking-wider text-[11px] bg-slate-200/60 text-slate-700"
                    >
                      🏛️ {areaName} ({tbls.length} tavoli)
                    </th>
                  ))}
                </tr>

                {/* Livello 2: Dettaglio Tavolo con Capienza */}
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                  <th className="p-2 text-left sticky left-0 bg-slate-50 z-20 border-r border-slate-200 text-slate-400 text-[11px]">
                    Ora Arrivo
                  </th>
                  {filteredTables.map((t) => (
                    <th
                      key={t.id}
                      className="p-2 text-center border-r border-slate-200/80 min-w-[130px] max-w-[160px]"
                    >
                      <div className="font-black text-slate-900 text-sm">Tavolo {t.number}</div>
                      <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>max {t.capacity} persone</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Corpo: Slot Orari x Tavoli */}
              <tbody className="divide-y divide-slate-100 text-xs">
                {activeTimeSlots.map((slot, slotIdx) => {
                  const isLunchEnd = slot === "15:30" && shiftFilter === "TUTTI";
                  return (
                    <React.Fragment key={slot}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        {/* Colonna Orario a sinistra sticky */}
                        <td className="p-2.5 font-bold text-slate-700 sticky left-0 bg-white z-10 border-r border-slate-200 flex items-center gap-1.5 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{slot}</span>
                        </td>

                        {/* Celle dei tavoli */}
                        {filteredTables.map((t) => {
                          const res = reservationLookup.get(`${t.id}_${slot}`);
                          const style = res ? STATUS_COLOR_STYLES[res.status] || STATUS_COLOR_STYLES.CONFERMATA : null;

                          return (
                            <td
                              key={t.id}
                              className="p-1 border-r border-slate-100 align-top relative h-16 min-w-[130px]"
                            >
                              {res ? (
                                <div
                                  onClick={() => onSelectReservation(res)}
                                  className={`p-2 rounded-xl border ${style?.bg} ${style?.border} transition-all cursor-pointer shadow-xs group h-full flex flex-col justify-between`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`text-[11px] font-black truncate ${style?.text}`}>
                                        {res.customerName}
                                      </span>
                                      {res.notes && (
                                        <span title={res.notes} className="text-amber-600 text-xs shrink-0">
                                          ⚠️
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-600 font-semibold mt-0.5">
                                      <Users className="w-3 h-3 text-slate-400" />
                                      <span>{res.guestCount} coperti</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 mt-1 pt-1 border-t border-black/5 text-[9px]">
                                    <span className={`px-1.5 py-0.2 rounded-md ${style?.badge}`}>
                                      {res.status}
                                    </span>
                                    <span className="text-slate-500 font-medium">{res.timeSlot}</span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenNewModal({
                                      defaultDate: selectedDate,
                                      defaultTime: slot,
                                      defaultTableId: t.id,
                                    })
                                  }
                                  className="w-full h-full rounded-xl border border-dashed border-transparent hover:border-slate-300 hover:bg-slate-50/80 transition-all flex items-center justify-center text-slate-300 hover:text-slate-600 group cursor-pointer"
                                  title={`Prenota Tavolo ${t.number} alle ${slot}`}
                                >
                                  <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* Separatore turno pranzo/cena se vista TUTTI */}
                      {isLunchEnd && (
                        <tr className="bg-purple-50/70 border-y border-purple-200">
                          <td
                            colSpan={filteredTables.length + 1}
                            className="py-2 px-4 text-xs font-black text-purple-900 flex items-center gap-2"
                          >
                            <Wine className="w-4 h-4 text-purple-700" />
                            <span>Inizio Servizio Cena (Turni Serali)</span>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW: AGENDA SETTIMANALE (7 GIORNI) */}
      {subMode === "SETTIMANA" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {weekDays.map((d) => {
            const dayYMD = formatToYMD(d);
            const isTodayDay = dayYMD === todayStr;
            const isTargetSelected = dayYMD === selectedDate;

            const dayBookings = reservations.filter(
              (r) => getReservationDateStr(r.date) === dayYMD && r.status !== "ANNULLATA"
            );
            const dayGuests = dayBookings.reduce((sum, r) => sum + r.guestCount, 0);

            // Raggruppamento per turno
            const pranzoBookings = dayBookings.filter((r) => {
              const h = Number(r.timeSlot.split(":")[0]);
              return h < 16;
            });
            const cenaBookings = dayBookings.filter((r) => {
              const h = Number(r.timeSlot.split(":")[0]);
              return h >= 16;
            });

            return (
              <div
                key={dayYMD}
                className={`bg-white rounded-2xl border transition-all p-3 flex flex-col justify-between ${
                  isTargetSelected
                    ? "border-emerald-500 shadow-md ring-2 ring-emerald-500/20"
                    : isTodayDay
                    ? "border-slate-900 shadow-xs"
                    : "border-slate-200/90 shadow-xs"
                }`}
              >
                {/* Giorno Header */}
                <div className="pb-2.5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 capitalize">
                      {d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    {isTodayDay && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Oggi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold mt-1">
                    <span>{dayBookings.length} pren.</span>
                    <span className="font-bold text-slate-800">{dayGuests} coperti</span>
                  </div>
                </div>

                {/* Lista Card Prenotazioni Giorno */}
                <div className="py-2 space-y-2 flex-1 max-h-[480px] overflow-y-auto [scrollbar-width:thin]">
                  {/* Pranzo */}
                  {pranzoBookings.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                        <UtensilsCrossed className="w-3 h-3 text-amber-600" />
                        <span>Pranzo ({pranzoBookings.length})</span>
                      </div>
                      {pranzoBookings.map((r) => {
                        const style = STATUS_COLOR_STYLES[r.status] || STATUS_COLOR_STYLES.CONFERMATA;
                        return (
                          <div
                            key={r.id}
                            onClick={() => onSelectReservation(r)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${style.bg} ${style.border}`}
                          >
                            <div className="flex items-center justify-between gap-1 font-black truncate">
                              <span className="truncate">{r.customerName}</span>
                              <span className="text-[10px] font-bold text-slate-600">{r.timeSlot}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-0.5">
                              <span>👥 {r.guestCount}p</span>
                              <span>{r.table ? `Tav. ${r.table.number}` : "⚠️ Da ass."}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Cena */}
                  {cenaBookings.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-black uppercase tracking-wider text-purple-800 flex items-center gap-1">
                        <Wine className="w-3 h-3 text-purple-600" />
                        <span>Cena ({cenaBookings.length})</span>
                      </div>
                      {cenaBookings.map((r) => {
                        const style = STATUS_COLOR_STYLES[r.status] || STATUS_COLOR_STYLES.CONFERMATA;
                        return (
                          <div
                            key={r.id}
                            onClick={() => onSelectReservation(r)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all ${style.bg} ${style.border}`}
                          >
                            <div className="flex items-center justify-between gap-1 font-black truncate">
                              <span className="truncate">{r.customerName}</span>
                              <span className="text-[10px] font-bold text-slate-600">{r.timeSlot}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-0.5">
                              <span>👥 {r.guestCount}p</span>
                              <span>{r.table ? `Tav. ${r.table.number}` : "⚠️ Da ass."}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {dayBookings.length === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs italic">
                      Nessuna prenotazione
                    </div>
                  )}
                </div>

                {/* Footer Giorno con pulsante rapido per quel giorno */}
                <button
                  type="button"
                  onClick={() => onOpenNewModal({ defaultDate: dayYMD })}
                  className="w-full mt-2 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Aggiungi</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
