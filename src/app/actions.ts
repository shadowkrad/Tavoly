"use server";

import { risolviStatoGiornoTavoly } from "@/lib/festivita-italiane";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendNotificationMail } from "@/lib/taaaac-mailer";
import { triggerGoogleReviewBooster } from "@/lib/omnichannel-client";
import { setStaffSession, clearStaffSession, verifyStaffPasswordOrPin, verifyStaffPin } from "@/lib/auth";
import {
  publicReservationSchema,
  staffLoginSchema,
  tablePositionSchema,
  createTableSchema,
  walkInSchema,
} from "@/lib/validations";

// --- AUTH ACTIONS ---
export async function loginStaffAction(credential: string) {
  const result = staffLoginSchema.safeParse({ pin: credential });
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "Credenziali non valide" };
  }

  if (!verifyStaffPasswordOrPin(result.data.pin)) {
    return { success: false, error: "Password o PIN errato. Riprova." };
  }

  await setStaffSession();
  return { success: true };
}

export async function loginDemoAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await setStaffSession();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Errore durante l'accesso demo" };
  }
}

export async function logoutStaffAction() {
  await clearStaffSession();
  redirect("/");
}

// --- PUBLIC BOOKING ACTION ---
export async function createPublicReservationAction(formData: FormData) {
  const dateStr = (formData.get("date") as string) || new Date().toISOString().split("T")[0];
  const tableId = (formData.get("tableId") as string) || null;

  const rawData = {
    customerName: formData.get("customerName"),
    phoneNumber: formData.get("phoneNumber"),
    email: formData.get("email") || undefined,
    guestCount: formData.get("guestCount"),
    date: dateStr,
    timeSlot: formData.get("timeSlot"),
    notes: formData.get("notes") || undefined,
  };

  const validation = publicReservationSchema.safeParse(rawData);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Dati non validi";
    return { success: false, error: firstError };
  }

  const { customerName, phoneNumber, email, guestCount, date, timeSlot, notes } = validation.data;

  // Verifica chiusura festività o ferie ristorante
  const statoGiorno = await risolviStatoGiornoTavoly(date);
  if (!statoGiorno.isLavorativo) {
    return {
      success: false,
      error: "Il ristorante è chiuso nella data selezionata: " + (statoGiorno.motivo || statoGiorno.titolo),
    };
  }

  try {
    const reservationDate = new Date(date);

    await prisma.reservation.create({
      data: {
        customerName,
        phoneNumber,
        email: email || null,
        guestCount,
        timeSlot,
        date: isNaN(reservationDate.getTime()) ? new Date() : reservationDate,
        notes: notes || null,
        status: "CONFERMATA",
        whatsappSent: true,
        isWalkIn: false,
        tableId: tableId === "" ? null : tableId,
      },
    });

    // Invio notifica email automatica (se email presente)
    if (email) {
      const formattedDate = reservationDate.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      sendNotificationMail({
        to: email,
        subject: `Prenotazione Tavolo Confermata — Tavoly Restaurant`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #fed7aa; border-radius: 16px; background: #ffffff;">
            <h2 style="color: #ea580c; margin-top: 0;">🍽️ Prenotazione Confermata!</h2>
            <p style="color: #334155; font-size: 15px;">Gentile <strong>${customerName}</strong>,</p>
            <p style="color: #475569; font-size: 14px;">Il tuo tavolo presso <strong>Tavoly Restaurant</strong> è stato confermato con successo.</p>
            <div style="background: #fff7ed; border-left: 4px solid #ea580c; padding: 14px 18px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
              <p style="margin: 4px 0; color: #9a3412;"><strong>Data:</strong> ${formattedDate}</p>
              <p style="margin: 4px 0; color: #9a3412;"><strong>Orario:</strong> ${timeSlot}</p>
              <p style="margin: 4px 0; color: #9a3412;"><strong>Numero Ospiti:</strong> ${guestCount} persone</p>
              ${notes ? `<p style="margin: 4px 0; color: #9a3412;"><strong>Note:</strong> ${notes}</p>` : ""}
            </div>
            <p style="color: #64748b; font-size: 13px;">Se desideri disdire o apportare modifiche alla prenotazione, rispondi direttamente a questa email.</p>
          </div>
        `,
        senderName: "Tavoly Restaurant",
      }).catch((mailErr) => console.error("Errore invio email Tavoly:", mailErr));
    }

    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: "PRENOTATO" },
      });
    }

    // Aggiornamento o creazione Scheda Cliente (Issue #9)
    try {
      await prisma.customerProfile.upsert({
        where: { phoneNumber },
        create: {
          phoneNumber,
          name: customerName,
          email: email || null,
          notes: notes || null,
          visitCount: 1,
          loyaltyPoints: 10,
          lastVisitAt: new Date(),
        },
        update: {
          name: customerName,
          email: email || undefined,
          notes: notes ? notes : undefined,
          visitCount: { increment: 1 },
          loyaltyPoints: { increment: 10 },
          lastVisitAt: new Date(),
        },
      });
    } catch {
      // opzionale
    }

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[Prenotazione Pubblica] Errore inserimento:", error);
    return { success: false, error: "Impossibile completare la prenotazione al momento." };
  }
}

// Alias for modal compatibility
export async function createReservation(formData: FormData) {
  return createPublicReservationAction(formData);
}

// --- STAFF TABLE & CANVAS ACTIONS ---
export async function updateTableStatus(tableId: string, status: string) {
  try {
    const current = await prisma.table.findUnique({ where: { id: tableId } });
    let newSeated = current?.seatedCount || 0;

    if (status === "LIBERO") {
      newSeated = 0;
    } else if (status === "OCCUPATO" && newSeated === 0) {
      newSeated = current?.capacity || 2;
    }

    await prisma.table.update({
      where: { id: tableId },
      data: {
        status,
        seatedCount: newSeated,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento stato tavolo:", error);
    return { success: false, error: "Impossibile aggiornare lo stato del tavolo" };
  }
}

export async function updateTablePositionAction(tableId: string, posX: number, posY: number) {
  const parsed = tablePositionSchema.safeParse({ tableId, posX, posY });
  if (!parsed.success) {
    return { success: false, error: "Coordinate non valide" };
  }

  try {
    await prisma.table.update({
      where: { id: parsed.data.tableId },
      data: {
        posX: Math.round(parsed.data.posX * 10) / 10,
        posY: Math.round(parsed.data.posY * 10) / 10,
      },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore salvataggio posizione tavolo:", error);
    return { success: false, error: "Errore nel salvataggio della posizione" };
  }
}

export async function updateTableSeatedCountAction(tableId: string, delta: number) {
  try {
    const table = await prisma.table.findUnique({ where: { id: tableId } });
    if (!table) return { success: false, error: "Tavolo non trovato" };

    const newCount = Math.max(0, Math.min(table.capacity + 4, table.seatedCount + delta));
    let newStatus = table.status;

    if (newCount === 0 && table.status === "OCCUPATO") {
      newStatus = "LIBERO";
    } else if (newCount > 0 && table.status === "LIBERO") {
      newStatus = "OCCUPATO";
    }

    await prisma.table.update({
      where: { id: tableId },
      data: {
        seatedCount: newCount,
        status: newStatus,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, seatedCount: newCount };
  } catch (error) {
    console.error("Errore aggiornamento persone sedute:", error);
    return { success: false, error: "Errore durante l'aggiornamento dei coperti" };
  }
}

export async function createCustomTableAction(formData: FormData) {
  const raw = {
    number: formData.get("number"),
    capacity: formData.get("capacity"),
    shape: formData.get("shape"),
    areaId: formData.get("areaId"),
    posX: formData.get("posX") || 50,
    posY: formData.get("posY") || 50,
  };

  const parsed = createTableSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dati tavolo non validi" };
  }

  try {
    const existing = await prisma.table.findFirst({
      where: {
        areaId: parsed.data.areaId,
        number: parsed.data.number,
      },
    });

    if (existing) {
      return { success: false, error: `Il tavolo ${parsed.data.number} esiste già in questa sala.` };
    }

    await prisma.table.create({
      data: {
        number: parsed.data.number,
        capacity: parsed.data.capacity,
        shape: parsed.data.shape,
        areaId: parsed.data.areaId,
        posX: parsed.data.posX,
        posY: parsed.data.posY,
        status: "LIBERO",
        seatedCount: 0,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore creazione nuovo tavolo:", error);
    return { success: false, error: "Impossibile creare il tavolo" };
  }
}

export async function createWalkInAction(tableId: string, guestCount: number) {
  const parsed = walkInSchema.safeParse({ tableId, guestCount });
  if (!parsed.success) {
    return { success: false, error: "Dati non validi per cliente al volo" };
  }

  try {
    const table = await prisma.table.findUnique({
      where: { id: parsed.data.tableId },
      include: { area: true },
    });

    if (!table) return { success: false, error: "Tavolo non trovato" };

    const now = new Date();
    const timeSlot = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    await prisma.$transaction([
      prisma.reservation.create({
        data: {
          customerName: `Walk-in (Tav. ${table.number})`,
          phoneNumber: "Banco / Presenza",
          guestCount: parsed.data.guestCount,
          timeSlot,
          date: now,
          status: "SEDUTI",
          tableId: table.id,
          isWalkIn: true,
          whatsappSent: false,
          notes: "Cliente accomodato direttamente",
        },
      }),
      prisma.table.update({
        where: { id: table.id },
        data: {
          status: "OCCUPATO",
          seatedCount: parsed.data.guestCount,
        },
      }),
    ]);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore registrazione walk-in:", error);
    return { success: false, error: "Impossibile registrare il cliente al volo" };
  }
}

export async function updateReservationStatus(reservationId: string, status: string) {
  try {
    const res = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
      include: { table: true },
    });

    if (status === "SEDUTI" && res.tableId) {
      await prisma.table.update({
        where: { id: res.tableId },
        data: {
          status: "OCCUPATO",
          seatedCount: res.guestCount,
        },
      });
    } else if ((status === "COMPLETATA" || status === "ANNULLATA") && res.tableId) {
      await prisma.table.update({
        where: { id: res.tableId },
        data: {
          status: "LIBERO",
          seatedCount: 0,
        },
      });
    }

    if (status === "COMPLETATA" && res.email) {
      triggerGoogleReviewBooster({
        clientEmail: res.email,
        clientName: res.customerName,
        serviceName: "Esperienza al Ristorante",
      }).catch((err) => console.error("[Tavoly Reservation ReviewBooster Trigger Error]:", err));
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/prenotazioni");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento prenotazione:", error);
    return { success: false, error: "Impossibile aggiornare la prenotazione" };
  }
}

export async function assignTableToReservationAction(reservationId: string, tableId: string | null) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) return { success: false, error: "Prenotazione non trovata" };

    const targetTableId = !tableId || tableId === "" ? null : tableId;

    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        tableId: targetTableId,
      },
    });

    if (targetTableId && reservation.status === "SEDUTI") {
      await prisma.table.update({
        where: { id: targetTableId },
        data: {
          status: "OCCUPATO",
          seatedCount: reservation.guestCount,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/prenotazioni");
    return { success: true };
  } catch (error) {
    console.error("Errore assegnazione tavolo:", error);
    return { success: false, error: "Impossibile assegnare il tavolo" };
  }
}

export async function updateReservationDetailsAction(
  reservationId: string,
  data: {
    customerName?: string;
    phoneNumber?: string;
    email?: string | null;
    guestCount?: number;
    timeSlot?: string;
    date?: string | Date;
    tableId?: string | null;
    status?: string;
    notes?: string | null;
  }
) {
  try {
    const existing = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!existing) return { success: false, error: "Prenotazione non trovata" };

    const updatePayload: any = {};
    if (data.customerName !== undefined) updatePayload.customerName = data.customerName;
    if (data.phoneNumber !== undefined) updatePayload.phoneNumber = data.phoneNumber;
    if (data.email !== undefined) updatePayload.email = data.email || null;
    if (data.guestCount !== undefined) updatePayload.guestCount = Number(data.guestCount);
    if (data.timeSlot !== undefined) updatePayload.timeSlot = data.timeSlot;
    if (data.date !== undefined) {
      const d = new Date(data.date);
      if (!isNaN(d.getTime())) updatePayload.date = d;
    }
    if (data.tableId !== undefined) {
      updatePayload.tableId = !data.tableId || data.tableId === "" ? null : data.tableId;
    }
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes || null;

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: updatePayload,
      include: { table: true },
    });

    const effectiveTableId = updated.tableId;
    if (effectiveTableId) {
      if (updated.status === "SEDUTI") {
        await prisma.table.update({
          where: { id: effectiveTableId },
          data: { status: "OCCUPATO", seatedCount: updated.guestCount },
        });
      } else if (updated.status === "COMPLETATA" || updated.status === "ANNULLATA") {
        await prisma.table.update({
          where: { id: effectiveTableId },
          data: { status: "LIBERO", seatedCount: 0 },
        });
      } else if (updated.status === "CONFERMATA" || updated.status === "IN_ATTESA") {
        await prisma.table.update({
          where: { id: effectiveTableId },
          data: { status: "PRENOTATO" },
        });
      }
    }

    if (existing.tableId && existing.tableId !== effectiveTableId) {
      await prisma.table.update({
        where: { id: existing.tableId },
        data: { status: "LIBERO", seatedCount: 0 },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/prenotazioni");
    return { success: true, reservation: updated };
  } catch (error) {
    console.error("Errore aggiornamento dettagli prenotazione:", error);
    return { success: false, error: "Impossibile aggiornare i dettagli della prenotazione" };
  }
}

export async function deleteReservationAction(reservationId: string) {
  try {
    const res = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!res) return { success: false, error: "Prenotazione non trovata" };

    if (res.tableId && res.status === "SEDUTI") {
      await prisma.table.update({
        where: { id: res.tableId },
        data: { status: "LIBERO", seatedCount: 0 },
      });
    }

    await prisma.reservation.delete({
      where: { id: reservationId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/prenotazioni");
    return { success: true };
  } catch (error) {
    console.error("Errore eliminazione prenotazione:", error);
    return { success: false, error: "Impossibile eliminare la prenotazione" };
  }
}

// --- CUSTOMER PROFILE ACTIONS (CRM Gestionale Clienti) ---
export interface CustomerProfileInput {
  id?: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
  allergies?: string | null;
  favoriteTable?: string | null;
  isVip?: boolean;
  notes?: string | null;
  visitCount?: number;
  loyaltyPoints?: number;
}

export async function createOrUpdateCustomerAction(input: CustomerProfileInput) {
  try {
    const name = input.name?.trim();
    const phoneNumber = input.phoneNumber?.trim();

    if (!name || !phoneNumber) {
      return { success: false, error: "Nome e Numero di Telefono sono obbligatori" };
    }

    if (phoneNumber.length < 6) {
      return { success: false, error: "Inserisci un numero di telefono valido" };
    }

    const email = input.email?.trim() || null;
    const allergies = input.allergies?.trim() || null;
    const favoriteTable = input.favoriteTable?.trim() || null;
    const isVip = Boolean(input.isVip);
    const notes = input.notes?.trim() || null;
    const visitCount = typeof input.visitCount === "number" ? Math.max(1, input.visitCount) : 1;
    const loyaltyPoints = typeof input.loyaltyPoints === "number" ? Math.max(0, input.loyaltyPoints) : 10;

    let customer;
    if (input.id) {
      // Verifica unicità telefono se modificato
      const existingPhone = await prisma.customerProfile.findUnique({
        where: { phoneNumber },
      });
      if (existingPhone && existingPhone.id !== input.id) {
        return { success: false, error: "Un altro cliente ha già questo numero di telefono" };
      }

      customer = await prisma.customerProfile.update({
        where: { id: input.id },
        data: {
          name,
          phoneNumber,
          email,
          allergies,
          favoriteTable,
          isVip,
          notes,
          visitCount,
          loyaltyPoints,
        },
      });
    } else {
      customer = await prisma.customerProfile.upsert({
        where: { phoneNumber },
        create: {
          name,
          phoneNumber,
          email,
          allergies,
          favoriteTable,
          isVip,
          notes,
          visitCount,
          loyaltyPoints,
          lastVisitAt: new Date(),
        },
        update: {
          name,
          email,
          allergies,
          favoriteTable,
          isVip,
          notes,
          visitCount,
          loyaltyPoints,
        },
      });
    }

    revalidatePath("/dashboard/clienti");
    revalidatePath("/dashboard");
    return { success: true, customer };
  } catch (error) {
    console.error("Errore salvataggio profilo cliente:", error);
    return { success: false, error: "Impossibile salvare la scheda cliente" };
  }
}

export async function deleteCustomerAction(id: string) {
  try {
    await prisma.customerProfile.delete({
      where: { id },
    });
    revalidatePath("/dashboard/clienti");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore eliminazione cliente:", error);
    return { success: false, error: "Impossibile eliminare la scheda cliente" };
  }
}

export async function incrementCustomerVisitsAction(id: string, loyaltyDelta: number = 10) {
  try {
    const updated = await prisma.customerProfile.update({
      where: { id },
      data: {
        visitCount: { increment: 1 },
        loyaltyPoints: { increment: loyaltyDelta },
        lastVisitAt: new Date(),
      },
    });
    revalidatePath("/dashboard/clienti");
    revalidatePath("/dashboard");
    return { success: true, customer: updated };
  } catch (error) {
    console.error("Errore registrazione visita:", error);
    return { success: false, error: "Impossibile registrare la visita" };
  }
}

export async function updateCustomerNotesAction(phoneNumber: string, notes: string, loyaltyDelta: number = 0) {
  try {
    const updated = await prisma.customerProfile.update({
      where: { phoneNumber },
      data: {
        notes,
        ...(loyaltyDelta !== 0 ? { loyaltyPoints: { increment: loyaltyDelta } } : {}),
      },
    });
    revalidatePath("/dashboard/clienti");
    revalidatePath("/dashboard");
    return { success: true, customer: updated };
  } catch (error) {
    console.error("Errore aggiornamento note cliente:", error);
    return { success: false, error: "Impossibile aggiornare la scheda cliente" };
  }
}

// --- TAKEAWAY ORDER ACTIONS (Issue #9 - Vendoly Channel Manager) ---
export async function updateTakeawayStatusAction(orderId: string, status: string) {
  try {
    await prisma.takeawayOrder.update({
      where: { id: orderId },
      data: { status },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento ordine asporto:", error);
    return { success: false, error: "Impossibile aggiornare lo stato dell'ordine" };
  }
}

// --- SERVICE SHIFTS ACTIONS (Issue #7) ---
export async function updateServiceShiftAction(shiftId: string, maxGuests: number, isActive: boolean) {
  try {
    await prisma.serviceShift.update({
      where: { id: shiftId },
      data: {
        maxGuests,
        isActive,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento turno di servizio:", error);
    return { success: false, error: "Impossibile aggiornare le impostazioni del turno" };
  }
}

// --- THEME PALETTE ACTIONS (Issue #2) ---
export async function updateThemePaletteAction(paletteId: string) {
  try {
    await prisma.localSetting.upsert({
      where: { key: "active_palette_id" },
      create: { key: "active_palette_id", value: paletteId },
      update: { value: paletteId },
    });
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento tema:", error);
    return { success: false, error: "Impossibile salvare la palette del tema" };
  }
}

// --- AREAS / STANZE ACTIONS ---
export async function createAreaAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name || name.length < 2) {
    return { success: false, error: "Il nome della sala deve contenere almeno 2 caratteri" };
  }

  try {
    const existing = await prisma.area.findFirst({
      where: { name: { equals: name } },
    });
    if (existing) {
      return { success: false, error: "Esiste già una sala con questo nome" };
    }

    const lastArea = await prisma.area.findFirst({
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = lastArea ? lastArea.orderIndex + 1 : 0;

    const newArea = await prisma.area.create({
      data: {
        name,
        description,
        orderIndex,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, area: newArea };
  } catch (error) {
    console.error("Errore creazione sala:", error);
    return { success: false, error: "Impossibile creare la sala" };
  }
}

export async function updateAreaAction(areaId: string, name: string, description?: string | null) {
  const trimmedName = name?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: "Il nome della sala deve contenere almeno 2 caratteri" };
  }

  try {
    const existing = await prisma.area.findFirst({
      where: {
        name: { equals: trimmedName },
        id: { not: areaId },
      },
    });
    if (existing) {
      return { success: false, error: "Esiste già un'altra sala con questo nome" };
    }

    await prisma.area.update({
      where: { id: areaId },
      data: {
        name: trimmedName,
        description: description?.trim() || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore modifica sala:", error);
    return { success: false, error: "Impossibile modificare la sala" };
  }
}

export async function deleteAreaAction(areaId: string) {
  try {
    const totalAreas = await prisma.area.count();
    if (totalAreas <= 1) {
      return { success: false, error: "Non puoi eliminare l'unica sala presente. Deve esserci almeno una sala attiva." };
    }

    // Controlla se ci sono tavoli con servizio attivo (OCCUPATO o CONTO)
    const activeTable = await prisma.table.findFirst({
      where: {
        areaId,
        status: { in: ["OCCUPATO", "CONTO"] },
      },
    });

    if (activeTable) {
      return {
        success: false,
        error: "Impossibile eliminare la sala: ci sono tavoli attualmente occupati o con conto in corso.",
      };
    }

    // Scollega i tavoli di quest'area dalle prenotazioni per mantenere lo storico
    const areaTables = await prisma.table.findMany({
      where: { areaId },
      select: { id: true },
    });
    const tableIds = areaTables.map((t) => t.id);

    if (tableIds.length > 0) {
      await prisma.reservation.updateMany({
        where: { tableId: { in: tableIds } },
        data: { tableId: null },
      });
    }

    // Elimina la sala (e i suoi tavoli via cascade)
    await prisma.area.delete({
      where: { id: areaId },
    });

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore cancellazione sala:", error);
    return { success: false, error: "Impossibile eliminare la sala" };
  }
}

// --- MENU ACTIONS ---
export async function createMenuItemAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "Primi";
  const priceRaw = parseFloat(formData.get("price") as string);
  const price = isNaN(priceRaw) ? 0.0 : Math.max(0, priceRaw);
  const description = (formData.get("description") as string)?.trim() || null;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const allergens = (formData.get("allergens") as string)?.trim() || "[]";
  const isAvailable = formData.get("isAvailable") !== "false";
  const isTakeaway = formData.get("isTakeaway") !== "false";

  if (!name || name.length < 2) {
    return { success: false, error: "Il nome del piatto deve contenere almeno 2 caratteri" };
  }

  try {
    const lastItem = await prisma.menuItem.findFirst({
      where: { category },
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = lastItem ? lastItem.orderIndex + 1 : 0;

    const item = await prisma.menuItem.create({
      data: {
        name,
        category,
        price,
        description,
        imageUrl,
        allergens,
        isAvailable,
        isTakeaway,
        orderIndex,
      },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/asporto");
    revalidatePath("/menu");
    revalidatePath("/prenotazione");
    return { success: true, item };
  } catch (error) {
    console.error("Errore creazione piatto:", error);
    return { success: false, error: "Impossibile creare il piatto" };
  }
}

export async function updateMenuItemAction(id: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || "Primi";
  const priceRaw = parseFloat(formData.get("price") as string);
  const price = isNaN(priceRaw) ? 0.0 : Math.max(0, priceRaw);
  const description = (formData.get("description") as string)?.trim() || null;
  const imageUrl = (formData.get("imageUrl") as string)?.trim() || null;
  const allergens = (formData.get("allergens") as string)?.trim() || "[]";
  const isAvailable = formData.get("isAvailable") !== "false";
  const isTakeaway = formData.get("isTakeaway") !== "false";

  if (!name || name.length < 2) {
    return { success: false, error: "Il nome del piatto deve contenere almeno 2 caratteri" };
  }

  try {
    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        name,
        category,
        price,
        description,
        imageUrl,
        allergens,
        isAvailable,
        isTakeaway,
      },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/asporto");
    revalidatePath("/menu");
    revalidatePath("/prenotazione");
    return { success: true, item };
  } catch (error) {
    console.error("Errore modifica piatto:", error);
    return { success: false, error: "Impossibile modificare il piatto" };
  }
}

export async function toggleMenuItemTakeawayAction(id: string, isTakeaway: boolean) {
  try {
    await prisma.menuItem.update({
      where: { id },
      data: { isTakeaway },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/asporto");
    revalidatePath("/menu");
    revalidatePath("/prenotazione");
    return { success: true };
  } catch (error) {
    console.error("Errore modifica disponibilità asporto piatto:", error);
    return { success: false, error: "Impossibile aggiornare la disponibilità per l'asporto" };
  }
}

export async function deleteMenuItemAction(id: string) {
  try {
    await prisma.menuItem.delete({
      where: { id },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    console.error("Errore cancellazione piatto:", error);
    return { success: false, error: "Impossibile cancellare il piatto" };
  }
}

export async function toggleMenuItemAvailabilityAction(id: string, isAvailable: boolean) {
  try {
    await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");
    return { success: true };
  } catch (error) {
    console.error("Errore disponibilità piatto:", error);
    return { success: false, error: "Impossibile aggiornare la disponibilità" };
  }
}

export async function updateMenuShowImagesSettingAction(showImages: boolean) {
  try {
    await prisma.localSetting.upsert({
      where: { key: "menu_show_dish_images" },
      create: { key: "menu_show_dish_images", value: showImages ? "true" : "false" },
      update: { value: showImages ? "true" : "false" },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");
    revalidatePath("/dashboard/impostazioni");
    return { success: true };
  } catch (error) {
    console.error("Errore salvataggio impostazione immagini menu:", error);
    return { success: false, error: "Impossibile salvare l'impostazione" };
  }
}

export async function createTakeawayOrderAction(data: {
  customerName: string;
  phoneNumber: string;
  pickupTime: string;
  itemsSummary: string;
  totalAmount: number;
  notes?: string;
  paymentStatus?: string;
}) {
  try {
    if (!data.customerName?.trim()) {
      return { success: false, error: "Nome cliente obbligatorio" };
    }
    if (!data.pickupTime?.trim()) {
      return { success: false, error: "Orario di ritiro obbligatorio" };
    }
    if (!data.itemsSummary?.trim()) {
      return { success: false, error: "Inserisci almeno un piatto o prodotto nell'ordine" };
    }

    const { getRomeDateTime } = await import("@/lib/takeaway-rules");
    const nowRome = getRomeDateTime();
    const orderDate = (data as { pickupDate?: string }).pickupDate?.trim() || nowRome.dateStr;

    if (orderDate < nowRome.dateStr) {
      return { success: false, error: "Non è possibile registrare un ordine per una data passata" };
    }

    const [orderH, orderM] = data.pickupTime.trim().split(":").map(Number);
    const orderMinutes = (orderH || 0) * 60 + (orderM || 0);
    if (orderDate === nowRome.dateStr && orderMinutes < nowRome.minutesNow) {
      return { success: false, error: "L'orario di ritiro selezionato è già trascorso" };
    }

    const order = await prisma.takeawayOrder.create({
      data: {
        customerName: data.customerName.trim(),
        phoneNumber: data.phoneNumber?.trim() || "",
        email: (data as { email?: string }).email?.trim() || null,
        pickupDate: (data as { pickupDate?: string }).pickupDate?.trim() || null,
        pickupTime: data.pickupTime.trim(),
        itemsSummary: data.itemsSummary.trim(),
        itemsJson: (data as { itemsJson?: string }).itemsJson || null,
        totalAmount: Number(data.totalAmount) || 0,
        status: "IN_CODA",
        paymentStatus: data.paymentStatus === "PAGATO" ? "PAGATO" : "DA_PAGARE",
        notes: data.notes?.trim() || null,
      },
    });

    if (data.phoneNumber && data.phoneNumber.trim().length >= 6) {
      const cleanPhone = data.phoneNumber.trim();
      try {
        await prisma.customerProfile.upsert({
          where: { phoneNumber: cleanPhone },
          create: {
            phoneNumber: cleanPhone,
            name: data.customerName.trim(),
            notes: "Cliente Asporto & Takeaway",
            visitCount: 1,
            loyaltyPoints: 10,
            lastVisitAt: new Date(),
          },
          update: {
            name: data.customerName.trim(),
            visitCount: { increment: 1 },
            loyaltyPoints: { increment: 10 },
            lastVisitAt: new Date(),
          },
        });
      } catch (crmErr) {
        console.warn("[CRM Auto-Sync] Errore aggiornamento profilo cliente:", crmErr);
      }
    }

    // Auto-print ESC/POS se abilitato
    try {
      const pConfig = await getPrinterConfigAction();
      if (pConfig && pConfig.enabled && pConfig.autoPrintTakeaway && pConfig.ip) {
        printTakeawayOrderEscPosAction(order.id).catch((pErr) => {
          console.warn("[ESC/POS AutoPrint] Errore comanda asporto:", pErr);
        });
      }
    } catch (pEx) {
      // safe ignore
    }

    revalidatePath("/dashboard/asporto");
    revalidatePath("/dashboard/clienti");
    return { success: true, order };
  } catch (error) {
    console.error("Errore creazione ordine asporto:", error);
    return { success: false, error: "Impossibile creare l'ordine di asporto" };
  }
}

export async function updateTakeawayOrderStatusAction(id: string, status: string) {
  try {
    const validStatuses = ["IN_CODA", "IN_PREPARAZIONE", "PRONTO", "RITIRATO", "ANNULLATO"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Stato ordine non valido" };
    }

    const order = await prisma.takeawayOrder.update({
      where: { id },
      data: { status },
    });

    if (status === "RITIRATO" && order.email) {
      triggerGoogleReviewBooster({
        clientEmail: order.email,
        clientName: order.customerName,
        serviceName: "Asporto & Takeaway",
      }).catch((err) => console.error("[Tavoly Takeaway ReviewBooster Trigger Error]:", err));
    }

    revalidatePath("/dashboard/asporto");
    return { success: true, order };
  } catch (error) {
    console.error("Errore cambio stato ordine asporto:", error);
    return { success: false, error: "Impossibile aggiornare lo stato dell'ordine" };
  }
}

export async function updateTakeawayOrderPaymentAction(id: string, paymentStatus: string) {
  try {
    const order = await prisma.takeawayOrder.update({
      where: { id },
      data: { paymentStatus: paymentStatus === "PAGATO" ? "PAGATO" : "DA_PAGARE" },
    });

    revalidatePath("/dashboard/asporto");
    return { success: true, order };
  } catch (error) {
    console.error("Errore stato pagamento asporto:", error);
    return { success: false, error: "Impossibile aggiornare lo stato del pagamento" };
  }
}

export async function deleteTakeawayOrderAction(id: string) {
  try {
    await prisma.takeawayOrder.delete({
      where: { id },
    });

    revalidatePath("/dashboard/asporto");
    return { success: true };
  } catch (error) {
    console.error("Errore cancellazione ordine asporto:", error);
    return { success: false, error: "Impossibile cancellare l'ordine" };
  }
}

// --- COMANDE TAVOLO CAMERIERE & MONITOR CUCINA (KDS) ---

export interface TableOrderItemInput {
  dishId?: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
  variants?: string[];
}

export async function createTableOrderAction(data: {
  tableNumber: string;
  coverCount: number;
  waiterName?: string;
  items: TableOrderItemInput[];
  notes?: string;
}) {
  try {
    if (!data.tableNumber?.trim()) {
      return { success: false, error: "Numero tavolo obbligatorio" };
    }
    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Inserisci almeno un piatto nella comanda" };
    }

    const totalAmount = data.items.reduce(
      (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
      0
    );

    const order = await prisma.tableOrder.create({
      data: {
        tableNumber: data.tableNumber.trim(),
        coverCount: Math.max(1, Number(data.coverCount) || 2),
        waiterName: data.waiterName?.trim() || "Cameriere Sala",
        status: "IN_CODA",
        itemsJson: JSON.stringify(data.items),
        notes: data.notes?.trim() || null,
        totalAmount,
      },
    });

    // Se esiste un tavolo fisico con questo numero, aggiorniamolo a OCCUPATO
    try {
      const existingTable = await prisma.table.findFirst({
        where: { number: data.tableNumber.trim() },
      });
      if (existingTable) {
        await prisma.table.update({
          where: { id: existingTable.id },
          data: {
            status: "OCCUPATO",
            seatedCount: Math.max(existingTable.seatedCount, Number(data.coverCount) || 2),
          },
        });
      }
    } catch (tableErr) {
      console.warn("[Table Order] Errore aggiornamento stato tavolo fisico:", tableErr);
    }

    // Auto-print ESC/POS se abilitato
    try {
      const pConfig = await getPrinterConfigAction();
      if (pConfig && pConfig.enabled && pConfig.autoPrintTable && pConfig.ip) {
        printTableOrderEscPosAction(order.id).catch((pErr) => {
          console.warn("[ESC/POS AutoPrint] Errore comanda tavolo:", pErr);
        });
      }
    } catch (pEx) {
      // safe ignore
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cucina");
    revalidatePath("/cucina");
    return { success: true, order };
  } catch (error) {
    console.error("Errore creazione comanda tavolo:", error);
    return { success: false, error: "Impossibile registrare la comanda" };
  }
}

export async function updateTableOrderStatusAction(id: string, status: string) {
  try {
    const validStatuses = ["IN_CODA", "IN_PREPARAZIONE", "PRONTO", "SERVITO", "ANNULLATO"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Stato comanda non valido" };
    }

    const order = await prisma.tableOrder.update({
      where: { id },
      data: { status },
    });

    revalidatePath("/dashboard/cucina");
    revalidatePath("/cucina");
    revalidatePath("/dashboard");
    return { success: true, order };
  } catch (error) {
    console.error("Errore aggiornamento stato comanda tavolo:", error);
    return { success: false, error: "Impossibile aggiornare lo stato della comanda" };
  }
}

export async function deleteTableOrderAction(id: string) {
  try {
    await prisma.tableOrder.delete({
      where: { id },
    });

    revalidatePath("/dashboard/cucina");
    revalidatePath("/cucina");
    return { success: true };
  } catch (error) {
    console.error("Errore eliminazione comanda tavolo:", error);
    return { success: false, error: "Impossibile eliminare la comanda" };
  }
}

export async function toggleKdsSettingAction(enabled: boolean) {
  try {
    const { setIsKdsEnabled } = await import("@/lib/kds-setting");
    await setIsKdsEnabled(enabled);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/impostazioni");
    revalidatePath("/dashboard/cucina");
    revalidatePath("/cucina");
    revalidatePath("/", "layout");
    return { success: true, enabled };
  } catch (error) {
    console.error("Errore salvataggio flag KDS:", error);
    return { success: false, error: "Impossibile aggiornare le impostazioni KDS" };
  }
}

// --- TAKEAWAY SETTINGS & PUBLIC ONLINE ORDERING ---
export async function saveTakeawaySettingsAction(settings: import("@/lib/takeaway-rules").TakeawaySettings) {
  try {
    const { saveTakeawaySettings } = await import("@/lib/takeaway-server");
    await saveTakeawaySettings(settings);

    revalidatePath("/dashboard/impostazioni");
    revalidatePath("/dashboard/asporto");
    revalidatePath("/prenotazione");
    revalidatePath("/asporto");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore salvataggio impostazioni asporto:", error);
    return { success: false, error: "Impossibile salvare le regole di asporto" };
  }
}

export async function toggleTakeawayEnabledAction(enabled: boolean) {
  try {
    const { saveTakeawaySettings } = await import("@/lib/takeaway-server");
    await saveTakeawaySettings({ enabled });

    revalidatePath("/dashboard/impostazioni");
    revalidatePath("/dashboard/asporto");
    revalidatePath("/prenotazione");
    revalidatePath("/asporto");
    revalidatePath("/");
    return { success: true, enabled };
  } catch (error) {
    console.error("Errore toggle asporto:", error);
    return { success: false, error: "Impossibile modificare lo stato dell'asporto" };
  }
}

export async function createPublicTakeawayOrderAction(data: {
  customerName: string;
  phoneNumber: string;
  email?: string;
  pickupDate: string;
  pickupTime: string;
  items: Array<{ dishId: string; quantity: number; notes?: string }>;
  notes?: string;
}) {
  try {
    const { getTakeawaySettings } = await import("@/lib/takeaway-server");
    const { calculateAvailableTakeawaySlots } = await import("@/lib/takeaway-rules");
    const settings = await getTakeawaySettings();

    if (!settings.enabled) {
      return { success: false, error: "Il servizio di asporto non è attualmente attivo" };
    }

    if (!data.customerName?.trim() || data.customerName.trim().length < 2) {
      return { success: false, error: "Inserisci nome e cognome per il ritiro" };
    }

    const cleanPhone = data.phoneNumber?.trim() || "";
    if (cleanPhone.length < 6) {
      return { success: false, error: "Inserisci un numero di telefono valido per la conferma" };
    }

    if (!data.pickupDate || !data.pickupTime) {
      return { success: false, error: "Data e orario di ritiro obbligatori" };
    }

    const { getRomeDateTime } = await import("@/lib/takeaway-rules");
    const nowRome = getRomeDateTime();

    if (data.pickupDate < nowRome.dateStr) {
      return { success: false, error: "Non è possibile effettuare un ordine per una data passata" };
    }

    const [slotH, slotM] = data.pickupTime.split(":").map(Number);
    const slotMinutes = (slotH || 0) * 60 + (slotM || 0);

    if (data.pickupDate === nowRome.dateStr) {
      if (slotMinutes <= nowRome.minutesNow) {
        return { success: false, error: "L'orario di ritiro selezionato è già trascorso" };
      }
      if (slotMinutes < nowRome.minutesNow + settings.prepTimeMinutes) {
        return {
          success: false,
          error: `L'orario di ritiro richiede almeno ${settings.prepTimeMinutes} minuti di preparazione`,
        };
      }
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: "Seleziona almeno un piatto per l'ordine di asporto" };
    }

    // 1. Verifica disponibilità slot secondo le regole impostate
    const existingOrders = await prisma.takeawayOrder.findMany({
      where: {
        status: { not: "ANNULLATO" },
        OR: [
          { pickupDate: data.pickupDate },
          { createdAt: { gte: new Date(new Date(data.pickupDate).setHours(0, 0, 0, 0)) } },
        ],
      },
      select: { pickupTime: true },
    });

    const calculation = calculateAvailableTakeawaySlots(data.pickupDate, settings, existingOrders);
    const chosenSlot = calculation.slots.find((s) => s.time === data.pickupTime);

    if (!chosenSlot) {
      return { success: false, error: "L'orario selezionato non rientra nelle fasce orarie di ritiro" };
    }

    if (!chosenSlot.isAvailable) {
      return { success: false, error: chosenSlot.reason || "Orario non disponibile o capienza comande esaurita" };
    }

    // 2. Verifica piatti: solo quelli disponibili e abilitati per asporto
    const dishIds = data.items.map((it) => it.dishId);
    const dbDishes = await prisma.menuItem.findMany({
      where: {
        id: { in: dishIds },
        isAvailable: true,
        isTakeaway: true,
      },
    });

    if (dbDishes.length === 0) {
      return { success: false, error: "I piatti selezionati non sono disponibili per l'asporto" };
    }

    let totalAmount = 0;
    const structuredItems: Array<{
      dishId: string;
      name: string;
      category: string;
      quantity: number;
      price: number;
      notes?: string;
    }> = [];

    const summaryParts: string[] = [];

    for (const item of data.items) {
      const dish = dbDishes.find((d) => d.id === item.dishId);
      if (!dish) continue;
      const qty = Math.max(1, item.quantity || 1);
      const subtotal = dish.price * qty;
      totalAmount += subtotal;

      summaryParts.push(`${qty}x ${dish.name}`);
      structuredItems.push({
        dishId: dish.id,
        name: dish.name,
        category: dish.category,
        quantity: qty,
        price: dish.price,
        notes: item.notes?.trim() || undefined,
      });
    }

    const itemsSummary = summaryParts.join(", ");

    // 3. Salva TakeawayOrder
    const order = await prisma.takeawayOrder.create({
      data: {
        customerName: data.customerName.trim(),
        phoneNumber: cleanPhone,
        email: data.email?.trim() || null,
        pickupDate: data.pickupDate,
        pickupTime: data.pickupTime,
        itemsSummary,
        itemsJson: JSON.stringify(structuredItems),
        totalAmount,
        status: "IN_CODA",
        paymentStatus: "DA_PAGARE",
        notes: data.notes?.trim() || null,
      },
    });

    // 4. CRM Auto-Sync
    try {
      await prisma.customerProfile.upsert({
        where: { phoneNumber: cleanPhone },
        create: {
          phoneNumber: cleanPhone,
          name: data.customerName.trim(),
          email: data.email?.trim() || null,
          notes: "Cliente Asporto Online",
          visitCount: 1,
          loyaltyPoints: 10,
          lastVisitAt: new Date(),
        },
        update: {
          name: data.customerName.trim(),
          ...(data.email?.trim() ? { email: data.email.trim() } : {}),
          visitCount: { increment: 1 },
          loyaltyPoints: { increment: 10 },
          lastVisitAt: new Date(),
        },
      });
    } catch (crmErr) {
      console.warn("[CRM Sync] Errore sync cliente:", crmErr);
    }

    revalidatePath("/dashboard/asporto");
    revalidatePath("/dashboard/clienti");
    revalidatePath("/cucina");
    revalidatePath("/dashboard/cucina");
    revalidatePath("/prenotazione");

    return {
      success: true,
      order: {
        id: order.id,
        customerName: order.customerName,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        itemsSummary: order.itemsSummary,
        totalAmount: order.totalAmount,
      },
    };
  } catch (error) {
    console.error("Errore creazione ordine asporto pubblico:", error);
    return { success: false, error: "Impossibile completare l'ordine di asporto" };
  }
}







// ─────────────────────────────────────────────────────────────
// STAFF & CAMERIERI ACTIONS (Issue #16)
// ─────────────────────────────────────────────────────────────

export interface StaffMemberInput {
  id?: string;
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
  color?: string;
  pin?: string | null;
  assignedAreas?: string[] | null;
  serviceShifts?: string[] | null;
  isActive?: boolean;
  notes?: string | null;
}

export async function createOrUpdateStaffMemberAction(input: StaffMemberInput) {
  try {
    if (!input.name || input.name.trim().length === 0) {
      return { success: false, error: "Il nome del membro dello staff è obbligatorio" };
    }

    const assignedAreasJson = input.assignedAreas ? JSON.stringify(input.assignedAreas) : null;
    const serviceShiftsJson = input.serviceShifts ? JSON.stringify(input.serviceShifts) : null;

    if (input.id) {
      const updated = await prisma.staffMember.update({
        where: { id: input.id },
        data: {
          name: input.name.trim(),
          role: input.role || "CAMERIERE",
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          color: input.color || "#10b981",
          pin: input.pin?.trim() || null,
          assignedAreas: assignedAreasJson,
          serviceShifts: serviceShiftsJson,
          isActive: input.isActive !== undefined ? input.isActive : true,
          notes: input.notes?.trim() || null,
        },
      });
      revalidatePath("/dashboard/staff");
      return { success: true, staff: updated };
    } else {
      const created = await prisma.staffMember.create({
        data: {
          name: input.name.trim(),
          role: input.role || "CAMERIERE",
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          color: input.color || "#10b981",
          pin: input.pin?.trim() || null,
          assignedAreas: assignedAreasJson,
          serviceShifts: serviceShiftsJson,
          isActive: input.isActive !== undefined ? input.isActive : true,
          notes: input.notes?.trim() || null,
        },
      });
      revalidatePath("/dashboard/staff");
      return { success: true, staff: created };
    }
  } catch (error: any) {
    console.error("Errore salvataggio membro staff:", error);
    return { success: false, error: error.message || "Errore salvataggio membro staff" };
  }
}

export async function toggleStaffActiveAction(id: string, isActive: boolean) {
  try {
    const updated = await prisma.staffMember.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/dashboard/staff");
    return { success: true, staff: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Errore aggiornamento stato staff" };
  }
}

export async function deleteStaffMemberAction(id: string) {
  try {
    await prisma.staffMember.delete({
      where: { id },
    });
    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Errore eliminazione membro staff" };
  }
}

export async function verifyStaffPinAction(pin: string) {
  try {
    if (!pin || pin.trim().length === 0) {
      return { success: false, error: "PIN non valido" };
    }
    const member = await prisma.staffMember.findFirst({
      where: { pin: pin.trim(), isActive: true },
    });
    if (!member) {
      return { success: false, error: "Nessun membro staff attivo corrispondente al PIN inserito" };
    }
    return {
      success: true,
      staff: {
        id: member.id,
        name: member.name,
        role: member.role,
        color: member.color,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Errore verifica PIN" };
  }
}


// ─────────────────────────────────────────────────────────────
// STAMPANTE TERMICA COMANDE ESC/POS (Issue #22)
// ─────────────────────────────────────────────────────────────

import {
  PrinterConfig,
  DEFAULT_PRINTER_CONFIG,
  buildEscPosBuffer,
  EscPosTicketData,
  EscPosOrderItem,
} from "@/lib/escpos";
import { sendEscPosToNetworkPrinter } from "@/lib/escpos-network.server";

export async function getPrinterConfigAction(): Promise<PrinterConfig> {
  try {
    const rawSetting = await prisma.localSetting.findUnique({
      where: { key: "thermal_printer_config" },
    });
    if (!rawSetting) return DEFAULT_PRINTER_CONFIG;
    return { ...DEFAULT_PRINTER_CONFIG, ...JSON.parse(rawSetting.value) };
  } catch {
    return DEFAULT_PRINTER_CONFIG;
  }
}

export async function savePrinterConfigAction(config: PrinterConfig) {
  try {
    await prisma.localSetting.upsert({
      where: { key: "thermal_printer_config" },
      create: {
        key: "thermal_printer_config",
        value: JSON.stringify(config),
      },
      update: {
        value: JSON.stringify(config),
      },
    });
    revalidatePath("/dashboard/impostazioni");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Errore salvataggio configurazione stampante" };
  }
}

export async function testPrintEscPosAction(overrideConfig?: Partial<PrinterConfig>): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const currentConfig = await getPrinterConfigAction();
    const config = { ...currentConfig, ...overrideConfig };

    if (!config.ip || config.ip.trim() === "") {
      return { success: false, error: "Inserisci l'indirizzo IP della stampante (es. 192.168.1.200)" };
    }

    const restSetting = await prisma.localSetting.findUnique({ where: { key: "restaurant_name" } });
    const restaurantName = restSetting?.value || "Tavoly Restaurant";

    const testTicket: EscPosTicketData = {
      orderType: "TAVOLO",
      title: "PROVA STAMPANTE OK",
      subtitle: "Tavoly ESC/POS Bridge - Test di Rete",
      restaurantName: restaurantName || "TAVOLY RESTAURANT",
      items: [
        { name: "Margherita Tradizionale", quantity: 2, category: "Pizze", notes: "Extra Basilico" },
        { name: "Tagliata di Manzo al Rosmarino", quantity: 1, category: "Secondi", notes: "Cottura Media" },
        { name: "Bottiglia Acqua Naturale 0.75L", quantity: 1, category: "Bevande" },
      ],
      notes: "Stampa di collaudo hardware. Taglierina e allineamento verificati.",
      timestamp: new Date(),
    };

    const buffer = buildEscPosBuffer(testTicket, config.paperWidth, config.buzzer);
    const result = await sendEscPosToNetworkPrinter(config.ip, config.port || 9100, buffer);

    return result;
  } catch (error: any) {
    return { success: false, error: error.message || "Errore invio stampa di test" };
  }
}

export async function printTableOrderEscPosAction(tableOrderId: string) {
  try {
    const [order, config, tenantConfig] = await Promise.all([
      prisma.tableOrder.findUnique({ where: { id: tableOrderId } }),
      getPrinterConfigAction(),
      prisma.localSetting.findUnique({ where: { key: "restaurant_name" } }),
    ]);

    if (!order) return { success: false, error: "Comanda tavolo non trovata" };

    let items: EscPosOrderItem[] = [];
    try {
      const parsed = JSON.parse(order.itemsJson);
      if (Array.isArray(parsed)) {
        items = parsed.map((item: any) => ({
          name: item.name,
          quantity: item.quantity || 1,
          category: item.category,
          price: item.price,
          variants: item.variants,
          notes: item.notes,
        }));
      }
    } catch {}

    const ticketData: EscPosTicketData = {
      orderType: "TAVOLO",
      title: `TAVOLO ${order.tableNumber}`,
      subtitle: order.waiterName ? `Cameriere: ${order.waiterName}` : undefined,
      coverCount: order.coverCount,
      restaurantName: tenantConfig?.value || "Tavoly Restaurant",
      notes: order.notes,
      items,
      timestamp: order.createdAt,
    };

    const buffer = buildEscPosBuffer(ticketData, config.paperWidth, config.buzzer);

    if (config.enabled && config.ip) {
      const res = await sendEscPosToNetworkPrinter(config.ip, config.port || 9100, buffer);
      return { ...res, ticketData };
    }

    return {
      success: true,
      message: "Comanda tavolo formattata con successo",
      ticketData,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Errore stampa comanda tavolo" };
  }
}

export async function printTakeawayOrderEscPosAction(takeawayOrderId: string) {
  try {
    const [order, config, tenantConfig] = await Promise.all([
      prisma.takeawayOrder.findUnique({ where: { id: takeawayOrderId } }),
      getPrinterConfigAction(),
      prisma.localSetting.findUnique({ where: { key: "restaurant_name" } }),
    ]);

    if (!order) return { success: false, error: "Ordine asporto non trovato" };

    let items: EscPosOrderItem[] = [];
    if (order.itemsJson) {
      try {
        const parsed = JSON.parse(order.itemsJson);
        if (Array.isArray(parsed)) {
          items = parsed.map((item: any) => ({
            name: item.name,
            quantity: item.quantity || 1,
            category: item.category,
            price: item.price,
            notes: item.notes,
          }));
        }
      } catch {}
    }

    if (items.length === 0 && order.itemsSummary) {
      items = order.itemsSummary.split(",").map((s: string) => ({
        name: s.trim(),
        quantity: 1,
      }));
    }

    const ticketData: EscPosTicketData = {
      orderType: "ASPORTO",
      title: `ASPORTO - ${order.customerName}`,
      subtitle: `Ritiro: ${order.pickupDate || "Oggi"} ore ${order.pickupTime}`,
      customerPhone: order.phoneNumber,
      timeSlot: order.pickupTime,
      restaurantName: tenantConfig?.value || "Tavoly Restaurant",
      notes: order.notes,
      items,
      timestamp: order.createdAt,
    };

    const buffer = buildEscPosBuffer(ticketData, config.paperWidth, config.buzzer);

    if (config.enabled && config.ip) {
      const res = await sendEscPosToNetworkPrinter(config.ip, config.port || 9100, buffer);
      return { ...res, ticketData };
    }

    return {
      success: true,
      message: "Comanda asporto formattata con successo",
      ticketData,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Errore stampa comanda asporto" };
  }
}
