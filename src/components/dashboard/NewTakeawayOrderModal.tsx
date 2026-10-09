"use client";

import React, { useState, useMemo } from "react";
import { X, Clock, Plus, Minus, Search, User, Phone, DollarSign, AlertCircle, ShoppingBag } from "lucide-react";
import { createTakeawayOrderAction } from "@/app/actions";

export interface MenuItemSimple {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

export interface CustomerSimple {
  name: string;
  phoneNumber: string;
}

interface NewTakeawayOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItemSimple[];
  existingCustomers: CustomerSimple[];
  existingOrdersSlots: Record<string, number>; // slot -> count
  onOrderCreated?: () => void;
}

const COMMON_SLOTS = [
  "12:30", "12:45", "13:00", "13:15", "13:30", "13:45", "14:00",
  "19:00", "19:15", "19:30", "19:45", "20:00", "20:15", "20:30", "20:45", "21:00", "21:15", "21:30", "21:45", "22:00"
];

export function NewTakeawayOrderModal({
  isOpen,
  onClose,
  menuItems,
  existingCustomers,
  existingOrdersSlots,
  onOrderCreated,
}: NewTakeawayOrderModalProps) {
  // Client Info
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Pickup Time
  const [pickupTime, setPickupTime] = useState(() => {
    // Calcola il prossimo slot a +30 minuti arrotondato ai 15m
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const m = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(m);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  });

  // Selected Dishes: id -> quantity
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({});
  // Custom dish / items text (per varianti o prodotti speciali)
  const [customItemsText, setCustomItemsText] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  // Payment & Notes
  const [paymentStatus, setPaymentStatus] = useState<"DA_PAGARE" | "PAGATO">("DA_PAGARE");
  const [notes, setNotes] = useState("");

  // Menu Search & Filter
  const [menuFilter, setMenuFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tutti");

  // Status
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    menuItems.forEach((m) => set.add(m.category));
    return ["Tutti", ...Array.from(set)];
  }, [menuItems]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === "Tutti" || item.category === selectedCategory;
      const matchQuery =
        !menuFilter.trim() ||
        item.name.toLowerCase().includes(menuFilter.toLowerCase()) ||
        item.category.toLowerCase().includes(menuFilter.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [menuItems, selectedCategory, menuFilter]);

  // Suggestions from CRM based on phone or name
  const customerSuggestions = useMemo(() => {
    if (!phoneNumber && !customerName) return [];
    const qPhone = phoneNumber.trim().toLowerCase();
    const qName = customerName.trim().toLowerCase();
    if (qPhone.length < 3 && qName.length < 2) return [];

    return existingCustomers
      .filter((c) => {
        const pMatch = qPhone.length >= 3 && c.phoneNumber.toLowerCase().includes(qPhone);
        const nMatch = qName.length >= 2 && c.name.toLowerCase().includes(qName);
        return pMatch || nMatch;
      })
      .slice(0, 3);
  }, [existingCustomers, phoneNumber, customerName]);

  // Total amount calculation
  const totalAmount = useMemo(() => {
    let tot = 0;
    Object.entries(dishQuantities).forEach(([id, qty]) => {
      const item = menuItems.find((m) => m.id === id);
      if (item && qty > 0) {
        tot += item.price * qty;
      }
    });
    if (customPrice && !isNaN(parseFloat(customPrice))) {
      tot += parseFloat(customPrice);
    }
    return Math.round(tot * 100) / 100;
  }, [dishQuantities, menuItems, customPrice]);

  // Quick Time Adjustments
  const adjustTimeByMinutes = (mins: number) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + mins);
    const m = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(m);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setPickupTime(`${hh}:${mm}`);
  };

  const handleQtyChange = (id: string, delta: number) => {
    setDishQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerName.trim()) {
      setErrorMsg("Inserisci il nome del cliente");
      return;
    }
    if (!pickupTime.trim()) {
      setErrorMsg("Seleziona l'orario di ritiro");
      return;
    }

    // Costruisci il riepilogo piatti
    const parts: string[] = [];
    Object.entries(dishQuantities).forEach(([id, qty]) => {
      const item = menuItems.find((m) => m.id === id);
      if (item && qty > 0) {
        parts.push(`${qty}x ${item.name}`);
      }
    });

    if (customItemsText.trim()) {
      parts.push(customItemsText.trim());
    }

    if (parts.length === 0) {
      setErrorMsg("Seleziona almeno un piatto dal menù o specifica cosa ordinare nel campo testo.");
      return;
    }

    const itemsSummary = parts.join(", ");

    setSaving(true);
    try {
      const res = await createTakeawayOrderAction({
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        pickupTime: pickupTime.trim(),
        itemsSummary,
        totalAmount,
        notes: notes.trim(),
        paymentStatus,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Errore nella creazione dell'ordine");
      } else {
        // Reset e chiusura
        setCustomerName("");
        setPhoneNumber("");
        setDishQuantities({});
        setCustomItemsText("");
        setCustomPrice("");
        setNotes("");
        setPaymentStatus("DA_PAGARE");
        if (onOrderCreated) onOrderCreated();
        onClose();
      }
    } catch {
      setErrorMsg("Errore di connessione. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Nuova Comanda Asporto</h2>
              <p className="text-xs text-emerald-200/80">Presa ordine rapida per banco e telefono</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 1. Chi Ordina (Cliente & Telefono) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Nome Cliente *
              </label>
              <input
                type="text"
                required
                placeholder="es. Marco Rossi"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> Telefono (per WhatsApp)
              </label>
              <input
                type="tel"
                placeholder="es. 333 1234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          {/* CRM Suggestions */}
          {customerSuggestions.length > 0 && (
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-emerald-800 text-[11px]">Cliente riconosciuto:</span>
              {customerSuggestions.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCustomerName(c.name);
                    setPhoneNumber(c.phoneNumber);
                  }}
                  className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-900 font-medium hover:bg-emerald-100 transition shadow-2xs"
                >
                  {c.name} ({c.phoneNumber})
                </button>
              ))}
            </div>
          )}

          {/* 2. Quando Ritira (Orario con Tasti Rapidi e Saturazione) */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Orario Ritiro Concordato *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustTimeByMinutes(15)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  +15 min
                </button>
                <button
                  type="button"
                  onClick={() => adjustTimeByMinutes(30)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  +30 min
                </button>
                <button
                  type="button"
                  onClick={() => adjustTimeByMinutes(45)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                >
                  +45 min
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="time"
                required
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-32 px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-base text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              {/* Semaforo di carico sullo slot scelto */}
              <div className="flex-1 text-xs">
                {(() => {
                  const count = existingOrdersSlots[pickupTime] || 0;
                  if (count === 0) {
                    return (
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Slot libero (0 ordini)
                      </span>
                    );
                  }
                  if (count < 3) {
                    return (
                      <span className="inline-flex items-center gap-1.5 font-medium text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Carico moderato ({count} ordini in orario)
                      </span>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1.5 font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      Slot molto carico ({count} ordini già fissati!)
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Griglia Slot Veloci */}
            <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0 mr-1">Slot:</span>
              {COMMON_SLOTS.map((slot) => {
                const count = existingOrdersSlots[slot] || 0;
                const isSelected = pickupTime === slot;
                let bgBadge = "bg-white text-slate-700 hover:border-emerald-300";
                if (isSelected) {
                  bgBadge = "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs";
                } else if (count >= 3) {
                  bgBadge = "bg-rose-50 text-rose-700 border-rose-200";
                } else if (count > 0) {
                  bgBadge = "bg-amber-50 text-amber-800 border-amber-200";
                }

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPickupTime(slot)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono shrink-0 transition flex items-center gap-1 ${bgBadge}`}
                  >
                    <span>{slot}</span>
                    {count > 0 && <span className="text-[9px] opacity-80">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Cosa Ordina (Selezione dal Menù + Testo Libero) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Piatti dal Menù Digitale
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Totale: {totalAmount.toFixed(2)} €
              </span>
            </div>

            {/* Barra Categorie & Ricerca */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cerca piatto o pizza..."
                  value={menuFilter}
                  onChange={(e) => setMenuFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto max-w-[50%] scrollbar-none">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCategory(c)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                      selectedCategory === c
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista Piatti Selezionabili */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
              {filteredMenuItems.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400">Nessun piatto trovato con questo filtro.</p>
              ) : (
                filteredMenuItems.map((item) => {
                  const qty = dishQuantities[item.id] || 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-xl transition border ${
                        qty > 0
                          ? "bg-emerald-50/80 border-emerald-300 shadow-2xs"
                          : "bg-white border-slate-200/80 hover:border-slate-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                        <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                          {item.price.toFixed(2)} €
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {qty > 0 && (
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {qty > 0 && (
                          <span className="w-6 text-center text-xs font-black text-emerald-800">
                            {qty}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.id, 1)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition ${
                            qty > 0
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200"
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Testo Libero per Piatti Speciali o Fuori Menù */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                + Prodotti Speciali / Variazioni veloci (Testo Libero)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="es. 1 Pinsa Speciale senza rucola, 1 Bottiglia Chianti"
                  value={customItemsText}
                  onChange={(e) => setCustomItemsText(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="relative w-24">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.00"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-right"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Pagamento & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Stato Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus("DA_PAGARE")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentStatus === "DA_PAGARE"
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Da Pagare al Ritiro
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus("PAGATO")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    paymentStatus === "PAGATO"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Già Saldato ✓
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Note Comanda (sacchetto, citofono, ecc.)
              </label>
              <input
                type="text"
                placeholder="es. Busta separata per celiaco, salsa a parte"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Totale Calcolato:</div>
              <div className="text-xl font-black text-emerald-700 font-mono">{totalAmount.toFixed(2)} €</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? "Registrazione in corso..." : "Registra Comanda (In Coda)"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
