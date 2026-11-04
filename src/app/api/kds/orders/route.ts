import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get("all") === "true";

    // Recupera comande tavolo (in cucina + quelle già servite ma ancora DA_PAGARE in cassa)
    const tableOrders = await prisma.tableOrder.findMany({
      where: includeCompleted
        ? {}
        : {
            OR: [
              { status: { in: ["IN_CODA", "IN_PREPARAZIONE", "PRONTO"] } },
              { status: "SERVITO", paymentStatus: "DA_PAGARE" },
            ],
          },
      orderBy: { createdAt: "asc" },
      take: 80,
    });

    // Recupera ordini asporto attivi
    const takeawayOrders = await prisma.takeawayOrder.findMany({
      where: includeCompleted
        ? {}
        : {
            status: { in: ["IN_CODA", "IN_PREPARAZIONE", "PRONTO"] },
          },
      orderBy: { createdAt: "asc" },
      take: 40,
    });

    const now = Date.now();

    // Calcola il progressivo (1ª Comanda, Aggiunta #2, ecc.) per ogni tavolo con conto aperto
    const seqCounterByTable: Record<string, number> = {};

    const unifiedTableOrders = tableOrders.map((to) => {
      seqCounterByTable[to.tableNumber] = (seqCounterByTable[to.tableNumber] || 0) + 1;
      const orderSequence = seqCounterByTable[to.tableNumber];

      let parsedItems: Array<{
        dishId?: string;
        name: string;
        category?: string;
        quantity: number;
        price: number;
        variants?: string[];
      }> = [];

      try {
        parsedItems = JSON.parse(to.itemsJson);
      } catch {
        parsedItems = [{ name: "Comanda Tavolo", quantity: 1, price: to.totalAmount, variants: [] }];
      }

      const elapsedMs = now - new Date(to.createdAt).getTime();
      const minutesWaiting = Math.max(0, Math.floor(elapsedMs / 60000));

      return {
        id: to.id,
        type: "TABLE" as const,
        tableId: to.tableNumber,
        title: `Tavolo ${to.tableNumber}`,
        tableNumber: to.tableNumber,
        coverCount: to.coverCount,
        waiterName: to.waiterName || "Sala",
        customerName: to.customerName || null,
        customerPhone: to.customerPhone || null,
        status: to.status,
        paymentStatus: to.paymentStatus || "DA_PAGARE",
        paymentMethod: to.paymentMethod || null,
        orderSequence,
        notes: to.notes,
        totalAmount: to.totalAmount,
        createdAt: to.createdAt.toISOString(),
        minutesWaiting,
        items: parsedItems,
      };
    });

    const unifiedTakeawayOrders = takeawayOrders.map((tko) => {
      const elapsedMs = now - new Date(tko.createdAt).getTime();
      const minutesWaiting = Math.max(0, Math.floor(elapsedMs / 60000));

      const items = (tko.itemsSummary || "Ordine Asporto")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          quantity: 1,
          price: 0,
          variants: [] as string[],
        }));

      return {
        id: tko.id,
        type: "TAKEAWAY" as const,
        tableId: null,
        title: `Asporto: ${tko.customerName}`,
        tableNumber: `Asporto (${tko.pickupTime})`,
        coverCount: 1,
        waiterName: tko.phoneNumber || "Asporto",
        customerName: tko.customerName,
        customerPhone: tko.phoneNumber,
        status: tko.status,
        paymentStatus: "DA_PAGARE",
        paymentMethod: null,
        orderSequence: 1,
        notes: tko.notes,
        totalAmount: tko.totalAmount,
        createdAt: tko.createdAt.toISOString(),
        minutesWaiting,
        items,
      };
    });

    // Combiniamo e ordiniamo per FIFO (data di creazione crescente)
    const allOrders = [...unifiedTableOrders, ...unifiedTakeawayOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const activeKitchenOrders = allOrders.filter((o) =>
      ["IN_CODA", "IN_PREPARAZIONE", "PRONTO"].includes(o.status)
    );

    return NextResponse.json({
      success: true,
      orders: allOrders,
      counts: {
        total: activeKitchenOrders.length,
        inCoda: allOrders.filter((o) => o.status === "IN_CODA").length,
        inPreparazione: allOrders.filter((o) => o.status === "IN_PREPARAZIONE").length,
        pronto: allOrders.filter((o) => o.status === "PRONTO").length,
        servitoDaPagare: allOrders.filter(
          (o) => o.status === "SERVITO" && o.paymentStatus === "DA_PAGARE"
        ).length,
      },
    });
  } catch (error) {
    console.error("Errore API KDS orders:", error);
    return NextResponse.json(
      { success: false, error: "Errore caricamento comande per monitor cucina" },
      { status: 500 }
    );
  }
}
