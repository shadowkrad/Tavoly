import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { parseShowcaseConfig } from "@/lib/showcase-defaults";

export const dynamic = "force-dynamic";

function decodificaDataUri(src: string): { buffer: Buffer; contentType: string } | null {
  if (!src.startsWith("data:")) return null;
  const commaIdx = src.indexOf(",");
  if (commaIdx === -1) return null;
  const meta = src.slice(0, commaIdx);
  const dataPart = src.slice(commaIdx + 1);
  const mimeMatch = meta.match(/^data:([^;,]+)/i);
  const contentType = mimeMatch ? mimeMatch[1] : "image/png";
  const buffer = meta.includes(";base64")
    ? Buffer.from(dataPart, "base64")
    : Buffer.from(decodeURIComponent(dataPart), "utf8");
  return { buffer, contentType };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot") || "";
  const id = searchParams.get("id") || "";
  const hasVersion = Boolean(searchParams.get("v")?.trim());

  let rawSrc: string | null = null;

  try {
    if (slot === "dish" && id) {
      const dish = await prisma.menuItem.findUnique({
        where: { id },
        select: { imageUrl: true },
      });
      rawSrc = dish?.imageUrl || null;
    } else if (slot === "logo") {
      const settings = await prisma.localSetting.findMany({
        where: { key: { in: ["brand_logo_url", "showcase_config", "tenant_config_cache"] } },
      });
      const map: Record<string, string> = {};
      for (const s of settings) map[s.key] = s.value;

      if (map["brand_logo_url"]?.trim()) {
        rawSrc = map["brand_logo_url"].trim();
      } else if (map["showcase_config"]) {
        const sc = parseShowcaseConfig(map["showcase_config"]);
        rawSrc = sc.logoUrl || null;
      }
      if (!rawSrc && map["tenant_config_cache"]) {
        try {
          const cached = JSON.parse(map["tenant_config_cache"]);
          rawSrc = cached?.theme?.logoUrl || null;
        } catch {
          // ignora
        }
      }
    } else if (slot === "hero" || slot === "gallery" || slot === "map") {
      const row = await prisma.localSetting.findUnique({
        where: { key: "showcase_config" },
      });
      const showcase = parseShowcaseConfig(row?.value);
      if (slot === "hero") {
        rawSrc = showcase.hero?.coverImageUrl || null;
      } else if (slot === "map") {
        rawSrc = showcase.contactInfo?.mapEmbed || null;
      } else if (slot === "gallery") {
        const images = showcase.gallery?.images || [];
        const match = images.find((img) => img.id === id) || images[Number(id)] || null;
        rawSrc = match?.url || null;
      }
    }
  } catch {
    rawSrc = null;
  }

  if (!rawSrc || !rawSrc.trim()) {
    return new NextResponse(null, { status: 404 });
  }

  const trimmed = rawSrc.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return NextResponse.redirect(trimmed, 307);
  }

  const decoded = decodificaDataUri(trimmed);
  if (!decoded) {
    return new NextResponse(null, { status: 404 });
  }

  const etag = `"${crypto.createHash("sha1").update(decoded.buffer).digest("hex").slice(0, 16)}"`;
  if (!hasVersion && request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": "no-cache",
      },
    });
  }

  return new NextResponse(new Uint8Array(decoded.buffer), {
    status: 200,
    headers: {
      "Content-Type": decoded.contentType,
      "Cache-Control": hasVersion ? "public, max-age=31536000, immutable" : "no-cache",
      ETag: etag,
    },
  });
}
