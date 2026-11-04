import { prisma } from "./prisma";

export interface StaffTelegramConfig {
  enabled: boolean;
  botToken: string | null;
  staffChatId: string | null;
}

/**
 * Recupera la configurazione Telegram per lo staff del locale da LocalSetting
 */
export async function getStaffTelegramConfig(): Promise<StaffTelegramConfig> {
  try {
    const settings = await prisma.localSetting.findMany({
      where: {
        key: {
          in: ["telegram_enabled", "telegram_bot_token", "telegram_staff_chat_id"],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    return {
      enabled: map["telegram_enabled"] === "true",
      botToken: map["telegram_bot_token"]?.trim() || null,
      staffChatId: map["telegram_staff_chat_id"]?.trim() || null,
    };
  } catch (err) {
    console.error("[Telegram Staff] Errore lettura LocalSetting:", err);
    return { enabled: false, botToken: null, staffChatId: null };
  }
}

/**
 * Invia un messaggio formattato in HTML al canale/gruppo Telegram dello staff
 */
export async function sendStaffTelegramMessage(htmlText: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = await getStaffTelegramConfig();
    if (!config.enabled || !config.botToken || !config.staffChatId) {
      return { ok: false, error: "Telegram staff non configurato o disabilitato" };
    }

    const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.staffChatId,
        text: htmlText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      console.warn("[Telegram Staff] Errore API Telegram:", data);
      return { ok: false, error: data.description || "Errore API Telegram" };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[Telegram Staff] Errore invio messaggio staff:", err.message || err);
    return { ok: false, error: err.message };
  }
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
