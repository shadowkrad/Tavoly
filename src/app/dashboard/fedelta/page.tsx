import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyFedeltaPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.LOYALTY_CARD}
      title="Raccolta Punti & Fidelity Food"
      description="Fidelizza i tuoi clienti abituali: accumulo punti sul totale conto (es. 1 punto ogni euro speso) e sconti dedicati o bottiglie omaggio della cantina."
      icon="🎟️"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-600" />
            Programma Fedeltà Ristorante
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestisci la carta punti digitale e assegna sconti o omaggi ai clienti più fedeli.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Regola di Accumulo</span>
            <span className="text-xs text-emerald-700 font-bold">1 € al Tavolo = 1 Punto</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-mono font-bold text-emerald-700">Soglia 150 Punti</span>
              <h4 className="font-bold text-sm text-slate-900">Dessert Artigianale della Casa in Omaggio</h4>
              <p className="text-xs text-slate-500">Applicato direttamente sul conto al tavolo</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-xs font-mono font-bold text-emerald-700">Soglia 350 Punti</span>
              <h4 className="font-bold text-sm text-slate-900">Bottiglia di Vino Doc Selezionata</h4>
              <p className="text-xs text-slate-500">Dalla cantina dello chef</p>
            </div>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
