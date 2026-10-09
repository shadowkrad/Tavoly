"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  UtensilsCrossed,
  ShoppingBag,
  RotateCw,
  X,
  Check,
  Calendar,
} from "lucide-react";

export interface NotificaItem {
  id: string;
  tipo: "PRENOTAZIONE" | "ASPORTO" | "INFO";
  titolo: string;
  descrizione: string;
  timestamp: string;
  link?: string;
  isUnread: boolean;
}

interface Props {
  placement?: "sidebar" | "topbar";
  dark?: boolean;
}

const READ_IDS_KEY = "tavoly_notifiche_read_ids";
const LAST_READ_KEY = "tavoly_notifiche_last_read";

function getLocalReadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReadIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(ids.slice(-200)));
  } catch {
    // ignore
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return "meno di un minuto fa";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min fa`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `circa ${diffHours} ${diffHours === 1 ? "ora" : "ore"} fa`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "ieri";
    if (diffDays < 7) return `${diffDays} giorni fa`;
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function NotificationBell({ placement = "sidebar", dark = false }: Props) {
  const [open, setOpen] = useState(false);
  const [notifiche, setNotifiche] = useState<NotificaItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "PRENOTAZIONE" | "ASPORTO">("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifiche = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifiche");
      if (res.ok) {
        const data = await res.json();
        const rawItems: NotificaItem[] = data.notifiche || [];
        const readIds = new Set(getLocalReadIds());
        const lastRead = typeof window !== "undefined" ? localStorage.getItem(LAST_READ_KEY) : null;
        const lastReadDate = lastRead ? new Date(lastRead) : null;

        const updated = rawItems.map((n) => {
          const isRead =
            !n.isUnread ||
            readIds.has(n.id) ||
            (lastReadDate ? new Date(n.timestamp) <= lastReadDate : false);
          return { ...n, isUnread: !isRead };
        });

        setNotifiche(updated);
        setUnreadCount(updated.filter((n) => n.isUnread).length);
      }
    } catch (e) {
      console.warn("Errore fetch notifiche Tavoly:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifiche();
    const interval = setInterval(fetchNotifiche, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifiche]);

  const markAllAsRead = useCallback(() => {
    const allIds = notifiche.map((n) => n.id);
    const existing = getLocalReadIds();
    const merged = Array.from(new Set([...existing, ...allIds]));
    saveLocalReadIds(merged);

    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    }

    setUnreadCount(0);
    setNotifiche((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }, [notifiche]);

  const markOneAsRead = useCallback((id: string) => {
    const current = getLocalReadIds();
    if (!current.includes(id)) {
      saveLocalReadIds([...current, id]);
    }
    setNotifiche((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Chiudi cliccando fuori
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = notifiche.filter((n) => {
    if (filter === "ALL") return true;
    return n.tipo === filter;
  });

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Icona Campanella */}
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifiche();
        }}
        className={`relative p-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
          dark
            ? "text-emerald-200 hover:text-white hover:bg-emerald-900/80"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        }`}
        aria-label="Notifiche Tavoly"
        title={unreadCount > 0 ? `${unreadCount} nuove notifiche` : "Nessuna nuova notifica"}
      >
        <Bell className={`w-5 h-5 ${dark ? "text-emerald-200" : "text-slate-700"}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] font-black text-white items-center justify-center shadow-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown Notifiche con posizionamento corretto identico a Schedly */}
      {open && (
        <>
          {/* Backdrop mobile per chiudere facilmente al tap fuori */}
          <div
            className="fixed inset-0 bg-slate-950/40 z-40 md:hidden backdrop-blur-2xs"
            onClick={() => setOpen(false)}
          />

          <div
            className={
              placement === "sidebar"
                ? "fixed inset-x-3 top-16 max-w-sm mx-auto md:max-w-none md:mx-0 md:fixed md:left-[268px] md:top-4 md:w-96 md:inset-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
                : "fixed inset-x-3 top-14 max-w-sm mx-auto sm:max-w-none sm:mx-0 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:inset-x-auto bg-white rounded-2xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            }
          >
            {/* Header Popover */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔔</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                    Notifiche & Attività
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    {unreadCount > 0 ? `${unreadCount} da verificare` : "Tutto aggiornato"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    Segna lette ✓
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filtri Notifiche a Tab */}
            <div className="px-3 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
              {[
                { key: "ALL", label: "Tutte" },
                { key: "PRENOTAZIONE", label: "🍽️ Prenotazioni" },
                { key: "ASPORTO", label: "🛍️ Asporto" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key as any)}
                  className={`px-3 py-1 rounded-xl transition-all shrink-0 cursor-pointer ${
                    filter === t.key
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Lista Notifiche */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <span className="text-3xl block">✨</span>
                  <p className="text-xs font-semibold text-slate-700">Nessuna notifica in questa sezione</p>
                  <p className="text-[10px] text-slate-400">Tutte le attività di sala e cucina sono aggiornate!</p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isBooking = item.tipo === "PRENOTAZIONE";
                  return (
                    <Link
                      key={item.id}
                      href={item.link || (isBooking ? "/dashboard/prenotazioni" : "/dashboard/asporto")}
                      onClick={() => {
                        markOneAsRead(item.id);
                        setOpen(false);
                      }}
                      className={`block p-3.5 transition-colors hover:bg-emerald-50/50 ${
                        item.isUnread ? "bg-emerald-50/30" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm mt-0.5 border shadow-2xs ${
                            isBooking
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {isBooking ? (
                            <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-amber-700" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-bold text-slate-900 text-xs truncate">
                              {item.titolo}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2">
                            {item.descrizione}
                          </p>

                          {item.isUnread && (
                            <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-full">
                              Nuova
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/dashboard/prenotazioni"
                onClick={() => setOpen(false)}
                className="font-bold text-emerald-700 hover:text-emerald-900 hover:underline px-2"
              >
                Tutte le prenotazioni →
              </Link>

              <button
                type="button"
                onClick={fetchNotifiche}
                disabled={isLoading}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                <span>Aggiorna</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
