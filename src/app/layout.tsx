import type { Metadata } from "next";
import "./globals.css";
import { getTenantConfig } from "@/lib/taaaac-core";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getTenantConfig();
  return {
    title: `${config.theme.restaurantName || "Tavoly"} | Tavoli & Prenotazioni Taaaac`,
    description: config.theme.tagline || "Modulo gestionale sale e coperti parte dell'ecosistema Taaaac.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantConfig = await getTenantConfig();
  const { theme } = tenantConfig;

  // Semantic CSS dynamic variable injections based on Taaaac Core theme response
  const brandStyle = {
    "--brand-primary": theme.primaryColor || "#2563eb",
    "--brand-primary-hover": theme.primaryHover || "#1d4ed8",
    "--brand-accent": theme.accentColor || "#f97316",
  } as React.CSSProperties;

  return (
    <html lang="it" className="scroll-smooth">
      <body style={brandStyle} className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
