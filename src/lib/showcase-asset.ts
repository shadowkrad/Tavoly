import crypto from "crypto";

export type ShowcaseAssetSlot = "logo" | "hero" | "gallery" | "map" | "dish";

/**
 * Se l'URL è un `data:image/...` incorporato, restituisce un indirizzo leggero
 * e memorizzabile in cache (`/api/showcase-asset?slot=...&v=<sha1_8>`),
 * riducendo drasticamente il peso dell'HTML (RSC payload incluso) delle pagine pubbliche.
 */
export function urlImmagineVetrina(
  rawUrl: string | null | undefined,
  slot: ShowcaseAssetSlot,
  id?: string
): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith("data:")) return trimmed;

  const v = crypto.createHash("sha1").update(trimmed).digest("hex").slice(0, 8);
  const idParam = id ? `&id=${encodeURIComponent(id)}` : "";
  return `/api/showcase-asset?slot=${encodeURIComponent(slot)}${idParam}&v=${v}`;
}
