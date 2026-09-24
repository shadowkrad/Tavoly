import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Avvio seeding database Tavoly con coordinate lavagna...");

  // Pulisce tabelle
  await prisma.takeawayOrder.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.serviceShift.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.area.deleteMany({});

  // Verifica modalità Produzione vs Demo (Issue #21)
  const isDemo = process.env.IS_DEMO === "true" || (process.env.NODE_ENV !== "production" && process.env.IS_DEMO !== "false");

  if (!isDemo) {
    console.log("🔒 Modalità PRODUZIONE rilevata (IS_DEMO=false): database vergine inizializzato senza piatti, sale o tavoli demo.");
    console.log("✅ Seed completato con successo (Zero Mock Data per produzione GDPR compliant)!");
    return;
  }

  console.log("✨ Modalità DEMO attiva: inserimento sale, tavoli, menu e prenotazioni di prova...");

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

  // Creazione Turni e Servizi (Issue #7)
  await prisma.serviceShift.createMany({
    data: [
      {
        name: "Pranzo",
        timeSlotsJson: JSON.stringify(["12:30", "13:00", "13:30", "14:00"]),
        maxGuests: 40,
        avgDurationMinutes: 60,
        isActive: true,
        orderIndex: 1,
      },
      {
        name: "Aperitivo al Bar",
        timeSlotsJson: JSON.stringify(["18:30", "19:00", "19:30"]),
        maxGuests: 30,
        avgDurationMinutes: 45,
        isActive: true,
        orderIndex: 2,
      },
      {
        name: "Cena 1° Turno",
        timeSlotsJson: JSON.stringify(["20:00", "20:30"]),
        maxGuests: 45,
        avgDurationMinutes: 90,
        isActive: true,
        orderIndex: 3,
      },
      {
        name: "Cena 2° Turno",
        timeSlotsJson: JSON.stringify(["21:30", "22:00"]),
        maxGuests: 45,
        avgDurationMinutes: 90,
        isActive: true,
        orderIndex: 4,
      },
    ],
  });

  // Creazione Schede Clienti Abituali (Issue #9)
  await prisma.customerProfile.createMany({
    data: [
      {
        name: "Marco Rossi",
        phoneNumber: "+39 347 1234567",
        email: "marco.rossi@example.com",
        notes: "Preferisce tavolo tondo, allergico ai crostacei. Ricorrenza compleanno a settembre.",
        visitCount: 5,
        loyaltyPoints: 50,
      },
      {
        name: "Elena Bianchi",
        phoneNumber: "+39 338 9876543",
        email: "elena.b@example.com",
        notes: "Gradisce tavolo finestra vista giardino. Ama bollicine metodo classico.",
        visitCount: 3,
        loyaltyPoints: 30,
      },
      {
        name: "Luca Moretti",
        phoneNumber: "+39 320 5554321",
        email: "luca.moretti@example.com",
        notes: "Cliente abituale pausa pranzo business. Intolleranza severa al lattosio.",
        visitCount: 8,
        loyaltyPoints: 85,
      },
    ],
  });

  // Creazione Ordini Asporto Banco / Vendoly Channel Manager (Issue #9)
  await prisma.takeawayOrder.createMany({
    data: [
      {
        customerName: "Mario Galli",
        phoneNumber: "+39 333 9988771",
        pickupTime: "19:45",
        itemsSummary: "2x Spritz Campari, 1x Tagliere Salumi & Formaggi, 1x Pinsa Romana",
        totalAmount: 26.5,
        status: "IN_PREPARAZIONE",
      },
      {
        customerName: "Silvia Parodi",
        phoneNumber: "+39 340 5544332",
        pickupTime: "20:15",
        itemsSummary: "3x Burger Gourmet Black Angus, 2x Patate Dippers al Tartufo",
        totalAmount: 52.0,
        status: "PRONTO",
      },
    ],
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
