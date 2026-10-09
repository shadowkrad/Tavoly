"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  UtensilsCrossed,
  Plus,
  X,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  Check,
  Tag,
  Sparkles,
} from "lucide-react";
import { createMenuItemAction, updateMenuItemAction } from "@/app/actions";
import { EU_ALLERGENS, ALLERGEN_ICONS, DEFAULT_MENU_CATEGORIES } from "@/lib/allergens";

export interface MenuItemData {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  allergens: string; // JSON array string
  isAvailable: boolean;
}

interface MenuItemModalProps {
  item: MenuItemData | null; // null se creazione, valorizzato se modifica
  categories: string[];
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_IMAGES = [
  { label: "Antipasto Salmone", url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80" },
  { label: "Tagliere Salumi", url: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80" },
  { label: "Pasta al Sugo", url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?w=600&auto=format&fit=crop&q=80" },
  { label: "Pasta al Tartufo", url: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80" },
  { label: "Filetto Carne", url: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80" },
  { label: "Pesce Spigola", url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80" },
  { label: "Pizza Margherita", url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80" },
  { label: "Tiramisù Dolce", url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80" },
  { label: "Vino Rosso", url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80" },
];

export function MenuItemModal({
  item,
  categories,
  isOpen,
  onClose,
}: MenuItemModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Primi");
  const [customCategory, setCustomCategory] = useState("");
  const [price, setPrice] = useState("12.00");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setPrice(item.price.toFixed(2));
      setDescription(item.description || "");
      setImageUrl(item.imageUrl || "");
      setIsAvailable(item.isAvailable);
      try {
        const parsed = JSON.parse(item.allergens || "[]");
        setSelectedAllergens(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSelectedAllergens([]);
      }
    } else {
      setName("");
      setCategory(categories[0] || "Primi");
      setCustomCategory("");
      setPrice("12.00");
      setDescription("");
      setImageUrl("");
      setSelectedAllergens([]);
      setIsAvailable(true);
    }
    setErrorMsg(null);
  }, [item, categories, isOpen]);

  if (!isOpen) return null;

  const toggleAllergen = (alg: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(alg) ? prev.filter((a) => a !== alg) : [...prev, alg]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Inserisci il nome del piatto");
      return;
    }

    const finalCategory = category === "CUSTOM" ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMsg("Specifica la categoria del piatto");
      return;
    }

    const finalPrice = parseFloat(price.replace(",", "."));
    if (isNaN(finalPrice) || finalPrice < 0) {
      setErrorMsg("Inserisci un prezzo valido");
      return;
    }

    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("category", finalCategory);
    formData.set("price", String(finalPrice));
    formData.set("description", description.trim());
    formData.set("imageUrl", imageUrl.trim());
    formData.set("allergens", JSON.stringify(selectedAllergens));
    formData.set("isAvailable", isAvailable ? "true" : "false");

    startTransition(async () => {
      const res = item
        ? await updateMenuItemAction(item.id, formData)
        : await createMenuItemAction(formData);

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Errore durante il salvataggio");
      }
    });
  };

  const allCategories = Array.from(
    new Set([...DEFAULT_MENU_CATEGORIES, ...categories])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {item ? "Modifica Piatto del Menù" : "Aggiungi Nuovo Piatto"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Configura portata, prezzo, allergeni e fotografia
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback errore */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Scrollabile */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Nome e Prezzo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nome Piatto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Risotto ai Funghi Porcini"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Prezzo (€) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">€</span>
                <input
                  type="text"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="14.00"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Categoria Portata *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold cursor-pointer"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="CUSTOM">+ Altra categoria personalizzata...</option>
              </select>
            </div>

            {category === "CUSTOM" && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome Nuova Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="es. Degustazione, Cocktail, Panini..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Stato di Disponibilità
              </label>
              <div className="flex items-center gap-3 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="dishAvailable"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="dishAvailable" className="text-xs font-bold text-slate-800 cursor-pointer">
                  {isAvailable ? "Disponibile nel menù" : "Esaurito / Non Disponibile"}
                </label>
              </div>
            </div>
          </div>

          {/* Descrizione & Ingredienti */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Descrizione, Ingredienti o Provenienza
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="es. Riso Carnaroli mantecato al burro di malga, Parmigiano Reggiano 24 mesi e funghi porcini freschi della Garfagnana"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-medium"
            ></textarea>
          </div>

          {/* Immagine Piatto */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Fotografia del Piatto (Opzionale)</span>
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="text-[11px] font-semibold text-rose-600 hover:underline"
                >
                  Rimuovi foto
                </button>
              )}
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Incolla URL immagine (es. https://... o scegli dai preset)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {/* Galleria Preset Veloci */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                Oppure seleziona un'immagine predefinita di alta qualità:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      imageUrl === preset.url
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Anteprima foto */}
            {imageUrl && (
              <div className="mt-2 flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                <img
                  src={imageUrl}
                  alt="Anteprima piatto"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-100 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <div className="text-[11px] text-slate-500 overflow-hidden truncate">
                  <span className="font-bold text-slate-800 block">Anteprima caricata</span>
                  <span>{imageUrl}</span>
                </div>
              </div>
            )}
          </div>

          {/* Allergeni (14 Allergeni UE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Allergeni Presenti ({selectedAllergens.length} selezionati)
              </label>
              {selectedAllergens.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedAllergens([])}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  Deseleziona tutti
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {EU_ALLERGENS.map((alg) => {
                const isChecked = selectedAllergens.includes(alg);
                const icon = ALLERGEN_ICONS[alg] || "⚠️";
                return (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => toggleAllergen(alg)}
                    className={`p-2 rounded-xl text-left text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isChecked
                        ? "bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-xs"
                        : "bg-slate-50/70 text-slate-700 border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-sm shrink-0">{icon}</span>
                    <span className="truncate text-[11px]">{alg}</span>
                    {isChecked && <Check className="w-3 h-3 text-amber-700 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="taaaac-btn-secondary text-xs px-4 py-2"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="taaaac-btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isPending ? "Salvataggio..." : item ? "Salva Modifiche" : "Crea Piatto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
