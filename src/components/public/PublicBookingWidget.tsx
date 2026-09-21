"use client";

import React, { useState, useTransition } from "react";
import {
  Users,
  Calendar,
  Clock,
  Phone,
  User,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
} from "lucide-react";
import { createPublicReservationAction } from "@/app/actions";

export interface PublicShiftData {
  id: string;
  name: string;
  slots: string[];
  maxGuests: number;
  isActive: boolean;
  currentBooked?: number;
}

const DEFAULT_SHIFTS: PublicShiftData[] = [
  { id: "1", name: "Pranzo", slots: ["12:30", "13:00", "13:30", "14:00"], maxGuests: 40, isActive: true, currentBooked: 10 },
  { id: "2", name: "Aperitivo al Bar", slots: ["18:30", "19:00", "19:30"], maxGuests: 30, isActive: true, currentBooked: 5 },
  { id: "3", name: "Cena 1° Turno", slots: ["20:00", "20:30"], maxGuests: 45, isActive: true, currentBooked: 24 },
  { id: "4", name: "Cena 2° Turno", slots: ["21:30", "22:00"], maxGuests: 45, isActive: true, currentBooked: 8 },
];

interface PublicBookingWidgetProps {
  shifts?: PublicShiftData[];
}

const STEPS = ["Data & Coperti", "Turno & Orario", "Preferenze Tavolo", "I tuoi dati", "Riepilogo"];

export function PublicBookingWidget({ shifts = DEFAULT_SHIFTS }: PublicBookingWidgetProps) {
  const activeShifts = shifts.filter((s) => s.isActive);
  const [step, setStep] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 0: Data & Coperti
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [guestCount, setGuestCount] = useState<number>(2);

  // Step 1: Turno & Orario
  const initialShift = activeShifts[0] || DEFAULT_SHIFTS[0];
  const [selectedShiftId, setSelectedShiftId] = useState<string>(initialShift.id);
  const [selectedSlot, setSelectedSlot] = useState<string>(initialShift.slots[0] || "20:30");

  // Step 2: Preferenze
  const [seatingArea, setSeatingArea] = useState<string>("Indifferente");
  const [specialRequests, setSpecialRequests] = useState<string>("");

  // Step 3: Dati Cliente
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);

  const currentShift = activeShifts.find((s) => s.id === selectedShiftId) || activeShifts[0];
  const isShiftFull = currentShift && (currentShift.currentBooked || 0) >= currentShift.maxGuests;

  const goNext = () => {
    setErrorMsg(null);
    if (step === 0) {
      if (!selectedDate) {
        setErrorMsg("Seleziona una data per la prenotazione.");
        return;
      }
      if (guestCount < 1) {
        setErrorMsg("Indica almeno 1 persona.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (isShiftFull) {
        setErrorMsg(`Il turno "${currentShift?.name}" è al completo per questa data.`);
        return;
      }
      if (!selectedSlot) {
        setErrorMsg("Seleziona un orario tra quelli disponibili.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (!customerName.trim()) {
        setErrorMsg("Il tuo nome è obbligatorio per la prenotazione.");
        return;
      }
      if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 6) {
        setErrorMsg("Inserisci un numero di cellulare valido per la conferma WhatsApp.");
        return;
      }
      if (!privacyAccepted) {
        setErrorMsg("È necessario accettare l'informativa sulla privacy.");
        return;
      }
      setStep(4);
    }
  };

  const goBack = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleFinalSubmit = () => {
    setErrorMsg(null);
    const formData = new FormData();
    formData.set("customerName", customerName.trim());
    formData.set("customerPhone", customerPhone.trim());
    if (customerEmail.trim()) formData.set("customerEmail", customerEmail.trim());
    formData.set("date", selectedDate);
    formData.set("timeSlot", selectedSlot);
    formData.set("guestCount", String(guestCount));

    const notesCombined = [
      seatingArea !== "Indifferente" ? `Zona: ${seatingArea}` : null,
      specialRequests.trim() ? specialRequests.trim() : null,
    ]
      .filter(Boolean)
      .join(" - ");

    if (notesCombined) {
      formData.set("notes", notesCombined);
    }

    startTransition(async () => {
      const res = await createPublicReservationAction(formData);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || "Impossibile completare la prenotazione. Riprova tra poco.");
      }
    });
  };

  // Schermata di Successo stile Schedly
  if (isSuccess) {
    return (
      <div className="text-center p-8 bg-white border-2 border-emerald-500/30 rounded-3xl max-w-xl mx-auto animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl mb-4 shadow-xs">
          🎉
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
          Prenotazione Confermata con Successo!
        </h3>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Grazie <strong>{customerName}</strong>! Il tuo tavolo per{" "}
          <strong>{guestCount} {guestCount === 1 ? "persona" : "persone"}</strong> è riservato per il giorno{" "}
          <strong>{new Date(selectedDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long" })}</strong> alle ore{" "}
          <strong>{selectedSlot}</strong> ({currentShift?.name}).
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3 text-left">
          <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Notifica WhatsApp Inviata a {customerPhone}</p>
            <p className="text-emerald-700 mt-0.5">
              Troverai il promemoria automatico e le indicazioni per raggiungerci direttamente sul tuo smartphone.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setStep(0);
          }}
          className="mt-6 taaaac-btn-primary text-xs px-6 py-3 rounded-xl shadow-xs"
        >
          Effettua un&apos;altra prenotazione
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Bar a pallini stile Schedly */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {STEPS.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                idx < step
                  ? "bg-blue-600 text-white"
                  : idx === step
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {idx < step ? "✓" : idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-5 sm:w-10 h-0.5 ${
                  idx < step ? "bg-blue-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Step {step + 1} di {STEPS.length}: <span className="text-blue-600 font-bold">{STEPS[step]}</span>
      </p>

      {/* Contenitore Card Form Step */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 0: Data & Coperti */}
        {step === 0 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quando vuoi venire a trovarci?</h2>
              <p className="text-xs text-slate-500 mt-0.5">Seleziona la data e il numero di coperti da riservare.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Data di Prenotazione
              </label>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Numero di Ospiti ({guestCount} {guestCount === 1 ? "Persona" : "Persone"})
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setGuestCount(num)}
                    className={`py-3 rounded-2xl border font-bold text-sm transition-all ${
                      guestCount === num
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    {num} {num === 8 ? "+" : ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Turno & Orario */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Scegli Turno e Orario</h2>
              <p className="text-xs text-slate-500 mt-0.5">Seleziona il momento della giornata in cui accomodarti.</p>
            </div>

            {/* Turni Disponibili */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Turno di Servizio
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeShifts.map((s) => {
                  const isSelected = selectedShiftId === s.id;
                  const isFull = (s.currentBooked || 0) >= s.maxGuests;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => {
                        setSelectedShiftId(s.id);
                        if (s.slots[0]) setSelectedSlot(s.slots[0]);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        isFull
                          ? "opacity-50 cursor-not-allowed bg-slate-100 border-slate-200"
                          : isSelected
                          ? "border-blue-600 bg-blue-50/60 ring-2 ring-blue-200 shadow-xs"
                          : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{s.name}</span>
                        {isFull ? (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                            Completo
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Disponibile
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Capienza: {s.maxGuests} coperti
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Orari per il Turno */}
            {currentShift && currentShift.slots.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Orario di Arrivo per {currentShift.name}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {currentShift.slots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl border text-center font-bold text-sm transition-all ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white hover:border-blue-300 border-slate-200 text-slate-800"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Preferenze Tavolo */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hai richieste particolari per il tavolo?</h2>
              <p className="text-xs text-slate-500 mt-0.5">Segnalaci la tua area preferita o eventuali intolleranze.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Zona Preferita
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Indifferente", "Sala Interna", "Dehors / Esterno"].map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSeatingArea(area)}
                    className={`py-3 px-2 rounded-2xl border text-xs font-bold transition-all ${
                      seatingArea === area
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Note, Allergie o Seggioloni Bimbi (Opzionale)
              </label>
              <textarea
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Es. 1 seggiolone per bambino, 1 celiaco, tavolo appartato..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* STEP 3: I Tuoi Dati */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Chi effettua la prenotazione?</h2>
              <p className="text-xs text-slate-500 mt-0.5">I dati servono per la conferma del tavolo e il promemoria WhatsApp.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome e Cognome *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Mario Rossi"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cellulare per Conferma WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+39 340 1234567"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email (Opzionale)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="mario.rossi@email.it"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded mt-0.5 cursor-pointer"
                />
                <span>
                  Accetto l&apos;informativa sulla privacy (GDPR) e l&apos;invio del promemoria automatico WhatsApp per la mia prenotazione.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: Riepilogo & Conferma */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Riepilogo della Prenotazione</h2>
              <p className="text-xs text-slate-500 mt-0.5">Verifica i dettagli prima di inviare la richiesta alla sala.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Data & Ora</span>
                <span className="font-bold text-slate-900">
                  {new Date(selectedDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long" })} alle {selectedSlot}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Turno</span>
                <span className="font-bold text-slate-900">{currentShift?.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Ospiti</span>
                <span className="font-bold text-blue-600">{guestCount} {guestCount === 1 ? "persona" : "persone"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Zona</span>
                <span className="font-bold text-slate-900">{seatingArea}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200/80">
                <span className="text-slate-500">Nominativo</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telefono</span>
                <span className="font-bold text-slate-900">{customerPhone}</span>
              </div>
              {specialRequests && (
                <div className="pt-2 text-xs text-slate-500 italic">
                  Note: &quot;{specialRequests}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pulsanti Navigazione Step */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Indietro
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
            >
              <span>Continua</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={handleFinalSubmit}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              {isPending ? "Conferma in corso..." : "Conferma Prenotazione Tavolo 🎉"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
