import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseShowcaseConfig } from "@/lib/showcase-defaults";

export async function GET() {
  try {
    const settings = await prisma.localSetting.findMany({
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
            "showcase_config",
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    const { getIsKdsEnabled } = await import("@/lib/kds-setting");
    const kdsEnabled = await getIsKdsEnabled();

    const { getTakeawaySettings } = await import("@/lib/takeaway-server");
    const takeawaySettings = await getTakeawaySettings();

    const showcaseConfig = parseShowcaseConfig(map["showcase_config"]);
    if (map["restaurant_name"]) showcaseConfig.brandName = map["restaurant_name"];
    if (map["brand_logo_url"]) showcaseConfig.logoUrl = map["brand_logo_url"];
    if (map["brand_favicon_url"]) showcaseConfig.faviconUrl = map["brand_favicon_url"];
    if (map["color_primary"]) showcaseConfig.primaryColor = map["color_primary"];
    if (map["color_accent"]) showcaseConfig.accentColor = map["color_accent"];

    return NextResponse.json({
      nomeRistorante: map["restaurant_name"] || "Osteria dei Tavoli",
      logoUrl: map["brand_logo_url"] || "",
      faviconUrl: map["brand_favicon_url"] || "",
      colorePrimario: map["color_primary"] || "#064e3b",
      coloreAccento: map["color_accent"] || "#059669",
      email: map["contact_email"] || "prenotazioni@osteriatavoli.it",
      telefono: map["contact_phone"] || "+39 0575 654321",
      indirizzo: map["address"] || "Piazza Grande, 12 - 52100 Arezzo (AR)",
      menuShowImages: map["menu_show_dish_images"] !== "false",
      kdsEnabled,
      takeawaySettings,
      showcaseConfig,
    });
  } catch (error) {
    console.error("Errore recupero impostazioni Tavoly:", error);
    return NextResponse.json({ error: "Errore nel recupero impostazioni" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nomeRistorante,
      logoUrl,
      faviconUrl,
      colorePrimario,
      coloreAccento,
      email,
      telefono,
      indirizzo,
      menuShowImages,
      kdsEnabled,
      takeawaySettings,
      showcaseConfig,
    } = body;

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
      menuShowImages !== undefined && { key: "menu_show_dish_images", value: String(menuShowImages ? "true" : "false") },
      kdsEnabled !== undefined && { key: "kds_enabled", value: String(kdsEnabled ? "true" : "false") },
      showcaseConfigStr !== undefined && { key: "showcase_config", value: showcaseConfigStr },
    ].filter(Boolean) as Array<{ key: string; value: string }>;

    for (const item of upserts) {
      await prisma.localSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value },
        update: { value: item.value },
      });
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
