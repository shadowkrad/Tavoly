import React from "react";
import Link from "next/link";
import { getTenantConfig } from "@/lib/taaaac-core";
import { ShowcaseNavbar } from "@/components/public/ShowcaseNavbar";
import { PublicBookingWidget } from "@/components/public/PublicBookingWidget";
import {
  UtensilsCrossed,
  Coffee,
  GlassWater,
  Wine,
  Sparkles,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicShowcasePage() {
  const tenantConfig = await getTenantConfig();
  const { theme } = tenantConfig;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Pubblica con discreto link staff */}
      <ShowcaseNavbar tenantConfig={tenantConfig} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Text & Claim */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Esperienza Culinaria & Ospitalità Smart</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Il piacere della tavola, <br className="hidden sm:inline" />
                <span className="text-blue-600">semplice da prenotare.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Benvenuti a <strong className="text-slate-900">{theme.restaurantName || "Tavoly"}</strong>. Dai pranzi di lavoro agli aperitivi al bancone fino alle cene d&apos;autore, riserviamo per te il miglior tavolo con conferma istantanea.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <a
                  href="#prenota"
                  className="taaaac-btn-primary px-6 py-3.5 text-sm sm:text-base font-bold shadow-md"
                >
                  <span>Prenota il tuo Tavolo</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#servizi"
                  className="taaaac-btn-secondary px-6 py-3.5 text-sm sm:text-base font-bold"
                >
                  I Nostri Servizi
                </a>
              </div>

              {/* Badges di affidabilità */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/60 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Conferma Subito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Promemoria WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">Zero Attesa</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Showcase Preview */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="taaaac-card p-6 bg-white shadow-xl border-slate-200/90 relative z-10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        LIVE
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Ospitalità & Sala</h4>
                        <p className="text-[11px] text-slate-500">Tavoli in tempo reale</p>
                      </div>
                    </div>
                    <span className="taaaac-badge bg-emerald-50 text-emerald-700 border-emerald-200">
                      Aperto Oggi
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase block">Pranzo</span>
                      <strong className="text-base font-black text-slate-900">12:30 - 14:30</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-xs font-semibold text-slate-500 uppercase block">Cena</span>
                      <strong className="text-base font-black text-slate-900">19:30 - 23:00</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Pranzo di lavoro o Cena Romantica?
                    </p>
                    <p className="text-blue-700 leading-relaxed text-[11px]">
                      Puoi specificare intolleranze alimentari, preferenze di sala (interno, dehors o veranda) direttamente nel modulo di prenotazione.
                    </p>
                  </div>
                </div>

                {/* Decorative background glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl opacity-10 blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sezione Servizi del Locale */}
      <section id="servizi" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Esperienze
          </span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            I Nostri Momenti della Giornata
          </h2>
          <p className="text-sm text-slate-600">
            Dalla pausa caffè del mattino all&apos;aperitivo dopo il lavoro, fino alla cena con gli amici.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="taaaac-card space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coffee className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Caffetteria & Colazioni</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Caffè selezionati, lievitati artigianali e colazioni per iniziare al meglio la giornata.
            </p>
          </div>

          <div className="taaaac-card space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Pranzo di Lavoro</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Business lunch veloci e leggeri con ingredienti di prima scelta e servizio rapido.
            </p>
          </div>

          <div className="taaaac-card space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GlassWater className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Aperitivo al Bancone</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cocktail signature, birre artigianali e finger food gourmet per il tuo aperitivo dopo il lavoro.
            </p>
          </div>

          <div className="taaaac-card space-y-3 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wine className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cena Gourmet</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Menu alla carta con materie prime stagionali, carta dei vini curata e atmosfera rilassante.
            </p>
          </div>
        </div>
      </section>

      {/* Sezione Prenota il tuo Tavolo (Widget) */}
      <section id="prenota" className="py-16 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PublicBookingWidget />
        </div>
      </section>

      {/* Orari & Dove Siamo */}
      <section id="contatti" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="taaaac-card bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Orari di Apertura</h4>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pl-13">
              <p><strong>Lunedì - Venerdì:</strong> 07:30 - 23:30</p>
              <p><strong>Sabato e Domenica:</strong> 08:30 - 00:30</p>
              <p className="text-slate-400">Cucina aperta per pranzo (12:30-14:30) e cena (19:30-22:30)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Posizione & Location</h4>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pl-13">
              <p className="font-semibold text-slate-900">Via Roma 42, Centro Storico</p>
              <p>Parcheggio convenzionato a 50 metri.</p>
              <p className="text-slate-400">Accesso disabili disponibile in tutta la struttura.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Contattaci Direttamente</h4>
            </div>
            <div className="text-xs text-slate-600 space-y-1 pl-13">
              <p><strong>Telefono / WhatsApp:</strong> +39 02 1234567</p>
              <p><strong>Email info:</strong> prenotazioni@taaaac.eu</p>
              <p className="text-slate-400">Rispondiamo rapidamente durante gli orari di servizio.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Elegante con Accesso Staff Nascosto */}
      <footer className="mt-auto bg-white border-t border-slate-200/90 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">{theme.restaurantName || "Tavoly"}</span>
            <span>• Modulo gestito dall&apos;ecosistema</span>
            <a
              href="https://taaaac.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold hover:underline"
            >
              Taaaac.eu
            </a>
          </div>

          {/* Accesso Staff Discreto */}
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Tutti i diritti riservati</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Accesso Gestione Tavoli per Staff"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Accesso Staff</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
