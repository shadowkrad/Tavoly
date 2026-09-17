import type { Metadata } from "next";
import "./globals.css";
import { getTenantConfig } from "@/lib/taaaac-core";
import { Header } from "@/components/Header";
import { LicenseBanner } from "@/components/LicenseBanner";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getTenantConfig();
  return {
    title: `${config.theme.restaurantName || "Tavoly"} | Gestionale Tavoli & Prenotazioni Taaaac`,
    description: config.theme.tagline || "Modulo gestionale sale e coperti parte dell'ecosistema Taaaac.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenantConfig = await getTenantConfig();
  const { theme, licenseStatus, licenseExpiresAt } = tenantConfig;

  // Semantic CSS dynamic variable injections based on Taaaac Core theme response
  const brandStyle = {
    "--brand-primary": theme.primaryColor || "#2563eb",
    "--brand-primary-hover": theme.primaryHover || "#1d4ed8",
    "--brand-accent": theme.accentColor || "#f97316",
  } as React.CSSProperties;

  return (
    <html lang="it">
      <body style={brandStyle} className="bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <LicenseBanner status={licenseStatus} expiresAt={licenseExpiresAt} />
        <Header tenantConfig={tenantConfig} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
          <p>
            <strong>Tavoly</strong> • Sviluppato da{" "}
            <a
              href="https://taaaac.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:underline"
            >
              Taaaac Ecosystem
            </a>{" "}
            (Alessio Guidelli) • Tutti i diritti riservati.
          </p>
        </footer>
      </body>
    </html>
  );
}
