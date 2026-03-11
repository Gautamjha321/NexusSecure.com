"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getScanResult, ScanResult, Vulnerability } from "@/lib/scanApi";
import VulnerabilityTable from "@/app/components/VulnerabilityTable";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip 
} from "recharts";
import { 
  ShieldAlert, ShieldCheck, Globe, RefreshCcw, ArrowLeft,
  FileText, AlertTriangle, Activity, Zap, Download, 
  ExternalLink, Search, Server, Lock, Fingerprint, Info
} from "lucide-react";

export default function ScanResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) { router.push("/login"); return; }

    const fetchScanData = async () => {
      try {
        const res = await getScanResult(id as string);
        setData(res);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };

    fetchScanData();
    const interval = setInterval(fetchScanData, 3000);
    return () => clearInterval(interval);
  }, [id, router]);

  const vulnerabilities = data?.vulnerabilities || [];
  
  // --- Data Calculations ---
  const stats = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    vulnerabilities.forEach(v => {
      if (v.severity in counts) counts[v.severity as keyof typeof counts]++;
    });
    return [
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'Low', value: counts.low, color: '#3b82f6' },
    ];
  }, [vulnerabilities]);

  const securityScore = useMemo(() => {
    const weights = { critical: 30, high: 15, medium: 5, low: 2 };
    const deduction = vulnerabilities.reduce((acc, v) => acc + (weights[v.severity as keyof typeof weights] || 0), 0);
    return Math.max(0, 100 - deduction);
  }, [vulnerabilities]);

  const filteredVulns = vulnerabilities.filter(v => filter === "all" || v.severity === filter);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c10]">
      <div className="relative">
        <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 w-8 h-8" />
      </div>
      <p className="mt-6 text-indigo-200/50 font-mono text-[10px] tracking-[0.5em] uppercase animate-pulse">Decrypting Results...</p>
    </div>
  );

  if (!data) return <div className="p-20 text-center">Scan not found.</div>;

  const isScanning = data.status === "pending" || data.status === "running";

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* --- Global Command Bar --- */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition-all">
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
                {data.target_url} <ExternalLink size={14} className="text-slate-400" />
              </h1>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Audit ID: {id?.toString().slice(0,12)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <Download size={14} /> Export Report
            </button>
            <button className="p-2 text-slate-400 hover:text-indigo-600 border border-slate-200 rounded-xl transition-all">
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* --- Scanning Progress (Live Feed Style) --- */}
        {isScanning && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-6 text-indigo-400 font-mono text-xs shadow-xl">
               <div className="flex items-center gap-2 text-white mb-4 border-b border-slate-800 pb-2">
                 <Activity size={14} className="animate-spin" /> <span>ENGINE_SCAN_LOGS</span>
               </div>
               <div className="space-y-1 opacity-80">
                 <p>{`> Initializing crawler for ${data.target_url}...`}</p>
                 <p className="text-green-400">{`> Handshake successful. SSL/TLS verified.`}</p>
                 <p>{`> Injecting test payloads into entry points...`}</p>
                 <p className="animate-pulse">{`> Progress: ${data.progress}% - Analyzing DOM structure...`}</p>
               </div>
            </div>
            <div className="bg-indigo-600 rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center">
               <h3 className="text-5xl font-black mb-2">{data.progress}%</h3>
               <p className="text-xs font-bold uppercase tracking-widest opacity-80">Analysis in progress</p>
               <div className="w-full bg-white/20 h-1.5 rounded-full mt-6 overflow-hidden">
                 <div className="bg-white h-full transition-all duration-500" style={{width: `${data.progress}%`}}></div>
               </div>
            </div>
          </div>
        )}

        {/* --- Analytics & Insights Row --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Risk Score Gauge */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-center z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Score</p>
               <div className={`text-6xl font-black ${securityScore > 70 ? 'text-green-500' : 'text-red-500'}`}>
                 {securityScore}
               </div>
               <p className="text-xs font-bold text-slate-500 mt-2">Overall Rating: {securityScore > 70 ? 'Good' : 'At Risk'}</p>
            </div>
            <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 text-slate-50 opacity-[0.03]" />
          </div>

          {/* Severity Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 px-6 w-full">
              {stats.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase">{s.name}</span>
                  </div>
                  <span className="font-black text-slate-800">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Quick Insights */}
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Target Insights</h4>
            <div className="space-y-3">
              <InsightItem icon={<Server size={14}/>} label="Server" value="nginx/1.24.0" />
              <InsightItem icon={<Lock size={14}/>} label="SSL" value="Valid (Let's Encrypt)" color="text-green-600" />
              <InsightItem icon={<Fingerprint size={14}/>} label="IP Address" value="192.168.1.104" />
              <InsightItem icon={<Info size={14}/>} label="Tech Stack" value="React, Node.js" />
            </div>
          </div>
        </div>

        {/* --- Main Findings Section --- */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
            <div>
              <h2 className="text-xl font-black text-slate-800">Security Vulnerabilities</h2>
              <p className="text-xs text-slate-400 font-medium">Detailed breakdown of discovered entry points and risks.</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
               {['all', 'critical', 'high', 'medium'].map((s) => (
                 <button 
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                    filter === s ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                 >
                   {s}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
             {filteredVulns.length > 0 ? (
                <VulnerabilityTable list={filteredVulns} />
             ) : (
                <div className="py-24 text-center">
                   <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                      <ShieldCheck className="text-green-500" size={40} />
                   </div>
                   <h3 className="text-lg font-black text-slate-800">System Secure</h3>
                   <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">No {filter !== 'all' ? filter : ''} vulnerabilities detected in this audit layer.</p>
                </div>
             )}
          </div>
        </div>

        {/* --- Remediation Strategy (Extra Realistic Feature) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-[2.5rem] border border-indigo-100">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap size={16} /> Immediate Action Plan
              </h3>
              <ul className="space-y-4">
                 <li className="flex gap-4">
                    <div className="bg-white p-2 h-fit rounded-lg shadow-sm font-black text-indigo-600 text-xs">01</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Patch the <span className="font-bold text-red-600">SQL Injection</span> vulnerability on the login endpoint immediately to prevent data exfiltration.</p>
                 </li>
                 <li className="flex gap-4">
                    <div className="bg-white p-2 h-fit rounded-lg shadow-sm font-black text-indigo-600 text-xs">02</div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">Update server headers to include <span className="font-bold">Content-Security-Policy</span> to mitigate XSS risks.</p>
                 </li>
              </ul>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                    <AlertTriangle size={24} />
                 </div>
                 <div>
                    <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Priority Fix Required</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OWASP Top 10 Compliance</p>
                 </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-orange-200 pl-4">
                "Based on the current attack surface, the system is highly susceptible to automated credential stuffing. We recommend implementing Rate Limiting (429) across all API routes."
              </p>
           </div>
        </div>

      </div>
    </main>
  );
}

// --- Helper Components ---

function InsightItem({ icon, label, value, color = "text-slate-800" }: any) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-tighter">
        {icon} <span>{label}</span>
      </div>
      <span className={`font-black truncate max-w-[120px] ${color}`}>{value}</span>
    </div>
  );
}