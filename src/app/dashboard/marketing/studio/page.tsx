import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import StudioGrafico, { type PresetCampagna } from "@/components/marketing/StudioGrafico";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const PRESETS: PresetCampagna[] = [
  { id: "pesce", nome: "Serata a tema: pesce", titolo: "Serata di pesce", sottotitolo: "Menù degustazione con calice di benvenuto. Posti limitati.", badge: "Solo 35 €", temaAI: "fresh seafood platter on a rustic table" },
  { id: "pizza", nome: "Pizza gourmet", titolo: "Pizza gourmet", sottotitolo: "Impasto a lunga lievitazione e ingredienti scelti.", badge: "Da 8 €", temaAI: "gourmet pizza from a wood fired oven" },
  { id: "tartufo", nome: "Tartufo di stagione", titolo: "Il tartufo è arrivato", sottotitolo: "Piatti con tartufo fresco per tutta la stagione.", badge: "In menù ora", temaAI: "truffle shavings on fresh pasta" },
  { id: "feste", nome: "Menù delle feste", titolo: "Menù delle feste", sottotitolo: "Prenota il tuo tavolo per le feste: pochi posti rimasti.", badge: "Prenota ora", temaAI: "festive holiday dinner table with warm lights" },
  { id: "domenica", nome: "Pranzo della domenica", titolo: "Pranzo della domenica", sottotitolo: "Una tavolata in famiglia, come a casa.", badge: "Menù 25 €", temaAI: "family sunday lunch table with homemade dishes" },
  { id: "asporto", nome: "Asporto del weekend", titolo: "Asporto del weekend", sottotitolo: "Ordina online e ritira senza attese.", badge: "Ordina online", temaAI: "takeaway food boxes on a clean counter" },
];

export default function StudioGraficoPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.MARKETING_1CLICK}
      title="Studio Grafico per le tue promozioni"
      description="Crea locandine, post e storie con il tuo logo, il tuo QR e uno sfondo professionale."
      icon="🎨"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            Studio Grafico
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Scegli un&apos;idea, cambia testo e prezzo quando vuoi, poi scarica l&apos;immagine o stampa il volantino.
          </p>
        </div>
        <StudioGrafico settore="ristorazione" presets={PRESETS} />
      </div>
    </AddonModuleGuard>
  );
}
