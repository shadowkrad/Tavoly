import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secretHeader = req.headers.get("x-taaaac-core-secret");
  const expectedSecret = process.env.TAAAAC_INTERNAL_SECRET || "taaaac-internal-key";

  if (!secretHeader || secretHeader !== expectedSecret) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetDateStr = searchParams.get("date");

  let targetDate = new Date();
  if (targetDateStr) {
    targetDate = new Date(targetDateStr);
  } else {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const rawReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["CONFERMATA", "IN_ATTESA", "SEDUTI"] },
      },
      include: {
        table: {
          include: { area: true },
        },
      },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    });

    const appointments = rawReservations.map((res) => ({
      id: res.id,
      clienteNome: res.customerName,
      clienteTelefono: res.phoneNumber,
      clienteEmail: res.email || null,
      data: res.date.toISOString().split("T")[0],
      orario: res.timeSlot,
      servizio: `Tavolo per ${res.guestCount} persone${res.table ? ` (Tavolo ${res.table.number})` : ""}`,
      operatore: res.table?.area?.name || "Ristorante",
      note: res.notes || null,
    }));

    return NextResponse.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (err: any) {
    console.error("[Internal Reservations Tavoly] Errore:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
