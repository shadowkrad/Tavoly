import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          ],
        },
      },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
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
      menuShowImages: map["menu_show_dish_images"] !== "false",
    });
  } catch (error) {
    console.error("Errore recupero impostazioni Tavoly:", error);
    return NextResponse.json({ error: "Errore nel recupero impostazioni" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { nomeRistorante, logoUrl, faviconUrl, colorePrimario, coloreAccento, email, telefono, indirizzo, menuShowImages } = body;

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
    ].filter(Boolean) as Array<{ key: string; value: string }>;

    for (const item of upserts) {
      await prisma.localSetting.upsert({
        where: { key: item.key },
        create: { key: item.key, value: item.value },
        update: { value: item.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore salvataggio impostazioni Tavoly:", error);
    return NextResponse.json({ error: "Errore nel salvataggio" }, { status: 500 });
  }
}
