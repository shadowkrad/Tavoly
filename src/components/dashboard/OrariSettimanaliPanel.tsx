"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Info,
  CalendarDays,
  Sun,
  Moon,
  ChevronDown,
} from "lucide-react";
import {
  OrariSettimanaliConfig,
  OrarioGiornoConfig,
  GiornoSettimanaId,
  GIORNI_SETTIMANA_DEFAULT,
  formatOrariSummary,
} from "@/lib/orari-settimanali";

interface EccezioneData {
  id: string;
  data: string;
  titolo: string;
  tipo: string;
  isAperto: boolean;
  orarioApertura?: string | null;
  orarioChiusura?: string | null;
  note?: string | null;
}

interface OrariSettimanaliPanelProps {
  initialConfig?: OrariSettimanaliConfig;
  onChange: (newConfig: OrariSettimanaliConfig) => void;
}

const GIORNI_KEYS: GiornoSettimanaId[] = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

export default function OrariSettimanaliPanel({
  initialConfig,
  onChange,
}: OrariSettimanaliPanelProps) {
  const [config, setConfig] = useState<OrariSettimanaliConfig>(
    initialConfig || {
      giorni: GIORNI_SETTIMANA_DEFAULT,
      rispettaFestivitaNazionali: false,
      noteOrari: "Lunedì chiuso",
    }
  );

  const [eccezioni, setEccezioni] = useState<EccezioneData[]>([]);
  const [loadingEccezioni, setLoadingEccezioni] = useState(true);

  // Form nuova eccezione
  const [nuovaData, setNuovaData] = useState("");
  const [nuovoTitolo, setNuovoTitolo] = useState("");
  const [nuovoTipo, setNuovoTipo] = useState<"CHIUSURA" | "APERTURA_STRAORDINARIA">("CHIUSURA");
  const [nuovoInizio, setNuovoInizio] = useState("12:00");
  const [nuovaFine, setNuovaFine] = useState("23:30");
  const [addingEcc, setAddingEcc] = useState(false);
  const [eccFeedback, setEccFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const loadEccezioni = async () => {
    try {
      const res = await fetch("/api/calendario/eccezioni");
      if (res.ok) {
        const data = await res.json();
        setEccezioni(data.eccezioni || []);
      }
    } catch (e) {
      console.error("Errore caricamento eccezioni:", e);
    } finally {
      setLoadingEccezioni(false);
    }
  };

  useEffect(() => {
    loadEccezioni();
  }, []);

  const updateGiorno = (dayId: GiornoSettimanaId, partial: Partial<OrarioGiornoConfig>) => {
    const updated: OrariSettimanaliConfig = {
      ...config,
      giorni: {
        ...config.giorni,
        [dayId]: {
          ...config.giorni[dayId],
          ...partial,
        },
      },
    };
    setConfig(updated);
    onChange(updated);
  };

  const copyToAllWeekdays = (sourceDayId: GiornoSettimanaId) => {
    const src = config.giorni[sourceDayId];
    const weekdays: GiornoSettimanaId[] = ["mar", "mer", "gio", "ven"];
    const updatedGiorni = { ...config.giorni };

    for (const d of weekdays) {
      updatedGiorni[d] = {
        ...updatedGiorni[d],
        aperto: src.aperto,
        modalita: src.modalita,
        oraInizio1: src.oraInizio1,
        oraFine1: src.oraFine1,
        oraInizio2: src.oraInizio2,
        oraFine2: src.oraFine2,
      };
    }

    const updated: OrariSettimanaliConfig = {
      ...config,
      giorni: updatedGiorni,
    };
    setConfig(updated);
    onChange(updated);
  };

  const handleToggleFestivita = (checked: boolean) => {
    const updated = { ...config, rispettaFestivitaNazionali: checked };
    setConfig(updated);
    onChange(updated);
  };

  const handleNoteChange = (text: string) => {
    const updated = { ...config, noteOrari: text };
    setConfig(updated);
    onChange(updated);
  };

  const handleAddEccezione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovaData || !nuovoTitolo.trim()) return;

    setAddingEcc(true);
    setEccFeedback(null);
    try {
      const isAperto = nuovoTipo === "APERTURA_STRAORDINARIA";
      const res = await fetch("/api/calendario/eccezioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: nuovaData,
          titolo: nuovoTitolo.trim(),
          tipo: nuovoTipo,
          isAperto,
          orarioApertura: isAperto ? nuovoInizio : null,
          orarioChiusura: isAperto ? nuovaFine : null,
        }),
      });

      if (res.ok) {
        setNuovaData("");
        setNuovoTitolo("");
        setEccFeedback("Data speciale aggiunta con successo!");
        await loadEccezioni();
        setTimeout(() => setEccFeedback(null), 3000);
      }
    } catch {
      setEccFeedback("Errore durante il salvataggio.");
    } finally {
      setAddingEcc(false);
    }
  };

  const handleDeleteEccezione = async (id: string) => {
    try {
      const res = await fetch(`/api/calendario/eccezioni?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEccezioni((prev) => prev.filter((ecc) => ecc.id !== id));
      }
    } catch (e) {
      console.error("Errore cancellazione eccezione:", e);
    }
  };

  const summary = formatOrariSummary(config);

  return (
    <div className="space-y-6">
      {/* Box Riepilogo Automatico Vetrina */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Riepilogo Ufficiale Sincronizzato con Vetrina &amp; Prenotazioni
            </h4>
            <p className="text-xs text-emerald-800 mt-0.5">
              Ogni modifica a giorni e fasce orarie aggiorna all&apos;istante la card orari della vetrina, il badge in tempo reale e il motore di prenotazione.
            </p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-semibold text-emerald-900 bg-white/70 p-2.5 rounded-xl border border-emerald-200/60">
              <div>
                <span className="text-emerald-600 block text-[10px] uppercase font-bold">Feriali:</span>
                <span className="truncate block">{summary.hoursWeekday}</span>
              </div>
              <div>
                <span className="text-emerald-600 block text-[10px] uppercase font-bold">Weekend:</span>
                <span className="truncate block">{summary.hoursWeekend}</span>
              </div>
              <div>
                <span className="text-emerald-600 block text-[10px] uppercase font-bold">Note / Riposo:</span>
                <span className="truncate block">{summary.hoursNote || "Nessuna chiusura fissa"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE 1: TABELLA ORARI GIORNO PER GIORNO */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Orario Settimanale di Apertura</span>
            </h3>
            <p className="text-xs text-slate-500">
              Imposta per ciascun giorno se il ristorante è aperto, la modalità (continuato o spezzato con pausa) e le fasce orarie.
            </p>
          </div>

          <button
            type="button"
            onClick={() => copyToAllWeekdays("mar")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer self-start sm:self-auto"
            title="Copia l'orario del Martedì su Mercoledì, Giovedì e Venerdì"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Applica Mar a Mar-Ven</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {GIORNI_KEYS.map((dayId) => {
            const g = config.giorni[dayId];
            if (!g) return null;

            return (
              <div
                key={dayId}
                className={`p-3.5 rounded-2xl border transition-all ${
                  g.aperto
                    ? "bg-white border-slate-200 shadow-xs"
                    : "bg-slate-50 border-slate-200/80 opacity-75"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Nome Giorno & Toggle Aperto */}
                  <div className="flex items-center gap-3 min-w-[150px]">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={g.aperto}
                        onChange={(e) => updateGiorno(dayId, { aperto: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                    </label>

                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{g.label}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          g.aperto ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {g.aperto ? "Aperto" : "Chiuso (Riposo)"}
                      </span>
                    </div>
                  </div>

                  {/* Se aperto, mostra selettore modalità e orari */}
                  {g.aperto ? (
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Modalità: Continuato vs Spezzato */}
                      <div className="inline-flex rounded-xl bg-slate-100 p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateGiorno(dayId, { modalita: "SPEZZATO" })}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                            g.modalita === "SPEZZATO"
                              ? "bg-white text-emerald-700 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Pranzo &amp; Cena
                        </button>
                        <button
                          type="button"
                          onClick={() => updateGiorno(dayId, { modalita: "CONTINUATO" })}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                            g.modalita === "CONTINUATO"
                              ? "bg-white text-emerald-700 shadow-xs"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          Continuato
                        </button>
                      </div>

                      {/* Fasce Orarie */}
                      {g.modalita === "SPEZZATO" ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {/* Turno 1 (Pranzo) */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                            <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Pranzo:</span>
                            <input
                              type="time"
                              value={g.oraInizio1 || "11:00"}
                              onChange={(e) => updateGiorno(dayId, { oraInizio1: e.target.value })}
                              className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="time"
                              value={g.oraFine1 || "15:00"}
                              onChange={(e) => updateGiorno(dayId, { oraFine1: e.target.value })}
                              className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                            />
                          </div>

                          {/* Turno 2 (Cena) */}
                          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
                            <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Cena:</span>
                            <input
                              type="time"
                              value={g.oraInizio2 || "17:00"}
                              onChange={(e) => updateGiorno(dayId, { oraInizio2: e.target.value })}
                              className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                            />
                            <span className="text-slate-400 font-bold">-</span>
                            <input
                              type="time"
                              value={g.oraFine2 || "23:00"}
                              onChange={(e) => updateGiorno(dayId, { oraFine2: e.target.value })}
                              className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                          <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Fascia Unica:</span>
                          <input
                            type="time"
                            value={g.oraInizio1 || "16:00"}
                            onChange={(e) => updateGiorno(dayId, { oraInizio1: e.target.value })}
                            className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                          />
                          <span className="text-slate-400 font-bold">-</span>
                          <input
                            type="time"
                            value={g.oraFine1 || "23:30"}
                            onChange={(e) => updateGiorno(dayId, { oraFine1: e.target.value })}
                            className="bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 font-medium italic">
                      Locale chiuso per l&apos;intera giornata. Nessun tavolo prenotabile.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEZIONE 2: NOTE ORARI E CUCINA */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Note Orari Ufficiali &amp; Servizio Cucina
        </label>
        <input
          type="text"
          value={config.noteOrari || ""}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="es. Cucina aperta per pranzo (12:30-14:30) e cena (19:30-22:30) • Lunedì chiuso"
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
        />
        <p className="text-[11px] text-slate-400">
          Questa nota comparirà nella card informativa in Vetrina e sotto i contatti della sede.
        </p>
      </div>

      {/* SEZIONE 3: GESTIONE FESTIVITÀ NAZIONALI ITALIANE */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Chiusura Automatica nei Giorni Festivi Italiani</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Capodanno, Epifania, Pasqua, Pasquetta, 25 Aprile, 1 Maggio, 2 Giugno, Ferragosto, 1 Novembre, 8 Dicembre, Natale e Santo Stefano.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={config.rispettaFestivitaNazionali}
              onChange={(e) => handleToggleFestivita(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
          config.rispettaFestivitaNazionali
            ? "bg-amber-50 border border-amber-200 text-amber-800"
            : "bg-emerald-50 border border-emerald-200 text-emerald-800"
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {config.rispettaFestivitaNazionali
              ? "ATTIVO: Il ristorante risulterà chiuso nelle festività di calendario e non accetterà prenotazioni in quelle date (tranne in caso di eccezione esplicita)."
              : "DISATTIVATO (Consigliato per Ristoranti): Il ristorante rimane aperto e accetta prenotazioni anche nei giorni festivi, seguendo il normale orario del giorno."}
          </span>
        </div>
      </div>

      {/* SEZIONE 4: CALENDARIO ECCEZIONI (FERIE & APERTURE STRAORDINARIE) */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>Aperture Straordinarie &amp; Chiusure per Ferie</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pianifica periodi di ferie, chiusure eccezionali o aperture speciali (es. apertura eccezionale di un lunedì festivo).
          </p>
        </div>

        {/* Form Aggiunta Eccezione */}
        <form onSubmit={handleAddEccezione} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
            Aggiungi Data Speciale
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Data</label>
              <input
                type="date"
                required
                value={nuovaData}
                onChange={(e) => setNuovaData(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo</label>
              <select
                value={nuovoTipo}
                onChange={(e) => setNuovoTipo(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
              >
                <option value="CHIUSURA">Chiusura / Ferie</option>
                <option value="APERTURA_STRAORDINARIA">Apertura Straordinaria</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Motivo / Titolo</label>
              <input
                type="text"
                required
                value={nuovoTitolo}
                onChange={(e) => setNuovoTitolo(e.target.value)}
                placeholder="es. Ferie Estive, Cena di Capodanno..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium bg-white"
              />
            </div>
          </div>

          {nuovoTipo === "APERTURA_STRAORDINARIA" && (
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-[11px] font-bold text-slate-600">Orario Straordinario:</span>
              <input
                type="time"
                value={nuovoInizio}
                onChange={(e) => setNuovoInizio(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="time"
                value={nuovaFine}
                onChange={(e) => setNuovaFine(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {eccFeedback ? (
              <span className="text-xs text-emerald-600 font-bold">{eccFeedback}</span>
            ) : <span />}

            <button
              type="submit"
              disabled={addingEcc}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addingEcc ? "Salvataggio..." : "Salva Eccezione"}</span>
            </button>
          </div>
        </form>

        {/* Lista Eccezioni Esistenti */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
            Date Speciali Programmate ({eccezioni.length})
          </span>

          {loadingEccezioni ? (
            <p className="text-xs text-slate-400">Caricamento calendario...</p>
          ) : eccezioni.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nessuna eccezione programmata al momento.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {eccezioni.map((ecc) => (
                <div
                  key={ecc.id}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-slate-900">{ecc.data}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                          ecc.isAperto
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ecc.isAperto ? "Apertura Spec." : "Chiusura"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">{ecc.titolo}</p>
                    {ecc.isAperto && ecc.orarioApertura && (
                      <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                        Ore {ecc.orarioApertura} - {ecc.orarioChiusura}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEccezione(ecc.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Elimina eccezione"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
