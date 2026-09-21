"use client";

import React, { useTransition } from "react";
import { ShoppingBag, Clock, CheckCircle2, Phone, Sparkles, RefreshCw, X } from "lucide-react";
import { updateTakeawayStatusAction } from "@/app/actions";

export interface TakeawayItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  pickupTime: string;
  itemsSummary: string;
  totalAmount: number;
  status: string;
}

interface TakeawayPanelProps {
  orders: TakeawayItem[];
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  IN_PREPARAZIONE: { label: "In Cucina", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  PRONTO: { label: "Pronto al Banco", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RITIRATO: { label: "Ritirato", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

export function TakeawayPanel({ orders, isOpen, onClose }: TakeawayPanelProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      await updateTakeawayStatusAction(orderId, newStatus);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs p-0">
      <div className="bg-white h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-200 flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Ordini Asporto & Banco</h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 uppercase">
                  Vendoly Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">Gestisci i ritiri senza intasare la mappa dei tavoli</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Orders */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nessun ordine da asporto attivo al momento.
            </div>
          ) : (
            orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.IN_PREPARAZIONE;

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900">
                          {order.customerName}
                        </strong>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{order.phoneNumber}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs block">
                        € {order.totalAmount.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-semibold text-purple-700 flex items-center gap-1 justify-end mt-1">
                        <Clock className="w-3 h-3" />
                        Ritiro: {order.pickupTime}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 font-medium">
                    {order.itemsSummary}
                  </p>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    {order.status === "IN_PREPARAZIONE" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "PRONTO")}
                        disabled={isPending}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Segna Pronto
                      </button>
                    )}

                    {order.status === "PRONTO" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "RITIRATO")}
                        disabled={isPending}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Consegnato al Banco
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Canale Vendoly Attivo</span>
          <button
            type="button"
            onClick={onClose}
            className="taaaac-btn-secondary text-xs px-4 py-1.5"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
