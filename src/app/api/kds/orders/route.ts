import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get("all") === "true";

    // Recupera comande tavolo
    const tableOrders = await prisma.tableOrder.findMany({
      where: includeCompleted
        ? {}
        : {
            status: { in: ["IN_CODA", "IN_PREPARAZIONE", "PRONTO"] },
          },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    // Recupera ordini asporto attivi
    const takeawayOrders = await prisma.takeawayOrder.findMany({
      where: includeCompleted
        ? {}
        : {
            status: { in: ["IN_CODA", "IN_PREPARAZIONE", "PRONTO"] },
          },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    const now = Date.now();

    const unifiedTableOrders = tableOrders.map((to) => {
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
        title: `Tavolo ${to.tableNumber}`,
        tableNumber: to.tableNumber,
        coverCount: to.coverCount,
        waiterName: to.waiterName || "Sala",
        status: to.status,
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

      // Creiamo item semplificato da itemsSummary
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
        title: `Asporto: ${tko.customerName}`,
        tableNumber: `Asporto (${tko.pickupTime})`,
        coverCount: 1,
        waiterName: tko.phoneNumber || "Asporto",
        status: tko.status,
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

    return NextResponse.json({
      success: true,
      orders: allOrders,
      counts: {
        total: allOrders.length,
        inCoda: allOrders.filter((o) => o.status === "IN_CODA").length,
        inPreparazione: allOrders.filter((o) => o.status === "IN_PREPARAZIONE").length,
        pronto: allOrders.filter((o) => o.status === "PRONTO").length,
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
