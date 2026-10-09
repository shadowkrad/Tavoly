export const EU_ALLERGENS = [
  "Glutine",
  "Crostacei",
  "Uova",
  "Pesce",
  "Arachidi",
  "Soia",
  "Latte / Latticini",
  "Frutta a guscio",
  "Sedano",
  "Senape",
  "Semi di sesamo",
  "Anidride solforosa e solfiti",
  "Lupini",
  "Molluschi",
] as const;

export type AllergenName = typeof EU_ALLERGENS[number];

export const ALLERGEN_ICONS: Record<string, string> = {
  Glutine: "🌾",
  Crostacei: "🦐",
  Uova: "🥚",
  Pesce: "🐟",
  Arachidi: "🥜",
  Soia: "🌱",
  "Latte / Latticini": "🥛",
  "Frutta a guscio": "🌰",
  Sedano: "🥬",
  Senape: "🟡",
  "Semi di sesamo": "⚪",
  "Anidride solforosa e solfiti": "🍷",
  Lupini: "🌼",
  Molluschi: "🦪",
};

export const DEFAULT_MENU_CATEGORIES = [
  "Antipasti",
  "Primi",
  "Secondi",
  "Contorni",
  "Pizze",
  "Dolci",
  "Bevande & Vini",
] as const;
