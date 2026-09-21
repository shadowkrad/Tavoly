"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, UtensilsCrossed, Clock, Check } from "lucide-react";

interface NotificaItem {
  id: string;
  tipo: "PRENOTAZIONE" | "ASPORTO" | "INFO";
  titolo: string;
  descrizione: string;
  timestamp: string;
  isUnread: boolean;
}

interface Props {
  placement?: "sidebar" | "topbar";
  dark?: boolean;
}

const READ_IDS_KEY = "tavoly_notifiche_read_ids";

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

export default function NotificationBell({ placement = "sidebar", dark = false }: Props) {
  const [open, setOpen] = useState(false);
  const [notifiche, setNotifiche] = useState<NotificaItem[]>([
    {
      id: "tn1",
      tipo: "PRENOTAZIONE",
      titolo: "Nuova Prenotazione Tavolo",
      descrizione: "4 persone stasera ore 20:30 (Dehors)",
      timestamp: new Date().toISOString(),
      isUnread: true,
    },
    {
      id: "tn2",
      tipo: "ASPORTO",
      titolo: "Nuovo Ordine Takeaway",
      descrizione: "2 Pizze + 1 Frittura per le 19:45",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isUnread: false,
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(1);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readIds = new Set(getLocalReadIds());
    setNotifiche((prev) =>
      prev.map((n) => ({ ...n, isUnread: !readIds.has(n.id) && n.isUnread }))
    );
  }, []);

  useEffect(() => {
    setUnreadCount(notifiche.filter((n) => n.isUnread).length);
  }, [notifiche]);

  const markAllAsRead = () => {
    const allIds = notifiche.map((n) => n.id);
    saveLocalReadIds(allIds);
    setNotifiche((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const markOneAsRead = (id: string) => {
    const current = getLocalReadIds();
    if (!current.includes(id)) {
      saveLocalReadIds([...current, id]);
    }
    setNotifiche((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isUnread: false } : n))
    );
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
          dark
            ? "text-emerald-200 hover:text-white hover:bg-emerald-900/80"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        }`}
        aria-label="Notifiche"
      >
        <Bell className={`w-5 h-5 ${dark ? "text-emerald-200" : "text-slate-700"}`} />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse ring-2 ${
              dark ? "ring-emerald-950" : "ring-white"
            }`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ${
            placement === "sidebar" ? "left-0 sm:left-auto right-0" : "right-0"
          }`}
        >
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900">Notifiche Tavoly</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                  {unreadCount} nuove
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                Segna tutte lette
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifiche.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nessuna notifica
              </div>
            ) : (
              notifiche.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markOneAsRead(item.id)}
                  className={`p-3 text-xs transition-colors cursor-pointer flex items-start gap-2.5 ${
                    item.isUnread ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-bold text-slate-900 truncate">{item.titolo}</p>
                      {item.isUnread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                      {item.descrizione}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/prenotazioni"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Vedi tutte le prenotazioni →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
