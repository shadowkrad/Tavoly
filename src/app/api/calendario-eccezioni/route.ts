import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStaffAuthenticated } from "@/lib/auth";
import { getElencoFestivitaAnno } from "@/lib/festivita-italiane";

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isStaffAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const year = parseInt(req.nextUrl.searchParams.get("anno") || String(new Date().getFullYear()));

    const [eccezioni, cache] = await Promise.all([
      prisma.eccezioneCalendario.findMany({
        orderBy: { data: "asc" },
      }),
      prisma.tenantLocalCache.findUnique({
        where: { id: "singleton" },
      }),
    ]);

    const festivitaNazionali = getElencoFestivitaAnno(year);

    return NextResponse.json({
      eccezioni,
      festivitaNazionali,
      rispettaFestivitaNazionali: (cache as any)?.rispettaFestivitaNazionali ?? true,
    });
  } catch (error: any) {
    console.error("GET /api/calendario-eccezioni error:", error);
    return NextResponse.json({ error: error?.message || "Errore recupero dati" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isStaffAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await req.json();

    // Toggle rispettaFestivitaNazionali
    if (typeof body.rispettaFestivitaNazionali === "boolean") {
      await prisma.tenantLocalCache.upsert({
        where: { id: "singleton" },
        update: { rispettaFestivitaNazionali: body.rispettaFestivitaNazionali },
        create: {
          id: "singleton",
          rispettaFestivitaNazionali: body.rispettaFestivitaNazionali,
        },
      });
      return NextResponse.json({ success: true, rispettaFestivitaNazionali: body.rispettaFestivitaNazionali });
    }

    // Creazione / Aggiornamento EccezioneCalendario
    const { data, titolo, tipo, isAperto, orarioApertura, orarioChiusura, pausaInizio, pausaFine, note } = body;

    if (!data || !titolo) {
      return NextResponse.json({ error: "Data e titolo sono obbligatori" }, { status: 400 });
    }

    const cleanData = String(data).slice(0, 10);

    const eccezione = await prisma.eccezioneCalendario.upsert({
      where: { data: cleanData },
      update: {
        titolo,
        tipo: tipo || "CHIUSURA",
        isAperto: isAperto ?? (tipo !== "CHIUSURA"),
        orarioApertura: orarioApertura || null,
        orarioChiusura: orarioChiusura || null,
        pausaInizio: pausaInizio || null,
        pausaFine: pausaFine || null,
        note: note || null,
      },
      create: {
        data: cleanData,
        titolo,
        tipo: tipo || "CHIUSURA",
        isAperto: isAperto ?? (tipo !== "CHIUSURA"),
        orarioApertura: orarioApertura || null,
        orarioChiusura: orarioChiusura || null,
        pausaInizio: pausaInizio || null,
        pausaFine: pausaFine || null,
        note: note || null,
      },
    });

    return NextResponse.json(eccezione);
  } catch (error: any) {
    console.error("POST /api/calendario-eccezioni error:", error);
    return NextResponse.json({ error: error?.message || "Errore salvataggio eccezione" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const isAuth = await isStaffAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const data = req.nextUrl.searchParams.get("data");
    if (!data) {
      return NextResponse.json({ error: "Parametro 'data' mancante" }, { status: 400 });
    }

    await prisma.eccezioneCalendario.delete({
      where: { data: data.slice(0, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/calendario-eccezioni error:", error);
    return NextResponse.json({ error: error?.message || "Errore eliminazione" }, { status: 500 });
  }
}
