import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { THEME_PALETTES } from "@/lib/taaaac-core";

export interface SorgentiIconaPwa {
  faviconUrl: string | null;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  v: string;
}

/** Primi 8 caratteri SHA-1 di `faviconUrl|logoUrl` per invalidare la cache a ogni cambio icona/logo. */
export function calcolaHashIcona(faviconUrl?: string | null, logoUrl?: string | null): string {
  const raw = `${(faviconUrl || "").trim()}|${(logoUrl || "").trim()}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 8);
}

/** Primi 8 caratteri SHA-1 per l'icona della tessera fedeltà digitale (`/tessera/[token]/icona`). */
export function calcolaHashLogoTessera(
  logoUrl?: string | null,
  accento?: string | null,
  nome?: string | null
): string {
  const raw = `${(logoUrl || "").trim()}|${(accento || "").trim()}|${(nome || "").trim()}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 8);
}

/** Costruisce l'URL versionato verso `/api/pwa-icon`. */
export function pwaIconUrl(size: number, v: string, opts?: { maskable?: boolean }): string {
  const mask = opts?.maskable ? "&maskable=1" : "";
  const ver = v ? `&v=${encodeURIComponent(v)}` : "";
  return `/api/pwa-icon?size=${size}${mask}${ver}`;
}

/** Legge favicon, logo e colori del ristorante da `LocalSetting` e calcola il codice versione `v`. */
export async function leggiSorgentiIconaPwa(): Promise<SorgentiIconaPwa> {
  let faviconUrl: string | null = null;
  let logoUrl: string | null = null;
  let primaryColor = "#064e3b";
  let accentColor = "#059669";

  try {
    const settings = await prisma.localSetting.findMany({
      where: {
        key: {
          in: [
            "brand_favicon_url",
            "brand_logo_url",
            "color_primary",
            "color_accent",
            "active_palette_id",
            "tenant_config_cache",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    if (map["tenant_config_cache"]) {
      try {
        const cached = JSON.parse(map["tenant_config_cache"]);
        if (typeof cached?.theme?.primaryColor === "string" && cached.theme.primaryColor.trim()) {
          primaryColor = cached.theme.primaryColor.trim();
        }
        if (typeof cached?.theme?.accentColor === "string" && cached.theme.accentColor.trim()) {
          accentColor = cached.theme.accentColor.trim();
        }
        if (typeof cached?.theme?.faviconUrl === "string" && cached.theme.faviconUrl.trim()) {
          faviconUrl = cached.theme.faviconUrl.trim();
        }
        if (typeof cached?.theme?.logoUrl === "string" && cached.theme.logoUrl.trim()) {
          logoUrl = cached.theme.logoUrl.trim();
        }
      } catch {
        // ignora JSON non valido
      }
    }

    const paletteId = map["active_palette_id"];
    if (paletteId && THEME_PALETTES[paletteId]) {
      primaryColor = THEME_PALETTES[paletteId].primaryColor;
      accentColor = THEME_PALETTES[paletteId].accentColor;
    }

    if (map["color_primary"]?.trim()) {
      primaryColor = map["color_primary"].trim();
    }
    if (map["color_accent"]?.trim()) {
      accentColor = map["color_accent"].trim();
    }
    if (map["brand_favicon_url"] !== undefined) {
      faviconUrl = map["brand_favicon_url"].trim() || null;
    }
    if (map["brand_logo_url"] !== undefined) {
      logoUrl = map["brand_logo_url"].trim() || null;
    }
  } catch {
    // fallback sicuro se DB non ancora pronto
  }

  return {
    faviconUrl,
    logoUrl,
    primaryColor,
    accentColor,
    v: calcolaHashIcona(faviconUrl, logoUrl),
  };
}

export async function getPwaIconVersion(): Promise<string> {
  const s = await leggiSorgentiIconaPwa();
  return s.v;
}
