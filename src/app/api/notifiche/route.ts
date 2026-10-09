import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [reservations, takeaways] = await Promise.all([
      prisma.reservation
        .findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
        })
        .catch(() => []),
      prisma.takeawayOrder
        .findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
        })
        .catch(() => []),
    ]);

    const notifPrenotazioni = reservations.map((r) => ({
      id: `res-${r.id}`,
      tipo: "PRENOTAZIONE" as const,
      titolo: `Prenotazione: ${r.customerName}`,
      descrizione: `${r.guestCount} ospiti · Turno ${r.timeSlot}${r.notes ? ` · Note: ${r.notes}` : ""}`,
      timestamp: r.createdAt.toISOString(),
      link: "/dashboard/prenotazioni",
      isUnread: r.status === "IN_ATTESA" || r.status === "CONFERMATA",
    }));

    const notifAsporto = takeaways.map((t) => ({
      id: `take-${t.id}`,
      tipo: "ASPORTO" as const,
      titolo: `Asporto: ${t.customerName}`,
      descrizione: `Ritiro ore ${t.pickupTime} · ${t.itemsSummary}`,
      timestamp: t.createdAt.toISOString(),
      link: "/dashboard/asporto",
      isUnread: t.status === "IN_CODA" || t.status === "IN_PREPARAZIONE",
    }));

    // Unisci e ordina per data creazione più recente
    const all = [...notifPrenotazioni, ...notifAsporto].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ notifiche: all.slice(0, 15) });
  } catch (error) {
    console.error("Errore fetch notifiche API:", error);
    return NextResponse.json({ notifiche: [] });
  }
}
