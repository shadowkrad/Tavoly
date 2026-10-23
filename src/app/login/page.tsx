"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UtensilsCrossed,
  Lock,
  ArrowLeft,
  ArrowRight,
  Delete,
  KeyRound,
  AlertCircle,
  Fingerprint,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";

export default function LoginPage() {
  const router = useRouter();
  const [credential, setCredential] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"password" | "keypad">("password");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState<boolean>(false);
  const [biometricLoading, setBiometricLoading] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState(false);

  // 🛡️ Sicurezza v1.0.6: MFA / 2FA & Anti Brute-Force
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [isBackupCodeMode, setIsBackupCodeMode] = useState(false);
  const [botField, setBotField] = useState("");
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  const mfaInputRef = useRef<HTMLInputElement>(null);

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

  // Focus automatico sul campo MFA al passaggio allo Step 2
  useEffect(() => {
    if (isMfaStep && mfaInputRef.current) {
      mfaInputRef.current.focus();
    }
  }, [isMfaStep, isBackupCodeMode]);

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
        throw new Error(err.error || "Nessun dispositivo registrato su questo browser. Accedi prima con password.");
      }

      const options = await optRes.json();
      const authResp = await startAuthentication(options);

      const verifyRes = await fetch("/api/auth/device/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: authResp }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Autenticazione biometrica fallita");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("Errore login biometrico:", err);
      if (err.name === "NotAllowedError") {
        setErrorMsg("Riconoscimento biometrico annullato.");
      } else {
        setErrorMsg(err.message || "Accesso biometrico non riuscito. Inserisci la password o il PIN.");
      }
      setBiometricLoading(false);
    }
  };

  const handleKeyClick = (val: string) => {
    if (credential.length < 12) {
      setCredential((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    setCredential((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCredential("");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // ── STEP 1: VERIFICA CREDENZIALI & CHECK MFA ──
    if (!isMfaStep) {
      if (!credential.trim() || credential.length < 4) {
        setErrorMsg("Inserisci la password o un PIN di almeno 4 caratteri.");
        return;
      }
      setLoading(true);
      setErrorMsg(null);

      try {
        const checkRes = await fetch("/api/admin/auth/check-mfa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: credential, botField }),
        });

        const checkData = await checkRes.json();

        if (!checkRes.ok) {
          if (checkRes.status === 429) {
            setLockoutRemaining(checkData.retryAfter || 900);
            setErrorMsg(checkData.error || "Troppi tentativi falliti. Accesso sospeso.");
          } else {
            setErrorMsg(checkData.error || "Password o PIN non corretto.");
            if (activeTab === "keypad") setCredential("");
          }
          setLoading(false);
          return;
        }

        // Se MFA è richiesta, passa allo Step 2
        if (checkData.mfaRequired) {
          setIsMfaStep(true);
          setLoading(false);
          return;
        }

        // MFA non attiva: esegui login diretto
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: credential, botField }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Credenziali non valide");
        }

        router.push("/dashboard");
        router.refresh();
      } catch (err: any) {
        setErrorMsg(err.message || "Password o PIN errato");
        setLoading(false);
      }
      return;
    }

    // ── STEP 2: VERIFICA CODICE MFA ──
    if (!mfaCode.trim()) {
      setErrorMsg(isBackupCodeMode ? "Inserisci il codice di emergenza (es. ABCD-1234)." : "Inserisci il codice a 6 cifre.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: credential,
          mfaCode,
          botField,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLockoutRemaining(data.retryAfter || 900);
          setErrorMsg(data.error || "Troppi tentativi falliti. Accesso temporaneamente bloccato.");
        } else {
          setErrorMsg(data.error || "Codice di sicurezza non valido.");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Errore durante la verifica del codice.");
      setLoading(false);
    }
  };

  const formatLockoutTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
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
        {/* Campo Honey-Pot invisibile anti-bot */}
        <input
          type="text"
          value={botField}
          onChange={(e) => setBotField(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          style={{ display: "none" }}
          aria-hidden="true"
        />

        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 mx-auto flex items-center justify-center mb-4 shadow-xs">
          {isMfaStep ? <ShieldCheck className="w-7 h-7 text-emerald-600" /> : <UtensilsCrossed className="w-7 h-7" />}
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          {isMfaStep ? "Verifica a Due Fattori (2FA)" : "Accesso Sala & Gestione"}
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-6 flex items-center justify-center gap-1">
          {isMfaStep ? (
            <span className="text-emerald-700 font-semibold">Passaggio 2 di 2 • Conferma identità</span>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Area Riservata Operatori & Sala</span>
            </>
          )}
        </p>

        {/* Banner Blocco Anti-Brute-Force */}
        {lockoutRemaining !== null && lockoutRemaining > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-700 text-left flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800">Accesso temporaneamente sospeso</p>
              <p className="text-[11px] text-red-600 mt-0.5">
                Troppi tentativi errati. Riprova tra{" "}
                <span className="font-mono font-bold text-red-800">{formatLockoutTimer(lockoutRemaining)}</span>.
              </p>
            </div>
          </div>
        )}

        {/* 1-Click Demo Box (Solo su ambienti demo Vercel) */}
        {isDemo && !isMfaStep && (
          <div className="mb-6 p-4 rounded-2xl bg-orange-50/80 border border-orange-200/90 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-orange-950">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Modalità Demo Attiva</span>
            </div>
            <p className="text-[11px] text-orange-700">
              Esplora la gestione tavoli, comande e sale con un singolo click, senza credenziali.
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

        {/* Pulsante rapido Accesso Biometrico Passkey */}
        {supportsWebAuthn && !isMfaStep && (
          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={handleBiometricLogin}
              disabled={biometricLoading || loading || demoLoading || Boolean(lockoutRemaining && lockoutRemaining > 0)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-700 hover:to-amber-700 active:scale-98 text-white font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Fingerprint className={`w-4 h-4 ${biometricLoading ? "animate-spin" : ""}`} />
              <span>{biometricLoading ? "Verifica biometrica in corso..." : "Sblocco con FaceID / Impronta / PIN"}</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center font-medium">
              Dispositivo registrato • Face ID • Touch ID • PIN
            </p>
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">oppure con credenziali</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: FORM CREDENZIALI ── */}
        {!isMfaStep ? (
          <>
            {/* Selettore Tab Password / Tastierino PIN */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("password");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  activeTab === "password" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Password Master
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("keypad");
                  setErrorMsg(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  activeTab === "keypad" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
                }`}
              >
                Tastierino PIN
              </button>
            </div>

            {activeTab === "password" ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Password o PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder="Inserisci password o PIN"
                      required
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || demoLoading || biometricLoading || Boolean(lockoutRemaining && lockoutRemaining > 0)}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading ? "Verifica in corso..." : "Accedi alla Dashboard"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div>
                {/* PIN Display Dots */}
                <div className="my-4 flex justify-center gap-3">
                  {[0, 1, 2, 3].map((idx) => {
                    const hasChar = credential.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                          hasChar
                            ? "bg-orange-600 scale-110 shadow-xs"
                            : "bg-slate-200 border border-slate-300"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Touch Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeyClick(num)}
                      className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-500 font-semibold text-[11px] transition-all cursor-pointer flex items-center justify-center uppercase"
                  >
                    Canc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeyClick("0")}
                    className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-lg transition-all cursor-pointer flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 font-bold text-base transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={credential.length < 4 || loading || Boolean(lockoutRemaining && lockoutRemaining > 0)}
                  className="mt-4 w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {loading ? "Verifica in corso..." : "Entra nella Dashboard"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          /* ── STEP 2: FORM MFA / CODICE DI EMERGENZA ── */
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 leading-relaxed">
              {isBackupCodeMode
                ? "Inserisci uno dei codici di emergenza generati durante la configurazione della sicurezza."
                : "Inserisci il codice a 6 cifre generato dalla tua app di autenticazione (Google Authenticator, Microsoft Authenticator o simili)."}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                {isBackupCodeMode ? "Codice di Recupero di Emergenza" : "Codice Authenticator (6 Cifre)"}
              </label>
              <input
                ref={mfaInputRef}
                type="text"
                required
                maxLength={isBackupCodeMode ? 12 : 6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.toUpperCase())}
                placeholder={isBackupCodeMode ? "ABCD-1234" : "123456"}
                className="w-full px-3.5 py-3 rounded-xl border border-emerald-500/50 text-lg font-mono text-center tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {loading ? "Convalida in corso..." : "Conferma ed Entra"}
              <ShieldCheck className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsBackupCodeMode(!isBackupCodeMode);
                  setMfaCode("");
                  setErrorMsg(null);
                }}
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline cursor-pointer"
              >
                {isBackupCodeMode ? "Usa app Authenticator" : "Usa codice di emergenza"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMfaStep(false);
                  setMfaCode("");
                  setErrorMsg(null);
                }}
                className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
              >
                ← Torna indietro
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Per abilitare lo sblocco rapido con FaceID o PIN su questo dispositivo, effettua l'accesso e registra il dispositivo in <strong className="text-slate-600">Impostazioni &gt; Dispositivi PWA</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
