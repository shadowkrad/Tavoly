"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Save,
  Check,
  AlertCircle,
  Calendar,
  Plus,
  X,
  Trash2,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";

interface EccezioneCalendario {
  id: string;
  data: string;
  tipo: "CHIUSURA" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE";
  titolo: string;
  orarioApertura?: string | null;
  orarioChiusura?: string | null;
  pausaInizio?: string | null;
  pausaFine?: string | null;
  note?: string | null;
}

interface FestivitaNazionale {
  data: string;
  nome: string;
}

export default function TavolyOrariPage() {
  const [activeTab, setActiveTab] = useState<"settimanali" | "festivita">("settimanali");

  // Orari Ristorante Standard (Pranzo & Cena)
  const [lunchOpen, setLunchOpen] = useState("12:00");
  const [lunchClose, setLunchClose] = useState("15:00");
  const [dinnerOpen, setDinnerOpen] = useState("19:00");
  const [dinnerClose, setDinnerClose] = useState("23:30");
  const [savingStandard, setSavingStandard] = useState(false);
  const [standardFeedback, setStandardFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Festività & Eccezioni
  const [eccezioni, setEccezioni] = useState<EccezioneCalendario[]>([]);
  const [festivitaNazionali, setFestivitaNazionali] = useState<FestivitaNazionale[]>([]);
  const [rispettaFestivita, setRispettaFestivita] = useState(true);
  const [savingFestivita, setSavingFestivita] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal Nuova Data Speciale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTipo, setNewTipo] = useState<"CHIUSURA" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE">("APERTURA_STRAORDINARIA");
  const [newTitolo, setNewTitolo] = useState("");
  const [newOraInizio, setNewOraInizio] = useState("12:00");
  const [newOraFine, setNewOraFine] = useState("23:30");
  const [newPausaInizio, setNewPausaInizio] = useState("15:30");
  const [newPausaFine, setNewPausaFine] = useState("19:00");
  const [newNote, setNewNote] = useState("");
  const [submittingEcc, setSubmittingEcc] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "festivita") {
        setActiveTab("festivita");
      }
    }

    fetch("/api/calendario-eccezioni")
      .then((r) => r.json())
      .then((calData) => {
        if (calData && !calData.error) {
          setEccezioni(calData.eccezioni || []);
          setFestivitaNazionali(calData.festivitaNazionali || []);
          setRispettaFestivita(calData.rispettaFestivitaNazionali ?? true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Errore fetch calendario eccezioni:", err);
        setLoading(false);
      });
  }, []);

  const handleToggleFestivita = async (val: boolean) => {
    setSavingFestivita(true);
    try {
      const res = await fetch("/api/calendario-eccezioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rispettaFestivitaNazionali: val }),
      });
      if (res.ok) {
        setRispettaFestivita(val);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingFestivita(false);
    }
  };

  const handleCreateEccezione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTitolo) return;
    setSubmittingEcc(true);

    try {
      const payload: any = {
        data: newDate,
        tipo: newTipo,
        titolo: newTitolo,
        isAperto: newTipo !== "CHIUSURA",
        note: newNote || null,
      };

      if (newTipo !== "CHIUSURA") {
        payload.orarioApertura = newOraInizio;
        payload.orarioChiusura = newOraFine;
        payload.pausaInizio = newPausaInizio || null;
        payload.pausaFine = newPausaFine || null;
      }

      const res = await fetch("/api/calendario-eccezioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setEccezioni((prev) => {
          const filtered = prev.filter((x) => x.data !== created.data);
          return [...filtered, created].sort((a, b) => a.data.localeCompare(b.data));
        });
        setIsModalOpen(false);
        setNewDate("");
        setNewTitolo("");
        setNewNote("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingEcc(false);
    }
  };

  const handleDeleteEccezione = async (dataStr: string) => {
    if (!confirm("Sei sicuro di voler rimuovere questa data speciale?")) return;
    try {
      const res = await fetch(`/api/calendario-eccezioni?data=${dataStr}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEccezioni((prev) => prev.filter((x) => x.data !== dataStr));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Pagina */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            Orari, Turni & Calendario Festività
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configura gli orari dei servizi, le festività italiane, le ferie e le aperture speciali (Pranzo di Natale, Cenone di Capodanno, Pasqua).
          </p>
        </div>

        {activeTab === "festivita" && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Data Speciale</span>
          </button>
        )}
      </div>

      {/* Tabs di navigazione */}
      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200/90 rounded-2xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("settimanali")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "settimanali"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
          <span>Orari & Turni Standard</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("festivita")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === "festivita"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🎄</span>
          <span>Festività & Date Speciali</span>
          {eccezioni.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
              {eccezioni.length}
            </span>
          )}
        </button>
      </div>

      {/* CONTENUTO TAB 1: ORARI STANDARD RISTORANTE */}
      {activeTab === "settimanali" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Fasce Orarie Servizi Tavolo (Pranzo e Cena)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gli orari in cui i clienti possono prenotare un tavolo online o accomodarsi in sala.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Servizio Pranzo */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-800">Servizio Pranzo</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Attivo</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Apertura</label>
                    <input
                      type="time"
                      value={lunchOpen}
                      onChange={(e) => setLunchOpen(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Chiusura</label>
                    <input
                      type="time"
                      value={lunchClose}
                      onChange={(e) => setLunchClose(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Servizio Cena */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wide text-slate-800">Servizio Cena</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Attivo</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Apertura</label>
                    <input
                      type="time"
                      value={dinnerOpen}
                      onChange={(e) => setDinnerOpen(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Chiusura</label>
                    <input
                      type="time"
                      value={dinnerClose}
                      onChange={(e) => setDinnerClose(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSavingStandard(true);
                  setTimeout(() => {
                    setSavingStandard(false);
                    setStandardFeedback({ type: "success", text: "Orari standard aggiornati con successo!" });
                  }, 400);
                }}
                disabled={savingStandard}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingStandard ? "Salvataggio..." : "Salva Orari Standard"}</span>
              </button>
            </div>

            {standardFeedback && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{standardFeedback.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENUTO TAB 2: FESTIVITÀ & DATE SPECIALI */}
      {activeTab === "festivita" && (
        <div className="space-y-6">
          {/* Card Toggle Festività Nazionali Automatiche */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🇮🇹</span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Festività Nazionali Italiane Automatiche
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Considera automaticamente chiusi i turni nei giorni festivi del calendario italiano (Natale, Santo Stefano, Capodanno, Epifania, Pasqua, Pasquetta, 25 Aprile, 1 Maggio, 2 Giugno, Ferragosto, 8 Dicembre, ecc.).
                  Le prenotazioni tavoli online vengono bloccate e l&apos;agenda viene protetta automaticamente se non imposti un&apos;apertura straordinaria.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={rispettaFestivita}
                  disabled={savingFestivita}
                  onChange={(e) => handleToggleFestivita(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-800">
                  {rispettaFestivita ? "Abilitate" : "Disabilitate"}
                </span>
              </label>
            </div>

            {/* Chip Festività Previste per l'anno in corso */}
            {rispettaFestivita && festivitaNazionali.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Festività Riconosciute ({festivitaNazionali.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {festivitaNazionali.map((fest) => (
                    <span
                      key={fest.data}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
                    >
                      <span className="font-mono text-emerald-700 font-bold">{fest.data.slice(5)}</span>
                      <span>{fest.nome}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Elenco Eccezioni e Date Speciali Configurate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Date Speciali & Aperture Straordinarie Personalizzate
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {eccezioni.length} {eccezioni.length === 1 ? "data speciale configurata" : "date speciali configurate"}
              </span>
            </div>

            {eccezioni.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                  🍽️
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">Nessuna data speciale programmata</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Aggiungi aperture straordinarie per le feste (es. Pranzo di Natale, Cenone di Capodanno, Pasqua e Pasquetta), oppure chiusure straordinarie per ferie del personale.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Programma Nuova Data</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eccezioni.map((ecc) => {
                  const dateObj = new Date(ecc.data + "T00:00:00");
                  const dateFormatted = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                    : ecc.data;

                  const isChiusura = ecc.tipo === "CHIUSURA";
                  const isStraordinaria = ecc.tipo === "APERTURA_STRAORDINARIA";

                  return (
                    <div
                      key={ecc.id || ecc.data}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isChiusura
                          ? "bg-rose-50/40 border-rose-200"
                          : isStraordinaria
                          ? "bg-emerald-50/40 border-emerald-200"
                          : "bg-amber-50/40 border-amber-200"
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isChiusura
                                ? "bg-rose-100 text-rose-800 border border-rose-200"
                                : isStraordinaria
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {isChiusura
                              ? "Chiusura"
                              : isStraordinaria
                              ? "Apertura Straordinaria"
                              : "Orario Speciale"}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-800 capitalize">
                            {dateFormatted}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 truncate">{ecc.titolo}</h4>

                        {!isChiusura && ecc.orarioApertura && ecc.orarioChiusura && (
                          <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {ecc.orarioApertura} – {ecc.orarioChiusura}
                            </span>
                            {ecc.pausaInizio && ecc.pausaFine && (
                              <span className="text-[11px] text-slate-500">
                                (Pausa: {ecc.pausaInizio}–{ecc.pausaFine})
                              </span>
                            )}
                          </div>
                        )}

                        {ecc.note && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2">
                            &quot;{ecc.note}&quot;
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteEccezione(ecc.data)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Elimina data speciale"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL NUOVA DATA SPECIALE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  📅
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Aggiungi Data Speciale Ristorante</h3>
                  <p className="text-xs text-slate-500">
                    Configura aperture per le feste o ferie del locale
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEccezione} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 block mb-1">
                    Data (AAAA-MM-GG)
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase font-bold text-slate-600 block mb-1">
                    Tipo Evento
                  </label>
                  <select
                    value={newTipo}
                    onChange={(e: any) => setNewTipo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="APERTURA_STRAORDINARIA">Apertura Straordinaria (es. Pranzo Natale / Pasqua)</option>
                    <option value="ORARIO_SPECIALE">Orario Speciale (es. Cenone Capodanno)</option>
                    <option value="CHIUSURA">Chiusura per Ferie / Straordinaria</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-600 block mb-1">
                  Titolo o Nome Festività
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Pranzo di Natale con Menù Dedicato"
                  value={newTitolo}
                  onChange={(e) => setNewTitolo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {newTipo !== "CHIUSURA" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Apertura
                    </label>
                    <input
                      type="time"
                      required
                      value={newOraInizio}
                      onChange={(e) => setNewOraInizio(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Chiusura
                    </label>
                    <input
                      type="time"
                      required
                      value={newOraFine}
                      onChange={(e) => setNewOraFine(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Pausa Inizio
                    </label>
                    <input
                      type="time"
                      value={newPausaInizio}
                      onChange={(e) => setNewPausaInizio(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Pausa Fine
                    </label>
                    <input
                      type="time"
                      value={newPausaFine}
                      onChange={(e) => setNewPausaFine(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] uppercase font-bold text-slate-600 block mb-1">
                  Note di Sala / Menù Speciale (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es. Menù fisso degustazione, gradita la puntualità"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submittingEcc}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingEcc ? "Salvataggio..." : "Salva Data Speciale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
