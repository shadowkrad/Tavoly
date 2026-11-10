import { MetadataRoute } from "next";
import { getTenantConfig } from "@/lib/taaaac-core";
import { calcolaHashIcona, pwaIconUrl } from "@/lib/pwa-icon-version";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let brandName = "Tavoly";
  let themeColor = "#059669";
  let v = calcolaHashIcona(null, null);

  try {
    const config = await getTenantConfig();
    if (config?.theme?.restaurantName) {
      brandName = config.theme.restaurantName;
    }
    if (config?.theme?.primaryColor) {
      themeColor = config.theme.primaryColor;
    }
    v = calcolaHashIcona(config?.theme?.faviconUrl, config?.theme?.logoUrl);
  } catch (err) {
    console.error("[PWA Manifest] Fallback su default:", err);
  }

  return {
    name: `${brandName} — Gestionale Sale, Tavoli & Comande`,
    short_name: brandName,
    description: `Modulo gestionale sale, comande e coperti per ${brandName}, parte dell'ecosistema Taaaac.`,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: themeColor,
    icons: [
      {
        src: pwaIconUrl(192, v),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl(512, v),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: pwaIconUrl(512, v, { maskable: true }),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
