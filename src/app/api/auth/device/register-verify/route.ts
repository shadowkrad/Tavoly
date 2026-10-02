import { NextRequest, NextResponse } from "next/server";
import { verifyAndSaveDeviceRegistration } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await verifyAndSaveDeviceRegistration(req, body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/auth/device/register-verify error:", error);
    return NextResponse.json(
      { error: "Errore durante il salvataggio del dispositivo" },
      { status: 500 }
    );
  }
}
