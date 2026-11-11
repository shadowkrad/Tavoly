"use client";

import React, { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Calendar, Receipt, Star } from "lucide-react";
import { classificaTelefono, ETICHETTA_TELEFONO, puoRicevereMessaggi } from "@/lib/phone";
import ClienteFedeltaPanel from "@/components/dashboard/ClienteFedeltaPanel";

type Messaggio = { tipo: "ok" | "errore"; testo: string; clienteEsistenteId?: string } | null;

function giorniAlCompleanno(dataNascita?: string | null): number | null {
  if (!dataNascita) return null;
  const n = new Date(dataNascita);
  if (isNaN(n.getTime())) return null;
  const oggi = new Date();
  const base = Date.UTC(oggi.getFullYear(), oggi.getMonth(), oggi.getDate());
  let prossimo = Date.UTC(oggi.getFullYear(), n.getUTCMonth(), n.getUTCDate());
  if (prossimo < base) prossimo = Date.UTC(oggi.getFullYear() + 1, n.getUTCMonth(), n.getUTCDate());
  return Math.round((prossimo - base) / 86400000);
}

export default function TavolyClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cliente, setCliente] = useState<any>(null);
  const [buoni, setBuoni] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [takeawayOrders, setTakeawayOrders] = useState<any[]>([]);
  const [nomeAttivita, setNomeAttivita] = useState("Tavoly Restaurant");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messaggio, setMessaggio] = useState<Messaggio>(null);

  const ricaricaCliente = useCallback(async () => {
    const r = await fetch(`/api/clienti/${id}`);
    if (r.ok) {
      const data = await r.json();
      setCliente(data.cliente || null);
      setBuoni(data.buoni || []);
      setReservations(data.reservations || []);
      setTableOrders(data.tableOrders || []);
      setTakeawayOrders(data.takeawayOrders || []);
      if (data.nomeAttivita) setNomeAttivita(data.nomeAttivita);
    } else {
      setCliente({ error: true });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    ricaricaCliente();
  }, [ricaricaCliente]);

  const handleUpdate = async () => {
    if (!cliente) return;
    setSaving(true);
    setMessaggio(null);
    try {
      const res = await fetch(`/api/clienti/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cliente.name,
          phoneNumber: cliente.phoneNumber,
          email: cliente.email || "",
          allergies: cliente.allergies || "",
          favoriteTable: cliente.favoriteTable || "",
          isVip: Boolean(cliente.isVip),
          notes: cliente.notes || "",
          birthDate: cliente.birthDate ? String(cliente.birthDate).slice(0, 10) : null,
          marketingConsent: Boolean(cliente.marketingConsent),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCliente((prev: any) => ({
          ...prev,
          phoneNumber: data.cliente?.phoneNumber ?? prev.phoneNumber,
        }));
        setMessaggio({ tipo: "ok", testo: "Dati cliente salvati." });
      } else {
        setMessaggio({
          tipo: "errore",
          testo: data.error || "Non è stato possibile salvare.",
          clienteEsistenteId: data.clienteEsistenteId,
        });
      }
    } catch {
      setMessaggio({ tipo: "errore", testo: "Errore di connessione, riprova." });
    } finally {
      setSaving(false);
    }
  };

  const handleGdprDelete = async () => {
    if (
      confirm(
        "Sei sicuro di voler anonimizzare questo ospite ai sensi del GDPR? I suoi dati personali saranno cancellati in modo irreversibile."
      )
    ) {
      await fetch(`/api/clienti/${id}`, { method: "DELETE" });
      router.push("/dashboard/clienti");
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Caricamento scheda ospite...</div>;
  if (!cliente || cliente.error) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-3">
        <p className="text-rose-600 font-semibold">Cliente non trovato.</p>
        <Link href="/dashboard/clienti" className="text-xs text-blue-600 font-semibold hover:underline">
          ← Torna alla lista clienti
        </Link>
      </div>
    );
  }

  const tipoTel = classificaTelefono(cliente.phoneNumber);
  const riceveMessaggi = puoRicevereMessaggi(cliente.phoneNumber);
  const giorniCompleanno = giorniAlCompleanno(cliente.birthDate);
  const movimenti: any[] = cliente.pointsMovements || [];

  const campo =
    "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-300";
  const etichetta = "text-xs font-semibold text-slate-500 uppercase";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/clienti" className="text-xs text-blue-600 font-semibold hover:underline">
          ← Torna alla lista clienti
        </Link>
        <button
          onClick={handleGdprDelete}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium px-3 py-1 border border-rose-200 rounded-lg hover:bg-rose-50 cursor-pointer"
        >
          Anonimizza (GDPR Delete)
        </button>
      </div>

      {/* Intestazione scheda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">{cliente.name}</h1>
              {cliente.isVip && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Star className="w-3 h-3 fill-current text-amber-600" /> VIP
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span
                className={`px-2.5 py-1 rounded-full font-semibold border ${
                  riceveMessaggi
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                📞 {ETICHETTA_TELEFONO[tipoTel]}
              </span>
              {giorniCompleanno !== null && giorniCompleanno <= 30 && (
                <span className="px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  🎂 {giorniCompleanno === 0 ? "Compleanno oggi" : `Compleanno tra ${giorniCompleanno} giorni`}
                </span>
              )}
              {cliente.allergies && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3" /> {cliente.allergies}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center sm:min-w-[220px]">
            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3">
              <div className="text-2xl font-extrabold text-blue-700">{cliente.loyaltyPoints ?? 0}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Punti fedeltà</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="text-2xl font-extrabold text-slate-800">{cliente.visitCount ?? 0}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase">Cene / Visite</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anagrafica */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">Anagrafica &amp; Preferenze Sala</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={etichetta}>Nome e cognome</label>
            <input
              type="text"
              value={cliente.name || ""}
              onChange={(e) => setCliente({ ...cliente, name: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Telefono</label>
            <input
              type="tel"
              value={cliente.phoneNumber || ""}
              onChange={(e) => setCliente({ ...cliente, phoneNumber: e.target.value })}
              className={campo}
            />
            {tipoTel === "FISSO" && (
              <p className="text-[11px] text-amber-700 mt-1">
                Telefono fisso: non può ricevere WhatsApp. Usa l&apos;email per la tessera e gli avvisi.
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className={etichetta}>Email (opzionale)</label>
              <span className="text-[10px] text-slate-400">{cliente.email ? "Registrata" : "Nessuna email"}</span>
            </div>
            <input
              type="email"
              value={cliente.email || ""}
              placeholder="Serve per inviare tessera, buoni e comunicazioni"
              onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Data di nascita (facoltativa)</label>
            <input
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={cliente.birthDate ? String(cliente.birthDate).slice(0, 10) : ""}
              onChange={(e) => setCliente({ ...cliente, birthDate: e.target.value || null })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Tavolo / Zona preferita</label>
            <input
              type="text"
              value={cliente.favoriteTable || ""}
              placeholder="es. Tavolo 4, Dehors..."
              onChange={(e) => setCliente({ ...cliente, favoriteTable: e.target.value })}
              className={campo}
            />
          </div>
          <div>
            <label className={etichetta}>Allergeni &amp; Intolleranze</label>
            <input
              type="text"
              value={cliente.allergies || ""}
              placeholder="es. Celiachia, Lattosio..."
              onChange={(e) => setCliente({ ...cliente, allergies: e.target.value })}
              className={campo}
            />
          </div>
        </div>

        <div>
          <label className={etichetta}>Note di sala riservate</label>
          <textarea
            rows={3}
            value={cliente.notes || ""}
            onChange={(e) => setCliente({ ...cliente, notes: e.target.value })}
            className={campo}
          />
        </div>

        <div className="flex flex-wrap gap-5 pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={Boolean(cliente.isVip)}
              onChange={(e) => setCliente({ ...cliente, isVip: e.target.checked })}
            />
            <span>Ospite VIP</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(cliente.marketingConsent)}
              onChange={(e) => setCliente({ ...cliente, marketingConsent: e.target.checked })}
            />
            <span>Consenso comunicazioni promozionali e buono compleanno</span>
          </label>
        </div>

        {messaggio && (
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              messaggio.tipo === "ok"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {messaggio.testo}{" "}
            {messaggio.clienteEsistenteId && (
              <Link href={`/dashboard/clienti/${messaggio.clienteEsistenteId}`} className="font-semibold underline">
                Apri la scheda esistente →
              </Link>
            )}
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "Salvataggio..." : "Salva Modifiche"}
        </button>
      </div>

      {/* Fedeltà, punti e invio tessera */}
      <ClienteFedeltaPanel
        clienteId={cliente.id}
        nomeCliente={cliente.name || ""}
        telefono={cliente.phoneNumber || ""}
        email={cliente.email}
        punti={cliente.loyaltyPoints ?? 0}
        tokenTessera={cliente.loyaltyToken || cliente.tokenTessera}
        movimenti={movimenti}
        nomeAttivita={nomeAttivita}
        accent="blue"
        onSaldoAggiornato={ricaricaCliente}
      />

      {/* Buoni */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Buoni</h2>
          <Link href="/dashboard/gift-cards" className="text-xs text-blue-600 font-semibold hover:underline">
            Gestisci buoni →
          </Link>
        </div>
        {buoni.length === 0 ? (
          <p className="text-xs text-slate-400">Nessun buono attivo per questo ospite.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {buoni.map((b: any) => (
              <div key={b.id} className="py-2.5 text-sm">
                <p className="font-medium text-slate-800">
                  {b.tipoValore === "PERCENTUALE"
                    ? `${b.percentuale}% di sconto`
                    : b.tipoValore === "SERVIZIO"
                      ? b.descrizioneServizio
                      : `${Number(b.saldoResiduo).toFixed(2)} € di credito`}
                </p>
                <p className="text-xs text-slate-400">
                  <span className="font-mono">{b.codice}</span> ·{" "}
                  {b.dataScadenza
                    ? `scade il ${new Date(b.dataScadenza).toLocaleDateString("it-IT")}`
                    : "senza scadenza"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storico Prenotazioni & Ordini */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            Prenotazioni ({reservations.length})
          </h2>
          {reservations.length === 0 ? (
            <p className="text-xs text-slate-400">Nessuna prenotazione trovata.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reservations.map((r: any) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                  <div>
                    <span className="font-semibold text-slate-900">
                      {new Date(r.date).toLocaleDateString("it-IT")} · {r.timeSlot}
                    </span>
                    <span className="text-slate-500 ml-2">
                      {r.guestCount} persone {r.tableNumber ? `· Tavolo ${r.tableNumber}` : ""}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {(tableOrders.length > 0 || takeawayOrders.length > 0) && (
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Comande &amp; Asporto ({tableOrders.length + takeawayOrders.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {tableOrders.map((o: any) => (
                <div key={o.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    Tavolo {o.tableNumber} ({o.coverCount} coperti) ·{" "}
                    {new Date(o.createdAt).toLocaleDateString("it-IT")}
                  </span>
                  <span className="font-bold text-slate-900">€ {Number(o.totalAmount || 0).toFixed(2)}</span>
                </div>
              ))}
              {takeawayOrders.map((t: any) => (
                <div key={t.id} className="py-2 flex items-center justify-between text-xs gap-3">
                  <span className="text-slate-700 truncate">
                    Asporto ({t.pickupTime}) — {t.itemsSummary}
                  </span>
                  <span className="font-bold text-slate-900 shrink-0">€ {Number(t.totalAmount || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
