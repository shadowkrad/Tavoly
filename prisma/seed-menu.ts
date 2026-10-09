import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.menuItem.count();
  if (count > 0) {
    console.log(`Piatto già presenti: ${count}. Nessun seed necessario.`);
    return;
  }

  const sampleDishes = [
    {
      name: "Tartare di Salmone & Avocado",
      category: "Antipasti",
      price: 14.0,
      description: "Salmone fresco norvegese, mousse di avocado, semi di sesamo tostato e riduzione al lime",
      allergens: JSON.stringify(["Pesce", "Semi di sesamo", "Soia"]),
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 1,
    },
    {
      name: "Tagliere di Salumi Artigianali & Formaggi DOP",
      category: "Antipasti",
      price: 16.0,
      description: "Prosciutto Crudo di Parma 24 mesi, pecorino toscano, miele millefiori e noci tostate",
      allergens: JSON.stringify(["Latte / Latticini", "Frutta a guscio"]),
      imageUrl: "https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 2,
    },
    {
      name: "Paccheri di Gragnano al Polpo",
      category: "Primi",
      price: 16.0,
      description: "Pomodorini del Piennolo, olive taggiasche e tarallo sbriciolato croccante",
      allergens: JSON.stringify(["Glutine", "Molluschi"]),
      imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 3,
    },
    {
      name: "Tagliolini al Tartufo Fresco",
      category: "Primi",
      price: 18.0,
      description: "Pasta fresca all'uovo tirata a mano e burro di malga fuso con tartufo nero estivo",
      allergens: JSON.stringify(["Glutine", "Uova", "Latte / Latticini"]),
      imageUrl: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 4,
    },
    {
      name: "Filetto Black Angus al Pepe Verde",
      category: "Secondi",
      price: 24.0,
      description: "Cottura a bassa temperatura con riduzione di brandy, pepe verde in grani e patate novelle",
      allergens: JSON.stringify(["Latte / Latticini", "Senape"]),
      imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 5,
    },
    {
      name: "Trancio di Spigola alla Griglia",
      category: "Secondi",
      price: 21.0,
      description: "Spigola del Mediterraneo su letto di caponatina di verdure croccanti e salmoriglio al limone",
      allergens: JSON.stringify(["Pesce"]),
      imageUrl: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 6,
    },
    {
      name: "Tiramisù Tradizionale",
      category: "Dolci",
      price: 7.0,
      description: "Savoiardi sardi, caffè espresso e vellutata crema al mascarpone artigianale",
      allergens: JSON.stringify(["Glutine", "Uova", "Latte / Latticini"]),
      imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 7,
    },
    {
      name: "Calice Chianti Classico DOCG",
      category: "Bevande & Vini",
      price: 6.0,
      description: "Tenuta Guicciardini Strozzi, annata 2021, corpo equilibrato con sentori di mora e vaniglia",
      allergens: JSON.stringify(["Anidride solforosa e solfiti"]),
      imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80",
      isAvailable: true,
      orderIndex: 8,
    },
  ];

  for (const dish of sampleDishes) {
    await prisma.menuItem.create({ data: dish });
  }

  // Imposta di default menu_show_dish_images a true
  await prisma.localSetting.upsert({
    where: { key: "menu_show_dish_images" },
    create: { key: "menu_show_dish_images", value: "true" },
    update: {},
  });

  console.log("✅ Seed menu completato con successo!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
