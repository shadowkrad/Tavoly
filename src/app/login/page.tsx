"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UtensilsCrossed,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  Delete,
  KeyRound,
  AlertCircle,
  Fingerprint,
  Sparkles,
  Eye,
  EyeOff,
  ShieldAlert,
  Users,
} from "lucide-react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";

export default function LoginPage() {
  const router = useRouter();

  // Tab: "credentials" (Email + Password titolare) oppure "keypad" (PIN collaboratori sala)
  const [activeTab, setActiveTab] = useState<"credentials" | "keypad">("credentials");

  // Credenziali Titolare
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // PIN Collaboratori Sala
  const [pin, setPin] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState<boolean>(false);
  const [biometricLoading, setBiometricLoading] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState(false);
  const [botField, setBotField] = useState("");
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  useEffect(() => {
    // 1. Rileva se ambiente demo (Vercel o branch demo)
    if (typeof window !== "undefined") {
      const hn = window.location.hostname.toLowerCase();
      const isDemoDomain =
        hn.includes("vercel.app") ||
        hn.includes("cliente-demo") ||
        hn.includes("-demo") ||
        hn.startsWith("demo.");
      setIsDemo(isDemoDomain);
    }

    // 2. Verifica supporto WebAuthn
    setSupportsWebAuthn(browserSupportsWebAuthn());
  }, []);

  // Timer per il conto alla rovescia del blocco temporaneo (15 min)
  useEffect(() => {
    if (lockoutRemaining === null || lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demo: true }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Errore durante l'accesso demo");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Errore accesso demo");
      setDemoLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setErrorMsg(null);
    setBiometricLoading(true);

    try {
      const optRes = await fetch("/api/auth/device/login-options", {
        method: "POST",
      });

      if (!optRes.ok) {
        const err = await optRes.json();
        throw new Error(err.error || "Nessun dispositivo registrato su questo browser. Accedi prima con le tue credenziali.");
      }

      const options = await optRes.json();
      const authResp = await startAuthentication(options);

      const verifyRes = await fetch("/api/auth/device/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResp, deviceId: options.deviceId }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Verifica biometrica non riuscita.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Biometric login error:", err);
      if (err.name === "NotAllowedError") {
        setErrorMsg("Accesso biometrico annullato.");
      } else {
        setErrorMsg(err.message || "Dispositivo non riconosciuto. Inserisci le tue credenziali.");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleKeyClick = (val: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload: any = { botField };

      if (activeTab === "credentials") {
        if (!email.trim() || !password) {
          setErrorMsg("Inserisci l'email e la password del tuo account.");
          setLoading(false);
          return;
        }
        payload.email = email.trim();
        payload.password = password;
      } else {
        if (!pin.trim() || pin.length < 4) {
          setErrorMsg("Inserisci un PIN valido di almeno 4 cifre.");
          setLoading(false);
          return;
        }
        payload.pin = pin.trim();
      }

      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setLockoutRemaining(data.retryAfter || 900);
          setErrorMsg(data.error || "Troppi tentativi falliti. Accesso temporaneamente sospeso.");
        } else {
          setErrorMsg(data.error || "Credenziali non valide o errate.");
          if (activeTab === "keypad") setPin("");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Errore durante l'autenticazione");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Link Torna alla Vetrina */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Torna alla Vetrina
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl sm:px-10 border border-slate-100">
          {/* Header Identità */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mb-3 border border-orange-100/80 shadow-xs">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Accesso Ristorante & Sala
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Area riservata titolare e staff operativo
            </p>
          </div>

          {/* Banner Blocco Anti Brute-Force */}
          {lockoutRemaining !== null && lockoutRemaining > 0 && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium text-left flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold mb-0.5">Account temporaneamente protetto</div>
                <div>
                  Per sicurezza l'accesso è sospeso. Riprova tra{" "}
                  <span className="font-bold font-mono">
                    {Math.floor(lockoutRemaining / 60)}m {lockoutRemaining % 60}s
                  </span>.
                </div>
              </div>
            </div>
          )}

          {/* Banner Errore */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1-Click Demo (Solo su ambienti demo Vercel) */}
          {isDemo && (
            <div className="mb-6 p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-950">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Modalità Demo Attiva</span>
              </div>
              <p className="text-[11px] text-orange-700">
                Esplora la gestione tavoli, comande e asporto con un click, senza credenziali.
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading || demoLoading}
                className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {demoLoading ? "Accesso in corso..." : "👉 Accedi alla Demo (1-Click)"}
              </button>
            </div>
          )}

          {/* Sblocco Rapido Biometrico (se supportato e registrato) */}
          {supportsWebAuthn && (
            <div className="mb-5 space-y-2">
              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-black active:scale-98 text-white font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition shadow-sm cursor-pointer disabled:opacity-60"
              >
                <Fingerprint className={`w-4 h-4 text-emerald-400 ${biometricLoading ? "animate-spin" : ""}`} />
                <span>{biometricLoading ? "Verifica biometrica in corso..." : "Sblocco con FaceID / Impronta"}</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Dispositivo registrato • Face ID • Touch ID
              </p>
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">oppure accedi con</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </div>
          )}

          {/* Campo Honey-pot invisibile anti-bot */}
          <div style={{ display: "none" }} aria-hidden="true">
            <input
              type="text"
              name="security_honeypot_bot"
              value={botField}
              onChange={(e) => setBotField(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Selettore Tab Ergonomico: Titolare vs Collaboratori */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("credentials");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "credentials"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-orange-600" />
              <span>Titolare (Email)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("keypad");
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "keypad"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Staff Sala (PIN)</span>
            </button>
          </div>

          {/* ── TAB 1: ACCESSO TITOLARE CON EMAIL + PASSWORD ── */}
          {activeTab === "credentials" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Account
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="titolare@ristorante.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Password
                  </label>
                  <a
                    href="https://taaaac.eu/portal"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                  >
                    Hai dimenticato?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? "Verifica in corso..." : "Accedi alla Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 text-center">
                <p className="text-[11px] text-slate-400">
                  Credenziali e sicurezza protette dalla{" "}
                  <a
                    href="https://taaaac.eu"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-600 hover:text-orange-600 underline"
                  >
                    Console Taaaac Cloud
                  </a>
                </p>
              </div>
            </form>
          )}

          {/* ── TAB 2: ACCESSO STAFF SALA CON PIN RAPIDO ── */}
          {activeTab === "keypad" && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Inserisci il tuo codice PIN a 4 o 6 cifre per sbloccare la postazione
                </p>
                {/* Visualizzazione cifre PIN mascherate */}
                <div className="h-12 w-full bg-slate-50 border border-slate-300 rounded-2xl flex items-center justify-center gap-2 px-4 mb-4">
                  {pin.length === 0 ? (
                    <span className="text-xs text-slate-400 font-medium">In attesa PIN...</span>
                  ) : (
                    Array.from({ length: pin.length }).map((_, i) => (
                      <span
                        key={i}
                        className="w-3.5 h-3.5 rounded-full bg-slate-900 animate-in zoom-in-75 duration-100"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Tastierino Touch per Tablet e Smartphone */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeyClick(num.toString())}
                    className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-2xl font-bold text-lg text-slate-800 transition flex items-center justify-center cursor-pointer shadow-2xs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-2xl font-bold text-xs text-slate-500 uppercase transition flex items-center justify-center cursor-pointer"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("0")}
                  className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-2xl font-bold text-lg text-slate-800 transition flex items-center justify-center cursor-pointer shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="h-13 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-2xl text-slate-600 transition flex items-center justify-center cursor-pointer"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={loading || pin.length < 4}
                className="w-full mt-2 bg-slate-900 hover:bg-black active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifica PIN..." : "Sblocca Postazione"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
