"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  X,
  User,
  Phone,
  Mail,
  Users,
  Clock,
  Calendar,
  MapPin,
  MessageSquare,
  Trash2,
  CheckCircle,
  Clock3,
  Check,
  AlertCircle,
  ExternalLink,
  Award,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import {
  updateReservationDetailsAction,
  updateReservationStatus,
  assignTableToReservationAction,
  deleteReservationAction,
} from "@/app/actions";
import { BookingItem, BookingTableOption } from "./BookingsManagementView";
import { CustomerProfileMapItem } from "@/components/ReservationsList";
import { generateWhatsAppLink, buildConfirmationMessage, buildReminderMessage } from "@/lib/whatsapp";

interface ReservationDetailModalProps {
  reservation: BookingItem | null;
  tables: BookingTableOption[];
  customerProfiles: Record<string, CustomerProfileMapItem>;
  restaurantName: string;
  hasWhatsAppModule: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_BUTTONS = [
  {
    status: "IN_ATTESA",
    label: "In Attesa",
    icon: Clock3,
    color: "hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300",
    activeColor: "bg-amber-500 text-white border-amber-600 shadow-xs",
  },
  {
    status: "CONFERMATA",
    label: "Confermata",
    icon: CheckCircle,
    color: "hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300",
    activeColor: "bg-blue-600 text-white border-blue-700 shadow-xs",
  },
  {
    status: "SEDUTI",
    label: "Accomodati al Tavolo",
    icon: UtensilsCrossed,
    color: "hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300",
    activeColor: "bg-emerald-600 text-white border-emerald-700 shadow-xs",
  },
  {
    status: "COMPLETATA",
    label: "Completata / Libera",
    icon: Check,
    color: "hover:bg-slate-100 hover:text-slate-800 hover:border-slate-300",
    activeColor: "bg-slate-700 text-white border-slate-800 shadow-xs",
  },
  {
    status: "ANNULLATA",
    label: "Annullata",
    icon: X,
    color: "hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300",
    activeColor: "bg-rose-600 text-white border-rose-700 shadow-xs",
  },
];

const TIME_SLOT_OPTIONS = [
  "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"
];

function formatDisplayDate(dateVal: string | Date | undefined): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatInputDate(dateVal: string | Date | undefined): string {
  if (!dateVal) return new Date().toISOString().split("T")[0];
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ReservationDetailModal({
  reservation,
  tables,
  customerProfiles,
  restaurantName,
  hasWhatsAppModule,
  isOpen,
  onClose,
}: ReservationDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [tableId, setTableId] = useState<string>("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (reservation) {
      setTimeSlot(reservation.timeSlot || "20:30");
      setDateStr(formatInputDate(reservation.date));
      setTableId(reservation.tableId || "");
      setGuestCount(reservation.guestCount || 2);
      setNotes(reservation.notes || "");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [reservation]);

  if (!isOpen || !reservation) return null;

  const profile = customerProfiles[reservation.phoneNumber];

  const handleQuickStatus = (newStatus: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await updateReservationStatus(reservation.id, newStatus);
      if (res.success) {
        setSuccessMsg(`Stato aggiornato a ${newStatus}`);
        setTimeout(() => setSuccessMsg(null), 2500);
      } else {
        setErrorMsg(res.error || "Errore durante l'aggiornamento stato");
      }
    });
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await updateReservationDetailsAction(reservation.id, {
        timeSlot,
        date: dateStr,
        tableId: tableId === "" ? null : tableId,
        guestCount: Number(guestCount),
        notes: notes.trim() || null,
      });

      if (res.success) {
        setSuccessMsg("Prenotazione salvata con successo!");
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Errore durante il salvataggio");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm(`Sei sicuro di voler eliminare la prenotazione di ${reservation.customerName}?`)) {
      return;
    }
    startTransition(async () => {
      const res = await deleteReservationAction(reservation.id);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || "Errore durante l'eliminazione");
      }
    });
  };

  // WhatsApp link
  const waReminderLink = generateWhatsAppLink(
    reservation.phoneNumber,
    buildReminderMessage(
      restaurantName,
      reservation.customerName,
      timeSlot,
      guestCount
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scheda Prenotazione
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                reservation.status === "SEDUTI" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                reservation.status === "CONFERMATA" ? "bg-blue-50 text-blue-700 border-blue-200" :
                reservation.status === "IN_ATTESA" ? "bg-amber-50 text-amber-700 border-amber-200" :
                reservation.status === "ANNULLATA" ? "bg-rose-50 text-rose-700 border-rose-200" :
                "bg-slate-100 text-slate-700 border-slate-200"
              }`}>
                {reservation.status}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
              {reservation.customerName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Customer & Contacts Strip */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-800">{reservation.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${reservation.phoneNumber}`}
                className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Chiama</span>
              </a>
              <a
                href={waReminderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {reservation.email && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{reservation.email}</span>
            </div>
          )}

          {/* CRM Profile Pill if customer exists */}
          {profile && (
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Profilo CRM:</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">
                {profile.visitCount} visite
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-600" />
                {profile.loyaltyPoints} punti
              </span>
              {profile.notes && (
                <span className="text-slate-600 text-[11px] italic">
                  Note cliente: {profile.notes}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Status Buttons */}
        <div className="mt-5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Cambio Rapido Stato
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STATUS_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              const isActive = reservation.status === btn.status;
              return (
                <button
                  key={btn.status}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleQuickStatus(btn.status)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                    isActive ? btn.activeColor : `bg-white text-slate-700 border-slate-200 ${btn.color}`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSaveDetails} className="mt-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Dettagli Servizio & Spostamento
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Data */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Servizio
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Fascia Oraria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Orario Arrivo
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {TIME_SLOT_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Coperti */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coperti (Persone)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Tavolo Assegnato */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tavolo Assegnato
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Nessun tavolo assegnato --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      Tavolo {t.number} ({t.areaName}) - {t.capacity}p [{t.status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note & Allergie */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note Speciali, Preferenze o Allergie
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Seggiolone bimbo, allergia crostacei, anniversario..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Elimina</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="taaaac-btn-secondary text-xs px-4 py-2 cursor-pointer"
              >
                Chiudi
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="taaaac-btn-primary text-xs px-5 py-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isPending ? "Salvataggio..." : "Salva Modifiche"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
