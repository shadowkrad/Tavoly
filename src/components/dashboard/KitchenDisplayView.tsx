"use client";

import React, { useState, useEffect, useRef, useTransition, useMemo } from "react";
import {
  ChefHat,
  Clock,
  Utensils,
  Bell,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Maximize,
  RefreshCw,
  Plus,
  ArrowRight,
  Filter,
  Check,
  ShoppingBag,
  Flame,
  Sparkles,
} from "lucide-react";
import {
  updateTableOrderStatusAction,
  updateTakeawayOrderStatusAction,
  deleteTableOrderAction,
} from "@/app/actions";
import { WaiterOrderModal } from "@/components/dashboard/WaiterOrderModal";

export interface KdsOrderItem {
  dishId?: string;
  name: string;
  category?: string;
  quantity: number;
  price?: number;
  variants?: string[];
}

export interface KdsOrder {
  id: string;
  type: "TABLE" | "TAKEAWAY";
  title: string;
  tableNumber: string;
  coverCount: number;
  waiterName: string;
  status: string;
  notes: string | null;
  totalAmount: number;
  createdAt: string;
  minutesWaiting: number;
  items: KdsOrderItem[];
}

interface KitchenDisplayViewProps {
  restaurantName?: string;
  isStandalone?: boolean;
}

export function KitchenDisplayView({
  restaurantName = "Tavoly Cucina",
  isStandalone = false,
}: KitchenDisplayViewProps) {
  const [isPending, startTransition] = useTransition();

  // Ordini attivi
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Suono notifiche
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  // Orologio digitale in tempo reale
  const [currentTime, setCurrentTime] = useState<string>("");

  // Modal nuova comanda
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // Aggiorna orologio ogni secondo
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Beep Audio sintetico tramite Web Audio API (senza file esterni)
  const playNewOrderBeep = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // Primo tono
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);

      // Secondo tono più acuto a campana
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.25); // A5
      gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Impossibile riprodurre beep comanda:", e);
    }
  };

  // Funzione di fetch degli ordini
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/kds/orders", { cache: "no-store" });
      const data = await res.json();
      if (data && data.success && Array.isArray(data.orders)) {
        const newOrders: KdsOrder[] = data.orders;

        // Se ci sono nuovi ordini rispetto alla rilevazione precedente, suona il beep!
        const newIds = new Set(newOrders.map((o) => o.id));
        const prevIds = previousOrderIdsRef.current;

        let hasNewlyArrived = false;
        if (prevIds.size > 0) {
          for (const id of newIds) {
            if (!prevIds.has(id)) {
              hasNewlyArrived = true;
              break;
            }
          }
        }

        if (hasNewlyArrived) {
          playNewOrderBeep();
        }

        previousOrderIdsRef.current = newIds;
        setOrders(newOrders);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Errore polling KDS:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Polling automatico ogni 4 secondi
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Aggiornamento stato di una comanda
  const handleUpdateStatus = (order: KdsOrder, newStatus: string) => {
    // Aggiornamento ottimistico immediato
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    );

    startTransition(async () => {
      if (order.type === "TABLE") {
        await updateTableOrderStatusAction(order.id, newStatus);
      } else {
        await updateTakeawayOrderStatusAction(order.id, newStatus);
      }
      fetchOrders();
    });
  };

  // Filtro ordini visualizzati
  const filteredOrders = useMemo(() => {
    if (filterStatus === "ALL") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  // Conteggi per le card in testa
  const counts = useMemo(() => {
    return {
      all: orders.length,
      inCoda: orders.filter((o) => o.status === "IN_CODA").length,
      inPrep: orders.filter((o) => o.status === "IN_PREPARAZIONE").length,
      pronti: orders.filter((o) => o.status === "PRONTO").length,
    };
  }, [orders]);

  // Schermo intero (per browser / TV)
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen().catch((err) => console.log(err));
    }
  };

  return (
    <div
      className={`flex flex-col ${
        isStandalone
          ? "min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5"
          : "space-y-5"
      }`}
    >
      {/* HEADER MONITOR CUCINA FAST FOOD / KDS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sinistra: Titolo KDS, Orologio Digitale & Live Polling */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Monitor Cucina KDS
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live FIFO</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span className="text-amber-400 font-bold">{currentTime || "--:--:--"}</span>
              <span>•</span>
              <span className="truncate">{restaurantName}</span>
            </div>
          </div>
        </div>

        {/* Centro / Destra: Indicatori Stato e Azioni Rapide Cucina */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Tasto Nuova Comanda al Tavolo (per palmare / tablet vicino alla cucina) */}
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Comanda</span>
          </button>

          {/* Toggle Suono Beep */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              soundEnabled
                ? "bg-slate-800 text-amber-400 border-amber-500/30 hover:bg-slate-700"
                : "bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700"
            }`}
            title={soundEnabled ? "Suono attivo per nuovi ordini" : "Suono disattivato"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Schermo Intero per TV / Monitor a parete */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            title="Schermo intero (F11)"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Refresh manuale */}
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            title="Aggiorna comande"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* BARRA METRICHE & TABS FILTRO */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span>Tutte le Comande</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200 font-black">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("IN_CODA")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === "IN_CODA"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-slate-900/60 text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span>In Coda ⏳</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 font-black">
              {counts.inCoda}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("IN_PREPARAZIONE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === "IN_PREPARAZIONE"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-900/60 text-slate-400 hover:text-blue-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span>In Preparazione 👨‍🍳</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 font-black">
              {counts.inPrep}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("PRONTO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              filterStatus === "PRONTO"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-900/60 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span>Pronti al Pass 🔔</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-black">
              {counts.pronti}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Ultimo controllo: {lastRefreshed.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
      </div>

      {/* GRIGLIA TICKET KDS IN STILE FAST FOOD / CUCINA INTERNA */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-white">Cucina Pulita — Nessuna comanda in attesa!</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            I nuovi ordini inviati dai camerieri al tavolo o dal modulo asporto compariranno qui automaticamente in ordine di arrivo (FIFO).
          </p>
          <button
            type="button"
            onClick={() => setIsNewOrderModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 cursor-pointer inline-flex items-center gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Inserisci Comanda Manuale</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredOrders.map((order, index) => {
            // Calcolo urgenza timer
            const isLate = order.minutesWaiting >= 20;
            const isWarning = order.minutesWaiting >= 10 && order.minutesWaiting < 20;

            // Header color a seconda dello stato
            const isReady = order.status === "PRONTO";
            const isInPrep = order.status === "IN_PREPARAZIONE";

            return (
              <div
                key={order.id}
                className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-200 ${
                  isReady
                    ? "border-emerald-500 ring-2 ring-emerald-500/30"
                    : isLate
                    ? "border-rose-500 ring-2 ring-rose-500/40 animate-pulse"
                    : isInPrep
                    ? "border-blue-500/80"
                    : "border-slate-800"
                }`}
              >
                {/* TESTATA DEL TICKET: NUMERO TAVOLO CUBITALE + TIMER ATTESA */}
                <div
                  className={`p-3.5 border-b flex items-center justify-between ${
                    isReady
                      ? "bg-emerald-950/80 border-emerald-900 text-emerald-200"
                      : isLate
                      ? "bg-rose-950/80 border-rose-900 text-rose-200"
                      : isInPrep
                      ? "bg-blue-950/80 border-blue-900 text-blue-200"
                      : "bg-slate-800/80 border-slate-700 text-slate-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{index + 1}
                      </span>
                      <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                        {order.type === "TABLE" ? (
                          <>
                            <span>TAVOLO {order.tableNumber}</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4 text-amber-400" />
                            <span>{order.tableNumber}</span>
                          </>
                        )}
                      </h2>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-300">
                      {order.type === "TABLE" ? (
                        <span>
                          👥 {order.coverCount}p · Cameriere: {order.waiterName}
                        </span>
                      ) : (
                        <span>Cliente: {order.title.replace("Asporto: ", "")}</span>
                      )}
                    </div>
                  </div>

                  {/* TIMER ATTESA CUBITALE */}
                  <div
                    className={`px-3 py-1.5 rounded-2xl flex flex-col items-end ${
                      isLate
                        ? "bg-rose-600 text-white font-black"
                        : isWarning
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-slate-800 text-emerald-400 font-bold"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{order.minutesWaiting} min</span>
                    </div>
                    {isLate && (
                      <span className="text-[9px] uppercase font-black tracking-wider">
                        Ritardo!
                      </span>
                    )}
                  </div>
                </div>

                {/* CORPO DEL TICKET: LISTA PIATTI & VARIANTI EVIDENZIATE */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[320px]">
                  <div className="space-y-2.5">
                    {order.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/80 space-y-1"
                      >
                        {/* Nome piatto e quantità grande */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-sm text-white leading-tight">
                            <span className="text-amber-400 font-mono text-base mr-1.5">
                              {item.quantity}×
                            </span>
                            {item.name}
                          </span>
                        </div>

                        {/* VARIANTI EVIDENZIATE IN MODO INEQUIVOCABILE */}
                        {item.variants && item.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.variants.map((v, vIdx) => (
                              <span
                                key={vIdx}
                                className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 uppercase tracking-tight flex items-center gap-0.5 shadow-xs"
                              >
                                <span>⚡ {v}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* NOTE SPECIALI PER LA CUCINA */}
                  {order.notes && (
                    <div className="bg-amber-950/40 border border-amber-800/80 p-2.5 rounded-2xl text-xs text-amber-200 font-medium">
                      <span className="font-black text-amber-400 uppercase tracking-wider block text-[10px] mb-0.5">
                        ⚠️ Nota Comanda:
                      </span>
                      {order.notes}
                    </div>
                  )}
                </div>

                {/* FOOTER DEL TICKET: AZIONI TOUCH GIGANTI PER IL CUOCO */}
                <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                  {order.status === "IN_CODA" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(order, "IN_PREPARAZIONE")}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all active:scale-98"
                    >
                      <Flame className="w-4 h-4" />
                      <span>In Preparazione 👨‍🍳</span>
                    </button>
                  )}

                  {order.status === "IN_PREPARAZIONE" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(order, "PRONTO")}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all active:scale-98"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Pronto al Pass 🔔</span>
                    </button>
                  )}

                  {order.status === "PRONTO" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpdateStatus(order, "SERVITO")}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all active:scale-98"
                    >
                      <Check className="w-4 h-4" />
                      <span>Servito al Tavolo ✓</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE PRESA COMANDA CAMERIERE */}
      <WaiterOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={fetchOrders}
      />
    </div>
  );
}
