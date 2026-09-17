"use client";

import React, { useState, useTransition } from "react";
import { Plus, X, Calendar, Clock, User, Phone, Users, MessageSquare, Check } from "lucide-react";
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
}

export function NewReservationModal({ tables }: NewReservationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
        form.reset();
      } else {
        setErrorMsg(res.error || "Errore durante il salvataggio");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="taaaac-btn-primary text-sm shadow-xs cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Nuova Prenotazione</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Nuova Prenotazione Tavolo
                </h3>
                <p className="text-xs text-slate-500">
                  Registra una prenotazione per il servizio odierno
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
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
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Recapito & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cellulare (per WhatsApp Bot) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      name="phoneNumber"
                      type="tel"
                      required
                      placeholder="+39 340 0000000"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      max="30"
                      defaultValue="2"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      defaultValue="20:30"
                      required
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="12:30">12:30 (Pranzo)</option>
                      <option value="13:00">13:00 (Pranzo)</option>
                      <option value="13:30">13:30 (Pranzo)</option>
                      <option value="19:30">19:30 (Cena)</option>
                      <option value="20:00">20:00 (Cena)</option>
                      <option value="20:30">20:30 (Cena)</option>
                      <option value="21:00">21:00 (Cena)</option>
                      <option value="21:30">21:30 (Cena)</option>
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
                  defaultValue=""
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="taaaac-btn-secondary text-xs px-4 py-2"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="taaaac-btn-primary text-xs px-5 py-2 disabled:opacity-50"
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
