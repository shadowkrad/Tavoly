import { z } from "zod";

export const publicReservationSchema = z.object({
  customerName: z
    .string()
    .min(2, "Il nome deve contenere almeno 2 caratteri")
    .max(100, "Nome troppo lungo"),
  phoneNumber: z
    .string()
    .min(6, "Numero di telefono non valido")
    .max(25, "Numero di telefono troppo lungo")
    .regex(/^[+0-9\s\-()]+$/, "Formato numero di telefono non valido"),
  email: z
    .string()
    .email("Indirizzo email non valido")
    .optional()
    .or(z.literal("")),
  guestCount: z.coerce
    .number()
    .int()
    .min(1, "Minimo 1 ospite")
    .max(30, "Per prenotazioni oltre 30 persone vi invitiamo a contattarci telefonicamente"),
  date: z.string().min(1, "Seleziona una data"),
  timeSlot: z.string().min(1, "Seleziona un orario"),
  notes: z.string().max(500, "Le note non possono superare i 500 caratteri").optional(),
});

export const staffLoginSchema = z.object({
  pin: z
    .string()
    .min(4, "Il PIN deve contenere almeno 4 cifre")
    .max(10, "PIN troppo lungo")
    .regex(/^\d+$/, "Il PIN deve contenere solo numeri"),
});

export const tablePositionSchema = z.object({
  tableId: z.string().min(1),
  posX: z.number().min(0).max(100),
  posY: z.number().min(0).max(100),
});

export const createTableSchema = z.object({
  number: z.string().min(1, "Numero tavolo obbligatorio").max(10),
  capacity: z.coerce.number().int().min(1).max(30),
  shape: z.enum(["RECTANGLE", "ROUND", "BAR"]),
  areaId: z.string().min(1, "Seleziona un'area/sala"),
  posX: z.coerce.number().min(0).max(100).default(50),
  posY: z.coerce.number().min(0).max(100).default(50),
});

export const walkInSchema = z.object({
  tableId: z.string().min(1),
  guestCount: z.coerce.number().int().min(1).max(30),
  customerName: z.string().default("Cliente al Volo"),
});
