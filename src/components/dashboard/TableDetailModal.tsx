"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Users,
  CheckCircle2,
  Receipt,
  Sparkles,
  UserCheck,
  AlertCircle,
  Calendar,
  Clock,
  ChefHat,
  CreditCard,
  Banknote,
  Printer,
  Plus,
  Utensils,
} from "lucide-react";
import {
  updateTableStatus,
  updateTableSeatedCountAction,
  createWalkInAction,
  settleTableBillAction,
} from "@/app/actions";
import { TableItem } from "./TableCanvasBoard";
import { WaiterOrderModal } from "./WaiterOrderModal";
import { ThermalTicketModal } from "./ThermalTicketModal";
import { EscPosTicketData } from "@/lib/escpos";

interface ReservationItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  guestCount: number;
  timeSlot: string;
  status: string;
  notes: string | null;
  tableId: string | null;
}

export interface TableOrderSummaryItem {
  id: string;
  tableNumber: string;
  coverCount: number;
  waiterName: string | null;
  status: string;
  paymentStatus: string;
  itemsJson: string;
  notes: string | null;
  totalAmount: number;
  createdAt: string;
}

interface TableDetailModalProps {
  table: TableItem | null;
  reservations: ReservationItem[];
  tableOrders?: TableOrderSummaryItem[];
  restaurantName?: string;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, { label: string; badge: string; color: string }> = {
  LIBERO: {
    label: "Libero",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    color: "emerald",
  },
  OCCUPATO: {
    label: "Occupato",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    color: "rose",
  },
  PRENOTATO: {
    label: "Prenotato",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    color: "blue",
  },
  CONTO: {
    label: "Conto Richiesto",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    color: "amber",
  },
  DA_PULIRE: {
    label: "Da Sparecchiare / Pulire",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    color: "purple",
  },
};

const ORDER_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  IN_CODA: {
    label: "⏳ In Coda Cucina",
    cls: "bg-amber-100 text-amber-900 border-amber-300",
  },
  IN_PREPARAZIONE: {
    label: "🔥 In Preparazione",
    cls: "bg-blue-100 text-blue-900 border-blue-300",
  },
  PRONTO: {
    label: "🔔 Pronto al Pass",
    cls: "bg-emerald-100 text-emerald-900 border-emerald-300 animate-pulse",
  },
  SERVITO: {
    label: "✅ Servito al Tavolo",
    cls: "bg-slate-200 text-slate-800 border-slate-300",
  },
};

export function TableDetailModal({
  table,
  reservations,
  tableOrders = [],
  restaurantName = "Tavoly Ristorante",
  isOpen,
  onClose,
}: TableDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [walkInGuests, setWalkInGuests] = useState<number>(table?.capacity || 2);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARTA" | "CONTANTI">("CARTA");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState<EscPosTicketData | null>(null);

  if (!isOpen || !table) return null;

  const currentStatus = STATUS_LABELS[table.status] || STATUS_LABELS.LIBERO;
  const isBar = table.shape === "BAR";

  // Trova eventuali prenotazioni assegnate a questo tavolo
  const tableReservations = reservations.filter(
    (r) => r.tableId === table.id && r.status !== "ANNULLATA" && r.status !== "COMPLETATA"
  );

  // Trova tutte le comande e aggiunte attive per questo tavolo (DA_PAGARE)
  const activeOrders = tableOrders.filter(
    (o) =>
      o.tableNumber.trim().toLowerCase() === table.number.trim().toLowerCase() &&
      o.paymentStatus === "DA_PAGARE" &&
      o.status !== "ANNULLATO"
  );

  const totalBill = activeOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  // Parsa i piatti per ogni comanda
  const parsedOrders = activeOrders.map((o, idx) => {
    let items: Array<{ name: string; quantity: number; price?: number; variants?: string[] }> = [];
    try {
      items = JSON.parse(o.itemsJson);
    } catch {
      items = [{ name: "Comanda Tavolo", quantity: 1, price: o.totalAmount }];
    }
    const timeStr = new Date(o.createdAt).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return {
      ...o,
      orderIndex: idx + 1,
      isAddition: idx > 0,
      timeStr,
      items,
    };
  });

  const handleSetStatus = (newStatus: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await updateTableStatus(table.id, newStatus);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Errore aggiornamento tavolo");
      }
    });
  };

  const handleSettleBill = (nextStatus: "LIBERO" | "DA_PULIRE" = "LIBERO") => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await settleTableBillAction(table.id, paymentMethod, nextStatus);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Errore durante la chiusura del conto");
      }
    });
  };

  const handlePrintUnifiedBill = () => {
    const allItems: Array<{ name: string; quantity: number; price?: number; category?: string; variants?: string[] }> = [];
    parsedOrders.forEach((po) => {
      po.items.forEach((it) => {
        allItems.push({
          name: po.isAddition ? `${it.name} (Agg. #${po.orderIndex})` : it.name,
          quantity: it.quantity || 1,
          price: it.price || 0,
          variants: it.variants,
        });
      });
    });

    setTicketData({
      orderType: "TAVOLO",
      title: `PRECONTO TAVOLO ${table.number}`,
      subtitle: tableReservations[0]
        ? `Ospite: ${tableReservations[0].customerName}`
        : `Sala: ${table.area.name}`,
      coverCount: table.seatedCount || parsedOrders[0]?.coverCount || 2,
      restaurantName,
      items: allItems,
      notes: `TOTALE CONTO DA INCASSARE: € ${totalBill.toFixed(2)}`,
      timestamp: new Date(),
    });
    setIsPrintModalOpen(true);
  };

  const handleDeltaSeated = (delta: number) => {
    startTransition(async () => {
      await updateTableSeatedCountAction(table.id, delta);
    });
  };

  const handleWalkIn = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await createWalkInAction(table.id, walkInGuests);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Impossibile registrare cliente walk-in");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header Tavolo */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs">
              {table.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  {isBar ? "Postazione Banco" : "Tavolo"} {table.number}
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentStatus.badge}`}>
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {table.area.name} · Capienza max {table.capacity} posti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SEZIONE CONTO ATTIVO, COMANDE & AGGIUNTE (CASSA) */}
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Conto Tavolo &amp; Comande ({parsedOrders.length})
              </span>
            </div>
            <span className="text-base font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              € {totalBill.toFixed(2)}
            </span>
          </div>

          {parsedOrders.length === 0 ? (
            <div className="text-center py-3 bg-white/80 rounded-xl border border-amber-200/60">
              <p className="text-xs text-slate-500 font-medium">
                Nessuna comanda aperta da riscuotere per questo tavolo.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {parsedOrders.map((po) => {
                const stBadge = ORDER_STATUS_BADGE[po.status] || ORDER_STATUS_BADGE.IN_CODA;
                return (
                  <div
                    key={po.id}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                            po.isAddition
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-slate-900 text-white"
                          }`}
                        >
                          {po.isAddition ? `➕ Aggiunta #${po.orderIndex}` : `1ª Comanda`}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ore {po.timeStr}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stBadge.cls}`}>
                        {stBadge.label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {po.items.map((it, i) => (
                        <div key={i} className="flex items-start justify-between text-xs">
                          <div className="font-semibold text-slate-800">
                            <span className="font-black text-emerald-700 mr-1.5">{it.quantity}x</span>
                            <span>{it.name}</span>
                            {it.variants && it.variants.length > 0 && (
                              <span className="block text-[10px] text-amber-700 font-normal pl-4">
                                ↳ {it.variants.join(", ")}
                              </span>
                            )}
                          </div>
                          {it.price !== undefined && (
                            <span className="text-slate-600 font-mono text-[11px] shrink-0 ml-2">
                              € {((it.price || 0) * (it.quantity || 1)).toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {po.notes && (
                      <p className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200/70">
                        📝 Note: {po.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">Cameriere: {po.waiterName || "Sala"}</span>
                      <span className="font-black text-slate-800">Subtotale: € {po.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pulsanti Comanda / Nuova Aggiunta e Stampa Preconto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{parsedOrders.length > 0 ? "Aggiungi Piatti (Aggiunta)" : `Prendi Comanda Tav. ${table.number}`}</span>
            </button>

            {parsedOrders.length > 0 && (
              <button
                type="button"
                onClick={handlePrintUnifiedBill}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Stampa Preconto (€ {totalBill.toFixed(2)})</span>
              </button>
            )}
          </div>

          {/* Box Riscossione Cassa se ci sono comande aperte o tavolo occupato/conto */}
          {(parsedOrders.length > 0 || table.status === "CONTO" || table.status === "OCCUPATO") && (
            <div className="pt-2 border-t border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700">Metodo di Riscossione Cassa:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARTA")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition ${
                      paymentMethod === "CARTA"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>POS / Carta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CONTANTI")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer transition ${
                      paymentMethod === "CONTANTI"
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    <Banknote className="w-3 h-3" />
                    <span>Contanti</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSettleBill("LIBERO")}
                disabled={isPending}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {totalBill > 0
                    ? `Incassa € ${totalBill.toFixed(2)} (${paymentMethod}) · Chiudi Conto & Libera`
                    : "Chiudi Conto & Libera Tavolo"}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Gestione Coperti Seduti */}
        <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Persone Sedute al Tavolo
            </span>
            <span className="text-xs font-bold text-slate-900">
              {table.seatedCount} / {table.capacity} coperti
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {Array.from({ length: Math.max(table.capacity, table.seatedCount) }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    idx < table.seatedCount
                      ? "bg-rose-600 border-rose-700 scale-105 shadow-2xs"
                      : "bg-emerald-200 border-emerald-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDeltaSeated(-1)}
                disabled={table.seatedCount <= 0 || isPending}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center cursor-pointer disabled:opacity-30 shadow-2xs"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleDeltaSeated(1)}
                disabled={isPending}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-black text-sm flex items-center justify-center cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Azioni Stato Tavolo */}
        <div className="space-y-2">
          {table.status === "LIBERO" && (
            <div className="space-y-2.5">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-emerald-950 block">
                  Accoglienza Veloce (Walk-in)
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white border border-emerald-200 rounded-xl px-2 py-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <select
                      value={walkInGuests}
                      onChange={(e) => setWalkInGuests(Number(e.target.value))}
                      className="bg-transparent text-xs font-bold text-slate-900 border-none outline-none cursor-pointer"
                    >
                      {Array.from({ length: table.capacity + 2 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "persona" : "persone"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleWalkIn}
                    disabled={isPending}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Occupa Subito</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetStatus("PRENOTATO")}
                  disabled={isPending}
                  className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Segna Prenotato</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetStatus("DA_PULIRE")}
                  disabled={isPending}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Da Sanificare</span>
                </button>
              </div>
            </div>
          )}

          {table.status === "OCCUPATO" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetStatus("CONTO")}
                disabled={isPending}
                className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-700" />
                <span>Segna &ldquo;Conto Richiesto&rdquo;</span>
              </button>
              <button
                type="button"
                onClick={() => handleSettleBill("DA_PULIRE")}
                disabled={isPending}
                className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Salda &amp; Da Sparecchiare</span>
              </button>
            </div>
          )}

          {table.status === "PRENOTATO" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetStatus("OCCUPATO")}
                disabled={isPending}
                className="col-span-2 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                <span>Accomoda Ospiti al Tavolo</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStatus("LIBERO")}
                disabled={isPending}
                className="col-span-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Annulla Prenotazione · Libera</span>
              </button>
            </div>
          )}

          {table.status === "DA_PULIRE" && (
            <button
              type="button"
              onClick={() => handleSetStatus("LIBERO")}
              disabled={isPending}
              className="w-full p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tavolo Pulito &amp; Pronto (Libero)</span>
            </button>
          )}
        </div>

        {/* Prenotazioni Associate a questo tavolo */}
        {tableReservations.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Prenotazione Associata al Tavolo
            </span>
            <div className="space-y-1.5">
              {tableReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{res.customerName}</span>
                    <span className="text-blue-700">ore {res.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <span>{res.guestCount} ospiti</span>
                    <span>{res.phoneNumber}</span>
                  </div>
                  {res.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 mt-1">
                      Note: {res.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {table.notes && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <strong>Note Tavolo:</strong> {table.notes}
          </div>
        )}
      </div>

      {/* Modal Presa Comanda / Aggiunta */}
      <WaiterOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        initialTableNumber={table.number}
      />

      {/* Modal Stampa Preconto Unificato */}
      <ThermalTicketModal
        isOpen={isPrintModalOpen}
        ticketData={ticketData}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}
