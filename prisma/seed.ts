import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Avvio seeding database Tavoly con coordinate lavagna...");

  // Pulisce tabelle
  await prisma.reservation.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.area.deleteMany({});

  // Creazione Aree / Sale
  const salaInterna = await prisma.area.create({
    data: {
      name: "Sala Interna Elegance",
      description: "Ambiente climatizzato con musica soffusa e bancone bar",
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

  // Creazione Tavoli Sala Interna (con coordinate X/Y in percentuale per la lavagna)
  const t1 = await prisma.table.create({
    data: {
      number: "1",
      capacity: 2,
      seatedCount: 2,
      status: "OCCUPATO",
      shape: "ROUND",
      posX: 18,
      posY: 22,
      areaId: salaInterna.id,
    },
  });

  const t2 = await prisma.table.create({
    data: {
      number: "2",
      capacity: 4,
      seatedCount: 0,
      status: "LIBERO",
      shape: "RECTANGLE",
      posX: 50,
      posY: 22,
      areaId: salaInterna.id,
    },
  });

  const t3 = await prisma.table.create({
    data: {
      number: "3",
      capacity: 6,
      seatedCount: 0,
      status: "PRENOTATO",
      shape: "RECTANGLE",
      posX: 82,
      posY: 22,
      areaId: salaInterna.id,
    },
  });

  const t4 = await prisma.table.create({
    data: {
      number: "4",
      capacity: 2,
      seatedCount: 2,
      status: "CONTO",
      shape: "ROUND",
      posX: 18,
      posY: 68,
      areaId: salaInterna.id,
    },
  });

  const t5 = await prisma.table.create({
    data: {
      number: "5",
      capacity: 8,
      seatedCount: 0,
      status: "LIBERO",
      shape: "RECTANGLE",
      posX: 52,
      posY: 68,
      areaId: salaInterna.id,
    },
  });

  const b1 = await prisma.table.create({
    data: {
      number: "B1",
      capacity: 1,
      seatedCount: 1,
      status: "OCCUPATO",
      shape: "BAR",
      posX: 85,
      posY: 60,
      areaId: salaInterna.id,
    },
  });

  const b2 = await prisma.table.create({
    data: {
      number: "B2",
      capacity: 1,
      seatedCount: 0,
      status: "LIBERO",
      shape: "BAR",
      posX: 85,
      posY: 76,
      areaId: salaInterna.id,
    },
  });

  // Tavoli Dehors
  const d1 = await prisma.table.create({
    data: {
      number: "D1",
      capacity: 4,
      seatedCount: 0,
      status: "LIBERO",
      shape: "ROUND",
      posX: 25,
      posY: 35,
      areaId: dehors.id,
    },
  });

  const d2 = await prisma.table.create({
    data: {
      number: "D2",
      capacity: 4,
      seatedCount: 3,
      status: "OCCUPATO",
      shape: "RECTANGLE",
      posX: 65,
      posY: 35,
      areaId: dehors.id,
    },
  });

  const d3 = await prisma.table.create({
    data: {
      number: "D3",
      capacity: 2,
      seatedCount: 0,
      status: "PRENOTATO",
      shape: "ROUND",
      posX: 45,
      posY: 75,
      areaId: dehors.id,
    },
  });

  // Tavoli Veranda
  const v1 = await prisma.table.create({
    data: {
      number: "V1",
      capacity: 2,
      seatedCount: 0,
      status: "LIBERO",
      shape: "ROUND",
      posX: 30,
      posY: 50,
      areaId: veranda.id,
    },
  });

  const v2 = await prisma.table.create({
    data: {
      number: "V2",
      capacity: 4,
      seatedCount: 0,
      status: "LIBERO",
      shape: "RECTANGLE",
      posX: 70,
      posY: 50,
      areaId: veranda.id,
    },
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
      isWalkIn: false,
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
      isWalkIn: false,
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
      isWalkIn: false,
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
      isWalkIn: false,
    },
  });

  await prisma.reservation.create({
    data: {
      customerName: "Cliente Al Volo (Walk-In)",
      phoneNumber: "+39 333 1122334",
      guestCount: 1,
      timeSlot: "19:45",
      date: today,
      status: "SEDUTI",
      notes: "Caffè e prosecco al bancone",
      tableId: b1.id,
      whatsappSent: false,
      isWalkIn: true,
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
