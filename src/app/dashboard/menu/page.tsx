import { UtensilsCrossed, Plus, Tag, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyMenuPage() {
  const sampleDishes = [
    { name: "Paccheri di Gragnano al Polpo", cat: "Primi", price: 16.0, desc: "Pomodorini del Piennolo, olive taggiasche e tarallo sbriciolato", allergens: "Glutine, Molluschi" },
    { name: "Tagliolini al Tartufo Fresco", cat: "Primi", price: 18.0, desc: "Pasta fresca all'uovo e burro di malga fuso", allergens: "Uova, Latticini" },
    { name: "Filetto Black Angus al Pepe Verde", cat: "Secondi", price: 24.0, desc: "Cottura a bassa temperatura con riduzione di brandy e patate", allergens: "Latticini" },
    { name: "Tiramisù Tradizionale", cat: "Dolci", price: 7.0, desc: "Savoiardi sardi, caffè espresso e crema mascarpone", allergens: "Uova, Latticini" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-emerald-600" />
            Menù Digitale QR Code
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestisci portate, prezzi, allergeni e piatti del giorno consultabili dai clienti via QR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sampleDishes.map((dish, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {dish.cat}
                </span>
                <span className="font-mono font-bold text-base text-emerald-700">
                  {dish.price.toFixed(2)} €
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-1">{dish.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-snug">{dish.desc}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Allergeni: {dish.allergens}</span>
              <span className="text-emerald-600 font-semibold">Attivo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
