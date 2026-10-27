"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Smartphone,
  Minus,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  ChefHat,
  Filter,
} from "lucide-react";
import {
  updateTablePositionAction,
  updateTableStatus,
  updateTableSeatedCountAction,
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

export const STATUS_THEMES: Record<
  string,
  { label: string; badge: string; border: string; glow: string; bg: string; btnColor: string }
> = {
  LIBERO: {
    label: "Libero",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-400/80 hover:border-emerald-500",
    glow: "shadow-emerald-100/60",
    bg: "bg-white",
    btnColor: "bg-emerald-500 text-white hover:bg-emerald-600",
  },
  OCCUPATO: {
    label: "Occupato",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    border: "border-rose-400 hover:border-rose-500",
    glow: "shadow-rose-100",
    bg: "bg-rose-50/20",
    btnColor: "bg-rose-500 text-white hover:bg-rose-600",
  },
  PRENOTATO: {
    label: "Prenotato",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    border: "border-blue-400 hover:border-blue-500",
    glow: "shadow-blue-100",
    bg: "bg-blue-50/20",
    btnColor: "bg-blue-500 text-white hover:bg-blue-600",
  },
  CONTO: {
    label: "Conto",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    border: "border-amber-400 hover:border-amber-500",
    glow: "shadow-amber-100",
    bg: "bg-amber-50/30",
    btnColor: "bg-amber-500 text-white hover:bg-amber-600",
  },
  DA_PULIRE: {
    label: "Da Pulire",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
    border: "border-purple-400 hover:border-purple-500",
    glow: "shadow-purple-100",
    bg: "bg-purple-50/20",
    btnColor: "bg-purple-500 text-white hover:bg-purple-600",
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
  const [viewMode, setViewMode] = useState<"CANVAS" | "GRID" | "POCKET">("CANVAS");
  const [pocketStatusFilter, setPocketStatusFilter] = useState<string>("ALL");
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Auto-detect mobile: suggerisci Pocket o Griglia su display compatti
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setViewMode("POCKET");
    }
  }, []);

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
  const [touchDraggingTableId, setTouchDraggingTableId] = useState<string | null>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);

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

  // Drag & Drop con Mouse (HTML5 standard)
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

  // Touch Drag-and-Drop per iPad & Smartphone (Touch Gestures)
  const handleTouchStart = (e: React.TouchEvent, tableId: string) => {
    if (!isEditMode) return;
    setTouchDraggingTableId(tableId);
    const touch = e.touches[0];
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = ((touch.clientX - rect.left) / rect.width) * 100;
      const rawY = ((touch.clientY - rect.top) / rect.height) * 100;
      setTouchPos({
        x: Math.max(5, Math.min(92, rawX)),
        y: Math.max(8, Math.min(88, rawY)),
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isEditMode || !touchDraggingTableId || !canvasRef.current) return;
    // Evita scroll della pagina durante il drag touch
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((touch.clientX - rect.left) / rect.width) * 100;
    const rawY = ((touch.clientY - rect.top) / rect.height) * 100;
    setTouchPos({
      x: Math.max(5, Math.min(92, rawX)),
      y: Math.max(8, Math.min(88, rawY)),
    });
  };

  const handleTouchEnd = () => {
    if (!isEditMode || !touchDraggingTableId || !touchPos) {
      setTouchDraggingTableId(null);
      setTouchPos(null);
      return;
    }
    const id = touchDraggingTableId;
    const { x, y } = touchPos;
    setTouchDraggingTableId(null);
    setTouchPos(null);

    startTransition(async () => {
      await updateTablePositionAction(id, x, y);
    });
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.75, Math.round((z + 0.25) * 100) / 100));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.65, Math.round((z - 0.25) * 100) / 100));
  const handleZoomReset = () => setZoomLevel(1);

  // Quick 1-tap table actions per Vista Pocket
  const handleQuickStatusChange = (tableId: string, newStatus: string) => {
    startTransition(async () => {
      await updateTableStatus(tableId, newStatus);
    });
  };

  const handleQuickSeatedDelta = (tableId: string, delta: number) => {
    startTransition(async () => {
      await updateTableSeatedCountAction(tableId, delta);
    });
  };

  // Filtro Pocket
  const pocketTables = filteredTables.filter((t) => {
    if (pocketStatusFilter === "ALL") return true;
    return t.status === pocketStatusFilter;
  });

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-slate-200/90 space-y-4">
      {/* TOOLBAR SALE & CONTROLLI (RESPONSIVE & TOUCH-FRIENDLY) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        {/* Tabs delle Sale */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setSelectedAreaId("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedAreaId === area.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {area.name} ({count})
              </button>
            );
          })}

          {/* Tasto Gestione Sale */}
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
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Switch a 3 Viste: Pianta 2D, Pocket Cameriere, Griglia */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode("CANVAS")}
              title="Vista Planimetria 2D"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "CANVAS"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Planimetria 2D</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("POCKET")}
              title="Vista Rapida Pocket per Cameriere (Ottimizzata per Smartphone)"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "POCKET"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pocket Cameriere</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("GRID")}
              title="Vista a Griglia Classica"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "GRID"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Griglia</span>
            </button>
          </div>

          {/* Toggle Modalità Sposta Tavoli (Disponibile in Planimetria) */}
          {viewMode === "CANVAS" && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border ${
                isEditMode
                  ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Attiva modalità trascina e rilascia (Touch e Mouse) per modificare la pianta"
            >
              <Move className="w-3.5 h-3.5" />
              <span>{isEditMode ? "Fine Modifica" : "Modifica Pianta"}</span>
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

      {/* AVVISO MODALITA EDIT TOUCH & MOUSE */}
      {isEditMode && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modalità Touch & Drag Attiva:</strong> Trascina i tavoli con il mouse o con il dito per riposizionarli nella sala.
            </span>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer self-end sm:self-auto shadow-2xs"
          >
            Salva & Esci
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VISTA 1: CANVAS PLANIMETRIA 2D (TOUCH + ZOOM + DRAG)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "CANVAS" && (
        <div className="space-y-3">
          <div
            className="w-full overflow-auto rounded-3xl border-2 border-dashed border-slate-200/90 relative bg-slate-50/70 [scrollbar-width:thin] select-none"
            style={{ maxHeight: "680px" }}
          >
            {/* Canvas Area Scalabile tramite Zoom */}
            <div
              ref={canvasRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: zoomLevel > 1 ? `${100 * zoomLevel}%` : "100%",
                minWidth: zoomLevel > 1 ? `${720 * zoomLevel}px` : "620px",
                height: `${620 * zoomLevel}px`,
                minHeight: "520px",
                backgroundImage:
                  "radial-gradient(#94a3b8 1.1px, transparent 1.1px), radial-gradient(#94a3b8 1.1px, #f8fafc 1.1px)",
                backgroundSize: `${28 * zoomLevel}px ${28 * zoomLevel}px`,
                backgroundPosition: "0 0, 14px 14px",
                touchAction: isEditMode ? "none" : "auto",
              }}
              className="relative overflow-hidden transition-all duration-75"
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

                  // Se il tavolo è trascinato con touch, usa le coordinate live
                  const isTouchDragging = touchDraggingTableId === t.id;
                  const currentPosX = isTouchDragging && touchPos ? touchPos.x : t.posX;
                  const currentPosY = isTouchDragging && touchPos ? touchPos.y : t.posY;

                  return (
                    <div
                      key={t.id}
                      draggable={isEditMode}
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      onTouchStart={(e) => handleTouchStart(e, t.id)}
                      onClick={() => {
                        if (!isEditMode) setSelectedTableForDetail(t);
                      }}
                      style={{
                        left: `${currentPosX}%`,
                        top: `${currentPosY}%`,
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
                          ? "cursor-grab active:cursor-grabbing hover:scale-105 ring-2 ring-amber-400 touch-none"
                          : "hover:scale-105 hover:shadow-lg active:scale-95"
                      } ${isTouchDragging ? "opacity-80 scale-110 ring-4 ring-amber-500 z-50 shadow-2xl" : ""}`}
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
                          <span>
                            {t.seatedCount}/{t.capacity}
                          </span>
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

            {/* CONTROLLI ZOOM FLUTTUANTI IN BASSO A DESTRA */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1.5 rounded-2xl shadow-lg border border-slate-200/90 text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.65}
                className="p-1.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer transition"
                title="Rimpicciolisci mappa"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-2 py-1 rounded-xl hover:bg-slate-100 font-mono font-bold text-[11px] text-slate-800 cursor-pointer transition"
                title="Ripristina zoom 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 1.75}
                className="p-1.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer transition"
                title="Ingrandisci mappa"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          VISTA 2: POCKET CAMERIERE (TASCABILE SMARTPHONE & TABLET)
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "POCKET" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Barra Filtri Stato Rapidi per Cameriere */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setPocketStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                pocketStatusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutti ({filteredTables.length})
            </button>
            <button
              type="button"
              onClick={() => setPocketStatusFilter("LIBERO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                pocketStatusFilter === "LIBERO"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              🟢 Liberi ({filteredTables.filter((t) => t.status === "LIBERO").length})
            </button>
            <button
              type="button"
              onClick={() => setPocketStatusFilter("OCCUPATO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                pocketStatusFilter === "OCCUPATO"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            >
              🔴 Occupati ({filteredTables.filter((t) => t.status === "OCCUPATO").length})
            </button>
            <button
              type="button"
              onClick={() => setPocketStatusFilter("CONTO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                pocketStatusFilter === "CONTO"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              🟡 Conto ({filteredTables.filter((t) => t.status === "CONTO").length})
            </button>
            <button
              type="button"
              onClick={() => setPocketStatusFilter("DA_PULIRE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                pocketStatusFilter === "DA_PULIRE"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100"
              }`}
            >
              🟣 Da Pulire ({filteredTables.filter((t) => t.status === "DA_PULIRE").length})
            </button>
          </div>

          {/* Griglia Schede Pocket ad Alto Contrasto e Tasti Spessi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pocketTables.map((t) => {
              const theme = STATUS_THEMES[t.status] || STATUS_THEMES.LIBERO;
              const activeRes = reservationsByTable[t.id];

              return (
                <div
                  key={t.id}
                  className={`border-2 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-all space-y-3 ${theme.border}`}
                >
                  {/* Riga Superiore: Numero Tavolo, Area e Stato Attuale */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        {t.area.name} {t.shape === "BAR" ? "• Bancone" : ""}
                      </div>
                      <div className="text-xl font-black text-slate-900 tracking-tight">
                        Tavolo {t.number}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTableForDetail(t)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition cursor-pointer ${theme.badge}`}
                    >
                      {theme.label}
                    </button>
                  </div>

                  {/* Info Prenotazione se presente */}
                  {activeRes && (
                    <div className="p-2.5 bg-blue-50/80 border border-blue-200/60 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-blue-950 truncate">
                          👤 {activeRes.customerName}
                        </div>
                        <div className="text-[10px] text-blue-700 font-mono">
                          {activeRes.timeSlot} · {activeRes.guestCount} coperti
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${activeRes.phoneNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                        title="Invia WhatsApp al cliente"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  {/* Stepper Coperti Touch a Dito Grosso */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                    <span className="text-xs font-bold text-slate-700">Coperti Seduti:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickSeatedDelta(t.id, -1)}
                        disabled={t.seatedCount <= 0}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 cursor-pointer transition active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-xs font-black font-mono text-slate-900">
                        {t.seatedCount}/{t.capacity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickSeatedDelta(t.id, 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-2xs hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 cursor-pointer transition active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Barra 1-Tap Rapida Cambio Stato per Cameriere */}
                  <div className="pt-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                      Cambio Rapido 1-Tap:
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(t.id, "LIBERO")}
                        className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer active:scale-95 text-center ${
                          t.status === "LIBERO"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100"
                        }`}
                      >
                        Libero
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(t.id, "OCCUPATO")}
                        className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer active:scale-95 text-center ${
                          t.status === "OCCUPATO"
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100"
                        }`}
                      >
                        Occupato
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(t.id, "CONTO")}
                        className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer active:scale-95 text-center ${
                          t.status === "CONTO"
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                            : "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100"
                        }`}
                      >
                        Conto
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(t.id, "DA_PULIRE")}
                        className={`py-1.5 rounded-xl text-[10px] font-bold transition-all border cursor-pointer active:scale-95 text-center ${
                          t.status === "DA_PULIRE"
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-purple-50 text-purple-800 border-purple-200/80 hover:bg-purple-100"
                        }`}
                      >
                        Pulisci
                      </button>
                    </div>
                  </div>

                  {/* Pulsante Dettaglio & Comande */}
                  <button
                    type="button"
                    onClick={() => setSelectedTableForDetail(t)}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Dettaglio & Comande</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          VISTA 3: GRIGLIA CLASSICA DESKTOP
         ───────────────────────────────────────────────────────────── */}
      {viewMode === "GRID" && (
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
