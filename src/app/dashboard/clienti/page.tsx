import { prisma } from "@/lib/prisma";
import { CustomersManagementView } from "@/components/dashboard/CustomersManagementView";

export const dynamic = "force-dynamic";

export default async function TavolyClientiPage() {
  const [customers, tables, reservations, tableOrders, takeawayOrders, nameSetting] =
    await Promise.all([
      prisma.customerProfile
        .findMany({
          where: { NOT: { phoneNumber: { startsWith: "CANCELLATO" } } },
          orderBy: [{ isVip: "desc" }, { visitCount: "desc" }, { lastVisitAt: "desc" }],
        })
        .catch((err) => {
          console.warn("[CRM] Fallback query customerProfile:", err);
          return [];
        }),
      prisma.table
        .findMany({
          include: { area: true },
          orderBy: { number: "asc" },
        })
        .catch((err) => {
          console.warn("[CRM] Fallback query tables:", err);
          return [];
        }),
      prisma.reservation
        .findMany({
          include: { table: true },
          orderBy: { date: "desc" },
          take: 400,
        })
        .catch(() => []),
      prisma.tableOrder
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 400,
        })
        .catch(() => []),
      prisma.takeawayOrder
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 300,
        })
        .catch(() => []),
      prisma.localSetting
        .findUnique({
          where: { key: "restaurant_name" },
        })
        .catch(() => null),
    ]);

  const restaurantName = nameSetting?.value || "Tavoly Restaurant";

  const serializedReservations = reservations.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    phoneNumber: r.phoneNumber,
    guestCount: r.guestCount,
    date: r.date.toISOString(),
    timeSlot: r.timeSlot,
    status: r.status,
    notes: r.notes,
    tableNumber: r.table?.number || null,
  }));

  const serializedTableOrders = tableOrders.map((o) => ({
    id: o.id,
    tableId: o.tableNumber,
    tableNumber: o.tableNumber,
    coverCount: o.coverCount,
    customerName: o.customerName || null,
    customerPhone: o.customerPhone || null,
    reservationId: o.reservationId || null,
    itemsJson: o.itemsJson,
    totalAmount: o.totalAmount,
    status: o.status,
    paymentStatus: o.paymentStatus || "DA_PAGARE",
    paymentMethod: o.paymentMethod || null,
    paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
  }));

  const serializedTakeawayOrders = takeawayOrders.map((t) => ({
    id: t.id,
    customerName: t.customerName,
    phoneNumber: t.phoneNumber,
    pickupTime: t.pickupTime,
    itemsSummary: t.itemsSummary,
    totalAmount: t.totalAmount,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <CustomersManagementView
        initialCustomers={customers}
        tables={tables}
        reservations={serializedReservations}
        tableOrders={serializedTableOrders}
        takeawayOrders={serializedTakeawayOrders}
        restaurantName={restaurantName}
      />
    </div>
  );
}
