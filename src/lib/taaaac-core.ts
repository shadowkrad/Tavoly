import { TenantConfigResponse } from "@/types/taaaac";

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
    restaurantName: "Trattoria Moderna Da Taaaac",
    tagline: "Gestione Sale & Prenotazioni Smart",
    primaryColor: "#2563eb", // Royal blue Taaaac
    primaryHover: "#1d4ed8",
    accentColor: "#f97316", // Orange accent
    logoUrl: "",
  },
};

export async function getTenantConfig(): Promise<TenantConfigResponse> {
  const coreUrl = process.env.TAAAAC_CORE_URL || "https://taaaac.eu";
  const domain = process.env.TAAAAC_DOMAIN || "demo.taaaac.eu";
  const token = process.env.TAAAAC_TOKEN || "demo-token";

  try {
    const url = `${coreUrl}/api/public/tenant-config?domain=${encodeURIComponent(
      domain
    )}&token=${encodeURIComponent(token)}`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.warn(
        `[Taaaac Core] Risposta non OK (${res.status}). Utilizzo configurazione tenant fallback.`
      );
      return DEFAULT_MOCK_CONFIG;
    }

    const data = await res.json();
    if (!data || !data.success) {
      console.warn(
        "[Taaaac Core] Risposta invalida o licenza non trovata. Utilizzo fallback."
      );
      return DEFAULT_MOCK_CONFIG;
    }

    return data as TenantConfigResponse;
  } catch (error) {
    console.warn(
      "[Taaaac Core] Errore di connessione a Taaaac Core:",
      error instanceof Error ? error.message : error
    );
    return DEFAULT_MOCK_CONFIG;
  }
}
