import { NextRequest, NextResponse } from "next/server";
import { verifyDeviceLoginAndAuthenticate } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await verifyDeviceLoginAndAuthenticate(req, body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/auth/device/login-verify error:", error);
    return NextResponse.json(
      { error: "Errore durante l'autenticazione biometrica del dispositivo" },
      { status: 500 }
    );
  }
}
