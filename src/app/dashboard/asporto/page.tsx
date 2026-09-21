import { ShoppingBag, Clock, Phone, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyAsportoPage() {
  const sampleOrders = [
    { id: "ord-1", customer: "Marco R.", time: "19:45", items: "2 Pizze Margherita + 1 Patatine", total: 22.0, status: "IN_PREPARAZIONE" },
    { id: "ord-2", customer: "Chiara V.", time: "20:15", items: "1 Tagliata Funghi + 1 Tiramisù", total: 28.0, status: "CONFERMATO" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-emerald-600" />
          Ordini Asporto & Takeaway
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitoraggio comande da asporto con orario di ritiro concordato.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleOrders.map((ord) => (
          <div
            key={ord.id}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Ore {ord.time}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {ord.status}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-900">{ord.customer}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{ord.items}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Totale ordine:</span>
              <strong className="font-mono text-emerald-700 text-sm">{ord.total.toFixed(2)} €</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
