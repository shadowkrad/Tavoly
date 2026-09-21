"use client";

import React, { useState, useTransition } from "react";
import { Users, Calendar, Clock, Phone, User, Mail, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { createPublicReservationAction } from "@/app/actions";

const TIME_SLOTS = [
  { shift: "Pranzo", slots: ["12:30", "13:00", "13:30", "14:00"] },
  { shift: "Aperitivo al Bar", slots: ["18:30", "19:00", "19:30"] },
  { shift: "Cena", slots: ["20:00", "20:30", "21:00", "21:30", "22:00"] },
];

export function PublicBookingWidget() {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState("Cena");
  const [selectedSlot, setSelectedSlot] = useState("20:30");
  const [guestCount, setGuestCount] = useState(2);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("timeSlot", selectedSlot);
    formData.set("guestCount", String(guestCount));

    startTransition(async () => {
      const res = await createPublicReservationAction(formData);
      if (res.success) {
        setIsSuccess(true);
        form.reset();
      } else {
        setErrorMsg(res.error || "Impossibile completare la prenotazione");
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="taaaac-card text-center p-8 bg-white border-2 border-emerald-500/30 max-w-xl mx-auto animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Prenotazione Ricevuta!
        </h3>
        <p className="text-sm text-slate-600 mt-2">
          Abbiamo registrato la tua richiesta per <strong className="text-slate-900">{guestCount} {guestCount === 1 ? "persona" : "persone"}</strong> alle ore <strong className="text-slate-900">{selectedSlot}</strong>.
        </p>
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-3 text-left">
          <MessageSquare className="w-6 h-6 text-emerald-600 shrink-0" />
          <span>
            Riceverai a breve un messaggio di riepilogo su <strong>WhatsApp</strong> con le indicazioni e il promemoria automatico prima del tuo arrivo.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-6 taaaac-btn-secondary text-xs px-6 py-2.5 mx-auto"
        >
          Effettua un&apos;altra prenotazione
        </button>
      </div>
    );
  }

  const currentSlots = TIME_SLOTS.find((s) => s.shift === selectedShift)?.slots || TIME_SLOTS[0].slots;

  return (
    <div className="taaaac-card max-w-xl mx-auto bg-white p-6 sm:p-8 shadow-sm">
      <div className="mb-6">
        <span className="taaaac-badge bg-blue-50 text-blue-700 border border-blue-100 mb-2">
          Prenotazione Online Immediata
        </span>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Riserva il Tuo Tavolo
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Nessuna attesa: conferma automatica con promemoria WhatsApp
        </p>
      </div>

      {errorMsg && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Scelta Turno / Servizio */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Momento del Giorno
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_SLOTS.map((t) => (
              <button
                key={t.shift}
                type="button"
                onClick={() => {
                  setSelectedShift(t.shift);
                  setSelectedSlot(t.slots[0]);
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedShift === t.shift
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {t.shift}
              </button>
            ))}
          </div>
        </div>

        {/* Data & Numero Coperti */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Data
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                name="date"
                type="date"
                min={todayStr}
                defaultValue={todayStr}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              3. Numero Ospiti
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                className="w-10 h-9.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 py-2 border border-slate-200 rounded-xl text-center font-bold text-sm bg-white flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>{guestCount} {guestCount === 1 ? "Ospite" : "Ospiti"}</span>
              </div>
              <button
                type="button"
                onClick={() => setGuestCount((c) => Math.min(25, c + 1))}
                className="w-10 h-9.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Scelta Orario / Slot */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            4. Orario di Arrivo
          </label>
          <div className="flex flex-wrap gap-2">
            {currentSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  selectedSlot === slot
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Dati Contatto */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome e Cognome *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                name="customerName"
                type="text"
                required
                placeholder="es. Giulia Brambilla"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cellulare (per WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  name="phoneNumber"
                  type="tel"
                  required
                  placeholder="+39 349 1234567"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email (opzionale)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  name="email"
                  type="email"
                  placeholder="giulia@email.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Intolleranze, allergie o preferenze tavolo
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="es. 1 celiaco, gradito tavolo tranquillo o seggiolone"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="taaaac-btn-primary w-full py-3 text-sm font-bold shadow-md cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Invio prenotazione..." : `Conferma Prenotazione (${selectedSlot} - ${guestCount} persone)`}
        </button>
      </form>
    </div>
  );
}
