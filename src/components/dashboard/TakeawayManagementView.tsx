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
  Filter,
  Check,
  Flame,
  ArrowRight
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
}

export function TakeawayManagementView({
  initialOrders,
  menuItems,
  existingCustomers,
  restaurantName,
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
        // Tab status filter
        if (activeTab === "ATTIVI") {
          if (o.status === "RITIRATO" || o.status === "ANNULLATO") return false;
        } else if (o.status !== activeTab) {
          return false;
        }

        // Slot filter
        if (selectedSlotFilter && o.pickupTime !== selectedSlotFilter) {
          return false;
        }

        // Search query
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
        // Ordina per orario di ritiro crescente per gli attivi
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
      alert("Nessun numero di telefono registrato per questo cliente.");
      return;
    }
    // Aggiungi prefisso 39 se assente e numero italiano a 10 cifre
    const phoneWithCountry = cleanPhone.startsWith("39") ? cleanPhone : `39${cleanPhone}`;
    const text = `Ciao ${order.customerName}! 👋 Il tuo ordine da ${restaurantName} è PRONTO al banco per il ritiro! Ti aspettiamo per consegnartelo caldo. 🍽️`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  // Calcolo tempo relativo (es. "tra 15 min", "Adesso!", "In ritardo")
  const getTimeUrgency = (pickupTime: string, status: string) => {
    if (status === "RITIRATO" || status === "ANNULLATO") return null;
    const [hh, mm] = pickupTime.split(":").map(Number);
    if (isNaN(hh) || isNaN(mm)) return null;

    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);

    const diffMinutes = Math.round((target.getTime() - now.getTime()) / (1000 * 60));

    if (diffMinutes < -15) {
      return { text: `In ritardo di ${Math.abs(diffMinutes)} min`, color: "text-rose-700 bg-rose-50 border-rose-300 font-bold" };
    }
    if (diffMinutes < 0) {
      return { text: "Orario superato!", color: "text-rose-600 bg-rose-50 border-rose-200 font-bold" };
    }
    if (diffMinutes <= 15) {
      return { text: `Tra ${diffMinutes} min`, color: "text-amber-700 bg-amber-50 border-amber-300 font-bold animate-pulse" };
    }
    if (diffMinutes <= 45) {
      return { text: `Tra ${diffMinutes} min`, color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    }
    const diffHours = Math.round(diffMinutes / 60);
    return { text: `Tra circa ${diffHours} h`, color: "text-slate-600 bg-slate-100 border-slate-200" };
  };

  return (
    <div className="space-y-6">
      {/* 1. Header con Azioni & Metriche Chiave */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Ordini Asporto & Takeaway
              </h1>
              <p className="text-xs text-slate-500">
                Flusso comande semplificato: presa ordine rapida, avanzamento cucina e avviso clienti al banco.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Ordine Asporto</span>
          </button>
        </div>
      </div>

      {/* 2. Metriche Rapide (4 Card a colpo d'occhio) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In Coda</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.inCoda}</div>
          <div className="text-[11px] text-slate-400">Da avviare in cucina</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In Preparazione</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.inPrep}</div>
          <div className="text-[11px] text-slate-400">Attualmente ai fornelli</div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-2xs space-y-1 transition ${
          stats.pronti > 0 ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-200" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Pronti al Banco!</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-black text-emerald-900">{stats.pronti}</div>
          <div className="text-[11px] text-emerald-700 font-medium">In attesa del cliente</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Incasso Totale</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalAmount.toFixed(2)} €</div>
          <div className="text-[11px] text-slate-400">
            Saldati: <strong className="text-emerald-700 font-mono">{stats.incassato.toFixed(2)} €</strong>
          </div>
        </div>
      </div>

      {/* 3. Semaforo di Saturazione Oraria Cucina */}
      {uniqueActiveSlots.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Saturazione Orari Asporto (Ordini per Quarto d&apos;Ora)
            </span>
            {selectedSlotFilter && (
              <button
                type="button"
                onClick={() => setSelectedSlotFilter(null)}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold underline"
              >
                Rimuovi filtro orario ({selectedSlotFilter})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {uniqueActiveSlots.map((slot) => {
              const count = slotCounts[slot] || 0;
              const isSelected = selectedSlotFilter === slot;
              let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
              if (count >= 4) {
                badgeColor = "bg-rose-100 text-rose-800 border-rose-300 font-black";
              } else if (count >= 2) {
                badgeColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
              }

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlotFilter(isSelected ? null : slot)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono shrink-0 transition flex items-center gap-2 ${
                    isSelected ? "ring-2 ring-emerald-600 font-bold bg-emerald-600 text-white border-emerald-600" : badgeColor
                  }`}
                >
                  <span className="font-bold">{slot}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white text-emerald-800" : "bg-black/10 text-slate-800 font-bold"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Fasi */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("ATTIVI")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === "ATTIVI"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tutti gli Attivi ({stats.inCoda + stats.inPrep + stats.pronti})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IN_CODA")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === "IN_CODA"
                ? "bg-amber-500 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            In Coda ({stats.inCoda})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("IN_PREPARAZIONE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === "IN_PREPARAZIONE"
                ? "bg-orange-500 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            In Preparazione ({stats.inPrep})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PRONTO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === "PRONTO"
                ? "bg-emerald-600 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pronti al Banco ({stats.pronti})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RITIRATO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
              activeTab === "RITIRATO"
                ? "bg-slate-800 text-white font-bold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Ritirati ({stats.ritirati})
          </button>
        </div>

        {/* Ricerca per Nome / Telefono */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cerca cliente, tel o piatto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {/* 5. Griglia Ordini Asporto */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nessuna comanda in questa vista</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tutte le comande sono state evase oppure non ci sono ordini per i filtri selezionati.
          </p>
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" /> Inserisci Nuovo Ordine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((ord) => {
            const urgency = getTimeUrgency(ord.pickupTime, ord.status);
            const isBusy = loadingOrderId === ord.id;

            return (
              <div
                key={ord.id}
                className={`bg-white rounded-2xl border p-4.5 shadow-2xs space-y-3.5 transition flex flex-col justify-between ${
                  ord.status === "PRONTO"
                    ? "border-emerald-300 ring-2 ring-emerald-100/80 bg-emerald-50/15"
                    : ord.status === "IN_PREPARAZIONE"
                    ? "border-orange-200 bg-orange-50/10"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Header Card: Orario Cubitale & Badge Stato */}
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-base font-black px-2.5 py-1 rounded-xl bg-slate-900 text-white tracking-wide">
                        {ord.pickupTime}
                      </div>
                      {urgency && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-lg border ${urgency.color}`}>
                          {urgency.text}
                        </span>
                      )}
                    </div>

                    {/* Stato Ordine Badge */}
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
                  </div>

                  {/* Informazioni Cliente */}
                  <div className="pt-2.5 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{ord.customerName}</h3>
                      {ord.phoneNumber ? (
                        <a
                          href={`tel:${ord.phoneNumber}`}
                          className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 mt-0.5 font-mono"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{ord.phoneNumber}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">Nessun recapito telefonico</span>
                      )}
                    </div>

                    {/* Badge Pagamento interattivo */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePaymentToggle(ord.id, ord.paymentStatus)}
                      title="Clicca per invertire stato pagamento"
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer shrink-0 ${
                        ord.paymentStatus === "PAGATO"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                      }`}
                    >
                      {ord.paymentStatus === "PAGATO" ? "Saldato ✓" : "Da Pagare"}
                    </button>
                  </div>

                  {/* Contenuto Ordine */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                      {ord.itemsSummary}
                    </div>
                  </div>

                  {/* Eventuali Note */}
                  {ord.notes && (
                    <div className="mt-2 text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{ord.notes}</span>
                    </div>
                  )}
                </div>

                {/* Footer Card: Totale & Pulsanti Azione Rapida */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Totale comanda:</span>
                    <strong className="font-mono text-base font-black text-emerald-800">
                      {ord.totalAmount.toFixed(2)} €
                    </strong>
                  </div>

                  {/* Pulsantiera di Avanzamento Stato */}
                  <div className="flex items-center gap-2">
                    {/* Se In Coda -> Metti in Preparazione */}
                    {ord.status === "IN_CODA" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(ord.id, "IN_PREPARAZIONE")}
                        className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Inizia Preparazione</span>
                      </button>
                    )}

                    {/* Se In Preparazione -> Pronto al Banco */}
                    {ord.status === "IN_PREPARAZIONE" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(ord.id, "PRONTO")}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pronto al Banco!</span>
                      </button>
                    )}

                    {/* Se Pronto al Banco -> WhatsApp + Ritirato */}
                    {ord.status === "PRONTO" && (
                      <>
                        {ord.phoneNumber && (
                          <button
                            type="button"
                            onClick={() => openWhatsAppNotification(ord)}
                            className="py-2 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                            title="Avvisa il cliente su WhatsApp che l'ordine è pronto"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(ord.id, "RITIRATO")}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Ritirato & Saldato</span>
                        </button>
                      </>
                    )}

                    {/* Se Ritirato -> Tasto per riaprire se necessario */}
                    {ord.status === "RITIRATO" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(ord.id, "PRONTO")}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        Riporta a Pronto
                      </button>
                    )}

                    {/* Tasto Cancella */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(ord.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Elimina comanda"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          // Re-fetch o ricarica dinamica
          window.location.reload();
        }}
      />
    </div>
  );
}
