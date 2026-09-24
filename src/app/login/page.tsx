"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Delete, KeyRound, ShieldCheck, AlertCircle } from "lucide-react";
import { loginStaffAction } from "@/app/actions";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleKeyClick = (val: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg("Inserisci un PIN di almeno 4 cifre.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      const res = await loginStaffAction(pin);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setErrorMsg(res.error || "PIN errato");
        setPin("");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Back to Public Showcase */}
      <div className="w-full max-w-sm mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna alla Vetrina</span>
        </Link>
      </div>

      <div className="taaaac-card max-w-sm w-full bg-white p-6 sm:p-8 shadow-md border-slate-200/90 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
          <KeyRound className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Accesso Staff Sala & Bar
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Digita il PIN operatore per gestire tavoli e comande
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* PIN Display Dots */}
        <div className="my-6 flex justify-center gap-3">
          {[0, 1, 2, 3].map((idx) => {
            const hasChar = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  hasChar
                    ? "bg-blue-600 scale-110 shadow-xs"
                    : "bg-slate-200 border border-slate-300"
                }`}
              />
            );
          })}
        </div>

        {/* Touch Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyClick(num)}
              className="w-full h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-black text-xl transition-all cursor-pointer flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center uppercase"
          >
            Canc
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick("0")}
            className="w-full h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-black text-xl transition-all cursor-pointer flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Entra Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={pin.length < 4 || isPending}
          className="mt-6 taaaac-btn-primary w-full py-3 text-sm font-bold shadow-md cursor-pointer disabled:opacity-40"
        >
          {isPending ? "Verifica in corso..." : "Entra nella Dashboard"}
        </button>

        {process.env.NEXT_PUBLIC_IS_DEMO !== "false" && (
          <p className="text-[11px] text-slate-400 mt-4">
            PIN predefinito demo: <strong className="text-slate-600">1234</strong>
          </p>
        )}
      </div>
    </div>
  );
}
