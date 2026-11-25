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
  const titoloRighe = righe(titolo.toUpperCase(), formato === "STORIA" ? 16 : 20, 4);
  const sottoRighe = righe(sottotitolo, formato === "STORIA" ? 30 : 38, 3);
  const nomeRiga = righe(att?.nome || "", 30, 2);
  const contatti = [att?.indirizzo, att?.citta, att?.telefono ? `Tel. ${att.telefono}` : ""].filter(Boolean).join(" · ");
  const yTitolo = f.h * 0.3;
  const dimT = 92 * big;

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
              </defs>
              <rect width={f.w} height={f.h} fill="url(#sg)" />
              {sfondoAI && <image href={sfondoAI} x="0" y="0" width={f.w} height={f.h} preserveAspectRatio="xMidYMid slice" />}
              {sfondoAI && <rect width={f.w} height={f.h} fill="#000" opacity="0.38" />}
              {logo && <image href={logo} x={f.w / 2 - 90} y={f.h * 0.06} width="180" height="180" preserveAspectRatio="xMidYMid meet" />}
              {titoloRighe.map((r, i) => (
                <text key={i} x={f.w / 2} y={yTitolo + (logo ? 150 : 40) + i * dimT * 1.1} textAnchor="middle" fontSize={dimT} fontWeight="900" fill="#fff" fontFamily="Georgia, 'Times New Roman', serif">
                  {r}
                </text>
              ))}
              {sottoRighe.map((r, i) => (
                <text key={i} x={f.w / 2} y={yTitolo + (logo ? 150 : 40) + titoloRighe.length * dimT * 1.1 + 40 + i * 50 * big} textAnchor="middle" fontSize={40 * big} fill="#f1f5f9" fontFamily="Arial, Helvetica, sans-serif">
                  {r}
                </text>
              ))}
              {badge && (
                <g transform={`translate(${f.w / 2}, ${f.h * 0.66})`}>
                  <rect x={-Math.min(300, 30 + badge.length * 22)} y={-52} width={Math.min(600, 60 + badge.length * 44)} height={104} rx={52} fill="#fbbf24" />
                  <text textAnchor="middle" y={16} fontSize={52 * big} fontWeight="900" fill="#1e293b" fontFamily="Arial, Helvetica, sans-serif">
                    {badge.slice(0, 22)}
                  </text>
                </g>
              )}
              {mostraQr && att?.qrVetrinaDataUrl && (
                <g>
                  <rect x={f.w - 250} y={f.h - 330} width="200" height="200" rx="14" fill="#fff" />
                  <image href={att.qrVetrinaDataUrl} x={f.w - 240} y={f.h - 320} width="180" height="180" />
                  <text x={f.w - 150} y={f.h - 98} textAnchor="middle" fontSize="28" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">
                    Prenota / scopri
                  </text>
                </g>
              )}
              {nomeRiga.map((r, i) => (
                <text key={i} x="70" y={f.h - 230 + i * 56} fontSize="48" fontWeight="800" fill="#fff" fontFamily="Georgia, 'Times New Roman', serif">
                  {r}
                </text>
              ))}
              {contatti && (
                <text x="70" y={f.h - 120} fontSize="28" fill="#e2e8f0" fontFamily="Arial, Helvetica, sans-serif">
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
