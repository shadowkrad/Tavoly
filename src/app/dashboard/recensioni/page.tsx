import AddonModuleGuard from "@/components/dashboard/AddonModuleGuard";
import { TAAAAC_ADDONS } from "@/lib/taaaac-client";
import { Star, QrCode } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyRecensioniPage() {
  return (
    <AddonModuleGuard
      addonId={TAAAAC_ADDONS.GOOGLE_REVIEWS}
      title="Booster Recensioni Google Maps per Ristoranti"
      description="Scala le classifiche locali di Google Maps e TripAdvisor: invia un messaggio WhatsApp di ringraziamento a fine serata con invito a lasciare 5 stelle oppure posiziona i cavalieri QR al tavolo."
      icon="⭐"
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-emerald-600 fill-emerald-600" />
            Recensioni Google Maps & Local SEO
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ricevi recensioni a 5 stelle dai clienti felici mentre sono ancora seduti o subito dopo la cena.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">QR Code da Cavaliere Segnatavolo</h3>
            <p className="text-xs text-slate-500">
              I commensali scansionano il QR mentre aspettano il conto e aprono direttamente il form recensioni di Google.
            </p>
            <div className="w-28 h-28 mx-auto bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-center">
              <QrCode className="w-24 h-24 text-emerald-800" />
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Messaggio Ringraziamento WhatsApp</h3>
            <p className="text-xs text-slate-500">
              La mattina seguente la cena: &quot;Grazie per aver cenato da noi! Ti è piaciuta la serata? Il tuo parere su Google è prezioso per noi.&quot;
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-mono">
              🟢 Invio programmato: Giorno seguente alle 11:00
            </div>
          </div>
        </div>
      </div>
    </AddonModuleGuard>
  );
}
