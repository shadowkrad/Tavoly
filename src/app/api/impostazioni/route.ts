import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchTenantConfig } from "@/lib/taaaac-client";
import { parseShowcaseConfig } from "@/lib/showcase-defaults";
import { formatOrariSummary, OrariSettimanaliConfig } from "@/lib/orari-settimanali";
import { applicaAnagrafica, ricavaOrariUfficiali, riallineaVetrinaSalvata } from "@/lib/anagrafica-attivita";

/**
 * Telegram è gestito da Taaaac Core: qui si legge solo lo stato (mai token né chat ID).
 */
async function getTelegramHub() {
  try {
    const cfg = await fetchTenantConfig();
    return {
      managedByCore: true,
      enabled: Boolean(cfg.telegramEnabled),
      botUsername: cfg.telegramBotUsername || "",
      staffAlerts: cfg.telegramAutoConfirm !== false,
      reminder24h: cfg.telegramAutoReminder24h !== false,
    };
  } catch {
    return { managedByCore: true, enabled: false, botUsername: "", staffAlerts: true, reminder24h: true };
  }
}

export async function GET() {
  try {
    const [settings, cache] = await Promise.all([
      prisma.localSetting.findMany({
        where: {
          key: {
            in: [
              "restaurant_name",
              "brand_logo_url",
              "brand_favicon_url",
              "color_primary",
              "color_accent",
              "contact_email",
              "contact_phone",
              "address",
              "menu_show_dish_images",
              "kds_enabled",
              "whatsapp_enabled",
              "showcase_config",
              "business_description",
              "fidelity_enabled",
              "fidelity_rules",
              "turni_cena_primo",
              "turni_cena_secondo",
              "turni_fascia_pranzo",
              "turni_tolleranza_minuti",
              "coperti_interni",
              "coperti_dehors",
              "coperti_veranda",
              "hours_weekday",
              "hours_weekend",
              "hours_note",
              "orari_settimanali_config",
            ],
          },
        },
      }),
      prisma.tenantLocalCache.findUnique({
        where: { id: "singleton" },
      }),
    ]);

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const { getIsKdsEnabled } = await import("@/lib/kds-setting");
    const kdsEnabled = await getIsKdsEnabled();

    const { getTakeawaySettings } = await import("@/lib/takeaway-server");
    const takeawaySettings = await getTakeawaySettings();

    // Orari ufficiali e dati dell'attivita': UNA sola fonte (questa scheda). I testi sono sempre
    // ricavati dalla configurazione settimanale, la vetrina li legge da qui.
    const orariUff = ricavaOrariUfficiali(map, (cache as any)?.rispettaFestivitaNazionali);
    const showcaseConfig = applicaAnagrafica(parseShowcaseConfig(map["showcase_config"]), map, orariUff);
    if (map["brand_logo_url"]) showcaseConfig.logoUrl = map["brand_logo_url"];
    if (map["brand_favicon_url"]) showcaseConfig.faviconUrl = map["brand_favicon_url"];
    if (map["color_primary"]) showcaseConfig.primaryColor = map["color_primary"];
    if (map["color_accent"]) showcaseConfig.accentColor = map["color_accent"];

    const orariConfig: OrariSettimanaliConfig = orariUff.config;
    const hoursWeekday = orariUff.hoursWeekday;
    const hoursWeekend = orariUff.hoursWeekend;
    const hoursNote = orariUff.hoursNote;

    let fidelityRules = null;
    try {
      if (map["fidelity_rules"]) {
        fidelityRules = JSON.parse(map["fidelity_rules"]);
      }
    } catch {
      fidelityRules = null;
    }

    return NextResponse.json({
      nomeRistorante: map["restaurant_name"] || "Osteria dei Tavoli",
      logoUrl: map["brand_logo_url"] || "",
      faviconUrl: map["brand_favicon_url"] || "",
      colorePrimario: map["color_primary"] || "#064e3b",
      coloreAccento: map["color_accent"] || "#059669",
      email: map["contact_email"] || "prenotazioni@osteriatavoli.it",
      telefono: map["contact_phone"] || "+39 0575 654321",
      indirizzo: map["address"] || "Piazza Grande, 12 - 52100 Arezzo (AR)",
      descrizione: showcaseConfig.about.description,
      hoursWeekday,
      hoursWeekend,
      hoursNote,
      orariSettimanaliConfig: orariConfig,
      menuShowImages: map["menu_show_dish_images"] !== "false",
      kdsEnabled,
      whatsappAbilitato: map["whatsapp_enabled"] !== "false",
      takeawaySettings,
      showcaseConfig,
      cenaPrimoTurno: map["turni_cena_primo"] || "19:30 - 22:00",
      cenaSecondoTurno: map["turni_cena_secondo"] || "",
      fasciaPranzo: map["turni_fascia_pranzo"] !== undefined ? map["turni_fascia_pranzo"] : "12:30 - 15:00",
      tolleranzaRitardoMinuti: map["turni_tolleranza_minuti"] || "15",
      copertiInterni: map["coperti_interni"] || "45",
      copertiDehors: map["coperti_dehors"] || "30",
      copertiVeranda: map["coperti_veranda"] || "20",
      telegramHub: await getTelegramHub(),
      fidelitySettings: {
        enabled: map["fidelity_enabled"] === "true",
        pointsPerEuro: fidelityRules?.pointsPerEuro || 1,
        welcomeBonusPoints: fidelityRules?.welcomeBonusPoints || 10,
        minPointsToRedeem: fidelityRules?.minPointsToRedeem || 50,
        rewardVoucherMonths: fidelityRules?.rewardVoucherMonths ?? 6,
        compleanno: fidelityRules?.compleanno,
        rewards: fidelityRules?.rewards || [
          { id: "rew_1", name: "Dolce della Casa in Omaggio", pointsRequired: 50, rewardType: "FREE_ITEM", freeItemName: "Dolce artigianale a scelta" },
          { id: "rew_2", name: "Sconto 10€ sul Conto", pointsRequired: 100, rewardType: "DISCOUNT", discountAmount: 10 },
          { id: "rew_3", name: "Bottiglia di Vino Riserva", pointsRequired: 200, rewardType: "FREE_ITEM", freeItemName: "Vino selezione della cantina" },
        ],
      },
    });
  } catch (error) {
    console.error("Errore recupero impostazioni Tavoly:", error);
    return NextResponse.json({ error: "Errore nel recupero impostazioni" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      nomeRistorante,
      logoUrl,
      faviconUrl,
      colorePrimario,
      coloreAccento,
      email,
      telefono,
      indirizzo,
      descrizione,
      hoursWeekday,
      hoursWeekend,
      hoursNote,
      orariSettimanaliConfig,
      menuShowImages,
      kdsEnabled,
      whatsappAbilitato,
      takeawaySettings,
      showcaseConfig,
      fidelitySettings,
      cenaPrimoTurno,
      cenaSecondoTurno,
      fasciaPranzo,
      tolleranzaRitardoMinuti,
      copertiInterni,
      copertiDehors,
      copertiVeranda,
    } = body;

    // Se fornito orariSettimanaliConfig, genera automaticamente i testi di riepilogo
    let orariConfigStr: string | undefined = undefined;
    if (orariSettimanaliConfig) {
      orariConfigStr = JSON.stringify(orariSettimanaliConfig);
      // I testi degli orari derivano SEMPRE dalla configurazione settimanale: quelli rimandati
      // dalla pagina (anche se vecchi) vengono ignorati.
      const summaries = formatOrariSummary(orariSettimanaliConfig);
      hoursWeekday = summaries.hoursWeekday;
      hoursWeekend = summaries.hoursWeekend;
      hoursNote = summaries.hoursNote;

      // Aggiorna anche TenantLocalCache per rispettaFestivitaNazionali
      if (orariSettimanaliConfig.rispettaFestivitaNazionali !== undefined) {
        await prisma.tenantLocalCache.upsert({
          where: { id: "singleton" },
          create: {
            id: "singleton",
            rispettaFestivitaNazionali: Boolean(orariSettimanaliConfig.rispettaFestivitaNazionali),
          },
          update: {
            rispettaFestivitaNazionali: Boolean(orariSettimanaliConfig.rispettaFestivitaNazionali),
          },
        });
      }
    }

    const showcaseConfigStr =
      showcaseConfig !== undefined
        ? typeof showcaseConfig === "string"
          ? showcaseConfig
          : JSON.stringify(showcaseConfig)
        : undefined;

    const upserts = [
      nomeRistorante !== undefined && { key: "restaurant_name", value: String(nomeRistorante) },
      logoUrl !== undefined && { key: "brand_logo_url", value: String(logoUrl || "") },
      faviconUrl !== undefined && { key: "brand_favicon_url", value: String(faviconUrl || "") },
      colorePrimario !== undefined && { key: "color_primary", value: String(colorePrimario) },
      coloreAccento !== undefined && { key: "color_accent", value: String(coloreAccento) },
      email !== undefined && { key: "contact_email", value: String(email) },
      telefono !== undefined && { key: "contact_phone", value: String(telefono) },
      indirizzo !== undefined && { key: "address", value: String(indirizzo) },
      descrizione !== undefined && { key: "business_description", value: String(descrizione) },
      hoursWeekday !== undefined && { key: "hours_weekday", value: String(hoursWeekday) },
      hoursWeekend !== undefined && { key: "hours_weekend", value: String(hoursWeekend) },
      hoursNote !== undefined && { key: "hours_note", value: String(hoursNote) },
      orariConfigStr !== undefined && { key: "orari_settimanali_config", value: orariConfigStr },
      menuShowImages !== undefined && { key: "menu_show_dish_images", value: String(menuShowImages ? "true" : "false") },
      kdsEnabled !== undefined && { key: "kds_enabled", value: String(kdsEnabled ? "true" : "false") },
      whatsappAbilitato !== undefined && { key: "whatsapp_enabled", value: String(whatsappAbilitato ? "true" : "false") },
      showcaseConfigStr !== undefined && { key: "showcase_config", value: showcaseConfigStr },
      fidelitySettings?.enabled !== undefined && { key: "fidelity_enabled", value: String(fidelitySettings.enabled) },
      fidelitySettings !== undefined && { key: "fidelity_rules", value: JSON.stringify(fidelitySettings) },
      cenaPrimoTurno !== undefined && { key: "turni_cena_primo", value: String(cenaPrimoTurno) },
      cenaSecondoTurno !== undefined && { key: "turni_cena_secondo", value: String(cenaSecondoTurno || "") },
      fasciaPranzo !== undefined && { key: "turni_fascia_pranzo", value: String(fasciaPranzo || "") },
      tolleranzaRitardoMinuti !== undefined && { key: "turni_tolleranza_minuti", value: String(tolleranzaRitardoMinuti) },
      copertiInterni !== undefined && { key: "coperti_interni", value: String(copertiInterni) },
      copertiDehors !== undefined && { key: "coperti_dehors", value: String(copertiDehors) },
      copertiVeranda !== undefined && { key: "coperti_veranda", value: String(copertiVeranda) },
    ].filter(Boolean) as Array<{ key: string; value: string }>;

    for (const item of upserts) {
      await prisma.localSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value },
        update: { value: item.value },
      });
    }

    // Allinea la copia salvata della vetrina ai dati dell'attivita' appena salvati
    const toccaAnagrafica = [nomeRistorante, indirizzo, telefono, email, descrizione, orariConfigStr, showcaseConfigStr].some(
      (v) => v !== undefined
    );
    if (toccaAnagrafica) {
      await riallineaVetrinaSalvata();
    }

    if (takeawaySettings) {
      const { saveTakeawaySettings } = await import("@/lib/takeaway-server");
      await saveTakeawaySettings(takeawaySettings);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/impostazioni");
    revalidatePath("/dashboard/cucina");
    revalidatePath("/cucina");
    revalidatePath("/menu");
    revalidatePath("/dashboard/asporto");
    revalidatePath("/prenotazione");
    revalidatePath("/", "layout");

    const response = NextResponse.json({ success: true });
    if (kdsEnabled !== undefined) {
      response.cookies.set("kds_enabled", kdsEnabled ? "true" : "false", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("Errore salvataggio impostazioni Tavoly:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
