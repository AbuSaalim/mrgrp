"use client";

import { useState } from "react";
import { Lock, Mail, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("Authenticating...");
  const router = useRouter(); 

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusText("Verifying credentials...");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Step 1: Normal Email & Password Verification
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      const fallbackRedirect = data.redirectUrl || "/dashboard";

      // Step 2: Check if browser supports WebAuthn
      if (!browserSupportsWebAuthn()) {
        toast.success("Login successful! Redirecting...");
        window.location.href = fallbackRedirect;
        return;
      }

      // Step 3: Check if user has a registered Fingerprint / Passkey
      setStatusText("Checking biometrics...");
      const challengeRes = await fetch("/api/auth/login-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const challengeData = await challengeRes.json();

      // Step 4A: If NOT registered -> Trigger startRegistration (Setup 2FA Biometric)
      if (!challengeRes.ok || challengeData.hasPasskeys === false) {
        toast.info("Setting up Biometric/Fingerprint for lightning-fast logins...");
        setStatusText("Prompting Touch ID / Fingerprint...");

        try {
          const regChallengeRes = await fetch("/api/auth/register-challenge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const regOptions = await regChallengeRes.json();

          if (regChallengeRes.ok) {
            // Trigger native browser Touch ID / Face ID / Windows Hello prompt
            const regResponse = await startRegistration({ optionsJSON: regOptions });

            setStatusText("Saving biometric data...");
            const verifyRes = await fetch("/api/auth/register-verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, response: regResponse }),
            });
            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.verified) {
              toast.success("🎉 Fingerprint successfully registered & verified!");
            } else {
              toast.warning("Biometric verification failed, but you are logged in via password.");
            }
          }
        } catch (err: any) {
          console.warn("Fingerprint registration cancelled or failed:", err);
          if (
            err.name === "NotAllowedError" ||
            err.message?.includes("cancelled") ||
            err.message?.includes("timed out")
          ) {
            toast.info("Fingerprint setup skipped/cancelled. Proceeding to dashboard...");
          } else {
            toast.error("Biometric setup could not complete, continuing with normal login...");
          }
        }

        // Proceed to dashboard after initial registration attempt (success or skip)
        window.location.href = fallbackRedirect;
        return;
      }

      // Step 4B: If REGISTERED -> Trigger startAuthentication (Verify Biometric 2FA)
      toast.info("Please touch sensor / verify biometrics to complete login...");
      setStatusText("Touch sensor to verify...");

      try {
        const authResponse = await startAuthentication({ optionsJSON: challengeData });

        setStatusText("Verifying token...");
        const verifyRes = await fetch("/api/auth/login-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, response: authResponse }),
        });
        const verifyData = await verifyRes.json();

        if (verifyRes.ok) {
          toast.success("🛡️ Biometric verification successful!");
          window.location.href = verifyData.redirectUrl || fallbackRedirect;
          return;
        } else {
          toast.error(verifyData.message || "Biometric 2FA verification failed.");
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn("Fingerprint authentication cancelled or failed:", err);
        if (
          err.name === "NotAllowedError" ||
          err.message?.includes("cancelled") ||
          err.message?.includes("timed out")
        ) {
          toast.error("Biometric 2FA cancelled. Security check required to login.");
        } else {
          toast.error(err.message || "Biometric verification failed.");
        }
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Login request failed:", error);
      toast.error("Network error occurred. Please check your console.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050A15] px-4 font-sans selection:bg-blue-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f1a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="absolute top-0 -translate-y-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none duration-1000"></div>
      <div className="absolute bottom-0 translate-y-[20%] right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" style={{ animation: 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>

      <div className="relative w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="rounded-3xl bg-[#0B1121]/70 backdrop-blur-2xl border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 sm:p-10 transition-all">
          
          <div className="text-center mb-10 relative">
            <div className="mx-auto h-16 w-16 bg-slate-900/80 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(37,99,235,0.2)] border border-blue-500/30 relative group overflow-hidden">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-md group-hover:bg-blue-500/30 transition-all"></div>
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain relative z-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide mb-3">
              Authenticate to enter the mrgrp
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold">
              <Fingerprint className="h-3.5 w-3.5 animate-pulse" />
              <span>WebAuthn Biometric 2FA Ready</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                Corporate Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-500">
                  <Mail className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">
                Security Key
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500 text-slate-500">
                  <Lock className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="block w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-700/80 bg-slate-900/60 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-widest uppercase text-white bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform active:scale-[0.98] transition-all disabled:opacity-80 disabled:cursor-not-allowed disabled:transform-none border border-blue-500/50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2.5">
                  <Fingerprint className="h-5 w-5 animate-pulse text-blue-200" />
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="tracking-normal font-semibold text-xs sm:text-sm">{statusText}</span>
                </div>
              ) : (
                "Login Now"
              )}
            </button>
          </form>
          
        </div>
        
        <p className="text-center text-[10px] text-slate-600 mt-6 font-bold tracking-widest uppercase">
          Enterprise Resource Planning v1.0
        </p>
      </div>
    </div>
  );
}