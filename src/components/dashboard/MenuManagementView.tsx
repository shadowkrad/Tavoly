"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  UtensilsCrossed,
  Plus,
  QrCode,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  ExternalLink,
  ImageIcon,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  deleteMenuItemAction,
  toggleMenuItemAvailabilityAction,
  updateMenuShowImagesSettingAction,
} from "@/app/actions";
import { MenuItemModal, MenuItemData } from "./MenuItemModal";
import { MenuQrCodeModal } from "./MenuQrCodeModal";
import { ALLERGEN_ICONS } from "@/lib/allergens";

interface TableItem {
  id: string;
  number: string;
  areaName?: string;
}

interface MenuManagementViewProps {
  initialMenuItems: MenuItemData[];
  initialShowImages: boolean;
  restaurantName: string;
  tagline?: string;
  logoUrl?: string;
  tables: TableItem[];
}

export function MenuManagementView({
  initialMenuItems,
  initialShowImages,
  restaurantName,
  tagline,
  logoUrl,
  tables,
}: MenuManagementViewProps) {
  const [isPending, startTransition] = useTransition();

  // Settings state
  const [showImages, setShowImages] = useState(initialShowImages);

  // Filtri & Ricerca
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modali
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Toggle impostazione immagini
  const handleToggleShowImages = () => {
    const nextVal = !showImages;
    setShowImages(nextVal);
    startTransition(async () => {
      await updateMenuShowImagesSettingAction(nextVal);
    });
  };

  // Toggle disponibilità singolo piatto
  const handleToggleAvailability = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleMenuItemAvailabilityAction(id, !current);
    });
  };

  // Eliminazione piatto
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${name}" dal menù?`)) return;
    startTransition(async () => {
      await deleteMenuItemAction(id);
    });
  };

  // Categorie univoche presenti
  const existingCategories = useMemo(() => {
    const cats = Array.from(new Set(initialMenuItems.map((m) => m.category)));
    return cats;
  }, [initialMenuItems]);

  // Piatti filtrati
  const filteredDishes = useMemo(() => {
    return initialMenuItems.filter((dish) => {
      if (selectedCategory !== "ALL" && dish.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description
          ? dish.description.toLowerCase().includes(q)
          : false;
        const matchCat = dish.category.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [initialMenuItems, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPALE & AZIONI RAPIDE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
            </div>
            <span>Menù Digitale QR Code</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gestisci portate, prezzi, allergeni e genera i segnatavoli QR Code per i tuoi clienti
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Mostra Foto Piatti nelle Impostazioni */}
          <button
            type="button"
            onClick={handleToggleShowImages}
            disabled={isPending}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              showImages
                ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
            title="Attiva o disattiva la visualizzazione delle fotografie nel menù digitale"
          >
            <ImageIcon className={`w-4 h-4 ${showImages ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Foto Piatti:</span>
            <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md ${showImages ? "bg-emerald-200/60 text-emerald-900" : "bg-slate-200 text-slate-600"}`}>
              {showImages ? "Attive (Card con Foto)" : "Disattivate (Solo Testo)"}
            </span>
          </button>

          {/* Genera & Stampa QR Code */}
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Genera QR Code stampabile con logo aziendale per i tavoli"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Stampa QR Tavoli</span>
          </button>

          {/* Vedi Menù Online */}
          <a
            href="/menu"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Apri l'anteprima del menù pubblico come lo vedono i clienti da cellulare"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Vedi Menù Cliente</span>
          </a>

          {/* Aggiungi Piatto */}
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            className="taaaac-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Piatto</span>
          </button>
        </div>
      </div>

      {/* BANNER INFORMATIVO MODALITA' LAYOUT SCELTA */}
      <div className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
        showImages
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
          : "bg-amber-50/70 border-amber-200 text-amber-900"
      }`}>
        <div className="flex items-center gap-2">
          {showImages ? (
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>
            {showImages
              ? "Layout Menù Grafico attivo: i piatti mostrano la fotografia in primo piano sia nel gestionale che per i clienti che scansionano il QR."
              : "Layout Menù Tipografico Puro attivo: le foto sono nascoste. Il menù adotta uno stile bistrot elegante e pulito senza spazi vuoti."}
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggleShowImages}
          className="text-[11px] font-bold underline shrink-0 hover:opacity-80 cursor-pointer"
        >
          {showImages ? "Passa a Solo Testo" : "Attiva Foto Piatti"}
        </button>
      </div>

      {/* BARRA FILTRI CATEGORIA & RICERCA */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Categorie Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutte ({initialMenuItems.length})
            </button>
            {existingCategories.map((cat) => {
              const count = initialMenuItems.filter((m) => m.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Ricerca Testuale */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca piatto o ingrediente..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
        </div>
      </div>

      {/* GRIGLIA PIATTI DEL MENU */}
      {filteredDishes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 text-sm">
              Nessun piatto trovato
            </div>
            <p className="text-xs text-slate-500">
              {searchQuery.trim()
                ? `Nessuna portata corrisponde alla ricerca "${searchQuery}".`
                : "Non ci sono ancora piatti inseriti in questa categoria."}
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="taaaac-btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi il primo piatto</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDishes.map((dish) => {
            let allergensList: string[] = [];
            try {
              allergensList = JSON.parse(dish.allergens || "[]");
            } catch {
              allergensList = [];
            }

            return (
              <div
                key={dish.id}
                className={`bg-white border rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between transition-all ${
                  dish.isAvailable
                    ? "border-slate-200/90 hover:shadow-md"
                    : "border-slate-200/60 bg-slate-50/50 opacity-75"
                }`}
              >
                {/* Sezione Immagine (Condizionale a showImages) */}
                {showImages && (
                  <div className="relative h-44 bg-slate-100 overflow-hidden group">
                    {dish.imageUrl ? (
                      <img
                        src={dish.imageUrl}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                        <UtensilsCrossed className="w-8 h-8 mb-1" />
                        <span className="text-[10px] font-semibold text-slate-400">Nessuna foto</span>
                      </div>
                    )}

                    {/* Badge Categoria sopra la foto */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/95 text-slate-900 shadow-xs backdrop-blur-xs">
                        {dish.category}
                      </span>
                    </div>

                    {/* Prezzo sopra la foto */}
                    <div className="absolute top-3 right-3">
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-900/90 text-white shadow-xs font-mono backdrop-blur-xs">
                        {dish.price.toFixed(2)} €
                      </span>
                    </div>

                    {/* Badge se non disponibile */}
                    {!dish.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-md">
                          Esaurito
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contenuto Testuale Card */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Header Piatto (visibile se showImages è disattivato) */}
                    {!showImages && (
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {dish.category}
                        </span>
                        <span className="font-mono font-black text-sm text-slate-900">
                          {dish.price.toFixed(2)} €
                        </span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {dish.name}
                      </h3>
                      {!dish.isAvailable && !showImages && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">
                          Esaurito
                        </span>
                      )}
                    </div>

                    {dish.description && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {dish.description}
                      </p>
                    )}
                  </div>

                  {/* Allergeni */}
                  {allergensList.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1">
                        {allergensList.map((alg) => (
                          <span
                            key={alg}
                            className="text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-md flex items-center gap-1"
                            title={`Allergene: ${alg}`}
                          >
                            <span>{ALLERGEN_ICONS[alg] || "⚠️"}</span>
                            <span>{alg}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Card: Disponibilità & Tasti Modifica / Elimina */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(dish.id, dish.isAvailable)}
                      disabled={isPending}
                      className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-colors cursor-pointer ${
                        dish.isAvailable
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dish.isAvailable ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                      <span>{dish.isAvailable ? "Disponibile" : "Esaurito"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingItem(dish);
                          setIsItemModalOpen(true);
                        }}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Modifica piatto"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(dish.id, dish.name)}
                        disabled={isPending}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Elimina piatto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL INSERIMENTO / MODIFICA PIATTO */}
      <MenuItemModal
        item={editingItem}
        categories={existingCategories}
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* MODAL GENERAZIONE & STAMPA QR CODE CON LOGO AZIENDALE */}
      <MenuQrCodeModal
        restaurantName={restaurantName}
        tagline={tagline}
        logoUrl={logoUrl}
        tables={tables}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
