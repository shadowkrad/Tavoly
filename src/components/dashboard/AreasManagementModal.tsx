"use client";

import React, { useState, useTransition } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  createAreaAction,
  updateAreaAction,
  deleteAreaAction,
} from "@/app/actions";

export interface AreaItem {
  id: string;
  name: string;
  description?: string | null;
  orderIndex?: number;
}

interface AreasManagementModalProps {
  areas: AreaItem[];
  tablesCountByArea: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onAreaDeleted?: (areaId: string) => void;
}

export function AreasManagementModal({
  areas,
  tablesCountByArea,
  isOpen,
  onClose,
  onAreaDeleted,
}: AreasManagementModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stato per inline editing
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Stato per conferma eliminazione
  const [deleteConfirmAreaId, setDeleteConfirmAreaId] = useState<string | null>(null);

  // Stato per nuova sala
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  if (!isOpen) return null;

  const handleStartEdit = (area: AreaItem) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDeleteConfirmAreaId(null);
    setEditingAreaId(area.id);
    setEditName(area.name);
    setEditDescription(area.description || "");
  };

  const handleCancelEdit = () => {
    setEditingAreaId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = (areaId: string) => {
    if (!editName.trim()) {
      setErrorMsg("Il nome della sala non può essere vuoto");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      const res = await updateAreaAction(areaId, editName.trim(), editDescription.trim());
      if (res.success) {
        setSuccessMsg(`Sala rinominata in "${editName.trim()}" con successo`);
        setEditingAreaId(null);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Errore durante la modifica della sala");
      }
    });
  };

  const handleDelete = (areaId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await deleteAreaAction(areaId);
      if (res.success) {
        setSuccessMsg("Sala eliminata con successo");
        setDeleteConfirmAreaId(null);
        onAreaDeleted?.(areaId);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Errore durante l'eliminazione della sala");
        setDeleteConfirmAreaId(null);
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg("Inserisci un nome per la nuova sala");
      return;
    }
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("name", newName.trim());
    if (newDescription.trim()) {
      formData.set("description", newDescription.trim());
    }

    startTransition(async () => {
      const res = await createAreaAction(formData);
      if (res.success) {
        setSuccessMsg(`Sala "${newName.trim()}" creata con successo!`);
        setNewName("");
        setNewDescription("");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.error || "Errore durante la creazione della sala");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Gestione Stanze & Sale
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Crea, rinomina o elimina le zone del locale
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

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Lista Stanze Esistenti */}
        <div className="mt-5 space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Sale Esistenti ({areas.length})
          </label>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {areas.map((area) => {
              const tableCount = tablesCountByArea[area.id] || 0;
              const isEditing = editingAreaId === area.id;
              const isDeleting = deleteConfirmAreaId === area.id;

              return (
                <div
                  key={area.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isEditing
                      ? "bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20"
                      : isDeleting
                      ? "bg-rose-50/50 border-rose-300"
                      : "bg-slate-50/70 border-slate-200/90 hover:bg-slate-50"
                  }`}
                >
                  {isEditing ? (
                    // Form Inline Modifica
                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Nome Sala *
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Descrizione (opzionale)
                        </label>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="es. Vista terrazza, sala fumatori..."
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                          className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(area.id)}
                          disabled={isPending}
                          className="px-3.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isPending ? "Salvataggio..." : "Salva Modifiche"}</span>
                        </button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    // Conferma Eliminazione
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-rose-800 text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Confermi di voler eliminare &quot;{area.name}&quot;?
                          </p>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            {tableCount > 0
                              ? `Attenzione: verranno eliminati anche tutti i suoi ${tableCount} tavoli!`
                              : "Questa sala non ha tavoli associati."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmAreaId(null)}
                          disabled={isPending}
                          className="px-3 py-1 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(area.id)}
                          disabled={isPending}
                          className="px-3.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isPending ? "Eliminazione..." : "Sì, Elimina"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Visualizzazione Normale
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {area.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                            {tableCount} {tableCount === 1 ? "tavolo" : "tavoli"}
                          </span>
                        </div>
                        {area.description && (
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {area.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(area)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Rinomina e modifica sala"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            setDeleteConfirmAreaId(area.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Elimina sala"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Creazione Nuova Stanza */}
        <form onSubmit={handleCreate} className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Aggiungi Nuova Stanza / Sala
            </h4>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Nome Stanza *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="es. Terrazza Estiva, Privé, Giardino Esterno"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Descrizione o Note (opzionale)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="es. 12 tavoli coperti, vista piscina"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-end">
            <button
              type="submit"
              disabled={isPending || !newName.trim()}
              className="taaaac-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPending ? "Creazione in corso..." : "Crea Nuova Sala"}</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
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
