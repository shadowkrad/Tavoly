import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const eccezioni = await prisma.eccezioneCalendario.findMany({
      orderBy: { data: "asc" },
    });
    return NextResponse.json({ eccezioni });
  } catch (error) {
    console.error("Errore recupero eccezioni calendario:", error);
    return NextResponse.json({ error: "Errore recupero eccezioni" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, titolo, tipo, isAperto, orarioApertura, orarioChiusura, pausaInizio, pausaFine, note } = body;

    if (!data || !titolo) {
      return NextResponse.json({ error: "Data e titolo sono obbligatori" }, { status: 400 });
    }

    const cleanData = String(data).slice(0, 10);

    const record = await prisma.eccezioneCalendario.upsert({
      where: { data: cleanData },
      create: {
        data: cleanData,
        titolo: String(titolo),
        tipo: tipo || "CHIUSURA",
        isAperto: isAperto ?? false,
        orarioApertura: orarioApertura || null,
        orarioChiusura: orarioChiusura || null,
        pausaInizio: pausaInizio || null,
        pausaFine: pausaFine || null,
        note: note || null,
      },
      update: {
        titolo: String(titolo),
        tipo: tipo || "CHIUSURA",
        isAperto: isAperto ?? false,
        orarioApertura: orarioApertura || null,
        orarioChiusura: orarioChiusura || null,
        pausaInizio: pausaInizio || null,
        pausaFine: pausaFine || null,
        note: note || null,
      },
    });

    revalidatePath("/");
    revalidatePath("/prenotazione");
    revalidatePath("/dashboard/impostazioni");

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Errore salvataggio eccezione calendario:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const data = searchParams.get("data");

    if (!id && !data) {
      return NextResponse.json({ error: "ID o data mancante" }, { status: 400 });
    }

    if (id) {
      await prisma.eccezioneCalendario.delete({ where: { id } });
    } else if (data) {
      await prisma.eccezioneCalendario.delete({ where: { data } });
    }

    revalidatePath("/");
    revalidatePath("/prenotazione");
    revalidatePath("/dashboard/impostazioni");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore cancellazione eccezione:", error);
    return NextResponse.json({ error: "Errore durante la cancellazione" }, { status: 500 });
  }
}
