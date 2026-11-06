"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Star,
  MapPin,
  AlertTriangle,
  FileText,
  Award,
  Sparkles,
  Loader2,
  Plus,
  Minus,
  Calendar,
  Receipt,
  ShoppingBag,
  CreditCard,
  Banknote,
  Clock,
} from "lucide-react";
import { createOrUpdateCustomerAction, CustomerProfileInput } from "@/app/actions";

interface TableSuggestion {
  id: string;
  number: string;
  areaName?: string;
}

export interface CustomerReservationHistoryItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  guestCount: number;
  date: string;
  timeSlot: string;
  status: string;
  notes: string | null;
  tableNumber: string | null;
}

export interface CustomerTableOrderHistoryItem {
  id: string;
  tableId: string;
  tableNumber: string;
  coverCount: number;
  customerName: string | null;
  customerPhone: string | null;
  reservationId: string | null;
  itemsJson: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CustomerTakeawayHistoryItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupTime: string;
  itemsSummary: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface CustomerHistoryBundle {
  reservations: CustomerReservationHistoryItem[];
  tableOrders: CustomerTableOrderHistoryItem[];
  takeawayOrders: CustomerTakeawayHistoryItem[];
  totalSpent: number;
}

interface CustomerModalProps {
  isOpen: boolean;
  customer?: {
    id?: string;
    name: string;
    phoneNumber: string;
    email?: string | null;
    allergies?: string | null;
    favoriteTable?: string | null;
    isVip?: boolean;
    notes?: string | null;
    visitCount?: number;
    loyaltyPoints?: number;
    birthDate?: string | Date | null;
    marketingConsent?: boolean;
  } | null;
  tables?: TableSuggestion[];
  initialTab?: "PROFILE" | "HISTORY";
  history?: CustomerHistoryBundle | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_ALLERGIES = [
  "Senza Glutine (Celiachia)",
  "Senza Lattosio",
  "No Crostacei / Molluschi",
  "No Frutta a Guscio",
  "No Uova",
  "No Pesce",
  "No Soia",
  "Vegetariano",
  "Vegano",
];

export function CustomerModal({
  isOpen,
  customer,
  tables = [],
  initialTab = "PROFILE",
  history = null,
  onClose,
  onSuccess,
}: CustomerModalProps) {
  const [activeTab, setActiveTab] = useState<"PROFILE" | "HISTORY">(initialTab);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [allergies, setAllergies] = useState("");
  const [favoriteTable, setFavoriteTable] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [notes, setNotes] = useState("");
  const [visitCount, setVisitCount] = useState(1);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [birthDate, setBirthDate] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (customer) {
      setName(customer.name || "");
      setPhoneNumber(customer.phoneNumber || "");
      setEmail(customer.email || "");
      setAllergies(customer.allergies || "");
      setFavoriteTable(customer.favoriteTable || "");
      setIsVip(Boolean(customer.isVip));
      setNotes(customer.notes || "");
      setVisitCount(customer.visitCount || 1);
      setLoyaltyPoints(customer.loyaltyPoints || 0);
      setBirthDate(customer.birthDate ? new Date(customer.birthDate).toISOString().slice(0, 10) : "");
      setMarketingConsent(Boolean(customer.marketingConsent));
    } else {
      setName("");
      setPhoneNumber("+39 ");
      setEmail("");
      setAllergies("");
      setFavoriteTable("");
      setIsVip(false);
      setNotes("");
      setVisitCount(1);
      setLoyaltyPoints(0);
      setBirthDate("");
      setMarketingConsent(false);
    }
    setActiveTab(customer?.id ? initialTab : "PROFILE");
    setError(null);
  }, [customer, isOpen, initialTab]);

  if (!isOpen) return null;

  const toggleAllergyChip = (chip: string) => {
    const current = allergies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (current.includes(chip)) {
      const updated = current.filter((s) => s !== chip);
      setAllergies(updated.join(", "));
    } else {
      const updated = [...current, chip];
      setAllergies(updated.join(", "));
    }
  };

  const isChipActive = (chip: string) => {
    const current = allergies
      .split(",")
      .map((s) => s.trim().toLowerCase());
    return current.includes(chip.toLowerCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Inserisci il nome e cognome dell'ospite");
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setError("Inserisci un recapito telefonico valido");
      return;
    }

    startTransition(async () => {
      const payload: CustomerProfileInput = {
        id: customer?.id,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || null,
        allergies: allergies.trim() || null,
        favoriteTable: favoriteTable.trim() || null,
        isVip,
        notes: notes.trim() || null,
        visitCount,
        birthDate: birthDate || null,
        marketingConsent,
      };

      const res = await createOrUpdateCustomerAction(payload);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || "Errore durante il salvataggio");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-xs ${
                isVip
                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isVip ? "⭐" : name.trim() ? name.trim().charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {customer?.id ? "Modifica Scheda Ospite" : "Nuovo Ospite / Cliente"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Profilo CRM completo con preferenze di sala e intolleranze alimentari.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {customer?.id && (
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("PROFILE")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "PROFILE"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Anagrafica & Preferenze</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "HISTORY"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Storico Prenotazioni & Comande (
                {(history?.reservations.length || 0) +
                  (history?.tableOrders.length || 0) +
                  (history?.takeawayOrders.length || 0)}
                )
              </span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === "HISTORY" && customer?.id ? (
          <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
            {/* Riepilogo Storico Cliente */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">
                  Prenotazioni
                </span>
                <strong className="text-xl font-black text-blue-950">
                  {history?.reservations.length || 0}
                </strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">
                  Comande & Asporto
                </span>
                <strong className="text-xl font-black text-amber-950">
                  {(history?.tableOrders.length || 0) + (history?.takeawayOrders.length || 0)}
                </strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                  Spesa Storica
                </span>
                <strong className="text-xl font-black text-emerald-950">
                  € {(history?.totalSpent || 0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Sezione 1: Storico Prenotazioni Tavolo */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Storico Prenotazioni Tavolo ({history?.reservations.length || 0})</span>
              </h4>
              {!history || history.reservations.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Nessuna prenotazione tavolo registrata per questo ospite.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.reservations.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>
                            📅 {new Date(r.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })} · ore {r.timeSlot}
                          </span>
                          {r.tableNumber && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black">
                              Tavolo {r.tableNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          👥 {r.guestCount} coperti {r.notes ? `· 📝 ${r.notes}` : ""}
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          r.status === "COMPLETATA"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : r.status === "ANNULLATA"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sezione 2: Storico Comande al Tavolo & Aggiunte + Pagamenti */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Comande al Tavolo & Pagamenti Cassa ({history?.tableOrders.length || 0})</span>
              </h4>
              {!history || history.tableOrders.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                  Nessuna comanda al tavolo associata a questo cliente.
                </div>
              ) : (
                <div className="space-y-2">
                  {history.tableOrders.map((o) => {
                    let parsedItems: Array<{ name: string; quantity: number; price?: number }> = [];
                    try {
                      parsedItems = JSON.parse(o.itemsJson);
                    } catch {
                      parsedItems = [];
                    }
                    const isPaid = o.paymentStatus === "PAGATO";

                    return (
                      <div
                        key={o.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black">
                              Tavolo {o.tableNumber}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {new Date(o.createdAt).toLocaleString("it-IT", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                isPaid
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-900 border-amber-300"
                              }`}
                            >
                              {isPaid
                                ? `✅ PAGATO (${o.paymentMethod || "CASSA"})`
                                : "💳 DA PAGARE"}
                            </span>
                            <span className="font-black text-sm text-slate-900">
                              € {Number(o.totalAmount || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {parsedItems.length > 0 && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {parsedItems.map((it, idx) => (
                              <span key={idx} className="inline-block mr-2">
                                <strong>{it.quantity}×</strong> {it.name}
                                {idx < parsedItems.length - 1 ? " · " : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sezione 3: Storico Ordini Asporto */}
            {history && history.takeawayOrders.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Ordini Asporto ({history.takeawayOrders.length})</span>
                </h4>
                <div className="space-y-2">
                  {history.takeawayOrders.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          🛍️ Ritiro ore {t.pickupTime} ·{" "}
                          <span className="text-slate-500 font-normal">
                            {new Date(t.createdAt).toLocaleDateString("it-IT")}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{t.itemsSummary}</div>
                      </div>
                      <span className="font-black text-sm text-emerald-800 shrink-0">
                        € {Number(t.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Chiudi Storico
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* VIP Switch Bar */}
          <div
            onClick={() => setIsVip(!isVip)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              isVip
                ? "bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-yellow-500/10 border-amber-300 text-amber-900 shadow-xs"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isVip ? "bg-amber-500 text-white shadow-xs" : "bg-slate-200 text-slate-500"
                }`}
              >
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-sm font-black flex items-center gap-1.5">
                  Ospite VIP / Tavoli Riservati
                  {isVip && (
                    <span className="text-[10px] uppercase font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                      Attivo
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  Priorità nelle prenotazioni, massima cura e attenzione speciale di sala.
                </p>
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                isVip ? "bg-amber-500 justify-end" : "bg-slate-300 justify-start"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
            </div>
          </div>

          {/* Dati Anagrafici */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome e Cognome *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Mario Rossi"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Numero di Telefono *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+39 333 1234567"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-mono font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email (Opzionale)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario.rossi@email.com"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tavolo / Posizione Preferita
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={favoriteTable}
                  onChange={(e) => setFavoriteTable(e.target.value)}
                  placeholder="es. Tavolo 4, Dehors Giardino"
                  list="table-suggestions"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
                <datalist id="table-suggestions">
                  {tables.map((t) => (
                    <option key={t.id} value={`Tavolo ${t.number}${t.areaName ? ` (${t.areaName})` : ""}`} />
                  ))}
                  <option value="Tavolo Giardino" />
                  <option value="Dehors Esterno" />
                  <option value="Angolo Finestra" />
                  <option value="Sala Privé" />
                </datalist>
              </div>
            </div>
          </div>

          {/* Intolleranze & Allergeni */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Intolleranze Alimentari & Allergeni Segnalati
              </label>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Sicurezza Sala
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_ALLERGIES.map((chip) => {
                const active = isChipActive(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleAllergyChip(chip)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-amber-200/90 hover:bg-amber-100/70"
                    }`}
                  >
                    {chip} {active ? "✓" : "+"}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="es. Celiachia severa, No latticini, Allergia alle noci..."
              className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-amber-700/60 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Note Speciali & Preferenze */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Note di Sala, Ricorrenze & Preferenze Personali
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Anniversario a maggio, preferisce vino rosso corposo, gradisce calice di benvenuto..."
              className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Storico Visite & Punti Fedeltà */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Numero Cene / Visite
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisitCount((v) => Math.max(1, v - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={visitCount}
                  onChange={(e) => setVisitCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center py-1 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setVisitCount((v) => v + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Punti Fedeltà Taaaac
              </span>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-slate-900">{loyaltyPoints}</span>
                <a href="/dashboard/fedelta" className="text-[11px] font-bold text-emerald-700 underline">
                  Gestisci dalla cassa fedeltà
                </a>
              </div>
            </div>
          </div>

          {/* Data di nascita e consenso promozionale (buono compleanno) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Data di nascita (facoltativa, per il buono compleanno)
              </label>
              <input
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-700 sm:mt-5">
              <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
              Consenso a comunicazioni promozionali (es. buono compleanno per email)
            </label>
          </div>

          {/* Footer Bottoni */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="taaaac-btn-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvataggio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{customer?.id ? "Salva Modifiche" : "Crea Scheda Ospite"}</span>
                </>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
