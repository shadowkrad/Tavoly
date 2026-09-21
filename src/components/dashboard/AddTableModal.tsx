"use client";

import React, { useState, useTransition } from "react";
import { Plus, X, LayoutGrid, Circle, Square, Coffee, AlertCircle } from "lucide-react";
import { createCustomTableAction } from "@/app/actions";

interface AreaOption {
  id: string;
  name: string;
}

interface AddTableModalProps {
  areas: AreaOption[];
  activeAreaId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTableModal({ areas, activeAreaId, isOpen, onClose }: AddTableModalProps) {
  const [selectedShape, setSelectedShape] = useState<"RECTANGLE" | "ROUND" | "BAR">("RECTANGLE");
  const [capacity, setCapacity] = useState(4);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultArea = activeAreaId === "ALL" ? (areas[0]?.id || "") : activeAreaId;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("shape", selectedShape);
    formData.set("capacity", String(capacity));

    startTransition(async () => {
      const res = await createCustomTableAction(formData);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Errore nella creazione del tavolo");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Nuovo Tavolo sulla Lavagna</h3>
              <p className="text-xs text-slate-500">Aggiungi e numera una nuova postazione</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Numero Tavolo & Sala */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numero / Sigla *
              </label>
              <input
                name="number"
                type="text"
                required
                placeholder="es. 12, D4, B2"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sala / Area *
              </label>
              <select
                name="areaId"
                defaultValue={defaultArea}
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Forma Tavolo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Forma del Tavolo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedShape("RECTANGLE")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedShape === "RECTANGLE"
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Square className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold block">Rettangolo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedShape("ROUND")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedShape === "ROUND"
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Circle className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold block">Rotondo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedShape("BAR")}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  selectedShape === "BAR"
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Coffee className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs font-bold block">Bancone</span>
              </button>
            </div>
          </div>

          {/* Capienza Posti / Sedie */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Capienza Coperti Standard (Pallini)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCapacity((c) => Math.max(1, c - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 py-2 border border-slate-200 rounded-xl text-center font-bold text-sm bg-white">
                {capacity} {capacity === 1 ? "Posto a sedere" : "Posti a sedere"}
              </div>
              <button
                type="button"
                onClick={() => setCapacity((c) => Math.min(20, c + 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="taaaac-btn-secondary text-xs px-4 py-2"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="taaaac-btn-primary text-xs px-5 py-2 disabled:opacity-50"
            >
              {isPending ? "Aggiunta..." : "Aggiungi alla Lavagna"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
