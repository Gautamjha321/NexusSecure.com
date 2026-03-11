"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { getScanHistory, startScan } from "@/lib/scanApi";
import {
  Activity, Globe, Loader2, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, Zap, RefreshCcw, Eye,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  completed: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500" },
  running:   { label: "Running",   color: "text-amber-700",   bg: "bg-amber-50 border-amber-100",   dot: "bg-amber-500 animate-pulse" },
  pending:   { label: "Pending",   color: "text-sky-700",     bg: "bg-sky-50 border-sky-100",       dot: "bg-sky-400" },
  failed:    { label: "Failed",    color: "text-red-700",     bg: "bg-red-50 border-red-100",       dot: "bg-red-500" },
};

export default function LiveScansPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [scanUrl, setScanUrl] = useState("");
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState("");

  const fetchScans = () => {
    getScanHistory()
      .then((res) => setScans(res.results || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchScans();
    const interval = setInterval(fetchScans, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl.trim()) return;
    try {
      setLaunching(true);
      setError("");
      await startScan(scanUrl);
      setScanUrl("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to start scan.");
    } finally {
      setLaunching(false);
    }
  };

  const running  = scans.filter(s => s.status !== "completed" && s.status !== "failed");
  const finished = scans.filter(s => s.status === "completed" || s.status === "failed");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">

        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-8 py-5 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">Live Scans</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Monitor active and recently completed scans in real-time</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live — refreshing every 3s
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

          {/* Launch New Scan */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-zinc-900 mb-1">Launch New Scan</h2>
            <p className="text-xs text-zinc-500 mb-4">Enter a target URL to start a new vulnerability scan immediately.</p>
            <form onSubmit={handleLaunch} className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 transition-all placeholder:text-zinc-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={launching}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-60 shadow-sm"
              >
                {launching ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {launching ? "Starting…" : "Launch"}
              </button>
            </form>
            {error && <p className="mt-3 text-xs text-red-600 flex items-center gap-1"><AlertTriangle size={12} />{error}</p>}
          </div>

          {/* Active Scans */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-900">Active Scans <span className="ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-xs">{running.length}</span></h2>
              <button onClick={fetchScans} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                <RefreshCcw size={12} /> Refresh
              </button>
            </div>

            {running.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 text-center">
                <Clock className="mx-auto text-zinc-300 mb-3" size={32} />
                <p className="text-sm font-medium text-zinc-500">No active scans right now</p>
                <p className="text-xs text-zinc-400 mt-1">Launch a scan above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {running.map(scan => {
                  const cfg = statusConfig[scan.status] || statusConfig.pending;
                  return (
                    <div key={scan.id} className="bg-white rounded-2xl border border-zinc-200 shadow-sm px-6 py-4 flex items-center gap-6">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{scan.target_url}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Started {new Date(scan.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {scan.progress !== undefined && (
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${scan.progress || 0}%` }} />
                            </div>
                            <span className="text-xs text-zinc-500">{scan.progress || 0}%</span>
                          </div>
                        )}
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        <Link href={`/scan/${scan.id}`} className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
                          <Eye size={15} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recently Completed */}
          <section>
            <h2 className="text-sm font-semibold text-zinc-900 mb-4">Recently Completed <span className="ml-1.5 px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-md text-xs">{finished.length}</span></h2>
            {finished.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-10 text-center">
                <CheckCircle2 className="mx-auto text-zinc-300 mb-3" size={32} />
                <p className="text-sm font-medium text-zinc-500">No completed scans yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                      <th className="px-6 py-3.5">Target</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Issues</th>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-6 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {finished.slice(0, 15).map(scan => {
                      const cfg = statusConfig[scan.status] || statusConfig.completed;
                      return (
                        <tr key={scan.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900 max-w-[220px] truncate">{scan.target_url}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-zinc-700">{scan.vulnerability_count ?? 0} issues</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">{new Date(scan.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/scan/${scan.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100">
                              View <ChevronRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
