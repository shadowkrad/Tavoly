"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface PresetCampagna {
  id: string;
  nome: string;
  kicker?: string;
  titolo: string;
  sottotitolo: string;
  badge: string;
  temaAI: string;
}

interface Attivita {
  nome: string;
  indirizzo: string;
  citta: string;
  telefono: string;
  logoUrl: string | null;
  qrVetrinaDataUrl: string;
  colorePrimario: string;
  coloreSecondario: string;
}

type FormatoId = "STORIA" | "POST" | "VOLANTINO";
type StileId = "GLASS" | "MODERN" | "SPLIT";

const STILI: Array<{ id: StileId; nome: string; icona: string; desc: string }> = [
  { id: "GLASS", nome: "Gourmet & Luxury", icona: "👑", desc: "Cornice oro fine dining, sigillo di classe e simmetria elegante" },
  { id: "MODERN", nome: "Social Impact", icona: "⚡", desc: "Foto viva a tutto schermo, titolo bold cinematografico e badge neon" },
  { id: "SPLIT", nome: "Poster & Volantino", icona: "📄", desc: "Finestra fotografica e fascia promozionale, perfetto da stampare" },
];

type AccentoId = "ORO" | "SMERALDO" | "RUBINO" | "ZAFFIRO" | "ROSA";

const ACCENTI: Record<AccentoId, { nome: string; a: string; b: string; dark: string; textCol: string }> = {
  ORO: { nome: "Oro Reale", a: "#fbbf24", b: "#d97706", dark: "#451a03", textCol: "#0f172a" },
  SMERALDO: { nome: "Smeraldo", a: "#34d399", b: "#059669", dark: "#064e3b", textCol: "#0f172a" },
  RUBINO: { nome: "Rubino", a: "#f87171", b: "#dc2626", dark: "#450a0a", textCol: "#ffffff" },
  ZAFFIRO: { nome: "Zaffiro", a: "#60a5fa", b: "#2563eb", dark: "#172554", textCol: "#ffffff" },
  ROSA: { nome: "Rosa Chic", a: "#f472b6", b: "#db2777", dark: "#500724", textCol: "#ffffff" },
};

const FORMATI: Record<FormatoId, { nome: string; w: number; h: number; ratio: "1:1" | "9:16" | "3:4"; hint: string }> = {
  STORIA: { nome: "Storia", w: 1080, h: 1920, ratio: "9:16", hint: "Stati WhatsApp, Storie Instagram e Facebook (9:16)" },
  POST: { nome: "Post Feed", w: 1080, h: 1080, ratio: "1:1", hint: "Feed Instagram, Facebook e Google Business (1:1)" },
  VOLANTINO: { nome: "Volantino A4", w: 1240, h: 1754, ratio: "3:4", hint: "Stampa da banco, cavalieri segnatavolo o vetrina (A4)" },
};

const SFUMATURE_BASE: Array<{ id: string; nome: string; a?: string; b?: string }> = [
  { id: "p", nome: "Colore attività" },
  { id: "notte", nome: "Notte profonda", a: "#090d16", b: "#1e293b" },
  { id: "caldo", nome: "Rame & Ambra", a: "#431407", b: "#9a3412" },
  { id: "bosco", nome: "Verde Bosco", a: "#022c22", b: "#065f46" },
  { id: "antracite", nome: "Minimal Black", a: "#000000", b: "#18181b" },
];

function righe(testo: string, maxCaratteri: number, maxRighe: number): string[] {
  const parole = testo.trim().split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const p of parole) {
    if ((cur + " " + p).trim().length > maxCaratteri && cur) {
      out.push(cur);
      cur = p;
    } else cur = (cur + " " + p).trim();
  }
  if (cur) out.push(cur);
  if (out.length > maxRighe) {
    const t = out.slice(0, maxRighe);
    t[maxRighe - 1] = t[maxRighe - 1].replace(/.{0,2}$/, "…");
    return t;
  }
  return out;
}

async function aDataUrl(url: string): Promise<string | null> {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = () => res(null);
      fr.readAsDataURL(b);
    });
  } catch {
    return null;
  }
}

export default function StudioGrafico({ settore, presets }: { settore: string; presets: PresetCampagna[] }) {
  const [att, setAtt] = useState<Attivita | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [formato, setFormato] = useState<FormatoId>("POST");
  const [stile, setStile] = useState<StileId>("GLASS");
  const [accento, setAccento] = useState<AccentoId>("ORO");
  const [kicker, setKicker] = useState(presets[0]?.kicker || "✦ EDIZIONE SPECIALE ✦");
  const [titolo, setTitolo] = useState(presets[0]?.titolo || "");
  const [sottotitolo, setSottotitolo] = useState(presets[0]?.sottotitolo || "");
  const [badge, setBadge] = useState(presets[0]?.badge || "");
  const [mostraQr, setMostraQr] = useState(true);
  const [mostraLogo, setMostraLogo] = useState(true);
  const [scurezzaSfondo, setScurezzaSfondo] = useState(35); // 10% - 80%
  const [sfum, setSfum] = useState("p");
  const [sfondoAI, setSfondoAI] = useState<string | null>(null);
  const [temaAI, setTemaAI] = useState(presets[0]?.temaAI || "");
  const [vistaMockup, setVistaMockup] = useState(false);
  const [stato, setStato] = useState<{ tipo: "ok" | "err" | "carico"; testo: string } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    fetch("/api/carta-grafica")
      .then((r) => r.json())
      .then(async (d) => {
        if (d?.attivita) {
          setAtt(d.attivita);
          if (d.attivita.logoUrl) setLogo(await aDataUrl(d.attivita.logoUrl));
        }
      })
      .catch(() => setStato({ tipo: "err", testo: "Non riesco a leggere i dati dell'attività" }));
  }, []);

  const f = FORMATI[formato];
  const acc = ACCENTI[accento];

  const colA = useMemo(() => {
    const s = SFUMATURE_BASE.find((x) => x.id === sfum);
    return s && s.a ? s.a : att?.colorePrimario || "#0f172a";
  }, [sfum, att]);

  const colB = useMemo(() => {
    const s = SFUMATURE_BASE.find((x) => x.id === sfum);
    return s && s.b ? s.b : att?.coloreSecondario || "#1e293b";
  }, [sfum, att]);

  function applicaPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setKicker(p.kicker || "✦ PROMOZIONE ESCLUSIVA ✦");
    setTitolo(p.titolo);
    setSottotitolo(p.sottotitolo);
    setBadge(p.badge);
    setTemaAI(p.temaAI);
  }

  async function generaAI() {
    setStato({ tipo: "carico", testo: "Sto generando lo sfondo fotografico con l'AI… (fino a 30s)" });
    try {
      const r = await fetch("/api/marketing/creative-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settore, tema: temaAI || titolo, formato: f.ratio }),
      });
      const d = await r.json();
      if (d?.ok && d.dataBase64) {
        setSfondoAI(`data:${d.mime || "image/png"};base64,${d.dataBase64}`);
        setStato({ tipo: "ok", testo: `Sfondo creato con successo! Generazioni rimaste oggi: ${d.restanti ?? "?"}` });
      } else if (d?.code === "NON_CONFIGURATO") {
        setStato({ tipo: "err", testo: "Chiave Google AI non configurata sul server Core. Puoi comunque usare le sfumature eleganti." });
      } else {
        setStato({ tipo: "err", testo: d?.message || "Non sono riuscito a creare lo sfondo, riprova tra poco." });
      }
    } catch {
      setStato({ tipo: "err", testo: "Collegamento non riuscito, riprova tra poco." });
    }
  }

  function svgString(): string {
    const el = svgRef.current;
    if (!el) return "";
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    clone.setAttribute("width", String(f.w));
    clone.setAttribute("height", String(f.h));
    return new XMLSerializer().serializeToString(clone);
  }

  async function aPng(): Promise<Blob | null> {
    const svg = svgString();
    if (!svg) return null;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("img"));
        img.src = url;
      });
      const c = document.createElement("canvas");
      c.width = f.w;
      c.height = f.h;
      c.getContext("2d")!.drawImage(img, 0, 0, f.w, f.h);
      return await new Promise((res) => c.toBlob((b) => res(b), "image/png"));
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function scarica() {
    const b = await aPng();
    if (!b) return setStato({ tipo: "err", testo: "Non riesco a preparare l'immagine." });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = `${(att?.nome || "locandina").replace(/[^\w]+/g, "-").toLowerCase()}-${formato.toLowerCase()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function condividi() {
    const b = await aPng();
    if (!b) return setStato({ tipo: "err", testo: "Non riesco a preparare l'immagine." });
    const file = new File([b], "locandina.png", { type: "image/png" });
    const nav: any = navigator;
    if (nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: titolo });
      } catch {}
    } else {
      setStato({ tipo: "err", testo: "Condivisione diretta non supportata dal browser: usa «Scarica» e inviala su WhatsApp." });
    }
  }

  function stampa() {
    const svg = svgString();
    const w = window.open("", "_blank");
    if (!w) return setStato({ tipo: "err", testo: "Consenti le finestre pop-up per stampare." });
    w.document.write(
      "<!doctype html><html><head><title>Locandina</title><style>@page{size:A4;margin:0}html,body{margin:0}svg{width:100vw;height:auto;max-height:100vh}</style></head><body>" +
        svg +
        "<scr" +
        "ipt>window.onload=function(){setTimeout(function(){window.print()},300)}</scr" +
        "ipt></body></html>"
    );
    w.document.close();
  }

  // --- CALCOLI TIPOGRAFICI E GEOMETRICI PROPORZIONATI ---
  const isStory = formato === "STORIA";
  const isVolantino = formato === "VOLANTINO";
  const big = f.w >= 1240 ? 1.15 : 1;

  // Safe area per evitare barre social (Storie Instagram / WhatsApp)
  const safeTop = isStory ? 200 : 70;
  const safeBottom = isStory ? 250 : 70;

  // Font Stack con fallback universali solidi
  const FONT_DISPLAY = "Cinzel, 'Playfair Display', Didot, 'Times New Roman', Georgia, serif";
  const FONT_SANS = "'Plus Jakarta Sans', Montserrat, 'Segoe UI', system-ui, -apple-system, sans-serif";

  // Dimensioni proporzionate
  const dimTitolo = (stile === "SPLIT" ? 78 : isStory ? 94 : 84) * big;
  const dimSotto = (stile === "SPLIT" ? 34 : isStory ? 38 : 34) * big;

  const titoloRighe = righe(titolo.toUpperCase(), stile === "SPLIT" || isStory ? 16 : 22, stile === "SPLIT" ? 3 : 4);
  const sottoRighe = righe(sottotitolo, stile === "SPLIT" || isStory ? 28 : 36, 3);
  const nomeRiga = righe(att?.nome || "", 26, 2);
  const contatti = [att?.indirizzo, att?.citta, att?.telefono ? `Tel. ${att.telefono}` : ""].filter(Boolean).join(" · ");

  const hTitolo = titoloRighe.length * dimTitolo * 1.15;
  const hSotto = sottoRighe.length * dimSotto * 1.35;
  const logoH = mostraLogo && logo ? (isStory ? 140 : 110) : 0;
  const wBadge = Math.min(680, Math.max(260, 80 + badge.length * 36));

  // Opacità oscuramento sfondo (calcolato da slider)
  const darkAlpha = scurezzaSfondo / 100;

  // Componente Sigillo / Badge Prezzo Regale
  const renderBadge = (cx: number, cy: number, scale = 1) => {
    if (!badge) return null;
    return (
      <g transform={`translate(${cx}, ${cy}) scale(${scale})`} filter="url(#glow-shadow)">
        {/* Glow dorato soffuso di sfondo */}
        <rect
          x={-wBadge / 2 - 4}
          y={-50}
          width={wBadge + 8}
          height={100}
          rx={50}
          fill={acc.b}
          opacity="0.3"
        />
        {/* Pill principale sfumata */}
        <rect
          x={-wBadge / 2}
          y={-46}
          width={wBadge}
          height={92}
          rx={46}
          fill="url(#acc-grad)"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeOpacity="0.6"
        />
        {/* Micro riflesso superiore */}
        <path
          d={`M ${-wBadge / 2 + 25} -44 Q 0 -36 ${wBadge / 2 - 25} -44`}
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeOpacity="0.7"
          fill="none"
        />
        {/* Testo in contrasto perfetto */}
        <text
          textAnchor="middle"
          y={15}
          fontSize={44 * big}
          fontWeight="900"
          fill={acc.textCol}
          fontFamily={FONT_SANS}
          letterSpacing="1.5"
        >
          {badge.slice(0, 24)}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Intestazione Rapida */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🎨</span> Studio Grafico & Pubblicità AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Crea locandine di qualità editoriale con sfondi fotografici generati dall&apos;AI di Google e tipografia pronta da condividere o stampare.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_390px] gap-6 items-start">
        {/* COLONNA SINISTRA: ANTEPRIMA GRAFICA */}
        <div className="space-y-4">
          {/* Selettore Formato Rapido */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FORMATI) as FormatoId[]).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    setFormato(k);
                    setSfondoAI(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    formato === k
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span>{k === "STORIA" ? "📱" : k === "POST" ? "🖼️" : "📄"}</span>
                  {FORMATI[k].nome}
                </button>
              ))}
            </div>

            <button
              onClick={() => setVistaMockup(!vistaMockup)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                vistaMockup
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {vistaMockup ? "📱 Vista Dispositivo" : "👁️ Vista Pura"}
            </button>
          </div>

          {/* Area Canvas SVG */}
          <div className="bg-slate-950/5 border border-slate-200/80 rounded-3xl p-4 sm:p-8 flex items-center justify-center min-h-[500px]">
            <div
              className={`transition-all duration-300 ${
                vistaMockup && isStory
                  ? "p-3 bg-slate-900 rounded-[50px] shadow-2xl border-[6px] border-slate-800"
                  : "drop-shadow-2xl"
              }`}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${f.w} ${f.h}`}
                className="w-full h-auto rounded-2xl select-none"
                style={{
                  maxHeight: "72vh",
                  maxWidth: formato === "POST" ? 540 : formato === "STORIA" ? 340 : 440,
                }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradiente dinamico dell'accento */}
                  <linearGradient id="acc-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={acc.a} />
                    <stop offset="100%" stopColor={acc.b} />
                  </linearGradient>

                  {/* Sfondo predefinito */}
                  <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colA} />
                    <stop offset="100%" stopColor={colB} />
                  </linearGradient>

                  {/* Vignettatura cinematografica: centro pulito per foto, estremità scure per testo */}
                  <linearGradient id="vignette-cinema" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" stopOpacity={darkAlpha + 0.25} />
                    <stop offset="25%" stopColor="#000000" stopOpacity={darkAlpha * 0.4} />
                    <stop offset="65%" stopColor="#000000" stopOpacity={darkAlpha * 0.6} />
                    <stop offset="100%" stopColor="#000000" stopOpacity={Math.min(0.95, darkAlpha + 0.45)} />
                  </linearGradient>

                  {/* Ombra di rilievo ad altissima definizione per i testi */}
                  <filter id="txt-shadow-pro" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.85" />
                    <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.95" />
                  </filter>

                  {/* Ombre morbide elevate per card e badge */}
                  <filter id="glow-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="14" floodColor="#000000" floodOpacity="0.55" />
                  </filter>

                  {/* Clip path per lo stile split */}
                  <clipPath id="split-top-clip">
                    <rect x="0" y="0" width={f.w} height={f.h * 0.54} />
                  </clipPath>
                </defs>

                {/* 1. SFONDO (Foto AI oppure Sfumatura Brand) */}
                <rect width={f.w} height={f.h} fill="url(#bg-grad)" />

                {sfondoAI && stile !== "SPLIT" && (
                  <>
                    <image href={sfondoAI} x="0" y="0" width={f.w} height={f.h} preserveAspectRatio="xMidYMid slice" />
                    <rect width={f.w} height={f.h} fill="url(#vignette-cinema)" />
                  </>
                )}

                {/* 2. RENDER DELLO STILE SELEZIONATO */}

                {/* STILE 1: GOURMET & LUXURY (Cornice Oro & Eleganza Stellata) */}
                {stile === "GLASS" && (
                  <g>
                    {/* Doppia Cornice Editoriale Sottile */}
                    <rect
                      x="40"
                      y="40"
                      width={f.w - 80}
                      height={f.h - 80}
                      rx="24"
                      fill="none"
                      stroke="url(#acc-grad)"
                      strokeWidth="2.5"
                      strokeOpacity="0.85"
                    />
                    <rect
                      x="52"
                      y="52"
                      width={f.w - 104}
                      height={f.h - 104}
                      rx="18"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1"
                      strokeOpacity="0.3"
                    />

                    {/* Logo in Alto Centrato */}
                    {mostraLogo && logo && (
                      <image
                        href={logo}
                        x={f.w / 2 - logoH / 2}
                        y={safeTop + 10}
                        width={logoH}
                        height={logoH}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}

                    {/* Occhiello / Kicker Superiore con Micro-Diamanti */}
                    {kicker && (
                      <g transform={`translate(${f.w / 2}, ${safeTop + logoH + (logoH ? 40 : 20)})`}>
                        <text
                          textAnchor="middle"
                          fontSize={26 * big}
                          fontWeight="700"
                          fill={acc.a}
                          fontFamily={FONT_SANS}
                          letterSpacing="4"
                          filter="url(#txt-shadow-pro)"
                        >
                          {kicker}
                        </text>
                      </g>
                    )}

                    {/* Titolo Principale Monumentale */}
                    {titoloRighe.map((r, i) => (
                      <text
                        key={i}
                        x={f.w / 2}
                        y={safeTop + logoH + (logoH ? 90 : 70) + dimTitolo + i * dimTitolo * 1.15}
                        textAnchor="middle"
                        fontSize={dimTitolo}
                        fontWeight="900"
                        fill="#ffffff"
                        fontFamily={FONT_DISPLAY}
                        letterSpacing="3"
                        filter="url(#txt-shadow-pro)"
                      >
                        {r}
                      </text>
                    ))}

                    {/* Linea Divisoria con Diamante Dorato */}
                    <g transform={`translate(${f.w / 2}, ${safeTop + logoH + (logoH ? 90 : 70) + hTitolo + 30})`}>
                      <line x1="-140" y1="0" x2="140" y2="0" stroke="url(#acc-grad)" strokeWidth="2" strokeOpacity="0.7" />
                      <rect x="-6" y="-6" width="12" height="12" transform="rotate(45)" fill={acc.a} />
                    </g>

                    {/* Sottotitolo Raffinato */}
                    {sottoRighe.map((r, i) => (
                      <text
                        key={i}
                        x={f.w / 2}
                        y={safeTop + logoH + (logoH ? 90 : 70) + hTitolo + 80 + i * dimSotto * 1.3}
                        textAnchor="middle"
                        fontSize={dimSotto}
                        fill="#f8fafc"
                        fontFamily={FONT_SANS}
                        letterSpacing="1"
                        filter="url(#txt-shadow-pro)"
                      >
                        {r}
                      </text>
                    ))}

                    {/* Badge Prezzo Centrato */}
                    {renderBadge(f.w / 2, safeTop + logoH + (logoH ? 90 : 70) + hTitolo + hSotto + 130)}
                  </g>
                )}

                {/* STILE 2: SOCIAL IMPACT (Look Moderno, Foto Viva e Titolo Bold) */}
                {stile === "MODERN" && (
                  <g>
                    {/* Header: Logo a sinistra o pill in alto */}
                    {mostraLogo && logo && (
                      <image
                        href={logo}
                        x="70"
                        y={safeTop}
                        width={logoH}
                        height={logoH}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}

                    {/* Kicker a Pill Moderna */}
                    {kicker && (
                      <g transform={`translate(70, ${safeTop + logoH + (logoH ? 30 : 0)})`}>
                        <rect x="0" y="0" width={Math.min(600, kicker.length * 18 + 36)} height="46" rx="23" fill={acc.a} opacity="0.95" />
                        <text x="18" y="29" fontSize="20" fontWeight="900" fill={acc.textCol} fontFamily={FONT_SANS} letterSpacing="2">
                          {kicker}
                        </text>
                      </g>
                    )}

                    {/* Titolo Principale a Tutta Pagina a Sinistra */}
                    {titoloRighe.map((r, i) => (
                      <text
                        key={i}
                        x="70"
                        y={safeTop + logoH + (logoH ? 90 : 60) + (kicker ? 30 : 0) + dimTitolo + i * dimTitolo * 1.1}
                        fontSize={dimTitolo * 1.05}
                        fontWeight="900"
                        fill="#ffffff"
                        fontFamily={FONT_SANS}
                        letterSpacing="1"
                        filter="url(#txt-shadow-pro)"
                      >
                        {r}
                      </text>
                    ))}

                    {/* Sottotitolo fluido */}
                    {sottoRighe.map((r, i) => (
                      <text
                        key={i}
                        x="70"
                        y={safeTop + logoH + (logoH ? 90 : 60) + (kicker ? 30 : 0) + hTitolo + 40 + i * dimSotto * 1.3}
                        fontSize={dimSotto}
                        fontWeight="600"
                        fill="#f1f5f9"
                        fontFamily={FONT_SANS}
                        filter="url(#txt-shadow-pro)"
                      >
                        {r}
                      </text>
                    ))}

                    {/* Badge Prezzo allineato a sinistra */}
                    {renderBadge(70 + wBadge / 2, safeTop + logoH + (logoH ? 90 : 60) + (kicker ? 30 : 0) + hTitolo + hSotto + 90)}
                  </g>
                )}

                {/* STILE 3: POSTER & VOLANTINO (Split con Foto Inquadrata e Fascia Info Pura) */}
                {stile === "SPLIT" && (
                  <g>
                    {/* Foto inquadrata in alto con angoli stondati */}
                    {sfondoAI && (
                      <g clipPath="url(#split-top-clip)">
                        <image href={sfondoAI} x="0" y="0" width={f.w} height={f.h * 0.54} preserveAspectRatio="xMidYMid slice" />
                        <rect x="0" y="0" width={f.w} height={f.h * 0.54} fill="#000" opacity={darkAlpha * 0.4} />
                      </g>
                    )}

                    {/* Fascia Inferiore Piena ad Alto Contrasto */}
                    <rect x="0" y={f.h * 0.52} width={f.w} height={f.h * 0.48} fill={colA} />

                    {/* Nastro/Separatore Sfumato */}
                    <rect x="0" y={f.h * 0.52} width={f.w} height="10" fill="url(#acc-grad)" />

                    {/* Badge a Cavallo tra Foto e Fascia */}
                    {renderBadge(f.w / 2, f.h * 0.52, 1.05)}

                    {/* Logo dentro la fascia o sulla foto */}
                    {mostraLogo && logo && (
                      <image
                        href={logo}
                        x="60"
                        y={f.h * 0.52 + 40}
                        width="90"
                        height="90"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    )}

                    {/* Kicker dentro la fascia */}
                    {kicker && (
                      <text
                        x="60"
                        y={f.h * 0.52 + 155}
                        fontSize="22"
                        fontWeight="800"
                        fill={acc.a}
                        fontFamily={FONT_SANS}
                        letterSpacing="3"
                      >
                        {kicker}
                      </text>
                    )}

                    {/* Titolo dentro la fascia */}
                    {titoloRighe.map((r, i) => (
                      <text
                        key={i}
                        x="60"
                        y={f.h * 0.52 + 195 + dimTitolo * 0.85 + i * dimTitolo * 1.1}
                        fontSize={dimTitolo * 0.95}
                        fontWeight="900"
                        fill="#ffffff"
                        fontFamily={FONT_DISPLAY}
                        letterSpacing="2"
                      >
                        {r}
                      </text>
                    ))}

                    {/* Sottotitolo dentro la fascia */}
                    {sottoRighe.map((r, i) => (
                      <text
                        key={i}
                        x="60"
                        y={f.h * 0.52 + 205 + hTitolo + i * dimSotto * 1.3}
                        fontSize={dimSotto}
                        fill="#e2e8f0"
                        fontFamily={FONT_SANS}
                      >
                        {r}
                      </text>
                    ))}
                  </g>
                )}

                {/* 3. FOOTER UNIVERSALE (QR Code & Contatti Attività) */}
                {/* QR Code in Card Elegante Stondata */}
                {mostraQr && att?.qrVetrinaDataUrl && (
                  <g transform={`translate(${f.w - 240}, ${f.h - safeBottom - 210})`} filter="url(#glow-shadow)">
                    {/* Card Bianca Satinata con Bordo Accento */}
                    <rect x="0" y="0" width="180" height="210" rx="20" fill="#ffffff" stroke={acc.a} strokeWidth="2.5" />
                    {/* Immagine QR reale */}
                    <image href={att.qrVetrinaDataUrl} x="15" y="15" width="150" height="150" />
                    {/* Dicitura Call To Action */}
                    <text x="90" y="192" textAnchor="middle" fontSize="16" fontWeight="900" fill="#0f172a" fontFamily={FONT_SANS} letterSpacing="1">
                      INQUADRA ORA
                    </text>
                  </g>
                )}

                {/* Nome Locale e Recapiti Footer */}
                {nomeRiga.map((r, i) => (
                  <text
                    key={i}
                    x="60"
                    y={f.h - safeBottom - 90 + i * 50}
                    fontSize={44 * big}
                    fontWeight="900"
                    fill="#ffffff"
                    fontFamily={FONT_DISPLAY}
                    letterSpacing="1.5"
                    filter="url(#txt-shadow-pro)"
                  >
                    {r}
                  </text>
                ))}

                {contatti && (
                  <text
                    x="60"
                    y={f.h - safeBottom + (nomeRiga.length > 1 ? 0 : -20)}
                    fontSize={26 * big}
                    fill="#e2e8f0"
                    fontFamily={FONT_SANS}
                    filter="url(#txt-shadow-pro)"
                  >
                    {contatti.slice(0, mostraQr ? 44 : 70)}
                  </text>
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: PANNELLO DI CONTROLLO & PERSONALIZZAZIONE */}
        <div className="space-y-5 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs">
          {/* Scelta Stile Grafico */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">Stile Visivo</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {STILI.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStile(s.id)}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                    stile === s.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-base">{s.icona}</span>
                  <span className="text-[11px] font-black leading-tight">{s.nome}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scelta Colore Accento */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">Colore Accento & Sigillo</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(ACCENTI) as AccentoId[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setAccento(k)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    accento === k
                      ? "ring-2 ring-slate-900 border-transparent shadow-xs"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                  style={{
                    backgroundColor: accento === k ? ACCENTI[k].a : "#ffffff",
                    color: accento === k ? ACCENTI[k].textCol : "#334155",
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACCENTI[k].b }} />
                  {ACCENTI[k].nome}
                </button>
              ))}
            </div>
          </div>

          {/* Idee Pronte / Preset */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">Idea Promozionale Pronta</label>
            <select
              onChange={(e) => applicaPreset(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 font-medium text-slate-800"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Testi Promozione */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700">Occhiello / Etichetta Superiore</label>
              <input
                value={kicker}
                maxLength={40}
                onChange={(e) => setKicker(e.target.value)}
                placeholder="es. ✦ EVENTO SPECIALE ✦"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Titolo Principale</label>
              <input
                value={titolo}
                maxLength={60}
                onChange={(e) => setTitolo(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Descrizione o Dettagli</label>
              <textarea
                value={sottotitolo}
                maxLength={120}
                rows={2}
                onChange={(e) => setSottotitolo(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Badge Prezzo o Sconto</label>
              <input
                value={badge}
                maxLength={22}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="es. Solo 35 € · Sconto 20%"
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-amber-700 bg-amber-50/50"
              />
            </div>
          </div>

          {/* Interruttori Opzioni */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={mostraQr}
                onChange={(e) => setMostraQr(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Includi QR Code per prenotazione / menù
            </label>
            <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={mostraLogo}
                onChange={(e) => setMostraLogo(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Mostra logo dell&apos;attività
            </label>
          </div>

          {/* Sezione Creazione Sfondo Fotografico AI */}
          <div className="pt-3 border-t border-slate-100 space-y-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span>✨</span> Sfondo Fotografico AI (Google)
              </label>
              {sfondoAI && (
                <button onClick={() => setSfondoAI(null)} className="text-[11px] text-rose-600 hover:underline font-bold">
                  Rimuovi foto
                </button>
              )}
            </div>

            <input
              value={temaAI}
              maxLength={100}
              onChange={(e) => setTemaAI(e.target.value)}
              placeholder="Cosa vuoi nello sfondo? (es. tartufo fresco e calice di vino)"
              className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs"
            />

            <button
              onClick={generaAI}
              disabled={stato?.tipo === "carico"}
              className="w-full px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span>{stato?.tipo === "carico" ? "⏳" : "🪄"}</span>
              {stato?.tipo === "carico" ? "Generazione in corso..." : "Genera Sfondo AI (1 Token)"}
            </button>

            {/* Cursore per la scurezza dello sfondo */}
            {sfondoAI && (
              <div className="pt-2">
                <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                  <span>Luminosità foto</span>
                  <span>{100 - scurezzaSfondo}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="70"
                  value={scurezzaSfondo}
                  onChange={(e) => setScurezzaSfondo(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1"
                />
              </div>
            )}
          </div>

          {/* Notifiche ed Errori */}
          {stato && (
            <div
              className={`text-xs rounded-xl p-3 flex items-start gap-2 ${
                stato.tipo === "err"
                  ? "bg-rose-50 border border-rose-200 text-rose-700"
                  : stato.tipo === "ok"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-indigo-50 border border-indigo-200 text-indigo-800"
              }`}
            >
              <span className="text-sm">{stato.tipo === "err" ? "⚠️" : stato.tipo === "ok" ? "✅" : "ℹ️"}</span>
              <p className="flex-1 leading-relaxed">{stato.testo}</p>
            </div>
          )}

          {/* Azioni di Esportazione */}
          <div className="grid grid-cols-1 gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={scarica}
              className="w-full px-4 py-3 rounded-2xl text-sm font-black bg-slate-900 hover:bg-black text-white shadow-md transition flex items-center justify-center gap-2"
            >
              <span>📥</span> Scarica Immagine HD (PNG)
            </button>
            <button
              onClick={condividi}
              className="w-full px-4 py-3 rounded-2xl text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 transition flex items-center justify-center gap-2"
            >
              <span>📲</span> Condividi su WhatsApp
            </button>
            {isVolantino && (
              <button
                onClick={stampa}
                className="w-full px-4 py-2.5 rounded-2xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition flex items-center justify-center gap-2"
              >
                <span>🖨️</span> Stampa Volantino A4
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
