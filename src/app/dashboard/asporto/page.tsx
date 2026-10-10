import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { TakeawayManagementView, TakeawayOrderData } from "@/components/dashboard/TakeawayManagementView";
import { MenuItemSimple, CustomerSimple } from "@/components/dashboard/NewTakeawayOrderModal";

export const dynamic = "force-dynamic";

export default async function TavolyAsportoPage() {
  const { getTakeawaySettings } = await import("@/lib/takeaway-server");
  const [tenantConfig, rawOrders, rawMenuItems, rawCustomers, takeawaySettings] = await Promise.all([
    getTenantConfig(),
    prisma.takeawayOrder.findMany({
      orderBy: [{ pickupTime: "asc" }, { createdAt: "desc" }],
    }).catch((err) => {
      console.error("[Takeaway] Errore fetch takeawayOrder:", err);
      return [];
    }),
    prisma.menuItem.findMany({
      where: { isAvailable: true, isTakeaway: true },
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        isAvailable: true,
      },
      orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { name: "asc" }],
    }).catch((err) => {
      console.error("[Takeaway] Errore fetch menuItem:", err);
      return [];
    }),
    prisma.customerProfile.findMany({
      select: {
        name: true,
        phoneNumber: true,
      },
      orderBy: { lastVisitAt: "desc" },
      take: 100,
    }).catch((err) => {
      console.error("[Takeaway] Errore fetch customerProfile:", err);
      return [];
    }),
    getTakeawaySettings(),
  ]);

  const orders: TakeawayOrderData[] = rawOrders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    phoneNumber: o.phoneNumber,
    pickupTime: o.pickupTime,
    itemsSummary: o.itemsSummary,
    totalAmount: o.totalAmount,
    status: o.status,
    paymentStatus: o.paymentStatus || "DA_PAGARE",
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
  }));

  const menuItems: MenuItemSimple[] = rawMenuItems.map((m) => ({
    id: m.id,
    name: m.name,
    price: m.price,
    category: m.category,
    isAvailable: m.isAvailable,
  }));

  const existingCustomers: CustomerSimple[] = rawCustomers.map((c) => ({
    name: c.name,
    phoneNumber: c.phoneNumber,
  }));

  return (
    <TakeawayManagementView
      initialOrders={orders}
      menuItems={menuItems}
      existingCustomers={existingCustomers}
      restaurantName={tenantConfig.theme.restaurantName}
      isTakeawayEnabled={takeawaySettings.enabled}
    />
  );
}
