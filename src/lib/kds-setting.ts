import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Recupera lo stato di attivazione del monitor cucina KDS.
 * Controlla prima il cookie di sessione (affidabile e immediato anche in ambienti serverless multi-istanza come Vercel),
 * e fa fallback su LocalSetting nel database SQLite.
 */
export async function getIsKdsEnabled(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get("kds_enabled")?.value;
    if (cookieVal !== undefined && cookieVal !== "") {
      return cookieVal === "true";
    }
  } catch {
    // In contesti dove cookies() non è disponibile
  }

  try {
    const setting = await prisma.localSetting.findUnique({
      where: { key: "kds_enabled" },
    });
    return setting ? setting.value === "true" : false;
  } catch (error) {
    console.error("Errore lettura kds_enabled da DB:", error);
    return false;
  }
}

/**
 * Salva lo stato del KDS sia nei cookie di navigazione che nella tabella LocalSetting di SQLite.
 */
export async function setIsKdsEnabled(enabled: boolean): Promise<boolean> {
  const valStr = enabled ? "true" : "false";

  // 1. Salva nel cookie Next.js (valido 1 anno)
  try {
    const cookieStore = await cookies();
    cookieStore.set("kds_enabled", valStr, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } catch (err) {
    // Ignora se chiamato fuori dal contesto di richiesta/azione
  }

  // 2. Salva nel database SQLite
  try {
    await prisma.localSetting.upsert({
      where: { key: "kds_enabled" },
      create: { key: "kds_enabled", value: valStr },
      update: { value: valStr },
    });
  } catch (err) {
    console.error("Errore salvataggio kds_enabled in LocalSetting:", err);
  }

  return enabled;
}
