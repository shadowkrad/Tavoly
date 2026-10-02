"use client";

import { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Fingerprint,
  CheckCircle2,
  KeyRound,
  Laptop,
  Tablet,
} from "lucide-react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";

interface RegisteredDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  status: "ACTIVE" | "REVOKED";
  createdAt: string;
  lastUsedAt?: string;
  lastIp?: string;
  userAgent?: string;
}

export default function RegisteredDevicesCard() {
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [supportsWebAuthn, setSupportsWebAuthn] = useState(false);

  useEffect(() => {
    setSupportsWebAuthn(browserSupportsWebAuthn());
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await fetch("/api/settings/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error("Errore caricamento dispositivi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDevice = async () => {
    setRegistering(true);
    setFeedback(null);
    try {
      // 1. Richiedi opzioni challenge
      const optRes = await fetch("/api/auth/device/register-options", {
        method: "POST",
      });
      if (!optRes.ok) {
        const err = await optRes.json();
        throw new Error(err.error || "Impossibile iniziare la registrazione");
      }
      const options = await optRes.json();

      // 2. Chiedi al chip Secure Enclave di generare la coppia di chiavi FIDO2
      const attResp = await startRegistration(options);

      // 3. Salva la chiave pubblica sul server
      const verifyRes = await fetch("/api/auth/device/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attResp,
          deviceName: deviceName.trim() || undefined,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Verifica dispositivo non riuscita");
      }

      setFeedback({
        type: "success",
        text: "Dispositivo autorizzato e registrato con successo! Ora puoi accedere istantaneamente con FaceID / Impronta / PIN.",
      });
      setDeviceName("");
      await loadDevices();
    } catch (err: any) {
      console.error("Errore registrazione dispositivo:", err);
      if (err.name === "NotAllowedError") {
        setFeedback({ type: "error", text: "Registrazione biometrica annullata dall'utente." });
      } else {
        setFeedback({ type: "error", text: err.message || "Errore durante la registrazione del dispositivo." });
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleRevokeDevice = async (id: string, name: string) => {
    if (!confirm(`Sei sicuro di voler SCOLLEGARE da remoto il dispositivo "${name}"?\nNon potrà più accedere all'applicazione tramite biometria finché non verrà ri-autorizzato.`)) {
      return;
    }

    setRevokingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/settings/devices?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Errore nella revoca del dispositivo");
      }
      setFeedback({
        type: "success",
        text: `Dispositivo "${name}" scollegato da remoto con successo!`,
      });
      await loadDevices();
    } catch (err: any) {
      console.error("Errore revoca:", err);
      setFeedback({ type: "error", text: err.message || "Impossibile scollegare il dispositivo" });
    } finally {
      setRevokingId(null);
    }
  };

  const getDeviceIcon = (dev: RegisteredDevice) => {
    const name = dev.deviceName.toLowerCase();
    if (name.includes("iphone") || name.includes("android") || dev.deviceType === "mobile") {
      return <Smartphone className="w-5 h-5 text-emerald-600" />;
    }
    if (name.includes("ipad") || name.includes("tablet") || dev.deviceType === "tablet") {
      return <Tablet className="w-5 h-5 text-emerald-600" />;
    }
    return <Laptop className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            Dispositivi Mobili PWA, Palmari Camerieri & Accesso Sicuro
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configura l&apos;avvio rapido con <strong>FaceID, TouchID o PIN</strong> del dispositivo. Puoi scollegare qualsiasi palmare o smartphone da remoto in tempo reale.
          </p>
        </div>
        <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          WebAuthn FIDO2
        </span>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Box Registrazione Dispositivo Corrente */}
      {supportsWebAuthn && (
        <div className="bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-600" />
                Registra questo dispositivo per l&apos;accesso biometrico
              </h4>
              <p className="text-xs text-slate-600">
                Associa questo smartphone, palmare o tablet per avviare Tavoly all&apos;istante senza dover digitare il PIN ad ogni presa comanda.
              </p>
              <div className="pt-2 max-w-sm">
                <input
                  type="text"
                  placeholder="Es. Palmare Cameriere Dehors, iPhone Titolare"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegisterDevice}
              disabled={registering}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-xs transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {registering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Autorizzazione in corso...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Autorizza con Biometria / PIN</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Elenco Dispositivi Registrati */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Dispositivi Collegati ({devices.length})
        </h4>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Caricamento dispositivi autorizzati...</div>
        ) : devices.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-xs sm:text-sm text-slate-500">Nessun dispositivo biometrico registrato.</p>
            <p className="text-xs text-slate-400 mt-1">
              Registra lo smartphone o palmare con il pulsante sopra per abilitare l&apos;avvio rapido PWA con PIN o impronta.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {devices.map((dev) => {
              const isRevoked = dev.status === "REVOKED";
              return (
                <div
                  key={dev.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isRevoked ? "bg-slate-50 opacity-60" : "bg-white hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isRevoked ? "bg-slate-200 text-slate-500" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {getDeviceIcon(dev)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">{dev.deviceName}</span>
                        {isRevoked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                            Scollegato da Remoto
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Attivo
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                        <span>Registrato il {new Date(dev.createdAt).toLocaleDateString("it-IT")}</span>
                        {dev.lastUsedAt && (
                          <span>
                            Ultimo uso: {new Date(dev.lastUsedAt).toLocaleString("it-IT", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                          </span>
                        )}
                        {dev.lastIp && <span className="font-mono text-slate-500">IP: {dev.lastIp}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {!isRevoked ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeDevice(dev.id, dev.deviceName)}
                        disabled={revokingId === dev.id}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-95 transition cursor-pointer disabled:opacity-50"
                        title="Revoca l'autorizzazione di questo dispositivo da remoto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{revokingId === dev.id ? "Scollegamento..." : "Scollega da Remoto"}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Accesso negato</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
