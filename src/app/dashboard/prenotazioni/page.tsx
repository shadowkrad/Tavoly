import { prisma } from "@/lib/prisma";
import { CalendarDays, Clock, Users, Phone, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TavolyPrenotazioniPage() {
  let reservations: any[] = [];
  try {
    reservations = await prisma.reservation.findMany({
      include: { table: { include: { area: true } } },
      orderBy: { date: "desc" },
    });
  } catch (e) {
    console.warn("Fallback prenotazioni:", e);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-emerald-600" />
            Registro Prenotazioni Tavoli
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestisci prenotazioni pranzo e cena, numero coperti e sale assegnate.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="p-3.5">Orario</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Ospiti</th>
                <th className="p-3.5">Tavolo & Area</th>
                <th className="p-3.5">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Nessuna prenotazione presente per oggi.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
                      {r.timeSlot}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">
                      <div>{r.customerName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Phone className="w-2.5 h-2.5" /> {r.customerPhone}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {r.guestsCount} persone
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-900">
                        {r.table?.name || "Tavolo Assegnato"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {r.table?.area?.name || "Sala"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
