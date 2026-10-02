import { NextRequest, NextResponse } from "next/server";
import { getDeviceRegistrationOptions } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const result = await getDeviceRegistrationOptions(req);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.options);
  } catch (error: any) {
    console.error("POST /api/auth/device/register-options error:", error);
    return NextResponse.json(
      { error: "Errore durante l'inizializzazione della registrazione del dispositivo" },
      { status: 500 }
    );
  }
}
