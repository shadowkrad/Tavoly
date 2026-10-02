import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStaffAuthenticated, setStaffSession } from "@/lib/auth";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

/**
 * Ottiene dinamicamente la configurazione Relying Party (RP) dall'header Host della richiesta
 */
export function getWebAuthnConfig(req?: Request | NextRequest) {
  let hostname = "tavoly.taaaac.eu";
  let origin = "https://tavoly.taaaac.eu";

  if (req) {
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const protoHeader =
      req.headers.get("x-forwarded-proto") ||
      (hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1") ? "http" : "https");

    if (hostHeader) {
      hostname = hostHeader.split(":")[0];
      origin = `${protoHeader}://${hostHeader}`;
    }
  } else if (process.env.NEXTAUTH_URL) {
    try {
      const u = new URL(process.env.NEXTAUTH_URL);
      hostname = u.hostname;
      origin = u.origin;
    } catch {}
  }

  return {
    rpName: "Tavoly Ristorazione",
    rpID: hostname,
    origin,
  };
}

/**
 * Salva una sfida monouso (Challenge) con scadenza
 */
async function saveChallenge(challenge: string, type: "registration" | "authentication") {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minuti di validità
  await prisma.webAuthnChallenge.upsert({
    where: { challenge },
    update: { expiresAt },
    create: {
      challenge,
      type,
      expiresAt,
    },
  });
}

/**
 * Verifica e consuma (elimina) una sfida per proteggere da replay attack
 */
async function consumeChallenge(challenge: string, type: "registration" | "authentication"): Promise<boolean> {
  const record = await prisma.webAuthnChallenge.findUnique({
    where: { challenge },
  });

  if (!record || record.type !== type || new Date() > record.expiresAt) {
    return false;
  }

  await prisma.webAuthnChallenge.delete({
    where: { challenge },
  }).catch(() => {});

  return true;
}

/**
 * Genera le opzioni per registrare un nuovo dispositivo hardware (FIDO2 / Biometria)
 */
export async function getDeviceRegistrationOptions(req: NextRequest) {
  const isAuth = await isStaffAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Accesso non autorizzato. Effettua prima l'accesso con PIN Staff.", status: 401 };
  }

  const existingDevices = await prisma.registeredDevice.findMany({
    select: { credentialId: true, transports: true },
  });

  const config = getWebAuthnConfig(req);

  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: "staff@tavoly.restaurant",
    userID: new TextEncoder().encode("tavoly-staff-user"),
    userDisplayName: "Staff Tavoly Ristorante",
    attestationType: "none",
    excludeCredentials: existingDevices.map((d) => ({
      id: d.credentialId,
      transports: JSON.parse(d.transports || "[]"),
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform", // sensore biometrico / sblocco nativo del dispositivo
    },
  });

  await saveChallenge(options.challenge, "registration");

  return { ok: true, options };
}

/**
 * Valida la registrazione del dispositivo e memorizza la chiave pubblica nel DB
 */
export async function verifyAndSaveDeviceRegistration(
  req: NextRequest,
  body: { response: any; deviceName?: string; deviceType?: string }
) {
  const isAuth = await isStaffAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Accesso non autorizzato", status: 401 };
  }

  const { response, deviceName, deviceType } = body;
  if (!response || !response.clientDataJSON) {
    return { ok: false, error: "Dati di registrazione biometrica mancanti", status: 400 };
  }

  const clientData = JSON.parse(Buffer.from(response.clientDataJSON, "base64url").toString("utf-8"));
  const challengeValid = await consumeChallenge(clientData.challenge, "registration");
  if (!challengeValid) {
    return { ok: false, error: "Challenge di registrazione scaduta o non valida", status: 400 };
  }

  const config = getWebAuthnConfig(req);

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: clientData.challenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "Verifica crittografica del dispositivo fallita", status: 400 };
  }

  const { credential, credentialDeviceType } = verification.registrationInfo;

  const credentialIdBase64 = credential.id;
  const publicKeyBase64 = Buffer.from(credential.publicKey).toString("base64url");
  const counter = credential.counter;

  const userAgent = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";

  // Determina nome amichevole del dispositivo
  let cleanName = (deviceName || "").trim();
  if (!cleanName) {
    if (userAgent.includes("iPhone")) cleanName = "Apple iPhone";
    else if (userAgent.includes("iPad")) cleanName = "Apple iPad Sala";
    else if (userAgent.includes("Android")) cleanName = "Palmare Android Cameriere";
    else cleanName = "Terminale Sala";
  }

  const device = await prisma.registeredDevice.upsert({
    where: { credentialId: credentialIdBase64 },
    update: {
      deviceName: cleanName,
      deviceType: deviceType || credentialDeviceType || "mobile",
      publicKey: publicKeyBase64,
      counter: BigInt(counter),
      transports: JSON.stringify(response.response?.transports || ["internal"]),
      status: "ACTIVE",
      userAgent,
      lastIp: ip,
    },
    create: {
      deviceName: cleanName,
      deviceType: deviceType || credentialDeviceType || "mobile",
      credentialId: credentialIdBase64,
      publicKey: publicKeyBase64,
      counter: BigInt(counter),
      transports: JSON.stringify(response.response?.transports || ["internal"]),
      status: "ACTIVE",
      userAgent,
      lastIp: ip,
    },
  });

  return {
    ok: true,
    message: "Dispositivo registrato con successo!",
    device: {
      id: device.id,
      deviceName: device.deviceName,
      status: device.status,
    },
  };
}

/**
 * Genera le opzioni per accedere tramite sensore biometrico o PIN del dispositivo
 */
export async function getDeviceLoginOptions(req: NextRequest) {
  const activeDevices = await prisma.registeredDevice.findMany({
    where: { status: "ACTIVE" },
    select: { credentialId: true, transports: true },
  });

  if (activeDevices.length === 0) {
    return {
      ok: false,
      error: "Nessun dispositivo autorizzato trovato. Accedi prima con il PIN Staff principale per configurarne uno.",
      status: 404,
    };
  }

  const config = getWebAuthnConfig(req);

  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    userVerification: "preferred",
    allowCredentials: activeDevices.map((d) => ({
      id: d.credentialId,
      transports: JSON.parse(d.transports || "[]"),
    })),
  });

  await saveChallenge(options.challenge, "authentication");

  return { ok: true, options };
}

/**
 * Valida la firma biometrica del dispositivo ed effettua il login
 */
export async function verifyDeviceLoginAndAuthenticate(req: NextRequest, body: { response: any }) {
  const { response } = body;
  if (!response?.id || !response?.response?.clientDataJSON) {
    return { ok: false, error: "Dati di autenticazione biometrica non validi", status: 400 };
  }

  const credentialId = response.id;

  // 1. Cerca il dispositivo registrato nel DB
  const device = await prisma.registeredDevice.findUnique({
    where: { credentialId },
  });

  // 2. CHECK DI SICUREZZA: se non trovato o REVOCATO dall'amministratore, nega immediatamente l'accesso!
  if (!device) {
    return {
      ok: false,
      error: "Dispositivo non riconosciuto. Accedi prima con PIN Staff.",
      status: 401,
    };
  }

  if (device.status !== "ACTIVE") {
    return {
      ok: false,
      error: "Questo dispositivo è stato SCOLLEGATO dall'amministratore. Effettua l'accesso principale con PIN Staff.",
      status: 403,
    };
  }

  const clientData = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf-8"));
  const challengeValid = await consumeChallenge(clientData.challenge, "authentication");
  if (!challengeValid) {
    return { ok: false, error: "Challenge di autenticazione scaduta. Riprova.", status: 400 };
  }

  const config = getWebAuthnConfig(req);

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: clientData.challenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
    credential: {
      id: device.credentialId,
      publicKey: Uint8Array.from(Buffer.from(device.publicKey, "base64url")),
      counter: Number(device.counter),
      transports: JSON.parse(device.transports || "[]"),
    },
  });

  if (!verification.verified) {
    return { ok: false, error: "Verifica firma biometrica non riuscita", status: 401 };
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "";

  // Aggiorna contatore e data ultimo utilizzo
  await prisma.registeredDevice.update({
    where: { id: device.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
      lastIp: ip,
    },
  });

  // Rilascia sessione staff
  await setStaffSession();

  return {
    ok: true,
    message: "Accesso autorizzato con successo!",
    device: {
      id: device.id,
      deviceName: device.deviceName,
    },
  };
}

/**
 * Restituisce la lista di tutti i dispositivi registrati (per il pannello Impostazioni)
 */
export async function listRegisteredDevices() {
  const isAuth = await isStaffAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }

  const devices = await prisma.registeredDevice.findMany({
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      status: true,
      createdAt: true,
      lastUsedAt: true,
      lastIp: true,
      userAgent: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return { ok: true, devices };
}

/**
 * SCOLLEGA / REVOCA un dispositivo da remoto
 */
export async function revokeDevice(deviceId: string) {
  const isAuth = await isStaffAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }

  const device = await prisma.registeredDevice.findUnique({
    where: { id: deviceId },
  });

  if (!device) {
    return { ok: false, error: "Dispositivo non trovato", status: 404 };
  }

  await prisma.registeredDevice.update({
    where: { id: deviceId },
    data: {
      status: "REVOKED",
    },
  });

  return {
    ok: true,
    message: `Dispositivo "${device.deviceName}" scollegato da remoto con successo!`,
  };
}

/**
 * Elimina definitivamente il dispositivo dal database
 */
export async function deleteDevice(deviceId: string) {
  const isAuth = await isStaffAuthenticated();
  if (!isAuth) {
    return { ok: false, error: "Non autorizzato", status: 401 };
  }

  await prisma.registeredDevice.delete({
    where: { id: deviceId },
  });

  return { ok: true, message: "Dispositivo rimosso definitivamente" };
}
