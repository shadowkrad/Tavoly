import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Gift } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyGiftCardsPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.GIFT_CARDS}
      title="Buoni Cena Regalo & Voucher Food"
      description="Crea e vendi voucher 'Cena per Due' o buoni con credito scalabile spendibili nel tuo ristorante, con codice alfanumerico e riscatto al momento del conto."
      icon="🎁"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-600" />
            Buoni Regalo & Esperienze Gourmet
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestisci voucher cena per due e buoni regalo emessi.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Voucher Attivi</span>
            <button className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
              + Emetti Nuovo Buono Cena
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-emerald-700 text-sm">#CENA-DEGUSTAZIONE-120</span>
                <p className="text-slate-500 mt-0.5">Emesso per: Famiglia Rossi (Cena 2 Persone)</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-slate-900 text-sm">120,00 €</span>
                <span className="text-[10px] text-emerald-600 font-semibold block">Attivo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
