"use client";

import React, { useState, useMemo } from "react";
import {
  UtensilsCrossed,
  Search,
  X,
  Filter,
  AlertCircle,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Phone,
} from "lucide-react";
import { MenuItemData } from "@/components/dashboard/MenuItemModal";
import { EU_ALLERGENS, ALLERGEN_ICONS } from "@/lib/allergens";

interface PublicMenuViewProps {
  menuItems: MenuItemData[];
  showImages: boolean;
  restaurantName: string;
  tagline?: string;
  logoUrl?: string;
  tableNumber?: string | null;
}

export function PublicMenuView({
  menuItems,
  showImages,
  restaurantName,
  tagline = "Cucina Tradizionale & Ricerca",
  logoUrl,
  tableNumber,
}: PublicMenuViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [excludedAllergens, setExcludedAllergens] = useState<string[]>([]);
  const [isAllergenFilterOpen, setIsAllergenFilterOpen] = useState(false);

  // Categorie univoche ordinate
  const categories = useMemo(() => {
    return Array.from(new Set(menuItems.map((m) => m.category)));
  }, [menuItems]);

  // Toggle esclusione allergene
  const toggleExcludeAllergen = (alg: string) => {
    setExcludedAllergens((prev) =>
      prev.includes(alg) ? prev.filter((a) => a !== alg) : [...prev, alg]
    );
  };

  // Filtraggio piatti
  const filteredDishes = useMemo(() => {
    return menuItems.filter((dish) => {
      // Filtro per categoria
      if (selectedCategory !== "ALL" && dish.category !== selectedCategory) {
        return false;
      }

      // Filtro per ricerca testuale
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description
          ? dish.description.toLowerCase().includes(q)
          : false;
        const matchCat = dish.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }

      // Filtro esclusione allergeni
      if (excludedAllergens.length > 0) {
        try {
          const dishAllergens: string[] = JSON.parse(dish.allergens || "[]");
          const hasExcluded = excludedAllergens.some((ex) =>
            dishAllergens.includes(ex)
          );
          if (hasExcluded) return false;
        } catch {
          // opzionale
        }
      }

      return true;
    });
  }, [menuItems, selectedCategory, searchQuery, excludedAllergens]);

  // Raggruppa i piatti per categoria
  const groupedDishes = useMemo(() => {
    const groups: Record<string, MenuItemData[]> = {};
    filteredDishes.forEach((dish) => {
      if (!groups[dish.category]) groups[dish.category] = [];
      groups[dish.category].push(dish);
    });
    return groups;
  }, [filteredDishes]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-emerald-500 selection:text-white pb-20">
      {/* HEADER PUBBLICO CON BRAND DEL RISTORANTE */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-3xl mx-auto px-4 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={restaurantName}
                  className="w-12 h-12 object-contain rounded-2xl border border-slate-100 shadow-xs"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-xs">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              )}
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {restaurantName}
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Indicazione Tavolo Cliente */}
            {tableNumber ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl shrink-0 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider">
                  Tavolo {tableNumber}
                </span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                <span>Menù Digitale</span>
              </div>
            )}
          </div>
        </div>

        {/* STICKY NAV DELLE CATEGORIE (SCROLL ORIZZONTALE) */}
        <div className="border-t border-slate-100 bg-white/95 backdrop-blur-xs">
          <div className="max-w-3xl mx-auto px-4 py-2 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutto il Menù
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* SEZIONE FILTRI & RICERCA IN CIMA */}
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center gap-2">
          {/* Barra di Ricerca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca piatti o ingredienti (es. tartufo, polpo, salmone)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle Filtro Allergeni */}
          <button
            type="button"
            onClick={() => setIsAllergenFilterOpen(!isAllergenFilterOpen)}
            className={`px-3 py-2 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              excludedAllergens.length > 0
                ? "bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/20"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
            title="Filtra ed escludi allergeni specifici"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Allergeni</span>
            {excludedAllergens.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center">
                {excludedAllergens.length}
              </span>
            )}
          </button>
        </div>

        {/* Pannello Espandibile Esclusione Allergeni */}
        {isAllergenFilterOpen && (
          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Seleziona gli allergeni da escludere:</span>
              </span>
              {excludedAllergens.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExcludedAllergens([])}
                  className="text-[11px] font-bold text-amber-800 hover:underline"
                >
                  Reimposta
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {EU_ALLERGENS.map((alg) => {
                const isExcluded = excludedAllergens.includes(alg);
                return (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => toggleExcludeAllergen(alg)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                      isExcluded
                        ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{ALLERGEN_ICONS[alg] || "⚠️"}</span>
                    <span>{alg}</span>
                    {isExcluded && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CORPO DEL MENU: LISTA PORTATE PER CATEGORIA */}
      <main className="max-w-3xl mx-auto px-4 pt-2 space-y-8">
        {Object.keys(groupedDishes).length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">
              Nessun piatto trovato
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Prova a rimuovere i filtri o la ricerca per visualizzare le altre portate disponibili.
            </p>
          </div>
        ) : (
          Object.entries(groupedDishes).map(([catName, dishes]) => (
            <section key={catName} className="space-y-3.5">
              {/* Titolo Sezione Categoria */}
              <div className="flex items-center gap-2 pb-1 border-b-2 border-slate-900">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  {catName}
                </h2>
                <span className="text-[11px] font-bold text-slate-400 font-mono">
                  ({dishes.length})
                </span>
              </div>

              {/* LISTA DEI PIATTI: LAYOUT GRAFICO VS LAYOUT TIPOGRAFICO ELEGANTE */}
              {showImages ? (
                /* LAYOUT MODERNO CON FOTOGRAFIA */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {dishes.map((dish) => {
                    let allergensList: string[] = [];
                    try {
                      allergensList = JSON.parse(dish.allergens || "[]");
                    } catch {
                      allergensList = [];
                    }

                    return (
                      <div
                        key={dish.id}
                        className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                          dish.isAvailable
                            ? "border-slate-200/90 hover:shadow-md"
                            : "border-slate-200/50 bg-slate-50/60 opacity-60"
                        }`}
                      >
                        {/* Immagine */}
                        {dish.imageUrl ? (
                          <div className="h-40 bg-slate-100 overflow-hidden relative">
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            {!dish.isAvailable && (
                              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center">
                                <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black uppercase">
                                  Esaurito
                                </span>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Dettagli Piatto */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm text-slate-900 leading-snug">
                                {dish.name}
                              </h3>
                              <span className="font-mono font-black text-sm text-slate-900 shrink-0">
                                {dish.price.toFixed(2)} €
                              </span>
                            </div>

                            {dish.description && (
                              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {dish.description}
                              </p>
                            )}
                          </div>

                          {/* Allergeni */}
                          {allergensList.length > 0 && (
                            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1">
                              {allergensList.map((alg) => (
                                <span
                                  key={alg}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200/60 flex items-center gap-0.5"
                                  title={`Allergene: ${alg}`}
                                >
                                  <span>{ALLERGEN_ICONS[alg] || "⚠️"}</span>
                                  <span>{alg}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LAYOUT BISTROT / TIPOGRAFICO ELEGANTE (SENZA FOTO) */
                <div className="bg-white rounded-3xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs overflow-hidden">
                  {dishes.map((dish) => {
                    let allergensList: string[] = [];
                    try {
                      allergensList = JSON.parse(dish.allergens || "[]");
                    } catch {
                      allergensList = [];
                    }

                    return (
                      <div
                        key={dish.id}
                        className={`p-4 sm:p-5 space-y-1.5 transition-colors ${
                          dish.isAvailable ? "hover:bg-slate-50/60" : "opacity-60 bg-slate-50/40"
                        }`}
                      >
                        {/* Riga Nome, Puntini e Prezzo */}
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-bold text-sm text-slate-900">
                            {dish.name}
                          </span>
                          <span className="flex-1 border-b border-dotted border-slate-300 mx-2 hidden sm:block"></span>
                          <span className="font-mono font-black text-sm text-slate-900 shrink-0">
                            {dish.price.toFixed(2)} €
                          </span>
                        </div>

                        {/* Descrizione Ingredienti */}
                        {dish.description && (
                          <p className="text-xs text-slate-500 italic leading-relaxed">
                            {dish.description}
                          </p>
                        )}

                        {/* Allergeni & Disponibilità */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          {!dish.isAvailable && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                              Esaurito
                            </span>
                          )}

                          {allergensList.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-slate-400 font-medium">Allergeni:</span>
                              {allergensList.map((alg) => (
                                <span
                                  key={alg}
                                  className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200/60 inline-flex items-center gap-0.5"
                                >
                                  <span>{ALLERGEN_ICONS[alg] || "⚠️"}</span>
                                  <span>{alg}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))
        )}

        {/* INFORMATIVA ALLERGENI & FOOTER CONFORME REGOLAMENTO UE */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-3xl space-y-2 text-xs text-slate-500 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Informativa Allergeni (Regolamento UE 1169/2011)</span>
          </div>
          <p className="leading-relaxed">
            I nostri piatti possono contenere ingredienti allergenici evidenziati nelle schede delle singole portate.
            In caso di allergie, intolleranze alimentari o particolari regimi nutrizionali, vi invitiamo a informare tempestivamente il nostro personale di sala prima di ordinare.
          </p>
          <div className="pt-2 border-t border-slate-100 text-[10px] font-semibold text-slate-400 flex items-center justify-between">
            <span>{restaurantName} • Menù Digitale</span>
            <span>Tavoly • Suite Taaaac</span>
          </div>
        </div>
      </main>
    </div>
  );
}
