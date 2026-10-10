export interface TakeawaySettings {
  enabled: boolean;
  days: string[]; // ["1","2","3","4","5","6","0"] 1=Lun, 0=Dom
  lunchEnabled: boolean;
  lunchStart: string; // "12:00"
  lunchEnd: string; // "14:30"
  dinnerEnabled: boolean;
  dinnerStart: string; // "19:00"
  dinnerEnd: string; // "22:30"
  prepTimeMinutes: number; // default 30 minuti
  slotIntervalMinutes: number; // default 15 minuti
  maxOrdersPerSlot: number; // default 4 comande max per slot
  orderNotesAllowed: boolean;
}

export const DEFAULT_TAKEAWAY_SETTINGS: TakeawaySettings = {
  enabled: true,
  days: ["1", "2", "3", "4", "5", "6", "0"],
  lunchEnabled: true,
  lunchStart: "12:00",
  lunchEnd: "14:30",
  dinnerEnabled: true,
  dinnerStart: "19:00",
  dinnerEnd: "22:30",
  prepTimeMinutes: 30,
  slotIntervalMinutes: 15,
  maxOrdersPerSlot: 4,
  orderNotesAllowed: true,
};

export interface TakeawaySlotInfo {
  time: string; // "19:45"
  serviceType: "PRANZO" | "CENA";
  isAvailable: boolean;
  isFull: boolean;
  isPastOrTooSoon: boolean;
  currentOrdersCount: number;
  maxOrders: number;
  remainingCapacity: number;
  reason?: string;
}

export interface TakeawayDayCalculation {
  date: string;
  isOpenDay: boolean;
  isTakeawayGloballyEnabled: boolean;
  reason?: string;
  slots: TakeawaySlotInfo[];
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function calculateAvailableTakeawaySlots(
  dateStr: string,
  settings: TakeawaySettings,
  existingOrders: Array<{ pickupTime: string }> = [],
  currentTime: Date = new Date()
): TakeawayDayCalculation {
  if (!settings.enabled) {
    return {
      date: dateStr,
      isOpenDay: false,
      isTakeawayGloballyEnabled: false,
      reason: "Il servizio di asporto & takeaway è attualmente disattivato dal locale.",
      slots: [],
    };
  }

  // Parse date
  const targetDate = new Date(`${dateStr}T12:00:00Z`);
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Domenica, 1 = Lunedì...
  const isDayAllowed = settings.days.includes(String(dayOfWeek));

  if (!isDayAllowed) {
    return {
      date: dateStr,
      isOpenDay: false,
      isTakeawayGloballyEnabled: true,
      reason: "Il servizio di asporto non è attivo nel giorno selezionato della settimana.",
      slots: [],
    };
  }

  // Verifica se la data è oggi o nel passato
  const nowDayStr = currentTime.toISOString().split("T")[0];
  const isToday = dateStr === nowDayStr;
  const isPast = dateStr < nowDayStr;

  if (isPast) {
    return {
      date: dateStr,
      isOpenDay: false,
      isTakeawayGloballyEnabled: true,
      reason: "Non è possibile ordinare per una data passata.",
      slots: [],
    };
  }

  const currentMinutesNow = currentTime.getHours() * 60 + currentTime.getMinutes();
  const minimumPickupMinutes = currentMinutesNow + settings.prepTimeMinutes;

  const candidateSlots: Array<{ time: string; serviceType: "PRANZO" | "CENA" }> = [];

  // 1. Pranzo
  if (settings.lunchEnabled) {
    const startM = timeStringToMinutes(settings.lunchStart);
    const endM = timeStringToMinutes(settings.lunchEnd);
    const step = Math.max(5, settings.slotIntervalMinutes);
    for (let m = startM; m <= endM; m += step) {
      candidateSlots.push({ time: minutesToTimeString(m), serviceType: "PRANZO" });
    }
  }

  // 2. Cena
  if (settings.dinnerEnabled) {
    const startM = timeStringToMinutes(settings.dinnerStart);
    const endM = timeStringToMinutes(settings.dinnerEnd);
    const step = Math.max(5, settings.slotIntervalMinutes);
    for (let m = startM; m <= endM; m += step) {
      candidateSlots.push({ time: minutesToTimeString(m), serviceType: "CENA" });
    }
  }

  const slots: TakeawaySlotInfo[] = candidateSlots.map((item) => {
    const slotMinutes = timeStringToMinutes(item.time);
    let isPastOrTooSoon = false;
    let reason: string | undefined = undefined;

    if (isToday) {
      if (slotMinutes < minimumPickupMinutes) {
        isPastOrTooSoon = true;
        reason = `Richiede almeno ${settings.prepTimeMinutes} min di preparazione`;
      }
    }

    const currentCount = existingOrders.filter((o) => o.pickupTime === item.time).length;
    const isFull = currentCount >= settings.maxOrdersPerSlot;
    if (isFull && !reason) {
      reason = "Slot al completo (Capienza comande raggiunta)";
    }

    const isAvailable = !isPastOrTooSoon && !isFull;
    const remainingCapacity = Math.max(0, settings.maxOrdersPerSlot - currentCount);

    return {
      time: item.time,
      serviceType: item.serviceType,
      isAvailable,
      isFull,
      isPastOrTooSoon,
      currentOrdersCount: currentCount,
      maxOrders: settings.maxOrdersPerSlot,
      remainingCapacity,
      reason,
    };
  });

  return {
    date: dateStr,
    isOpenDay: true,
    isTakeawayGloballyEnabled: true,
    slots,
  };
}
