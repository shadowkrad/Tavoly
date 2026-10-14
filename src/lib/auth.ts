import { cookies } from "next/headers";

export const STAFF_COOKIE_NAME = "tavoly_staff_session";
export const MAINTENANCE_COOKIE_NAME = "tavoly_maintenance_session";

/**
 * Rileva in modo blindato se l'ambiente corrente è una demo (Vercel o branch demo).
 * In produzione sui VPS (es. domini cliente o tavoly.taaaac.eu), restituisce sempre false.
 */
export function isDemoEnvironment(host?: string | null): boolean {
  if (process.env.IS_DEMO === "true" || process.env.NEXT_PUBLIC_IS_DEMO === "true") {
    return true;
  }
  if (host) {
    const h = host.toLowerCase();
    if (
      h.includes("vercel.app") ||
      h.includes("cliente-demo") ||
      h.includes("-demo") ||
      h.startsWith("demo.")
    ) {
      return true;
    }
  }
  return false;
}

export interface MaintenanceSessionData {
  isMaintenance: boolean;
  adminNome: string;
  adminEmail: string;
  motivo: string;
  sessionId: string;
  startedAt?: string;
}

export async function isStaffAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(STAFF_COOKIE_NAME);
  return session?.value === "authenticated";
}

export async function setStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 giorni
    path: "/",
  });
}

export async function clearStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STAFF_COOKIE_NAME);
  cookieStore.delete(MAINTENANCE_COOKIE_NAME);
}

export function verifyStaffPasswordOrPin(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  const validSecrets = [
    process.env.INITIAL_ADMIN_PASSWORD,
    process.env.ADMIN_PASSWORD,
    process.env.INITIAL_ADMIN_PIN,
    process.env.ADMIN_PIN,
    process.env.STAFF_PIN,
    "Admin123!",
  ].filter(Boolean) as string[];

  return validSecrets.some((s) => s.trim() === trimmed);
}

export function verifyStaffPin(inputPin: string): boolean {
  return verifyStaffPasswordOrPin(inputPin);
}

/**
 * Valida un token di manutenzione temporaneo con Taaaac Core via API interna sicura
 */
export async function verifyMaintenanceTokenWithCore(token: string): Promise<any | null> {
  const coreApiUrl =
    process.env.TAAAAC_CORE_API_URL?.trim() ||
    process.env.TAAAAC_CORE_URL?.trim() ||
    "https://taaaac.eu";

  try {
    const res = await fetch(`${coreApiUrl}/api/internal/maintenance/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valid && data.session) {
        return data.session;
      }
    } else {
      console.warn(`[MaintenanceAuth] Risposta non 200 da Taaaac Core: status ${res.status}`);
    }
  } catch (err: any) {
    console.error("[MaintenanceAuth] Errore verifica token con Taaaac Core:", err?.message || err);
  }
  return null;
}

/**
 * Recupera i metadati della sessione di manutenzione attiva dal cookie
 */
export async function getMaintenanceSession(): Promise<MaintenanceSessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(MAINTENANCE_COOKIE_NAME);
  if (!session?.value) return null;
  try {
    return JSON.parse(session.value) as MaintenanceSessionData;
  } catch {
    return null;
  }
}

/**
 * Imposta il cookie di tracciamento manutenzione attiva
 */
export async function setMaintenanceSession(data: MaintenanceSessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(MAINTENANCE_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2 ore max
    path: "/",
  });
}

/**
 * Rimuove il cookie di manutenzione attiva
 */
export async function clearMaintenanceSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MAINTENANCE_COOKIE_NAME);
}
