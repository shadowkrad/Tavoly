import { NextRequest, NextResponse } from "next/server";
import { setStaffSession, verifyStaffPasswordOrPin, isDemoEnvironment } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkBruteForce,
  recordFailedAttempt,
  resetBruteForceAttempts,
  logAccessAttempt,
  getClientIp,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const body = await req.json().catch(() => ({}));
    const host = req.headers.get("host") || "";
    const userAgent = req.headers.get("user-agent");

    // 1. Honey-pot invisibile anti-bot
    if (body.botField) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 400 });
    }

    // 2. Accesso 1-Click per ambiente Demo (Vercel)
    if (body.demo) {
      if (!isDemoEnvironment(host)) {
        return NextResponse.json(
          { error: "Accesso demo non consentito in questo ambiente" },
          { status: 403 }
        );
      }
      await setStaffSession();
      return NextResponse.json({ success: true, isDemo: true, role: "ADMIN" });
    }

    // 3. Controllo Anti-Brute-Force
    const bf = checkBruteForce(ip, "admin");
    if (!bf.allowed) {
      return NextResponse.json(
        {
          error: `Troppi tentativi falliti. Riprova tra ${Math.ceil(bf.retryAfterSeconds / 60)} minuti.`,
          locked: true,
          retryAfter: bf.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 4. Controllo stato blocco temporaneo tenant
    const tenantCache = await prisma.tenantLocalCache.findUnique({
      where: { id: "singleton" },
    });

    if (tenantCache?.lockedUntil && new Date() < tenantCache.lockedUntil) {
      const diffSec = Math.ceil((tenantCache.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: `Accesso temporaneamente sospeso per sicurezza. Riprova tra ${Math.ceil(diffSec / 60)} minuti.`,
          locked: true,
          retryAfter: diffSec,
        },
        { status: 429 }
      );
    }

    let authSuccess = false;
    let authRole = "ADMIN";
    let operatorName = "Titolare";

    // ── MODALITÀ A: ACCESSO TITOLARE CON EMAIL + PASSWORD ──
    if (body.email && body.password) {
      const cleanEmail = String(body.email).trim().toLowerCase();
      const rawPassword = String(body.password);
      const coreApiUrl = process.env.TAAAAC_CORE_API_URL?.trim() || "https://taaaac.eu";
      const tenantDomain = process.env.TAAAAC_TENANT_DOMAIN || host;
      const subdomain = tenantDomain ? tenantDomain.split(".")[0].toLowerCase() : null;

      // 1. Verifica centralizzata su Taaaac Core
      try {
        const coreRes = await fetch(`${coreApiUrl}/api/internal/auth/verify-tenant-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password: rawPassword,
            subdomain,
          }),
        });

        if (coreRes.ok) {
          const coreData = await coreRes.json();
          if (coreData.valid) {
            authSuccess = true;
            authRole = "ADMIN";
            operatorName = coreData.user?.nome || "Titolare";
          }
        }
      } catch (coreErr) {
        console.warn("Verifica con Taaaac Core non disponibile, applico fallback locale:", coreErr);
      }

      // 2. Fallback locale / env (se offline o credenziali di inizializzazione)
      if (!authSuccess) {
        const initialEmail = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
        const initialPass = process.env.INITIAL_ADMIN_PASSWORD?.trim();
        const adminPass = process.env.ADMIN_PASSWORD?.trim();

        if (
          (initialEmail && cleanEmail === initialEmail && (rawPassword === initialPass || rawPassword === adminPass)) ||
          verifyStaffPasswordOrPin(rawPassword)
        ) {
          authSuccess = true;
          authRole = "ADMIN";
        }
      }

      if (!authSuccess) {
        const fail = recordFailedAttempt(ip, "admin");
        await logAccessAttempt({
          esito: "FAILED_PASSWORD",
          ip,
          userAgent,
          dettaglio: `Tentativo errato per email: ${cleanEmail}`,
        });
        return NextResponse.json(
          { error: "Email o password errati. Verifica le credenziali ricevute via email.", locked: fail.locked },
          { status: 401 }
        );
      }
    }
    // ── MODALITÀ B: ACCESSO COLLABORATORE SALA CON PIN RAPIDO ──
    else if (body.pin) {
      const cleanPin = String(body.pin).trim();

      // Cerca collaboratore attivo con questo PIN nel database locale del ristorante
      const staffMember = await prisma.staffMember.findFirst({
        where: {
          pin: cleanPin,
          isActive: true,
        },
      });

      const masterPin = process.env.INITIAL_ADMIN_PIN || process.env.ADMIN_PIN || process.env.STAFF_PIN;

      if (staffMember) {
        authSuccess = true;
        authRole = staffMember.role || "CAMERIERE";
        operatorName = staffMember.name;
      } else if (masterPin && cleanPin === masterPin.trim()) {
        authSuccess = true;
        authRole = "ADMIN";
        operatorName = "Postazione Sala";
      } else {
        const fail = recordFailedAttempt(ip, "admin");
        await logAccessAttempt({
          esito: "FAILED_PASSWORD",
          ip,
          userAgent,
          dettaglio: "PIN collaboratore non riconosciuto",
        });
        return NextResponse.json(
          { error: "PIN non valido o collaboratore non attivo.", locked: fail.locked },
          { status: 401 }
        );
      }
    }
    // ── MODALITÀ C: COMPATIBILITÀ RETROATTIVA (SOLO PASSWORD MASTER) ──
    else if (body.password) {
      if (verifyStaffPasswordOrPin(body.password)) {
        authSuccess = true;
        authRole = "ADMIN";
      } else {
        const fail = recordFailedAttempt(ip, "admin");
        return NextResponse.json(
          { error: "Password non valida.", locked: fail.locked },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Inserisci email e password per il titolare, oppure il PIN collaboratore." },
        { status: 400 }
      );
    }

    // Accesso autorizzato con successo!
    resetBruteForceAttempts(ip, "admin");

    if (tenantCache && (tenantCache.failedLoginAttempts > 0 || tenantCache.lockedUntil)) {
      await prisma.tenantLocalCache.update({
        where: { id: "singleton" },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    await logAccessAttempt({
      esito: "SUCCESS",
      ip,
      userAgent,
      dettaglio: `Accesso autorizzato per ${operatorName} (${authRole})`,
    });

    await setStaffSession();

    return NextResponse.json({
      success: true,
      role: authRole,
      operatorName,
    });
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json(
      { error: "Errore durante l'autenticazione" },
      { status: 500 }
    );
  }
}
