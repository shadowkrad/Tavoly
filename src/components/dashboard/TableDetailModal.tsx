"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Users,
  CheckCircle2,
  Receipt,
  Sparkles,
  UserCheck,
  AlertCircle,
  Phone,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  updateTableStatus,
  updateTableSeatedCountAction,
  createWalkInAction,
} from "@/app/actions";
import { TableItem } from "./TableCanvasBoard";

interface ReservationItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  guestCount: number;
  timeSlot: string;
  status: string;
  notes: string | null;
  tableId: string | null;
}

interface TableDetailModalProps {
  table: TableItem | null;
  reservations: ReservationItem[];
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; badge: string; color: string }> = {
  LIBERO: {
    label: "Libero",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    color: "emerald",
  },
  OCCUPATO: {
    label: "Occupato",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    color: "rose",
  },
  PRENOTATO: {
    label: "Prenotato",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    color: "blue",
  },
  CONTO: {
    label: "Conto Richiesto",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    color: "amber",
  },
  DA_PULIRE: {
    label: "Da Sparecchiare / Pulire",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    color: "purple",
  },
};

export function TableDetailModal({
  table,
  reservations,
  isOpen,
  onClose,
}: TableDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [walkInGuests, setWalkInGuests] = useState<number>(table?.capacity || 2);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !table) return null;

  const currentStatus = STATUS_LABELS[table.status] || STATUS_LABELS.LIBERO;
  const isBar = table.shape === "BAR";

  // Trova eventuali prenotazioni assegnate a questo tavolo
  const tableReservations = reservations.filter(
    (r) => r.tableId === table.id && r.status !== "ANNULLATA" && r.status !== "COMPLETATA"
  );

  const handleSetStatus = (newStatus: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateTableStatus(table.id, newStatus);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Errore aggiornamento tavolo");
      }
    });
  };

  const handleDeltaSeated = (delta: number) => {
    startTransition(async () => {
      await updateTableSeatedCountAction(table.id, delta);
    });
  };

  const handleWalkIn = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createWalkInAction(table.id, walkInGuests);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Impossibile registrare cliente walk-in");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header Tavolo */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
              {table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  {isBar ? "Postazione Banco" : "Tavolo"} {table.number}
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentStatus.badge}`}>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {table.area.name} · Capienza max {table.capacity} posti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Gestione Coperti Seduti */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Persone Sedute al Tavolo
            </span>
            <span className="text-xs font-bold text-slate-900">
              {table.seatedCount} / {table.capacity} coperti
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-1">
              {Array.from({ length: Math.max(table.capacity, table.seatedCount) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    idx < table.seatedCount
                      ? "bg-rose-600 border-rose-700 scale-105 shadow-2xs"
                      : "bg-emerald-200 border-emerald-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDeltaSeated(-1)}
                disabled={table.seatedCount <= 0 || isPending}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center cursor-pointer disabled:opacity-30 shadow-2xs"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleDeltaSeated(1)}
                disabled={isPending}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Azioni Rapide in base allo stato */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Azioni Rapide
          </span>

          {table.status === "LIBERO" && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-emerald-950 block">
                  Accoglienza Veloce (Walk-in)
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-xl px-2 py-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <select
                      value={walkInGuests}
                      onChange={(e) => setWalkInGuests(Number(e.target.value))}
                      className="bg-transparent text-xs font-bold text-slate-900 border-none outline-none cursor-pointer"
                    >
                      {Array.from({ length: table.capacity + 2 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "persona" : "persone"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleWalkIn}
                    disabled={isPending}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Occupa Subito</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetStatus("PRENOTATO")}
                  disabled={isPending}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Segna Prenotato</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus("DA_PULIRE")}
                  disabled={isPending}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Da Sanificare</span>
                </button>
              </div>
            </div>
          )}

          {table.status === "OCCUPATO" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetStatus("CONTO")}
                disabled={isPending}
                className="p-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Receipt className="w-4 h-4 text-amber-700" />
                <span>Richiedi Conto</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus("LIBERO")}
                disabled={isPending}
                className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Libera Tavolo</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus("DA_PULIRE")}
                disabled={isPending}
                className="col-span-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Segna da Sparecchiare</span>
              </button>
            </div>
          )}

          {table.status === "CONTO" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetStatus("LIBERO")}
                disabled={isPending}
                className="col-span-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Conto Saldato · Libera Tavolo</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus("DA_PULIRE")}
                disabled={isPending}
                className="col-span-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Passa a Da Sparecchiare</span>
              </button>
            </div>
          )}

          {table.status === "PRENOTATO" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetStatus("OCCUPATO")}
                disabled={isPending}
                className="col-span-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Accomoda Ospiti al Tavolo</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus("LIBERO")}
                disabled={isPending}
                className="col-span-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Annulla Prenotazione · Libera</span>
              </button>
            </div>
          )}

          {table.status === "DA_PULIRE" && (
            <button
              type="button"
              onClick={() => handleSetStatus("LIBERO")}
              disabled={isPending}
              className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tavolo Pulito & Pronto (Libero)</span>
            </button>
          )}
        </div>

        {/* Prenotazioni Associate a questo tavolo */}
        {tableReservations.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Prenotazioni Assegnate a questo Tavolo
            </span>
            <div className="space-y-1.5">
              {tableReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{res.customerName}</span>
                    <span className="text-blue-700">{res.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <span>{res.guestCount} ospiti</span>
                    <span>{res.phoneNumber}</span>
                  </div>
                  {res.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mt-1">
                      Note: {res.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {table.notes && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <strong>Note Tavolo:</strong> {table.notes}
          </div>
        )}
      </div>
    </div>
  );
}
