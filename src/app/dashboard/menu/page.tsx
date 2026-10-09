import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { MenuManagementView } from "@/components/dashboard/MenuManagementView";
import { MenuItemData } from "@/components/dashboard/MenuItemModal";

export const dynamic = "force-dynamic";

export default async function TavolyMenuDashboardPage() {
  const [tenantConfig, rawMenuItems, showImagesSetting, rawTables] = await Promise.all([
    getTenantConfig(),
    prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { name: "asc" }],
    }).catch((err) => {
      console.error("[Dashboard Menu] Errore caricamento piatti:", err);
      return [];
    }),
    prisma.localSetting.findUnique({
      where: { key: "menu_show_dish_images" },
    }).catch((err) => {
      console.error("[Dashboard Menu] Errore caricamento impostazioni:", err);
      return null;
    }),
    prisma.table.findMany({
      include: { area: true },
      orderBy: [{ area: { orderIndex: "asc" } }, { number: "asc" }],
    }).catch((err) => {
      console.error("[Dashboard Menu] Errore caricamento tavoli:", err);
      return [];
    }),
  ]);

  const menuItems: MenuItemData[] = rawMenuItems.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    price: m.price,
    description: m.description,
    imageUrl: m.imageUrl,
    allergens: m.allergens,
    isAvailable: m.isAvailable,
  }));

  const tables = rawTables.map((t) => ({
    id: t.id,
    number: t.number,
    areaName: t.area?.name,
  }));

  // Default a true per le immagini se non esplicitamente "false"
  const showImages = showImagesSetting ? showImagesSetting.value === "true" : true;

  return (
    <MenuManagementView
      initialMenuItems={menuItems}
      initialShowImages={showImages}
      restaurantName={tenantConfig.theme.restaurantName}
      tagline={tenantConfig.theme.tagline}
      logoUrl={tenantConfig.theme.logoUrl}
      tables={tables}
    />
  );
}
