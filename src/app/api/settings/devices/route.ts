import { NextRequest, NextResponse } from "next/server";
import { listRegisteredDevices, revokeDevice, deleteDevice } from "@/lib/device-auth";

export async function GET() {
  try {
    const result = await listRegisteredDevices();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/settings/devices error:", error);
    return NextResponse.json(
      { error: "Errore durante il caricamento dei dispositivi" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("id");
    const hardDelete = searchParams.get("permanent") === "true";

    if (!deviceId) {
      return NextResponse.json({ error: "ID dispositivo mancante" }, { status: 400 });
    }

    const result = hardDelete ? await deleteDevice(deviceId) : await revokeDevice(deviceId);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: (result as any).status || 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/settings/devices error:", error);
    return NextResponse.json(
      { error: "Errore durante la revoca remota del dispositivo" },
      { status: 500 }
    );
  }
}
