import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isStaffAuthenticated } from "@/lib/auth";
import { getTenantConfig } from "@/lib/taaaac-core";
import { Header } from "@/components/Header";
import { LicenseBanner } from "@/components/LicenseBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isStaffAuthenticated();
  if (!authenticated) {
    redirect("/login");
  }

  const tenantConfig = await getTenantConfig();
  const { licenseStatus, licenseExpiresAt } = tenantConfig;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <LicenseBanner status={licenseStatus} expiresAt={licenseExpiresAt} />
      <Header tenantConfig={tenantConfig} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white py-3.5 text-center text-xs text-slate-500">
        <p>
          <strong>Tavoly Console</strong> • Sessione Operatore Autenticata •{" "}
          <Link
            href="/"
            className="text-blue-600 font-semibold hover:underline"
          >
            Vedi Vetrina Pubblica
          </Link>
        </p>
      </footer>
    </div>
  );
}
