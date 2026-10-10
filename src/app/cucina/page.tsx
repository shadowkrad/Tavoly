import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { KitchenDisplayView } from "@/components/dashboard/KitchenDisplayView";
import { toggleKdsSettingAction } from "@/app/actions";
import { ChefHat, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StandaloneCucinaPage() {
  const [kdsSetting, restaurantSetting] = await Promise.all([
    prisma.localSetting.findUnique({
      where: { key: "kds_enabled" },
    }),
    prisma.localSetting.findUnique({
      where: { key: "restaurant_name" },
    }),
  ]);

  const isKdsEnabled = kdsSetting ? kdsSetting.value === "true" : false;
  const restaurantName = restaurantSetting ? restaurantSetting.value : "Osteria dei Tavoli";

  if (!isKdsEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <ChefHat className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-black">Monitor Cucina KDS Disattivato</h1>
          <p className="text-xs text-slate-400">
            Il monitor cucina per la brigata è disattivato. Puoi attivarlo istantaneamente qui sotto:
          </p>
          <div className="space-y-2 pt-2">
            <form
              action={async () => {
                "use server";
                await toggleKdsSettingAction(true);
              }}
            >
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ChefHat className="w-4 h-4" />
                <span>Attiva Monitor Cucina Adesso ⚡</span>
              </button>
            </form>
            <Link
              href="/dashboard/impostazioni"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Torna alle Impostazioni</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <KitchenDisplayView restaurantName={restaurantName} isStandalone={true} />
    </div>
  );
}
