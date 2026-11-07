/**
 * Fonte unica dei dati dell'attività (Tavoly).
 *
 * - Nome, indirizzo, telefono, email, descrizione e ORARI UFFICIALI si modificano SOLO in
 *   Impostazioni > Ristorante. Tutto il resto (vetrina pubblica, Studio Aspetto, Google/Facebook/
 *   Instagram) li legge da qui e non li duplica.
 * - Colori, logo e favicon si modificano SOLO nello Studio Aspetto (vetrina).
 * - Gli orari dei turni tavolo/cucina e dell'asporto sono volutamente separati: servono solo
 *   alle prenotazioni e agli ordini, non vengono mai mostrati come orario dell'attività.
 */
import { prisma } from "@/lib/prisma";
import { parseShowcaseConfig, ShowcaseConfig } from "@/lib/showcase-defaults";
import {
  parseOrariSettimanaliConfig,
  formatOrariSummary,
  OrariSettimanaliConfig,
} from "@/lib/orari-settimanali";
import type { OmnichannelDayHours } from "@/lib/omnichannel-client";

export const CHIAVI_ANAGRAFICA = [
  "restaurant_name",
  "address",
  "contact_phone",
  "contact_email",
  "business_description",
  "orari_settimanali_config",
  "hours_weekday",
  "hours_weekend",
  "hours_note",
] as const;

export interface OrariUfficiali {
  config: OrariSettimanaliConfig;
  hoursWeekday: string;
  hoursWeekend: string;
  hoursNote: string;
}

/** Orari ufficiali: i testi sono SEMPRE ricavati dalla configurazione settimanale, mai da testi salvati a parte. */
export function ricavaOrariUfficiali(map: Record<string, string>, rispettaFestivitaDb?: boolean): OrariUfficiali {
  const config = parseOrariSettimanaliConfig(
    map["orari_settimanali_config"],
    map["hours_weekday"],
    map["hours_weekend"],
    map["hours_note"],
    rispettaFestivitaDb
  );
  const s = formatOrariSummary(config);
  return { config, hoursWeekday: s.hoursWeekday, hoursWeekend: s.hoursWeekend, hoursNote: s.hoursNote };
}

/** Porta nella vetrina i dati dell'attività, sovrascrivendo qualunque copia vecchia salvata nello Studio. */
export function applicaAnagrafica(
  showcase: ShowcaseConfig,
  map: Record<string, string>,
  orari: OrariUfficiali
): ShowcaseConfig {
  const ci = { ...(showcase.contactInfo || {}) };
  if (map["address"] !== undefined) ci.address = map["address"];
  if (map["contact_phone"] !== undefined) ci.phone = map["contact_phone"];
  if (map["contact_email"] !== undefined) ci.email = map["contact_email"];
  ci.hoursWeekday = orari.hoursWeekday;
  ci.hoursWeekend = orari.hoursWeekend;
  ci.hoursNote = orari.hoursNote;
  showcase.contactInfo = ci;

  if (map["restaurant_name"]) showcase.brandName = map["restaurant_name"];
  if (map["business_description"] !== undefined) {
    showcase.about = { ...showcase.about, description: map["business_description"] };
  }
  return showcase;
}

export async function leggiImpostazioniAnagrafica(): Promise<{
  map: Record<string, string>;
  showcaseRaw: string | undefined;
  orari: OrariUfficiali;
}> {
  const [settings, cache] = await Promise.all([
    prisma.localSetting.findMany({
      where: { key: { in: [...CHIAVI_ANAGRAFICA, "showcase_config"] } },
    }),
    prisma.tenantLocalCache.findUnique({ where: { id: "singleton" } }).catch(() => null),
  ]);
  const map: Record<string, string> = {};
  for (const s of settings) map[s.key] = s.value;
  const orari = ricavaOrariUfficiali(map, (cache as any)?.rispettaFestivitaNazionali);
  return { map, showcaseRaw: map["showcase_config"], orari };
}

/** Vetrina completa e coerente: Studio + dati dell'attività + orari ufficiali. */
export async function caricaVetrinaUnificata(): Promise<{
  showcase: ShowcaseConfig;
  orari: OrariUfficiali;
  map: Record<string, string>;
}> {
  const { map, showcaseRaw, orari } = await leggiImpostazioniAnagrafica();
  const showcase = applicaAnagrafica(parseShowcaseConfig(showcaseRaw), map, orari);
  return { showcase, orari, map };
}

/** Riscrive showcase_config con i dati dell'attività allineati (per chi legge direttamente il JSON salvato). */
export async function riallineaVetrinaSalvata(): Promise<void> {
  const { showcase } = await caricaVetrinaUnificata();
  const value = JSON.stringify(showcase);
  await prisma.localSetting.upsert({
    where: { key: "showcase_config" },
    create: { key: "showcase_config", value },
    update: { value },
  });
}

const GIORNI_OMNI: Array<[keyof OrariUfficiali["config"]["giorni"], OmnichannelDayHours["dayOfWeek"]]> = [
  ["lun", "MONDAY"],
  ["mar", "TUESDAY"],
  ["mer", "WEDNESDAY"],
  ["gio", "THURSDAY"],
  ["ven", "FRIDAY"],
  ["sab", "SATURDAY"],
  ["dom", "SUNDAY"],
];

/** Orari ufficiali nel formato di Google Maps / Facebook / Instagram (giorni di chiusura inclusi). */
export function orariUfficialiPerCanali(config: OrariSettimanaliConfig): OmnichannelDayHours[] {
  return GIORNI_OMNI.map(([id, dayOfWeek]) => {
    const g = config.giorni[id];
    if (!g || !g.aperto) return { dayOfWeek, isOpen: false, slots: [] };
    const slots = [{ open: g.oraInizio1, close: g.oraFine1 }];
    if (g.modalita === "SPEZZATO" && g.oraInizio2 && g.oraFine2) {
      slots.push({ open: g.oraInizio2, close: g.oraFine2 });
    }
    return { dayOfWeek, isOpen: true, slots };
  });
}
