export const DEFAULT_HERO_COVER_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80";

export type ExperienceIconType =
  | "coffee"
  | "utensils"
  | "glass"
  | "wine"
  | "pizza"
  | "flame"
  | "sparkles"
  | "beer"
  | "heart"
  | "chef";

export interface ExperienceItem {
  id: string;
  icon: ExperienceIconType;
  title: string;
  description: string;
}

export interface ShowcaseContactInfo {
  address?: string;
  addressNote?: string;
  phone?: string;
  email?: string;
  hoursWeekday?: string;
  hoursWeekend?: string;
  hoursNote?: string;
  responseNote?: string;
}

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

  // Esperienze & Momenti Personalizzabili
  experiences?: ExperienceItem[];

  // Informazioni di Contatto & Orari
  contactInfo?: ShowcaseContactInfo;

  // Etichette Personalizzate
  customLabels: {
    servicesTitle: string;
    servicesSubtitle: string;
    hoursTitle: string;
    locationTitle?: string;
    contactTitle: string;
    bookingCtaTitle?: string;
    bookingCtaSubtitle?: string;
    bookingCtaButton?: string;
    heroCardTitle?: string;
    heroCardSubtitle?: string;
    heroCardBadge?: string;
    heroShift1Label?: string;
    heroShift1Hours?: string;
    heroShift2Label?: string;
    heroShift2Hours?: string;
    heroCardNoteTitle?: string;
    heroCardNoteDesc?: string;
  };
}

export const DEFAULT_TAVOLY_EXPERIENCES: ExperienceItem[] = [
  {
    id: "exp_1",
    icon: "coffee",
    title: "Caffetteria & Colazioni",
    description: "Caffè selezionati, lievitati artigianali e colazioni per iniziare al meglio la giornata.",
  },
  {
    id: "exp_2",
    icon: "utensils",
    title: "Pranzo di Lavoro",
    description: "Business lunch veloci e leggeri con ingredienti di prima scelta e servizio rapido.",
  },
  {
    id: "exp_3",
    icon: "glass",
    title: "Aperitivo al Bancone",
    description: "Cocktail signature, birre artigianali e finger food gourmet per il tuo aperitivo dopo il lavoro.",
  },
  {
    id: "exp_4",
    icon: "wine",
    title: "Cena Gourmet",
    description: "Menu alla carta con materie prime stagionali, carta dei vini curata e atmosfera rilassante.",
  },
];

export const DEFAULT_TAVOLY_CONTACT_INFO: ShowcaseContactInfo = {
  address: "Piazza Grande, 12 - Arezzo (AR)",
  addressNote: "Parcheggio convenzionato a 50 metri. Accesso disabili disponibile in tutta la struttura.",
  phone: "+39 0575 654321",
  email: "info@osteriatavoli.it",
  hoursWeekday: "Lunedì - Venerdì: 07:30 - 23:30",
  hoursWeekend: "Sabato e Domenica: 08:30 - 00:30",
  hoursNote: "Cucina aperta per pranzo (12:30-14:30) e cena (19:30-22:30)",
  responseNote: "Rispondiamo rapidamente durante gli orari di servizio.",
};

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

  experiences: DEFAULT_TAVOLY_EXPERIENCES,
  contactInfo: DEFAULT_TAVOLY_CONTACT_INFO,

  customLabels: {
    servicesTitle: "I Nostri Spazi & Esperienze",
    servicesSubtitle: "Dalla sala interna riservata al dehors estivo fino all'angolo aperitivi al bancone.",
    hoursTitle: "Turni di Servizio & Orari",
    locationTitle: "Posizione & Location",
    contactTitle: "Dove Trovarci & Prenotazioni",
    bookingCtaTitle: "Prenota il tuo Tavolo in pochi secondi",
    bookingCtaSubtitle: "Scegli il turno, l'orario e i coperti desiderati. Riceverai la conferma immediata della sala e il promemoria su WhatsApp.",
    bookingCtaButton: "Apri Form Prenotazione",
    heroCardTitle: "Ospitalità & Sala",
    heroCardSubtitle: "Tavoli in tempo reale",
    heroCardBadge: "Aperto Oggi",
    heroShift1Label: "Pranzo",
    heroShift1Hours: "12:30 - 14:30",
    heroShift2Label: "Cena",
    heroShift2Hours: "19:30 - 23:00",
    heroCardNoteTitle: "Pranzo di lavoro o Cena Romantica?",
    heroCardNoteDesc: "Puoi specificare intolleranze alimentari e preferenze di sala direttamente nel modulo di prenotazione.",
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
      experiences: Array.isArray(parsed.experiences) && parsed.experiences.length > 0
        ? parsed.experiences
        : DEFAULT_TAVOLY_EXPERIENCES,
      contactInfo: {
        ...DEFAULT_TAVOLY_CONTACT_INFO,
        ...(parsed.contactInfo || {}),
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
