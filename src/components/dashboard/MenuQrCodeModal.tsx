"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  QrCode,
  Printer,
  Download,
  X,
  Sparkles,
  Layers,
  UtensilsCrossed,
  ExternalLink,
} from "lucide-react";
import QRCode from "qrcode";

interface TableOption {
  id: string;
  number: string;
  areaName?: string;
}

interface MenuQrCodeModalProps {
  restaurantName: string;
  tagline?: string;
  logoUrl?: string;
  tables: TableOption[];
  isOpen: boolean;
  onClose: () => void;
}

export function MenuQrCodeModal({
  restaurantName,
  tagline = "Cucina & Tradizione",
  logoUrl,
  tables,
  isOpen,
  onClose,
}: MenuQrCodeModalProps) {
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>("ALL");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Calcola l'URL assoluto del menù
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://taaaac.eu";

    let url = `${origin}/menu`;
    if (selectedTableNumber !== "ALL") {
      url += `?tavolo=${encodeURIComponent(selectedTableNumber)}`;
    }
    setTargetUrl(url);

    // Genera QR Code ad alta risoluzione con livello di correzione High
    QRCode.toDataURL(url, {
      width: 480,
      margin: 1.5,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
      })
      .catch((err) => {
        console.error("Errore generazione QR Code:", err);
      });
  }, [isOpen, selectedTableNumber]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const filename =
      selectedTableNumber === "ALL"
        ? `menu-qrcode-${restaurantName.toLowerCase().replace(/\s+/g, "-")}.png`
        : `menu-qrcode-tavolo-${selectedTableNumber}.png`;
    a.download = filename;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-8 print:shadow-none print:border-none print:p-0 print:my-0">
        {/* Header Modale (Nascosto in Stampa) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Generatore QR Code Menù
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Stampa ed esponi i segnatavoli per i tuoi clienti
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selettore Tavolo (Nascosto in Stampa) */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 print:hidden space-y-2">
          <label className="text-xs font-bold text-slate-800 block">
            Destinazione del QR Code:
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedTableNumber}
              onChange={(e) => setSelectedTableNumber(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800 flex-1 cursor-pointer"
            >
              <option value="ALL">🍽️ Menù Generale Ristorante (Valido per tutta la sala)</option>
              {tables.map((t) => (
                <option key={t.id} value={t.number}>
                  🏷️ Segnatavolo: Tavolo {t.number} {t.areaName ? `(${t.areaName})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">URL generato: <strong className="text-slate-700">{targetUrl}</strong></span>
          </div>
        </div>

        {/* SCHEDA SEGNATAVOLO STAMPABILE */}
        <div
          ref={printRef}
          className="mt-5 p-6 bg-white border-2 border-slate-900 rounded-3xl text-center space-y-4 shadow-sm print:m-0 print:border-2 print:border-black print:rounded-2xl print:w-[350px] print:mx-auto"
        >
          {/* Logo / Emblema */}
          <div className="flex flex-col items-center justify-center">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={restaurantName}
                className="w-14 h-14 object-contain rounded-xl mb-2"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center mb-2 shadow-xs">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
            )}
            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">
              {restaurantName}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {tagline}
            </p>
          </div>

          {/* Indicazione Tavolo */}
          <div className="py-1 px-4 bg-slate-900 text-white rounded-full inline-block text-xs font-black uppercase tracking-wider">
            {selectedTableNumber === "ALL" ? "Menù Digitale" : `Tavolo ${selectedTableNumber}`}
          </div>

          {/* Immagine QR Code */}
          <div className="flex justify-center p-2 bg-white rounded-2xl">
            {qrDataUrl ? (
              <div className="relative inline-block p-2 bg-white border border-slate-200 rounded-2xl shadow-xs">
                <img
                  src={qrDataUrl}
                  alt={`QR Code ${restaurantName}`}
                  className="w-56 h-56 object-contain rounded-lg"
                />
                {/* Logo o Icona Sovrapposta al Centro del QR Code */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-11 h-11 bg-white rounded-full p-1 shadow-md border border-slate-200 flex items-center justify-center">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-8 h-8 object-contain rounded-full"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-xs text-slate-400">
                Generazione QR...
              </div>
            )}
          </div>

          {/* Istruzioni Cliente */}
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">
              Inquadra con la fotocamera dello smartphone
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              Consulta le portate del giorno, i prezzi e gli allergeni aggiornati in tempo reale
            </p>
          </div>

          {/* Footer Segnatavolo */}
          <div className="pt-2 border-t border-slate-200/80 text-[9px] font-semibold text-slate-400 flex items-center justify-center gap-1">
            <span>Powered by</span>
            <span className="font-black text-slate-600">Taaaac Suite • Tavoly</span>
          </div>
        </div>

        {/* Pulsanti Azioni (Nascosti in Stampa) */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-slate-100 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto taaaac-btn-secondary text-xs px-4 py-2.5 order-2 sm:order-1"
          >
            Chiudi
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer order-3 sm:order-2"
          >
            <Download className="w-4 h-4" />
            <span>Scarica PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto taaaac-btn-primary text-xs px-5 py-2.5 flex items-center justify-center gap-2 shadow-xs cursor-pointer order-1 sm:order-3"
          >
            <Printer className="w-4 h-4" />
            <span>Stampa Segnatavolo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
