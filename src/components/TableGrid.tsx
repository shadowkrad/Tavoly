"use client";

import React, { useState, useTransition } from "react";
import { Users, Check, Clock, DollarSign, Ban, Coffee, RefreshCw } from "lucide-react";
import { updateTableStatus } from "@/app/actions";

interface Area {
  id: string;
  name: string;
}

interface TableItem {
  id: string;
  number: string;
  capacity: number;
  status: string;
  areaId: string;
  notes: string | null;
  area: Area;
}

interface TableGridProps {
  tables: TableItem[];
  areas: Area[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; borderClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  LIBERO: {
    label: "Libero",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "border-slate-200/90 hover:border-emerald-300",
    icon: Check,
  },
  OCCUPATO: {
    label: "Occupato",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    borderClass: "border-red-200 bg-red-50/20",
    icon: Users,
  },
  PRENOTATO: {
    label: "Prenotato",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    borderClass: "border-blue-200 bg-blue-50/20",
    icon: Clock,
  },
  CONTO: {
    label: "In Chiusura",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    borderClass: "border-amber-200 bg-amber-50/20",
    icon: DollarSign,
  },
};

export function TableGrid({ tables, areas }: TableGridProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [updatingTableId, setUpdatingTableId] = useState<string | null>(null);

  const filteredTables =
    selectedAreaId === "ALL"
      ? tables
      : tables.filter((t) => t.areaId === selectedAreaId);

  const handleStatusChange = (tableId: string, newStatus: string) => {
    setUpdatingTableId(tableId);
    startTransition(async () => {
      await updateTableStatus(tableId, newStatus);
      setUpdatingTableId(null);
    });
  };

  return (
    <div className="taaaac-card space-y-5">
      {/* Header & Area Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Mappa Sale & Tavoli</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredTables.length} tavoli
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Clicca sulle azioni rapide per gestire lo stato del tavolo in tempo reale
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedAreaId("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedAreaId === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tutte le Sale ({tables.length})
          </button>
          {areas.map((area) => {
            const count = tables.filter((t) => t.areaId === area.id).length;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedAreaId(area.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedAreaId === area.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {area.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredTables.map((table) => {
          const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.LIBERO;
          const isBusy = isPending && updatingTableId === table.id;

          return (
            <div
              key={table.id}
              className={`border rounded-2xl p-4 transition-all duration-200 bg-white relative flex flex-col justify-between shadow-xs ${cfg.borderClass}`}
            >
              {/* Top Row: Number & Capacity */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">
                    {table.area.name}
                  </span>
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    Tav. {table.number}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-lg text-xs font-semibold">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{table.capacity}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="my-3">
                <span
                  className={`taaaac-badge border ${cfg.badgeClass} w-full justify-center`}
                >
                  <cfg.icon className="w-3 h-3" />
                  <span>{cfg.label}</span>
                </span>
              </div>

              {/* Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                {table.status !== "LIBERO" && (
                  <button
                    disabled={isBusy}
                    onClick={() => handleStatusChange(table.id, "LIBERO")}
                    title="Segna come Libero"
                    className="flex-1 py-1 px-1.5 text-[11px] font-semibold bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg transition-colors text-center cursor-pointer disabled:opacity-50"
                  >
                    Libera
                  </button>
                )}

                {table.status !== "OCCUPATO" && (
                  <button
                    disabled={isBusy}
                    onClick={() => handleStatusChange(table.id, "OCCUPATO")}
                    title="Segna come Occupato / Seduti"
                    className="flex-1 py-1 px-1.5 text-[11px] font-semibold bg-slate-50 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-lg transition-colors text-center cursor-pointer disabled:opacity-50"
                  >
                    Occupa
                  </button>
                )}

                {table.status === "OCCUPATO" && (
                  <button
                    disabled={isBusy}
                    onClick={() => handleStatusChange(table.id, "CONTO")}
                    title="Richiesta Conto"
                    className="flex-1 py-1 px-1.5 text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors text-center cursor-pointer disabled:opacity-50"
                  >
                    Conto
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
