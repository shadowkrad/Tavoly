import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Avvio seeding database Tavoly...");

  // Pulisce tabelle
  await prisma.reservation.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.area.deleteMany({});

  // Creazione Aree / Sale
  const salaInterna = await prisma.area.create({
    data: {
      name: "Sala Interna Elegance",
      description: "Ambiente climatizzato con musica soffusa",
      orderIndex: 1,
    },
  });

  const dehors = await prisma.area.create({
    data: {
      name: "Dehors Giardino",
      description: "Giardino esterno con pergolato e luci calde",
      orderIndex: 2,
    },
  });

  const veranda = await prisma.area.create({
    data: {
      name: "Veranda Panoramica",
      description: "Vista vetrata sulle colline",
      orderIndex: 3,
    },
  });

  // Creazione Tavoli Sala Interna
  const t1 = await prisma.table.create({
    data: { number: "1", capacity: 2, status: "OCCUPATO", areaId: salaInterna.id },
  });
  const t2 = await prisma.table.create({
    data: { number: "2", capacity: 4, status: "LIBERO", areaId: salaInterna.id },
  });
  const t3 = await prisma.table.create({
    data: { number: "3", capacity: 6, status: "PRENOTATO", areaId: salaInterna.id },
  });
  const t4 = await prisma.table.create({
    data: { number: "4", capacity: 2, status: "CONTO", areaId: salaInterna.id },
  });
  const t5 = await prisma.table.create({
    data: { number: "5", capacity: 8, status: "LIBERO", areaId: salaInterna.id },
  });

  // Tavoli Dehors
  const d1 = await prisma.table.create({
    data: { number: "D1", capacity: 4, status: "LIBERO", areaId: dehors.id },
  });
  const d2 = await prisma.table.create({
    data: { number: "D2", capacity: 4, status: "OCCUPATO", areaId: dehors.id },
  });
  const d3 = await prisma.table.create({
    data: { number: "D3", capacity: 2, status: "PRENOTATO", areaId: dehors.id },
  });

  // Tavoli Veranda
  const v1 = await prisma.table.create({
    data: { number: "V1", capacity: 2, status: "LIBERO", areaId: veranda.id },
  });
  const v2 = await prisma.table.create({
    data: { number: "V2", capacity: 4, status: "LIBERO", areaId: veranda.id },
  });

  // Creazione Prenotazioni di Esempio
  const today = new Date();

  await prisma.reservation.create({
    data: {
      customerName: "Marco Rossi",
      phoneNumber: "+39 347 1234567",
      email: "marco.rossi@example.com",
      guestCount: 6,
      timeSlot: "20:30",
      date: today,
      status: "CONFERMATA",
      notes: "Compleanno, richiesta torta",
      tableId: t3.id,
      whatsappSent: true,
    },
  });

  await prisma.reservation.create({
    data: {
      customerName: "Elena Bianchi",
      phoneNumber: "+39 338 9876543",
      email: "elena.b@example.com",
      guestCount: 2,
      timeSlot: "21:00",
      date: today,
      status: "CONFERMATA",
      notes: "Tavolo romantico, preferenza finestra",
      tableId: d3.id,
      whatsappSent: true,
    },
  });

  await prisma.reservation.create({
    data: {
      customerName: "Luca Moretti",
      phoneNumber: "+39 320 5554321",
      email: "luca.moretti@example.com",
      guestCount: 4,
      timeSlot: "13:00",
      date: today,
      status: "SEDUTI",
      notes: "Intolleranza al lattosio per 1 ospite",
      tableId: t1.id,
      whatsappSent: true,
    },
  });

  await prisma.reservation.create({
    data: {
      customerName: "Studio Legale Ferrari",
      phoneNumber: "+39 02 8887776",
      guestCount: 8,
      timeSlot: "21:30",
      date: today,
      status: "IN_ATTESA",
      notes: "Pranzo di lavoro, richiesta fattura elettronica",
      tableId: t5.id,
      whatsappSent: false,
    },
  });

  console.log("✅ Seeding completato con successo!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
