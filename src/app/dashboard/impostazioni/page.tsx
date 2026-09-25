import { Settings, Clock, Users, Shield } from "lucide-react";
import EmailSettingsCard from "@/components/dashboard/EmailSettingsCard";

export const dynamic = "force-dynamic";

export default function TavolyImpostazioniPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Impostazioni Ristorante & Turni
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configura orari di servizio, capienza massima coperti e canale notifiche Taaaac.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canale Email Taaaac Mail Engine */}
        <EmailSettingsCard />

        {/* Turni di Servizio */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Turni di Servizio Cena</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Primo Turno Cena:</span>
              <span className="font-mono text-emerald-700 font-bold">19:30 - 21:15</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-700">Secondo Turno Cena:</span>
              <span className="font-mono text-emerald-700 font-bold">21:30 - 23:30</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="font-semibold text-slate-700">Tolleranza Ritardo Tavolo:</span>
              <span className="font-mono text-slate-500">15 minuti</span>
            </div>
          </div>
        </div>

        {/* Capienza Massima */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Capienza Massima Sale</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="font-semibold text-slate-700 block">Sala Interna</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">45 Coperti</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="font-semibold text-slate-700 block">Dehors Estivo</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">30 Coperti</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="font-semibold text-slate-700 block">Veranda Panoramica</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">20 Coperti</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
