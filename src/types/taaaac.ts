export type LicenseStatus = "ATTIVO" | "SOSPESO" | "IN_SCADENZA";

export type AddonModule =
  | "WHATSAPP_REMINDERS"
  | "LOYALTY_CARD"
  | "VENDOLY_CHANNEL_MANAGER"
  | "DIGITAL_MENU_SYNC"
  | "ADVANCED_ANALYTICS";

export interface TenantTheme {
  primaryColor: string;
  accentColor: string;
  primaryHover?: string;
  logoUrl?: string;
  restaurantName: string;
  tagline?: string;
}

export interface TenantConfigResponse {
  success: boolean;
  tenantId: string;
  domain: string;
  licenseStatus: LicenseStatus;
  licenseExpiresAt?: string;
  enabledModules: AddonModule[];
  theme: TenantTheme;
}
