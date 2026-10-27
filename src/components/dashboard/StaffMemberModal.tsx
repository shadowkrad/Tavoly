"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Shield,
  KeyRound,
  MapPin,
  Clock,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { createOrUpdateStaffMemberAction, StaffMemberInput } from "@/app/actions";

export interface AreaItem {
  id: string;
  name: string;
}

export interface StaffMemberData {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  color: string;
  pin: string | null;
  assignedAreas: string | null;
  serviceShifts: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface StaffMemberModalProps {
  isOpen: boolean;
  staffMember?: StaffMemberData | null;
  areas: AreaItem[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const STAFF_ROLES = [
  { id: "CAMERIERE", label: "Cameriere di Sala", icon: "🍽️", desc: "Presa comande e servizio ai tavoli" },
  { id: "CAPOSALA", label: "Caposala / Maître", icon: "🎩", desc: "Gestione sala, accoglienza e assegnazione tavoli" },
  { id: "BARMAN", label: "Barman & Sommelier", icon: "🍸", desc: "Preparazione drink, aperitivi e cantina" },
  { id: "CUOCO", label: "Chef / Cucina", icon: "👨‍🍳", desc: "Brigata cucina e avanzamento comande KDS" },
  { id: "PIZZAIOLO", label: "Pizzaiolo", icon: "🍕", desc: "Forno e preparazione pizze" },
  { id: "CASSIERE", label: "Cassa & Accoglienza", icon: "💳", desc: "Conti, ricevute e prenotazioni all'ingresso" },
];

export const COLOR_PRESETS = [
  { hex: "#10b981", label: "Smeraldo" },
  { hex: "#0ea5e9", label: "Azzurro" },
  { hex: "#6366f1", label: "Indaco" },
  { hex: "#8b5cf6", label: "Viola" },
  { hex: "#ec4899", label: "Rosa" },
  { hex: "#f59e0b", label: "Ambra" },
  { hex: "#ef4444", label: "Rosso Corallo" },
  { hex: "#64748b", label: "Ardesia" },
];

export function StaffMemberModal({
  isOpen,
  staffMember,
  areas,
  onClose,
  onSuccess,
}: StaffMemberModalProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [role, setRole] = useState("CAMERIERE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState("#10b981");
  const [pin, setPin] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [shifts, setShifts] = useState<{ pranzo: boolean; cena: boolean }>({
    pranzo: true,
    cena: true,
  });
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staffMember) {
      setName(staffMember.name || "");
      setRole(staffMember.role || "CAMERIERE");
      setPhone(staffMember.phone || "");
      setEmail(staffMember.email || "");
      setColor(staffMember.color || "#10b981");
      setPin(staffMember.pin || "");
      setIsActive(staffMember.isActive !== false);
      setNotes(staffMember.notes || "");

      // Parse assigned areas
      if (staffMember.assignedAreas) {
        try {
          const parsed = JSON.parse(staffMember.assignedAreas);
          setSelectedAreas(Array.isArray(parsed) ? parsed : []);
        } catch {
          setSelectedAreas([]);
        }
      } else {
        setSelectedAreas([]);
      }

      // Parse shifts
      if (staffMember.serviceShifts) {
        try {
          const parsedShifts = JSON.parse(staffMember.serviceShifts);
          setShifts({
            pranzo: Array.isArray(parsedShifts) ? parsedShifts.includes("PRANZO") : true,
            cena: Array.isArray(parsedShifts) ? parsedShifts.includes("CENA") : true,
          });
        } catch {
          setShifts({ pranzo: true, cena: true });
        }
      } else {
        setShifts({ pranzo: true, cena: true });
      }
    } else {
      // Default reset
      setName("");
      setRole("CAMERIERE");
      setPhone("");
      setEmail("");
      setColor("#10b981");
      setPin("");
      setSelectedAreas(areas.map((a) => a.id)); // default: tutte le sale
      setShifts({ pranzo: true, cena: true });
      setIsActive(true);
      setNotes("");
    }
    setError(null);
  }, [staffMember, isOpen, areas]);

  if (!isOpen) return null;

  const toggleArea = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Inserisci il nome e cognome del collaboratore");
      return;
    }

    if (pin.trim() && !/^\d{4}$/.test(pin.trim())) {
      setError("Il PIN di accesso rapido deve essere esattamente di 4 cifre numeriche (es. 1234)");
      return;
    }

    const activeShifts: string[] = [];
    if (shifts.pranzo) activeShifts.push("PRANZO");
    if (shifts.cena) activeShifts.push("CENA");

    const payload: StaffMemberInput = {
      id: staffMember?.id,
      name: name.trim(),
      role,
      phone: phone.trim() || null,
      email: email.trim() || null,
      color,
      pin: pin.trim() || null,
      assignedAreas: selectedAreas,
      serviceShifts: activeShifts,
      isActive,
      notes: notes.trim() || null,
    };

    startTransition(async () => {
      const res = await createOrUpdateStaffMemberAction(payload);
      if (!res.success) {
        setError(res.error || "Errore durante il salvataggio dello staff");
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {name ? name.slice(0, 2).toUpperCase() : "👨‍🍳"}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                {staffMember ? "Modifica Membro Staff" : "Nuovo Operatore / Cameriere"}
              </h3>
              <p className="text-xs text-slate-500">
                Configurazione anagrafica, sale assegnate e PIN palmare rapido
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Dati Principali */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome e Cognome *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Mario Rossi"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ruolo & Mansione Principale
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contatti */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="es. +39 340 1234567"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email (opzionale)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="es. mario@ristorante.it"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* PIN Palmare Rapido & Colore Avatar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  PIN Accesso Rapido (4 Cifre)
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePin}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Genera Automatico
                </button>
              </div>
              <input
                type="text"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="es. 1234"
                className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Consente login istantaneo su palmari, cassa o monitor cucina senza digitare password.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Colore Identificativo Avatar
              </label>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                    className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center text-white ${
                      color === c.hex
                        ? "ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    {color === c.hex && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assegnazione Zone / Sale */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Sale & Zone di Competenza
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Seleziona le aree assegnate all&apos;operatore per il filtraggio rapido sulla mappa tavoli:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {areas.map((area) => {
                const isSelected = selectedAreas.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{area.name}</span>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Turni di Servizio Abituali */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Turni di Servizio Abituali
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shifts.pranzo}
                  onChange={(e) => setShifts((prev) => ({ ...prev, pranzo: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Servizio Pranzo ☀️</span>
                  <p className="text-[10px] text-slate-400">Attivo durante la fascia oraria pranzo</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shifts.cena}
                  onChange={(e) => setShifts((prev) => ({ ...prev, cena: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Servizio Cena 🌙</span>
                  <p className="text-[10px] text-slate-400">Attivo durante la fascia oraria cena</p>
                </div>
              </label>
            </div>
          </div>

          {/* Note Interne */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Note di Servizio & Mansioni Interne
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Referente cassa del sabato sera, specializzato in carta vini..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Stato Operativo (Attivo / Non Attivo) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Stato Operativo</span>
              <p className="text-[11px] text-slate-400">
                Se disattivato, il collaboratore non comparirà nell&apos;assegnazione tavoli
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{staffMember ? "Salva Modifiche" : "Aggiungi allo Staff"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
