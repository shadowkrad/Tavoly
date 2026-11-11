"use client";

import React, { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Star,
  AlertTriangle,
  Award,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  MessageCircle,
  Plus,
  Trash2,
  Calendar,
  Copy,
  Check,
  ChevronRight,
  Filter,
  Loader2,
  ExternalLink,
  Receipt,
} from "lucide-react";
import {
  CustomerModal,
  CustomerReservationHistoryItem,
  CustomerTableOrderHistoryItem,
  CustomerTakeawayHistoryItem,
  CustomerHistoryBundle,
} from "./CustomerModal";
import { incrementCustomerVisitsAction, deleteCustomerAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export interface CustomerProfileData {
  id: string;
  phoneNumber: string;
  name: string;
  email: string | null;
  allergies: string | null;
  favoriteTable: string | null;
  isVip: boolean;
  notes: string | null;
  visitCount: number;
  loyaltyPoints: number;
  lastVisitAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface TableItem {
  id: string;
  number: string;
  area?: {
    name: string;
  };
}

interface CustomersManagementViewProps {
  initialCustomers: CustomerProfileData[];
  tables: TableItem[];
  reservations?: CustomerReservationHistoryItem[];
  tableOrders?: CustomerTableOrderHistoryItem[];
  takeawayOrders?: CustomerTakeawayHistoryItem[];
  restaurantName?: string;
}

export function CustomersManagementView({
  initialCustomers,
  tables,
  reservations = [],
  tableOrders = [],
  takeawayOrders = [],
  restaurantName = "Tavoly Restaurant",
}: CustomersManagementViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "VIP" | "ALLERGIES" | "FREQUENT">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfileData | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"PROFILE" | "HISTORY">("PROFILE");

  // Costruzione mappa storico completo (prenotazioni, comande tavolo, asporto e spesa totale) per ogni cliente
  const historyByCustomerId = useMemo(() => {
    const normalizePhone = (p: string | null | undefined) =>
      (p || "").replace(/[^0-9]/g, "").slice(-9);
    const normalizeName = (n: string | null | undefined) =>
      (n || "").trim().toLowerCase();

    const map: Record<string, CustomerHistoryBundle> = {};

    for (const c of initialCustomers) {
      const cPhone = normalizePhone(c.phoneNumber);
      const cName = normalizeName(c.name);

      const custRes = reservations.filter((r) => {
        const rPhone = normalizePhone(r.phoneNumber);
        const rName = normalizeName(r.customerName);
        return (cPhone.length >= 6 && rPhone === cPhone) || (cName.length >= 3 && rName === cName);
      });

      const custResIds = new Set(custRes.map((r) => r.id));

      const custTableOrders = tableOrders.filter((o) => {
        if (o.reservationId && custResIds.has(o.reservationId)) return true;
        const oPhone = normalizePhone(o.customerPhone);
        const oName = normalizeName(o.customerName);
        return (cPhone.length >= 6 && oPhone === cPhone) || (cName.length >= 3 && oName === cName);
      });

      const custTakeaway = takeawayOrders.filter((t) => {
        const tPhone = normalizePhone(t.phoneNumber);
        const tName = normalizeName(t.customerName);
        return (cPhone.length >= 6 && tPhone === cPhone) || (cName.length >= 3 && tName === cName);
      });

      const totalSpent =
        custTableOrders
          .filter((o) => o.status !== "ANNULLATO")
          .reduce((acc, o) => acc + Number(o.totalAmount || 0), 0) +
        custTakeaway
          .filter((t) => t.status !== "ANNULLATO")
          .reduce((acc, t) => acc + Number(t.totalAmount || 0), 0);

      map[c.id] = {
        reservations: custRes,
        tableOrders: custTableOrders,
        takeawayOrders: custTakeaway,
        totalSpent,
      };
    }

    return map;
  }, [initialCustomers, reservations, tableOrders, takeawayOrders]);

  // Quick feedback states
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics computation
  const metrics = useMemo(() => {
    const total = initialCustomers.length;
    const vips = initialCustomers.filter((c) => c.isVip).length;
    const withAllergies = initialCustomers.filter((c) => c.allergies && c.allergies.trim().length > 0).length;
    const totalVisits = initialCustomers.reduce((acc, c) => acc + (c.visitCount || 0), 0);
    return { total, vips, withAllergies, totalVisits };
  }, [initialCustomers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return initialCustomers.filter((c) => {
      // Tab filter
      if (activeFilter === "VIP" && !c.isVip) return false;
      if (activeFilter === "ALLERGIES" && (!c.allergies || !c.allergies.trim())) return false;
      if (activeFilter === "FREQUENT" && (c.visitCount || 0) < 5) return false;

      // Search query
      if (!q) return true;
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phoneNumber.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchTable = c.favoriteTable?.toLowerCase().includes(q);
      const matchAllergies = c.allergies?.toLowerCase().includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);

      return matchName || matchPhone || matchEmail || matchTable || matchAllergies || matchNotes;
    });
  }, [initialCustomers, searchQuery, activeFilter]);

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleIncrementVisit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await incrementCustomerVisitsAction(id, 0);
      router.refresh();
    });
  };

  const handleDeleteCustomer = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Sei sicuro di voler eliminare la scheda cliente di "${name}"?`)) {
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      await deleteCustomerAction(id);
      setDeletingId(null);
      router.refresh();
    });
  };

  const openWhatsApp = (customer: CustomerProfileData, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = customer.phoneNumber.replace(/[^0-9+]/g, "");
    const msg = encodeURIComponent(
      `Gentile ${customer.name},\nLa ringraziamo per essere un ospite di ${restaurantName}.\nPer qualsiasi richiesta o per prenotare il Suo tavolo preferito, siamo sempre a Sua completa disposizione!\nA presto dallo Staff.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  const tableSuggestions = useMemo(() => {
    return tables.map((t) => ({
      id: t.id,
      number: t.number,
      areaName: t.area?.name,
    }));
  }, [tables]);

  const formatDate = (dateVal: string | Date | null | undefined) => {
    if (!dateVal) return "N/D";
    try {
      const d = new Date(dateVal);
      return d.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/D";
    }
  };

  return (
    <>
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Gestionale Clienti & Ospiti (CRM)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Anagrafica ospiti con tavolo preferito, intolleranze alimentari segnalate, visite e punti fedeltà.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedCustomer(null);
            setIsModalOpen(true);
          }}
          className="taaaac-btn-primary px-5 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuovo Ospite</span>
        </button>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Totale Ospiti */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Totale Ospiti
            </span>
            <strong className="text-2xl font-black text-slate-900">{metrics.total}</strong>
            <span className="text-[10px] text-slate-500 block">nel database</span>
          </div>
        </div>

        {/* Ospiti VIP */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Ospiti VIP
            </span>
            <strong className="text-2xl font-black text-amber-950">{metrics.vips}</strong>
            <span className="text-[10px] text-amber-600 font-semibold block">trattamento speciale</span>
          </div>
        </div>

        {/* Intolleranze & Allergeni */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Con Intolleranze
            </span>
            <strong className="text-2xl font-black text-rose-950">{metrics.withAllergies}</strong>
            <span className="text-[10px] text-rose-600 font-semibold block">allergeni segnalati</span>
          </div>
        </div>

        {/* Totale Cene Registrate */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Totale Cene
            </span>
            <strong className="text-2xl font-black text-blue-950">{metrics.totalVisits}</strong>
            <span className="text-[10px] text-blue-600 font-semibold block">visite al locale</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Tabs Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input with generous padding */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per nome, telefono, tavolo preferito, allergie o note..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancella
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <button
              type="button"
              onClick={() => setActiveFilter("ALL")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tutti ({metrics.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("VIP")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeFilter === "VIP"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>VIP ({metrics.vips})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("ALLERGIES")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeFilter === "ALLERGIES"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Con Allergeni ({metrics.withAllergies})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("FREQUENT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeFilter === "FREQUENT"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Frequenti (5+)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer List: Mobile Compact Rows + Desktop Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Nessun ospite trovato</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nessun cliente corrisponde ai criteri di ricerca o ai filtri selezionati.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("ALL");
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Azzera Filtri
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* VISTA MOBILE: RIGHE COMPATTE */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredCustomers.map((c) => {
              const hasAllergies = Boolean(c.allergies && c.allergies.trim());
              const hasFavoriteTable = Boolean(c.favoriteTable && c.favoriteTable.trim());
              const historyCount =
                (historyByCustomerId[c.id]?.reservations.length || 0) +
                (historyByCustomerId[c.id]?.tableOrders.length || 0) +
                (historyByCustomerId[c.id]?.takeawayOrders.length || 0);
              const totalSpent = historyByCustomerId[c.id]?.totalSpent || 0;

              return (
                <div key={c.id} className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                        {c.isVip && (
                          <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current text-amber-600" />
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                        <a href={`tel:${c.phoneNumber}`} className="font-mono font-semibold text-emerald-700">
                          {c.phoneNumber}
                        </a>
                        <button
                          type="button"
                          title="Copia numero"
                          onClick={(e) => handleCopyPhone(c.phoneNumber, e)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                        >
                          {copiedPhone === c.phoneNumber ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {c.email && <div className="text-[11px] text-slate-400 truncate">{c.email}</div>}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className="inline-block text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {c.visitCount} Cene
                      </span>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {c.loyaltyPoints} pt
                        </span>
                        {totalSpent > 0 && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            € {totalSpent.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(hasFavoriteTable || hasAllergies || (c.notes && c.notes.trim())) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {hasFavoriteTable && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {c.favoriteTable}
                        </span>
                      )}
                      {hasAllergies && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {c.allergies}
                        </span>
                      )}
                      {c.notes && c.notes.trim() && (
                        <span className="text-slate-500 truncate max-w-full">
                          📝 {c.notes}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => openWhatsApp(c, e)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleIncrementVisit(c.id, e)}
                        disabled={isPending}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                        +1 Cena
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setModalInitialTab("HISTORY");
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Receipt className="w-3 h-3 text-amber-600" />
                        {historyCount}
                      </button>
                      <Link
                        href={`/dashboard/clienti/${c.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-[11px]"
                      >
                        Scheda →
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === c.id || isPending}
                        onClick={(e) => handleDeleteCustomer(c.id, c.name, e)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                        title="Elimina scheda"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISTA DESKTOP: TABELLA A RIGHE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Ospite</th>
                  <th className="px-5 py-3">Contatti</th>
                  <th className="px-5 py-3">Tavolo &amp; Allergeni</th>
                  <th className="px-5 py-3">Visite &amp; Fedeltà</th>
                  <th className="px-5 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((c) => {
                  const hasAllergies = Boolean(c.allergies && c.allergies.trim());
                  const hasFavoriteTable = Boolean(c.favoriteTable && c.favoriteTable.trim());
                  const hasNotes = Boolean(c.notes && c.notes.trim());
                  const historyCount =
                    (historyByCustomerId[c.id]?.reservations.length || 0) +
                    (historyByCustomerId[c.id]?.tableOrders.length || 0) +
                    (historyByCustomerId[c.id]?.takeawayOrders.length || 0);
                  const totalSpent = historyByCustomerId[c.id]?.totalSpent || 0;

                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors ${
                        c.isVip ? "bg-amber-50/20 hover:bg-amber-50/40" : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Ospite */}
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              c.isVip
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {c.isVip ? "⭐" : c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900">{c.name}</span>
                              {c.isVip && (
                                <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current text-amber-600" />
                                  VIP
                                </span>
                              )}
                            </div>
                            {hasNotes && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[230px] mt-0.5" title={c.notes || ""}>
                                📝 {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contatti */}
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${c.phoneNumber}`}
                            className="text-xs text-emerald-700 font-mono font-bold hover:underline"
                          >
                            {c.phoneNumber}
                          </a>
                          <button
                            type="button"
                            title="Copia numero"
                            onClick={(e) => handleCopyPhone(c.phoneNumber, e)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            {copiedPhone === c.phoneNumber ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {c.email && (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-[11px] text-slate-500 hover:text-slate-700 block truncate max-w-[210px] mt-0.5"
                          >
                            {c.email}
                          </a>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Ultima visita: {formatDate(c.lastVisitAt)}
                        </div>
                      </td>

                      {/* Tavolo & Allergeni */}
                      <td className="px-5 py-3.5 align-top space-y-1">
                        {hasFavoriteTable ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                            <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{c.favoriteTable}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">Tavolo standard</div>
                        )}
                        {hasAllergies ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{c.allergies}</span>
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Nessun allergene</span>
                          </div>
                        )}
                      </td>

                      {/* Visite & Fedeltà */}
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.visitCount} Cene
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {c.loyaltyPoints} pt
                          </span>
                        </div>
                        {totalSpent > 0 && (
                          <div className="text-[11px] font-bold text-amber-800 mt-1">
                            Spesa: € {totalSpent.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Azioni */}
                      <td className="px-5 py-3.5 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Apri WhatsApp"
                            onClick={(e) => openWhatsApp(c, e)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Registra +1 Cena"
                            onClick={(e) => handleIncrementVisit(c.id, e)}
                            disabled={isPending}
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] inline-flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                            <span>1 Cena</span>
                          </button>
                          <button
                            type="button"
                            title="Anteprima Storico Prenotazioni & Comande"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setModalInitialTab("HISTORY");
                              setIsModalOpen(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3 h-3 text-amber-600" />
                            <span>{historyCount}</span>
                          </button>
                          <Link
                            href={`/dashboard/clienti/${c.id}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                            title="Apri scheda completa, tessera punti e modifica dati"
                          >
                            Scheda →
                          </Link>
                          <button
                            type="button"
                            title="Elimina scheda"
                            disabled={deletingId === c.id || isPending}
                            onClick={(e) => handleDeleteCustomer(c.id, c.name, e)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

    {/* Modal Nuovo Ospite / Anteprima Storico */}
    <CustomerModal
      isOpen={isModalOpen}
      customer={selectedCustomer}
      tables={tableSuggestions}
      initialTab={modalInitialTab}
      history={selectedCustomer ? historyByCustomerId[selectedCustomer.id] || null : null}
      onClose={() => {
        setIsModalOpen(false);
        setSelectedCustomer(null);
        setModalInitialTab("PROFILE");
      }}
      onSuccess={() => {
        router.refresh();
      }}
    />
    </>
  );
}
