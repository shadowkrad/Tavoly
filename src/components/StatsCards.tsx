import React from "react";
import { Users, LayoutGrid, Clock, CalendarCheck2 } from "lucide-react";

interface StatsProps {
  totalTables: number;
  freeTables: number;
  occupiedTables: number;
  totalGuestsToday: number;
  reservationsCount: number;
}

export function StatsCards({
  totalTables,
  freeTables,
  occupiedTables,
  totalGuestsToday,
  reservationsCount,
}: StatsProps) {
  const occupancyRate = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tavoli Liberi / Totali */}
      <div className="taaaac-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tavoli Disponibili
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{freeTables}</span>
            <span className="text-xs text-slate-500 font-medium">su {totalTables} totali</span>
          </div>
          <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            {totalTables - freeTables} attualmente occupati o riservati
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <LayoutGrid className="w-6 h-6" />
        </div>
      </div>

      {/* Coperti Totali Attesi */}
      <div className="taaaac-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Coperti del Giorno
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalGuestsToday}</span>
            <span className="text-xs text-slate-500 font-medium">ospiti previsti</span>
          </div>
          <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
            {reservationsCount} prenotazioni confermate
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* Tasso di Occupazione */}
      <div className="taaaac-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Occupazione Sala
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{occupancyRate}%</span>
            <span className="text-xs text-slate-500 font-medium">in questo momento</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      {/* Servizio Attivo */}
      <div className="taaaac-card flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Servizio Corrente
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">Pranzo & Cena</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1">
            <CalendarCheck2 className="w-3.5 h-3.5 text-slate-500" />
            Oggi, {new Date().toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <CalendarCheck2 className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
