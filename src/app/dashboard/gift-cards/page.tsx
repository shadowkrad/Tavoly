"use client";

import React, { useState } from "react";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import {
  Gift,
  Search,
  Plus,
  CreditCard,
  Sparkles,
  CheckCircle2,
  Calendar,
  X,
  Share2,
  Check,
  QrCode,
  Tag,
} from "lucide-react";

interface VoucherFood {
  id: string;
  codice: string;
  titolo: string;
  acquirente: string;
  beneficiario: string;
  dedica?: string;
  valore: number;
  saldoResiduo: number;
  dataEmissione: string;
  scadenza: string;
  stato: "ATTIVO" | "RISCATTATO" | "SCADUTO";
}

const MOCK_VOUCHERS: VoucherFood[] = [
  {
    id: "v1",
    codice: "CENA-ROMANTICA-120",
    titolo: "Cena a Lume di Candela per 2 Persone",
    acquirente: "Andrea Moretti",
    beneficiario: "Chiara & Luca",
    dedica: "Buon Anniversario di nozze!",
    valore: 120,
    saldoResiduo: 120,
    dataEmissione: "28 Ottobre 2026",
    scadenza: "28 Ottobre 2027",
    stato: "ATTIVO",
  },
  {
    id: "v2",
    codice: "GOURMET-CHEF-180",
    titolo: "Percorso Degustazione Chef con Vini",
    acquirente: "Studio Legale Rinaldi",
    beneficiario: "Dott. Vittorio Manzi",
    dedica: "Con stima e riconoscenza per la collaborazione.",
    valore: 180,
    saldoResiduo: 180,
    dataEmissione: "25 Ottobre 2026",
    scadenza: "25 Ottobre 2027",
    stato: "ATTIVO",
  },
  {
    id: "v3",
    codice: "BUONO-TAVOLO-50",
    titolo: "Buono Credito Ristorante 50€",
    acquirente: "Simona Ferri",
    beneficiario: "Marco Galli",
    dedica: "Tanti auguri di Buon Compleanno!",
    valore: 50,
    saldoResiduo: 0,
    dataEmissione: "12 Ottobre 2026",
    scadenza: "12 Ottobre 2027",
    stato: "RISCATTATO",
  },
  {
    id: "v4",
    codice: "PIZZA-FRIENDS-75",
    titolo: "Serata Pizza Gourmet & Birre Artigianali (x3)",
    acquirente: "Lorenzo Neri",
    beneficiario: "Gruppo Amici del Giovedì",
    dedica: "Una serata offerta da me!",
    valore: 75,
    saldoResiduo: 75,
    dataEmissione: "29 Ottobre 2026",
    scadenza: "29 Aprile 2027",
    stato: "ATTIVO",
  },
];

export default function TavolyGiftCardsPage() {
  const [vouchers, setVouchers] = useState<VoucherFood[]>(MOCK_VOUCHERS);
  const [search, setSearch] = useState("");
  const [filtroStato, setFiltroStato] = useState<string>("TUTTI");

  // Modali
  const [isNuovoOpen, setIsNuovoOpen] = useState(false);
  const [isRiscattaOpen, setIsRiscattaOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherFood | null>(null);
  const [codiceDaRiscattare, setCodiceDaRiscattare] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form Nuovo Voucher
  const [nuovoTitolo, setNuovoTitolo] = useState("Cena Degustazione Gourmet");
  const [nuovoValore, setNuovoValore] = useState(100);
  const [nuovoAcquirente, setNuovoAcquirente] = useState("");
  const [nuovoBeneficiario, setNuovoBeneficiario] = useState("");
  const [nuovaDedica, setNuovaDedica] = useState("");

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchSearch =
      v.codice.toLowerCase().includes(search.toLowerCase()) ||
      v.acquirente.toLowerCase().includes(search.toLowerCase()) ||
      v.beneficiario.toLowerCase().includes(search.toLowerCase()) ||
      v.titolo.toLowerCase().includes(search.toLowerCase());

    if (filtroStato === "ATTIVO") return matchSearch && v.stato === "ATTIVO";
    if (filtroStato === "RISCATTATO") return matchSearch && v.stato === "RISCATTATO";
    return matchSearch;
  });

  const incassoTotale = vouchers.reduce((acc, v) => acc + v.valore, 0);
  const attiviCount = vouchers.filter((v) => v.stato === "ATTIVO").length;
  const valoreInCircolazione = vouchers
    .filter((v) => v.stato === "ATTIVO")
    .reduce((acc, v) => acc + v.saldoResiduo, 0);

  // Emetti nuovo buono
  const handleCreaVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoBeneficiario || nuovoValore <= 0) return;

    const randomCode = `VOUCHER-${Math.floor(1000 + Math.random() * 9000)}`;
    const newV: VoucherFood = {
      id: `v_${Date.now()}`,
      codice: randomCode,
      titolo: nuovoTitolo,
      acquirente: nuovoAcquirente || "Cliente Banco",
      beneficiario: nuovoBeneficiario,
      dedica: nuovaDedica,
      valore: nuovoValore,
      saldoResiduo: nuovoValore,
      dataEmissione: "Oggi",
      scadenza: "Tra 12 mesi",
      stato: "ATTIVO",
    };

    setVouchers([newV, ...vouchers]);
    setIsNuovoOpen(false);
    showNotification(`Buono ${randomCode} emesso con successo per ${nuovoBeneficiario}!`);
    // Reset form
    setNuovoAcquirente("");
    setNuovoBeneficiario("");
    setNuovaDedica("");
  };

  // Riscatto al conto
  const handleRiscatta = (voucherId: string) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucherId ? { ...v, saldoResiduo: 0, stato: "RISCATTATO" as const } : v
      )
    );
    setIsRiscattaOpen(false);
    setSelectedVoucher(null);
    setCodiceDaRiscattare("");
    showNotification("Voucher riscattato con successo al conto!");
  };

  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.GIFT_CARDS}
      title="Buoni Regalo & Voucher Food Digitali"
      description="Crea, vendi e riscatta voucher 'Cena per Due' o buoni a credito scalabile con codice univoco, QR anti-frode e dedica personalizzata da inviare via WhatsApp."
      icon="🎁"
    >
      <div className="space-y-6">
        {feedback && (
          <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in">
            <span>{feedback}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Gift className="w-6 h-6 text-emerald-600" />
              Buoni Regalo & Esperienze Gourmet
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Emetti voucher cena, verifica codici al tavolo e gestisci i crediti prepagati.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRiscattaOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              Verifica Codice Cassa
            </button>
            <button
              type="button"
              onClick={() => setIsNuovoOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Emetti Nuovo Buono Cena
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Incasso Prepagato
            </p>
            <p className="text-2xl font-black text-slate-900">{incassoTotale.toFixed(2)} €</p>
            <p className="text-[11px] text-emerald-600 font-medium">Incassato anticipatamente</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-slate-400" />
              Voucher Attivi
            </p>
            <p className="text-2xl font-black text-emerald-700">{attiviCount}</p>
            <p className="text-[11px] text-slate-400 font-medium">In attesa di cena</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Valore in Circolazione
            </p>
            <p className="text-2xl font-black text-slate-900">{valoreInCircolazione.toFixed(2)} €</p>
            <p className="text-[11px] text-slate-400 font-medium">Credito spendibile</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Riscattati con Successo
            </p>
            <p className="text-2xl font-black text-emerald-700">
              {vouchers.filter((v) => v.stato === "RISCATTATO").length}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium">100% anti-frode</p>
          </div>
        </div>

        {/* Tabella Buoni Regalo */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltroStato("TUTTI")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroStato === "TUTTI"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Tutti ({vouchers.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStato("ATTIVO")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroStato === "ATTIVO"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Attivi ({attiviCount})
              </button>
              <button
                type="button"
                onClick={() => setFiltroStato("RISCATTATO")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroStato === "RISCATTATO"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Riscattati ({vouchers.length - attiviCount})
              </button>
            </div>

            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca codice o nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Codice & Esperienza</th>
                  <th className="px-5 py-3">Acquirente & Destinatario</th>
                  <th className="px-5 py-3 text-right">Valore</th>
                  <th className="px-5 py-3 text-center">Stato</th>
                  <th className="px-5 py-3 text-right">Azioni Cassa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-emerald-800 text-sm">
                        #{v.codice}
                      </div>
                      <div className="font-semibold text-slate-900 mt-0.5">{v.titolo}</div>
                      {v.dedica && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          &ldquo;{v.dedica}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800">
                        Per: <span className="font-bold">{v.beneficiario}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">Da: {v.acquirente}</div>
                      <div className="text-[10px] text-slate-400">Scade: {v.scadenza}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="font-mono font-black text-sm text-slate-900">
                        {v.valore.toFixed(2)} €
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Residuo: {v.saldoResiduo.toFixed(2)} €
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          v.stato === "ATTIVO"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {v.stato === "ATTIVO" ? "Disponibile" : "Riscattato"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {v.stato === "ATTIVO" ? (
                        <button
                          type="button"
                          onClick={() => handleRiscatta(v.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
                        >
                          Riscatta al Conto
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Già utilizzato</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Emetti Nuovo Buono */}
      {isNuovoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                Emetti Nuovo Buono Cena Regalo
              </h3>
              <button
                onClick={() => setIsNuovoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreaVoucher} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Tipologia / Titolo Esperienza
                </label>
                <select
                  value={nuovoTitolo}
                  onChange={(e) => setNuovoTitolo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cena a Lume di Candela per 2 Persone">
                    Cena a Lume di Candela per 2 Persone
                  </option>
                  <option value="Percorso Degustazione Chef con Vini">
                    Percorso Degustazione Chef con Vini
                  </option>
                  <option value="Buono Credito Gastronomico Scalabile">
                    Buono Credito Gastronomico Scalabile
                  </option>
                  <option value="Aperitivo Gourmet & Tagliere Artigianale">
                    Aperitivo Gourmet & Tagliere Artigianale
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Importo Prepagato (€)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={nuovoValore}
                    onChange={(e) => setNuovoValore(parseFloat(e.target.value) || 0)}
                    className="w-full text-base font-bold font-mono px-3 py-1.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nome Beneficiario *</label>
                  <input
                    type="text"
                    placeholder="Es. Mario & Laura"
                    required
                    value={nuovoBeneficiario}
                    onChange={(e) => setNuovoBeneficiario(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Acquistato da</label>
                <input
                  type="text"
                  placeholder="Es. Famiglia Bianchi"
                  value={nuovoAcquirente}
                  onChange={(e) => setNuovoAcquirente(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Dedica Personalizzata</label>
                <textarea
                  rows={2}
                  placeholder="Es. Con affetto per il tuo compleanno!"
                  value={nuovaDedica}
                  onChange={(e) => setNuovaDedica(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNuovoOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Genera & Emetti Buono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Verifica & Riscatto Codice */}
      {isRiscattaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                Verifica Voucher Cassa & Tavolo
              </h3>
              <button
                onClick={() => setIsRiscattaOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Inserisci o Scansiona Codice Univoco
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Es. CENA-ROMANTICA-120"
                    value={codiceDaRiscattare}
                    onChange={(e) => setCodiceDaRiscattare(e.target.value.toUpperCase())}
                    className="w-full font-mono font-bold uppercase px-3 py-2 border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const match = vouchers.find(
                        (v) => v.codice.toUpperCase() === codiceDaRiscattare.trim().toUpperCase()
                      );
                      if (match) {
                        setSelectedVoucher(match);
                      } else {
                        alert("Codice non trovato o errato!");
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Verifica
                  </button>
                </div>
              </div>

              {selectedVoucher && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{selectedVoucher.titolo}</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {selectedVoucher.valore.toFixed(2)} €
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Beneficiario: <b>{selectedVoucher.beneficiario}</b> • Emesso da: {selectedVoucher.acquirente}
                  </p>
                  <p className="text-slate-400 text-[10px]">Scadenza: {selectedVoucher.scadenza}</p>

                  <div className="pt-2">
                    {selectedVoucher.stato === "ATTIVO" ? (
                      <button
                        type="button"
                        onClick={() => handleRiscatta(selectedVoucher.id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                      >
                        ✓ Conferma Riscatto al Conto Tavolo
                      </button>
                    ) : (
                      <div className="p-2 bg-amber-50 text-amber-800 text-center font-bold rounded-xl">
                        ⚠️ Questo buono risulta già riscattato
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AddonModuleGuard>
  );
}