import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function TwoFactorPage() {
  const [step, setStep] = useState<"setup" | "verify" | "done">("setup");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyToken, setVerifyToken] = useState("");

  const setupMutation = useMutation({
    mutationFn: () => api.twoFactor.setup(),
    onSuccess: (data) => {
      setSecret(data.secret);
      setBackupCodes(data.backupCodes || []);
      setStep("verify");
    },
  });

  const enableMutation = useMutation({
    mutationFn: (token: string) => api.twoFactor.enable(token),
    onSuccess: () => setStep("done"),
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-white">Two-Factor Authentication</h1>
        <p className="mt-1 text-sm text-gray-500">Enhance your account security with TOTP-based 2FA.</p>
      </div>

      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          {step === "setup" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/20">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-white">Set Up 2FA</h2>
              <p className="mb-4 text-sm text-gray-500">
                Two-factor authentication adds an extra layer of security to your admin account.
              </p>
              <button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
                {setupMutation.isPending ? "Setting up..." : "Begin Setup"}
              </button>
              {setupMutation.isError && <p className="mt-3 text-sm text-red-400">{(setupMutation.error as any).message}</p>}
            </div>
          )}

          {step === "verify" && (
            <div>
              <h2 className="mb-4 text-lg font-bold text-white">Verify Setup</h2>
              <div className="mb-4 rounded-lg bg-gray-800/50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Secret Key</p>
                <p className="break-all font-mono text-sm text-orange-400">{secret}</p>
              </div>
              <p className="mb-4 text-xs text-gray-500">
                Scan this secret with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {backupCodes.length > 0 && (
                <div className="mb-4 rounded-lg bg-gray-800/50 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Backup Codes (save these!)</p>
                  <div className="grid grid-cols-2 gap-1">
                    {backupCodes.map((code, i) => (
                      <p key={i} className="font-mono text-xs text-gray-400">{code}</p>
                    ))}
                  </div>
                </div>
              )}
              <input value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="Enter verification code from app"
                className="mb-3 w-full rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-sm outline-none focus:border-orange-500" />
              <button onClick={() => enableMutation.mutate(verifyToken)} disabled={!verifyToken || enableMutation.isPending}
                className="w-full rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-50">
                {enableMutation.isPending ? "Enabling..." : "Enable 2FA"}
              </button>
              {enableMutation.isError && <p className="mt-3 text-sm text-red-400">{(enableMutation.error as any).message}</p>}
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <span className="text-2xl">✅</span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-white">2FA Enabled</h2>
              <p className="text-sm text-gray-500">
                Two-factor authentication is now active on your admin account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
