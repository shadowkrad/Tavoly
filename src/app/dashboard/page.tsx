import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { TableItem } from "@/components/dashboard/TableCanvasBoard";
import { CustomerProfileMapItem } from "@/components/ReservationsList";
import { FloorPlanView } from "@/components/dashboard/FloorPlanView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    tenantConfig,
    areas,
    rawTables,
    reservations,
    serviceShifts,
    customerProfilesList,
    takeawayOrders,
    paletteSetting,
  ] = await Promise.all([
    getTenantConfig(),
    prisma.area.findMany({
      orderBy: { orderIndex: "asc" },
    }),
    prisma.table.findMany({
      include: {
        area: true,
      },
      orderBy: [{ area: { orderIndex: "asc" } }, { number: "asc" }],
    }),
    prisma.reservation.findMany({
      include: {
        table: {
          include: {
            area: true,
          },
        },
      },
      orderBy: { timeSlot: "asc" },
    }),
    prisma.serviceShift.findMany({
      orderBy: { orderIndex: "asc" },
    }),
    prisma.customerProfile.findMany({}),
    prisma.takeawayOrder.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.localSetting.findUnique({
      where: { key: "active_palette_id" },
    }),
  ]);

  // Lookup map per profili clienti per numero di telefono
  const customerProfiles: Record<string, CustomerProfileMapItem> = {};
  customerProfilesList.forEach((c) => {
    customerProfiles[c.phoneNumber] = {
      phoneNumber: c.phoneNumber,
      name: c.name,
      notes: c.notes,
      visitCount: c.visitCount,
      loyaltyPoints: c.loyaltyPoints,
    };
  });

  const tables: TableItem[] = rawTables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    seatedCount: t.seatedCount,
    status: t.status,
    shape: t.shape,
    posX: t.posX,
    posY: t.posY,
    areaId: t.areaId,
    notes: t.notes,
    area: {
      id: t.area.id,
      name: t.area.name,
    },
  }));

  const hasWhatsAppModule = tenantConfig.enabledModules.includes("WHATSAPP_REMINDERS");
  const hasVendolyModule = tenantConfig.enabledModules.includes("VENDOLY_CHANNEL_MANAGER");

  return (
    <FloorPlanView
      tables={tables}
      areas={areas}
      reservations={reservations}
      customerProfiles={customerProfiles}
      serviceShifts={serviceShifts}
      takeawayOrders={takeawayOrders}
      paletteId={paletteSetting?.value || "ROYAL_BLUE"}
      hasVendolyModule={hasVendolyModule}
      hasWhatsAppModule={hasWhatsAppModule}
      restaurantName={tenantConfig.theme.restaurantName}
    />
  );
}
