"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  Users,
  Check,
  Clock,
  DollarSign,
  Sparkles,
  Plus,
  Move,
  LayoutGrid,
  MapPin,
  CheckCircle2,
  Brush,
  UserCheck,
} from "lucide-react";
import {
  updateTableStatus,
  updateTablePositionAction,
  updateTableSeatedCountAction,
} from "@/app/actions";
import { WalkInModal } from "./WalkInModal";
import { AddTableModal } from "./AddTableModal";

interface Area {
  id: string;
  name: string;
}

export interface TableItem {
  id: string;
  number: string;
  capacity: number;
  seatedCount: number;
  status: string;
  shape: string; // RECTANGLE, ROUND, BAR
  posX: number;
  posY: number;
  areaId: string;
  notes: string | null;
  area: Area;
}

interface TableCanvasBoardProps {
  tables: TableItem[];
  areas: Area[];
}

const STATUS_THEMES: Record<
  string,
  { label: string; badge: string; border: string; glow: string; dotColor: string }
> = {
  LIBERO: {
    label: "Libero",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-300 hover:border-emerald-400 bg-white",
    glow: "shadow-emerald-100",
    dotColor: "bg-slate-200 border-slate-300",
  },
  OCCUPATO: {
    label: "Occupato",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    border: "border-rose-300 bg-rose-50/30",
    glow: "shadow-rose-100",
    dotColor: "bg-rose-600 border-rose-700",
  },
  PRENOTATO: {
    label: "Prenotato",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-300 bg-blue-50/30",
    glow: "shadow-blue-100",
    dotColor: "bg-blue-400 border-blue-500",
  },
  CONTO: {
    label: "Conto",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-300 bg-amber-50/30",
    glow: "shadow-amber-100",
    dotColor: "bg-amber-500 border-amber-600",
  },
  DA_PULIRE: {
    label: "Da Pulire",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-purple-300 bg-purple-50/30",
    glow: "shadow-purple-100",
    dotColor: "bg-purple-500 border-purple-600",
  },
};

export function TableCanvasBoard({ tables, areas }: TableCanvasBoardProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id || "ALL");
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"CANVAS" | "GRID">("CANVAS");
  const [walkInTable, setWalkInTable] = useState<TableItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);

  const filteredTables =
    selectedAreaId === "ALL"
      ? tables
      : tables.filter((t) => t.areaId === selectedAreaId);

  // Drag & Drop handlers on Canvas
  const handleDragStart = (e: React.DragEvent, tableId: string) => {
    if (!isEditMode) return;
    setDraggingTableId(tableId);
    e.dataTransfer.setData("text/plain", tableId);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isEditMode || !draggingTableId || !canvasRef.current) return;
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    const posX = Math.max(5, Math.min(92, rawX));
    const posY = Math.max(8, Math.min(88, rawY));

    startTransition(async () => {
      await updateTablePositionAction(draggingTableId, posX, posY);
      setDraggingTableId(null);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isEditMode) e.preventDefault();
  };

  // Seated Count increment/decrement (Pallini)
  const handleDeltaSeated = (e: React.MouseEvent, tableId: string, delta: number) => {
    e.stopPropagation();
    startTransition(async () => {
      await updateTableSeatedCountAction(tableId, delta);
    });
  };

  const handleStatusChange = (e: React.MouseEvent, tableId: string, status: string) => {
    e.stopPropagation();
    startTransition(async () => {
      await updateTableStatus(tableId, status);
    });
  };

  return (
    <div className="taaaac-card space-y-4">
      {/* Top Bar: Controls, Area filters & Modes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Lavagna Sale & Tavoli
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredTables.length} postazioni
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestisci la disposizione spaziale, i coperti e i pallini persone in tempo reale
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("CANVAS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "CANVAS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lavagna 2D
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Griglia Elenco
            </button>
          </div>

          {/* Edit Mode Toggle */}
          {viewMode === "CANVAS" && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
                isEditMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isEditMode ? "Salva Disposizione" : "Sposta Tavoli"}</span>
            </button>
          )}

          {/* Add Table Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="taaaac-btn-primary text-xs px-3.5 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Tavolo</span>
          </button>
        </div>
      </div>

      {/* Area Selection Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedAreaId("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedAreaId === "ALL"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedAreaId === area.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {area.name} ({count})
            </button>
          );
        })}
      </div>

      {/* VIEW 1: THE INTERACTIVE CANVAS (LAVAGNA GRAFICA 2D) */}
      {viewMode === "CANVAS" ? (
        <div className="space-y-2">
          {isEditMode && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center justify-between">
              <span>
                Modalità Modifica Attiva: trascina i tavoli sulla lavagna per riorganizzare la pianta della sala.
              </span>
              <button
                onClick={() => setIsEditMode(false)}
                className="text-xs bg-amber-600 text-white px-2.5 py-1 rounded-lg font-bold"
              >
                Fatto
              </button>
            </div>
          )}

          <div
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative w-full h-[580px] bg-slate-100/70 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden shadow-inner select-none"
            style={{
              backgroundImage:
                "radial-gradient(#cbd5e1 1.2px, transparent 1.2px), radial-gradient(#cbd5e1 1.2px, #f8fafc 1.2px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "0 0, 14px 14px",
            }}
          >
            {filteredTables.map((t) => {
              const theme = STATUS_THEMES[t.status] || STATUS_THEMES.LIBERO;
              const isRound = t.shape === "ROUND";
              const isBar = t.shape === "BAR";

              // Calcolo pallini: visualizza sia posti a sedere sia le persone sedute
              const totalDots = Math.max(t.capacity, t.seatedCount);
              const dotsArray = Array.from({ length: totalDots });

              return (
                <div
                  key={t.id}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, t.id)}
                  style={{
                    left: `${t.posX}%`,
                    top: `${t.posY}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className={`absolute z-10 p-3 shadow-md border-2 transition-transform duration-150 group ${
                    theme.border
                  } ${isRound ? "rounded-full w-28 h-28 flex flex-col items-center justify-center text-center" : isBar ? "rounded-xl w-32 h-20 flex flex-col justify-between" : "rounded-2xl w-36 h-28 flex flex-col justify-between"} ${
                    isEditMode ? "cursor-grab active:cursor-grabbing hover:scale-105" : ""
                  }`}
                >
                  {/* Top Bar: Table Number & Status Pill */}
                  <div className="w-full flex items-center justify-between gap-1">
                    <span className="font-black text-sm text-slate-900 tracking-tight leading-none">
                      {isBar ? "Banco" : "Tav."} {t.number}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${theme.badge}`}>
                      {theme.label}
                    </span>
                  </div>

                  {/* PALLINI (DOTS) PERSONE SEDUTE VS POSTI DISPONIBILI */}
                  <div className="my-1 flex flex-wrap items-center justify-center gap-1">
                    {dotsArray.map((_, dotIdx) => {
                      const isSeated = dotIdx < t.seatedCount;
                      return (
                        <span
                          key={dotIdx}
                          title={isSeated ? `Ospite ${dotIdx + 1} seduto` : `Sedia ${dotIdx + 1} libera`}
                          className={`w-3 h-3 rounded-full border transition-all ${
                            isSeated
                              ? "bg-rose-600 border-rose-700 scale-105 shadow-2xs"
                              : "bg-emerald-100 border-emerald-400"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Seated Count Controls (+ / -) */}
                  <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100 text-[11px]">
                    <div className="flex items-center gap-1 font-bold text-slate-700">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{t.seatedCount}/{t.capacity}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleDeltaSeated(e, t.id, -1)}
                        disabled={t.seatedCount <= 0}
                        title="Rimuovi 1 persona seduta"
                        className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer disabled:opacity-30"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeltaSeated(e, t.id, 1)}
                        title="Aggiungi 1 persona seduta (pallino rosso)"
                        className="w-5 h-5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Hover Quick Actions overlay (when not in edit mode) */}
                  {!isEditMode && (
                    <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs p-1 rounded-xl shadow-lg text-[10px] text-white z-30 whitespace-nowrap">
                      {t.status === "LIBERO" && (
                        <button
                          type="button"
                          onClick={() => setWalkInTable(t)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Walk-In</span>
                        </button>
                      )}

                      {t.status !== "LIBERO" && (
                        <button
                          type="button"
                          onClick={(e) => handleStatusChange(e, t.id, "LIBERO")}
                          className="px-1.5 py-0.5 rounded-lg hover:bg-slate-700 font-semibold cursor-pointer"
                        >
                          Libera
                        </button>
                      )}

                      {t.status !== "OCCUPATO" && (
                        <button
                          type="button"
                          onClick={(e) => handleStatusChange(e, t.id, "OCCUPATO")}
                          className="px-1.5 py-0.5 rounded-lg hover:bg-slate-700 font-semibold cursor-pointer"
                        >
                          Occupa
                        </button>
                      )}

                      {t.status === "OCCUPATO" && (
                        <button
                          type="button"
                          onClick={(e) => handleStatusChange(e, t.id, "CONTO")}
                          className="px-1.5 py-0.5 rounded-lg hover:bg-slate-700 font-semibold text-amber-300 cursor-pointer"
                        >
                          Conto
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleStatusChange(e, t.id, "DA_PULIRE")}
                        className="px-1.5 py-0.5 rounded-lg hover:bg-slate-700 font-semibold text-purple-300 cursor-pointer"
                      >
                        Pulisci
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Canvas Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 pt-1 gap-4">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-slate-700">Legenda Pallini:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-700"></span>
                <span>Persona Seduta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-400"></span>
                <span>Sedia Libera</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Stati Tavolo:</span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">● Libero</span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">● Occupato</span>
              <span className="flex items-center gap-1 text-blue-700 font-medium">● Prenotato</span>
              <span className="flex items-center gap-1 text-amber-700 font-medium">● Conto</span>
              <span className="flex items-center gap-1 text-purple-700 font-medium">● Da Pulire</span>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: COMPACT GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredTables.map((t) => {
            const theme = STATUS_THEMES[t.status] || STATUS_THEMES.LIBERO;
            return (
              <div
                key={t.id}
                className={`border rounded-2xl p-4 bg-white shadow-xs space-y-3 ${theme.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold block">
                      {t.area.name}
                    </span>
                    <strong className="text-xl font-black text-slate-900">
                      Tav. {t.number}
                    </strong>
                  </div>
                  <span className={`taaaac-badge border ${theme.badge}`}>
                    {theme.label}
                  </span>
                </div>

                {/* Pallini */}
                <div className="flex items-center justify-between py-1 bg-slate-50 rounded-xl px-2.5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: t.capacity }).map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full ${
                          idx < t.seatedCount ? "bg-rose-600" : "bg-emerald-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    {t.seatedCount}/{t.capacity}
                  </span>
                </div>

                {/* Quick Action */}
                <div className="flex items-center gap-1 pt-1">
                  {t.status === "LIBERO" ? (
                    <button
                      onClick={() => setWalkInTable(t)}
                      className="w-full py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Walk-In al Volo
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleStatusChange(e, t.id, "LIBERO")}
                      className="w-full py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Libera Tavolo
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {walkInTable && (
        <WalkInModal
          table={{
            id: walkInTable.id,
            number: walkInTable.number,
            capacity: walkInTable.capacity,
            areaName: walkInTable.area.name,
          }}
          onClose={() => setWalkInTable(null)}
        />
      )}

      <AddTableModal
        areas={areas}
        activeAreaId={selectedAreaId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
