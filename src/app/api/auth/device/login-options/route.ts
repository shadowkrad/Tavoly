import { NextRequest, NextResponse } from "next/server";
import { getDeviceLoginOptions } from "@/lib/device-auth";

export async function POST(req: NextRequest) {
  try {
    const result = await getDeviceLoginOptions(req);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.options);
  } catch (error: any) {
    console.error("POST /api/auth/device/login-options error:", error);
    return NextResponse.json(
      { error: "Errore durante la preparazione del login biometrico" },
      { status: 500 }
    );
  }
}
