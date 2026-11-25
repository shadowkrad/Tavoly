"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface PresetCampagna {
  id: string;
  nome: string;
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
const STILI: Array<{ id: StileId; nome: string }> = [
  { id: "GLASS", nome: "✨ Elegante" },
  { id: "MODERN", nome: "📱 Social" },
  { id: "SPLIT", nome: "📄 Volantino" },
];
// Elenchi di font con ripiego sicuro: se Montserrat/Playfair non sono sul dispositivo si usano quelli di sistema.
const FONT_TITOLO = "'Playfair Display', 'Cinzel', Georgia, 'Times New Roman', serif";
const FONT_CORPO = "'Montserrat', 'Inter', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";
const FORMATI: Record<FormatoId, { nome: string; w: number; h: number; ratio: "1:1" | "9:16" | "3:4"; hint: string }> = {
  STORIA: { nome: "Storia", w: 1080, h: 1920, ratio: "9:16", hint: "Stati WhatsApp, Storie Instagram e Facebook" },
  POST: { nome: "Post", w: 1080, h: 1080, ratio: "1:1", hint: "Feed Instagram, Facebook, Google" },
  VOLANTINO: { nome: "Volantino A4", w: 1240, h: 1754, ratio: "3:4", hint: "Stampa da banco o in vetrina" },
};

const SFUMATURE: Array<{ id: string; nome: string; a?: string; b?: string }> = [
  { id: "p", nome: "Colore attività" },
  { id: "notte", nome: "Notte", a: "#0f172a", b: "#334155" },
  { id: "caldo", nome: "Caldo", a: "#7c2d12", b: "#ea580c" },
  { id: "bosco", nome: "Bosco", a: "#052e16", b: "#15803d" },
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
  const [titolo, setTitolo] = useState(presets[0]?.titolo || "");
  const [sottotitolo, setSottotitolo] = useState(presets[0]?.sottotitolo || "");
  const [badge, setBadge] = useState(presets[0]?.badge || "");
  const [mostraQr, setMostraQr] = useState(true);
  const [sfum, setSfum] = useState("p");
  const [sfondoAI, setSfondoAI] = useState<string | null>(null);
  const [temaAI, setTemaAI] = useState(presets[0]?.temaAI || "");
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
  const colA = useMemo(() => {
    const s = SFUMATURE.find((x) => x.id === sfum);
    return s && s.a ? s.a : att?.colorePrimario || "#1e293b";
  }, [sfum, att]);
  const colB = useMemo(() => {
    const s = SFUMATURE.find((x) => x.id === sfum);
    return s && s.b ? s.b : att?.coloreSecondario || "#475569";
  }, [sfum, att]);

  function applicaPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    setTitolo(p.titolo);
    setSottotitolo(p.sottotitolo);
    setBadge(p.badge);
    setTemaAI(p.temaAI);
  }

  async function generaAI() {
    setStato({ tipo: "carico", testo: "Sto creando lo sfondo… (fino a 30 secondi)" });
    try {
      const r = await fetch("/api/marketing/creative-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settore, tema: temaAI || titolo, formato: f.ratio }),
      });
      const d = await r.json();
      if (d?.ok && d.dataBase64) {
        setSfondoAI(`data:${d.mime || "image/png"};base64,${d.dataBase64}`);
        setStato({ tipo: "ok", testo: `Sfondo creato. Generazioni rimaste oggi: ${d.restanti ?? "?"}` });
      } else if (d?.code === "NON_CONFIGURATO") {
        setStato({ tipo: "err", testo: "La creazione sfondi AI non è ancora attiva: usa uno dei colori qui sotto." });
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
      setStato({ tipo: "err", testo: "Su questo dispositivo usa «Scarica» e poi allega l'immagine a WhatsApp." });
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

  const big = f.w >= 1240 ? 1.15 : 1;
  const story = formato === "STORIA";
  const split = stile === "SPLIT";
  const safeTop = story ? 220 : 70; // evita la barra in alto delle storie
  const safeBottom = story ? 260 : 70; // evita la casella "Rispondi" in basso
  const dimT = (split ? 76 : story ? 92 : 80) * big;
  const dimS = (split ? 36 : story ? 40 : 34) * big;
  const titoloRighe = righe(titolo.toUpperCase(), split || story ? 16 : 20, split ? 3 : 4);
  const sottoRighe = righe(sottotitolo, split || story ? 30 : 38, 3);
  const nomeRiga = righe(att?.nome || "", 30, 2);
  const contatti = [att?.indirizzo, att?.citta, att?.telefono ? `Tel. ${att.telefono}` : ""].filter(Boolean).join(" · ");
  const hTit = titoloRighe.length * dimT * 1.1;
  const hSub = sottoRighe.length * dimS * 1.25;
  const logoSize = story ? 180 : 120;
  const wBadge = Math.min(660, 100 + badge.length * 34);
  const yNome = f.h - safeBottom - 140;
  const yContatti = f.h - safeBottom - 40;
  const qrY = f.h - safeBottom - 250;
  const ombraTesto = split ? undefined : "url(#txt-shadow)";

  // Blocco centrale (stili Elegante e Social): logo, titolo, testo, badge; si rimpicciolisce se non entra
  const gapL = logo ? logoSize + 28 : 0;
  const contentH = gapL + hTit + (hSub ? hSub + 26 : 0) + (badge ? 136 : 0);
  const pad = stile === "GLASS" ? 56 : 0;
  const boxH = contentH + pad * 2;
  const cw = f.w - 180;
  const availTop = safeTop;
  const availH = Math.max(300, f.h - safeBottom - 270 - availTop);
  const sc = Math.min(1, availH / Math.max(1, boxH));
  const boxTop = availTop + (availH - boxH * sc) / 2;
  const yT0 = pad + gapL;
  const yS0 = yT0 + hTit + 14;
  const yB = yT0 + hTit + (hSub ? hSub + 26 : 0) + 40 + 48;

  // Stile Volantino: foto in alto, fascia colorata in basso
  const h1 = f.h * (formato === "POST" ? 0.46 : 0.5);

  const badgePill = (cx: number, cy: number) => (
    <g transform={`translate(${cx}, ${cy})`} filter="url(#card-shadow)">
      <rect x={-wBadge / 2} y={-48} width={wBadge} height={96} rx={48} fill="url(#gold-badge)" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.45" />
      <text textAnchor="middle" y={14} fontSize={46 * big} fontWeight="900" fill="#0f172a" fontFamily={FONT_CORPO} letterSpacing="1">
        {badge.slice(0, 22)}
      </text>
    </g>
  );

  return (
    <div className="space-y-5">
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FORMATI) as FormatoId[]).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setFormato(k);
                  setSfondoAI(null);
                }}
                className={`px-3 py-2 rounded-xl text-sm font-bold border ${formato === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200"}`}
              >
                {FORMATI[k].nome}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500">{f.hint}</p>
          <div className="flex flex-wrap gap-2">
            {STILI.map((x) => (
              <button
                key={x.id}
                onClick={() => setStile(x.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${stile === x.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200"}`}
              >
                {x.nome}
              </button>
            ))}
          </div>
          <div className="bg-slate-100 rounded-2xl p-3 flex justify-center">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${f.w} ${f.h}`}
              className="w-full h-auto rounded-xl shadow"
              style={{ maxHeight: "70vh", maxWidth: formato === "POST" ? 560 : formato === "STORIA" ? 340 : 440 }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor={colA} />
                  <stop offset="1" stopColor={colB} />
                </linearGradient>
                <linearGradient id="vignette-ai" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#000" stopOpacity="0.65" />
                  <stop offset="0.25" stopColor="#000" stopOpacity="0.2" />
                  <stop offset="0.6" stopColor="#000" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#000" stopOpacity="0.88" />
                </linearGradient>
                <linearGradient id="gold-badge" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#fbbf24" />
                  <stop offset="1" stopColor="#d97706" />
                </linearGradient>
                <filter id="txt-shadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.8" />
                </filter>
                <filter id="card-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#000" floodOpacity="0.45" />
                </filter>
                <clipPath id="clip-foto">
                  <rect x="0" y="0" width={f.w} height={h1} />
                </clipPath>
              </defs>

              <rect width={f.w} height={f.h} fill="url(#sg)" />
              {sfondoAI && !split && <image href={sfondoAI} x="0" y="0" width={f.w} height={f.h} preserveAspectRatio="xMidYMid slice" />}
              {sfondoAI && !split && (stile === "MODERN" ? <rect width={f.w} height={f.h} fill="url(#vignette-ai)" /> : <rect width={f.w} height={f.h} fill="#000" opacity="0.22" />)}

              {split && (
                <g>
                  {sfondoAI && (
                    <g clipPath="url(#clip-foto)">
                      <image href={sfondoAI} x="0" y="0" width={f.w} height={h1} preserveAspectRatio="xMidYMid slice" />
                    </g>
                  )}
                  <rect x="0" y={h1} width={f.w} height={f.h - h1} fill={colA} />
                  <rect x="0" y={h1} width={f.w} height="8" fill="url(#gold-badge)" />
                  {logo && <image href={logo} x="70" y={safeTop} width={logoSize} height={logoSize} preserveAspectRatio="xMidYMid meet" />}
                  {badge && badgePill(70 + wBadge / 2, h1)}
                  {titoloRighe.map((r, i) => (
                    <text key={i} x="70" y={h1 + 78 + dimT * 0.85 + i * dimT * 1.1} fontSize={dimT} fontWeight="900" fill="#fff" fontFamily={FONT_TITOLO} letterSpacing="2">
                      {r}
                    </text>
                  ))}
                  {sottoRighe.map((r, i) => (
                    <text key={i} x="70" y={h1 + 78 + dimT * 0.85 + titoloRighe.length * dimT * 1.1 + 6 + i * dimS * 1.25} fontSize={dimS} fill="#f1f5f9" fontFamily={FONT_CORPO}>
                      {r}
                    </text>
                  ))}
                </g>
              )}

              {!split && (
                <g transform={`translate(${f.w / 2}, ${boxTop}) scale(${sc})`}>
                  {stile === "GLASS" && (
                    <rect x={-cw / 2} y="0" width={cw} height={boxH} rx="36" fill="rgba(15,23,42,0.72)" stroke="rgba(255,255,255,0.22)" strokeWidth="2" filter="url(#card-shadow)" />
                  )}
                  {logo && <image href={logo} x={-logoSize / 2} y={pad} width={logoSize} height={logoSize} preserveAspectRatio="xMidYMid meet" />}
                  {titoloRighe.map((r, i) => (
                    <text key={i} x="0" y={yT0 + dimT * 0.85 + i * dimT * 1.1} textAnchor="middle" fontSize={dimT} fontWeight="900" fill="#fff" fontFamily={FONT_TITOLO} letterSpacing="2" filter={ombraTesto}>
                      {r}
                    </text>
                  ))}
                  {sottoRighe.map((r, i) => (
                    <text key={i} x="0" y={yS0 + dimS + i * dimS * 1.25} textAnchor="middle" fontSize={dimS} fill="#f1f5f9" fontFamily={FONT_CORPO} filter={ombraTesto}>
                      {r}
                    </text>
                  ))}
                  {badge && badgePill(0, yB)}
                </g>
              )}

              {mostraQr && att?.qrVetrinaDataUrl && (
                <g transform={`translate(${f.w - 260}, ${qrY})`} filter="url(#card-shadow)">
                  <rect x="0" y="0" width="200" height="230" rx="20" fill="#ffffff" />
                  <image href={att.qrVetrinaDataUrl} x="15" y="15" width="170" height="170" />
                  <text x="100" y="210" textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f172a" fontFamily={FONT_CORPO}>
                    INQUADRA E PRENOTA
                  </text>
                </g>
              )}
              {nomeRiga.map((r, i) => (
                <text key={i} x="70" y={yNome + i * 56} fontSize="48" fontWeight="800" fill="#fff" fontFamily={FONT_TITOLO} letterSpacing="1" filter={ombraTesto}>
                  {r}
                </text>
              ))}
              {contatti && (
                <text x="70" y={yContatti + (nomeRiga.length - 1) * 56} fontSize="28" fill="#e2e8f0" fontFamily={FONT_CORPO} filter={ombraTesto}>
                  {contatti.slice(0, mostraQr ? 48 : 70)}
                </text>
              )}
            </svg>
          </div>
        </div>

        <div className="space-y-4 bg-white border border-slate-200 rounded-2xl p-4">
          <div>
            <label className="text-xs font-bold text-slate-600">Idea pronta</label>
            <select onChange={(e) => applicaPreset(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white">
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Titolo</label>
            <input value={titolo} maxLength={60} onChange={(e) => setTitolo(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Testo breve</label>
            <textarea value={sottotitolo} maxLength={120} rows={2} onChange={(e) => setSottotitolo(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600">Prezzo o scritta in evidenza</label>
            <input value={badge} maxLength={22} onChange={(e) => setBadge(e.target.value)} placeholder="es. Solo 35 €" className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={mostraQr} onChange={(e) => setMostraQr(e.target.checked)} /> Mostra il QR per prenotare
          </label>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <p className="text-xs font-bold text-slate-600">Sfondo</p>
            <div className="flex flex-wrap gap-2">
              {SFUMATURE.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSfum(s.id);
                    setSfondoAI(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${sfum === s.id && !sfondoAI ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
                >
                  {s.nome}
                </button>
              ))}
            </div>
            <input value={temaAI} maxLength={100} onChange={(e) => setTemaAI(e.target.value)} placeholder="Tema dello sfondo (es. pizza gourmet)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm" />
            <button onClick={generaAI} disabled={stato?.tipo === "carico"} className="w-full px-3 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white disabled:opacity-60">
              ✨ Crea sfondo con l&apos;AI
            </button>
            {sfondoAI && (
              <button onClick={() => setSfondoAI(null)} className="w-full text-xs text-slate-500 underline">
                Torna al colore
              </button>
            )}
          </div>

          {stato && (
            <p className={`text-xs rounded-lg px-3 py-2 ${stato.tipo === "err" ? "bg-rose-50 text-rose-700" : stato.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{stato.testo}</p>
          )}

          <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3">
            <button onClick={scarica} className="px-3 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white">
              📥 Scarica immagine
            </button>
            <button onClick={condividi} className="px-3 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white">
              📲 Condividi (WhatsApp)
            </button>
            {formato === "VOLANTINO" && (
              <button onClick={stampa} className="px-3 py-2.5 rounded-xl text-sm font-bold bg-white border border-slate-300 text-slate-800">
                🖨️ Stampa A4
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
