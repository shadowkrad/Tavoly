"use client";

import React, { useState, useTransition } from "react";
import { UserCheck, X, Users, AlertCircle } from "lucide-react";
import { createWalkInAction } from "@/app/actions";

interface WalkInModalProps {
  table: {
    id: string;
    number: string;
    capacity: number;
    areaName: string;
  } | null;
  onClose: () => void;
}

export function WalkInModal({ table, onClose }: WalkInModalProps) {
  const [guestCount, setGuestCount] = useState(table?.capacity || 2);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!table) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createWalkInAction(table.id, guestCount);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Impossibile accomodare gli ospiti");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cliente al Volo (Walk-In)</h3>
              <p className="text-xs text-slate-500">Tavolo {table.number} • {table.areaName}</p>
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Numero Persone da Sedere
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                className="w-12 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 text-lg flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <div className="flex-1 py-2.5 border border-slate-200 rounded-xl text-center font-black text-lg bg-white flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{guestCount} {guestCount === 1 ? "persona" : "persone"}</span>
              </div>
              <button
                type="button"
                onClick={() => setGuestCount((c) => Math.min(table.capacity + 2, c + 1))}
                className="w-12 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 text-lg flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 text-center">
              Capienza standard tavolo: {table.capacity} posti
            </p>
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
              {isPending ? "Accomodamento..." : "Accomoda Ora"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
