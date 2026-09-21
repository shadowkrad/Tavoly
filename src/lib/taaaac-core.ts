import { TenantConfigResponse, TenantTheme } from "@/types/taaaac";
import { prisma } from "@/lib/prisma";

export const THEME_PALETTES: Record<string, TenantTheme> = {
  ROYAL_BLUE: {
    restaurantName: "Trattoria Moderna Da Taaaac",
    tagline: "Gestione Sale & Prenotazioni Smart",
    primaryColor: "#2563eb",
    primaryHover: "#1d4ed8",
    accentColor: "#f97316",
    logoUrl: "",
  },
  TERRACOTTA: {
    restaurantName: "Trattoria Rustica Da Taaaac",
    tagline: "Sapori della Tradizione & Brace",
    primaryColor: "#c2410c",
    primaryHover: "#9a3412",
    accentColor: "#d97706",
    logoUrl: "",
  },
  BISTROT_SMERALDO: {
    restaurantName: "Bistrot Botanico Da Taaaac",
    tagline: "Caffetteria, Cocktail & Cucina Naturale",
    primaryColor: "#047857",
    primaryHover: "#065f46",
    accentColor: "#eab308",
    logoUrl: "",
  },
  ENOTECA_BORDEAUX: {
    restaurantName: "Enoteca Con Cucina Da Taaaac",
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
  theme: THEME_PALETTES.ROYAL_BLUE,
};

export async function getTenantConfig(): Promise<TenantConfigResponse> {
  const coreUrl = process.env.TAAAAC_CORE_URL || "https://taaaac.eu";
  const domain = process.env.TAAAAC_DOMAIN || "demo.taaaac.eu";
  const token = process.env.TAAAAC_TOKEN || "demo-token";

  // 1. Verifica se presente override locale tema su SQLite
  let localThemeOverride: TenantTheme | null = null;
  try {
    const themeSetting = await prisma.localSetting.findUnique({
      where: { key: "active_palette_id" },
    });
    if (themeSetting?.value && THEME_PALETTES[themeSetting.value]) {
      localThemeOverride = THEME_PALETTES[themeSetting.value];
    }
  } catch {
    // silenzioso se db in inizializzazione
  }

  try {
    const url = `${coreUrl}/api/public/tenant-config?domain=${encodeURIComponent(
      domain
    )}&token=${encodeURIComponent(token)}`;

    const res = await fetch(url, {
      next: { revalidate: 300 }, // 5 minuti
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        const config = data as TenantConfigResponse;
        if (localThemeOverride) {
          config.theme = { ...config.theme, ...localThemeOverride };
        }
        // Salva in cache SQLite
        try {
          await prisma.localSetting.upsert({
            where: { key: "tenant_config_cache" },
            create: { key: "tenant_config_cache", value: JSON.stringify(config) },
            update: { value: JSON.stringify(config) },
          });
        } catch {
          // opzionale
        }
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
      if (localThemeOverride) {
        parsed.theme = { ...parsed.theme, ...localThemeOverride };
      }
      return parsed;
    }
  } catch {
    // fallback successivo
  }

  // 3. Fallback predefinito
  const fallback = { ...DEFAULT_MOCK_CONFIG };
  if (localThemeOverride) {
    fallback.theme = { ...fallback.theme, ...localThemeOverride };
  }
  return fallback;
}
