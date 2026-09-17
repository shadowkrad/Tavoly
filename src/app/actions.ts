"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTableStatus(tableId: string, status: string) {
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { status },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento stato tavolo:", error);
    return { success: false, error: "Impossibile aggiornare lo stato del tavolo" };
  }
}

export async function updateReservationStatus(reservationId: string, status: string) {
  try {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { status },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore aggiornamento prenotazione:", error);
    return { success: false, error: "Impossibile aggiornare la prenotazione" };
  }
}

export async function createReservation(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const email = (formData.get("email") as string) || null;
  const guestCount = parseInt((formData.get("guestCount") as string) || "2", 10);
  const timeSlot = formData.get("timeSlot") as string;
  const notes = (formData.get("notes") as string) || null;
  const tableId = (formData.get("tableId") as string) || null;

  if (!customerName || !phoneNumber || !timeSlot) {
    return { success: false, error: "Campi obbligatori mancanti" };
  }

  try {
    await prisma.reservation.create({
      data: {
        customerName,
        phoneNumber,
        email,
        guestCount,
        timeSlot,
        notes,
        tableId: tableId === "" ? null : tableId,
        status: "CONFERMATA",
        whatsappSent: true,
      },
    });

    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: "PRENOTATO" },
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Errore creazione prenotazione:", error);
    return { success: false, error: "Impossibile creare la prenotazione" };
  }
}
