import { cookies } from "next/headers";

const STAFF_COOKIE_NAME = "tavoly_staff_session";
const DEFAULT_STAFF_PIN =
  process.env.STAFF_PIN ||
  process.env.ADMIN_PIN ||
  process.env.INITIAL_ADMIN_PIN ||
  process.env.INITIAL_ADMIN_PASSWORD ||
  "1234";

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
}

export function verifyStaffPin(inputPin: string): boolean {
  return inputPin.trim() === DEFAULT_STAFF_PIN;
}
