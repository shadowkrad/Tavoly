"use client";

import React, { useState, useMemo, useTransition } from "react";
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
  Edit3,
  Trash2,
  Calendar,
  Copy,
  Check,
  ChevronRight,
  Filter,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { CustomerModal } from "./CustomerModal";
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
  restaurantName?: string;
}

export function CustomersManagementView({
  initialCustomers,
  tables,
  restaurantName = "Tavoly Restaurant",
}: CustomersManagementViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "VIP" | "ALLERGIES" | "FREQUENT">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfileData | null>(null);

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
      await incrementCustomerVisitsAction(id, 10);
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

      {/* Customer Cards Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCustomers.map((c) => {
            const hasAllergies = Boolean(c.allergies && c.allergies.trim());
            const hasFavoriteTable = Boolean(c.favoriteTable && c.favoriteTable.trim());
            const hasNotes = Boolean(c.notes && c.notes.trim());

            return (
              <div
                key={c.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                  c.isVip
                    ? "border-amber-300 ring-1 ring-amber-300/40 hover:shadow-md"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                {/* Header Card: Avatar + Name + Badges */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-xs ${
                          c.isVip
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {c.isVip ? "⭐" : c.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Name & Phone */}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900 leading-tight">
                            {c.name}
                          </h3>
                          {c.isVip && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current text-amber-600" />
                              VIP
                            </span>
                          )}
                        </div>

                        {/* Phone with click to call & copy */}
                        <div className="flex items-center gap-2 mt-1">
                          <a
                            href={`tel:${c.phoneNumber}`}
                            className="text-xs text-slate-500 font-mono font-semibold flex items-center gap-1 hover:text-emerald-700 transition-colors"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{c.phoneNumber}</span>
                          </a>
                          <button
                            type="button"
                            title="Copia numero"
                            onClick={(e) => handleCopyPhone(c.phoneNumber, e)}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
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
                            className="text-[11px] text-slate-400 flex items-center gap-1 hover:text-slate-600 transition-colors mt-0.5 truncate max-w-[200px]"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{c.email}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Visite & Punti Pills */}
                    <div className="text-right space-y-1 shrink-0">
                      <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {c.visitCount} Cene
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-block">
                          {c.loyaltyPoints} Punti
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informazioni di Sala & Allergeni */}
                  <div className="space-y-2 pt-1 text-xs">
                    {/* Tavolo Preferito */}
                    {hasFavoriteTable && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Tavolo preferito: <strong>{c.favoriteTable}</strong></span>
                      </div>
                    )}

                    {/* BOX ALLERGENI & INTOLLERANZE (Evidenziato per sicurezza di sala) */}
                    {hasAllergies ? (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Intolleranze & Allergeni Segnalati</span>
                        </div>
                        <p className="font-semibold text-xs text-rose-900 pl-5">
                          {c.allergies}
                        </p>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1 rounded-lg bg-slate-50/50 border border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Nessun allergene noto segnalato</span>
                      </div>
                    )}

                    {/* Note di Sala */}
                    {hasNotes && (
                      <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/70 text-slate-700 text-xs space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                          <FileText className="w-3 h-3 text-amber-600" />
                          <span>Note di Sala & Preferenze</span>
                        </div>
                        <p className="text-slate-600">{c.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Ultima visita:</span>
                      <span className="font-semibold text-slate-600">
                        {formatDate(c.lastVisitAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Azioni Rapide */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp */}
                    <button
                      type="button"
                      title="Apri WhatsApp"
                      onClick={(e) => openWhatsApp(c, e)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    {/* +1 Visita rapida */}
                    <button
                      type="button"
                      title="Registra +1 Cena e +10 Punti"
                      onClick={(e) => handleIncrementVisit(c.id, e)}
                      disabled={isPending}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-600" />
                      <span>+1 Cena</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Modifica */}
                    <button
                      type="button"
                      title="Modifica scheda"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Elimina */}
                    <button
                      type="button"
                      title="Elimina scheda"
                      disabled={deletingId === c.id || isPending}
                      onClick={(e) => handleDeleteCustomer(c.id, c.name, e)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Inserimento / Modifica Cliente */}
      <CustomerModal
        isOpen={isModalOpen}
        customer={selectedCustomer}
        tables={tableSuggestions}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
