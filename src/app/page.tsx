import React from "react";
import Link from "next/link";
import { prisma, ensureDatabase } from "@/lib/prisma";
import { getTenantConfig } from "@/lib/taaaac-core";
import { ShowcaseNavbar } from "@/components/public/ShowcaseNavbar";
import { PublicBookingWidget, PublicShiftData } from "@/components/public/PublicBookingWidget";
import { getTakeawaySettings } from "@/lib/takeaway-server";
import { parseShowcaseConfig, DEFAULT_HERO_COVER_IMAGE } from "@/lib/showcase-defaults";
import { caricaVetrinaUnificata } from "@/lib/anagrafica-attivita";
import { urlImmagineVetrina } from "@/lib/showcase-asset";
import { testoOrarioGiorno, raggruppaOrari, notaOrariPersonalizzata, GiornoSettimanaId } from "@/lib/orari-settimanali";
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
  Pizza,
  Flame,
  Beer,
  Heart,
  ChefHat,
  Navigation,
  ExternalLink,
  CalendarCheck,
} from "lucide-react";
import { ExperienceIconType, DEFAULT_TAVOLY_EXPERIENCES } from "@/lib/showcase-defaults";

export const dynamic = "force-dynamic";

function renderExperienceIcon(icon: ExperienceIconType) {
  switch (icon) {
    case "coffee":
      return <Coffee className="w-6 h-6" />;
    case "utensils":
      return <UtensilsCrossed className="w-6 h-6" />;
    case "glass":
      return <GlassWater className="w-6 h-6" />;
    case "wine":
      return <Wine className="w-6 h-6" />;
    case "pizza":
      return <Pizza className="w-6 h-6" />;
    case "flame":
      return <Flame className="w-6 h-6" />;
    case "beer":
      return <Beer className="w-6 h-6" />;
    case "heart":
      return <Heart className="w-6 h-6" />;
    case "chef":
      return <ChefHat className="w-6 h-6" />;
    case "sparkles":
    default:
      return <Sparkles className="w-6 h-6" />;
  }
}

export default async function PublicShowcasePage() {
  await ensureDatabase();
  const now = new Date();
  const todayDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(now);

  const [tenantConfig, rawShifts, todayReservations, takeawaySettings, vetrinaUnificata, todayExceptions] = await Promise.all([
    getTenantConfig(),
    prisma.serviceShift.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    }).catch(() => []),
    prisma.reservation.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        status: { not: "ANNULLATA" },
      },
    }).catch(() => []),
    getTakeawaySettings(),
    // Vetrina + dati dell'attivita' + orari ufficiali (fonte unica: Impostazioni > Ristorante)
    caricaVetrinaUnificata().catch(() => null),
    prisma.eccezioneCalendario.findMany({
      where: {
        data: todayDateStr,
      },
    }).catch(() => []),
  ]);

  const { theme } = tenantConfig;
  const showcase = vetrinaUnificata?.showcase ?? parseShowcaseConfig(undefined);
  const orariUfficiali = vetrinaUnificata?.orari.config;

  const rawHeroCoverUrl = showcase.hero.coverImageUrl || DEFAULT_HERO_COVER_IMAGE;
  const heroCoverUrl = urlImmagineVetrina(rawHeroCoverUrl, "hero");
  const hasHeroCover = Boolean(heroCoverUrl && heroCoverUrl.trim().length > 0);
  const overlayOpacity = showcase.hero.overlayOpacity ?? 75;

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

  // Orari Ufficiali di Apertura dell'Attività / Locale (Sincronizzati ovunque)
  const officialWeekday = showcase.contactInfo?.hoursWeekday || "Martedì - Venerdì: 11:00 - 15:00 / 17:00 - 23:00";
  const officialWeekend = showcase.contactInfo?.hoursWeekend || "Sabato e Domenica: 16:00 - 23:00";
  const hoursNote = showcase.contactInfo?.hoursNote || "";

  const weekdayLabel = officialWeekday.includes(":") ? officialWeekday.split(":")[0].trim() : "Martedì - Venerdì";
  const weekdayHours = officialWeekday.includes(":") ? officialWeekday.substring(officialWeekday.indexOf(":") + 1).trim() : officialWeekday;

  const weekendLabel = officialWeekend.includes(":") ? officialWeekend.split(":")[0].trim() : "Sabato e Domenica";
  const weekendHours = officialWeekend.includes(":") ? officialWeekend.substring(officialWeekend.indexOf(":") + 1).trim() : officialWeekend;

  // Calcolo Orario Odierno e Stato Apertura Dinamico
  const dayOfWeekName = new Intl.DateTimeFormat("it-IT", { weekday: "long", timeZone: "Europe/Rome" }).format(now);
  const todayDayNameCapitalized = dayOfWeekName.charAt(0).toUpperCase() + dayOfWeekName.slice(1);
  const isWeekend = dayOfWeekName === "sabato" || dayOfWeekName === "domenica";

  const timeParts = new Intl.DateTimeFormat("it-IT", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: "Europe/Rome",
  }).formatToParts(now);
  const currentHour = parseInt(timeParts.find((p) => p.type === "hour")?.value || "0", 10);
  const currentMin = parseInt(timeParts.find((p) => p.type === "minute")?.value || "0", 10);
  const currentMinutes = currentHour * 60 + currentMin;

  // Orario di oggi dalla configurazione settimanale ufficiale (giorno per giorno)
  const weekdayShort = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Europe/Rome" }).format(now);
  const ID_GIORNO: Record<string, GiornoSettimanaId> = {
    Mon: "lun", Tue: "mar", Wed: "mer", Thu: "gio", Fri: "ven", Sat: "sab", Sun: "dom",
  };
  const giornoOggi = orariUfficiali?.giorni[ID_GIORNO[weekdayShort] || "lun"];
  const righeOrari = orariUfficiali ? raggruppaOrari(orariUfficiali) : [];
  const notaOrari = orariUfficiali ? notaOrariPersonalizzata(orariUfficiali) : hoursNote;

  let todayScheduleText = giornoOggi ? testoOrarioGiorno(giornoOggi) : isWeekend ? weekendHours : weekdayHours;
  let isDayClosed = false;
  let closedReason = "";

  // 1. Controllo Eccezioni Calendario Straordinarie
  const todayException = todayExceptions?.[0];
  if (todayException) {
    if (!todayException.isAperto || todayException.tipo === "CHIUSURA") {
      isDayClosed = true;
      closedReason = todayException.note || todayException.titolo || "Chiusura Straordinaria";
      todayScheduleText = closedReason;
    } else if (todayException.orarioApertura && todayException.orarioChiusura) {
      todayScheduleText = `${todayException.orarioApertura} - ${todayException.orarioChiusura}`;
    }
  } else {
    // 2. Riposo settimanale ordinario (giorno segnato come chiuso negli orari ufficiali)
    if (giornoOggi && !giornoOggi.aperto) {
      isDayClosed = true;
      closedReason = "Chiuso per Riposo Settimanale";
      todayScheduleText = closedReason;
    }
  }

  // 3. Calcolo fasce orarie e badge in tempo reale
  let badgeText = "Aperto Oggi";
  let badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let dotColor = "bg-emerald-500";

  if (isDayClosed) {
    badgeText = "Chiuso Oggi";
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    dotColor = "bg-rose-500";
  } else {
    const timeRangeRegex = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/g;
    const ranges: { startMin: number; endMin: number; startStr: string; endStr: string }[] = [];
    let match;
    while ((match = timeRangeRegex.exec(todayScheduleText)) !== null) {
      const [, start, end] = match;
      const [sH, sM] = start.split(":").map(Number);
      const [eH, eM] = end.split(":").map(Number);
      ranges.push({
        startMin: sH * 60 + sM,
        endMin: eH * 60 + eM,
        startStr: start,
        endStr: end,
      });
    }

    if (ranges.length > 0) {
      const isCurrentlyOpen = ranges.some((r) => currentMinutes >= r.startMin && currentMinutes <= r.endMin);
      if (isCurrentlyOpen) {
        badgeText = "Aperto Adesso";
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
        dotColor = "bg-emerald-500";
      } else {
        const upcoming = ranges.find((r) => currentMinutes < r.startMin);
        if (upcoming) {
          badgeText = `Apre alle ${upcoming.startStr}`;
          badgeStyle = "bg-amber-50 text-amber-800 border-amber-300 font-bold";
          dotColor = "bg-amber-500";
        } else {
          badgeText = "Chiuso Adesso";
          badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 font-medium";
          dotColor = "bg-slate-400";
        }
      }
    }
  }

  const heroNoteTitle = (showcase.customLabels?.heroCardNoteTitle || "").trim();
  const heroNoteDesc = (showcase.customLabels?.heroCardNoteDesc || "").trim();
  const hasHeroNote = Boolean(heroNoteTitle || heroNoteDesc);

  const showActivityHours = showcase.sections?.showHours !== false;
  const mostraIndirizzo = showcase.sections?.showAddress !== false;
  const mostraTelefono = showcase.sections?.showPhone !== false;
  const mostraEmail = showcase.sections?.showEmail !== false;
  const mostraContatti = showcase.sections?.showContact !== false && (mostraTelefono || mostraEmail);
  const colonneInfo = (showActivityHours ? 1 : 0) + (mostraIndirizzo ? 1 : 0) + (mostraContatti ? 1 : 0);
  const classeColonneInfo = colonneInfo >= 3 ? "md:grid-cols-3" : colonneInfo === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar Pubblica con discreto link staff */}
      <ShowcaseNavbar tenantConfig={tenantConfig} takeawayEnabled={takeawaySettings.enabled} showMenuLink={showcase.sections?.showMenuLink !== false} />

      {/* Hero Section */}
      {showcase.sections.showHero && (
        <section className="relative py-16 md:py-24 overflow-hidden border-b border-slate-200/80">
          {/* Foto Copertina Hero Panoramica con Overlay Regolabile */}
          {hasHeroCover ? (
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroCoverUrl}
                alt="Hero Cover Ristorante"
                className="w-full h-full object-cover object-center"
              />
              <div
                className="absolute inset-0 bg-slate-950"
                style={{ opacity: overlayOpacity / 100 }}
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
                {/* Badge Link Menù Digitale nella Vetrina se attivo */}
                {showcase.sections?.showMenuLink !== false && (
                  <div className="flex justify-center lg:justify-start">
                    <Link
                      href="/menu"
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all shadow-xs hover:scale-105 ${
                        hasHeroCover
                          ? "bg-white/15 text-white hover:bg-white/25 border-white/30 backdrop-blur-md"
                          : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200"
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Menù Digitale &amp; Specialità</span>
                      <span className="text-[10px] font-normal opacity-80">Sfoglia &rarr;</span>
                    </Link>
                  </div>
                )}

                <h1
                  className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight ${
                    hasHeroCover ? "text-white" : "text-slate-900"
                  }`}
                >
                  {showcase.hero.title}
                </h1>

                <p
                  className={`text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 ${
                    hasHeroCover ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  {showcase.hero.subtitle}
                </p>

                {/* Pulsanti Azione Principali: Prenota Tavolo / Ordina Asporto */}
                <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <Link
                    href="/prenotazione"
                    style={{ backgroundColor: showcase.primaryColor || "#064e3b" }}
                    className="px-6 py-3.5 text-sm sm:text-base font-bold text-white shadow-md inline-flex items-center gap-2 rounded-xl hover:opacity-95 transition"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    <span>{showcase.hero.ctaPrimaryText || "Prenota un Tavolo"}</span>
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

                  {(!takeawaySettings.enabled || !showcase.sections.showTakeawayCta) && (
                    <a
                      href="#servizi"
                      className="px-6 py-3.5 text-sm sm:text-base font-bold rounded-xl border transition shadow-xs inline-flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 border-slate-200/80 backdrop-blur-xs"
                    >
                      <span>I Nostri Servizi &amp; Specialità</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                    </a>
                  )}
                </div>

                {/* Badges di affidabilità */}
                {showcase.sections.showTrustBadges && showcase.trustBadges?.length > 0 && (
                  <div
                    className={`pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t max-w-lg mx-auto lg:mx-0 text-left ${
                      hasHeroCover ? "border-white/10" : "border-slate-200/80"
                    }`}
                  >
                    {showcase.trustBadges.map((tb) => (
                      <div
                        key={tb.id}
                        className={`flex items-center gap-2 p-2 rounded-lg ${
                          hasHeroCover ? "bg-slate-900/60 border border-slate-800" : ""
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span
                          className={`text-xs font-semibold ${
                            hasHeroCover ? "text-slate-200" : "text-slate-700"
                          }`}
                        >
                          {tb.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Visual Showcase Preview / Card Turni Live Dinamica */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md">
                  <div className="taaaac-card p-6 bg-white/95 backdrop-blur-md shadow-2xl border border-white/30 relative z-10 space-y-4 rounded-3xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: showcase.primaryColor || "#064e3b" }}
                        >
                          LIVE
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{showcase.customLabels?.heroCardTitle || "Ospitalità & Sala"}</h4>
                          <p className="text-[11px] text-slate-500">{showcase.customLabels?.heroCardSubtitle || "Tavoli in tempo reale"}</p>
                        </div>
                      </div>
                      <span className={`taaaac-badge font-bold text-xs px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${badgeStyle}`}>
                        <span className={`w-2 h-2 rounded-full ${dotColor} ${badgeStyle.includes("font-bold") ? "animate-pulse" : ""}`} />
                        <span>{badgeText}</span>
                      </span>
                    </div>

                    {showActivityHours && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Orario di Oggi ({todayDayNameCapitalized})</span>
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                          {todayScheduleText}
                        </div>
                        {righeOrari.length > 0 ? (
                          <div className="pt-2 border-t border-slate-200/70 space-y-1 text-[11px] text-slate-500">
                            {righeOrari.map((r) => (
                              <div key={r.label} className="flex items-baseline justify-between gap-3">
                                <span className="font-semibold text-slate-700 text-left">{r.label}</span>
                                <span className="text-right">{r.orario}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                        <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                          <div className="text-left truncate">
                            <span className="font-semibold block text-slate-700 truncate">{weekdayLabel}</span>
                            <span className="truncate block">{weekdayHours}</span>
                          </div>
                          <div className="text-right truncate">
                            <span className="font-semibold block text-slate-700 truncate">{weekendLabel}</span>
                            <span className="truncate block">{weekendHours}</span>
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {hasHeroNote && (
                      <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950 space-y-1">
                        {heroNoteTitle && (
                          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            {heroNoteTitle}
                          </p>
                        )}
                        {heroNoteDesc && (
                          <p className="text-emerald-800 leading-relaxed text-[11px]">
                            {heroNoteDesc}
                          </p>
                        )}
                      </div>
                    )}
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
            {showcase.gallery.images.map((img, idx) => (
              <div
                key={img.id || idx}
                className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/90 shadow-xs aspect-4/3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={urlImmagineVetrina(img.url, "gallery", img.id || String(idx))}
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
            {(showcase.experiences && showcase.experiences.length > 0 ? showcase.experiences : DEFAULT_TAVOLY_EXPERIENCES).map((exp) => (
              <div key={exp.id} className="taaaac-card space-y-3 hover:shadow-md transition-shadow">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: `${showcase.accentColor || "#059669"}18`,
                    color: showcase.accentColor || "#059669",
                  }}
                >
                  {renderExperienceIcon(exp.icon)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{exp.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sezione La Nostra Cucina / Filosofia */}
      {showcase.sections.showAbout && (
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
            {showcase.customLabels?.bookingCtaTitle || "Prenota il tuo Tavolo in pochi secondi"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {showcase.customLabels?.bookingCtaSubtitle || "Scegli il turno, l'orario e i coperti desiderati. Riceverai la conferma immediata della sala e il promemoria su WhatsApp."}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/prenotazione"
              style={{ backgroundColor: showcase.primaryColor || "#064e3b" }}
              className="text-white px-8 py-3.5 text-sm font-bold shadow-md inline-flex items-center gap-2 rounded-xl transition hover:opacity-95"
            >
              <span>{showcase.customLabels?.bookingCtaButton || "Apri Form Prenotazione"}</span>
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
      {(colonneInfo > 0 || Boolean(showcase.sections?.showLocationMap)) && (
        <section id="contatti" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`taaaac-card bg-white p-8 grid grid-cols-1 ${classeColonneInfo} gap-8 ${colonneInfo === 0 ? "hidden" : ""}`}>
            {showcase.sections.showHours && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">
                    {showcase.customLabels.hoursTitle || "Orari di Apertura"}
                  </h4>
                </div>
                <div className="text-xs text-slate-600 space-y-1 pl-13">
                  {righeOrari.length > 0 ? (
                    <>
                      {righeOrari.map((r) => (
                        <p key={r.label}><strong>{r.label}:</strong> {r.orario}</p>
                      ))}
                      {notaOrari && <p className="text-slate-400">{notaOrari}</p>}
                    </>
                  ) : (
                    <>
                      {showcase.contactInfo?.hoursWeekday && <p>{showcase.contactInfo.hoursWeekday}</p>}
                      {showcase.contactInfo?.hoursWeekend && <p>{showcase.contactInfo.hoursWeekend}</p>}
                      {showcase.contactInfo?.hoursNote && <p className="text-slate-400">{showcase.contactInfo.hoursNote}</p>}
                    </>
                  )}
                </div>
              </div>
            )}

            {mostraIndirizzo && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900">{showcase.customLabels?.locationTitle || "Posizione & Location"}</h4>
              </div>
              <div className="text-xs text-slate-600 space-y-1 pl-13">
                <p className="font-semibold text-slate-900">{showcase.contactInfo?.address || "Piazza Grande, 12 - Arezzo (AR)"}</p>
                {showcase.contactInfo?.addressNote && (
                  <p>{showcase.contactInfo.addressNote}</p>
                )}
              </div>
            </div>
            )}

            {mostraContatti && (
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
                {mostraTelefono && (
                  <p><strong>Telefono / WhatsApp:</strong> {showcase.contactInfo?.phone || tenantConfig.contact?.phone || "+39 0575 654321"}</p>
                )}
                {mostraEmail && (
                  <p><strong>Email:</strong> {showcase.contactInfo?.email || tenantConfig.contact?.email || "info@osteriatavoli.it"}</p>
                )}
                {(showcase.contactInfo?.responseNote !== undefined ? showcase.contactInfo.responseNote : "Rispondiamo rapidamente durante gli orari di servizio.") && (
                  <p className="text-slate-400">{showcase.contactInfo?.responseNote || "Rispondiamo rapidamente durante gli orari di servizio."}</p>
                )}
              </div>
            </div>
            )}
          </div>

          {Boolean(showcase.sections?.showLocationMap) && (
            <div className="mt-8 taaaac-card bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Posizione &amp; Pianta del Locale
                    </h4>
                    <p className="text-xs text-slate-500">
                      Come raggiungerci e organizzazione degli spazi
                    </p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    showcase.contactInfo?.address || theme.restaurantName || "Piazza Grande, 12 Arezzo"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors self-start sm:self-auto"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Indicazioni Stradali</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50">
                {(() => {
                  const rawEmbed = (showcase.contactInfo?.mapEmbed || "").trim();
                  const targetAddress = showcase.contactInfo?.address || "Piazza Grande, 12 - Arezzo (AR)";

                  // 1. Tag iframe completo inserito dall'utente (<iframe ... src="...">)
                  if (rawEmbed.startsWith("<iframe")) {
                    const srcMatch = rawEmbed.match(/src=["']([^"']+)["']/i);
                    const iframeSrc = srcMatch ? srcMatch[1] : null;
                    if (iframeSrc) {
                      return (
                        <iframe
                          src={iframeSrc}
                          className="w-full h-80 sm:h-96 border-0"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      );
                    }
                  }

                  // 2. Immagine piantina del locale (.png, .jpg, .jpeg, .webp, .svg, data:image/)
                  if (
                    rawEmbed.endsWith(".png") ||
                    rawEmbed.endsWith(".jpg") ||
                    rawEmbed.endsWith(".jpeg") ||
                    rawEmbed.endsWith(".webp") ||
                    rawEmbed.endsWith(".svg") ||
                    rawEmbed.startsWith("data:image/")
                  ) {
                    return (
                      <div className="p-4 bg-slate-100/60 flex flex-col items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urlImmagineVetrina(rawEmbed, "map")}
                          alt="Pianta del locale"
                          className="w-full max-h-96 object-contain rounded-xl"
                        />
                        <div className="mt-2 text-center text-xs text-slate-500 font-medium">
                          Piantina delle sale e disposizione tavoli
                        </div>
                      </div>
                    );
                  }

                  // 3. Link HTTP / HTTPS diretto
                  if (rawEmbed.startsWith("http://") || rawEmbed.startsWith("https://")) {
                    // Se è un link condivisibile di Google Maps (che ha X-Frame-Options SAMEORIGIN), converti in embed
                    if (
                      rawEmbed.includes("google.com/maps") ||
                      rawEmbed.includes("maps.app.goo.gl") ||
                      rawEmbed.includes("goo.gl/maps")
                    ) {
                      const safeEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(targetAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                      return (
                        <iframe
                          src={safeEmbedUrl}
                          className="w-full h-80 sm:h-96 border-0"
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      );
                    }

                    return (
                      <iframe
                        src={rawEmbed}
                        className="w-full h-80 sm:h-96 border-0"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    );
                  }

                  // 4. Default automatico: Google Maps basato sull'indirizzo ufficiale del locale!
                  const safeEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(targetAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                  return (
                    <iframe
                      src={safeEmbedUrl}
                      className="w-full h-80 sm:h-96 border-0"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  );
                })()}
              </div>
            </div>
          )}
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
