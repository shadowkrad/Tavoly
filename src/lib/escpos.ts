
export interface EscPosOrderItem {
  name: string;
  quantity: number;
  category?: string;
  price?: number;
  variants?: string[];
  notes?: string;
}

export interface EscPosTicketData {
  orderType: "TAVOLO" | "ASPORTO";
  title: string; // es. "TAVOLO 4" oppure "ASPORTO #12"
  subtitle?: string; // es. "Dehors - Cameriere: Marco" o "Cliente: Mario Rossi"
  customerPhone?: string;
  timeSlot?: string; // es. "13:30" o "19:45"
  coverCount?: number;
  notes?: string | null;
  items: EscPosOrderItem[];
  restaurantName?: string;
  orderNumber?: string;
  timestamp?: Date;
}

export interface PrinterConfig {
  enabled: boolean;
  ip: string;
  port: number;
  paperWidth: "80mm" | "58mm";
  autoPrintTakeaway: boolean;
  autoPrintTable: boolean;
  buzzer: boolean;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  enabled: false,
  ip: "192.168.1.200",
  port: 9100,
  paperWidth: "80mm",
  autoPrintTakeaway: false,
  autoPrintTable: false,
  buzzer: true,
};

// Codici di controllo ESC/POS
const ESC = 0x1b;
const GS = 0x1d;

/**
 * Costruisce il Buffer binario compatibile con qualsiasi stampante termica ESC/POS (Epson, Xprinter, Star, ecc.)
 */
export function buildEscPosBuffer(
  data: EscPosTicketData,
  paperWidth: "80mm" | "58mm" = "80mm",
  buzzer: boolean = true
): Buffer {
  const chunks: Buffer[] = [];
  const colWidth = paperWidth === "58mm" ? 32 : 48;

  const push = (buf: Buffer | number[] | Uint8Array) => chunks.push(Buffer.from(buf));
  const pushText = (text: string) => {
    // Sanitize in ASCII / Latin1 compatibile con stampanti termiche
    const sanitized = text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // rimuovi diacritici complessi
      .replace(/[^\x20-\x7E\n\r]/g, " "); // solo caratteri ASCII stampabili
    push(Buffer.from(sanitized, "ascii"));
  };

  const line = (char = "-") => pushText(char.repeat(colWidth) + "\n");
  const doubleLine = () => pushText("=".repeat(colWidth) + "\n");

  // 1. Inizializzazione stampante
  push([ESC, 0x40]); // ESC @

  // 2. Cicalino / Buzzer se abilitato
  if (buzzer) {
    push([ESC, 0x42, 0x02, 0x02]); // Beep 2 volte
  }

  // 3. Header: Nome Ristorante (Centrato, Grassetto)
  push([ESC, 0x61, 0x01]); // Allinea Centro
  push([ESC, 0x45, 0x01]); // Bold ON
  push([GS, 0x21, 0x10]); // Doppia altezza
  pushText((data.restaurantName || "TAVOLY RESTAURANT").toUpperCase() + "\n");
  push([GS, 0x21, 0x00]); // Dimensione normale
  push([ESC, 0x45, 0x00]); // Bold OFF

  pushText("*** COMANDA CUCINA / PIZZERIA ***\n");
  const dateStr = (data.timestamp || new Date()).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  pushText(`Data: ${dateStr}\n`);
  doubleLine();

  // 4. Sezione Identificativo Ordine (Grande, Evidenziato)
  push([ESC, 0x61, 0x01]); // Centro
  push([ESC, 0x45, 0x01]); // Bold ON
  push([GS, 0x21, 0x11]); // Doppia altezza e larghezza
  pushText(data.title.toUpperCase() + "\n");
  push([GS, 0x21, 0x00]); // Dimensione normale
  push([ESC, 0x45, 0x00]); // Bold OFF

  if (data.subtitle) {
    pushText(data.subtitle + "\n");
  }

  if (data.timeSlot) {
    pushText(`ORARIO RICHIESTO: ${data.timeSlot}\n`);
  }

  if (data.coverCount) {
    pushText(`COPERTI: ${data.coverCount} PERSONE\n`);
  }

  if (data.customerPhone) {
    pushText(`Tel: ${data.customerPhone}\n`);
  }

  line();

  // 5. Elenco Piatti Ordinati (Allineato a Sinistra)
  push([ESC, 0x61, 0x00]); // Allinea Sinistra

  let currentCategory = "";
  for (const item of data.items) {
    if (item.category && item.category !== currentCategory) {
      currentCategory = item.category;
      push([ESC, 0x45, 0x01]); // Bold
      pushText(`\n[${currentCategory.toUpperCase()}]\n`);
      push([ESC, 0x45, 0x00]); // Bold OFF
    }

    // Riga Piatto con Quantità evidenziata
    push([ESC, 0x45, 0x01]); // Bold
    push([GS, 0x21, 0x01]); // Doppia altezza moderata per quantità
    pushText(` ${item.quantity}x `);
    push([GS, 0x21, 0x00]); // Normale
    pushText(`${item.name}\n`);
    push([ESC, 0x45, 0x00]); // Bold OFF

    // Variazioni o note sul piatto
    if (item.variants && item.variants.length > 0) {
      for (const v of item.variants) {
        pushText(`    >> VARIAZIONE: ${v}\n`);
      }
    }
    if (item.notes) {
      pushText(`    >> NOTA: ${item.notes}\n`);
    }
  }

  line();

  // 6. Note Generali / Allergeni
  if (data.notes) {
    push([ESC, 0x45, 0x01]); // Bold ON
    pushText(`NOTE GENERALI / ALLERGIE:\n`);
    pushText(`*** ${data.notes.toUpperCase()} ***\n`);
    push([ESC, 0x45, 0x00]); // Bold OFF
    line();
  }

  // 7. Footer e Taglio Carta
  push([ESC, 0x61, 0x01]); // Centro
  pushText("--- FINE COMANDA ---\n");
  push([ESC, 0x64, 0x04]); // Avanzamento 4 linee
  push([GS, 0x56, 0x41, 0x00]); // Taglio carta completo/parziale (GS V A 0)

  return Buffer.concat(chunks);
}

/**
 * Invia il buffer ESC/POS direttamente via TCP socket alla stampante di rete locale (IP:9100)
 */
