import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/prisma";
import { isStaffAuthenticated } from "@/lib/auth";
import { normalizePhone, parseDataNascita } from "@/lib/phone";
import { cercaClientePerTelefono } from "@/lib/clienti-telefono";
import { assicuraTokenTessera } from "@/lib/fidelity";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  await ensureDatabase();
  const { id } = await params;

  const cliente = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      pointsMovements: { orderBy: { createdAt: "desc" }, take: 15 },
    },
  });
  if (!cliente) {
    return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
  }

  const tokenTessera = await assicuraTokenTessera(id);
  const ora = new Date();
  const digits = (cliente.phoneNumber || "").replace(/\D/g, "");
  const suffix = digits.length >= 6 ? digits.slice(-8) : "";

  const [buoni, reservations, tableOrders, takeawayOrders, nameSetting] = await Promise.all([
    prisma.giftCard.findMany({
      where: {
        clienteId: id,
        stato: "ATTIVA",
        OR: [{ dataScadenza: null }, { dataScadenza: { gte: ora } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        codice: true,
        motivo: true,
        tipoValore: true,
        importoIniziale: true,
        saldoResiduo: true,
        percentuale: true,
        descrizioneServizio: true,
        dataScadenza: true,
      },
    }),
    suffix
      ? prisma.reservation.findMany({
          where: { phoneNumber: { contains: suffix } },
          include: { table: true },
          orderBy: { date: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
    suffix
      ? prisma.tableOrder.findMany({
          where: { customerPhone: { contains: suffix } },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
    suffix
      ? prisma.takeawayOrder.findMany({
          where: { phoneNumber: { contains: suffix } },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
      : Promise.resolve([]),
    prisma.localSetting.findUnique({ where: { key: "restaurant_name" } }).catch(() => null),
  ]);

  const nomeAttivita = nameSetting?.value || "Tavoly Restaurant";

  return NextResponse.json({
    cliente: {
      ...cliente,
      tokenTessera,
    },
    buoni,
    reservations: reservations.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      timeSlot: r.timeSlot,
      guestCount: r.guestCount,
      status: r.status,
      tableNumber: r.table?.number || null,
      notes: r.notes,
    })),
    tableOrders: tableOrders.map((o) => ({
      id: o.id,
      tableNumber: o.tableNumber,
      coverCount: o.coverCount,
      totalAmount: o.totalAmount,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt.toISOString(),
    })),
    takeawayOrders: takeawayOrders.map((t) => ({
      id: t.id,
      pickupTime: t.pickupTime,
      itemsSummary: t.itemsSummary,
      totalAmount: t.totalAmount,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    nomeAttivita,
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  await ensureDatabase();
  const { id } = await params;
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Dati non validi" }, { status: 400 });

  let telefono: string | undefined;
  if (b.phoneNumber !== undefined) {
    const t = String(b.phoneNumber).trim();
    if (!t) return NextResponse.json({ error: "Il telefono è obbligatorio" }, { status: 400 });
    const altro = await cercaClientePerTelefono(t, id);
    if (altro) {
      return NextResponse.json(
        { error: `Questo numero è già registrato per ${altro.name}`, clienteEsistenteId: altro.id },
        { status: 409 }
      );
    }
    telefono = normalizePhone(t) || t;
  }

  let nascita: Date | null | undefined;
  if (b.birthDate !== undefined) {
    if (b.birthDate) {
      nascita = parseDataNascita(String(b.birthDate));
      if (!nascita) return NextResponse.json({ error: "Data di nascita non valida" }, { status: 400 });
    } else {
      nascita = null;
    }
  }

  const cliente = await prisma.customerProfile.update({
    where: { id },
    data: {
      ...(b.name !== undefined ? { name: String(b.name).trim() } : {}),
      ...(telefono !== undefined ? { phoneNumber: telefono } : {}),
      ...(b.email !== undefined ? { email: String(b.email || "").trim() || null } : {}),
      ...(b.allergies !== undefined ? { allergies: String(b.allergies || "").trim() || null } : {}),
      ...(b.favoriteTable !== undefined ? { favoriteTable: String(b.favoriteTable || "").trim() || null } : {}),
      ...(b.isVip !== undefined ? { isVip: Boolean(b.isVip) } : {}),
      ...(b.notes !== undefined ? { notes: String(b.notes || "").trim() || null } : {}),
      ...(nascita !== undefined ? { birthDate: nascita } : {}),
      ...(b.marketingConsent !== undefined ? { marketingConsent: Boolean(b.marketingConsent) } : {}),
    },
  });

  return NextResponse.json({ cliente });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  await ensureDatabase();
  const { id } = await params;

  await prisma.customerProfile.update({
    where: { id },
    data: {
      name: "Cliente Anonimizzato",
      phoneNumber: `CANCELLATO_${id}`,
      email: null,
      allergies: null,
      favoriteTable: null,
      isVip: false,
      notes: null,
      birthDate: null,
      marketingConsent: false,
      loyaltyPoints: 0,
      loyaltyToken: null,
    },
  });

  return NextResponse.json({ success: true });
}
