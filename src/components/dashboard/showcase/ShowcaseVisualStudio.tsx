"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShowcaseConfig,
  DEFAULT_TAVOLY_SHOWCASE_CONFIG,
  DEFAULT_TAVOLY_EXPERIENCES,
  DEFAULT_TAVOLY_CONTACT_INFO,
  GalleryPhotoItem,
  ExperienceIconType,
  ExperienceItem,
} from "@/lib/showcase-defaults";
import {
  Sparkles,
  Smartphone,
  Monitor,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Type,
  Palette,
  Eye,
  Plus,
  Trash2,
  Upload,
  Star,
  ShieldCheck,
  Award,
  Clock,
  MapPin,
  UtensilsCrossed,
  ArrowRight,
  Quote,
  ShoppingBag,
  CalendarCheck,
  Lock,
  Coffee,
  GlassWater,
  Wine,
  Phone,
  Pizza,
  Flame,
  Beer,
  Heart,
  ChefHat,
} from "lucide-react";

type ControlTab = "hero" | "media" | "colori" | "esperienze" | "contatti" | "cucina" | "sezioni" | "badges";

const AVAILABLE_EXPERIENCE_ICONS: { id: ExperienceIconType; label: string; icon: React.ElementType }[] = [
  { id: "coffee", label: "Caffè", icon: Coffee },
  { id: "utensils", label: "Posate", icon: UtensilsCrossed },
  { id: "glass", label: "Cocktail", icon: GlassWater },
  { id: "wine", label: "Calice", icon: Wine },
  { id: "pizza", label: "Pizza", icon: Pizza },
  { id: "flame", label: "Forno / Grill", icon: Flame },
  { id: "sparkles", label: "Stella", icon: Sparkles },
  { id: "beer", label: "Birra", icon: Beer },
  { id: "heart", label: "Cuore", icon: Heart },
  { id: "chef", label: "Chef", icon: ChefHat },
];

function renderExpIcon(icon: ExperienceIconType, className = "w-4 h-4") {
  switch (icon) {
    case "coffee":
      return <Coffee className={className} />;
    case "utensils":
      return <UtensilsCrossed className={className} />;
    case "glass":
      return <GlassWater className={className} />;
    case "wine":
      return <Wine className={className} />;
    case "pizza":
      return <Pizza className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "beer":
      return <Beer className={className} />;
    case "heart":
      return <Heart className={className} />;
    case "chef":
      return <ChefHat className={className} />;
    case "sparkles":
    default:
      return <Sparkles className={className} />;
  }
}

export default function ShowcaseVisualStudio() {
  const [config, setConfig] = useState<ShowcaseConfig>(DEFAULT_TAVOLY_SHOWCASE_CONFIG);
  const [activeControlTab, setActiveControlTab] = useState<ControlTab>("hero");
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageProcessing, setImageProcessing] = useState<string | null>(null);

  // File Inputs Refs
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/impostazioni/vetrina")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig(data);
        }
      })
      .catch((err) => console.error("Errore fetch vetrina Tavoly:", err))
      .finally(() => setLoading(false));
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
    if (file.size > 10 * 1024 * 1024) {
      setFeedback({ type: "error", text: "L'immagine supera i 10MB. Seleziona un file più leggero." });
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
        const dataUrl = canvas.toDataURL(format, format === "image/webp" ? 0.88 : undefined);
        callback(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/impostazioni/vetrina", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setFeedback({ type: "success", text: "Vetrina del ristorante aggiornata con successo!" });
      } else {
        setFeedback({ type: "error", text: "Errore durante il salvataggio della vetrina." });
      }
    } catch {
      setFeedback({ type: "error", text: "Errore di connessione." });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Vuoi ripristinare i testi e la grafica predefinita di Tavoly?")) {
      setConfig({ ...DEFAULT_TAVOLY_SHOWCASE_CONFIG });
      setFeedback({ type: "success", text: "Valori predefiniti ripristinati. Clicca Salva per confermare." });
    }
  };

  const addGalleryImage = (dataUrl: string) => {
    const newImg: GalleryPhotoItem = {
      id: `img_${Date.now()}`,
      url: dataUrl,
      caption: "Nuova foto della sala / piatti",
    };
    setConfig((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: [...prev.gallery.images, newImg],
      },
    }));
  };

  const removeGalleryImage = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: prev.gallery.images.filter((img) => img.id !== id),
      },
    }));
  };

  const updateGalleryCaption = (id: string, caption: string) => {
    setConfig((prev) => ({
      ...prev,
      gallery: {
        ...prev.gallery,
        images: prev.gallery.images.map((img) => (img.id === id ? { ...img, caption } : img)),
      },
    }));
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Caricamento Showcase Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra Azioni & Toolbar Superiore */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-0.5">
            <span>✨ Showcase Visual Studio</span>
            <span>•</span>
            <span>Live Customizer Ristorante</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <span>Editor Vetrina Interattivo</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalizza nome attività, testi di benvenuto, cover d&apos;atmosfera, galleria piatti e sezioni pubbliche.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selettore Device Desktop / Mobile */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                deviceMode === "mobile"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                deviceMode === "desktop"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Default</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Vedi Sito</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salva Vetrina</span>
              </>
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
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
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* STRUTTURA SPLIT-SCREEN */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* PANNELLO SINISTRO: CONTROLLI */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-1.5 shadow-xs">
            {[
              { id: "hero", label: "Insegna & Copy", icon: Type },
              { id: "media", label: "Cover & Foto", icon: ImageIcon },
              { id: "colori", label: "Colori", icon: Palette },
              { id: "esperienze", label: "Esperienze", icon: UtensilsCrossed },
              { id: "contatti", label: "Orari & Info", icon: MapPin },
              { id: "cucina", label: "La Cucina", icon: Quote },
              { id: "sezioni", label: "Sezioni", icon: Eye },
              { id: "badges", label: "Badges", icon: Award },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeControlTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveControlTab(tab.id as ControlTab)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            {/* HERO & COPY */}
            {activeControlTab === "hero" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-emerald-600" />
                    <span>Insegna, Titoli & Testi di Benvenuto</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configura il nome del locale e il claim visualizzato al pubblico.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nome Attività / Insegna Locale
                  </label>
                  <input
                    type="text"
                    value={config.brandName || ""}
                    onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                    placeholder="es. MECO non solo pizza!"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nome visualizzato nella barra superiore del sito, nella scheda del browser e nei promemoria WhatsApp.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Badge Promozionale Top</label>
                  <input
                    type="text"
                    value={config.hero.badgeText}
                    onChange={(e) =>
                      setConfig({ ...config, hero: { ...config.hero, badgeText: e.target.value } })
                    }
                    placeholder="es. MECO"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Titolo Principale (Claim)</label>
                  <textarea
                    rows={2}
                    value={config.hero.title}
                    onChange={(e) =>
                      setConfig({ ...config, hero: { ...config.hero, title: e.target.value } })
                    }
                    placeholder='es. "non solo pizza!"'
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sottotitolo / Descrizione Locale</label>
                  <textarea
                    rows={3}
                    value={config.hero.subtitle}
                    onChange={(e) =>
                      setConfig({ ...config, hero: { ...config.hero, subtitle: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tasto Tavolo (CTA 1)</label>
                    <input
                      type="text"
                      value={config.hero.ctaPrimaryText}
                      onChange={(e) =>
                        setConfig({ ...config, hero: { ...config.hero, ctaPrimaryText: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tasto Asporto (CTA 2)</label>
                    <input
                      type="text"
                      value={config.hero.ctaSecondaryText}
                      onChange={(e) =>
                        setConfig({ ...config, hero: { ...config.hero, ctaSecondaryText: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Card Live Turni (Colonna Destra Hero) */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Card Live Turni & Orari (Schermata Destra)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Card</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardTitle: e.target.value },
                          })
                        }
                        placeholder="Ospitalità & Sala"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sottotitolo Card</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardSubtitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardSubtitle: e.target.value },
                          })
                        }
                        placeholder="Tavoli in tempo reale"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Badge Stato</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardBadge || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardBadge: e.target.value },
                          })
                        }
                        placeholder="Aperto Oggi"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Etichetta Turno 1</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift1Label || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift1Label: e.target.value },
                          })
                        }
                        placeholder="Pranzo"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Orario Turno 1</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift1Hours || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift1Hours: e.target.value },
                          })
                        }
                        placeholder="12:30 - 14:30"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Etichetta Turno 2</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift2Label || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift2Label: e.target.value },
                          })
                        }
                        placeholder="Cena"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Orario Turno 2</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift2Hours || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift2Hours: e.target.value },
                          })
                        }
                        placeholder="19:30 - 23:00"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Nota Sala</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardNoteTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardNoteTitle: e.target.value },
                          })
                        }
                        placeholder="Pranzo di lavoro o Cena Romantica?"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Descrizione Nota Sala</label>
                      <textarea
                        rows={2}
                        value={config.customLabels?.heroCardNoteDesc || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardNoteDesc: e.target.value },
                          })
                        }
                        placeholder="Puoi specificare intolleranze alimentari e preferenze..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Sezione Invito Prenotazione CTA */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sezione Invito Prenotazione Rapida</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Invito</label>
                      <input
                        type="text"
                        value={config.customLabels?.bookingCtaTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, bookingCtaTitle: e.target.value },
                          })
                        }
                        placeholder="Prenota il tuo Tavolo in pochi secondi"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sottotitolo Spiegazione</label>
                      <textarea
                        rows={2}
                        value={config.customLabels?.bookingCtaSubtitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, bookingCtaSubtitle: e.target.value },
                          })
                        }
                        placeholder="Scegli il turno, l'orario e i coperti desiderati..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Testo Pulsante</label>
                      <input
                        type="text"
                        value={config.customLabels?.bookingCtaButton || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, bookingCtaButton: e.target.value },
                          })
                        }
                        placeholder="Apri Form Prenotazione"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MEDIA & FOTO */}
            {activeControlTab === "media" && (
              <div className="space-y-5">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Brand, Logo, Cover &amp; Galleria</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload con compressione client-side WebP e PNG a caricamento istantaneo.
                  </p>
                </div>

                {/* LOGO AZIENDALE */}
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Logo Ufficiale Ristorante</h4>
                      <p className="text-[10px] text-slate-500">Mostrato nella navbar e nella vetrina.</p>
                    </div>
                    {config.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, logoUrl: null })}
                        className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Rimuovi Logo
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageProcessing("logo");
                        processImageFile(file, 512, "image/webp", (dataUrl) => {
                          setConfig((prev) => ({
                            ...prev,
                            logoUrl: dataUrl,
                          }));
                          setImageProcessing(null);
                        });
                      }
                    }}
                  />

                  {config.logoUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center p-1 border border-slate-200 shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={config.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">Logo Personalizzato</div>
                        <p className="text-[10px] text-emerald-600 font-medium">Attivo su vetrina e navbar</p>
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="mt-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Cambia Immagine</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-3 text-center cursor-pointer bg-white hover:bg-slate-50 transition"
                    >
                      <Upload className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <div className="text-xs text-slate-800 font-semibold">Carica Logo del Locale</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">PNG o WebP con sfondo trasparente (max 512px)</p>
                    </button>
                  )}

                  {imageProcessing === "logo" && (
                    <div className="text-xs text-emerald-600 animate-pulse text-center">
                      Ottimizzazione logo in corso...
                    </div>
                  )}
                </div>

                {/* FAVICON & ICONA PWA */}
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Favicon &amp; Icona App (PWA)</h4>
                      <p className="text-[10px] text-slate-500">Icona per la scheda browser e per l&apos;installazione su smartphone.</p>
                    </div>
                    {config.faviconUrl && (
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, faviconUrl: null })}
                        className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Rimuovi Favicon
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={faviconInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageProcessing("favicon");
                        processImageFile(file, 128, "image/png", (dataUrl) => {
                          setConfig((prev) => ({
                            ...prev,
                            faviconUrl: dataUrl,
                          }));
                          setImageProcessing(null);
                        });
                      }
                    }}
                  />

                  {config.faviconUrl ? (
                    <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center p-1 border border-slate-200 shrink-0 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={config.faviconUrl} alt="Favicon" className="max-w-full max-h-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">Icona Browser &amp; PWA</div>
                        <p className="text-[10px] text-emerald-600 font-medium">Formato 128x128 PNG HD</p>
                        <button
                          type="button"
                          onClick={() => faviconInputRef.current?.click()}
                          className="mt-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Cambia Favicon</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-3 text-center cursor-pointer bg-white hover:bg-slate-50 transition"
                    >
                      <Upload className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <div className="text-xs text-slate-800 font-semibold">Carica Favicon / Icona App</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Quadrata, PNG o ICO (128x128 px)</p>
                    </button>
                  )}

                  {imageProcessing === "favicon" && (
                    <div className="text-xs text-emerald-600 animate-pulse text-center">
                      Ottimizzazione favicon in corso...
                    </div>
                  )}
                </div>

                {/* COVER HERO */}
                <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Foto Copertina Hero</h4>
                      <p className="text-[10px] text-slate-500">Banner panoramico d&apos;atmosfera.</p>
                    </div>
                    {config.hero.coverImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfig({ ...config, hero: { ...config.hero, coverImageUrl: null } })
                        }
                        className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                      >
                        Rimuovi Cover
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={coverInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageProcessing("cover");
                        processImageFile(file, 1920, "image/webp", (dataUrl) => {
                          setConfig((prev) => ({
                            ...prev,
                            hero: { ...prev.hero, coverImageUrl: dataUrl },
                          }));
                          setImageProcessing(null);
                        });
                      }
                    }}
                  />

                  {config.hero.coverImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden h-28 border border-slate-300 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={config.hero.coverImageUrl} alt="Hero Cover" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/60 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Cambia Copertina</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-4 text-center cursor-pointer bg-white hover:bg-slate-50 transition"
                    >
                      <Upload className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                      <div className="text-xs text-slate-800 font-semibold">Carica Foto Copertina Ristorante</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG o WebP (max 1920px)</p>
                    </button>
                  )}

                  {imageProcessing === "cover" && (
                    <div className="text-xs text-emerald-600 animate-pulse text-center">
                      Ottimizzazione cover in corso...
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                      <span>Opacità Scurimento Copertina</span>
                      <span className="text-emerald-700 font-mono font-bold">{config.hero.overlayOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="90"
                      value={config.hero.overlayOpacity}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, overlayOpacity: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* GALLERIA PIATTI & SALA */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Galleria Foto Sala & Piatti</span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                          {config.gallery.images.length} foto
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500">Mise en place, cantina vini e piatti speciali.</p>
                    </div>

                    <input
                      type="file"
                      ref={galleryInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageProcessing("gallery");
                          processImageFile(file, 800, "image/webp", (dataUrl) => {
                            addGalleryImage(dataUrl);
                            setImageProcessing(null);
                          });
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Aggiungi Foto</span>
                    </button>
                  </div>

                  {imageProcessing === "gallery" && (
                    <div className="text-xs text-emerald-600 animate-pulse text-center">
                      Ottimizzazione foto galleria...
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {config.gallery.images.map((img) => (
                      <div
                        key={img.id}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Foto" className="w-12 h-12 object-cover rounded-lg shrink-0" />
                        <input
                          type="text"
                          value={img.caption || ""}
                          placeholder="Didascalia piatto o ambiente..."
                          onChange={(e) => updateGalleryCaption(img.id, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(img.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COLORI & BRAND */}
            {activeControlTab === "colori" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    <span>Palette & Colori Ristorante</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tonalità primarie per pulsanti, header e dettagli.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Colore Primario</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                        className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-xs text-slate-700 font-bold">{config.primaryColor}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Colore Accento (Tasti & Badge)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                        className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0"
                      />
                      <span className="font-mono text-xs text-emerald-700 font-bold">{config.accentColor}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Palette Consigliate per Ristorazione
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { name: "Verde Smeraldo", primary: "#064e3b", accent: "#059669" },
                      { name: "Borgogna & Vino", primary: "#450a0a", accent: "#dc2626" },
                      { name: "Ardesia & Oro", primary: "#0f172a", accent: "#d97706" },
                      { name: "Blu Marinaro", primary: "#0c4a6e", accent: "#0284c7" },
                      { name: "Terra & Terracotta", primary: "#431407", accent: "#ea580c" },
                      { name: "Ambra Caldo", primary: "#1c1917", accent: "#f59e0b" },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() =>
                          setConfig({
                            ...config,
                            primaryColor: p.primary,
                            accentColor: p.accent,
                          })
                        }
                        className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition flex items-center gap-2 cursor-pointer"
                      >
                        <div className="flex items-center -space-x-1 shrink-0">
                          <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: p.primary }} />
                          <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: p.accent }} />
                        </div>
                        <span className="text-[11px] text-slate-700 font-medium truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LA CUCINA & FILOSOFIA */}
            {activeControlTab === "cucina" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Quote className="w-4 h-4 text-emerald-600" />
                    <span>La Nostra Cucina & Filosofia</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Descrivi l&apos;amore per le materie prime e la tradizione culinaria.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Titolo Sezione</label>
                  <input
                    type="text"
                    value={config.about.title}
                    onChange={(e) =>
                      setConfig({ ...config, about: { ...config.about, title: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Sottotitolo / Filosofia</label>
                  <input
                    type="text"
                    value={config.about.subtitle}
                    onChange={(e) =>
                      setConfig({ ...config, about: { ...config.about, subtitle: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Descrizione Piatti & Locale</label>
                  <textarea
                    rows={4}
                    value={config.about.description}
                    onChange={(e) =>
                      setConfig({ ...config, about: { ...config.about, description: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Citazione Chef o Titolare</label>
                    <input
                      type="text"
                      value={config.about.quoteText || ""}
                      onChange={(e) =>
                        setConfig({ ...config, about: { ...config.about, quoteText: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Autore Citazione</label>
                    <input
                      type="text"
                      value={config.about.quoteAuthor || ""}
                      onChange={(e) =>
                        setConfig({ ...config, about: { ...config.about, quoteAuthor: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Card Live Turni (Colonna Destra Hero) */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Card Live Turni & Orari (Schermata Destra)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Card</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardTitle: e.target.value },
                          })
                        }
                        placeholder="Ospitalità & Sala"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sottotitolo Card</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardSubtitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardSubtitle: e.target.value },
                          })
                        }
                        placeholder="Tavoli in tempo reale"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Badge Stato</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardBadge || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardBadge: e.target.value },
                          })
                        }
                        placeholder="Aperto Oggi"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Etichetta Turno 1</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift1Label || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift1Label: e.target.value },
                          })
                        }
                        placeholder="Pranzo"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Orario Turno 1</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift1Hours || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift1Hours: e.target.value },
                          })
                        }
                        placeholder="12:30 - 14:30"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Etichetta Turno 2</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift2Label || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift2Label: e.target.value },
                          })
                        }
                        placeholder="Cena"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Orario Turno 2</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroShift2Hours || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroShift2Hours: e.target.value },
                          })
                        }
                        placeholder="19:30 - 23:00"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Nota Sala</label>
                      <input
                        type="text"
                        value={config.customLabels?.heroCardNoteTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardNoteTitle: e.target.value },
                          })
                        }
                        placeholder="Pranzo di lavoro o Cena Romantica?"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Descrizione Nota Sala</label>
                      <textarea
                        rows={2}
                        value={config.customLabels?.heroCardNoteDesc || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, heroCardNoteDesc: e.target.value },
                          })
                        }
                        placeholder="Puoi specificare intolleranze alimentari e preferenze..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Sezione Invito Prenotazione CTA */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sezione Invito Prenotazione Rapida</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Invito</label>
                      <input
                        type="text"
                        value={config.customLabels?.bookingCtaTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, bookingCtaTitle: e.target.value },
                          })
                        }
                        placeholder="Prenota il tuo Tavolo in pochi secondi"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Sottotitolo Spiegazione</label>
                      <textarea
                        rows={2}
                        value={config.customLabels?.bookingCtaSubtitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, bookingCtaSubtitle: e.target.value },
                          })
                        }
                        placeholder="Scegli il turno, l'orario e i coperti desiderati..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Testo Pulsante</label>
                      <input
                        type="text"
                        value={config.customLabels?.bookingCtaButton || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, bookingCtaButton: e.target.value },
                          })
                        }
                        placeholder="Apri Form Prenotazione"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ESPERIENZE & MOMENTI DELLA GIORNATA */}
            {activeControlTab === "esperienze" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                      <span>Esperienze & Momenti della Giornata</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Personalizza i momenti di ristorazione (colazioni, pranzi, aperitivi, cene) mostrati nella vetrina.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `exp_${Date.now()}`;
                      const updated = [
                        ...(config.experiences || DEFAULT_TAVOLY_EXPERIENCES),
                        {
                          id: newId,
                          icon: "utensils" as ExperienceIconType,
                          title: "Nuova Esperienza",
                          description: "Descrizione dell'esperienza culinaria...",
                        },
                      ];
                      setConfig({ ...config, experiences: updated });
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Titolo Principale Sezione
                    </label>
                    <input
                      type="text"
                      value={config.customLabels?.servicesTitle || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          customLabels: { ...config.customLabels, servicesTitle: e.target.value },
                        })
                      }
                      placeholder="I Nostri Spazi & Esperienze"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sottotitolo Descrittivo Sezione
                    </label>
                    <textarea
                      rows={2}
                      value={config.customLabels?.servicesSubtitle || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          customLabels: { ...config.customLabels, servicesSubtitle: e.target.value },
                        })
                      }
                      placeholder="Dalla sala interna riservata al dehors estivo..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Schede Esperienze ({((config.experiences || DEFAULT_TAVOLY_EXPERIENCES)).length})
                  </h4>
                  {(config.experiences || DEFAULT_TAVOLY_EXPERIENCES).map((exp, idx) => (
                    <div key={exp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          Momento #{idx + 1}
                        </span>
                        {(config.experiences || DEFAULT_TAVOLY_EXPERIENCES).length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (config.experiences || DEFAULT_TAVOLY_EXPERIENCES).filter(
                                (item) => item.id !== exp.id
                              );
                              setConfig({ ...config, experiences: updated });
                            }}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                            title="Elimina Momento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Icona</label>
                        <div className="flex flex-wrap gap-1.5">
                          {AVAILABLE_EXPERIENCE_ICONS.map((ic) => {
                            const isSelected = exp.icon === ic.id;
                            const IconC = ic.icon;
                            return (
                              <button
                                key={ic.id}
                                type="button"
                                onClick={() => {
                                  const updated = (config.experiences || DEFAULT_TAVOLY_EXPERIENCES).map((item) =>
                                    item.id === exp.id ? { ...item, icon: ic.id } : item
                                  );
                                  setConfig({ ...config, experiences: updated });
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <IconC className="w-3 h-3" />
                                <span>{ic.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Momento</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const updated = (config.experiences || DEFAULT_TAVOLY_EXPERIENCES).map((item) =>
                              item.id === exp.id ? { ...item, title: e.target.value } : item
                            );
                            setConfig({ ...config, experiences: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                          placeholder="es. Pranzo di Lavoro"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Descrizione</label>
                        <textarea
                          rows={2}
                          value={exp.description}
                          onChange={(e) => {
                            const updated = (config.experiences || DEFAULT_TAVOLY_EXPERIENCES).map((item) =>
                              item.id === exp.id ? { ...item, description: e.target.value } : item
                            );
                            setConfig({ ...config, experiences: updated });
                          }}
                          className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                          placeholder="es. Business lunch veloci con materie prime del territorio..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CONTATTI, ORARI & LOCATION */}
            {activeControlTab === "contatti" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Orari di Servizio, Posizione & Recapiti</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Modifica tutti i dati di contatto, orari e indirizzo visibili nella vetrina pubblica.
                  </p>
                </div>

                {/* Intestazioni Sezioni */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Intestazioni delle Schede
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Box Orari</label>
                      <input
                        type="text"
                        value={config.customLabels?.hoursTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, hoursTitle: e.target.value },
                          })
                        }
                        placeholder="Turni di Servizio & Orari"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Box Posizione</label>
                      <input
                        type="text"
                        value={config.customLabels?.locationTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, locationTitle: e.target.value },
                          })
                        }
                        placeholder="Posizione & Location"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Titolo Box Contatti</label>
                      <input
                        type="text"
                        value={config.customLabels?.contactTitle || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            customLabels: { ...config.customLabels, contactTitle: e.target.value },
                          })
                        }
                        placeholder="Dove Trovarci & Prenotazioni"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Orari di Servizio */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Orari di Apertura</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Orari Feriali (Lun - Ven)</label>
                      <input
                        type="text"
                        value={config.contactInfo?.hoursWeekday || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), hoursWeekday: e.target.value },
                          })
                        }
                        placeholder="Lunedì - Venerdì: 07:30 - 23:30"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Orari Weekend (Sab - Dom)</label>
                      <input
                        type="text"
                        value={config.contactInfo?.hoursWeekend || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), hoursWeekend: e.target.value },
                          })
                        }
                        placeholder="Sabato e Domenica: 08:30 - 00:30"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Nota Cucina / Chiusura</label>
                      <input
                        type="text"
                        value={config.contactInfo?.hoursNote || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), hoursNote: e.target.value },
                          })
                        }
                        placeholder="Cucina aperta per pranzo (12:30-14:30) e cena (19:30-22:30)"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Posizione & Indirizzo */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Posizione & Location</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Indirizzo Completo</label>
                      <input
                        type="text"
                        value={config.contactInfo?.address || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), address: e.target.value },
                          })
                        }
                        placeholder="Via Dante Alighieri, 74/R, 52010 Capolona (AR)"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Note Parcheggio & Accessibilità</label>
                      <input
                        type="text"
                        value={config.contactInfo?.addressNote || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), addressNote: e.target.value },
                          })
                        }
                        placeholder="Parcheggio convenzionato a 50 metri. Accesso disabili..."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Recapiti Diretti */}
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recapiti & Assistenza</span>
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Telefono / WhatsApp</label>
                      <input
                        type="text"
                        value={config.contactInfo?.phone || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), phone: e.target.value },
                          })
                        }
                        placeholder="+39 0575 969736"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Email di Contatto</label>
                      <input
                        type="email"
                        value={config.contactInfo?.email || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), email: e.target.value },
                          })
                        }
                        placeholder="info@meco.taaaac.eu"
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Nota Tempi di Risposta</label>
                      <input
                        type="text"
                        value={config.contactInfo?.responseNote !== undefined ? config.contactInfo.responseNote : ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            contactInfo: { ...(config.contactInfo || DEFAULT_TAVOLY_CONTACT_INFO), responseNote: e.target.value },
                          })
                        }
                        placeholder="Rispondiamo rapidamente durante gli orari di servizio."
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEZIONI ON/OFF */}
            {activeControlTab === "sezioni" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-600" />
                    <span>Visibilità Sezioni Vetrina Ristorante</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Attiva o disattiva le singole sezioni della pagina pubblica.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { key: "showHero", label: "Schermata Hero di Benvenuto", desc: "Copertina, claim e pulsanti principali" },
                    { key: "showMenuLink", label: "Link Menù Digitale nella Vetrina", desc: "Mostra il pulsante Menù Digitale nella navbar e nella schermata di benvenuto" },
                    { key: "showTrustBadges", label: "Badges di Affidabilità", desc: "Conferma istantanea, WhatsApp, zero attesa" },
                    { key: "showTakeawayCta", label: "Pulsante Ordina da Asporto", desc: "Mostra il tasto takeaway nella vetrina" },
                    { key: "showGallery", label: "Galleria Foto Sala & Cucina", desc: "Griglia immagini atmosfera e mise en place" },
                    { key: "showServices", label: "Sezione Esperienze & Momenti", desc: "Colazioni, pranzi veloci, aperitivi e cene" },
                    { key: "showAbout", label: "Filosofia & La Nostra Cucina", desc: "Descrizione passione artigianale e citazione" },
                    { key: "showHours", label: "Orari di Apertura & Dove Siamo", desc: "Dettaglio turni, mappa e recapiti" },
                  ].map((s) => (
                    <label
                      key={s.key}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{s.label}</div>
                        <div className="text-[10px] text-slate-500">{s.desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(config.sections[s.key as keyof typeof config.sections])}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sections: {
                              ...config.sections,
                              [s.key]: e.target.checked,
                            },
                            ...(s.key === "showAbout"
                              ? { about: { ...config.about, enabled: e.target.checked } }
                              : {}),
                          })
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* TRUST BADGES */}
            {activeControlTab === "badges" && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Badges di Garanzia & Affidabilità</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Rassicurano il cliente con punti di forza (es. Zero Attesa, Notifiche WhatsApp).
                  </p>
                </div>

                <div className="space-y-2">
                  {config.trustBadges.map((badge, idx) => (
                    <div key={badge.id} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                      <input
                        type="text"
                        value={badge.text}
                        onChange={(e) => {
                          const updated = config.trustBadges.map((b) =>
                            b.id === badge.id ? { ...b, text: e.target.value } : b
                          );
                          setConfig({ ...config, trustBadges: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PANNELLO DESTRO: LIVE SIMULATOR SPECCHIATO AL 100% */}
        <div className="xl:col-span-7 space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>📱 Simulatore Live WYSIWYG Fedele</span>
              <span className="text-emerald-700 text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                In Tempo Reale
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              {deviceMode === "mobile" ? "Formato Smartphone (390px)" : "Formato Schermo Intero Desktop"}
            </span>
          </div>

          <div
            className={`mx-auto transition-all duration-300 ${
              deviceMode === "mobile"
                ? "max-w-[400px] rounded-[44px] p-3 bg-slate-900 border-[6px] border-slate-800 shadow-2xl ring-1 ring-slate-700"
                : "w-full rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden"
            }`}
          >
            {deviceMode === "mobile" && (
              <div className="h-6 flex items-center justify-between px-6 mb-1 text-[10px] text-slate-400 select-none">
                <span className="font-bold text-white">12:30</span>
                <div className="w-20 h-4 bg-slate-950 rounded-full border border-slate-800 mx-auto" />
                <span className="font-mono">5G 100%</span>
              </div>
            )}

            <div
              className={`bg-slate-50 text-slate-800 overflow-y-auto no-scrollbar rounded-[32px] font-sans ${
                deviceMode === "mobile" ? "max-h-[720px] min-h-[580px]" : "max-h-[780px] min-h-[580px]"
              }`}
            >
              {/* Navbar Fedele a ShowcaseNavbar */}
              <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {config.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={config.logoUrl} alt="Logo" className="h-7 sm:h-8 max-w-[120px] object-contain rounded-lg shrink-0" />
                  ) : (
                    <div
                      style={{ backgroundColor: config.primaryColor }}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight truncate block leading-tight">
                        {config.brandName || "Tavoly"}
                      </span>
                      <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 shrink-0">
                        Ristorante &amp; Bar
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium truncate hidden sm:block">
                      Sale, Tavoli &amp; Cucina d&apos;Autore
                    </p>
                  </div>
                </div>

                {deviceMode === "desktop" && (
                  <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="hover:text-emerald-700 cursor-pointer">I Nostri Servizi</span>
                    <span className="hover:text-emerald-700 cursor-pointer">Prenota un Tavolo</span>
                    <span className="hover:text-emerald-700 cursor-pointer">Orari &amp; Contatti</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 shrink-0">
                  {config.sections.showMenuLink !== false && (
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-xl inline-flex items-center gap-1 cursor-default whitespace-nowrap">
                      <UtensilsCrossed className="w-3 h-3 text-emerald-600" />
                      <span>Menù Digitale</span>
                    </span>
                  )}
                  {config.sections.showTakeawayCta && (
                    <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl inline-flex items-center gap-1 cursor-default whitespace-nowrap">
                      <span>🥡 Ordina Asporto</span>
                    </span>
                  )}
                  <span
                    style={{ backgroundColor: config.primaryColor }}
                    className="text-[10px] sm:text-xs font-bold text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1 cursor-default whitespace-nowrap"
                  >
                    <CalendarCheck className="w-3 h-3" />
                    <span>Prenota Ora</span>
                  </span>
                  <span className="p-1 text-slate-400 rounded-lg">
                    <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                </div>
              </nav>

              {/* HERO SECTION SPECCHIATA (Responsive Mobile / Desktop a 2 Colonne) */}
              {config.sections.showHero && (
                <section className="relative overflow-hidden py-10 sm:py-16 px-4 border-b border-slate-200/80">
                  {config.hero.coverImageUrl ? (
                    <div className="absolute inset-0 z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={config.hero.coverImageUrl} alt="Hero Cover" className="w-full h-full object-cover object-center" />
                      <div
                        className="absolute inset-0 bg-slate-950"
                        style={{ opacity: config.hero.overlayOpacity / 100 }}
                      />
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0 z-0"
                      style={{
                        background: `linear-gradient(180deg, #ffffff 0%, ${config.primaryColor}15 100%)`,
                      }}
                    />
                  )}

                  <div className="relative z-10 max-w-5xl mx-auto">
                    <div className={deviceMode === "desktop" ? "grid grid-cols-12 gap-8 items-center" : "space-y-4 text-center"}>
                      {/* Colonna Sinistra / Contenuti Principali */}
                      <div className={deviceMode === "desktop" ? "col-span-7 space-y-4 text-left" : "space-y-3"}>
                        {config.hero.badgeText && (
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              config.hero.coverImageUrl
                                ? "bg-white/10 text-emerald-300 border-white/20"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>{config.hero.badgeText}</span>
                          </div>
                        )}

                        <h1
                          className={`text-xl sm:text-3xl font-black leading-tight tracking-tight ${
                            config.hero.coverImageUrl ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {config.hero.title}
                        </h1>

                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${
                            config.hero.coverImageUrl ? "text-slate-200" : "text-slate-600"
                          }`}
                        >
                          {config.hero.subtitle}
                        </p>

                        <div className={`pt-1 flex flex-wrap items-center gap-2 ${deviceMode === "desktop" ? "justify-start" : "justify-center"}`}>
                          <span
                            style={{ backgroundColor: config.primaryColor }}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-md inline-flex items-center gap-1.5 cursor-default"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>{config.hero.ctaPrimaryText || "Prenota il tuo Tavolo"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>

                          {config.sections.showTakeawayCta && config.hero.ctaSecondaryText && (
                            <span className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 inline-flex items-center gap-1.5 cursor-default">
                              <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                              <span>{config.hero.ctaSecondaryText || "Ordina da Asporto"}</span>
                            </span>
                          )}

                          <span
                            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border cursor-default inline-flex items-center ${
                              config.hero.coverImageUrl
                                ? "bg-slate-900/80 text-white border-slate-700"
                                : "bg-white text-slate-800 border-slate-200"
                            }`}
                          >
                            I Nostri Servizi
                          </span>
                        </div>

                        {/* Badges di Affidabilità */}
                        {config.sections.showTrustBadges && config.trustBadges?.length > 0 && (
                          <div
                            className={`pt-3 flex flex-wrap items-center gap-2 border-t ${
                              deviceMode === "desktop" ? "justify-start border-white/10" : "justify-center border-white/10"
                            }`}
                          >
                            {config.trustBadges.map((tb) => (
                              <span
                                key={tb.id}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold ${
                                  config.hero.coverImageUrl
                                    ? "bg-slate-900/60 border border-slate-800 text-slate-200"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span>{tb.text}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Colonna Destra / Card Turni LIVE Ristorante (speculare al sito reale) */}
                      <div className={deviceMode === "desktop" ? "col-span-5" : "pt-2"}>
                        <div className="taaaac-card p-4 sm:p-5 bg-white/95 backdrop-blur-md shadow-2xl border border-white/40 rounded-3xl space-y-3.5 text-left">
                          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-black text-[10px]"
                                style={{ backgroundColor: config.primaryColor }}
                              >
                                LIVE
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 leading-tight">Ospitalità &amp; Sala</h4>
                                <p className="text-[10px] text-slate-500">Tavoli in tempo reale</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aperto Oggi
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Pranzo</span>
                              <strong className="text-xs sm:text-sm font-black text-slate-900">12:30 - 14:30</strong>
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase block">Cena</span>
                              <strong className="text-xs sm:text-sm font-black text-slate-900">19:30 - 23:00</strong>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[10px] text-emerald-950 space-y-0.5">
                            <p className="font-bold flex items-center gap-1 text-emerald-900">
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              Pranzo di lavoro o Cena Romantica?
                            </p>
                            <p className="text-emerald-800 leading-relaxed text-[9px]">
                              Specifica intolleranze alimentari e preferenze di sala direttamente alla prenotazione.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* GALLERIA SALA & PIATTI SPECCHIATA */}
              {config.sections.showGallery && config.gallery.images.length > 0 && (
                <section className="p-5 sm:p-8 space-y-4 bg-white border-b border-slate-200">
                  <div className="text-center space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">{config.gallery.title}</h3>
                    <p className="text-[11px] text-slate-500">{config.gallery.subtitle}</p>
                  </div>
                  <div className={`grid gap-2.5 ${deviceMode === "desktop" ? "grid-cols-4" : "grid-cols-2"}`}>
                    {config.gallery.images.slice(0, 4).map((img) => (
                      <div key={img.id} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-4/3 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.caption || "Sala"} className="w-full h-full object-cover" />
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white text-[10px] font-medium truncate">
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* SEZIONE ESPERIENZE & MOMENTI DELLA GIORNATA (Presente sul sito reale) */}
              {config.sections.showServices && (
                <section className="p-5 sm:p-8 space-y-5 bg-slate-50 border-b border-slate-200">
                  <div className="text-center space-y-1 max-w-md mx-auto">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: config.accentColor }}
                    >
                      Esperienze
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {config.customLabels.servicesTitle || "I Nostri Momenti della Giornata"}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {config.customLabels.servicesSubtitle || "Dalla colazione all'aperitivo, fino alla cena con gli amici."}
                    </p>
                  </div>

                  <div className={`grid gap-3 ${deviceMode === "desktop" ? "grid-cols-4" : "grid-cols-2"}`}>
                    {((config.experiences && config.experiences.length > 0) ? config.experiences : DEFAULT_TAVOLY_EXPERIENCES).map((exp) => (
                      <div key={exp.id} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${config.accentColor || "#059669"}18`,
                            color: config.accentColor || "#059669",
                          }}
                        >
                          {renderExpIcon(exp.icon, "w-4 h-4")}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{exp.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* LA CUCINA & FILOSOFIA (Stile Dark elegante coerente con page.tsx) */}
              {config.sections.showAbout && (
                <section className="p-6 sm:p-10 text-center space-y-3 bg-slate-900 text-white border-b border-slate-800">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: config.accentColor }}
                  >
                    {config.about.subtitle}
                  </span>
                  <h3 className="text-sm sm:text-lg font-black text-white">{config.about.title}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                    {config.about.description}
                  </p>
                  {config.about.quoteText && (
                    <blockquote className="pt-3 border-t border-slate-800 italic text-[10px] text-slate-300 space-y-1 max-w-sm mx-auto">
                      <p>&ldquo;{config.about.quoteText}&rdquo;</p>
                      {config.about.quoteAuthor && (
                        <footer
                          className="font-bold not-italic text-[10px]"
                          style={{ color: config.accentColor }}
                        >
                          — {config.about.quoteAuthor}
                        </footer>
                      )}
                    </blockquote>
                  )}
                </section>
              )}

              {/* CALLOUT PRENOTAZIONE RAPIDA */}
              <section className="p-6 bg-slate-100 text-center space-y-3 border-b border-slate-200">
                <div
                  style={{ backgroundColor: `${config.primaryColor}20` }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto shadow-xs"
                >
                  <CalendarCheck className="w-5 h-5" style={{ color: config.primaryColor }} />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">Prenota il tuo Tavolo in Tempo Reale</h4>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                  Scegli turno, orario e numero ospiti con conferma istantanea via WhatsApp.
                </p>
                <div className="pt-1">
                  <span
                    style={{ backgroundColor: config.primaryColor }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs inline-flex items-center gap-1.5 cursor-default"
                  >
                    <span>Inizia Prenotazione</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </section>

              {/* ORARI & DOVE SIAMO FOOTER */}
              {config.sections.showHours && (
                <footer className="p-4 bg-white text-center space-y-2 text-[10px] text-slate-500">
                  <div className="flex items-center justify-center gap-1 text-slate-700 font-semibold">
                    <MapPin className="w-3 h-3 text-emerald-700" />
                    <span>{config.contactInfo?.address || "Piazza Grande, 12 - Arezzo (AR)"} • Tel. {config.contactInfo?.phone || "+39 0575 654321"}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-700" />
                    <span>{config.contactInfo?.hoursWeekday || "Lun - Ven: 07:30 - 23:30"} • {config.contactInfo?.hoursWeekend || "Sab - Dom: 08:30 - 00:30"}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                    Powered by Taaaac Suite • Tavoly Hospitality
                  </p>
                </footer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
