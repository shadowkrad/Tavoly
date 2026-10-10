"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Clock,
  Phone,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  ChefHat,
  MessageCircle,
  DollarSign,
  Trash2,
  Check,
  Flame,
  CreditCard
} from "lucide-react";
import {
  updateTakeawayOrderStatusAction,
  updateTakeawayOrderPaymentAction,
  deleteTakeawayOrderAction
} from "@/app/actions";
import { NewTakeawayOrderModal, MenuItemSimple, CustomerSimple } from "./NewTakeawayOrderModal";

export interface TakeawayOrderData {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupTime: string;
  itemsSummary: string;
  totalAmount: number;
  status: "IN_CODA" | "IN_PREPARAZIONE" | "PRONTO" | "RITIRATO" | "ANNULLATO" | string;
  paymentStatus: "DA_PAGARE" | "PAGATO" | string;
  notes?: string | null;
  createdAt: string | Date;
}

interface TakeawayManagementViewProps {
  initialOrders: TakeawayOrderData[];
  menuItems: MenuItemSimple[];
  existingCustomers: CustomerSimple[];
  restaurantName: string;
  isTakeawayEnabled?: boolean;
}

export function TakeawayManagementView({
  initialOrders,
  menuItems,
  existingCustomers,
  restaurantName,
  isTakeawayEnabled = true,
}: TakeawayManagementViewProps) {
  const [orders, setOrders] = useState<TakeawayOrderData[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"ATTIVI" | "IN_CODA" | "IN_PREPARAZIONE" | "PRONTO" | "RITIRATO">("ATTIVI");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlotFilter, setSelectedSlotFilter] = useState<string | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Mappa slot orario -> conteggio ordini attivi
  const slotCounts = useMemo(() => {
    const map: Record<string, number> = {};
    orders
      .filter((o) => o.status !== "RITIRATO" && o.status !== "ANNULLATO")
      .forEach((o) => {
        map[o.pickupTime] = (map[o.pickupTime] || 0) + 1;
      });
    return map;
  }, [orders]);

  // Statistiche rapide
  const stats = useMemo(() => {
    const inCoda = orders.filter((o) => o.status === "IN_CODA").length;
    const inPrep = orders.filter((o) => o.status === "IN_PREPARAZIONE").length;
    const pronti = orders.filter((o) => o.status === "PRONTO").length;
    const ritirati = orders.filter((o) => o.status === "RITIRATO").length;
    const totalAmount = orders
      .filter((o) => o.status !== "ANNULLATO")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const incassato = orders
      .filter((o) => o.paymentStatus === "PAGATO" && o.status !== "ANNULLATO")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { inCoda, inPrep, pronti, ritirati, totalAmount, incassato };
  }, [orders]);

  // Lista di tutti gli slot ordinati per il semaforo
  const uniqueActiveSlots = useMemo(() => {
    const set = new Set<string>();
    orders
      .filter((o) => o.status !== "RITIRATO" && o.status !== "ANNULLATO")
      .forEach((o) => set.add(o.pickupTime));
    return Array.from(set).sort();
  }, [orders]);

  // Ordini filtrati
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (activeTab === "ATTIVI") {
          if (o.status === "RITIRATO" || o.status === "ANNULLATO") return false;
        } else if (o.status !== activeTab) {
          return false;
        }

        if (selectedSlotFilter && o.pickupTime !== selectedSlotFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = o.customerName.toLowerCase().includes(q);
          const matchPhone = o.phoneNumber.toLowerCase().includes(q);
          const matchItems = o.itemsSummary.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchItems) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.pickupTime !== b.pickupTime) {
          return a.pickupTime.localeCompare(b.pickupTime);
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [orders, activeTab, selectedSlotFilter, searchQuery]);

  // Cambio Stato Ordine
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoadingOrderId(orderId);
    try {
      const res = await updateTakeawayOrderStatusAction(orderId, newStatus);
      if (res.success && res.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Cambio Stato Pagamento
  const handlePaymentToggle = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAGATO" ? "DA_PAGARE" : "PAGATO";
    setLoadingOrderId(orderId);
    try {
      const res = await updateTakeawayOrderPaymentAction(orderId, nextStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: nextStatus } : o))
        );
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Cancellazione Ordine
  const handleDelete = async (orderId: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo ordine di asporto?")) return;
    setLoadingOrderId(orderId);
    try {
      const res = await deleteTakeawayOrderAction(orderId);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  // Helper WhatsApp 1-Click
  const openWhatsAppNotification = (order: TakeawayOrderData) => {
    const cleanPhone = order.phoneNumber.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      alert("Nessun numero di telefono valido per questo cliente.");
      return;
    }
    const phoneWithCountry = cleanPhone.startsWith("39") ? cleanPhone : `39${cleanPhone}`;
    const text = `Ciao ${order.customerName}! 👋 Il tuo ordine da ${restaurantName} è PRONTO al banco per il ritiro! Ti aspettiamo per consegnartelo caldo. 🍽️`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Calcolo tempo relativo intelligente
  const getTimeUrgency = (pickupTime: string, status: string) => {
    if (status === "RITIRATO" || status === "ANNULLATO") return null;
    const [hh, mm] = pickupTime.split(":").map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const targetMins = hh * 60 + mm;
    const diff = targetMins - currentMins;

    if (Math.abs(diff) > 240) {
      return null;
    }

    if (diff < -15) {
      return { text: `In ritardo (${Math.abs(diff)}m)`, color: "text-rose-700 bg-rose-50 border-rose-200 font-bold" };
    }
    if (diff < 0) {
      return { text: "Orario superato", color: "text-rose-600 bg-rose-50 border-rose-200 font-bold" };
    }
    if (diff <= 15) {
      return { text: `Tra ${diff}m`, color: "text-amber-800 bg-amber-100 border-amber-300 font-bold animate-pulse" };
    }
    if (diff <= 60) {
      return { text: `Tra ${diff}m`, color: "text-emerald-700 bg-emerald-50 border-emerald-200 font-semibold" };
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Header con Titolo & Bottone Principale */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Ordini Asporto & Takeaway
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gestione comande da asporto: presa ordini rapida, avanzamento cucina e ritiro clienti al banco.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewOrderModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Ordine Asporto</span>
        </button>
      </div>

      {!isTakeawayEnabled && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <div>
              <strong className="block text-sm">Il servizio Asporto & Takeaway è attualmente disattivato</strong>
              <span className="text-amber-700">I clienti online non possono inviare ordini per il ritiro. Puoi comunque inserire ordini telefonici o al banco.</span>
            </div>
          </div>
          <a
            href="/dashboard/impostazioni"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 self-start sm:self-auto transition-all"
          >
            Configura & Attiva Asporto
          </a>
        </div>
      )}

      {/* 2. Metriche Rapide (4 Card spaziose con padding generoso e gap ampio) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>In Coda</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.inCoda}</div>
          <div className="text-xs text-slate-400 font-medium">Da avviare in cucina</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>In Preparazione</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.inPrep}</div>
          <div className="text-xs text-slate-400 font-medium">Attualmente ai fornelli</div>
        </div>

        <div className={`p-5 rounded-2xl border transition-all ${
          stats.pronti > 0
            ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200 shadow-xs"
            : "bg-white border-slate-200 shadow-xs hover:shadow-md"
        }`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-800">
            <span>Pronti al Banco!</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-3xl font-black text-emerald-900 tracking-tight">{stats.pronti}</div>
          <div className="text-xs text-emerald-700 font-medium">In attesa del cliente</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Incasso Totale</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">{stats.totalAmount.toFixed(2)} €</div>
          <div className="text-xs text-slate-400 font-medium">
            Saldati: <strong className="text-emerald-700 font-mono font-bold">{stats.incassato.toFixed(2)} €</strong>
          </div>
        </div>
      </div>

      {/* 3. Semaforo di Saturazione Oraria Cucina */}
      {uniqueActiveSlots.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Saturazione Orari Asporto (Ordini per Quarto d&apos;Ora)
            </span>
            {selectedSlotFilter && (
              <button
                type="button"
                onClick={() => setSelectedSlotFilter(null)}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer"
              >
                Rimuovi filtro orario ({selectedSlotFilter})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {uniqueActiveSlots.map((slot) => {
              const count = slotCounts[slot] || 0;
              const isSelected = selectedSlotFilter === slot;
              let badgeColor = "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300";
              if (count >= 4) {
                badgeColor = "bg-rose-50 text-rose-800 border-rose-300 font-black";
              } else if (count >= 2) {
                badgeColor = "bg-amber-50 text-amber-800 border-amber-300 font-bold";
              } else if (count === 1) {
                badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium";
              }

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlotFilter(isSelected ? null : slot)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono shrink-0 transition flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-emerald-600 font-bold bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : badgeColor
                  }`}
                >
                  <span className="font-bold">{slot}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-white text-emerald-800 font-bold" : "bg-black/5 text-slate-700 font-bold"
                  }`}>
                    {count} {count === 1 ? "ordine" : "ordini"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Barra Filtri Stato & Ricerca Rapida */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Tab Fasi ben distanziate con padding e margini comodi */}
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("ATTIVI")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "ATTIVI"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tutti gli Attivi ({stats.inCoda + stats.inPrep + stats.pronti})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IN_CODA")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "IN_CODA"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            In Coda ({stats.inCoda})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IN_PREPARAZIONE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "IN_PREPARAZIONE"
                ? "bg-orange-500 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            In Preparazione ({stats.inPrep})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PRONTO")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "PRONTO"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pronti al Banco ({stats.pronti})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RITIRATO")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              activeTab === "RITIRATO"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ritirati ({stats.ritirati})
          </button>
        </div>

        {/* Ricerca per Nome / Telefono con icona correttamente posizionata e padding a prova di sovrapposizione */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cerca cliente, telefono o piatto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-xs placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 5. Griglia Ordini Asporto (Card ampie con gap generoso e layout arioso) */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nessuna comanda in questa vista</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tutte le comande sono state completate oppure non ci sono ordini corrispondenti ai filtri.
          </p>
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Inserisci Nuovo Ordine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord) => {
            const urgency = getTimeUrgency(ord.pickupTime, ord.status);
            const isBusy = loadingOrderId === ord.id;

            return (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  ord.status === "PRONTO"
                    ? "border-emerald-300 ring-2 ring-emerald-200/70 bg-emerald-50/10"
                    : ord.status === "IN_PREPARAZIONE"
                    ? "border-orange-200 bg-orange-50/10"
                    : "border-slate-200/90 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                {/* Parte Superiore: Orario, Urgenza, Stato e Cestino */}
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-mono text-base font-black px-2.5 py-1 rounded-xl bg-slate-900 text-white tracking-wide shrink-0">
                        {ord.pickupTime}
                      </div>
                      {urgency && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-lg border truncate ${urgency.color}`}>
                          {urgency.text}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Badge Stato */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          ord.status === "PRONTO"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : ord.status === "IN_PREPARAZIONE"
                            ? "bg-orange-100 text-orange-800 border-orange-300"
                            : ord.status === "IN_CODA"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {ord.status === "IN_CODA" && "🟡 In Coda"}
                        {ord.status === "IN_PREPARAZIONE" && "👨‍🍳 In Cucina"}
                        {ord.status === "PRONTO" && "📦 Pronto al Banco"}
                        {ord.status === "RITIRATO" && "✓ Ritirato"}
                        {ord.status === "ANNULLATO" && "✕ Annullato"}
                      </span>

                      {/* Cestino eliminazione comanda pulito e discreto in testata */}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleDelete(ord.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Elimina comanda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Informazioni Cliente & Pagamento */}
                  <div className="pt-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{ord.customerName}</h3>
                      {ord.phoneNumber ? (
                        <a
                          href={`tel:${ord.phoneNumber}`}
                          className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 mt-1 font-mono"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ord.phoneNumber}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-1 block">Nessun recapito</span>
                      )}
                    </div>

                    {/* Badge Pagamento interattivo */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePaymentToggle(ord.id, ord.paymentStatus)}
                      title="Clicca per invertire stato pagamento"
                      className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        ord.paymentStatus === "PAGATO"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>{ord.paymentStatus === "PAGATO" ? "Saldato ✓" : "Da Pagare"}</span>
                    </button>
                  </div>

                  {/* Lista Piatti Ordinati (Ogni pietanza formattata su riga dedicata con bullet verde) */}
                  <div className="mt-3.5 rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-1.5">
                    {ord.itemsSummary.split(",").map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                        <span className="font-medium leading-relaxed">{item.trim()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Note Speciali */}
                  {ord.notes && (
                    <div className="mt-2.5 text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{ord.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer Card: Totale e Pulsantiera di Avanzamento */}
                <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Totale comanda:</span>
                    <strong className="font-mono text-base font-black text-slate-900">
                      {ord.totalAmount.toFixed(2)} €
                    </strong>
                  </div>

                  {/* Tasti di Avanzamento Spaziosi */}
                  <div className="space-y-2">
                    {/* Se In Coda -> Inizia Preparazione */}
                    {ord.status === "IN_CODA" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(ord.id, "IN_PREPARAZIONE")}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Metti in Lavorazione Cucina</span>
                      </button>
                    )}

                    {/* Se In Preparazione -> Pronto al Banco */}
                    {ord.status === "IN_PREPARAZIONE" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(ord.id, "PRONTO")}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Segna come Pronto al Banco!</span>
                      </button>
                    )}

                    {/* Se Pronto al Banco -> Tasto WhatsApp dedicato + Tasto Consegna */}
                    {ord.status === "PRONTO" && (
                      <div className="space-y-2">
                        {ord.phoneNumber && (
                          <button
                            type="button"
                            onClick={() => openWhatsAppNotification(ord)}
                            className="w-full py-2 px-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#128C7E] hover:text-[#075E54] text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                            title="Invia messaggio WhatsApp al cliente"
                          >
                            <MessageCircle className="w-4 h-4 text-[#25D366]" />
                            <span>Avvisa Cliente su WhatsApp</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(ord.id, "RITIRATO")}
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Consegna & Segna Ritirato</span>
                        </button>
                      </div>
                    )}

                    {/* Se Ritirato -> Tasto Ripristina */}
                    {ord.status === "RITIRATO" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(ord.id, "PRONTO")}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition cursor-pointer"
                      >
                        Riporta tra i Pronti al Banco
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Presa Ordine */}
      <NewTakeawayOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        menuItems={menuItems}
        existingCustomers={existingCustomers}
        existingOrdersSlots={slotCounts}
        onOrderCreated={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
