"use client";

import React, { useTransition, useState } from "react";
import { Clock, Phone, UserCheck, MessageSquare, Check, X, Users, AlertCircle, Award, ExternalLink } from "lucide-react";
import { updateReservationStatus } from "@/app/actions";
import { CustomerProfileModal } from "./dashboard/CustomerProfileModal";

export interface CustomerProfileMapItem {
  phoneNumber: string;
  name: string;
  notes: string | null;
  visitCount: number;
  loyaltyPoints: number;
}

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

interface ReservationsListProps {
  reservations: ReservationItem[];
  hasWhatsAppModule: boolean;
  customerProfiles?: Record<string, CustomerProfileMapItem>;
  restaurantName?: string;
}

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  CONFERMATA: { label: "Confermata", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_ATTESA: { label: "In Attesa", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  SEDUTI: { label: "Accomodati", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETATA: { label: "Completata", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  ANNULLATA: { label: "Annullata", cls: "bg-red-50 text-red-700 border-red-200" },
};

export function ReservationsList({
  reservations,
  hasWhatsAppModule,
  customerProfiles = {},
  restaurantName = "Trattoria Moderna Da Taaaac",
}: ReservationsListProps) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const [activeModalCustomer, setActiveModalCustomer] = useState<{
    profile: CustomerProfileMapItem;
    reservation: {
      timeSlot: string;
      guestCount: number;
      tableNumber?: string;
    };
  } | null>(null);

  const handleStatusChange = (id: string, newStatus: string) => {
    setActiveId(id);
    startTransition(async () => {
      await updateReservationStatus(id, newStatus);
      setActiveId(null);
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
    <div className="taaaac-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Prenotazioni del Servizio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              {reservations.length} totali
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Clicca sul nome del cliente per aprire scheda & WhatsApp
          </p>
        </div>

        {hasWhatsAppModule && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/80 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Bot</span>
          </div>
        )}
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-slate-600">Nessuna prenotazione attiva per oggi</p>
          <p className="text-xs text-slate-400 mt-1">Usa il tasto &quot;Nuova Prenotazione&quot; per registrare un cliente.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {reservations.map((res) => {
            const badge = STATUS_BADGES[res.status] || STATUS_BADGES.CONFERMATA;
            const isRowBusy = isPending && activeId === res.id;
            const profile = customerProfiles[res.phoneNumber];

            return (
              <div
                key={res.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
              >
                {/* Info Cliente & Orario */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex flex-col items-center justify-center min-w-[52px] px-2 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
                    <Clock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                    <span className="text-xs font-bold">{res.timeSlot}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenCustomer(res)}
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 cursor-pointer text-left"
                        title="Apri scheda ospite & storico"
                      >
                        <span>{res.customerName}</span>
                        {profile && profile.visitCount > 1 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-1.5 py-0.2 rounded-md">
                            ★ {profile.visitCount}
                          </span>
                        )}
                      </button>

                      <span className={`taaaac-badge border text-[11px] ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {res.guestCount} {res.guestCount === 1 ? "ospite" : "ospiti"}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenCustomer(res)}
                        className="flex items-center gap-1 hover:text-blue-600 text-slate-500 cursor-pointer"
                        title="Apri WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{res.phoneNumber}</span>
                      </button>

                      {res.table && (
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          Tavolo {res.table.number} ({res.table.area.name})
                        </span>
                      )}
                    </div>

                    {res.notes && (
                      <p className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md mt-1.5 inline-block font-medium border border-amber-200/50">
                        Nota: {res.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenCustomer(res)}
                    className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 rounded-xl transition-colors cursor-pointer"
                    title="Scheda Ospite & WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  {res.status !== "SEDUTI" && res.status !== "COMPLETATA" && (
                    <button
                      disabled={isRowBusy}
                      onClick={() => handleStatusChange(res.id, "SEDUTI")}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Accomoda gli ospiti al tavolo"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Accomoda</span>
                    </button>
                  )}

                  {res.status === "SEDUTI" && (
                    <button
                      disabled={isRowBusy}
                      onClick={() => handleStatusChange(res.id, "COMPLETATA")}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                      title="Segna come completata"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Completa</span>
                    </button>
                  )}

                  {res.status !== "ANNULLATA" && res.status !== "COMPLETATA" && (
                    <button
                      disabled={isRowBusy}
                      onClick={() => handleStatusChange(res.id, "ANNULLATA")}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      title="Annulla prenotazione"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Profile & WhatsApp Modal */}
      {activeModalCustomer && (
        <CustomerProfileModal
          customer={activeModalCustomer.profile}
          restaurantName={restaurantName}
          currentReservation={activeModalCustomer.reservation}
          onClose={() => setActiveModalCustomer(null)}
        />
      )}
    </div>
  );
}
