/**
 * Engine Festività Nazionali Italiane & Risoluzione Calendario Speciale per Tavoly
 * Gestisce festività fisse, festività mobili (Pasqua e Lunedì dell'Angelo) e risoluzione a 3 livelli:
 * 1. Eccezione esplicita ristorante (EccezioneCalendario)
 * 2. Festività nazionale italiana (se abilitata dal gestore)
 * 3. Orari settimanali del ristorante (Lunedì - Domenica, orario intero o spezzato)
 */

import { prisma } from "@/lib/prisma";
import {
  getDayIdFromJsIndex,
  parseOrariSettimanaliConfig,
  OrariSettimanaliConfig,
} from "@/lib/orari-settimanali";

export function calcolaPasqua(anno: number): { giorno: number; mese: number } {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31);
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return { giorno, mese };
}

export function getElencoFestivitaAnno(anno: number): Array<{ data: string; nome: string }> {
  const pad = (n: number) => String(n).padStart(2, "0");

  const { giorno: pG, mese: pM } = calcolaPasqua(anno);
  const pasquaDate = new Date(Date.UTC(anno, pM - 1, pG));
  const pasquettaDate = new Date(pasquaDate);
  pasquettaDate.setUTCDate(pasquettaDate.getUTCDate() + 1);

  const pasquaStr = `${anno}-${pad(pM)}-${pad(pG)}`;
  const pasquettaStr = `${anno}-${pad(pasquettaDate.getUTCMonth() + 1)}-${pad(pasquettaDate.getUTCDate())}`;

  return [
    { data: `${anno}-01-01`, nome: "Capodanno" },
    { data: `${anno}-01-06`, nome: "Epifania / Befana" },
    { data: pasquaStr, nome: "Pasqua" },
    { data: pasquettaStr, nome: "Lunedì dell'Angelo (Pasquetta)" },
    { data: `${anno}-04-25`, nome: "Festa della Liberazione" },
    { data: `${anno}-05-01`, nome: "Festa dei Lavoratori" },
    { data: `${anno}-06-02`, nome: "Festa della Repubblica" },
    { data: `${anno}-08-15`, nome: "Ferragosto (Assunzione)" },
    { data: `${anno}-11-01`, nome: "Tutti i Santi (Ognissanti)" },
    { data: `${anno}-12-08`, nome: "Immacolata Concezione" },
    { data: `${anno}-12-25`, nome: "Natale" },
    { data: `${anno}-12-26`, nome: "Santo Stefano" },
  ];
}

export function getFestivitaItaliana(dataInput: Date | string): {
  isFestivo: boolean;
  nome?: string;
} {
  try {
    let y: number, m: number, d: number;
    if (typeof dataInput === "string") {
      const parts = dataInput.slice(0, 10).split("-").map(Number);
      if (parts.length !== 3 || isNaN(parts[0])) return { isFestivo: false };
      [y, m, d] = parts;
    } else {
      y = dataInput.getFullYear();
      m = dataInput.getMonth() + 1;
      d = dataInput.getDate();
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const targetIso = `${y}-${pad(m)}-${pad(d)}`;

    const elenco = getElencoFestivitaAnno(y);
    const trovata = elenco.find((f) => f.data === targetIso);
    if (trovata) {
      return { isFestivo: true, nome: trovata.nome };
    }
    return { isFestivo: false };
  } catch {
    return { isFestivo: false };
  }
}

export interface RisoluzioneGiornoTavoly {
  data: string;
  isLavorativo: boolean;
  stato: "APERTO_STANDARD" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE" | "CHIUSO_STANDARD" | "CHIUSO_FESTIVITA" | "CHIUSO_FERIE";
  titolo: string;
  motivo?: string;
  oraInizio?: string;
  oraFine?: string;
  pausaInizio?: string | null;
  pausaFine?: string | null;
  fonte: "ECCEZIONE" | "FESTIVITA_NAZIONALE" | "ORARIO_STANDARD";
}

export async function risolviStatoGiornoTavoly(
  dataStr: string
): Promise<RisoluzioneGiornoTavoly> {
  const cleanData = dataStr.slice(0, 10);
  const [y, m, d] = cleanData.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0 = Dom, 1 = Lun, etc.
  const dayId = getDayIdFromJsIndex(dayOfWeek);

  // Recupera impostazioni orari e tenant cache
  const [settings, cache, eccezione] = await Promise.all([
    prisma.localSetting.findMany({
      where: {
        key: {
          in: ["orari_settimanali_config", "hours_weekday", "hours_weekend", "hours_note"],
        },
      },
    }),
    prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    }),
    prisma.eccezioneCalendario.findUnique({
      where: { data: cleanData },
    }),
  ]);

  const mapSettings: Record<string, string> = {};
  for (const s of settings) {
    mapSettings[s.key] = s.value;
  }

  const orariConfig: OrariSettimanaliConfig = parseOrariSettimanaliConfig(
    mapSettings["orari_settimanali_config"],
    mapSettings["hours_weekday"],
    mapSettings["hours_weekend"],
    mapSettings["hours_note"],
    (cache as any)?.rispettaFestivitaNazionali
  );

  const rispettaFestivita = orariConfig.rispettaFestivitaNazionali;

  // 1. Controlla EccezioneCalendario specifica per la data (Ferie o Apertura Speciale)
  if (eccezione) {
    if (eccezione.tipo === "CHIUSURA" || !eccezione.isAperto) {
      return {
        data: cleanData,
        isLavorativo: false,
        stato: "CHIUSO_FERIE",
        titolo: eccezione.titolo || "Chiusura Straordinaria",
        motivo: eccezione.note || `Chiusura speciale programmata: ${eccezione.titolo}`,
        fonte: "ECCEZIONE",
      };
    }
    if (eccezione.tipo === "APERTURA_STRAORDINARIA" || eccezione.tipo === "ORARIO_SPECIALE") {
      return {
        data: cleanData,
        isLavorativo: true,
        stato: eccezione.tipo,
        titolo: eccezione.titolo || "Apertura Straordinaria",
        motivo: `Apertura eccezionale: ${eccezione.titolo}`,
        oraInizio: eccezione.orarioApertura || "12:00",
        oraFine: eccezione.orarioChiusura || "23:30",
        pausaInizio: eccezione.pausaInizio,
        pausaFine: eccezione.pausaFine,
        fonte: "ECCEZIONE",
      };
    }
  }

  // 2. Controlla Festività Nazionale Italiana (se abilitato dal gestore)
  if (rispettaFestivita) {
    const fest = getFestivitaItaliana(cleanData);
    if (fest.isFestivo) {
      return {
        data: cleanData,
        isLavorativo: false,
        stato: "CHIUSO_FESTIVITA",
        titolo: fest.nome || "Festività Nazionale",
        motivo: `Chiuso per festività nazionale italiana (${fest.nome})`,
        fonte: "FESTIVITA_NAZIONALE",
      };
    }
  }

  // 3. Orario Settimanale del Ristorante per questo giorno
  const giornoConfig = orariConfig.giorni[dayId];
  if (!giornoConfig || !giornoConfig.aperto) {
    return {
      data: cleanData,
      isLavorativo: false,
      stato: "CHIUSO_STANDARD",
      titolo: `${giornoConfig?.label || "Giorno"} di Chiusura`,
      motivo: `Il locale è chiuso per riposo settimanale il ${giornoConfig?.label || "giorno selezionato"}`,
      fonte: "ORARIO_STANDARD",
    };
  }

  // Giorno aperto: estrai orari
  if (giornoConfig.modalita === "SPEZZATO") {
    return {
      data: cleanData,
      isLavorativo: true,
      stato: "APERTO_STANDARD",
      titolo: "Aperto (Pranzo & Cena)",
      oraInizio: giornoConfig.oraInizio1 || "12:00",
      oraFine: giornoConfig.oraFine2 || "23:30",
      pausaInizio: giornoConfig.oraFine1 || "15:00",
      pausaFine: giornoConfig.oraInizio2 || "19:00",
      fonte: "ORARIO_STANDARD",
    };
  }

  return {
    data: cleanData,
    isLavorativo: true,
    stato: "APERTO_STANDARD",
    titolo: "Aperto (Orario Continuato)",
    oraInizio: giornoConfig.oraInizio1 || "11:00",
    oraFine: giornoConfig.oraFine1 || "23:00",
    pausaInizio: null,
    pausaFine: null,
    fonte: "ORARIO_STANDARD",
  };
}

export interface PreavvisoFestivita {
  data: string; // YYYY-MM-DD
  nome: string;
  giorniMancanti: number;
  dataFormattata: string;
  isLavorativo: boolean;
  stato: "APERTO_STANDARD" | "APERTURA_STRAORDINARIA" | "ORARIO_SPECIALE" | "CHIUSO_STANDARD" | "CHIUSO_FESTIVITA" | "CHIUSO_FERIE";
  titolo: string;
  motivo?: string;
  orario?: string;
  haEccezione: boolean;
  tipoEccezione?: string | null;
}

export async function getProssimeFestivitaTavoly(
  giorniFinestra: number = 7,
  daData: Date = new Date()
): Promise<PreavvisoFestivita[]> {
  try {
    const pad = (n: number) => String(n).padStart(2, "0");
    const risultati: PreavvisoFestivita[] = [];

    const cache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });
    const rispettaFestivita = (cache as any)?.rispettaFestivitaNazionali ?? true;

    const start = new Date(daData);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i <= giorniFinestra; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);

      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const d = current.getDate();
      const dateIso = `${y}-${pad(m)}-${pad(d)}`;

      const fest = rispettaFestivita ? getFestivitaItaliana(dateIso) : { isFestivo: false };
      const ecc = await prisma.eccezioneCalendario.findUnique({
        where: { data: dateIso },
      });

      if (!fest.isFestivo && !ecc) {
        continue;
      }

      const risoluzione = await risolviStatoGiornoTavoly(dateIso);

      const nomiGiorni = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
      const mesi = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
      const dataFormattata = `${nomiGiorni[current.getDay()]} ${d} ${mesi[m - 1]}`;

      let orario: string | undefined;
      if (risoluzione.isLavorativo && risoluzione.oraInizio && risoluzione.oraFine) {
        orario = `${risoluzione.oraInizio} – ${risoluzione.oraFine}`;
        if (risoluzione.pausaInizio && risoluzione.pausaFine) {
          orario += ` (pausa: ${risoluzione.pausaInizio}-${risoluzione.pausaFine})`;
        }
      }

      risultati.push({
        data: dateIso,
        nome: ecc?.titolo || fest.nome || "Data Speciale",
        giorniMancanti: i,
        dataFormattata,
        isLavorativo: risoluzione.isLavorativo,
        stato: risoluzione.stato,
        titolo: risoluzione.titolo,
        motivo: risoluzione.motivo,
        orario,
        haEccezione: !!ecc,
        tipoEccezione: ecc?.tipo || null,
      });
    }

    return risultati;
  } catch (error) {
    console.error("Errore calcolo getProssimeFestivitaTavoly:", error);
    return [];
  }
}
