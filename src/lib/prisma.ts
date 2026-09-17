import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

function getDatabaseUrl(): string {
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "tavoly.db");
    if (!fs.existsSync(tmpDbPath)) {
      const templatePath = path.join(process.cwd(), "prisma", "template.db");
      if (fs.existsSync(templatePath)) {
        try {
          fs.copyFileSync(templatePath, tmpDbPath);
          console.log("[Vercel SQLite] Inizializzato database SQLite in /tmp/tavoly.db");
        } catch (err) {
          console.error("[Vercel SQLite] Errore copia template.db in /tmp:", err);
        }
      } else {
        console.warn("[Vercel SQLite] template.db non trovato in", templatePath);
      }
    }
    const resolvedUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = resolvedUrl;
    return resolvedUrl;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

const dbUrl = getDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
