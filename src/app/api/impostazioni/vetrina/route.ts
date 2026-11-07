import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseShowcaseConfig, DEFAULT_TAVOLY_SHOWCASE_CONFIG } from "@/lib/showcase-defaults";
import { applicaAnagrafica, caricaVetrinaUnificata, leggiImpostazioniAnagrafica } from "@/lib/anagrafica-attivita";

export async function GET() {
  try {
    // Dati dell'attivita' e orari arrivano da Impostazioni > Ristorante (non si modificano qui);
    // colori, logo e favicon si modificano solo nello Studio.
    const { showcase: parsed } = await caricaVetrinaUnificata();

    const meta = await prisma.localSetting.findMany({
      where: {
        key: { in: ["color_primary", "color_accent", "brand_logo_url", "brand_favicon_url"] },
      },
    });
    for (const m of meta) {
      if (m.key === "color_primary" && m.value) parsed.primaryColor = m.value;
      if (m.key === "color_accent" && m.value) parsed.accentColor = m.value;
      if (m.key === "brand_logo_url") parsed.logoUrl = m.value || null;
      if (m.key === "brand_favicon_url") parsed.faviconUrl = m.value || null;
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Errore recupero vetrina Tavoly:", error);
    return NextResponse.json(DEFAULT_TAVOLY_SHOWCASE_CONFIG);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    // Nome, indirizzo, telefono, email, descrizione e orari non si modificano dallo Studio:
    // si riallineano sempre a quelli di Impostazioni > Ristorante.
    const { map, orari } = await leggiImpostazioniAnagrafica();
    const unified = applicaAnagrafica(parseShowcaseConfig(JSON.stringify(body)), map, orari);
    const showcaseStr = JSON.stringify(unified);

    await prisma.localSetting.upsert({
      where: { key: "showcase_config" },
      create: { key: "showcase_config", value: showcaseStr },
      update: { value: showcaseStr },
    });

    if (body.primaryColor) {
      await prisma.localSetting.upsert({
        where: { key: "color_primary" },
        create: { key: "color_primary", value: body.primaryColor },
        update: { value: body.primaryColor },
      });
    }
    if (body.accentColor) {
      await prisma.localSetting.upsert({
        where: { key: "color_accent" },
        create: { key: "color_accent", value: body.accentColor },
        update: { value: body.accentColor },
      });
    }
    if (body.logoUrl !== undefined) {
      await prisma.localSetting.upsert({
        where: { key: "brand_logo_url" },
        create: { key: "brand_logo_url", value: body.logoUrl || "" },
        update: { value: body.logoUrl || "" },
      });
    }
    if (body.faviconUrl !== undefined) {
      await prisma.localSetting.upsert({
        where: { key: "brand_favicon_url" },
        create: { key: "brand_favicon_url", value: body.faviconUrl || "" },
        update: { value: body.faviconUrl || "" },
      });
    }

    // Invalida la cache locale tenant_config per aggiornare immediatamente la home page e il layout
    try {
      await prisma.localSetting.deleteMany({
        where: { key: "tenant_config_cache" },
      });
    } catch {
      // opzionale
    }

    revalidatePath("/");
    revalidatePath("/dashboard/impostazioni");
    revalidatePath("/dashboard");

    return NextResponse.json({ success: true, config: parseShowcaseConfig(showcaseStr) });
  } catch (error) {
    console.error("Errore salvataggio vetrina Tavoly:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio della vetrina" }, { status: 500 });
  }
}
