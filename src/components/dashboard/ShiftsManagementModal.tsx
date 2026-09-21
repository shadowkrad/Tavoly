"use client";

import React, { useState, useTransition } from "react";
import { Clock, X, Users, Check, AlertTriangle, ShieldCheck, Save, Sparkles } from "lucide-react";
import { updateServiceShiftAction } from "@/app/actions";

export interface ServiceShiftItem {
  id: string;
  name: string;
  timeSlotsJson: string;
  maxGuests: number;
  avgDurationMinutes: number;
  isActive: boolean;
}

interface ShiftsManagementModalProps {
  shifts: ServiceShiftItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function ShiftsManagementModal({ shifts, isOpen, onClose }: ShiftsManagementModalProps) {
  const [shiftList, setShiftList] = useState<ServiceShiftItem[]>(shifts);
  const [isPending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleActive = (idx: number) => {
    const next = [...shiftList];
    next[idx].isActive = !next[idx].isActive;
    setShiftList(next);
  };

  const handleMaxGuestsChange = (idx: number, val: number) => {
    const next = [...shiftList];
    next[idx].maxGuests = Math.max(5, val);
    setShiftList(next);
  };

  const handleSaveShift = (shift: ServiceShiftItem) => {
    setStatusMsg(null);
    startTransition(async () => {
      const res = await updateServiceShiftAction(shift.id, shift.maxGuests, shift.isActive);
      if (res.success) {
        setStatusMsg(`Turno "${shift.name}" aggiornato!`);
        setTimeout(() => setStatusMsg(null), 2500);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Gestione Turni, Servizi & Capienza
              </h3>
              <p className="text-xs text-slate-500">
                Imposta le fasce orarie e la capienza massima per prevenire l&apos;overbooking
              </p>
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

        {statusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {shiftList.map((shift, idx) => {
            const slots: string[] = JSON.parse(shift.timeSlotsJson || "[]");

            return (
              <div
                key={shift.id}
                className={`p-4 rounded-2xl border transition-all ${
                  shift.isActive
                    ? "bg-white border-slate-200/90 shadow-xs"
                    : "bg-slate-50/70 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{shift.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          shift.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {shift.isActive ? "Attivo" : "Disattivato"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {slots.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Controlli Capienza e Salvataggio */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-500">Max Coperti:</span>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={shift.maxGuests}
                        onChange={(e) => handleMaxGuestsChange(idx, parseInt(e.target.value, 10) || 10)}
                        className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center font-bold"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        shift.isActive
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {shift.isActive ? "Disattiva" : "Attiva"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveShift(shift)}
                      disabled={isPending}
                      className="taaaac-btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salva</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <p>
            I turni disattivati o esauriti non saranno prenotabili online dai clienti.
          </p>
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
