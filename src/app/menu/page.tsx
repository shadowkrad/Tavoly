import React from "react";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { PublicMenuView } from "@/components/public/PublicMenuView";
import { MenuItemData } from "@/components/dashboard/MenuItemModal";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getTenantConfig();
  return {
    title: `Menù Digitale — ${config.theme.restaurantName}`,
    description: `Consulta il menù digitale, i prezzi e gli allergeni di ${config.theme.restaurantName}`,
  };
}

interface PageProps {
  searchParams: Promise<{ tavolo?: string }>;
}

export default async function PublicMenuPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const tableNumber = resolvedParams?.tavolo || null;

  const [tenantConfig, rawMenuItems, showImagesSetting] = await Promise.all([
    getTenantConfig(),
    prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { name: "asc" }],
    }),
    prisma.localSetting.findUnique({
      where: { key: "menu_show_dish_images" },
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

  const showImages = showImagesSetting ? showImagesSetting.value === "true" : true;

  return (
    <PublicMenuView
      menuItems={menuItems}
      showImages={showImages}
      restaurantName={tenantConfig.theme.restaurantName}
      tagline={tenantConfig.theme.tagline}
      logoUrl={tenantConfig.theme.logoUrl}
      tableNumber={tableNumber}
    />
  );
}
