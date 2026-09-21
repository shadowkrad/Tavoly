import { Users, Phone, Heart, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TavolyClientiPage() {
  const sampleClients = [
    { name: "Marco Bianchi", phone: "+39 333 1122334", visits: 6, notes: "Tavolo preferito: Dehors Giardino", allergens: "No frutti di mare" },
    { name: "Elena Conti", phone: "+39 340 5566778", visits: 12, notes: "Cliente VIP, anniversario a Maggio", allergens: "Celiaca (Gluten free)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-emerald-600" />
          Clienti, Tavoli Preferiti & Intolleranze
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Anagrafica ospiti con storico prenotazioni, note di sala e intolleranze alimentari.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleClients.map((c, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-600" /> {c.phone}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {c.visits} Cene
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600"><strong>Note:</strong> {c.notes}</p>
              <p className="text-amber-700 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> Allergeni: {c.allergens}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
