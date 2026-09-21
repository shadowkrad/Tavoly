export function cleanPhoneNumber(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("00")) {
    clean = clean.substring(2);
  }
  // Se è un numero italiano di 10 cifre senza prefisso, aggiungi 39
  if (clean.length === 10 && clean.startsWith("3")) {
    clean = "39" + clean;
  }
  return clean;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

export function buildConfirmationMessage(
  restaurantName: string,
  customerName: string,
  dateStr: string,
  timeSlot: string,
  guestCount: number
): string {
  return `Ciao ${customerName}! 👋\nTi confermiamo con piacere la tua prenotazione presso *${restaurantName}*.\n\n📅 *Data:* ${dateStr}\n⏰ *Orario:* ${timeSlot}\n👥 *Ospiti:* ${guestCount} ${guestCount === 1 ? "persona" : "persone"}\n\nPer qualsiasi modifica o necessità speciale, rispondi direttamente a questo messaggio. A presto! 🍷`;
}

export function buildReminderMessage(
  restaurantName: string,
  customerName: string,
  timeSlot: string,
  guestCount: number
): string {
  return `Gentile ${customerName}, ti ricordiamo la tua prenotazione per oggi alle ore *${timeSlot}* (${guestCount} persone) presso *${restaurantName}*. Ti aspettiamo! 🍽️`;
}

export function buildTableReadyMessage(
  restaurantName: string,
  customerName: string,
  tableNumber: string
): string {
  return `Ciao ${customerName}! Il tuo tavolo (*Tavolo ${tableNumber}*) presso *${restaurantName}* è pronto! Puoi accomodarti dal nostro personale all'ingresso. Ti aspettiamo! 🎉`;
}
