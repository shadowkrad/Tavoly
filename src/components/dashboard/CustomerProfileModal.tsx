"use client";

import React, { useState, useTransition } from "react";
import { User, Phone, Award, MessageSquare, Save, X, ExternalLink, Sparkles, AlertCircle } from "lucide-react";
import { updateCustomerNotesAction } from "@/app/actions";
import {
  generateWhatsAppLink,
  buildConfirmationMessage,
  buildReminderMessage,
  buildTableReadyMessage,
} from "@/lib/whatsapp";

interface CustomerProfileData {
  phoneNumber: string;
  name: string;
  notes: string | null;
  visitCount: number;
  loyaltyPoints: number;
}

interface CustomerProfileModalProps {
  customer: CustomerProfileData;
  restaurantName: string;
  currentReservation?: {
    timeSlot: string;
    guestCount: number;
    tableNumber?: string;
  };
  onClose: () => void;
}

export function CustomerProfileModal({
  customer,
  restaurantName,
  currentReservation,
  onClose,
}: CustomerProfileModalProps) {
  const [notes, setNotes] = useState(customer.notes || "");
  const [loyaltyPoints, setLoyaltyPoints] = useState(customer.loyaltyPoints);
  const [isPending, startTransition] = useTransition();
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateCustomerNotesAction(customer.phoneNumber, notes, 0);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    });
  };

  const handleAddPoints = (delta: number) => {
    startTransition(async () => {
      const res = await updateCustomerNotesAction(customer.phoneNumber, notes, delta);
      if (res.success && res.customer) {
        setLoyaltyPoints(res.customer.loyaltyPoints);
      }
    });
  };

  // WhatsApp Link generation
  const todayStr = new Date().toLocaleDateString("it-IT");
  const timeSlot = currentReservation?.timeSlot || "20:30";
  const guestCount = currentReservation?.guestCount || 2;
  const tableNumber = currentReservation?.tableNumber || "1";

  const confirmWaLink = generateWhatsAppLink(
    customer.phoneNumber,
    buildConfirmationMessage(restaurantName, customer.name, todayStr, timeSlot, guestCount)
  );

  const reminderWaLink = generateWhatsAppLink(
    customer.phoneNumber,
    buildReminderMessage(restaurantName, customer.name, timeSlot, guestCount)
  );

  const tableReadyWaLink = generateWhatsAppLink(
    customer.phoneNumber,
    buildTableReadyMessage(restaurantName, customer.name, tableNumber)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-xs">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                {customer.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{customer.phoneNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row: Visite & Loyalty Points */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Storico Visite
            </span>
            <strong className="text-2xl font-black text-slate-900">{customer.visitCount}</strong>
            <span className="text-[11px] text-slate-500 block">visite al locale</span>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-center relative overflow-hidden">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block flex items-center justify-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Taaaac Loyalty
            </span>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <strong className="text-2xl font-black text-amber-900">{loyaltyPoints}</strong>
              <span className="text-xs text-amber-700 font-semibold">punti</span>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <button
                type="button"
                onClick={() => handleAddPoints(10)}
                disabled={isPending}
                className="text-[10px] font-bold bg-amber-200/80 hover:bg-amber-300 text-amber-900 px-2 py-0.5 rounded-md cursor-pointer"
              >
                +10 Punti
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Actions */}
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              Messaggi WhatsApp Istantanei
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
              Bot Attivo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <a
              href={confirmWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100/50 text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1 text-center transition-colors"
            >
              <span>Conferma</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={reminderWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100/50 text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1 text-center transition-colors"
            >
              <span>Promemoria</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={tableReadyWaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100/50 text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1 text-center transition-colors"
            >
              <span>Tavolo Pronto</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Form Note e Intolleranze */}
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Note Preferenze, Tavolo Gradito & Allergie
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="es. Preferisce tavolo tondo, celiaco, gradisce vino rosso riserva..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {saveSuccess ? (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Note salvate con successo!
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Le note saranno memorizzate per tutte le visite future
              </span>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="taaaac-btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isPending ? "Salvataggio..." : "Salva Note"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
