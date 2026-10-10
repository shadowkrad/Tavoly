import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dishes = await prisma.menuItem.findMany({
      where: { isAvailable: true },
      orderBy: [{ category: "asc" }, { orderIndex: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, dishes });
  } catch (error) {
    console.error("Errore recupero piatti menù:", error);
    return NextResponse.json({ success: false, error: "Errore caricamento piatti" }, { status: 500 });
  }
}
