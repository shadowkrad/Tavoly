"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { TaaaacLogo } from "@/components/common/TaaaacLogo";
import { useTenantConfig } from "@/components/providers/TenantConfigProvider";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import {
  LayoutGrid,
  CalendarDays,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Settings,
  Clock,
  Gift,
  Award,
  Share2,
  Star,
  ExternalLink,
  ChevronRight,
  ChefHat,
  ChevronDown,
} from "lucide-react";
import SidebarPwaInstall from "@/components/dashboard/SidebarPwaInstall";

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavLinkItem[];
}

// Le voci proprie del modulo sono raccolte in due gruppi apribili: il menu mostra meno cose insieme
const baseNavGroups: NavGroup[] = [
  {
    id: "sala",
    label: "Sala",
    icon: LayoutGrid,
    items: [
      { href: "/dashboard", label: "Mappa tavoli", icon: LayoutGrid },
      { href: "/dashboard/prenotazioni", label: "Prenotazioni e turni", icon: CalendarDays },
      { href: "/dashboard/staff", label: "Staff e camerieri", icon: ChefHat },
    ],
  },
  {
    id: "cucina",
    label: "Cucina e asporto",
    icon: UtensilsCrossed,
    items: [
      { href: "/dashboard/menu", label: "Menù digitale QR", icon: UtensilsCrossed },
      { href: "/dashboard/asporto", label: "Asporto e delivery", icon: ShoppingBag },
    ],
  },
];

const clientiLink: NavLinkItem = { href: "/dashboard/clienti", label: "Clienti", icon: Users };

const addonNavLinks = [
  {
    addonId: TAAAAC_ADDONS.LOYALTY_CARD,
    href: "/dashboard/fedelta",
    label: "Raccolta Punti",
    icon: Award,
    badge: "Fidelity",
  },
  {
    addonId: TAAAAC_ADDONS.MARKETING_1CLICK,
    href: "/dashboard/marketing",
    label: "Marketing 1-Click",
    icon: Share2,
    badge: "Promo",
  },
  {
    addonId: TAAAAC_ADDONS.GIFT_CARDS,
    href: "/dashboard/gift-cards",
    label: "Buoni Regalo",
    icon: Gift,
    badge: "Voucher",
  },
  {
    addonId: TAAAAC_ADDONS.GOOGLE_REVIEWS,
    href: "/dashboard/recensioni",
    label: "Recensioni Google",
    icon: Star,
    badge: "Rating",
  },
];

interface DashboardSidebarProps {
  kdsEnabled?: boolean;
}

export default function DashboardSidebar({ kdsEnabled = false }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAddonActive, config } = useTenantConfig();

  const activeAddons = addonNavLinks.filter((item) => isAddonActive(item.addonId));

  const navGroups = useMemo<NavGroup[]>(() => {
    return baseNavGroups.map((g) =>
      g.id === "cucina" && kdsEnabled
        ? { ...g, items: [...g.items, { href: "/dashboard/cucina", label: "Monitor cucina", icon: ChefHat }] }
        : g
    );
  }, [kdsEnabled]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  // Gruppi apribili: si apre da solo quello della pagina in cui ti trovi
  const [aperti, setAperti] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const g = navGroups.find((gr) => gr.items.some((i) => isActive(i.href)));
    if (g) setAperti((prev) => (prev[g.id] ? prev : { ...prev, [g.id]: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, navGroups]);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-emerald-950 text-white border-b border-emerald-800 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0">
          <TaaaacLogo iconSize={20} textSize="text-base" showBadge={true} badgeText="Tavoly" dark={true} />
        </Link>
        <div className="flex items-center gap-1.5">
          <NotificationBell placement="topbar" dark={true} />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-950 text-emerald-100 border-r border-emerald-800/80 flex flex-col h-[100dvh] max-h-[100dvh] transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-emerald-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-1.5 min-w-0 flex-1">
            <TaaaacLogo iconSize={22} textSize="text-base" showBadge={true} badgeText="Tavoly" dark={true} />
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <NotificationBell placement="sidebar" dark={true} />
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Nome attività */}
        <div className="px-4 py-3 border-b border-emerald-800/60">
          <p className="text-sm font-semibold text-white truncate">{config?.nomeAttivita || "La tua attività"}</p>
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navGroups.map((g) => {
            const GIcon = g.icon;
            const apertoG = Boolean(aperti[g.id]);
            const haAttiva = g.items.some((i) => isActive(i.href));
            return (
              <div key={g.id}>
                <button
                  type="button"
                  onClick={() => setAperti((prev) => ({ ...prev, [g.id]: !apertoG }))}
                  aria-expanded={apertoG}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    haAttiva && !apertoG ? "bg-emerald-900 text-white" : "text-emerald-100 hover:bg-emerald-900 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <GIcon className="w-4 h-4 shrink-0" />
                    {g.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform ${apertoG ? "rotate-180" : ""}`} />
                </button>
                {apertoG && (
                  <div className="mt-0.5 mb-1 ml-4 pl-3 border-l border-emerald-800/80 space-y-0.5">
                    {g.items.map((link) => {
                      const active = isActive(link.href);
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                            active ? "bg-emerald-600 text-white font-semibold" : "text-emerald-200 hover:bg-emerald-900 hover:text-white"
                          }`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <Link
            href={clientiLink.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isActive(clientiLink.href) ? "bg-emerald-600 text-white" : "text-emerald-100 hover:bg-emerald-900 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            {clientiLink.label}
          </Link>

          {/* Add-ons Section */}
          {activeAddons.length > 0 && (
            <div className="pt-4 pb-1">
              <p className="text-xs font-semibold text-emerald-300 px-3 pb-1">Moduli attivi</p>
              <div className="space-y-0.5">
                {activeAddons.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        active ? "bg-emerald-600 text-white" : "text-emerald-100 hover:bg-emerald-900 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 pb-1">
            <Link
              href="/dashboard/impostazioni"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive("/dashboard/impostazioni") ? "bg-emerald-600 text-white" : "text-emerald-100 hover:bg-emerald-900 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Impostazioni</span>
            </Link>
          </div>
        </nav>

        {/* Bottom Bar: Link Vetrina & Info */}
        <div className="p-3 border-t border-emerald-800/80 bg-emerald-900/60 space-y-2">
          <SidebarPwaInstall onAction={() => setMobileOpen(false)} />
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-900/90 text-emerald-200 hover:text-white text-xs font-medium transition border border-emerald-800"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
              Vedi Vetrina Pubblica
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <div className="flex items-center justify-between px-1 text-[10px] text-emerald-300/80 font-mono">
            <span>Tavoly · Taaaac</span>
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800/70 px-1.5 py-0.5 rounded text-[9px] font-mono">
              v{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}{process.env.NEXT_PUBLIC_GIT_COMMIT ? ` · ${process.env.NEXT_PUBLIC_GIT_COMMIT}` : ""}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
