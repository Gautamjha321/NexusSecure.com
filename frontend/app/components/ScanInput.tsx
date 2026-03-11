"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Globe, Radar, ShieldCheck } from "lucide-react";

import { useAuth } from "@/lib/auth";
import useScan from "../hooks/useScan";

function normalizeTarget(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function ScanInput() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { start, loading } = useScan();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const handleScan = async () => {
    setError("");

    if (authLoading) {
      setError("Session state is still loading. Try again in a moment.");
      return;
    }

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const targetUrl = normalizeTarget(url);
    if (!targetUrl) {
      setError("Enter a target website URL.");
      return;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        setError("Only http:// and https:// targets are supported.");
        return;
      }
    } catch {
      setError("Enter a valid URL such as https://example.com");
      return;
    }

    try {
      const scan = await start(targetUrl);
      router.push(`/scan/${scan.id}`);
    } catch {
      setError("Scan request failed. Confirm target URL and try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="rounded-2xl border border-slate-300 bg-white/95 p-2 shadow-[0_14px_30px_rgba(13,38,59,0.12)]">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <Globe className="h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="https://target-company.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleScan();
                }
              }}
              className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
          </label>

          <button
            onClick={() => void handleScan()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Radar className="h-4 w-4" />
            {loading ? "Queueing scan..." : "Launch Security Scan"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Passive + active checks
        </span>
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          OWASP-focused findings
        </span>
      </div>

      {error && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
