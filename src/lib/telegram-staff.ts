/**
 * Notifiche Telegram allo staff: l'invio passa SEMPRE da Taaaac Core (hub centralizzato).
 * Il modulo non conosce token né chat ID: la configurazione si gestisce dal portale Taaaac.
 */

/**
 * Chiede al Core di inviare un messaggio (HTML) al gruppo Telegram dello staff del locale
 */
export async function sendStaffTelegramMessage(htmlText: string): Promise<{ ok: boolean; error?: string }> {
  const coreUrls = [
    process.env.TAAAAC_INTERNAL_URL || "http://taaaac-core:3000",
    process.env.TAAAAC_CORE_URL || "https://taaaac.eu",
  ];

  const targetDomain =
    process.env.TAAAAC_TENANT_DOMAIN ||
    (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL.includes("taaaac.eu")
      ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
      : "tavoly.taaaac.eu");

  let lastError = "Impossibile contattare Taaaac Communication Hub";

  for (const baseUrl of coreUrls) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/internal/telegram/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key",
        },
        body: JSON.stringify({ tenantDomain: targetDomain, kind: "STAFF", text: htmlText }),
        signal: AbortSignal.timeout(6000),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return { ok: true };
      lastError = data.error || `HTTP ${res.status}`;
      // Errore applicativo del Core (es. canale non attivo): inutile riprovare sull'altro indirizzo
      if (res.status !== 502 && res.status !== 503 && res.status !== 504) break;
    } catch (err: any) {
      lastError = err.message || "Errore connessione Core";
    }
  }

  console.warn("[Telegram Staff] Invio tramite Core non riuscito:", lastError);
  return { ok: false, error: lastError };
}

/**
 * Notifica per nuova comanda tavolo in sala
 */
export async function notifyStaffNewTableOrder(params: {
  tableNumber: string;
  coverCount: number;
  waiterName?: string;
  items: Array<{ name: string; quantity: number; notes?: string; price?: number }>;
  notes?: string | null;
  totalAmount: number;
}): Promise<void> {
  try {
    const nowStr = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

    let itemsText = "";
    if (params.items && params.items.length > 0) {
      itemsText = params.items
        .map((it) => {
          const line = `  • <b>${it.quantity}x</b> ${it.name}`;
          const note = it.notes ? `\n    <i>↳ Note: ${it.notes}</i>` : "";
          return line + note;
        })
        .join("\n");
    }

    const waiterLine = params.waiterName ? `\n👤 <b>Cameriere:</b> ${params.waiterName}` : "";
    const notesLine = params.notes ? `\n📝 <b>Note Comanda:</b> ${params.notes}` : "";

    const message = `🍕 <b>NUOVA COMANDA — TAVOLO ${params.tableNumber.toUpperCase()}</b>
⏰ <b>Orario:</b> ${nowStr}
👥 <b>Coperti:</b> ${params.coverCount}${waiterLine}

📋 <b>PIATTI ORDINATI:</b>
${itemsText || "  <i>Nessun piatto specificato</i>"}${notesLine}

💰 <b>Totale Stimato:</b> € ${params.totalAmount.toFixed(2)}`;

    await sendStaffTelegramMessage(message);
  } catch (err) {
    console.error("[Telegram Staff] Errore notifica comanda tavolo:", err);
  }
}

/**
 * Notifica per nuovo ordine da asporto / takeaway
 */
export async function notifyStaffNewTakeawayOrder(params: {
  customerName: string;
  phoneNumber: string;
  pickupDate: string;
  pickupTime: string;
  itemsSummary: string;
  notes?: string | null;
  totalAmount: number;
  paymentStatus: string;
}): Promise<void> {
  try {
    const payBadge = params.paymentStatus === "PAGATO" ? "✅ PAGATO" : "💳 DA INCASSARE AL RITIRO";
    const notesLine = params.notes ? `\n📝 <b>Note Cliente:</b> ${params.notes}` : "";

    const message = `🥡 <b>NUOVO ORDINE DA ASPORTO</b>
👤 <b>Cliente:</b> ${params.customerName}
📞 <b>Telefono:</b> ${params.phoneNumber}
📅 <b>Ritiro:</b> ${params.pickupDate} alle ⏰ <b>${params.pickupTime}</b>

📋 <b>RIEPILOGO PIATTI:</b>
${params.itemsSummary}${notesLine}

💰 <b>Totale:</b> € ${params.totalAmount.toFixed(2)} (${payBadge})`;

    await sendStaffTelegramMessage(message);
  } catch (err) {
    console.error("[Telegram Staff] Errore notifica asporto:", err);
  }
}

/**
 * Notifica per nuova prenotazione tavolo
 */
export async function notifyStaffNewReservation(params: {
  customerName: string;
  phoneNumber: string;
  date: string | Date;
  timeSlot: string;
  guestCount: number;
  notes?: string | null;
  tableName?: string | null;
}): Promise<void> {
  try {
    const dateObj = typeof params.date === "string" ? new Date(params.date) : params.date;
    const formattedDate = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "long" })
      : String(params.date);

    const tableLine = params.tableName ? `\n🪑 <b>Tavolo Assegnato:</b> ${params.tableName}` : "";
    const notesLine = params.notes ? `\n📝 <b>Note:</b> ${params.notes}` : "";

    const message = `📅 <b>NUOVA PRENOTAZIONE TAVOLO</b>
👤 <b>Ospite:</b> ${params.customerName}
📞 <b>Telefono:</b> ${params.phoneNumber}
🗓️ <b>Data:</b> ${formattedDate}
⏰ <b>Orario / Turno:</b> ${params.timeSlot}
👥 <b>Coperti:</b> ${params.guestCount} persone${tableLine}${notesLine}`;

    await sendStaffTelegramMessage(message);
  } catch (err) {
    console.error("[Telegram Staff] Errore notifica prenotazione:", err);
  }
}
