"use client";

import { useState } from "react";
import {
  Settings,
  Clock,
  Users,
  UtensilsCrossed,
  Mail,
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  QrCode,
  MapPin,
  Phone,
  Smartphone,
} from "lucide-react";
import EmailSettingsCard from "@/components/dashboard/EmailSettingsCard";
import RegisteredDevicesCard from "@/components/dashboard/RegisteredDevicesCard";

type SettingsTab = "ristorante" | "turni" | "email" | "whatsapp" | "dispositivi" | "aspetto";

interface TabItem {
  id: SettingsTab;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "ristorante",
    label: "Ristorante & Sede",
    shortLabel: "Ristorante",
    icon: "🍽️",
    description: "Anagrafica locale, P.IVA, recapiti e indirizzo per i clienti",
  },
  {
    id: "turni",
    label: "Turni & Coperti",
    shortLabel: "Turni",
    icon: "⏰",
    description: "Orari di servizio pranzo/cena, capienza sale e tolleranza ritardo",
  },
  {
    id: "email",
    label: "Email & Prenotazioni",
    shortLabel: "Email",
    icon: "📧",
    description: "Canale email Taaaac Mail Engine e conferme prenotazione tavolo",
  },
  {
    id: "whatsapp",
    label: "WhatsApp & Tavoli",
    shortLabel: "WhatsApp",
    icon: "💬",
    description: "Notifiche automatiche WhatsApp di conferma tavolo e stato comande",
  },
  {
    id: "dispositivi",
    label: "Dispositivi & Palmari PWA",
    shortLabel: "Dispositivi",
    icon: "📱",
    description: "Accesso biometrico FaceID/PIN e revoca/disconnessione palmari da remoto",
  },
  {
    id: "aspetto",
    label: "Aspetto & Menù QR",
    shortLabel: "Aspetto",
    icon: "🎨",
    description: "Personalizzazione tema tavoli, menù digitale QR e logo locale",
  },
];

export default function TavolyImpostazioniPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ristorante");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    nomeRistorante: "Osteria dei Tavoli",
    indirizzo: "Piazza Grande, 12 - 52100 Arezzo (AR)",
    telefono: "+39 0575 654321",
    email: "prenotazioni@osteriatavoli.it",
    copertiInterni: "45",
    copertiDehors: "30",
    copertiVeranda: "20",
    pranzoInizio: "12:30",
    pranzoFine: "15:00",
    cenaPrimoTurno: "19:30 - 21:15",
    cenaSecondoTurno: "21:30 - 23:30",
    tolleranzaRitardoMinuti: "15",
    whatsappAbilitato: true,
    colorePrimario: "#064e3b",
    coloreAccento: "#059669",
  });

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await new Promise((r) => setTimeout(r, 600));
      setFeedback({ type: "success", text: "Impostazioni del ristorante salvate con successo!" });
    } catch {
      setFeedback({ type: "error", text: "Errore durante il salvataggio." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Intestazione Principale */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <span>🍽️ Gestione Ristorazione</span>
            <span>•</span>
            <span>Configurazione Sale & Coperti</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-600" />
            Impostazioni Tavoly
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configura orari di servizio, capienza massima coperti, palmari PWA e notifiche.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-xs shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Salvataggio...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salva Modifiche</span>
            </>
          )}
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* SOTTOMENU / TABS BAR */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 shadow-xs">
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth" aria-label="Impostazioni Tavoly">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Intestazione Sottomenu Corrente */}
      {currentTab && (
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>{currentTab.icon}</span>
              <span>{currentTab.label}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{currentTab.description}</p>
          </div>
        </div>
      )}

      {/* CONTENUTO SCHEDE */}

      {/* TAB 1: RISTORANTE & SEDE */}
      {activeTab === "ristorante" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Ristorante / Insegna</label>
              <input
                type="text"
                value={form.nomeRistorante}
                onChange={(e) => setForm({ ...form, nomeRistorante: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Indirizzo Locale</label>
              <input
                type="text"
                value={form.indirizzo}
                onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Telefono Ristorante (Prenotazioni)</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Pubblica Locale</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TURNI & COPERTI */}
      {activeTab === "turni" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Capienza Massima Sale
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">Sala Interna</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.copertiInterni}
                    onChange={(e) => setForm({ ...form, copertiInterni: e.target.value })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-500 font-medium">Coperti</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">Dehors Estivo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.copertiDehors}
                    onChange={(e) => setForm({ ...form, copertiDehors: e.target.value })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-500 font-medium">Coperti</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">Veranda Panoramica</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.copertiVeranda}
                    onChange={(e) => setForm({ ...form, copertiVeranda: e.target.value })}
                    className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900 text-sm"
                  />
                  <span className="text-slate-500 font-medium">Coperti</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Fasce Orarie e Turni di Servizio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Servizio Cena</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Primo Turno:</span>
                    <input
                      type="text"
                      value={form.cenaPrimoTurno}
                      onChange={(e) => setForm({ ...form, cenaPrimoTurno: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-emerald-700 text-xs w-36 text-center"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Secondo Turno:</span>
                    <input
                      type="text"
                      value={form.cenaSecondoTurno}
                      onChange={(e) => setForm({ ...form, cenaSecondoTurno: e.target.value })}
                      className="px-2 py-1 rounded-lg border border-slate-300 font-mono font-bold text-emerald-700 text-xs w-36 text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs uppercase tracking-wide">Tolleranza & Pranzo</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Tolleranza Ritardo:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={form.tolleranzaRitardoMinuti}
                        onChange={(e) => setForm({ ...form, tolleranzaRitardoMinuti: e.target.value })}
                        className="w-16 px-2 py-1 rounded-lg border border-slate-300 font-mono text-center text-xs"
                      />
                      <span className="text-slate-500">minuti</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Fascia Pranzo:</span>
                    <span className="font-mono text-xs text-slate-700 font-bold">12:30 - 15:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL & PRENOTAZIONI */}
      {activeTab === "email" && (
        <div className="space-y-4">
          <EmailSettingsCard />
        </div>
      )}

      {/* TAB 4: WHATSAPP & TAVOLI */}
      {activeTab === "whatsapp" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-sm font-bold text-slate-900">Notifiche Tavolo WhatsApp</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Invia messaggio WhatsApp immediato al cliente alla conferma o modifica della prenotazione del tavolo.
              </p>
            </div>
            <input
              type="checkbox"
              checked={form.whatsappAbilitato}
              onChange={(e) => setForm({ ...form, whatsappAbilitato: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-slate-700 space-y-2">
            <span className="text-emerald-800 font-bold block text-sm">Messaggio Conferma Tavolo:</span>
            <div className="p-3 rounded-lg bg-white font-mono text-[11px] text-slate-800 leading-relaxed border border-emerald-200">
              Gentile &#123;&#123;nome_cliente&#125;&#125;, il tuo tavolo per &#123;&#123;numero_coperti&#125;&#125; persone è confermato per oggi alle ore &#123;&#123;orario&#125;&#125; da Osteria dei Tavoli! Consulta il menù digitale in anteprima: &#123;&#123;link_menu&#125;&#125;
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DISPOSITIVI & PALMARI PWA */}
      {activeTab === "dispositivi" && (
        <div className="space-y-4">
          <RegisteredDevicesCard />
        </div>
      )}

      {/* TAB 6: ASPETTO & MENÙ QR */}
      {activeTab === "aspetto" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colore Primario Locale</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.colorePrimario}
                  onChange={(e) => setForm({ ...form, colorePrimario: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-xs text-slate-700 font-bold">{form.colorePrimario}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Colore Accento Menù & Dettagli</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.coloreAccento}
                  onChange={(e) => setForm({ ...form, coloreAccento: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <span className="font-mono text-xs text-emerald-700 font-bold">{form.coloreAccento}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
