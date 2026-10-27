"use client";

import React, { useRef, useState, useTransition } from "react";
import {
  X,
  Printer,
  Wifi,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  Receipt,
  Download,
} from "lucide-react";
import { EscPosTicketData } from "@/lib/escpos";

interface ThermalTicketModalProps {
  isOpen: boolean;
  ticketData: EscPosTicketData | null;
  onClose: () => void;
  onSendToLanPrinter?: () => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function ThermalTicketModal({
  isOpen,
  ticketData,
  onClose,
  onSendToLanPrinter,
}: ThermalTicketModalProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !ticketData) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleLanPrint = () => {
    if (!onSendToLanPrinter) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await onSendToLanPrinter();
      if (res.success) {
        setFeedback({ type: "success", text: res.message || "Comanda inviata alla stampante termica!" });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ type: "error", text: res.error || "Errore invio a stampante di rete" });
      }
    });
  };

  const dateFormatted = (ticketData.timestamp ? new Date(ticketData.timestamp) : new Date()).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
        {/* Header (Nascosto in Stampa) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Stampa Comanda Termica ESC/POS
              </h3>
              <p className="text-xs text-slate-500">
                Formato standard scontrino termico cucina & pizzeria (80mm)
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

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`m-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 border print:hidden ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Preview Scontrino Termico (Stile Carta Termica Monospaced) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 flex justify-center print:p-0 print:bg-white">
          <div
            ref={printAreaRef}
            className="w-full max-w-[340px] bg-white p-5 rounded-2xl shadow-md border border-slate-300/80 font-mono text-slate-900 text-xs leading-relaxed space-y-3 print:border-none print:shadow-none print:p-0 print:max-w-[80mm] print:w-[80mm] print:mx-auto"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* Intestazione */}
            <div className="text-center space-y-0.5 border-b-2 border-dashed border-slate-900 pb-3">
              <div className="text-base font-black tracking-wider uppercase">
                {ticketData.restaurantName || "TAVOLY RESTAURANT"}
              </div>
              <div className="text-[11px] font-bold">*** COMANDA CUCINA ***</div>
              <div className="text-[10px] text-slate-600">{dateFormatted}</div>
            </div>

            {/* Titolo Ordine Principale */}
            <div className="text-center py-1.5 border-b-2 border-dashed border-slate-900 space-y-1">
              <div className="text-2xl font-black tracking-tight leading-none">
                {ticketData.title}
              </div>
              {ticketData.subtitle && (
                <div className="text-xs font-bold text-slate-700">{ticketData.subtitle}</div>
              )}
              {ticketData.timeSlot && (
                <div className="text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded inline-block mt-1">
                  ORARIO: {ticketData.timeSlot}
                </div>
              )}
              {ticketData.coverCount && (
                <div className="text-xs font-bold">COPERTI: {ticketData.coverCount} PERSONE</div>
              )}
              {ticketData.customerPhone && (
                <div className="text-[11px]">Tel: {ticketData.customerPhone}</div>
              )}
            </div>

            {/* Elenco Piatti */}
            <div className="space-y-2 py-1">
              {ticketData.items.map((item, idx) => (
                <div key={idx} className="border-b border-dotted border-slate-300 pb-1.5">
                  <div className="flex items-start justify-between font-bold text-[13px]">
                    <span className="w-8 shrink-0 font-black">{item.quantity}x</span>
                    <span className="flex-1 text-left">{item.name}</span>
                  </div>
                  {item.variants && item.variants.length > 0 && (
                    <div className="pl-8 text-[11px] font-semibold text-slate-700">
                      {item.variants.map((v, vIdx) => (
                        <div key={vIdx}>&gt;&gt; {v}</div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="pl-8 text-[11px] font-semibold text-rose-700">
                      &gt;&gt; NOTA: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Note Generali / Allergeni Box */}
            {ticketData.notes && (
              <div className="p-2 border-2 border-black rounded-lg text-center space-y-0.5">
                <div className="text-[10px] font-black uppercase">NOTE / ALLERGIE:</div>
                <div className="text-xs font-black text-rose-700">{ticketData.notes}</div>
              </div>
            )}

            {/* Footer Taglio */}
            <div className="text-center pt-2 text-[10px] text-slate-500 border-t-2 border-dashed border-slate-900">
              --- FINE COMANDA ---
            </div>
          </div>
        </div>

        {/* Footer Azioni (Nascosto in Stampa) */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-slate-400" />
            <span>Supporta stampanti termiche LAN/Wi-Fi (IP:9100) e browser</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onSendToLanPrinter && (
              <button
                type="button"
                onClick={handleLanPrint}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
                title="Invia direttamente alla stampante termica di cucina via Wi-Fi/Ethernet"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Stampa LAN (ESC/POS)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              title="Stampa con driver browser, AirPrint o stampante USB collegata"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa Subito</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
