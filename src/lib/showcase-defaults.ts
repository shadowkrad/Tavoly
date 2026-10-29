export const DEFAULT_HERO_COVER_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80";

export interface TrustBadgeItem {
  id: string;
  icon: "star" | "shield" | "award" | "clock" | "check";
  text: string;
}

export interface GalleryPhotoItem {
  id: string;
  url: string;
  caption?: string;
}

export interface ShowcaseConfig {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;

  // Sezione Hero
  hero: {
    badgeText: string;
    title: string;
    subtitle: string;
    ctaPrimaryText: string;
    ctaSecondaryText: string;
    coverImageUrl?: string | null;
    overlayOpacity: number; // 0 - 100
  };

  // Trust Badges
  trustBadges: TrustBadgeItem[];

  // Sezione Cucina / Osteria / Filosofia
  about: {
    enabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    imageUrl?: string | null;
    quoteText?: string;
    quoteAuthor?: string;
  };

  // Galleria Fotografica
  gallery: {
    enabled: boolean;
    title: string;
    subtitle: string;
    images: GalleryPhotoItem[];
  };

  // Sezioni & Visibilità
  sections: {
    showHero: boolean;
    showTrustBadges: boolean;
    showServices: boolean;
    showGallery: boolean;
    showAbout: boolean;
    showHours: boolean;
    showContact: boolean;
    showTakeawayCta: boolean;
    showMenuLink?: boolean;
  };

  // Etichette Personalizzate
  customLabels: {
    servicesTitle: string;
    servicesSubtitle: string;
    hoursTitle: string;
    contactTitle: string;
  };
}

export const DEFAULT_TAVOLY_SHOWCASE_CONFIG: ShowcaseConfig = {
  brandName: "Osteria dei Tavoli",
  primaryColor: "#064e3b",
  accentColor: "#059669",
  logoUrl: null,
  faviconUrl: null,

  hero: {
    badgeText: "Esperienza Culinaria & Ospitalità Smart",
    title: "Il piacere della tavola, semplice da prenotare.",
    subtitle:
      "Benvenuti all'Osteria dei Tavoli. Dai pranzi di lavoro agli aperitivi al bancone fino alle cene d'autore, riserviamo per te il miglior tavolo con conferma istantanea.",
    ctaPrimaryText: "Prenota il tuo Tavolo",
    ctaSecondaryText: "Ordina da Asporto",
    coverImageUrl: DEFAULT_HERO_COVER_IMAGE,
    overlayOpacity: 75,
  },

  trustBadges: [
    { id: "tb1", icon: "check", text: "Conferma Subito" },
    { id: "tb2", icon: "star", text: "Promemoria WhatsApp" },
    { id: "tb3", icon: "clock", text: "Zero Attesa in Sala" },
  ],

  about: {
    enabled: true,
    title: "La Nostra Cucina & Filosofia",
    subtitle: "Ingredienti del Territorio & Passione Culinaria",
    description:
      "Selezioniamo ogni giorno le migliori materie prime dai produttori locali per offrirti sapori genuini e piatti preparati con cura artigianale. Un'atmosfera calda e accogliente dove sentirsi a casa.",
    imageUrl: null,
    quoteText: "Cucinare è un atto d'amore, condividere una tavola è un momento di felicità.",
    quoteAuthor: "Chef Lorenzo — Osteria dei Tavoli",
  },

  gallery: {
    enabled: true,
    title: "Atmosfera, Sala & Piatti",
    subtitle: "Uno sguardo alla nostra sala, mise en place e creazioni dello Chef",
    images: [
      {
        id: "g1",
        url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        caption: "La sala principale accogliente e illuminata",
      },
      {
        id: "g2",
        url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        caption: "Mise en place curata per pranzi e cene d'autore",
      },
      {
        id: "g3",
        url: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        caption: "Primi piatti della tradizione con pasta fresca tirata a mano",
      },
      {
        id: "g4",
        url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
        caption: "Selezione di vini toscani e nazionali delle migliori cantine",
      },
    ],
  },

  sections: {
    showHero: true,
    showTrustBadges: true,
    showServices: true,
    showGallery: true,
    showAbout: true,
    showHours: true,
    showContact: true,
    showTakeawayCta: true,
    showMenuLink: true,
  },

  customLabels: {
    servicesTitle: "I Nostri Spazi & Esperienze",
    servicesSubtitle: "Dalla sala interna riservata al dehors estivo fino all'angolo aperitivi al bancone.",
    hoursTitle: "Turni di Servizio & Orari",
    contactTitle: "Dove Trovarci & Prenotazioni",
  },
};

export function parseShowcaseConfig(raw: string | null | undefined): ShowcaseConfig {
  if (!raw || typeof raw !== "string" || raw.trim() === "" || raw === "{}") {
    return { ...DEFAULT_TAVOLY_SHOWCASE_CONFIG };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_TAVOLY_SHOWCASE_CONFIG,
      ...parsed,
      hero: {
        ...DEFAULT_TAVOLY_SHOWCASE_CONFIG.hero,
        ...(parsed.hero || {}),
      },
      trustBadges: Array.isArray(parsed.trustBadges)
        ? parsed.trustBadges
        : DEFAULT_TAVOLY_SHOWCASE_CONFIG.trustBadges,
      about: {
        ...DEFAULT_TAVOLY_SHOWCASE_CONFIG.about,
        ...(parsed.about || {}),
      },
      gallery: {
        ...DEFAULT_TAVOLY_SHOWCASE_CONFIG.gallery,
        ...(parsed.gallery || {}),
        images: Array.isArray(parsed.gallery?.images)
          ? parsed.gallery.images
          : DEFAULT_TAVOLY_SHOWCASE_CONFIG.gallery.images,
      },
      sections: {
        ...DEFAULT_TAVOLY_SHOWCASE_CONFIG.sections,
        showMenuLink: parsed.sections?.showMenuLink !== undefined ? !!parsed.sections.showMenuLink : true,
        ...(parsed.sections || {}),
      },
      customLabels: {
        ...DEFAULT_TAVOLY_SHOWCASE_CONFIG.customLabels,
        ...(parsed.customLabels || {}),
      },
    };
  } catch {
    return { ...DEFAULT_TAVOLY_SHOWCASE_CONFIG };
  }
}
