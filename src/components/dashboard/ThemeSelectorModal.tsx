"use client";

import React, { useTransition } from "react";
import { Palette, X, Check, Sparkles } from "lucide-react";
import { updateThemePaletteAction } from "@/app/actions";

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  color: string;
  accent: string;
}

const THEMES: ThemeOption[] = [
  {
    id: "ROYAL_BLUE",
    name: "Taaaac Royal Blue",
    description: "Moderno, tecnologico ed elegante (Predefinito)",
    color: "#2563eb",
    accent: "#f97316",
  },
  {
    id: "TERRACOTTA",
    name: "Terracotta Rustico",
    description: "Caldo, tradizionale, perfetto per trattorie e pizzerie",
    color: "#c2410c",
    accent: "#d97706",
  },
  {
    id: "BISTROT_SMERALDO",
    name: "Bistrot Smeraldo",
    description: "Fresco, botanico, ideale per cocktail bar e bio bistrot",
    color: "#047857",
    accent: "#eab308",
  },
  {
    id: "ENOTECA_BORDEAUX",
    name: "Enoteca Bordeaux",
    description: "Gourmet, raffinato, perfetto per wine bar e ristoranti d'autore",
    color: "#881337",
    accent: "#f59e0b",
  },
];

interface ThemeSelectorModalProps {
  currentPaletteId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeSelectorModal({ currentPaletteId = "ROYAL_BLUE", isOpen, onClose }: ThemeSelectorModalProps) {
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const handleSelectTheme = (paletteId: string) => {
    startTransition(async () => {
      await updateThemePaletteAction(paletteId);
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Palette Brand Locale</h3>
              <p className="text-xs text-slate-500">Personalizza i colori del tema del tuo ristorante</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {THEMES.map((theme) => {
            const isSelected = currentPaletteId === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                disabled={isPending}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs"
                    style={{ backgroundColor: theme.color }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{theme.name}</h4>
                    <p className="text-[11px] text-slate-500">{theme.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="taaaac-btn-secondary text-xs px-4 py-2"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
