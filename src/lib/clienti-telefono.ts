import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

export interface ClienteTrovato {
  id: string;
  name: string;
  phoneNumber: string;
}

/**
 * Cerca un cliente con lo stesso numero, qualunque sia il formato in cui e' stato salvato
 * (es. "+39 333 1122334", "333-1122334", "3331122334", "0039 333 1122334").
 * Si confrontano solo le cifre, senza spazi, trattini, punti, parentesi e "+".
 */
export async function cercaClientePerTelefono(raw: string, escludiId?: string): Promise<ClienteTrovato | null> {
  const n = normalizePhone(raw);
  if (!n || n.length < 6) return null;
  const varianti = [n, `39${n}`, `0039${n}`];
  const segnaposto = varianti.map(() => "?").join(",");
  const righe = (await prisma.$queryRawUnsafe(
    `SELECT "id", "name", "phoneNumber" FROM "CustomerProfile"
     WHERE "phoneNumber" NOT LIKE 'CANCELLATO%'
       AND replace(replace(replace(replace(replace(replace("phoneNumber", ' ', ''), '-', ''), '.', ''), '(', ''), ')', ''), '+', '') IN (${segnaposto})
       ${escludiId ? 'AND "id" != ?' : ""}
     LIMIT 1`,
    ...varianti,
    ...(escludiId ? [escludiId] : [])
  )) as ClienteTrovato[];
  return righe[0] ?? null;
}

/**
 * Aggiorna la scheda del cliente che ha lo stesso numero (in qualunque formato) oppure ne crea una nuova,
 * salvando il telefono normalizzato. Non assegna punti: i punti arrivano dalla spesa (vedi fidelity.ts).
 */
export async function registraVisitaCliente(opz: {
  telefono: string;
  nome: string;
  email?: string | null;
  note?: string | null;
  noteNuovo?: string | null;
}): Promise<void> {
  const telefono = opz.telefono.trim();
  const trovato = await cercaClientePerTelefono(telefono);
  if (trovato) {
    await prisma.customerProfile.update({
      where: { id: trovato.id },
      data: {
        name: opz.nome,
        ...(opz.email ? { email: opz.email } : {}),
        ...(opz.note ? { notes: opz.note } : {}),
        visitCount: { increment: 1 },
        lastVisitAt: new Date(),
      },
    });
    return;
  }
  await prisma.customerProfile.create({
    data: {
      phoneNumber: normalizePhone(telefono) || telefono,
      name: opz.nome,
      email: opz.email || null,
      notes: opz.note || opz.noteNuovo || null,
      visitCount: 1,
      loyaltyPoints: 0,
      lastVisitAt: new Date(),
    },
  });
}
