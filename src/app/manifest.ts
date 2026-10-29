import { MetadataRoute } from "next";
import { getTenantConfig } from "@/lib/taaaac-core";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let brandName = "Tavoly";
  let themeColor = "#059669";
  let iconSrc = "/icon-192.png";

  try {
    const config = await getTenantConfig();
    if (config?.theme?.restaurantName) {
      brandName = config.theme.restaurantName;
    }
    if (config?.theme?.primaryColor) {
      themeColor = config.theme.primaryColor;
    }
    if (config?.theme?.faviconUrl || config?.theme?.logoUrl) {
      iconSrc = config.theme.faviconUrl || config.theme.logoUrl || "/icon-192.png";
    }
  } catch (err) {
    console.error("[PWA Manifest] Fallback su default:", err);
  }

  return {
    name: `${brandName} — Gestionale Sale, Tavoli & Comande`,
    short_name: brandName,
    description: `Modulo gestionale sale, comande e coperti per ${brandName}, parte dell'ecosistema Taaaac.`,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: themeColor,
    icons: [
      {
        src: iconSrc,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: iconSrc,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
