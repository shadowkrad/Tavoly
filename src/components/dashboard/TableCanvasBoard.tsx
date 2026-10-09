"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  Users,
  Plus,
  Move,
  LayoutGrid,
  Map,
  Check,
  Clock,
  Sparkles,
  Receipt,
  UserCheck,
  Layers,
} from "lucide-react";
import {
  updateTablePositionAction,
} from "@/app/actions";
import { AddTableModal } from "./AddTableModal";
import { TableDetailModal } from "./TableDetailModal";
import { AreasManagementModal } from "./AreasManagementModal";

interface Area {
  id: string;
  name: string;
  description?: string | null;
  orderIndex?: number;
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

interface ReservationItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  guestCount: number;
  timeSlot: string;
  status: string;
  notes: string | null;
  tableId: string | null;
}

interface TableCanvasBoardProps {
  tables: TableItem[];
  areas: Area[];
  reservations?: ReservationItem[];
  onOpenAreasModal?: () => void;
}

const STATUS_THEMES: Record<
  string,
  { label: string; badge: string; border: string; glow: string; bg: string }
> = {
  LIBERO: {
    label: "Libero",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-400/80 hover:border-emerald-500",
    glow: "shadow-emerald-100/60",
    bg: "bg-white",
  },
  OCCUPATO: {
    label: "Occupato",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    border: "border-rose-400 hover:border-rose-500",
    glow: "shadow-rose-100",
    bg: "bg-rose-50/20",
  },
  PRENOTATO: {
    label: "Prenotato",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-400 hover:border-blue-500",
    glow: "shadow-blue-100",
    bg: "bg-blue-50/20",
  },
  CONTO: {
    label: "Conto",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-400 hover:border-amber-500",
    glow: "shadow-amber-100",
    bg: "bg-amber-50/30",
  },
  DA_PULIRE: {
    label: "Da Pulire",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-purple-400 hover:border-purple-500",
    glow: "shadow-purple-100",
    bg: "bg-purple-50/20",
  },
};

export function TableCanvasBoard({
  tables,
  areas,
  reservations = [],
  onOpenAreasModal,
}: TableCanvasBoardProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>(areas[0]?.id || "ALL");
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"CANVAS" | "GRID">("CANVAS");
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<TableItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAreasModalOpen, setIsAreasModalOpen] = useState(false);

  const tablesCountByArea = tables.reduce((acc, t) => {
    acc[t.areaId] = (acc[t.areaId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const [isPending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);

  const filteredTables =
    selectedAreaId === "ALL"
      ? tables
      : tables.filter((t) => t.areaId === selectedAreaId);

  // Mappa prenotazioni attive per tavolo
  const reservationsByTable = reservations.reduce((acc, r) => {
    if (r.tableId && r.status !== "ANNULLATA" && r.status !== "COMPLETATA") {
      acc[r.tableId] = r;
    }
    return acc;
  }, {} as Record<string, ReservationItem>);

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

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-4">
      {/* TOOLBAR SALE & CONTROLLI (SNELLA, RIGA SINGOLA) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Tabs delle Sale */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            type="button"
            onClick={() => setSelectedAreaId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedAreaId === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
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
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {area.name} ({count})
              </button>
            );
          })}

          {/* Tasto Gestione Sale / Stanze */}
          <button
            type="button"
            onClick={() => (onOpenAreasModal ? onOpenAreasModal() : setIsAreasModalOpen(true))}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-1 shrink-0"
            title="Gestisci Stanze & Sale (Crea, Rinomina, Elimina)"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Gestisci Sale</span>
          </button>
        </div>

        {/* Controlli Vista & Editor Pianta */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Switch Vista Canvas / Griglia */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("CANVAS")}
              title="Vista Planimetria 2D"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "CANVAS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pianta 2D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              title="Vista Elenco Griglia"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === "GRID"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Griglia</span>
            </button>
          </div>

          {/* Toggle Modalità Sposta Tavoli */}
          {viewMode === "CANVAS" && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
                isEditMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Attiva modalità trascina e rilascia per modificare la pianta della sala"
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isEditMode ? "Fatto" : "Modifica Pianta"}</span>
            </button>
          )}

          {/* Aggiungi Tavolo */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
            title="Aggiungi un nuovo tavolo a questa sala"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tavolo</span>
          </button>
        </div>
      </div>

      {/* AVVISO MODALITA EDIT */}
      {isEditMode && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-600" />
            <span>Modalità Modifica Pianta: trascina i tavoli per posizionarli nello spazio.</span>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold cursor-pointer"
          >
            Salva & Chiudi
          </button>
        </div>
      )}

      {/* VISTA 1: CANVAS PLANIMETRIA 2D A PIENA LARGHEZZA */}
      {viewMode === "CANVAS" ? (
        <div className="space-y-3">
          <div
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative w-full h-[620px] lg:h-[660px] bg-slate-50/70 border-2 border-dashed border-slate-200/90 rounded-3xl overflow-hidden shadow-inner select-none transition-all"
            style={{
              backgroundImage:
                "radial-gradient(#94a3b8 1.1px, transparent 1.1px), radial-gradient(#94a3b8 1.1px, #f8fafc 1.1px)",
              backgroundSize: "28px 28px",
              backgroundPosition: "0 0, 14px 14px",
            }}
          >
            {filteredTables.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Map className="w-10 h-10 opacity-30" />
                <p className="text-xs font-semibold">Nessun tavolo presente in questa sala.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  + Aggiungi il primo tavolo
                </button>
              </div>
            ) : (
              filteredTables.map((t) => {
                const theme = STATUS_THEMES[t.status] || STATUS_THEMES.LIBERO;
                const isRound = t.shape === "ROUND";
                const isBar = t.shape === "BAR";
                const activeRes = reservationsByTable[t.id];

                return (
                  <div
                    key={t.id}
                    draggable={isEditMode}
                    onDragStart={(e) => handleDragStart(e, t.id)}
                    onClick={() => {
                      if (!isEditMode) setSelectedTableForDetail(t);
                    }}
                    style={{
                      left: `${t.posX}%`,
                      top: `${t.posY}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`absolute z-10 p-3 shadow-md border-2 transition-all duration-150 cursor-pointer ${
                      theme.border
                    } ${theme.bg} ${
                      isRound
                        ? "rounded-full w-28 h-28 flex flex-col items-center justify-center text-center"
                        : isBar
                        ? "rounded-2xl w-32 h-20 flex flex-col justify-between"
                        : "rounded-3xl w-36 h-28 flex flex-col justify-between"
                    } ${
                      isEditMode
                        ? "cursor-grab active:cursor-grabbing hover:scale-105 ring-2 ring-amber-400"
                        : "hover:scale-105 hover:shadow-lg active:scale-95"
                    }`}
                  >
                    {/* Header Tavolo: Numero & Badge Stato */}
                    <div className="w-full flex items-center justify-between gap-1">
                      <span className="font-black text-sm text-slate-900 tracking-tight leading-none">
                        {isBar ? "Banco" : "Tav."} {t.number}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${theme.badge}`}>
                        {theme.label}
                      </span>
                    </div>

                    {/* Centro: Dettaglio o Ospiti o Prenotazione */}
                    {activeRes ? (
                      <div className="my-auto text-center px-1">
                        <p className="text-[10px] font-bold text-blue-900 truncate max-w-[110px]">
                          {activeRes.customerName}
                        </p>
                        <p className="text-[9px] text-blue-600 font-semibold font-mono">
                          {activeRes.timeSlot} · {activeRes.guestCount}p
                        </p>
                      </div>
                    ) : (
                      /* Visualizzazione Coperti / Pallini persone */
                      <div className="my-auto flex flex-wrap items-center justify-center gap-1 px-1">
                        {Array.from({ length: Math.max(t.capacity, t.seatedCount) }).map((_, dotIdx) => {
                          const isSeated = dotIdx < t.seatedCount;
                          return (
                            <span
                              key={dotIdx}
                              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                                isSeated
                                  ? "bg-rose-600 border-rose-700 scale-105 shadow-2xs"
                                  : "bg-emerald-200 border-emerald-400"
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Footer Tavolo: Conteggio Coperti */}
                    <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100/80 text-[10px] font-bold text-slate-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{t.seatedCount}/{t.capacity}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold">
                        {t.area.name}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* LEGENDA COMPATTA */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-2 pt-1 gap-3">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-700">Stati Tavolo:</span>
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Libero
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Occupato
              </span>
              <span className="flex items-center gap-1 text-blue-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Prenotato
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Conto
              </span>
              <span className="flex items-center gap-1 text-purple-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Da Pulire
              </span>
            </div>

            <span className="text-slate-400 italic">
              💡 Tocca qualsiasi tavolo per aprire la scheda di gestione rapida
            </span>
          </div>
        </div>
      ) : (
        /* VISTA 2: GRIGLIA COMPATTA */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredTables.map((t) => {
            const theme = STATUS_THEMES[t.status] || STATUS_THEMES.LIBERO;
            const activeRes = reservationsByTable[t.id];

            return (
              <div
                key={t.id}
                onClick={() => setSelectedTableForDetail(t)}
                className={`border-2 rounded-2xl p-3.5 bg-white shadow-xs space-y-2 cursor-pointer hover:scale-102 hover:shadow-md transition-all ${theme.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {t.area.name}
                    </span>
                    <strong className="text-lg font-black text-slate-900">
                      Tav. {t.number}
                    </strong>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${theme.badge}`}>
                    {theme.label}
                  </span>
                </div>

                {activeRes ? (
                  <div className="p-1.5 bg-blue-50 rounded-xl text-center">
                    <p className="text-xs font-bold text-blue-900 truncate">
                      {activeRes.customerName}
                    </p>
                    <p className="text-[10px] text-blue-600 font-mono">
                      {activeRes.timeSlot} · {activeRes.guestCount} osp.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1 bg-slate-50 rounded-xl px-2">
                    <span className="text-[11px] text-slate-500 font-medium">Coperti</span>
                    <span className="text-xs font-black text-slate-800">
                      {t.seatedCount}/{t.capacity}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETTAGLIO & AZIONI TAVOLO */}
      <TableDetailModal
        table={selectedTableForDetail}
        reservations={reservations}
        isOpen={Boolean(selectedTableForDetail)}
        onClose={() => setSelectedTableForDetail(null)}
      />

      {/* MODAL AGGIUNGI TAVOLO */}
      <AddTableModal
        areas={areas}
        activeAreaId={selectedAreaId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* MODAL GESTIONE STANZE & SALE */}
      <AreasManagementModal
        areas={areas}
        tablesCountByArea={tablesCountByArea}
        isOpen={isAreasModalOpen}
        onClose={() => setIsAreasModalOpen(false)}
        onAreaDeleted={(deletedId) => {
          if (selectedAreaId === deletedId) {
            setSelectedAreaId("ALL");
          }
        }}
      />
    </div>
  );
}
