"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Share2,
} from "lucide-react";
import {
  TakeawaySettings,
  calculateAvailableTakeawaySlots,
  TakeawaySlotInfo,
} from "@/lib/takeaway-rules";
import { createPublicTakeawayOrderAction } from "@/app/actions";
import { ALLERGEN_ICONS } from "@/lib/allergens";

export interface PublicTakeawayDish {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  allergens: string; // JSON array string
}

interface CartItem {
  dish: PublicTakeawayDish;
  quantity: number;
  notes?: string;
}

interface PublicTakeawayWidgetProps {
  settings: TakeawaySettings;
  dishes: PublicTakeawayDish[];
  existingOrders: Array<{ pickupTime: string; pickupDate?: string | null }>;
  restaurantName: string;
}

export function PublicTakeawayWidget({
  settings,
  dishes,
  existingOrders,
  restaurantName,
}: PublicTakeawayWidgetProps) {
  const [isPending, startTransition] = useTransition();

  // Step di compilazione: 1 = data & ora, 2 = piatti, 3 = dati cliente, 4 = conferma
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Filtro Categorie Menù
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Carrello Piatti
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // Dati Cliente
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  // Feedback & Esito
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    customerName: string;
    pickupDate: string | null;
    pickupTime: string;
    itemsSummary: string;
    totalAmount: number;
  } | null>(null);

  // Calcolo Slot Disponibili per la data selezionata
  const dayCalculation = useMemo(() => {
    const ordersForDate = existingOrders.filter((o) => {
      if (o.pickupDate) return o.pickupDate === selectedDate;
      return selectedDate === todayStr;
    });
    return calculateAvailableTakeawaySlots(selectedDate, settings, ordersForDate, new Date());
  }, [selectedDate, settings, existingOrders, todayStr]);

  // Categorie univoche presenti nei piatti da asporto
  const categories = useMemo(() => {
    const cats = Array.from(new Set(dishes.map((d) => d.category)));
    return cats;
  }, [dishes]);

  // Piatti filtrati
  const filteredDishes = useMemo(() => {
    if (selectedCategory === "ALL") return dishes;
    return dishes.filter((d) => d.category === selectedCategory);
  }, [dishes, selectedCategory]);

  // Gestione Carrello
  const updateQuantity = (dish: PublicTakeawayDish, delta: number) => {
    setCart((prev) => {
      const existing = prev[dish.id];
      const newQty = (existing?.quantity || 0) + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[dish.id];
        return next;
      }
      return {
        ...prev,
        [dish.id]: {
          dish,
          quantity: newQty,
          notes: existing?.notes || "",
        },
      };
    });
  };

  const updateItemNotes = (dishId: string, notes: string) => {
    setCart((prev) => {
      if (!prev[dishId]) return prev;
      return {
        ...prev,
        [dishId]: {
          ...prev[dishId],
          notes,
        },
      };
    });
  };

  // Totali
  const cartItemsList = useMemo(() => Object.values(cart), [cart]);
  const cartTotalAmount = useMemo(
    () => cartItemsList.reduce((sum, it) => sum + it.dish.price * it.quantity, 0),
    [cartItemsList]
  );
  const cartTotalQuantity = useMemo(
    () => cartItemsList.reduce((sum, it) => sum + it.quantity, 0),
    [cartItemsList]
  );

  // Invio Ordine
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedSlot) {
      setErrorMsg("Seleziona un orario di ritiro per il tuo ordine.");
      return;
    }
    if (cartItemsList.length === 0) {
      setErrorMsg("Aggiungi almeno un piatto al tuo ordine di asporto.");
      return;
    }
    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMsg("Inserisci il tuo nome e cognome per il ritiro al banco.");
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.trim().length < 6) {
      setErrorMsg("Inserisci un numero di cellulare valido.");
      return;
    }

    startTransition(async () => {
      const payload = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        pickupDate: selectedDate,
        pickupTime: selectedSlot,
        items: cartItemsList.map((it) => ({
          dishId: it.dish.id,
          quantity: it.quantity,
          notes: it.notes?.trim() || undefined,
        })),
        notes: orderNotes.trim() || undefined,
      };

      const res = await createPublicTakeawayOrderAction(payload);
      if (res.success && res.order) {
        setConfirmedOrder(res.order);
      } else {
        setErrorMsg(res.error || "Si è verificato un errore durante l'invio dell'ordine.");
      }
    });
  };

  // 1. Se l'asporto è globalmente disabilitato dall'esercente
  if (!settings.enabled) {
    return (
      <div className="py-12 px-4 text-center space-y-5 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Servizio Asporto al momento non attivo
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {restaurantName} non accetta ordini di asporto in questo periodo. Puoi comunque riservare comodamente un tavolo per mangiare in sala.
          </p>
        </div>
        <Link
          href="/prenotazione"
          className="taaaac-btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center gap-2 shadow-md"
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Prenota un Tavolo in Sala</span>
        </Link>
      </div>
    );
  }

  // 2. Schermata di Conferma Ordine Riuscito
  if (confirmedOrder) {
    return (
      <div className="py-8 px-4 text-center space-y-6 max-w-lg mx-auto animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Ordine Asporto Confermato
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
            Grazie, {confirmedOrder.customerName}!
          </h2>
          <p className="text-xs text-slate-500">
            La cucina ha preso in carico la tua comanda. Ti aspettiamo al pass del ristorante per il ritiro.
          </p>
        </div>

        {/* Box Dettaglio Ritiro */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 text-left space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <span className="text-xs text-slate-500 font-semibold">Orario di Ritiro Concordato:</span>
            <span className="text-base font-black text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-xl">
              🕒 Ore {confirmedOrder.pickupTime}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Data Ritiro:</span>
            <strong className="text-slate-800">
              {confirmedOrder.pickupDate === todayStr ? "Oggi" : confirmedOrder.pickupDate}
            </strong>
          </div>

          <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 space-y-1">
            <span className="font-semibold block text-slate-700">Piatti Ordinati:</span>
            <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px] leading-relaxed">
              {confirmedOrder.itemsSummary}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-xs font-bold text-slate-800">Totale da Saldare al Ritiro:</span>
            <span className="text-lg font-black text-slate-900 font-mono">
              € {confirmedOrder.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Azioni finali */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setConfirmedOrder(null);
              setCart({});
              setSelectedSlot(null);
            }}
            className="taaaac-btn-secondary text-xs px-5 py-2.5 w-full sm:w-auto"
          >
            Fai un Altro Ordine
          </button>
          <Link
            href="/"
            className="taaaac-btn-primary text-xs px-6 py-2.5 w-full sm:w-auto shadow-md"
          >
            Torna alla Vetrina
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleOrderSubmit} className="space-y-8">
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SCELTA DATA E ORARIO DI RITIRO (REGOLE E CAPACITÀ) */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Scegli la Data e l&apos;Orario di Ritiro
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Preavviso minimo cucina: <strong>{settings.prepTimeMinutes} min</strong>
          </span>
        </div>

        {/* Selettore Data */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              setSelectedSlot(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              selectedDate === todayStr
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            Oggi ({todayStr.split("-").slice(1).reverse().join("/")})
          </button>
          <input
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSlot(null);
            }}
            className="taaaac-input text-xs py-1.5 px-3 w-auto font-medium"
          />
        </div>

        {/* Verifica giorno chiuso o non valido */}
        {!dayCalculation.isOpenDay ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            {dayCalculation.reason || "Nessuna disponibilità di asporto per la data selezionata."}
          </div>
        ) : dayCalculation.slots.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500">
            Nessun orario di ritiro configurato per questo giorno.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Orari disponibili per il ritiro:
              </span>
              <span className="text-[10px] text-slate-500">
                Max {settings.maxOrdersPerSlot} comande per slot
              </span>
            </div>

            {/* Griglia Orari Ritiro */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {dayCalculation.slots.map((slotInfo) => {
                const isSelected = selectedSlot === slotInfo.time;
                return (
                  <button
                    key={slotInfo.time}
                    type="button"
                    disabled={!slotInfo.isAvailable}
                    onClick={() => {
                      setSelectedSlot(slotInfo.time);
                      setErrorMsg(null);
                    }}
                    title={slotInfo.reason}
                    className={`p-2.5 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300"
                        : slotInfo.isAvailable
                        ? "bg-white text-slate-800 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span className="text-sm font-black font-mono">{slotInfo.time}</span>
                    <span className="text-[9px] font-medium leading-tight">
                      {slotInfo.isFull
                        ? "Completo ❌"
                        : slotInfo.isPastOrTooSoon
                        ? "Troppo presto"
                        : `${slotInfo.remainingCapacity} disp.`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: SELEZIONE PIATTI DALL&apos;ASPORTO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Scegli i Piatti per l&apos;Asporto
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {cartTotalQuantity} piatti nel carrello ({cartTotalAmount.toFixed(2)} €)
          </span>
        </div>

        {/* Filtro Categorie */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutti i Piatti ({dishes.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Griglia Piatti Asporto */}
        {filteredDishes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            Nessun piatto disponibile in questa categoria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredDishes.map((dish) => {
              const qtyInCart = cart[dish.id]?.quantity || 0;
              let allergensList: string[] = [];
              try {
                allergensList = JSON.parse(dish.allergens || "[]");
              } catch {
                allergensList = [];
              }

              return (
                <div
                  key={dish.id}
                  className={`bg-white border rounded-2xl p-4 flex gap-3.5 items-start justify-between transition-all ${
                    qtyInCart > 0
                      ? "border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50/20 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  {/* Foto se presente */}
                  {dish.imageUrl && (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-18 h-18 rounded-xl object-cover border border-slate-100 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  )}

                  {/* Informazioni Piatto */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {dish.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug truncate">
                      {dish.name}
                    </h4>
                    {dish.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {dish.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="font-mono font-bold text-xs text-emerald-800">
                        {dish.price.toFixed(2)} €
                      </span>
                      {allergensList.length > 0 && (
                        <div className="flex items-center gap-0.5 text-[10px] text-amber-700">
                          {allergensList.slice(0, 3).map((a) => (
                            <span key={a} title={`Contiene: ${a}`}>
                              {ALLERGEN_ICONS[a] || "⚠️"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controlli Quantità */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                    {qtyInCart === 0 ? (
                      <button
                        type="button"
                        onClick={() => updateQuantity(dish, 1)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Aggiungi</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-emerald-600 text-white rounded-xl p-1 shadow-xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-95 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-black text-xs px-1.5">{qtyInCart}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-95 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STEP 3: DATI CLIENTE & INVIO */}
      {cartItemsList.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              I tuoi Recapiti per il Ritiro
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome e Cognome *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="taaaac-input pl-9 text-xs w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefono / Cellulare *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Es. 333 1234567"
                  className="taaaac-input pl-9 text-xs w-full"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email (Facoltativa, per riepilogo)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mario.rossi@email.it"
                className="taaaac-input pl-9 text-xs w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note speciali per la cucina / Ritiro
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Es. Senza posate di plastica, ritira mia moglie Maria..."
              className="taaaac-input text-xs w-full"
            />
          </div>

          {/* Riepilogo Finale e Bottone Invio */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">
                Ritiro: <strong>{selectedDate === todayStr ? "Oggi" : selectedDate}</strong> alle ore{" "}
                <strong className="text-emerald-700 text-sm">{selectedSlot || "---"}</strong>
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Totale Ordine ({cartTotalQuantity} piatti):{" "}
                <span className="font-mono text-base font-black text-emerald-700">
                  € {cartTotalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || !selectedSlot || cartTotalQuantity === 0}
              className="taaaac-btn-primary px-8 py-3 text-xs sm:text-sm font-black shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isPending
                  ? "Invio in corso..."
                  : `Conferma & Invia Ordine (€ ${cartTotalAmount.toFixed(2)})`}
              </span>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
