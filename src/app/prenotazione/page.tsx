import React, { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { ShowcaseNavbar } from "@/components/public/ShowcaseNavbar";
import { PublicShiftData } from "@/components/public/PublicBookingWidget";
import { BookingOrTakeawayContainer } from "@/components/public/BookingOrTakeawayContainer";
import { getTakeawaySettings } from "@/lib/takeaway-server";
import { PublicTakeawayDish } from "@/components/public/PublicTakeawayWidget";
import { ArrowLeft, Sparkles, UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PrenotazioneTavoloPage() {
  const [tenantConfig, rawShifts, todayReservations, takeawaySettings, rawTakeawayDishes, existingTakeawayOrders] =
    await Promise.all([
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
      getTakeawaySettings(),
      prisma.menuItem.findMany({
        where: { isAvailable: true, isTakeaway: true },
        orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { name: "asc" }],
      }),
      prisma.takeawayOrder.findMany({
        where: { status: { not: "ANNULLATO" } },
        select: { pickupTime: true, pickupDate: true },
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

  const takeawayDishes: PublicTakeawayDish[] = rawTakeawayDishes.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    price: d.price,
    description: d.description,
    imageUrl: d.imageUrl,
    allergens: d.allergens || "[]",
  }));

  const restaurantName = tenantConfig.theme.restaurantName || "Tavoly Restaurant";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ShowcaseNavbar tenantConfig={tenantConfig} takeawayEnabled={takeawaySettings.enabled} />

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
            {takeawaySettings.enabled ? "Tavolo & Asporto Online" : "Conferma Istantanea & WhatsApp"}
          </span>
        </div>

        {/* Intestazione Form */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-emerald-600" />
            Prenotazioni & Asporto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            {takeawaySettings.enabled
              ? "Prenota un tavolo in sala oppure componi il tuo ordine da asporto con ritiro veloce al pass."
              : "Scegli la data, il turno e il numero di coperti per riservare il tuo tavolo ideale."}
          </p>
        </div>

        {/* Widget Prenotazione Tavolo o Asporto */}
        <div className="taaaac-card p-6 sm:p-8 bg-white shadow-md border-slate-200/90 rounded-3xl">
          <Suspense fallback={<div className="py-12 text-center text-slate-400 text-sm">Caricamento modulo...</div>}>
            <BookingOrTakeawayContainer
              shifts={shifts}
              takeawaySettings={takeawaySettings}
              takeawayDishes={takeawayDishes}
              existingOrders={existingTakeawayOrders}
              restaurantName={restaurantName}
            />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-center text-xs">
        <p className="font-semibold text-white">
          {restaurantName}
        </p>
        <p className="mt-1">Tavoly Booking & Takeaway Engine · Taaaac Ecosystem</p>
      </footer>
    </div>
  );
}
