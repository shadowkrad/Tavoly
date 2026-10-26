"use client";

import React, { useState, useTransition } from "react";
import { Plus, X, Calendar, Clock, User, Phone, Users, MessageSquare } from "lucide-react";
import { createReservation } from "@/app/actions";

interface TableOption {
  id: string;
  number: string;
  capacity: number;
  areaName: string;
  status: string;
}

interface NewReservationModalProps {
  tables: TableOption[];
  isOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
  defaultDate?: string;
  defaultTime?: string;
  defaultTableId?: string;
}

export function NewReservationModal({
  tables,
  isOpen: controlledIsOpen,
  onClose,
  showTrigger = true,
  defaultDate,
  defaultTime,
  defaultTableId,
}: NewReservationModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleClose = () => {
    if (controlledIsOpen !== undefined) {
      onClose?.();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await createReservation(formData);
      if (res.success) {
        handleClose();
        form.reset();
      } else {
        setErrorMsg(res.error || "Errore durante il salvataggio");
      }
    });
  };

  const TIME_SLOT_OPTIONS = [
    { value: "11:30", label: "11:30 (Pranzo)" },
    { value: "12:00", label: "12:00 (Pranzo)" },
    { value: "12:30", label: "12:30 (Pranzo)" },
    { value: "13:00", label: "13:00 (Pranzo)" },
    { value: "13:30", label: "13:30 (Pranzo)" },
    { value: "14:00", label: "14:00 (Pranzo)" },
    { value: "14:30", label: "14:30 (Pranzo)" },
    { value: "18:30", label: "18:30 (Aperitivo/Cena)" },
    { value: "19:00", label: "19:00 (Cena 1° Turno)" },
    { value: "19:30", label: "19:30 (Cena 1° Turno)" },
    { value: "20:00", label: "20:00 (Cena)" },
    { value: "20:30", label: "20:30 (Cena)" },
    { value: "21:00", label: "21:00 (Cena 2° Turno)" },
    { value: "21:30", label: "21:30 (Cena 2° Turno)" },
    { value: "22:00", label: "22:00 (Cena Tarda)" },
    { value: "22:30", label: "22:30 (Cena Tarda)" },
  ];

  return (
    <>
      {showTrigger && controlledIsOpen === undefined && (
        <button
          type="button"
          onClick={() => setInternalIsOpen(true)}
          className="taaaac-btn-primary text-sm shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuova Prenotazione</span>
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Nuova Prenotazione Tavolo
                </h3>
                <p className="text-xs text-slate-500">
                  Registra una prenotazione e assegna subito il tavolo
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome e Cognome Cliente *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    name="customerName"
                    type="text"
                    required
                    placeholder="es. Mario Rossi"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Recapito & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cellulare (per WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      name="phoneNumber"
                      type="tel"
                      required
                      placeholder="+39 340 0000000"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (opzionale)
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="cliente@email.it"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Data Prenotazione */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Servizio *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    name="date"
                    type="date"
                    defaultValue={defaultDate || todayStr}
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* Numero Coperti e Orario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numero Persone *
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      name="guestCount"
                      type="number"
                      min="1"
                      max="40"
                      defaultValue="2"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Orario Arrivo *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      name="timeSlot"
                      defaultValue={defaultTime || "20:30"}
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    >
                      {TIME_SLOT_OPTIONS.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Assegnazione Tavolo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assegna Tavolo Subito (Opzionale)
                </label>
                <select
                  name="tableId"
                  defaultValue={defaultTableId || ""}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                  <option value="">-- Assegna all&apos;arrivo / Automatico --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.number} ({t.areaName}) - {t.capacity} posti [{t.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Note / Allergie */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note speciali / Allergie / Preferenze
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="es. Seggiolone per bimbo, celiaco, anniversario"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="taaaac-btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="taaaac-btn-primary text-xs px-5 py-2 disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Salvataggio..." : "Conferma Prenotazione"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
