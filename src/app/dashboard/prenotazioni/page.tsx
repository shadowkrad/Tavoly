import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import {
  BookingsManagementView,
  BookingItem,
  BookingTableOption,
} from "@/components/dashboard/BookingsManagementView";
import { CustomerProfileMapItem } from "@/components/ReservationsList";

export const dynamic = "force-dynamic";

export default async function TavolyPrenotazioniPage() {
  const [
    tenantConfig,
    rawReservations,
    rawTables,
    customerProfilesList,
  ] = await Promise.all([
    getTenantConfig(),
    prisma.reservation.findMany({
      include: {
        table: {
          include: {
            area: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { timeSlot: "asc" },
      ],
    }),
    prisma.table.findMany({
      include: { area: true },
      orderBy: [{ area: { orderIndex: "asc" } }, { number: "asc" }],
    }),
    prisma.customerProfile.findMany({}),
  ]);

  // Lookup profili clienti
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

  const tables: BookingTableOption[] = rawTables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    areaName: t.area.name,
    status: t.status,
  }));

  const initialReservations: BookingItem[] = rawReservations.map((r) => ({
    id: r.id,
    customerName: r.customerName,
    phoneNumber: r.phoneNumber,
    email: r.email,
    guestCount: r.guestCount,
    timeSlot: r.timeSlot,
    date: r.date,
    status: r.status,
    notes: r.notes,
    whatsappSent: r.whatsappSent,
    isWalkIn: r.isWalkIn,
    tableId: r.tableId,
    table: r.table
      ? {
          id: r.table.id,
          number: r.table.number,
          capacity: r.table.capacity,
          area: {
            id: r.table.area.id,
            name: r.table.area.name,
          },
        }
      : null,
  }));

  const hasWhatsAppModule = tenantConfig.enabledModules.includes("WHATSAPP_REMINDERS");

  return (
    <BookingsManagementView
      initialReservations={initialReservations}
      tables={tables}
      customerProfiles={customerProfiles}
      restaurantName={tenantConfig.theme.restaurantName}
      hasWhatsAppModule={hasWhatsAppModule}
    />
  );
}
