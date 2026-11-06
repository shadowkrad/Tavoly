import { prisma } from "@/lib/prisma";

export interface BrandLocale {
  nome: string;
  logoUrl: string | null;
  accento: string;
  primario: string;
  telefono: string;
  indirizzo: string;
  email: string;
}

/** Nome, logo, colori e recapiti dell'attivita' (impostazioni locali, come nel resto di Tavoly). */
export async function leggiBrand(): Promise<BrandLocale> {
  let map: Record<string, string> = {};
  try {
    const righe = await prisma.localSetting.findMany({
      where: { key: { in: ["restaurant_name", "brand_logo_url", "color_primary", "color_accent", "contact_phone", "contact_email", "address"] } },
    });
    map = Object.fromEntries(righe.map((r) => [r.key, r.value]));
  } catch {
    map = {};
  }
  return {
    nome: map["restaurant_name"]?.trim() || "Ristorante Tavoly",
    logoUrl: map["brand_logo_url"]?.trim() || null,
    accento: map["color_accent"]?.trim() || "#059669",
    primario: map["color_primary"]?.trim() || "#064e3b",
    telefono: map["contact_phone"]?.trim() || "",
    indirizzo: map["address"]?.trim() || "",
    email: map["contact_email"]?.trim() || "",
  };
}

/** Stessa informazione di `leggiBrand`, nella forma usata dalle pagine pubbliche (tessera, icona, manifest). */
export async function impDaBrand() {
  const b = await leggiBrand();
  return { brandName: b.nome, accentColor: b.accento, primaryColor: b.primario, logoUrl: b.logoUrl, phone: b.telefono };
}
