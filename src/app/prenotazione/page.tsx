import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { ShowcaseNavbar } from "@/components/public/ShowcaseNavbar";
import { PublicBookingWidget, PublicShiftData } from "@/components/public/PublicBookingWidget";
import { ArrowLeft, Sparkles, UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrenotazioneTavoloPage() {
  const [tenantConfig, rawShifts, todayReservations] = await Promise.all([
    getTenantConfig(),
    prisma.serviceShift.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        status: { not: "ANNULLATA" },
      },
    }),
  ]);

  const shifts: PublicShiftData[] = rawShifts.map((s) => {
    const slots: string[] = JSON.parse(s.timeSlotsJson || "[]");
    const currentBooked = todayReservations
      .filter((r) => slots.includes(r.timeSlot))
      .reduce((sum, r) => sum + r.guestCount, 0);

    return {
      id: s.id,
      name: s.name,
      slots,
      maxGuests: s.maxGuests,
      isActive: s.isActive,
      currentBooked,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ShowcaseNavbar tenantConfig={tenantConfig} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Link Torna alla Vetrina */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Vetrina
          </Link>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            Conferma Istantanea & WhatsApp
          </span>
        </div>

        {/* Intestazione Form */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-emerald-600" />
            Prenota il tuo Tavolo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Scegli la data, il turno e il numero di coperti per riservare il tuo tavolo ideale.
          </p>
        </div>

        {/* Widget Prenotazione Tavolo */}
        <div className="taaaac-card p-6 sm:p-8 bg-white shadow-md border-slate-200/90 rounded-3xl">
          <PublicBookingWidget shifts={shifts} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-center text-xs">
        <p className="font-semibold text-white">
          {tenantConfig.theme.restaurantName || "Tavoly Restaurant"}
        </p>
        <p className="mt-1">Tavoly Booking Engine · Taaaac Ecosystem</p>
      </footer>
    </div>
  );
}
