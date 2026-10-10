"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  ChevronRight,
  ChefHat,
  Tv,
  ShoppingBag,
} from "lucide-react";
import EmailSettingsCard from "@/components/dashboard/EmailSettingsCard";
import RegisteredDevicesCard from "@/components/dashboard/RegisteredDevicesCard";
import { toggleKdsSettingAction } from "@/app/actions";
import { TakeawaySettings, DEFAULT_TAKEAWAY_SETTINGS } from "@/lib/takeaway-rules";

type SettingsTab = "ristorante" | "turni" | "email" | "whatsapp" | "cucina" | "asporto" | "dispositivi" | "aspetto";

interface TabItem {
  id: SettingsTab;
  label: string;
  shortLabel: string;
  iconComponent: React.ElementType;
  shortDescription: string;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: "ristorante",
    label: "Ristorante & Sede",
    shortLabel: "Ristorante",
    iconComponent: UtensilsCrossed,
    shortDescription: "Anagrafica, P.IVA e recapiti",
    description: "Anagrafica locale, P.IVA, recapiti e indirizzo per i clienti",
  },
  {
    id: "turni",
    label: "Turni & Coperti",
    shortLabel: "Turni",
    iconComponent: Clock,
    shortDescription: "Pranzo, cena e tolleranza",
    description: "Orari di servizio pranzo/cena, capienza sale e tolleranza ritardo",
  },
  {
    id: "email",
    label: "Email & Notifiche",
    shortLabel: "Email",
    iconComponent: Mail,
    shortDescription: "Taaaac Engine e conferme",
    description: "Canale email Taaaac Mail Engine e conferme prenotazione tavolo",
  },
  {
    id: "whatsapp",
    label: "WhatsApp & Tavoli",
    shortLabel: "WhatsApp",
    iconComponent: MessageSquare,
    shortDescription: "Notifiche comande e tavoli",
    description: "Notifiche automatiche WhatsApp di conferma tavolo e stato comande",
  },
  {
    id: "cucina",
    label: "Monitor Cucina (KDS)",
    shortLabel: "Cucina KDS",
    iconComponent: ChefHat,
    shortDescription: "Comande FIFO e monitor pass",
    description: "Abilitazione schermo cucina KDS, ordini fast-food style e gestione comande",
  },
  {
    id: "asporto",
    label: "Asporto & Takeaway",
    shortLabel: "Asporto",
    iconComponent: ShoppingBag,
    shortDescription: "Regole ritiro e capienza",
    description: "Abilitazione asporto, fasce orarie di ritiro, tempo di preparazione e max comande per slot",
  },
  {
    id: "dispositivi",
    label: "Dispositivi & Palmari",
    shortLabel: "Dispositivi",
    iconComponent: Smartphone,
    shortDescription: "Biometria e palmari sala",
    description: "Accesso biometrico FaceID/PIN e revoca/disconnessione palmari da remoto",
  },
  {
    id: "aspetto",
    label: "Aspetto & Menù QR",
    shortLabel: "Aspetto",
    iconComponent: Palette,
    shortDescription: "Tema sala, colori e menù QR",
    description: "Personalizzazione tema tavoli, menù digitale QR e logo locale",
  },
];

export default function TavolyImpostazioniPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ristorante");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [kdsSaving, setKdsSaving] = useState(false);
  const [kdsSavedNotice, setKdsSavedNotice] = useState(false);

  // Takeaway Rules State
  const [takeaway, setTakeaway] = useState<TakeawaySettings>(DEFAULT_TAKEAWAY_SETTINGS);
  const [takeawaySaving, setTakeawaySaving] = useState(false);
  const [takeawaySavedNotice, setTakeawaySavedNotice] = useState(false);

  const handleToggleTakeaway = async (newVal: boolean) => {
    setTakeaway((prev) => ({ ...prev, enabled: newVal }));
    setTakeawaySaving(true);
    try {
      const { toggleTakeawayEnabledAction } = await import("@/app/actions");
      await toggleTakeawayEnabledAction(newVal);
      setTakeawaySavedNotice(true);
      setTimeout(() => setTakeawaySavedNotice(false), 3000);
    } catch (err) {
      console.error("Errore salvataggio rapido Asporto:", err);
    } finally {
      setTakeawaySaving(false);
    }
  };

  const handleSaveTakeawaySettings = async () => {
    setTakeawaySaving(true);
    try {
      const { saveTakeawaySettingsAction } = await import("@/app/actions");
      await saveTakeawaySettingsAction(takeaway);
      setTakeawaySavedNotice(true);
      setTimeout(() => setTakeawaySavedNotice(false), 3000);
      setFeedback({ type: "success", text: "Regole e orari asporto salvati con successo!" });
    } catch (err) {
      console.error("Errore salvataggio impostazioni Asporto:", err);
      setFeedback({ type: "error", text: "Errore durante il salvataggio dell'asporto." });
    } finally {
      setTakeawaySaving(false);
    }
  };

  const handleToggleKds = async (newVal: boolean) => {
    setForm((prev) => ({ ...prev, kdsEnabled: newVal }));
    if (typeof document !== "undefined") {
      document.cookie = `kds_enabled=${newVal ? "true" : "false"}; path=/; max-age=31536000; SameSite=Lax`;
    }
    setKdsSaving(true);
    try {
      await toggleKdsSettingAction(newVal);
      setKdsSavedNotice(true);
      setTimeout(() => setKdsSavedNotice(false), 3000);
    } catch (err) {
      console.error("Errore salvataggio rapido KDS:", err);
    } finally {
      setKdsSaving(false);
    }
  };

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
    logoUrl: "",
    faviconUrl: "",
    menuShowImages: true,
    kdsEnabled: false,
  });

  // Brand Assets State & Refs
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [dragActiveFavicon, setDragActiveFavicon] = useState(false);
  const [imageProcessing, setImageProcessing] = useState<string | null>(null);

  useEffect(() => {
    let cookieKds: boolean | null = null;
    if (typeof document !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)kds_enabled=([^;]*)/);
      if (match) {
        cookieKds = match[1] === "true";
      }
    }
    if (cookieKds !== null) {
      setForm((f) => ({ ...f, kdsEnabled: cookieKds! }));
    }

    fetch("/api/impostazioni")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.takeawaySettings) {
            setTakeaway(data.takeawaySettings);
          }
          setForm((f) => {
            const resolvedKds = cookieKds !== null ? cookieKds : Boolean(data.kdsEnabled);
            return {
              ...f,
              nomeRistorante: data.nomeRistorante || f.nomeRistorante,
              logoUrl: data.logoUrl || "",
              faviconUrl: data.faviconUrl || "",
              colorePrimario: data.colorePrimario || f.colorePrimario,
              coloreAccento: data.coloreAccento || f.coloreAccento,
              email: data.email || f.email,
              telefono: data.telefono || f.telefono,
              indirizzo: data.indirizzo || f.indirizzo,
              menuShowImages: data.menuShowImages !== undefined ? Boolean(data.menuShowImages) : f.menuShowImages,
              kdsEnabled: resolvedKds,
            };
          });
        }
      })
      .catch((err) => console.error("Errore caricamento impostazioni:", err));
  }, []);

  const processImageFile = (
    file: File,
    maxSize: number,
    format: "image/webp" | "image/png",
    callback: (dataUrl: string) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      setFeedback({ type: "error", text: "Il file selezionato non è un'immagine valida." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setFeedback({ type: "error", text: "L'immagine supera gli 8MB. Seleziona un file più leggero." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(format, format === "image/webp" ? 0.9 : undefined);
        callback(dataUrl);
      };
      img.onerror = () => {
        setFeedback({ type: "error", text: "Impossibile elaborare l'immagine caricata." });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      if (typeof document !== "undefined") {
        document.cookie = `kds_enabled=${form.kdsEnabled ? "true" : "false"}; path=/; max-age=31536000; SameSite=Lax`;
      }
      const res = await fetch("/api/impostazioni", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeRistorante: form.nomeRistorante,
          logoUrl: form.logoUrl || "",
          faviconUrl: form.faviconUrl || "",
          colorePrimario: form.colorePrimario,
          coloreAccento: form.coloreAccento,
          email: form.email,
          telefono: form.telefono,
          indirizzo: form.indirizzo,
          menuShowImages: form.menuShowImages,
          kdsEnabled: form.kdsEnabled,
          takeawaySettings: takeaway,
        }),
      });

      if (res.ok) {
        setFeedback({ type: "success", text: "Impostazioni del ristorante salvate con successo!" });
      } else {
        setFeedback({ type: "error", text: "Errore durante il salvataggio." });
      }
    } catch {
      setFeedback({ type: "error", text: "Errore durante il salvataggio." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab);
  const ActiveIcon = currentTab?.iconComponent || UtensilsCrossed;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
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

      {/* LAYOUT A 2 COLONNE: NAVIGAZIONE VERTICALE A SINISTRA + CONTENUTI A DESTRA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: MENU SEZIONI IMPOSTAZIONI */}
        <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-6 space-y-3">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 sm:p-2.5 shadow-xs">
            <div className="px-3 py-2 border-b border-slate-100 hidden lg:block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sezioni Impostazioni
              </span>
            </div>

            <nav
              className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar pt-1 lg:pt-2"
              aria-label="Sezioni Impostazioni Tavoly"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const IconComp = tab.iconComponent;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center justify-between w-full p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer shrink-0 lg:shrink ${
                      isActive
                        ? "bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-semibold truncate flex items-center gap-1.5">
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">{tab.shortLabel}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-normal truncate hidden lg:block">
                          {tab.shortDescription}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform hidden lg:block ${
                        isActive
                          ? "text-emerald-600 translate-x-0.5"
                          : "text-slate-300 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* COLONNA DESTRA: PANNELLO CONTENUTI */}
        <main className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Header contestuale scheda attiva */}
          {currentTab && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <ActiveIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    {currentTab.label}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentTab.description}</p>
                </div>
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

      {/* TAB CUCINA: MONITOR CUCINA (KDS) */}
      {activeTab === "cucina" && (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  Gestione Monitor Cucina (KDS - Kitchen Display System)
                </h3>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Fast-Food / Ristorante
              </span>
            </div>

            {/* Switch Attivazione KDS */}
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-1">
                <label
                  htmlFor="kdsEnabledCheckbox"
                  className="text-xs font-bold text-slate-900 cursor-pointer flex items-center gap-2"
                >
                  <span>Abilita Monitor Cucina KDS</span>
                  {form.kdsEnabled && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Attivo
                    </span>
                  )}
                  {kdsSaving && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                      Salvataggio in corso...
                    </span>
                  )}
                  {kdsSavedNotice && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Salvato e attivo!
                    </span>
                  )}
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Mostra la voce &quot;Monitor Cucina (KDS)&quot; nella barra laterale e abilita la schermata dinamica in cucina ordinata per arrivo (FIFO) con timer di attesa colorati, gestione rapida varianti e pulsanti touch per il personale al pass.
                </p>
              </div>
              <input
                id="kdsEnabledCheckbox"
                type="checkbox"
                checked={form.kdsEnabled}
                disabled={kdsSaving}
                onChange={(e) => handleToggleKds(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer mt-1"
              />
            </div>

            {/* Box Anteprima & Link Schermo Intero se abilitato */}
            {form.kdsEnabled ? (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900">
                      Schermo KDS Pronto per l&apos;uso
                    </span>
                  </div>
                  <Link
                    href="/cucina"
                    target="_blank"
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>Apri Monitor a Tutto Schermo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-[11px] text-emerald-800/80">
                  Puoi aprire questo link su qualsiasi tablet, computer o smart TV presente in cucina per tenere traccia delle comande in arrivo. Il sistema include avviso sonoro per i nuovi ordini in tempo reale.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                ℹ️ Quando il monitor cucina è disattivato, non compare nella barra di navigazione e non occupa risorse di background.
              </div>
            )}

            {/* Tasto dedicato Salva & Applica Stato Monitor KDS */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Stato salvato: <strong>{form.kdsEnabled ? "Attivo" : "Disattivato"}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleToggleKds(form.kdsEnabled)}
                disabled={kdsSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{kdsSaving ? "Salvataggio..." : "Salva Stato Monitor KDS"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB ASPORTO: REGOLE & CAPACITÀ TAKEAWAY */}
      {activeTab === "asporto" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Gestione Servizio Asporto & Ritiro Ordini</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configura se accettare ordini per asporto, le fasce orarie consentite e le regole di capacità per la cucina.
              </p>
            </div>
            {/* Toggle Abilitazione Generale Asporto */}
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 px-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                {takeaway.enabled ? "Asporto Attivo" : "Asporto Disattivato"}
              </span>
              <input
                type="checkbox"
                checked={takeaway.enabled}
                disabled={takeawaySaving}
                onChange={(e) => handleToggleTakeaway(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {takeawaySavedNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
              <span>✓ Regole Asporto salvate con successo!</span>
            </div>
          )}

          {!takeaway.enabled && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <strong>Il servizio di Asporto è attualmente disattivato.</strong>
                <p className="mt-0.5 text-amber-700">
                  I clienti nella pagina di prenotazione online non potranno ordinare piatti per il ritiro.
                </p>
              </div>
            </div>
          )}

          {/* Sezione 1: Giorni e Fasce Orarie di Ritiro */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Giorni e Orari di Ritiro</span>
            </h4>

            {/* Giorni della settimana */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Giorni della settimana in cui è attivo l&apos;asporto:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "1", label: "Lunedì" },
                  { id: "2", label: "Martedì" },
                  { id: "3", label: "Mercoledì" },
                  { id: "4", label: "Giovedì" },
                  { id: "5", label: "Venerdì" },
                  { id: "6", label: "Sabato" },
                  { id: "0", label: "Domenica" },
                ].map((d) => {
                  const isChecked = takeaway.days.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        const newDays = isChecked
                          ? takeaway.days.filter((x) => x !== d.id)
                          : [...takeaway.days, d.id];
                        setTakeaway({ ...takeaway, days: newDays });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isChecked
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {d.label} {isChecked ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Servizio Pranzo e Cena */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Pranzo */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">☀️ Servizio Pranzo</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={takeaway.lunchEnabled}
                      onChange={(e) => setTakeaway({ ...takeaway, lunchEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-slate-600">Abilitato</span>
                  </label>
                </div>
                {takeaway.lunchEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Dalle ore</label>
                      <input
                        type="time"
                        value={takeaway.lunchStart}
                        onChange={(e) => setTakeaway({ ...takeaway, lunchStart: e.target.value })}
                        className="taaaac-input text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Alle ore</label>
                      <input
                        type="time"
                        value={takeaway.lunchEnd}
                        onChange={(e) => setTakeaway({ ...takeaway, lunchEnd: e.target.value })}
                        className="taaaac-input text-xs w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Cena */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">🌙 Servizio Cena</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={takeaway.dinnerEnabled}
                      onChange={(e) => setTakeaway({ ...takeaway, dinnerEnabled: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-semibold text-slate-600">Abilitato</span>
                  </label>
                </div>
                {takeaway.dinnerEnabled && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Dalle ore</label>
                      <input
                        type="time"
                        value={takeaway.dinnerStart}
                        onChange={(e) => setTakeaway({ ...takeaway, dinnerStart: e.target.value })}
                        className="taaaac-input text-xs w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">Alle ore</label>
                      <input
                        type="time"
                        value={takeaway.dinnerEnd}
                        onChange={(e) => setTakeaway({ ...takeaway, dinnerEnd: e.target.value })}
                        className="taaaac-input text-xs w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sezione 2: Regole di Esecuzione & Capacità Cucina */}
          <div className="space-y-4 border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Regole di Esecuzione & Capacità Cucina</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tempo di preparazione */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Tempo Minimo Preparazione
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="180"
                    step="5"
                    value={takeaway.prepTimeMinutes}
                    onChange={(e) =>
                      setTakeaway({ ...takeaway, prepTimeMinutes: parseInt(e.target.value, 10) || 30 })
                    }
                    className="taaaac-input text-xs w-24 font-bold"
                  />
                  <span className="text-xs text-slate-500">minuti</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Preavviso minimo. Gli orari online partono da <strong>ora attuale + questo tempo</strong>.
                </p>
              </div>

              {/* Intervallo slot */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Intervallo Slot di Ritiro
                </label>
                <select
                  value={takeaway.slotIntervalMinutes}
                  onChange={(e) =>
                    setTakeaway({ ...takeaway, slotIntervalMinutes: parseInt(e.target.value, 10) || 15 })
                  }
                  className="taaaac-input text-xs w-full font-bold"
                >
                  <option value={10}>Ogni 10 minuti</option>
                  <option value={15}>Ogni 15 minuti (Consigliato)</option>
                  <option value={20}>Ogni 20 minuti</option>
                  <option value={30}>Ogni 30 minuti</option>
                </select>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Frequenza con cui i clienti possono scaglionare il ritiro al pass.
                </p>
              </div>

              {/* Max comande per slot */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Max Comande per Slot
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={takeaway.maxOrdersPerSlot}
                    onChange={(e) =>
                      setTakeaway({ ...takeaway, maxOrdersPerSlot: parseInt(e.target.value, 10) || 4 })
                    }
                    className="taaaac-input text-xs w-24 font-bold"
                  />
                  <span className="text-xs text-slate-500">ordini / slot</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Raggiunto questo tetto, lo slot risulta <strong>Completo ❌</strong> per non ingolfare la cucina.
                </p>
              </div>
            </div>
          </div>

          {/* Salvataggio Regole Asporto */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Modifiche applicate istantaneamente alle prenotazioni online.
            </span>
            <button
              type="button"
              onClick={handleSaveTakeawaySettings}
              disabled={takeawaySaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{takeawaySaving ? "Salvataggio..." : "Salva Regole Asporto & Capacità"}</span>
            </button>
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
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span>🎨</span> Colori Ristorante & Menù QR
            </h3>
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

          {/* Brand & Identità Visiva (Logo & Favicon) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>✨</span> Brand & Identità Visiva (Logo & Favicon)
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Novità v1.0.2
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LOGO */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🖼️</span> Logo Ristorante
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Mostrato nell'intestazione della vetrina e nelle comunicazioni con i clienti.
                    </p>
                  </div>
                  {form.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, logoUrl: "" })}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition border border-rose-200"
                    >
                      Rimuovi Logo
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={logoInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageProcessing("logo");
                      processImageFile(file, 512, "image/webp", (dataUrl) => {
                        setForm((f) => ({ ...f, logoUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActiveLogo(true);
                  }}
                  onDragLeave={() => setDragActiveLogo(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveLogo(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setImageProcessing("logo");
                      processImageFile(file, 512, "image/webp", (dataUrl) => {
                        setForm((f) => ({ ...f, logoUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragActiveLogo
                      ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200"
                      : "border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">📁</span>
                    <div className="text-xs text-slate-700 font-medium">
                      <span className="text-emerald-600 font-bold underline">Clicca per caricare</span> o trascina qui il file
                    </div>
                    <p className="text-[10px] text-slate-400">
                      PNG, SVG, JPG o WebP (ottimizzato automaticamente a max 512px WebP)
                    </p>
                    {imageProcessing === "logo" && (
                      <span className="text-xs font-semibold text-emerald-600 animate-pulse">
                        Elaborazione immagine in corso...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Oppure inserisci URL Logo
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    placeholder="https://tuosito.it/logo.png"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  />
                </div>

                {/* Anteprima Live Header */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Anteprima Navbar Sito</span>
                    <span className="text-[10px] text-slate-400 font-normal">Live Preview</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        {form.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={form.logoUrl}
                            alt="Logo"
                            className="h-8 max-w-[140px] object-contain rounded"
                            onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-[10px] text-white">🍴</span>
                            <span className="truncate">{form.nomeRistorante}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 hidden sm:inline">Servizi</span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline">Orari</span>
                        <span
                          style={{ backgroundColor: form.coloreAccento }}
                          className="text-[10px] text-white font-bold px-2.5 py-1 rounded-full shadow-xs"
                        >
                          Prenota
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAVICON */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🌐</span> Favicon & Icona Browser
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Icona visibile nella scheda del browser, nei preferiti e nella barra indirizzi.
                    </p>
                  </div>
                  {form.faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, faviconUrl: "" })}
                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition border border-rose-200"
                    >
                      Rimuovi Favicon
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={faviconInputRef}
                  accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageProcessing("favicon");
                      processImageFile(file, 128, "image/png", (dataUrl) => {
                        setForm((f) => ({ ...f, faviconUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActiveFavicon(true);
                  }}
                  onDragLeave={() => setDragActiveFavicon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActiveFavicon(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setImageProcessing("favicon");
                      processImageFile(file, 128, "image/png", (dataUrl) => {
                        setForm((f) => ({ ...f, faviconUrl: dataUrl }));
                        setImageProcessing(null);
                      });
                    }
                  }}
                  onClick={() => faviconInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragActiveFavicon
                      ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200"
                      : "border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/20"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔖</span>
                    <div className="text-xs text-slate-700 font-medium">
                      <span className="text-emerald-600 font-bold underline">Carica icona</span> o trascina qui
                    </div>
                    <p className="text-[10px] text-slate-400">
                      PNG, ICO o SVG quadrata (ottimizzata automaticamente a 128x128 PNG)
                    </p>
                    {imageProcessing === "favicon" && (
                      <span className="text-xs font-semibold text-emerald-600 animate-pulse">
                        Elaborazione icona in corso...
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Oppure inserisci URL Favicon
                  </label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                    placeholder="https://tuosito.it/favicon.ico o /icon.svg"
                    value={form.faviconUrl}
                    onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                  />
                </div>

                {/* Anteprima Live Scheda Browser */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Anteprima Scheda Browser</span>
                    <span className="text-[10px] text-slate-400 font-normal">Live Preview</span>
                  </div>
                  <div className="rounded-xl border border-slate-300 bg-slate-100 p-2.5 shadow-xs">
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-t-lg border-t border-x border-slate-200 shadow-xs max-w-[260px]">
                      {form.faviconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.faviconUrl}
                          alt="Favicon"
                          className="w-4 h-4 rounded-xs object-contain shrink-0"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                      ) : (
                        <span className="text-xs shrink-0">🍽️</span>
                      )}
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {form.nomeRistorante} — Tavoli & Menù
                      </span>
                      <span className="text-[10px] text-slate-400 hover:text-slate-600 ml-1 shrink-0 cursor-default">
                        ✕
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Layout & Fotografie Menù Digitale QR */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>🍽️</span> Layout & Fotografie Menù Digitale QR
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Novità v1.0.4
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="space-y-1">
                <label 
                  htmlFor="menuShowImagesCheckbox" 
                  className="text-xs font-bold text-slate-900 block cursor-pointer"
                >
                  Mostra fotografie dei piatti nel menù digitale
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Se attivo, i piatti mostrano la fotografia in evidenza sia sul gestionale che per i clienti. Se disattivato, il menù pubblico si reimposta automaticamente su un layout tipografico elegante stile bistrot/carta d&apos;alta ristorazione senza spazi vuoti.
                </p>
              </div>
              <input
                id="menuShowImagesCheckbox"
                type="checkbox"
                checked={form.menuShowImages}
                onChange={(e) => setForm({ ...form, menuShowImages: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer mt-1"
              />
            </div>
          </div>
        </div>
      )}
        </main>
      </div>
    </div>
  );
}
