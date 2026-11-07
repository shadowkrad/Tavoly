/**
 * Engine Orari Settimanali & Turni Dinamici per Tavoly
 * Gestisce la configurazione giorno per giorno (Lunedì - Domenica):
 * - Flag Aperto/Chiuso per ciascun giorno
 * - Modalità Orario Continuato vs Spezzato (Pranzo/Mattina + Cena/Sera)
 * - Flag Rispetto Festività Nazionali
 * - Generazione testi di riepilogo automatici per la vetrina
 * - Calcolo stato in tempo reale (Aperto Adesso, In Pausa, Chiuso per Riposo)
 */

export type GiornoSettimanaId = "lun" | "mar" | "mer" | "gio" | "ven" | "sab" | "dom";

export interface OrarioGiornoConfig {
  id: GiornoSettimanaId;
  label: string;
  aperto: boolean;
  modalita: "CONTINUATO" | "SPEZZATO";
  oraInizio1: string; // HH:mm
  oraFine1: string;   // HH:mm
  oraInizio2: string; // HH:mm (se spezzato)
  oraFine2: string;   // HH:mm (se spezzato)
}

export interface OrariSettimanaliConfig {
  giorni: Record<GiornoSettimanaId, OrarioGiornoConfig>;
  rispettaFestivitaNazionali: boolean;
  noteOrari?: string;
}

export const GIORNI_SETTIMANA_DEFAULT: Record<GiornoSettimanaId, OrarioGiornoConfig> = {
  lun: {
    id: "lun",
    label: "Lunedì",
    aperto: false,
    modalita: "SPEZZATO",
    oraInizio1: "11:00",
    oraFine1: "15:00",
    oraInizio2: "17:00",
    oraFine2: "23:00",
  },
  mar: {
    id: "mar",
    label: "Martedì",
    aperto: true,
    modalita: "SPEZZATO",
    oraInizio1: "11:00",
    oraFine1: "15:00",
    oraInizio2: "17:00",
    oraFine2: "23:00",
  },
  mer: {
    id: "mer",
    label: "Mercoledì",
    aperto: true,
    modalita: "SPEZZATO",
    oraInizio1: "11:00",
    oraFine1: "15:00",
    oraInizio2: "17:00",
    oraFine2: "23:00",
  },
  gio: {
    id: "gio",
    label: "Giovedì",
    aperto: true,
    modalita: "SPEZZATO",
    oraInizio1: "11:00",
    oraFine1: "15:00",
    oraInizio2: "17:00",
    oraFine2: "23:00",
  },
  ven: {
    id: "ven",
    label: "Venerdì",
    aperto: true,
    modalita: "SPEZZATO",
    oraInizio1: "11:00",
    oraFine1: "15:00",
    oraInizio2: "17:00",
    oraFine2: "23:00",
  },
  sab: {
    id: "sab",
    label: "Sabato",
    aperto: true,
    modalita: "CONTINUATO",
    oraInizio1: "16:00",
    oraFine1: "23:30",
    oraInizio2: "",
    oraFine2: "",
  },
  dom: {
    id: "dom",
    label: "Domenica",
    aperto: true,
    modalita: "CONTINUATO",
    oraInizio1: "16:00",
    oraFine1: "23:30",
    oraInizio2: "",
    oraFine2: "",
  },
};

export const DEFAULT_ORARI_SETTIMANALI: OrariSettimanaliConfig = {
  giorni: GIORNI_SETTIMANA_DEFAULT,
  rispettaFestivitaNazionali: false, // Per un ristorante/pizzeria festività spesso aperte!
  noteOrari: "Lunedì chiuso",
};

/**
 * Converte indice getDay() JS (0 = Domenica, 1 = Lunedì, ..., 6 = Sabato)
 * nella chiave GiornoSettimanaId
 */
export function getDayIdFromJsIndex(jsDay: number): GiornoSettimanaId {
  switch (jsDay) {
    case 1: return "lun";
    case 2: return "mar";
    case 3: return "mer";
    case 4: return "gio";
    case 5: return "ven";
    case 6: return "sab";
    case 0: return "dom";
    default: return "lun";
  }
}

/**
 * Parsing configurazione dal DB o da fallback stringhe
 */
export function parseOrariSettimanaliConfig(
  rawJson?: string | null,
  fallbackWeekday?: string | null,
  fallbackWeekend?: string | null,
  fallbackNote?: string | null,
  rispettaFestivitaDb?: boolean
): OrariSettimanaliConfig {
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed && parsed.giorni) {
        return {
          giorni: { ...GIORNI_SETTIMANA_DEFAULT, ...parsed.giorni },
          rispettaFestivitaNazionali: parsed.rispettaFestivitaNazionali ?? rispettaFestivitaDb ?? false,
          noteOrari: parsed.noteOrari !== undefined ? parsed.noteOrari : (fallbackNote || ""),
        };
      }
    } catch {
      // Ignora e procedi con parsing euristico
    }
  }

  // Costruisci configurazione iniziale intelligente partendo dai testi esistenti
  const base: OrariSettimanaliConfig = {
    giorni: JSON.parse(JSON.stringify(GIORNI_SETTIMANA_DEFAULT)),
    rispettaFestivitaNazionali: rispettaFestivitaDb ?? false,
    noteOrari: fallbackNote || "Lunedì chiuso",
  };

  // Se note indica Lunedì chiuso
  if (fallbackNote && /luned[iì].*chiuso/i.test(fallbackNote)) {
    base.giorni.lun.aperto = false;
  }

  return base;
}

/** Testo dell'orario di un singolo giorno ("Chiuso", "16:00 - 23:30", "11:00 - 15:00 / 17:00 - 23:00"). */
export function testoOrarioGiorno(day: OrarioGiornoConfig): string {
  if (!day.aperto) return "Chiuso";
  if (day.modalita === "SPEZZATO") {
    return `${day.oraInizio1} - ${day.oraFine1} / ${day.oraInizio2} - ${day.oraFine2}`;
  }
  return `${day.oraInizio1} - ${day.oraFine1}`;
}

const ORDINE_GIORNI: GiornoSettimanaId[] = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

/** Una nota che si limita a ripetere "Lunedi chiuso" e simili e' ridondante: i giorni chiusi sono gia' ricavati dagli orari. */
function notaSoloChiusura(nota: string): boolean {
  return /^\s*(luned|marted|mercoled|gioved|venerd|sabato|domenica)[^,;()]*chius[oi]\s*$/i.test(nota);
}

/** Nota libera dell'esercente (senza le ripetizioni dei giorni di chiusura). */
export function notaOrariPersonalizzata(config: OrariSettimanaliConfig): string {
  const n = config.noteOrari?.trim() || "";
  return n && !notaSoloChiusura(n) ? n : "";
}

export interface RigaOrario {
  label: string;
  orario: string;
  chiuso: boolean;
}

/** Orari raggruppati per giorni consecutivi uguali (es. "Mercoledi - Venerdi: 11:00 - 15:00 / 17:00 - 23:00"). */
export function raggruppaOrari(config: OrariSettimanaliConfig): RigaOrario[] {
  const righe: Array<{ da: OrarioGiornoConfig; a: OrarioGiornoConfig; orario: string; chiuso: boolean }> = [];
  for (const id of ORDINE_GIORNI) {
    const g = config.giorni[id];
    const orario = testoOrarioGiorno(g);
    const ultima = righe[righe.length - 1];
    if (ultima && ultima.orario === orario) {
      ultima.a = g;
    } else {
      righe.push({ da: g, a: g, orario, chiuso: !g.aperto });
    }
  }
  if (righe.length === 1) {
    return [{ label: "Tutti i giorni", orario: righe[0].orario, chiuso: righe[0].chiuso }];
  }
  return righe.map((r) => ({
    label: r.da.id === r.a.id ? r.da.label : `${r.da.label} - ${r.a.label}`,
    orario: r.orario,
    chiuso: r.chiuso,
  }));
}

/**
 * Genera le 3 stringhe di riepilogo da visualizzare in Vetrina e nel footer
 */
export function formatOrariSummary(config: OrariSettimanaliConfig): {
  hoursWeekday: string;
  hoursWeekend: string;
  hoursNote: string;
} {
  const g = config.giorni;

  const formatGiorno = testoOrarioGiorno;

  // Controlla se Mar-Ven hanno gli stessi orari
  const marText = formatGiorno(g.mar);
  const merText = formatGiorno(g.mer);
  const gioText = formatGiorno(g.gio);
  const venText = formatGiorno(g.ven);

  let weekdayText = "";
  if (marText === merText && merText === gioText && gioText === venText) {
    weekdayText = `Martedì - Venerdì: ${marText}`;
  } else {
    weekdayText = `Mar: ${marText} • Mer: ${merText} • Gio: ${gioText} • Ven: ${venText}`;
  }

  // Sabato e Domenica
  const sabText = formatGiorno(g.sab);
  const domText = formatGiorno(g.dom);
  let weekendText = "";
  if (sabText === domText) {
    weekendText = `Sabato e Domenica: ${sabText}`;
  } else {
    weekendText = `Sabato: ${sabText} • Domenica: ${domText}`;
  }

  // Giorni di chiusura
  const giorniChiusi = Object.values(g)
    .filter((day) => !day.aperto)
    .map((day) => day.label);

  // Giorni di chiusura sempre ricavati dagli orari; la nota libera dell'esercente si aggiunge solo se dice altro
  const notaLibera = notaOrariPersonalizzata(config);
  let note = notaLibera;
  if (giorniChiusi.length > 0) {
    const chiusuraStr = `${giorniChiusi.join(", ")} chiuso`;
    note = notaLibera ? `${chiusuraStr} (${notaLibera})` : chiusuraStr;
  }

  return {
    hoursWeekday: weekdayText,
    hoursWeekend: weekendText,
    hoursNote: note,
  };
}

export interface StatoTempoRealeLocale {
  isApertoAdesso: boolean;
  isInPausa: boolean;
  badgeLabel: string;
  badgeVariant: "open" | "closed" | "break";
  dettaglioOrarioOggi: string;
  prossimaApertura?: string;
}

/**
 * Calcola se il locale è aperto ADESSO, in pausa o chiuso per riposo
 */
export function calcolaStatoTempoRealeLocale(
  config: OrariSettimanaliConfig,
  dataRiferimento: Date = new Date()
): StatoTempoRealeLocale {
  const jsDay = dataRiferimento.getDay();
  const dayId = getDayIdFromJsIndex(jsDay);
  const giornoConfig = config.giorni[dayId] || config.giorni.lun;

  const hh = String(dataRiferimento.getHours()).padStart(2, "0");
  const mm = String(dataRiferimento.getMinutes()).padStart(2, "0");
  const orarioAttualeStr = `${hh}:${mm}`;

  if (!giornoConfig.aperto) {
    return {
      isApertoAdesso: false,
      isInPausa: false,
      badgeLabel: "Chiuso per Riposo",
      badgeVariant: "closed",
      dettaglioOrarioOggi: "Oggi il locale è chiuso per turno di riposo.",
    };
  }

  if (giornoConfig.modalita === "CONTINUATO") {
    const inizio = giornoConfig.oraInizio1 || "11:00";
    const fine = giornoConfig.oraFine1 || "23:00";
    const aperto = orarioAttualeStr >= inizio && orarioAttualeStr <= fine;

    if (aperto) {
      return {
        isApertoAdesso: true,
        isInPausa: false,
        badgeLabel: "Aperto Adesso",
        badgeVariant: "open",
        dettaglioOrarioOggi: `Orario continuato: ${inizio} - ${fine}`,
      };
    } else if (orarioAttualeStr < inizio) {
      return {
        isApertoAdesso: false,
        isInPausa: false,
        badgeLabel: `Apre alle ${inizio}`,
        badgeVariant: "closed",
        dettaglioOrarioOggi: `Oggi aperto dalle ${inizio} alle ${fine}`,
        prossimaApertura: inizio,
      };
    } else {
      return {
        isApertoAdesso: false,
        isInPausa: false,
        badgeLabel: "Chiuso",
        badgeVariant: "closed",
        dettaglioOrarioOggi: `Servizio concluso per oggi (${inizio} - ${fine}).`,
      };
    }
  }

  // Modalità SPEZZATO
  const i1 = giornoConfig.oraInizio1 || "11:00";
  const f1 = giornoConfig.oraFine1 || "15:00";
  const i2 = giornoConfig.oraInizio2 || "17:00";
  const f2 = giornoConfig.oraFine2 || "23:00";

  const nelTurno1 = orarioAttualeStr >= i1 && orarioAttualeStr <= f1;
  const nelTurno2 = orarioAttualeStr >= i2 && orarioAttualeStr <= f2;
  const inPausaPomeridiana = orarioAttualeStr > f1 && orarioAttualeStr < i2;

  if (nelTurno1) {
    return {
      isApertoAdesso: true,
      isInPausa: false,
      badgeLabel: "Aperto (Pranzo)",
      badgeVariant: "open",
      dettaglioOrarioOggi: `Pranzo fino alle ${f1} • Riapre alle ${i2} per Cena`,
    };
  }

  if (nelTurno2) {
    return {
      isApertoAdesso: true,
      isInPausa: false,
      badgeLabel: "Aperto (Cena)",
      badgeVariant: "open",
      dettaglioOrarioOggi: `Cena fino alle ${f2}`,
    };
  }

  if (inPausaPomeridiana) {
    return {
      isApertoAdesso: false,
      isInPausa: true,
      badgeLabel: `Riapre alle ${i2}`,
      badgeVariant: "break",
      dettaglioOrarioOggi: `Pausa pomeridiana • Riapre alle ${i2} per il servizio serale`,
      prossimaApertura: i2,
    };
  }

  if (orarioAttualeStr < i1) {
    return {
      isApertoAdesso: false,
      isInPausa: false,
      badgeLabel: `Apre alle ${i1}`,
      badgeVariant: "closed",
      dettaglioOrarioOggi: `Oggi aperto ${i1} - ${f1} e ${i2} - ${f2}`,
      prossimaApertura: i1,
    };
  }

  return {
    isApertoAdesso: false,
    isInPausa: false,
    badgeLabel: "Chiuso",
    badgeVariant: "closed",
    dettaglioOrarioOggi: `Servizio concluso per oggi. Ci rivediamo al prossimo turno!`,
  };
}
