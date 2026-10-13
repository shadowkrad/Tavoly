/**
 * WhatsApp Client Helper per Tavoly (Ristoranti, Pizzerie & Asporto).
 * Client-safe, non carica Prisma o runtime server-side.
 */
export * from "./whatsapp";

import { cleanPhoneNumber, generateWhatsAppLink } from "./whatsapp";

export const formattaNumeroWhatsApp = cleanPhoneNumber;
export const generaLinkWhatsApp = generateWhatsAppLink;

export function apriWhatsAppWeb(phone: string, message: string): void {
  if (typeof window === "undefined") return;
  const url = generateWhatsAppLink(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

export function generaMessaggioTakeawayPronto(dati: {
  ristorante: string;
  nomeCliente: string;
  ordineNumero?: string;
  totale?: string;
}): string {
  let msg = `Ciao ${dati.nomeCliente}! 👋\nIl tuo ordine da *${dati.ristorante}*`;
  if (dati.ordineNumero) msg += ` (#${dati.ordineNumero})`;
  msg += ` è *PRONTO al banco* per il ritiro!\nTi aspettiamo per consegnartelo caldo. 🍽️`;
  if (dati.totale) msg += `\nTotale da saldare al banco: *${dati.totale}*`;
  return msg;
}
