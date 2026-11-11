import { NextRequest, NextResponse } from "next/server";
import { prisma, ensureDatabase } from "@/lib/prisma";
import { isStaffAuthenticated } from "@/lib/auth";

/** Ricerca rapida clienti (nome o telefono) per intestare un buono. */
export async function GET(req: NextRequest) {
  if (!(await isStaffAuthenticated())) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  await ensureDatabase();

  const ricerca = req.nextUrl.searchParams.get("ricerca")?.trim() || "";
  const limit = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "8", 10) || 8));
  const cifre = ricerca.replace(/\D/g, "");

  const righe = await prisma.customerProfile.findMany({
    where: {
      NOT: { phoneNumber: { startsWith: "CANCELLATO" } },
      ...(ricerca
        ? { OR: [{ name: { contains: ricerca } }, ...(cifre.length >= 3 ? [{ phoneNumber: { contains: cifre } }] : [])] }
        : {}),
    },
    select: { id: true, name: true, phoneNumber: true, email: true },
    orderBy: { name: "asc" },
    take: limit,
  });

  return NextResponse.json({
    clienti: righe.map((c) => ({ id: c.id, nome: c.name, cognome: "", telefono: c.phoneNumber, email: c.email })),
  });
}
