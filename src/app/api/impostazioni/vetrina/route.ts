import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseShowcaseConfig, DEFAULT_TAVOLY_SHOWCASE_CONFIG } from "@/lib/showcase-defaults";

export async function GET() {
  try {
    const setting = await prisma.localSetting.findUnique({
      where: { key: "showcase_config" },
    });

    const parsed = parseShowcaseConfig(setting?.value);

    // Sincronizza anche con restaurant_name e colori se presenti su LocalSetting
    const meta = await prisma.localSetting.findMany({
      where: {
        key: { in: ["restaurant_name", "color_primary", "color_accent", "brand_logo_url", "brand_favicon_url"] },
      },
    });
    for (const m of meta) {
      if (m.key === "restaurant_name" && m.value) parsed.brandName = m.value;
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
    const showcaseStr = JSON.stringify(body);

    await prisma.localSetting.upsert({
      where: { key: "showcase_config" },
      create: { key: "showcase_config", value: showcaseStr },
      update: { value: showcaseStr },
    });

    if (body.brandName && typeof body.brandName === "string" && body.brandName.trim().length > 0) {
      await prisma.localSetting.upsert({
        where: { key: "restaurant_name" },
        create: { key: "restaurant_name", value: body.brandName.trim() },
        update: { value: body.brandName.trim() },
      });
    }
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
