"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Printer,
  Wifi,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  HelpCircle,
  Settings,
  Bell,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  PrinterConfig,
  DEFAULT_PRINTER_CONFIG,
} from "@/lib/escpos";
import {
  getPrinterConfigAction,
  savePrinterConfigAction,
  testPrintEscPosAction,
} from "@/app/actions";

export default function ThermalPrinterSettingsCard() {
  const [isPending, startTransition] = useTransition();
  const [isTesting, setIsTesting] = useState(false);
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_PRINTER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPrinterConfigAction();
        setConfig(data);
      } catch (e) {
        console.error("Errore caricamento config stampante:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await savePrinterConfigAction(config);
      if (res.success) {
        setFeedback({ type: "success", text: "Configurazione stampante termica salvata con successo!" });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", text: res.error || "Errore durante il salvataggio" });
      }
    });
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setFeedback(null);
    try {
      const res = await testPrintEscPosAction(config);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Stampa di prova inviata con successo! Controlla la stampante.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Errore di connessione alla stampante termica.",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Errore imprevisto invio stampa" });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 animate-pulse bg-white rounded-3xl border border-slate-200">
        Caricamento impostazioni stampante termica...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Stampante Termica Comande Cucina (ESC/POS)
            </h3>
            <p className="text-xs text-slate-500">
              Supporto per qualsiasi stampante termica Wi-Fi o Ethernet (porta standard 9100)
            </p>
          </div>
        </div>

        {/* Switch Abilita */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-700">
            {config.enabled ? "Stampa Attiva" : "Disattivata"}
          </span>
          <div className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </div>
        </label>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Info Box Funzionamento */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-emerald-600" />
          Come funziona la stampa termica con Tavoly
        </div>
        <p className="text-[11.5px] leading-relaxed">
          Tavoly comunica direttamente con la stampante termica presente nella tua cucina o pizzeria tramite la rete locale Wi-Fi o cavo Ethernet (protocollo ESC/POS su porta 9100). Non richiede driver complessi né PC intermedi: basta inserire l&apos;indirizzo IP assegnato dal router alla stampante.
        </p>
      </div>

      {/* Parametri di Rete */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Indirizzo IP Stampante Cucina / Pizzeria *
          </label>
          <div className="relative">
            <Wifi className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={config.ip}
              onChange={(e) => setConfig((prev) => ({ ...prev, ip: e.target.value.trim() }))}
              placeholder="es. 192.168.1.200"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            L&apos;indirizzo IP statico o DHCP della stampante (lo trovi stampato tenendo premuto il tasto FEED all&apos;accensione).
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Porta TCP (Standard 9100)
          </label>
          <input
            type="number"
            value={config.port}
            onChange={(e) => setConfig((prev) => ({ ...prev, port: parseInt(e.target.value, 10) || 9100 }))}
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold bg-white"
          />
        </div>
      </div>

      {/* Formato Carta & Suono */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Formato Carta Termica
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, paperWidth: "80mm" }))}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                config.paperWidth === "80mm"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              80 mm (Standard Cucina)
            </button>
            <button
              type="button"
              onClick={() => setConfig((prev) => ({ ...prev, paperWidth: "58mm" }))}
              className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                config.paperWidth === "58mm"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              58 mm (Compatta)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Segnale Acustico (Cicalino / Buzzer)
          </label>
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer select-none mt-1">
            <input
              type="checkbox"
              checked={config.buzzer}
              onChange={(e) => setConfig((prev) => ({ ...prev, buzzer: e.target.checked }))}
              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                Emetti segnale acustico alla stampa
              </span>
              <p className="text-[10px] text-slate-400">
                La stampante suona all&apos;arrivo della comanda per avvisare la brigata in cucina
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Regole di Stampa Automatica */}
      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-3">
        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]">
          Automazioni di Stampa Comande
        </div>

        <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.autoPrintTable}
            onChange={(e) => setConfig((prev) => ({ ...prev, autoPrintTable: e.target.checked }))}
            className="w-4 h-4 mt-0.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
          />
          <div>
            <span className="font-bold text-slate-900">Stampa automatica su nuova comanda tavolo</span>
            <p className="text-[11px] text-slate-500">
              Quando un cameriere invia la comanda da palmare o cassa, viene stampata immediatamente in cucina
            </p>
          </div>
        </label>

        <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.autoPrintTakeaway}
            onChange={(e) => setConfig((prev) => ({ ...prev, autoPrintTakeaway: e.target.checked }))}
            className="w-4 h-4 mt-0.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
          />
          <div>
            <span className="font-bold text-slate-900">Stampa automatica su nuovo ordine asporto / takeaway</span>
            <p className="text-[11px] text-slate-500">
              Quando un cliente ordina dall&apos;asporto online, la comanda viene stampata automaticamente
            </p>
          </div>
        </label>
      </div>

      {/* Azioni: Salva e Invia Prova */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleTestPrint}
          disabled={isTesting || !config.ip}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer disabled:opacity-40"
        >
          {isTesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Printer className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{isTesting ? "Invio Stampa in Corso..." : "Invia Stampa di Prova (Test Hardware)"}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Salvataggio...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Salva Configurazione Stampante</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
