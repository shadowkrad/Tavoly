import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { leggiBrand } from "@/lib/brand-locale";
import { caricaVetrinaUnificata } from "@/lib/anagrafica-attivita";
import {
  CartaGraficaConfig,
  DatiAttivitaCarta,
  OrarioGiornoCarta,
  normalizzaCartaGraficaConfig,
  applicaPersonalizzati,
} from "@/lib/carta-grafica-types";

const GIORNI_TAVOLY: Array<[string, string]> = [
  ["lun", "LUNEDÌ"],
  ["mar", "MARTEDÌ"],
  ["mer", "MERCOLEDÌ"],
  ["gio", "GIOVEDÌ"],
  ["ven", "VENERDÌ"],
  ["sab", "SABATO"],
  ["dom", "DOMENICA"],
];

export async function caricaCartaGrafica(origineUrl?: string): Promise<{
  config: CartaGraficaConfig;
  attivita: DatiAttivitaCarta;
  /** Dati di Impostazioni, senza le voci cambiate solo per biglietti e buoni (serve all'editor). */
  ereditata: DatiAttivitaCarta;
}> {
  const [{ showcase, orari, map }, brand] = await Promise.all([
    caricaVetrinaUnificata(),
    leggiBrand(),
  ]);

  let rawJson: Record<string, any> = {};
  try {
    if (map["showcase_config"]) {
      rawJson = JSON.parse(map["showcase_config"]);
    }
  } catch {
    rawJson = {};
  }

  const nome = (brand.nome || showcase.brandName || "Il Mio Ristorante").trim();
  const colorePrimario = (brand.primario || "#1e293b").trim();
  const coloreAccento = (brand.accento || "#C9A86A").trim();

  const config = normalizzaCartaGraficaConfig(rawJson?.cartaGrafica, {
    defaultPreset: "CLASSICO_ORO",
    coloreScuro: colorePrimario.startsWith("#") ? colorePrimario : "#1e293b",
    coloreChiaro: "#EAE0D0",
    coloreDettaglio: coloreAccento.startsWith("#") ? coloreAccento : "#C9A86A",
    sottotitoloBrand: "RISTORANTE & BISTROT",
  });

  const orariGiornalieri: OrarioGiornoCarta[] = GIORNI_TAVOLY.map(([key, label]) => {
    const g = (orari.config.giorni as any)?.[key];
    if (!g || !g.aperto) {
      return { giorno: label, orario: "CHIUSO", chiuso: true };
    }
    const fascia1 = `${g.oraInizio1} - ${g.oraFine1}`;
    const testo =
      g.modalita === "SPEZZATO" && g.oraInizio2 && g.oraFine2
        ? `${fascia1} / ${g.oraInizio2} - ${g.oraFine2}`
        : fascia1;
    return { giorno: label, orario: testo, chiuso: false };
  });

  const orariRaggruppati: OrarioGiornoCarta[] = [
    ...(orari.hoursWeekday ? [{ giorno: "FERIALI", orario: orari.hoursWeekday, chiuso: false }] : []),
    ...(orari.hoursWeekend ? [{ giorno: "WEEKEND", orario: orari.hoursWeekend, chiuso: false }] : []),
  ];
  if (orariRaggruppati.length === 0) {
    orariRaggruppati.push(...orariGiornalieri);
  }

  const sitoUrl = (origineUrl || "https://tavoly.taaaac.eu").trim();
  let qrVetrinaDataUrl = "";
  try {
    qrVetrinaDataUrl = await QRCode.toDataURL(sitoUrl, { margin: 1, width: 280, errorCorrectionLevel: "M" });
  } catch {}

  const ereditata: DatiAttivitaCarta = {
    nome,
    slogan: "",
    indirizzo: (brand.indirizzo || map["address"] || "").trim(),
    citta: "",
    telefono: (brand.telefono || map["contact_phone"] || "").trim(),
    email: (map["contact_email"] || "").trim(),
    sitoUrl,
    qrVetrinaDataUrl,
    logoUrl: brand.logoUrl || null,
    logoHeroUrl: (showcase as any)?.hero?.logoUrl || null,
    colorePrimario,
    coloreSecondario: "#EAE0D0",
    orariGiornalieri,
    orariRaggruppati,
  };

  return { config, attivita: applicaPersonalizzati(ereditata, config.personalizzati), ereditata };
}

export async function salvaCartaGrafica(nuovaConfig: unknown): Promise<CartaGraficaConfig> {
  const row = await prisma.localSetting.findUnique({ where: { key: "showcase_config" } });
  let rawJson: Record<string, any> = {};
  try {
    if (row?.value) rawJson = JSON.parse(row.value);
  } catch {
    rawJson = {};
  }

  const configNormalizzata = normalizzaCartaGraficaConfig(nuovaConfig, {
    defaultPreset: "CLASSICO_ORO",
    coloreScuro: "#1e293b",
    coloreChiaro: "#EAE0D0",
    coloreDettaglio: "#C9A86A",
    sottotitoloBrand: "RISTORANTE & BISTROT",
  });

  rawJson.cartaGrafica = configNormalizzata;
  const value = JSON.stringify(rawJson);

  await prisma.localSetting.upsert({
    where: { key: "showcase_config" },
    create: { key: "showcase_config", value },
    update: { value },
  });

  return configNormalizzata;
}
