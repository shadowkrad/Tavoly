import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { StatsCards } from "@/components/StatsCards";
import { TableCanvasBoard, TableItem } from "@/components/dashboard/TableCanvasBoard";
import { ReservationsList, CustomerProfileMapItem } from "@/components/ReservationsList";
import { DashboardHeaderActions } from "@/components/dashboard/DashboardHeaderActions";
import { Calendar } from "lucide-react";

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

  // Calcolo metriche
  const totalTables = tables.length;
  const freeTables = tables.filter((t) => t.status === "LIBERO").length;
  const occupiedTables = tables.filter((t) => t.status === "OCCUPATO" || t.status === "CONTO").length;
  const totalGuestsToday = reservations
    .filter((r) => r.status !== "ANNULLATA")
    .reduce((acc, curr) => acc + curr.guestCount, 0);
  const activeReservationsCount = reservations.filter((r) => r.status !== "ANNULLATA").length;

  const tableOptions = tables.map((t) => ({
    id: t.id,
    number: t.number,
    capacity: t.capacity,
    areaName: t.area.name,
    status: t.status,
  }));

  const hasWhatsAppModule = tenantConfig.enabledModules.includes("WHATSAPP_REMINDERS");
  const hasVendolyModule = tenantConfig.enabledModules.includes("VENDOLY_CHANNEL_MANAGER");

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Gestione Sala & Tavoli</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              Operativo Live
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Console di controllo per camerieri, banco bar e responsabili di sala
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Oggi, {new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>

          <DashboardHeaderActions
            tableOptions={tableOptions}
            shifts={serviceShifts}
            takeawayOrders={takeawayOrders}
            currentPaletteId={paletteSetting?.value || "ROYAL_BLUE"}
            hasVendolyModule={hasVendolyModule}
          />
        </div>
      </div>

      {/* Metric Cards */}
      <StatsCards
        totalTables={totalTables}
        freeTables={freeTables}
        occupiedTables={occupiedTables}
        totalGuestsToday={totalGuestsToday}
        reservationsCount={activeReservationsCount}
      />

      {/* Main Section: Left side Lavagna Tavoli (Floorplan), Right side Prenotazioni */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <TableCanvasBoard tables={tables} areas={areas} />
        </div>

        <div className="lg:col-span-4">
          <ReservationsList
            reservations={reservations}
            hasWhatsAppModule={hasWhatsAppModule}
            customerProfiles={customerProfiles}
            restaurantName={tenantConfig.theme.restaurantName}
          />
        </div>
      </div>
    </div>
  );
}
