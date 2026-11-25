import { NextRequest, NextResponse } from "next/server";
import { isStaffAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

function urlsCore(): string[] {
  return [
    process.env.TAAAAC_INTERNAL_URL || "http://taaaac-core:3000",
    process.env.TAAAAC_CORE_URL || "https://admin.taaaac.eu",
  ];
}

function dominio(): string {
  if (process.env.TAAAAC_TENANT_DOMAIN) return process.env.TAAAAC_TENANT_DOMAIN;
  try {
    if (process.env.NEXT_PUBLIC_APP_URL) return new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
  } catch {}
  return "demo";
}

// Studio Grafico AI: il modulo non conosce la chiave Google, chiede lo sfondo al Core (solo settore, tema, formato).
export async function POST(req: NextRequest) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ ok: false, message: "Non autorizzato" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const payload = {
    tenantDomain: dominio(),
    settore: typeof body?.settore === "string" ? body.settore : "retail",
    tema: typeof body?.tema === "string" ? body.tema.slice(0, 120) : "",
    formato: ["1:1", "9:16", "3:4"].includes(body?.formato) ? body.formato : "1:1",
  };
  for (const base of urlsCore()) {
    try {
      const res = await fetch(`${base.replace(/\/$/, "")}/api/internal/creative/generate-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-taaaac-key": process.env.TAAAAC_INTERNAL_KEY || "taaaac-secret-mesh-key" },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(55000),
      });
      const data = await res.json().catch(() => null);
      if (data && typeof data === "object") return NextResponse.json(data);
    } catch {}
  }
  return NextResponse.json({ ok: false, code: "ERRORE", message: "Il servizio grafico non risponde, riprova tra poco." });
}
