import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  dbInitPromise: Promise<void> | undefined;
};

function getDatabaseUrl(): string {
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "tavoly.db");
    const templatePath = path.join(process.cwd(), "prisma", "template.db");
    const devDbPath = path.join(process.cwd(), "prisma", "dev.db");
    // Sulla demo (ramo cliente-demo) c'e' prisma/demo.db con clienti, punti e buoni di prova: ha la precedenza
    const demoPath = path.join(process.cwd(), "prisma", "demo.db");
    const sourcePath = fs.existsSync(demoPath) ? demoPath : fs.existsSync(templatePath) ? templatePath : devDbPath;

    let shouldCopy = !fs.existsSync(tmpDbPath);
    if (!shouldCopy && fs.existsSync(sourcePath)) {
      try {
        const srcStat = fs.statSync(sourcePath);
        const tmpStat = fs.statSync(tmpDbPath);
        if (srcStat.mtimeMs > tmpStat.mtimeMs || srcStat.size !== tmpStat.size) {
          shouldCopy = true;
        }
      } catch {
        shouldCopy = true;
      }
    }

    if (shouldCopy && fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, tmpDbPath);
        console.log("[Vercel SQLite] Inizializzato/aggiornato database SQLite in /tmp/tavoly.db");
      } catch (err) {
        console.error("[Vercel SQLite] Errore copia template.db in /tmp:", err);
      }
    }

    const resolvedUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = resolvedUrl;
    return resolvedUrl;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function ensureDatabase(): Promise<void> {
  if (globalForPrisma.dbInitPromise) {
    return globalForPrisma.dbInitPromise;
  }

  globalForPrisma.dbInitPromise = (async () => {
    const addColumnIfNotExists = async (table: string, column: string, definition: string) => {
      try {
        const info = (await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}");`)) as Array<{ name: string }>;
        const exists = Array.isArray(info) && info.some((col) => col.name.toLowerCase() === column.toLowerCase());
        if (!exists) {
          await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition};`);
        }
      } catch {
        // Ignora se la tabella o colonna è già allineata
      }
    };

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "EccezioneCalendario" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "data" TEXT NOT NULL UNIQUE,
          "titolo" TEXT NOT NULL,
          "tipo" TEXT NOT NULL DEFAULT 'CHIUSURA',
          "isAperto" BOOLEAN NOT NULL DEFAULT 0,
          "orarioApertura" TEXT,
          "orarioChiusura" TEXT,
          "pausaInizio" TEXT,
          "pausaFine" TEXT,
          "note" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StaffMember" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'CAMERIERE',
          "phone" TEXT,
          "email" TEXT,
          "color" TEXT NOT NULL DEFAULT '#10b981',
          "pin" TEXT,
          "assignedAreas" TEXT,
          "serviceShifts" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT 1,
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Fidelity e buoni (1.1.2): colonne e tabelle nel database dell'attivita'
      await addColumnIfNotExists("CustomerProfile", "marketingConsent", "BOOLEAN NOT NULL DEFAULT 0");
      await addColumnIfNotExists("CustomerProfile", "birthDate", "DATETIME");
      await addColumnIfNotExists("CustomerProfile", "loyaltyToken", "TEXT");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MovimentoPunti" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "clienteId" TEXT NOT NULL,
          "punti" INTEGER NOT NULL,
          "tipo" TEXT NOT NULL DEFAULT 'ACCREDITO',
          "origine" TEXT,
          "descrizione" TEXT,
          "importo" REAL,
          "appuntamentoId" TEXT,
          "premioId" TEXT,
          "saldoDopo" INTEGER,
          "operatore" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MovimentoPunti_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "CustomerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GiftCard" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "codice" TEXT NOT NULL,
          "importoIniziale" REAL NOT NULL,
          "saldoResiduo" REAL NOT NULL,
          "acquirenteNome" TEXT NOT NULL,
          "acquirenteEmail" TEXT,
          "acquirenteTelefono" TEXT,
          "beneficiarioNome" TEXT NOT NULL,
          "beneficiarioMessaggio" TEXT,
          "dataScadenza" DATETIME,
          "stato" TEXT NOT NULL DEFAULT 'ATTIVA',
          "motivo" TEXT NOT NULL DEFAULT 'REGALO',
          "tipoValore" TEXT NOT NULL DEFAULT 'IMPORTO',
          "percentuale" REAL,
          "descrizioneServizio" TEXT,
          "clienteId" TEXT,
          "spesaMinima" REAL,
          "usoParziale" BOOLEAN NOT NULL DEFAULT 1,
          "note" TEXT,
          "tokenPubblico" TEXT,
          "creatoDa" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MovimentoGiftCard" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "giftCardId" TEXT NOT NULL,
          "importo" REAL NOT NULL,
          "tipo" TEXT,
          "saldoDopo" REAL,
          "operatore" TEXT,
          "note" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "MovimentoGiftCard_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "GiftCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      for (const sql of [
        `CREATE UNIQUE INDEX IF NOT EXISTS "CustomerProfile_loyaltyToken_key" ON "CustomerProfile"("loyaltyToken")`,
        `CREATE INDEX IF NOT EXISTS "MovimentoPunti_clienteId_idx" ON "MovimentoPunti"("clienteId")`,
        `CREATE INDEX IF NOT EXISTS "MovimentoPunti_appuntamentoId_idx" ON "MovimentoPunti"("appuntamentoId")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_codice_key" ON "GiftCard"("codice")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "GiftCard_tokenPubblico_key" ON "GiftCard"("tokenPubblico")`,
        `CREATE INDEX IF NOT EXISTS "GiftCard_stato_idx" ON "GiftCard"("stato")`,
        `CREATE INDEX IF NOT EXISTS "GiftCard_clienteId_idx" ON "GiftCard"("clienteId")`,
        `CREATE INDEX IF NOT EXISTS "MovimentoGiftCard_giftCardId_idx" ON "MovimentoGiftCard"("giftCardId")`,
      ]) {
        await prisma.$executeRawUnsafe(sql).catch(() => {});
      }
      await addColumnIfNotExists("TableOrder", "paymentStatus", "TEXT NOT NULL DEFAULT 'DA_PAGARE'");
      await addColumnIfNotExists("TableOrder", "paymentMethod", "TEXT");
      await addColumnIfNotExists("TableOrder", "paidAt", "DATETIME");
      await addColumnIfNotExists("TableOrder", "customerName", "TEXT");
      await addColumnIfNotExists("TableOrder", "customerPhone", "TEXT");
      await addColumnIfNotExists("TableOrder", "reservationId", "TEXT");
      await addColumnIfNotExists("TenantLocalCache", "rispettaFestivitaNazionali", "BOOLEAN NOT NULL DEFAULT 1");
    } catch {
      // Ignora errori minori di auto-migrazione
    }
  })();

  return globalForPrisma.dbInitPromise;
}

ensureDatabase().catch(() => {});
