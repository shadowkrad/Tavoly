"use client";

import React, { createContext, useContext, useEffect } from "react";
import { TenantConfig, TaaaacAddonId } from "@/lib/taaaac-client";

interface TenantConfigContextValue {
  config: TenantConfig | null;
  moduliAttivi: string[];
  isAddonActive: (addonId: TaaaacAddonId | string) => boolean;
}

const TenantConfigContext = createContext<TenantConfigContextValue>({
  config: null,
  moduliAttivi: [],
  isAddonActive: () => false,
});

export function TenantConfigProvider({
  config,
  children,
}: {
  config: TenantConfig | null;
  children: React.ReactNode;
}) {
  const moduliAttivi = config?.moduliAttivi || [];

  const isAddonActive = (addonId: TaaaacAddonId | string) => {
    return moduliAttivi.includes(addonId);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    if (config?.theme?.primaryColor) {
      root.style.setProperty("--color-brand-primary", config.theme.primaryColor);
    }
    if (config?.theme?.accentColor) {
      root.style.setProperty("--color-brand-accent", config.theme.accentColor);
    }
    if (config?.theme?.secondaryColor) {
      root.style.setProperty("--color-brand-secondary", config.theme.secondaryColor);
    }
    if (config?.theme?.surfaceColor) {
      root.style.setProperty("--color-brand-surface", config.theme.surfaceColor);
    }
  }, [config?.theme]);

  return (
    <TenantConfigContext.Provider value={{ config, moduliAttivi, isAddonActive }}>
      {children}
    </TenantConfigContext.Provider>
  );
}

export function useTenantConfig() {
  const context = useContext(TenantConfigContext);
  if (!context) {
    throw new Error("useTenantConfig deve essere utilizzato all'interno di un TenantConfigProvider");
  }
  return context;
}
