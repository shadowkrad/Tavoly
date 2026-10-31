import { prisma } from "@/lib/prisma";
import {
  TakeawaySettings,
  DEFAULT_TAKEAWAY_SETTINGS,
} from "@/lib/takeaway-rules";

export async function getTakeawaySettings(): Promise<TakeawaySettings> {
  try {
    const keys = [
      "takeaway_enabled",
      "takeaway_days",
      "takeaway_lunch_enabled",
      "takeaway_lunch_start",
      "takeaway_lunch_end",
      "takeaway_dinner_enabled",
      "takeaway_dinner_start",
      "takeaway_dinner_end",
      "takeaway_prep_time_minutes",
      "takeaway_slot_interval_minutes",
      "takeaway_max_orders_per_slot",
      "takeaway_order_notes_allowed",
    ];

    const records = await prisma.localSetting.findMany({
      where: { key: { in: keys } },
    });

    const map: Record<string, string> = {};
    for (const r of records) {
      map[r.key] = r.value;
    }

    let parsedDays = DEFAULT_TAKEAWAY_SETTINGS.days;
    if (map["takeaway_days"]) {
      try {
        parsedDays = JSON.parse(map["takeaway_days"]);
      } catch {}
    }

    return {
      enabled:
        map["takeaway_enabled"] !== undefined
          ? map["takeaway_enabled"] === "true"
          : DEFAULT_TAKEAWAY_SETTINGS.enabled,
      days: parsedDays,
      lunchEnabled:
        map["takeaway_lunch_enabled"] !== undefined
          ? map["takeaway_lunch_enabled"] === "true"
          : DEFAULT_TAKEAWAY_SETTINGS.lunchEnabled,
      lunchStart: map["takeaway_lunch_start"] || DEFAULT_TAKEAWAY_SETTINGS.lunchStart,
      lunchEnd: map["takeaway_lunch_end"] || DEFAULT_TAKEAWAY_SETTINGS.lunchEnd,
      dinnerEnabled:
        map["takeaway_dinner_enabled"] !== undefined
          ? map["takeaway_dinner_enabled"] === "true"
          : DEFAULT_TAKEAWAY_SETTINGS.dinnerEnabled,
      dinnerStart: map["takeaway_dinner_start"] || DEFAULT_TAKEAWAY_SETTINGS.dinnerStart,
      dinnerEnd: map["takeaway_dinner_end"] || DEFAULT_TAKEAWAY_SETTINGS.dinnerEnd,
      prepTimeMinutes: map["takeaway_prep_time_minutes"]
        ? Math.max(5, parseInt(map["takeaway_prep_time_minutes"], 10) || 30)
        : DEFAULT_TAKEAWAY_SETTINGS.prepTimeMinutes,
      slotIntervalMinutes: map["takeaway_slot_interval_minutes"]
        ? Math.max(5, parseInt(map["takeaway_slot_interval_minutes"], 10) || 15)
        : DEFAULT_TAKEAWAY_SETTINGS.slotIntervalMinutes,
      maxOrdersPerSlot: map["takeaway_max_orders_per_slot"]
        ? Math.max(1, parseInt(map["takeaway_max_orders_per_slot"], 10) || 4)
        : DEFAULT_TAKEAWAY_SETTINGS.maxOrdersPerSlot,
      orderNotesAllowed:
        map["takeaway_order_notes_allowed"] !== undefined
          ? map["takeaway_order_notes_allowed"] === "true"
          : DEFAULT_TAKEAWAY_SETTINGS.orderNotesAllowed,
    };
  } catch (error) {
    console.error("Errore recupero takeaway settings:", error);
    return DEFAULT_TAKEAWAY_SETTINGS;
  }
}

export async function saveTakeawaySettings(
  settings: Partial<TakeawaySettings>
): Promise<boolean> {
  try {
    const upserts: Array<{ key: string; value: string }> = [];

    if (settings.enabled !== undefined) {
      upserts.push({ key: "takeaway_enabled", value: settings.enabled ? "true" : "false" });
    }
    if (settings.days !== undefined) {
      upserts.push({ key: "takeaway_days", value: JSON.stringify(settings.days) });
    }
    if (settings.lunchEnabled !== undefined) {
      upserts.push({
        key: "takeaway_lunch_enabled",
        value: settings.lunchEnabled ? "true" : "false",
      });
    }
    if (settings.lunchStart !== undefined) {
      upserts.push({ key: "takeaway_lunch_start", value: settings.lunchStart });
    }
    if (settings.lunchEnd !== undefined) {
      upserts.push({ key: "takeaway_lunch_end", value: settings.lunchEnd });
    }
    if (settings.dinnerEnabled !== undefined) {
      upserts.push({
        key: "takeaway_dinner_enabled",
        value: settings.dinnerEnabled ? "true" : "false",
      });
    }
    if (settings.dinnerStart !== undefined) {
      upserts.push({ key: "takeaway_dinner_start", value: settings.dinnerStart });
    }
    if (settings.dinnerEnd !== undefined) {
      upserts.push({ key: "takeaway_dinner_end", value: settings.dinnerEnd });
    }
    if (settings.prepTimeMinutes !== undefined) {
      upserts.push({
        key: "takeaway_prep_time_minutes",
        value: String(settings.prepTimeMinutes),
      });
    }
    if (settings.slotIntervalMinutes !== undefined) {
      upserts.push({
        key: "takeaway_slot_interval_minutes",
        value: String(settings.slotIntervalMinutes),
      });
    }
    if (settings.maxOrdersPerSlot !== undefined) {
      upserts.push({
        key: "takeaway_max_orders_per_slot",
        value: String(settings.maxOrdersPerSlot),
      });
    }
    if (settings.orderNotesAllowed !== undefined) {
      upserts.push({
        key: "takeaway_order_notes_allowed",
        value: settings.orderNotesAllowed ? "true" : "false",
      });
    }

    for (const item of upserts) {
      await prisma.localSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value },
        update: { value: item.value },
      });
    }

    return true;
  } catch (error) {
    console.error("Errore salvataggio takeaway settings:", error);
    return false;
  }
}
