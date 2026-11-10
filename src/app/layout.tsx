import FloatingWhatsAppWidget from "@/components/public/FloatingWhatsAppWidget";
import type { Metadata } from "next";
import "./globals.css";
import { getTenantConfig } from "@/lib/taaaac-core";
import { calcolaHashIcona, pwaIconUrl } from "@/lib/pwa-icon-version";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getTenantConfig();
  const brand = config.theme.restaurantName || "Ristorante";
  const slogan = config.theme.tagline || "Prenotazione Tavoli & Menù";
  const v = calcolaHashIcona(config.theme.faviconUrl, config.theme.logoUrl);
  return {
    title: {
      default: `${brand} — ${slogan}`,
      template: `%s | ${brand}`,
    },
    description: `Prenotazione tavoli e menù online per ${brand}`,
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [
        { url: pwaIconUrl(32, v), sizes: "32x32", type: "image/png" },
        { url: pwaIconUrl(192, v), sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: pwaIconUrl(180, v), sizes: "180x180", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: brand,
    },
  };
}

export const viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantConfig = await getTenantConfig();
  const { theme } = tenantConfig;
  const v = calcolaHashIcona(theme.faviconUrl, theme.logoUrl);

  const hasWhatsAppModule =
    Array.isArray(tenantConfig.enabledModules) &&
    tenantConfig.enabledModules.some((m) => String(m).toUpperCase().includes("WHATSAPP"));

  const waPhone = tenantConfig.contact?.phone || tenantConfig.phone || "+39 0575 654321";

  const brandStyle = {
    "--brand-primary": theme.primaryColor || "#2563eb",
    "--brand-primary-hover": theme.primaryHover || "#1d4ed8",
    "--brand-accent": theme.accentColor || "#f97316",
  } as React.CSSProperties;

  // La tessera del cliente ha icona (logo) e manifest propri, impostati dalla sua pagina
  const eTessera = ((await headers()).get("x-pathname") || "").startsWith("/tessera/");

  return (
    <html lang="it" className="scroll-smooth">
      <head>
        {!eTessera && (
          <>
            <link rel="icon" type="image/png" sizes="32x32" href={pwaIconUrl(32, v)} />
            <link rel="icon" type="image/png" sizes="192x192" href={pwaIconUrl(192, v)} />
            <link rel="apple-touch-icon" sizes="180x180" href={pwaIconUrl(180, v)} />
            <link rel="manifest" href="/manifest.webmanifest" />
          </>
        )}
      </head>
      <body style={brandStyle} className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        {children}
        {hasWhatsAppModule && (
          <FloatingWhatsAppWidget
            phone={waPhone}
            brandName={theme.restaurantName}
          />
        )}
      </body>
    </html>
  );
}
