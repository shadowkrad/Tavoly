import { TenantConfigResponse, TenantTheme } from "@/types/taaaac";
import { prisma } from "@/lib/prisma";

export const THEME_PALETTES: Record<string, TenantTheme> = {
  ROYAL_BLUE: {
    restaurantName: "Trattoria Moderna",
    tagline: "Gestione Sale & Prenotazioni Smart",
    primaryColor: "#2563eb",
    primaryHover: "#1d4ed8",
    accentColor: "#f97316",
    logoUrl: "",
  },
  TERRACOTTA: {
    restaurantName: "Trattoria Rustica",
    tagline: "Sapori della Tradizione & Brace",
    primaryColor: "#c2410c",
    primaryHover: "#9a3412",
    accentColor: "#d97706",
    logoUrl: "",
  },
  BISTROT_SMERALDO: {
    restaurantName: "Bistrot Botanico",
    tagline: "Caffetteria, Cocktail & Cucina Naturale",
    primaryColor: "#047857",
    primaryHover: "#065f46",
    accentColor: "#eab308",
    logoUrl: "",
  },
  ENOTECA_BORDEAUX: {
    restaurantName: "Enoteca Con Cucina",
    tagline: "Grandi Vini & Piatti Gourmet",
    primaryColor: "#881337",
    primaryHover: "#701a75",
    accentColor: "#f59e0b",
    logoUrl: "",
  },
};

const DEFAULT_MOCK_CONFIG: TenantConfigResponse = {
  success: true,
  tenantId: "tenant_tavoly_001",
  domain: "demo.taaaac.eu",
  licenseStatus: "ATTIVO",
  licenseExpiresAt: "2026-12-31T23:59:59Z",
  enabledModules: [
    "WHATSAPP_REMINDERS",
    "LOYALTY_CARD",
    "VENDOLY_CHANNEL_MANAGER",
  ],
  theme: {
    restaurantName: "Ristorante Tavoly",
    tagline: "Sale, Tavoli & Cucina d'Autore",
    primaryColor: "#064e3b",
    primaryHover: "#065f46",
    accentColor: "#059669",
    logoUrl: "",
  },
  phone: "+39 0575 654321",
  contact: {
    phone: "+39 0575 654321",
    email: "info@osteriatavoli.it",
  },
};

export async function getTenantConfig(): Promise<TenantConfigResponse> {
  const coreUrl = process.env.TAAAAC_CORE_URL || "https://taaaac.eu";
  const domain = process.env.TAAAAC_DOMAIN || "demo.taaaac.eu";
  const token = process.env.TAAAAC_TOKEN || "demo-token";

  // 1. Recupera override locali memorizzati su SQLite (tabella LocalSetting)
  let localThemeOverride: TenantTheme | null = null;
  let brandLogoUrl: string | undefined;
  let brandFaviconUrl: string | undefined;
  let localRestaurantName: string | undefined;
  let localColorPrimary: string | undefined;
  let localColorAccent: string | undefined;
  let localPhone: string | undefined;
  let localEmail: string | undefined;

  try {
    const settings = await prisma.localSetting.findMany({
      where: {
        key: {
          in: [
            "active_palette_id",
            "brand_logo_url",
            "brand_favicon_url",
            "restaurant_name",
            "color_primary",
            "color_accent",
            "contact_phone",
            "contact_email",
            "showcase_config",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    if (map["active_palette_id"] && THEME_PALETTES[map["active_palette_id"]]) {
      localThemeOverride = THEME_PALETTES[map["active_palette_id"]];
    }
    if (map["brand_logo_url"] !== undefined) brandLogoUrl = map["brand_logo_url"];
    if (map["brand_favicon_url"] !== undefined) brandFaviconUrl = map["brand_favicon_url"];
    if (map["restaurant_name"] && map["restaurant_name"].trim().length > 0) {
      localRestaurantName = map["restaurant_name"].trim();
    }
    if (map["color_primary"] && map["color_primary"].trim().length > 0) {
      localColorPrimary = map["color_primary"].trim();
    }
    if (map["color_accent"] && map["color_accent"].trim().length > 0) {
      localColorAccent = map["color_accent"].trim();
    }
    if (map["contact_phone"] && map["contact_phone"].trim().length > 0) {
      localPhone = map["contact_phone"].trim();
    }
    if (map["contact_email"] && map["contact_email"].trim().length > 0) {
      localEmail = map["contact_email"].trim();
    }
    if (map["showcase_config"]) {
      try {
        const sc = JSON.parse(map["showcase_config"]);
        if (sc?.contactInfo?.phone && sc.contactInfo.phone.trim().length > 0) {
          localPhone = sc.contactInfo.phone.trim();
        }
        if (sc?.contactInfo?.email && sc.contactInfo.email.trim().length > 0) {
          localEmail = sc.contactInfo.email.trim();
        }
      } catch {}
    }
  } catch {
    // silenzioso se db in inizializzazione
  }

  const applyBrandOverrides = (cfg: TenantConfigResponse): TenantConfigResponse => {
    if (localThemeOverride) {
      cfg.theme = {
        ...cfg.theme,
        primaryColor: localThemeOverride.primaryColor,
        primaryHover: localThemeOverride.primaryHover,
        accentColor: localThemeOverride.accentColor,
      };
    }

    if (localColorPrimary) {
      cfg.theme.primaryColor = localColorPrimary;
      cfg.theme.primaryHover = localColorPrimary;
    }
    if (localColorAccent) {
      cfg.theme.accentColor = localColorAccent;
    }

    if (brandLogoUrl !== undefined && brandLogoUrl.trim().length > 0) {
      cfg.theme.logoUrl = brandLogoUrl;
    }
    if (brandFaviconUrl !== undefined && brandFaviconUrl.trim().length > 0) {
      cfg.theme.faviconUrl = brandFaviconUrl;
    }

    if (localRestaurantName) {
      cfg.theme.restaurantName = localRestaurantName;
    }

    const resolvedPhone = localPhone || cfg.contact?.phone || cfg.phone || "+39 0575 654321";
    const resolvedEmail = localEmail || cfg.contact?.email || "info@osteriatavoli.it";
    cfg.phone = resolvedPhone;
    cfg.contact = {
      ...cfg.contact,
      phone: resolvedPhone,
      email: resolvedEmail,
    };

    return cfg;
  };

  try {
    const url = `${coreUrl}/api/public/tenant-config?domain=${encodeURIComponent(
      domain
    )}&token=${encodeURIComponent(token)}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const config = applyBrandOverrides(data as TenantConfigResponse);
        try {
          await prisma.localSetting.upsert({
            where: { key: "tenant_config_cache" },
            create: { key: "tenant_config_cache", value: JSON.stringify(config) },
            update: { value: JSON.stringify(config) },
          });
        } catch {}
        return config;
      }
    }
  } catch (error) {
    console.warn(
      "[Taaaac Core] Connessione Core non disponibile, controllo cache locale SQLite...",
      error instanceof Error ? error.message : error
    );
  }

  // 2. Fallback su cache SQLite se disponibile
  try {
    const cached = await prisma.localSetting.findUnique({
      where: { key: "tenant_config_cache" },
    });
    if (cached?.value) {
      const parsed = JSON.parse(cached.value) as TenantConfigResponse;
      return applyBrandOverrides(parsed);
    }
  } catch {}

  // 3. Fallback predefinito
  const fallback = { ...DEFAULT_MOCK_CONFIG };
  return applyBrandOverrides(fallback);
}
