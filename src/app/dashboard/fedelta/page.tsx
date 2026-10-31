"use client";

import React, { useState } from "react";
import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import {
  Award,
  Search,
  Plus,
  Gift,
  Users,
  Sparkles,
  CheckCircle2,
  UtensilsCrossed,
  Wine,
  Flame,
  X,
  CreditCard,
  QrCode,
} from "lucide-react";

interface ClienteFedelta {
  id: string;
  nome: string;
  cognome: string;
  telefono: string;
  puntiFedelta: number;
  dataUltimaVisita: string;
  tavoloFrequente?: string;
}

interface Movimento {
  id: string;
  clienteNome: string;
  punti: number;
  tipo: "ACCREDITO" | "RISCATTO";
  descrizione: string;
  data: string;
}

const MOCK_CLIENTI: ClienteFedelta[] = [
  {
    id: "c1",
    nome: "Marco",
    cognome: "Galli",
    telefono: "+39 347 1234567",
    puntiFedelta: 380,
    dataUltimaVisita: "Ieri sera",
    tavoloFrequente: "Tavolo 4 (Sala)",
  },
  {
    id: "c2",
    nome: "Elena",
    cognome: "Rossi",
    telefono: "+39 339 9876543",
    puntiFedelta: 160,
    dataUltimaVisita: "3 giorni fa",
    tavoloFrequente: "Tavolo 12 (Terrazza)",
  },
  {
    id: "c3",
    nome: "Roberto",
    cognome: "Bianchi",
    telefono: "+39 320 5551234",
    puntiFedelta: 780,
    dataUltimaVisita: "24 Ottobre",
    tavoloFrequente: "Tavolo 8 (Cantina)",
  },
  {
    id: "c4",
    nome: "Giulia",
    cognome: "Ferrari",
    telefono: "+39 348 7766554",
    puntiFedelta: 90,
    dataUltimaVisita: "18 Ottobre",
    tavoloFrequente: "Tavolo 2 (Angolo)",
  },
  {
    id: "c5",
    nome: "Matteo",
    cognome: "Conti",
    telefono: "+39 333 4455667",
    puntiFedelta: 240,
    dataUltimaVisita: "15 Ottobre",
    tavoloFrequente: "Tavolo 6",
  },
];

const PREMI_CATALOGO = [
  {
    id: "p1",
    nome: "Calice di Benvenuto & Dessert della Casa",
    punti: 150,
    icon: UtensilsCrossed,
    descrizione: "Dolce artigianale a scelta dalla carta dei dessert con calice di passito.",
    badge: "Base",
  },
  {
    id: "p2",
    nome: "Bottiglia di Vino Selezione Cantina Chef",
    punti: 350,
    icon: Wine,
    descrizione: "Bottiglia DOC del territorio consigliata dallo chef da gustare al tavolo o da asporto.",
    badge: "Gourmet",
  },
  {
    id: "p3",
    nome: "Cena Degustazione Completa per 2 Persone",
    punti: 750,
    icon: Sparkles,
    descrizione: "Menu degustazione 4 portate con abbinamento vini riservato ai clienti VIP.",
    badge: "VIP Club",
  },
];

export default function TavolyFedeltaPage() {
  const [clienti, setClienti] = useState<ClienteFedelta[]>(MOCK_CLIENTI);
  const [search, setSearch] = useState("");
  const [movimenti, setMovimenti] = useState<Movimento[]>([
    {
      id: "m1",
      clienteNome: "Marco Galli",
      punti: 85,
      tipo: "ACCREDITO",
      descrizione: "Conto Cena Tavolo 4 (85 €)",
      data: "Ieri alle 22:45",
    },
    {
      id: "m2",
      clienteNome: "Roberto Bianchi",
      punti: -350,
      tipo: "RISCATTO",
      descrizione: "Riscatto Bottiglia Vino Selezione",
      data: "24 Ottobre alle 21:30",
    },
  ]);

  // Modali
  const [isAssegnaOpen, setIsAssegnaOpen] = useState(false);
  const [isRiscattaOpen, setIsRiscattaOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteFedelta | null>(null);
  const [importoConto, setImportoConto] = useState<number>(60);
  const [premioSelezionato, setPremioSelezionato] = useState(PREMI_CATALOGO[0]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const filteredClienti = clienti.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.cognome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefono.includes(search)
  );

  const getLivello = (punti: number) => {
    if (punti >= 700) return { label: "Gold Gourmet VIP", color: "bg-amber-100 text-amber-800 border-amber-200" };
    if (punti >= 300) return { label: "Silver Foodie", color: "bg-slate-100 text-slate-800 border-slate-200" };
    return { label: "Membro Base", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  };

  // Esegui accredito punti conto
  const handleAccreditaPunti = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente || importoConto <= 0) return;

    const puntiGuadagnati = Math.floor(importoConto); // 1€ = 1 pt
    setClienti((prev) =>
      prev.map((c) =>
        c.id === selectedCliente.id ? { ...c, puntiFedelta: c.puntiFedelta + puntiGuadagnati } : c
      )
    );

    setMovimenti((prev) => [
      {
        id: `m_${Date.now()}`,
        clienteNome: `${selectedCliente.nome} ${selectedCliente.cognome}`,
        punti: puntiGuadagnati,
        tipo: "ACCREDITO",
        descrizione: `Conto Tavolo (${importoConto.toFixed(2)} €)`,
        data: "Poco fa",
      },
      ...prev,
    ]);

    setIsAssegnaOpen(false);
    showNotification(`Accreditati +${puntiGuadagnati} punti a ${selectedCliente.nome}!`);
  };

  // Esegui riscatto premio
  const handleRiscattaPremio = () => {
    if (!selectedCliente) return;
    if (selectedCliente.puntiFedelta < premioSelezionato.punti) {
      alert("Punti insufficienti per questo premio!");
      return;
    }

    setClienti((prev) =>
      prev.map((c) =>
        c.id === selectedCliente.id
          ? { ...c, puntiFedelta: c.puntiFedelta - premioSelezionato.punti }
          : c
      )
    );

    setMovimenti((prev) => [
      {
        id: `m_${Date.now()}`,
        clienteNome: `${selectedCliente.nome} ${selectedCliente.cognome}`,
        punti: -premioSelezionato.punti,
        tipo: "RISCATTO",
        descrizione: `Riscatto ${premioSelezionato.nome}`,
        data: "Poco fa",
      },
      ...prev,
    ]);

    setIsRiscattaOpen(false);
    showNotification(`Premio riscattato: ${premioSelezionato.nome} per ${selectedCliente.nome}!`);
  };

  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.LOYALTY_CARD}
      title="Raccolta Punti & Card Fedeltà Ristorante"
      description="Fidelizza i commensali con accumulo punti automatico sul conto (1 € speso = 1 punto), card digitale su smartphone e premi gourmet riscattabili al tavolo o in cassa."
      icon="🎟️"
    >
      <div className="space-y-6">
        {feedback && (
          <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-between animate-in fade-in">
            <span>{feedback}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}

        {/* Header con Titolo e Azioni */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-emerald-600" />
              Raccolta Punti & Fidelity Food
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Programma fedeltà tavolo, accumulo spesa e catalogo omaggi gastronomici.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Modulo v1.1.0 Attivo
            </span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Tessere Attive
            </p>
            <p className="text-2xl font-black text-slate-900">148</p>
            <p className="text-[11px] text-emerald-600 font-medium">+12 questo mese</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Punti in Circolazione
            </p>
            <p className="text-2xl font-black text-emerald-700">14.620 pt</p>
            <p className="text-[11px] text-slate-400 font-medium">1 € conto = 1 pt</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-slate-400" />
              Premi Riscattati
            </p>
            <p className="text-2xl font-black text-slate-900">38</p>
            <p className="text-[11px] text-emerald-600 font-medium">Dolci, vini e cene</p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-1">
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-slate-400" />
              Visite Fedeltà Mese
            </p>
            <p className="text-2xl font-black text-emerald-700">86 tavoli</p>
            <p className="text-[11px] text-slate-400 font-medium">Tasso ritorno 74%</p>
          </div>
        </div>

        {/* Catalogo Premi & Livelli */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-600" />
                Catalogo Premi & Livelli Gastronomici
              </h2>
              <p className="text-xs text-slate-500">I vantaggi che i tuoi commensali possono riscattare</p>
            </div>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              Regola attiva: 1 € conto = 1 Punto
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {PREMI_CATALOGO.map((p) => {
              const IconComp = p.icon;
              return (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between hover:border-emerald-300 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {p.punti} pt
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900">{p.nome}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{p.descrizione}</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/60 mt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Livello: {p.badge}</span>
                    <span className="font-semibold text-emerald-700">Riscatto in cassa</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabella Classifica & Saldo Clienti */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Classifica & Saldo Clienti</h2>
              <p className="text-xs text-slate-500">
                Seleziona un cliente per accreditare i punti del conto o riscattare un premio al tavolo
              </p>
            </div>
            <div className="w-full sm:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cerca cliente per nome o cellulare..."
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
                  <th className="px-5 py-3">Commensale</th>
                  <th className="px-5 py-3">Recapito</th>
                  <th className="px-5 py-3 text-center">Fascia Fedeltà</th>
                  <th className="px-5 py-3 text-right">Saldo Punti</th>
                  <th className="px-5 py-3 text-right">Azioni Cassa & Tavolo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClienti.map((c) => {
                  const lvl = getLivello(c.puntiFedelta);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">
                          {c.nome} {c.cognome}
                        </div>
                        <div className="text-[10px] text-slate-400">Ultima cena: {c.dataUltimaVisita}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-700">{c.telefono}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${lvl.color}`}>
                          {lvl.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-mono font-black text-sm text-emerald-700">
                          {c.puntiFedelta} pt
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCliente(c);
                            setIsAssegnaOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs"
                        >
                          + Accredita Conto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCliente(c);
                            setIsRiscattaOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition"
                        >
                          🎁 Riscatta
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storico Ultimi Movimenti */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Ultimi Movimenti Fidelity in Cassa
          </h3>
          <div className="space-y-2">
            {movimenti.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{m.clienteNome}</span>
                  <span className="text-slate-400 ml-2">({m.descrizione})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400">{m.data}</span>
                  <span
                    className={`font-mono font-bold ${
                      m.punti > 0 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {m.punti > 0 ? `+${m.punti}` : m.punti} pt
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Accredita Punti */}
      {isAssegnaOpen && selectedCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                Accredita Punti Conto — {selectedCliente.nome} {selectedCliente.cognome}
              </h3>
              <button
                onClick={() => setIsAssegnaOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAccreditaPunti} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Totale Conto al Tavolo (€)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={importoConto}
                  onChange={(e) => setImportoConto(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Punti da Accreditare:</span>
                  <span className="font-mono font-black text-sm">+{Math.floor(importoConto)} pt</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Nuovo saldo finale: {selectedCliente.puntiFedelta + Math.floor(importoConto)} pt
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssegnaOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  Conferma Accredito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Riscatta Premio */}
      {isRiscattaOpen && selectedCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Riscatta Premio al Tavolo
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedCliente.nome} {selectedCliente.cognome} • Saldo: {selectedCliente.puntiFedelta} pt
                </p>
              </div>
              <button
                onClick={() => setIsRiscattaOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Seleziona Premio dal Catalogo:
              </label>
              {PREMI_CATALOGO.map((p) => {
                const canAfford = selectedCliente.puntiFedelta >= p.punti;
                const isSelected = premioSelezionato.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => canAfford && setPremioSelezionato(p)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50"
                        : canAfford
                        ? "border-slate-200 hover:bg-slate-50"
                        : "border-slate-100 opacity-40 cursor-not-allowed bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{p.nome}</span>
                      <span className="font-mono font-bold text-emerald-700">{p.punti} pt</span>
                    </div>
                    {!canAfford && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-1">
                        Punti mancanti: {p.punti - selectedCliente.puntiFedelta} pt
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRiscattaOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleRiscattaPremio}
                disabled={selectedCliente.puntiFedelta < premioSelezionato.punti}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Conferma Riscatto
              </button>
            </div>
          </div>
        </div>
      )}
    </AddonModuleGuard>
  );
}