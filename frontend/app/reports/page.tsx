"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import { getScanHistory } from "@/lib/scanApi";
import { downloadCSV } from "@/lib/exportUtils";
import Link from "next/link";
import {
  BarChart3, Download, Eye, ShieldAlert, CheckCircle2, AlertTriangle,
  AlertCircle, TrendingUp, Globe, Calendar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

export default function ReportsPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScanHistory()
      .then(res => setScans(res.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = scans.filter(s => s.status === "completed");
  const totalIssues = scans.reduce((a, s) => a + (s.vulnerability_count || 0), 0);
  const avgIssues = completed.length ? (totalIssues / completed.length).toFixed(1) : "0";
  const securityScore = Math.max(5, Math.round(100 - totalIssues * 1.5));

  // Bar chart data (last 6 scans)
  const chartData = completed.slice(0, 6).reverse().map((s, i) => ({
    name: `Scan ${i + 1}`,
    issues: s.vulnerability_count || 0,
  }));

  // Severity mock (real data would come from vulnerabilities endpoint)
  const pieData = [
    { name: "Critical", value: Math.floor(totalIssues * 0.15), color: SEVERITY_COLORS.critical },
    { name: "High",     value: Math.floor(totalIssues * 0.25), color: SEVERITY_COLORS.high },
    { name: "Medium",   value: Math.floor(totalIssues * 0.40), color: SEVERITY_COLORS.medium },
    { name: "Low",      value: Math.floor(totalIssues * 0.20), color: SEVERITY_COLORS.low },
  ].filter(d => d.value > 0);

  const handleExport = () => {
    const data = scans.map(s => ({
      "Scan ID": s.id,
      "Target URL": s.target_url,
      "Status": s.status,
      "Issues Found": s.vulnerability_count || 0,
      "Scan Date": new Date(s.created_at).toLocaleString(),
    }));
    downloadCSV(data, `nexus-report-${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-zinc-200 px-8 py-5 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">Reports</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Aggregate analysis across all your vulnerability scans</p>
            </div>
            <button
              onClick={handleExport}
              disabled={!scans.length}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Scans", value: scans.length, icon: <Globe size={18} className="text-indigo-500" />, bg: "bg-indigo-50" },
              { label: "Issues Found", value: totalIssues, icon: <ShieldAlert size={18} className="text-red-500" />, bg: "bg-red-50" },
              { label: "Avg Issues / Scan", value: avgIssues, icon: <TrendingUp size={18} className="text-amber-500" />, bg: "bg-amber-50" },
              { label: "Security Score", value: `${securityScore}`, icon: <CheckCircle2 size={18} className="text-emerald-500" />, bg: "bg-emerald-50" },
            ].map(card => (
              <div key={card.label} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex items-start gap-4">
                <div className={`p-2 rounded-xl ${card.bg}`}>{card.icon}</div>
                <div>
                  <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Issues Per Scan</h2>
              <p className="text-xs text-zinc-500 mb-5">Last 6 completed scans</p>
              <div className="h-52">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                      <Bar dataKey="issues" fill="#18181b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm">No scan data yet</div>
                )}
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-zinc-900 mb-1">Severity Breakdown</h2>
              <p className="text-xs text-zinc-500 mb-5">Estimated distribution</p>
              {pieData.length > 0 ? (
                <>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e4e4e7" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                          <span className="text-zinc-600 font-medium">{d.name}</span>
                        </div>
                        <span className="text-zinc-900 font-semibold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-36 flex items-center justify-center text-zinc-400 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Scan Table */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">All Scan Reports</h2>
              <span className="text-xs text-zinc-500">{scans.length} total</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                  <th className="px-6 py-3.5">Target</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Issues</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {scans.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-400">No scans available</td></tr>
                )}
                {scans.map(scan => (
                  <tr key={scan.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 max-w-[200px] truncate">{scan.target_url}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        scan.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : scan.status === "failed" ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700">{scan.vulnerability_count ?? 0} issues</td>
                    <td className="px-6 py-4 text-xs text-zinc-500">{new Date(scan.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/scan/${scan.id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Eye size={13} /> View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
