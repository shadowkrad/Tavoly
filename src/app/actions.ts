"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendNotificationMail } from "@/lib/taaaac-mailer";
import { setStaffSession, clearStaffSession, verifyStaffPin } from "@/lib/auth";
import {
  publicReservationSchema,
  staffLoginSchema,
  tablePositionSchema,
  createTableSchema,
  walkInSchema,
} from "@/lib/validations";

// --- AUTH ACTIONS ---
export async function loginStaffAction(pin: string) {
  const result = staffLoginSchema.safeParse({ pin });
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message || "PIN non valido" };
  }

  if (!verifyStaffPin(result.data.pin)) {
    return { success: false, error: "PIN errato. Riprova." };
  }

  await setStaffSession();
  return { success: true };
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

// --- CUSTOMER PROFILE ACTIONS (Issue #9) ---
export async function updateCustomerNotesAction(phoneNumber: string, notes: string, loyaltyDelta: number = 0) {
  try {
    const updated = await prisma.customerProfile.update({
      where: { phoneNumber },
      data: {
        notes,
        ...(loyaltyDelta !== 0 ? { loyaltyPoints: { increment: loyaltyDelta } } : {}),
      },
    });
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
        orderIndex,
      },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");
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
      },
    });

    revalidatePath("/dashboard/menu");
    revalidatePath("/menu");
    return { success: true, item };
  } catch (error) {
    console.error("Errore modifica piatto:", error);
    return { success: false, error: "Impossibile modificare il piatto" };
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



