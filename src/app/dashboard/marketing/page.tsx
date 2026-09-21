import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyMarketingPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.MARKETING_1CLICK}
      title="Marketing 1-Click WhatsApp per Ristoranti"
      description="Invia comunicazioni istantanee a tutti i tuoi clienti per serate a tema, menù degustazione, tartufo di stagione o per riempire la sala nei giorni infrasettimanali."
      icon="📣"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Share2 className="w-6 h-6 text-emerald-600" />
            Marketing Broadcast & Promozioni Serate
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Messaggi diretti WhatsApp a clienti già registrati con un solo tocco.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Serata Degustazione Giovedì Pesce</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Invita i clienti amanti del pesce alla serata speciale con calice di benvenuto incluso.
            </p>
            <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition">
              Invia Broadcast (64 Clienti)
            </button>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Nuovo Menù Autunnale con Funghi e Tartufo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Condividi il link al menù digitale QR aggiornato per il weekend.
            </p>
            <button className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition">
              Personalizza Testo
            </button>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
