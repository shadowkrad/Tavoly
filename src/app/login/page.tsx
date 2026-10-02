"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowLeft, Delete, KeyRound, ShieldCheck, AlertCircle, Fingerprint, Smartphone } from "lucide-react";
import { loginStaffAction } from "@/app/actions";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [supportsWebAuthn, setSupportsWebAuthn] = useState<boolean>(false);
  const [biometricLoading, setBiometricLoading] = useState<boolean>(false);

  useEffect(() => {
    setSupportsWebAuthn(browserSupportsWebAuthn());
  }, []);

  const handleBiometricLogin = async () => {
    setErrorMsg(null);
    setBiometricLoading(true);

    try {
      // 1. Richiedi opzioni challenge
      const optRes = await fetch("/api/auth/device/login-options", {
        method: "POST",
      });

      if (!optRes.ok) {
        const err = await optRes.json();
        throw new Error(err.error || "Nessun dispositivo registrato su questo browser.");
      }

      const options = await optRes.json();

      // 2. Chiedi al chip biometrico o PIN del dispositivo di firmare la challenge
      const authResp = await startAuthentication(options);

      // 3. Invia la firma al server per verifica crittografica
      const verifyRes = await fetch("/api/auth/device/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResp }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Autenticazione biometrica fallita");
      }

      // Login completato! Vai alla dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Errore login biometrico:", err);
      if (err.name === "NotAllowedError") {
        setErrorMsg("Riconoscimento biometrico annullato.");
      } else {
        setErrorMsg(err.message || "Accesso biometrico non riuscito.");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

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

        {/* Pulsante rapido Accesso Biometrico PWA / Palmare */}
        {supportsWebAuthn && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={biometricLoading || isPending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-98 text-white font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{biometricLoading ? "Verifica biometrica in corso..." : "Accedi con FaceID / Impronta / PIN"}</span>
            </button>
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">oppure con PIN numerico</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left font-medium">
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
