import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { ShowcaseNavbar } from "@/components/public/ShowcaseNavbar";
import { PublicBookingWidget, PublicShiftData } from "@/components/public/PublicBookingWidget";
import { getTakeawaySettings } from "@/lib/takeaway-server";
import { parseShowcaseConfig } from "@/lib/showcase-defaults";
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
  ShoppingBag,
  Star,
  Award,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicShowcasePage() {
  const [tenantConfig, rawShifts, todayReservations, takeawaySettings, showcaseSetting] = await Promise.all([
    getTenantConfig(),
    prisma.serviceShift.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        status: { not: "ANNULLATA" },
      },
    }),
    getTakeawaySettings(),
    prisma.localSetting.findUnique({
      where: { key: "showcase_config" },
    }),
  ]);

  const { theme } = tenantConfig;
  const showcase = parseShowcaseConfig(showcaseSetting?.value);

  // Calcolo dinamico coperti prenotati per ogni turno
  const shifts: PublicShiftData[] = rawShifts.map((s) => {
    const slots: string[] = JSON.parse(s.timeSlotsJson || "[]");
    const currentBooked = todayReservations
      .filter((r) => slots.includes(r.timeSlot))
      .reduce((sum, r) => sum + r.guestCount, 0);

    return {
      id: s.id,
      name: s.name,
      slots,
      maxGuests: s.maxGuests,
      isActive: s.isActive,
      currentBooked,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Pubblica con discreto link staff */}
      <ShowcaseNavbar tenantConfig={tenantConfig} takeawayEnabled={takeawaySettings.enabled} />

      {/* Hero Section */}
      {showcase.sections.showHero && (
        <section className="relative py-16 md:py-24 overflow-hidden border-b border-slate-200/80">
          {/* Foto Copertina Hero con Overlay Regolabile */}
          {showcase.hero.coverImageUrl ? (
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={showcase.hero.coverImageUrl}
                alt="Hero Cover"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 bg-slate-950"
                style={{ opacity: (showcase.hero.overlayOpacity ?? 75) / 100 }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 z-0"
              style={{
                background: `linear-gradient(180deg, #ffffff 0%, ${showcase.primaryColor || "#064e3b"}12 100%)`,
              }}
            />
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Text & Claim */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {showcase.hero.badgeText && (
                  <div
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                      showcase.hero.coverImageUrl
                        ? "bg-white/10 text-emerald-300 border-white/20"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>{showcase.hero.badgeText}</span>
                  </div>
                )}

                <h1
                  className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight ${
                    showcase.hero.coverImageUrl ? "text-white" : "text-slate-900"
                  }`}
                >
                  {showcase.hero.title}
                </h1>

                <p
                  className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 ${
                    showcase.hero.coverImageUrl ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  {showcase.hero.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/prenotazione"
                    style={{ backgroundColor: showcase.primaryColor || "#064e3b" }}
                    className="text-white px-6 py-3.5 text-sm sm:text-base font-bold shadow-md inline-flex items-center gap-2 rounded-xl hover:opacity-95 transition"
                  >
                    <span>{showcase.hero.ctaPrimaryText || "Prenota il tuo Tavolo"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {takeawaySettings.enabled && showcase.sections.showTakeawayCta && (
                    <Link
                      href="/asporto"
                      className="px-6 py-3.5 text-sm sm:text-base font-bold inline-flex items-center gap-2 border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl shadow-xs transition"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-600" />
                      <span>{showcase.hero.ctaSecondaryText || "Ordina da Asporto"}</span>
                    </Link>
                  )}

                  <a
                    href="#servizi"
                    className={`px-6 py-3.5 text-sm sm:text-base font-bold rounded-xl border transition ${
                      showcase.hero.coverImageUrl
                        ? "bg-slate-900/80 text-white border-slate-700 hover:bg-slate-800"
                        : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    I Nostri Servizi
                  </a>
                </div>

                {/* Badges di affidabilità */}
                {showcase.sections.showTrustBadges && showcase.trustBadges?.length > 0 && (
                  <div
                    className={`pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t max-w-lg mx-auto lg:mx-0 text-left ${
                      showcase.hero.coverImageUrl ? "border-white/10" : "border-slate-200/80"
                    }`}
                  >
                    {showcase.trustBadges.map((tb) => (
                      <div
                        key={tb.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          showcase.hero.coverImageUrl ? "bg-slate-900/60 border border-slate-800" : ""
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span
                          className={`text-xs font-semibold ${
                            showcase.hero.coverImageUrl ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {tb.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Visual Showcase Preview / Card Turni Live */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md">
                  <div className="taaaac-card p-6 bg-white shadow-xl border-slate-200/90 relative z-10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: showcase.primaryColor || "#064e3b" }}
                        >
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

                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Pranzo di lavoro o Cena Romantica?
                      </p>
                      <p className="text-emerald-800 leading-relaxed text-[11px]">
                        Puoi specificare intolleranze alimentari e preferenze di sala (interno, dehors o veranda) direttamente nel modulo di prenotazione.
                      </p>
                    </div>
                  </div>

                  <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl opacity-10 blur-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sezione Galleria Foto Sala & Piatti */}
      {showcase.sections.showGallery && showcase.gallery.images?.length > 0 && (
        <section id="galleria" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: showcase.accentColor || "#059669" }}
            >
              Location & Atmosfera
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {showcase.gallery.title || "Atmosfera, Sala & Piatti"}
            </h2>
            <p className="text-sm text-slate-600">
              {showcase.gallery.subtitle || "Dettagli della nostra sala, mise en place e creazioni dello Chef."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {showcase.gallery.images.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-xs aspect-4/3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption || "Ristorante"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent text-white text-xs">
                    <p className="font-medium line-clamp-2">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sezione Servizi & Momenti del Locale */}
      {showcase.sections.showServices && (
        <section id="servizi" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: showcase.accentColor || "#059669" }}
            >
              Esperienze
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {showcase.customLabels.servicesTitle || "I Nostri Momenti della Giornata"}
            </h2>
            <p className="text-sm text-slate-600">
              {showcase.customLabels.servicesSubtitle ||
                "Dalla pausa caffè del mattino all'aperitivo dopo il lavoro, fino alla cena con gli amici."}
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
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
      )}

      {/* Sezione La Nostra Cucina / Filosofia */}
      {showcase.sections.showAbout && showcase.about.enabled && (
        <section className="bg-slate-900 text-white py-16 my-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: showcase.accentColor || "#059669" }}
            >
              {showcase.about.subtitle}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              {showcase.about.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {showcase.about.description}
            </p>
            {showcase.about.quoteText && (
              <blockquote className="pt-4 border-t border-slate-800 italic text-slate-300 text-sm space-y-1.5">
                <p>&ldquo;{showcase.about.quoteText}&rdquo;</p>
                {showcase.about.quoteAuthor && (
                  <footer
                    className="font-bold not-italic text-xs"
                    style={{ color: showcase.accentColor || "#059669" }}
                  >
                    — {showcase.about.quoteAuthor}
                  </footer>
                )}
              </blockquote>
            )}
          </div>
        </section>
      )}

      {/* Sezione Prenota il tuo Tavolo */}
      <section className="py-16 bg-slate-100/70 border-y border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl shadow-xs">
            🍽️
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Prenota il tuo Tavolo in pochi secondi
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Scegli il turno, l&apos;orario e i coperti desiderati. Riceverai la conferma immediata della sala e il promemoria su WhatsApp.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/prenotazione"
              style={{ backgroundColor: showcase.primaryColor || "#064e3b" }}
              className="text-white px-8 py-3.5 text-sm font-bold shadow-md inline-flex items-center gap-2 rounded-xl transition hover:opacity-95"
            >
              <span>Apri Form Prenotazione</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {takeawaySettings.enabled && showcase.sections.showTakeawayCta && (
              <Link
                href="/asporto"
                className="px-6 py-3.5 text-sm font-bold inline-flex items-center gap-2 border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 rounded-xl transition"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Ordina da Asporto</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Orari & Dove Siamo */}
      {showcase.sections.showHours && (
        <section id="contatti" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="taaaac-card bg-white p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {showcase.customLabels.hoursTitle || "Turni & Orari"}
                </h4>
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
                <p className="font-semibold text-slate-900">Piazza Grande, 12 - Arezzo (AR)</p>
                <p>Parcheggio convenzionato a 50 metri.</p>
                <p className="text-slate-400">Accesso disabili disponibile in tutta la struttura.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">
                  {showcase.customLabels.contactTitle || "Contattaci Direttamente"}
                </h4>
              </div>
              <div className="text-xs text-slate-600 space-y-1 pl-13">
                <p><strong>Telefono / WhatsApp:</strong> +39 0575 654321</p>
                <p><strong>Email:</strong> info@osteriatavoli.it</p>
                <p className="text-slate-400">Rispondiamo rapidamente durante gli orari di servizio.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer Elegante con Accesso Staff Nascosto */}
      <footer className="mt-auto bg-white border-t border-slate-200/90 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">{theme.restaurantName || "Osteria dei Tavoli"}</span>
            <span>— © {new Date().getFullYear()} Tutti i diritti riservati.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Accesso Area Riservata per Staff"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Area Riservata Staff</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
