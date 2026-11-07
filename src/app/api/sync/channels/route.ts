import { NextRequest, NextResponse } from "next/server";
import {
  syncOmnichannelChannels,
  fetchOmnichannelStatus,
  formatEccezioniToSpecialClosures,
} from "@/lib/omnichannel-client";
import { prisma } from "@/lib/prisma";
import { leggiImpostazioniAnagrafica, orariUfficialiPerCanali } from "@/lib/anagrafica-attivita";

async function isCallerAuthorized(): Promise<boolean> {
  try {
    const authMod = await import("@/lib/auth");
    if (typeof (authMod as any).isAdminAuthenticated === "function") {
      return await (authMod as any).isAdminAuthenticated();
    }
    if (typeof (authMod as any).auth === "function") {
      const session = await (authMod as any).auth();
      return !!session;
    }
  } catch {}
  return true;
}

export async function GET() {
  const isAuth = await isCallerAuthorized();
  if (!isAuth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const status = await fetchOmnichannelStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  const isAuth = await isCallerAuthorized();
  if (!isAuth) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 1. Gli orari su Google / Facebook / Instagram sono SEMPRE gli orari ufficiali dell'attivita'
    //    (Impostazioni > Ristorante, giorni di chiusura inclusi). Quelli eventualmente inviati dal
    //    chiamante, o i turni di cucina / asporto, non vengono mai usati.
    const { orari } = await leggiImpostazioniAnagrafica();
    const weeklyHours = orariUfficialiPerCanali(orari.config);

    // 2. Chiusure straordinarie: quelle inviate dal chiamante oppure le prossime del calendario
    let specialClosures = body.specialClosures;
    if (!specialClosures) {
      const oggi = new Date().toISOString().slice(0, 10);
      const eccezioni = Array.isArray(body.eccezioni)
        ? body.eccezioni
        : await prisma.eccezioneCalendario.findMany({ where: { tipo: "CHIUSURA", data: { gte: oggi } } });
      specialClosures = formatEccezioniToSpecialClosures(eccezioni);
    }

    const result = await syncOmnichannelChannels({
      weeklyHours,
      specialClosures: specialClosures || [],
    });

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, success: false, error: result.error || "Errore durante la sincronizzazione canali" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      summary: result.summary,
      channels: result.channels,
    });
  } catch (error: any) {
    console.error("[Omnichannel Sync Channels API Error]:", error);
    return NextResponse.json(
      { ok: false, success: false, error: error.message || "Errore interno server durante il sync canali" },
      { status: 500 }
    );
  }
}
