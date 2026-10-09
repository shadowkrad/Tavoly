"use client";

import React, { useState, useTransition } from "react";
import {
  X,
  Clock,
  Phone,
  Users,
  MessageSquare,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Plus,
} from "lucide-react";
import { updateReservationStatus } from "@/app/actions";
import { CustomerProfileModal } from "./CustomerProfileModal";
import { CustomerProfileMapItem } from "@/components/ReservationsList";

interface ReservationItem {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  guestCount: number;
  timeSlot: string;
  status: string;
  notes: string | null;
  whatsappSent: boolean;
  isWalkIn?: boolean;
  table: {
    number: string;
    area: {
      name: string;
    };
  } | null;
}

interface ReservationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: ReservationItem[];
  hasWhatsAppModule: boolean;
  customerProfiles?: Record<string, CustomerProfileMapItem>;
  restaurantName?: string;
  onNewReservationClick?: () => void;
}

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  CONFERMATA: { label: "Confermata", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_ATTESA: { label: "In Attesa", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  SEDUTI: { label: "Accomodati", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETATA: { label: "Completata", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  ANNULLATA: { label: "Annullata", cls: "bg-red-50 text-red-700 border-red-200" },
};

export function ReservationsDrawer({
  isOpen,
  onClose,
  reservations,
  hasWhatsAppModule,
  customerProfiles = {},
  restaurantName = "Tavoly Restaurant",
  onNewReservationClick,
}: ReservationsDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");

  const [activeModalCustomer, setActiveModalCustomer] = useState<{
    profile: CustomerProfileMapItem;
    reservation: {
      timeSlot: string;
      guestCount: number;
      tableNumber?: string;
    };
  } | null>(null);

  if (!isOpen) return null;

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phoneNumber.includes(searchQuery);
    const matchesStatus =
      activeStatusFilter === "ALL" || r.status === activeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      await updateReservationStatus(id, newStatus);
    });
  };

  const handleOpenCustomer = (res: ReservationItem) => {
    const existing = customerProfiles[res.phoneNumber] || {
      phoneNumber: res.phoneNumber,
      name: res.customerName,
      notes: res.notes,
      visitCount: 1,
      loyaltyPoints: 10,
    };

    setActiveModalCustomer({
      profile: existing,
      reservation: {
        timeSlot: res.timeSlot,
        guestCount: res.guestCount,
        tableNumber: res.table?.number,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Prenotazioni del Servizio
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {reservations.length} totali
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ospiti in arrivo, coperti e assegnazione tavoli
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cerca cliente per nome o telefono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "ALL", label: "Tutte" },
                { key: "CONFERMATA", label: "In Arrivo" },
                { key: "SEDUTI", label: "Accomodati" },
                { key: "COMPLETATA", label: "Concluse" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveStatusFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeStatusFilter === f.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body: Reservations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">Nessuna prenotazione trovata</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Nessun cliente corrisponde ai filtri di ricerca impostati.
                </p>
              </div>
            ) : (
              filteredReservations.map((res) => {
                const badge = STATUS_BADGES[res.status] || STATUS_BADGES.CONFERMATA;
                const profile = customerProfiles[res.phoneNumber];

                return (
                  <div
                    key={res.id}
                    className="pt-3 first:pt-0 space-y-2.5 hover:bg-slate-50/50 p-2.5 rounded-2xl transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col items-center justify-center min-w-[50px] px-2 py-1.5 rounded-xl bg-slate-100 text-slate-900 border border-slate-200/80 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                          <span className="text-xs font-black">{res.timeSlot}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-sm font-bold text-slate-900">
                              {res.customerName}
                            </strong>
                            {profile && profile.visitCount > 1 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.5 rounded-md">
                                ★ {profile.visitCount}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              {res.guestCount} ospiti
                            </span>
                            <span>•</span>
                            <span className="text-slate-500">{res.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Dettagli Tavolo & Note */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {res.table ? (
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          Tavolo {res.table.number} ({res.table.area.name})
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 font-medium text-[11px]">
                          Tavolo non assegnato
                        </span>
                      )}

                      {res.notes && (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg text-[11px] truncate max-w-[220px]">
                          Note: {res.notes}
                        </span>
                      )}
                    </div>

                    {/* Azioni Rapide Prenotazione */}
                    <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => handleOpenCustomer(res)}
                        className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Dettagli / WhatsApp</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {res.status === "CONFERMATA" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(res.id, "SEDUTI")}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            Accomoda
                          </button>
                        )}
                        {res.status === "SEDUTI" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(res.id, "COMPLETATA")}
                            disabled={isPending}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            Completa
                          </button>
                        )}
                        {res.status !== "ANNULLATA" && res.status !== "COMPLETATA" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(res.id, "ANNULLATA")}
                            disabled={isPending}
                            className="px-2 py-1 rounded-lg hover:bg-red-50 text-red-600 font-semibold text-xs cursor-pointer"
                          >
                            Annulla
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Totale coperti attesi: <strong>{reservations.reduce((s, r) => s + r.guestCount, 0)}</strong>
            </span>
            {onNewReservationClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewReservationClick();
                }}
                className="taaaac-btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Nuova Prenotazione</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeModalCustomer && (
        <CustomerProfileModal
          customer={activeModalCustomer.profile}
          currentReservation={activeModalCustomer.reservation}
          restaurantName={restaurantName}
          onClose={() => setActiveModalCustomer(null)}
        />
      )}
    </div>
  );
}
