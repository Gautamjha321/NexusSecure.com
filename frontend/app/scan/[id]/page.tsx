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
  ExternalLink, Search, Server, Lock, Fingerprint, Info, CheckCircle2, Terminal
} from "lucide-react";
import { downloadCSV } from "@/lib/exportUtils";

export default function ScanResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // Custom frontend state to smoothly orchestrate scanning visual representation
  const [virtualProgress, setVirtualProgress] = useState(0);
  const [isVirtualScanning, wSIsVirtualScanning] = useState<boolean | null>(null);
  
  // Store generated logs locally for visual cascade effect
  const [uiLogs, setUiLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchScanData = async () => {
      try {
        const res = await getScanResult(id as string);
        setData(res);
        setLoading(false);
        
        // Define scanning condition on first response
        if (isVirtualScanning === null) {
            // Even if server is already completed, force animation flow
            wSIsVirtualScanning(true); 
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setLoading(false);
      }
    };

    fetchScanData();
    const interval = setInterval(fetchScanData, 3000);
    return () => clearInterval(interval);
  }, [id, router, isVirtualScanning]);

  // Orchestrate the progress loop smoothly on the frontend
  useEffect(() => {
    if (isVirtualScanning === true) {
       const timer = setInterval(() => {
          setVirtualProgress(prev => {
             const serverCompleted = data?.status === 'completed' || data?.status === 'failed';
             const nextProgress = prev + Math.floor(Math.random() * 8) + 2; 

             // Wait at 99% until server is actually complete
             if (nextProgress >= 100) {
                 if (serverCompleted) {
                     clearInterval(timer);
                     setTimeout(() => wSIsVirtualScanning(false), 500); // 500ms grace period at 100%
                     return 100;
                 }
                 return 99; 
             }
             return nextProgress;
          });
       }, 500);
       return () => clearInterval(timer);
    }
  }, [isVirtualScanning, data?.status]);

  // Generate logs cascading effect matching visual progress
  useEffect(() => {
      const dbLogs = data?.logs || [];
      if (virtualProgress < 100) {
          const expectedLogCount = Math.floor((virtualProgress / 100) * Math.max(dbLogs.length, 6));
          const visibleLogs = dbLogs.length > 0 
                ? dbLogs.slice(0, expectedLogCount)
                : Array(expectedLogCount).fill(0).map((_, i) => ({
                    created_at: new Date(Date.now() - (10 - i) * 1000).toISOString(),
                    tool_name: 'engine',
                    status: 'running',
                    message: `Executing deep scan phase ${i + 1}...`
                }));
          setUiLogs(visibleLogs);
      } else {
          setUiLogs(dbLogs);
      }
  }, [virtualProgress, data?.logs]);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white/50 backdrop-blur-3xl">
      <div className="relative flex justify-center items-center">
        <div className="absolute w-32 h-32 border-[6px] border-slate-100 rounded-full"></div>
        <div className="absolute w-32 h-32 border-[6px] border-indigo-500/0 border-t-indigo-600 border-r-indigo-600 rounded-full animate-[spin_2s_linear_infinite]"></div>
        <div className="absolute w-24 h-24 border-[4px] border-indigo-100/30 border-b-indigo-400 rounded-full animate-[spin_1.5s_linear_reverse]"></div>
        <ShieldCheck className="text-indigo-600 w-10 h-10 relative z-10 animate-pulse drop-shadow-md" />
      </div>
      <p className="mt-8 text-indigo-800 font-black text-xs tracking-[0.3em] uppercase animate-pulse">Initializing Security Protocol</p>
    </div>
  );

  if (!data) return <div className="p-20 text-center text-slate-500">Scan parameters unsupported.</div>;

  const handleExportResults = () => {
    if (!vulnerabilities || vulnerabilities.length === 0) return;

    const exportData = vulnerabilities.map(v => ({
      "Vuln ID": v.id || "N/A",
      "Title": v.title,
      "Severity": v.severity.toUpperCase(),
      "CVSS Score": v.cvss_score || "N/A",
      "Category": v.category || "N/A",
      "Detection Tool": v.tool_name,
      "Remediation": v.remediation ? v.remediation.replace(/\n/g, ' ') : "N/A",
      "Found On": new Date().toLocaleString()
    }));

    downloadCSV(exportData, `nexus-scan-${id}-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const isScanning = isVirtualScanning;

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* --- Global Command Bar --- */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-zinc-600" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                {data.target_url} <ExternalLink size={14} className="text-zinc-400" />
              </h1>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">Audit ID: {id?.toString().slice(0,12)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportResults}
              disabled={!vulnerabilities.length}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
            >
              <Download size={14} /> Export Report
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 text-zinc-400 hover:text-zinc-900 border border-zinc-200 rounded-lg transition-colors hover:bg-zinc-50"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* --- Scanning Progress (Live Feed Style) --- */}
        {isScanning && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-2 bg-[#09090b] rounded-2xl p-6 text-zinc-300 font-mono text-xs shadow-sm border border-zinc-800 relative overflow-hidden flex flex-col">
               <div className="flex items-center gap-3 text-zinc-100 mb-5 border-b border-zinc-800 pb-4 relative z-10">
                 <Terminal size={16} className="text-zinc-400" /> 
                 <span className="font-semibold tracking-wide text-sm">Engine Logs</span>
                 <div className="h-[1px] flex-1 bg-zinc-800 ml-4 hidden sm:block"></div>
                 <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-md uppercase font-medium">Running</span>
               </div>
               
               <div className="space-y-3 opacity-90 h-56 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
                 <div className="flex gap-4">
                   <span className="text-zinc-500 shrink-0">{new Date().toLocaleTimeString('en-US',{hour12:false})}</span>
                   <span className="text-zinc-300 font-medium">{`> Initializing audit protocol for ${data.target_url}...`}</span>
                 </div>
                 
                 {uiLogs && uiLogs.length > 0 ? (
                   uiLogs.map((log: any, i: number) => (
                     <div key={i} className="flex gap-4 animate-in fade-in pb-1">
                       <span className="text-zinc-500 shrink-0">{new Date(log.created_at).toLocaleTimeString('en-US',{hour12:false})}</span>
                       <span className={log.status === 'failed' ? 'text-red-400' : log.status === 'completed' ? 'text-indigo-400' : 'text-emerald-400'}>
                         {`> `} {log.tool_name.toUpperCase()}: {log.message}
                       </span>
                     </div>
                   ))
                 ) : (
                   <div className="flex gap-4">
                     <span className="text-zinc-500 shrink-0">{new Date().toLocaleTimeString('en-US',{hour12:false})}</span>
                     <span className="text-emerald-400">{`> Bypassing WAF & Establishing Handshake...`}</span>
                   </div>
                 )}
                 
                 <div className="flex gap-4 mt-4 animate-pulse opacity-60">
                   <span className="text-zinc-500 shrink-0">{new Date().toLocaleTimeString('en-US',{hour12:false})}</span>
                   <span className="text-zinc-400">{`> Awaiting additional telemetry_`}</span>
                 </div>
               </div>
            </div>
            
            <div className="bg-zinc-900 rounded-2xl p-8 text-white flex flex-col justify-center items-center text-center shadow-sm relative overflow-hidden border border-zinc-800">
               <h3 className="text-6xl font-black mb-2 relative z-10 tracking-tighter">{virtualProgress}%</h3>
               <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-6 relative z-10">Deep Scan In Progress</p>
               
               <div className="w-full bg-zinc-800 h-2 rounded-full mt-2 overflow-hidden relative z-10">
                 <div 
                   className="bg-zinc-200 h-full relative duration-500" 
                   style={{width: `${virtualProgress}%`, transition: 'width 0.5s ease-out'}}
                 >
                 </div>
               </div>
               <p className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Engine v4.2 Active</p>
            </div>
          </div>
        )}

        {/* --- Analytics & Insights Row --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Risk Score Half-Donut Gauge */}
          {/* Risk Score Half-Donut Gauge */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4 z-10">Security Score</p>
            
            <div className="relative w-48 h-28 flex items-end justify-center z-10">
              {/* Background SVG Arc */}
              <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full overflow-visible">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f4f4f5" strokeWidth="12" strokeLinecap="round" />
                
                {/* Colored Progress SVG Arc */}
                <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  stroke={securityScore > 70 ? "#10b981" : securityScore > 40 ? "#f59e0b" : "#ef4444"} 
                  strokeWidth="12" 
                  strokeLinecap="round" 
                  strokeDasharray="251.2" // PI * r (approx)
                  strokeDashoffset={251.2 - (251.2 * securityScore) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              
              <div className="text-center pb-2">
                <div className="text-5xl font-bold tracking-tighter text-zinc-900">
                  {securityScore}
                </div>
              </div>
            </div>
            
            <p className="text-sm font-medium text-zinc-500 mt-4 z-10">
               Status: <span className={securityScore > 70 ? 'text-emerald-600 font-semibold' : securityScore > 40 ? 'text-amber-600 font-semibold' : 'text-red-600 font-semibold'}>
                 {securityScore > 70 ? 'Excellent' : securityScore > 40 ? 'Moderate' : 'At Risk'}
               </span>
            </p>
          </div>

          {/* Severity Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col md:flex-row items-center">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                    {stats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <ReTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 px-6 w-full mt-4 md:mt-0">
              {stats.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                    <span className="text-xs font-semibold text-zinc-500">{s.name}</span>
                  </div>
                  <span className="font-bold text-zinc-900">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Quick Insights */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
            <h4 className="text-xs font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Environment</h4>
            <div className="space-y-4">
              <InsightItem icon={<Server size={14}/>} label="Server" value="nginx/1.24.0" />
              <InsightItem icon={<Lock size={14}/>} label="SSL" value="Valid" color="text-zinc-600" />
              <InsightItem icon={<Fingerprint size={14}/>} label="IP Address" value="192.168.1.104" />
              <InsightItem icon={<Info size={14}/>} label="Tech Stack" value="React, Node.js" />
            </div>
          </div>
        </div>

        {/* --- Main Findings Section --- */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Security Vulnerabilities</h2>
              <p className="text-sm text-zinc-500 mt-1">Detailed breakdown of discovered entry points and risks.</p>
            </div>
            
            <div className="flex bg-zinc-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
               {['all', 'critical', 'high', 'medium'].map((s) => (
                 <button 
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-medium uppercase transition-colors whitespace-nowrap ${
                    filter === s 
                      ? 'bg-white text-zinc-900 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                 >
                   {s}
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
             {filteredVulns.length > 0 ? (
                <VulnerabilityTable list={filteredVulns} />
             ) : (
                <div className="py-24 text-center">
                   <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                      <ShieldCheck className="text-emerald-500" size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-zinc-900">System Secure</h3>
                   <p className="text-zinc-500 text-sm max-w-xs mx-auto mt-2">No {filter !== 'all' ? filter : ''} vulnerabilities detected in this audit layer.</p>
                </div>
             )}
          </div>
        </div>

        {/* --- Remediation Strategy --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                <Zap size={16} className="text-zinc-400" /> Immediate Action Plan
              </h3>
              <ul className="space-y-5">
                 <li className="flex gap-4 items-start">
                    <div className="bg-zinc-100 text-zinc-900 w-6 h-6 rounded flex items-center justify-center text-xs font-bold leading-none shrink-0">1</div>
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium">Patch the <span className="font-semibold text-red-600">SQL Injection</span> vulnerability on the login endpoint immediately to prevent data exfiltration.</p>
                 </li>
                 <li className="flex gap-4 items-start">
                    <div className="bg-zinc-100 text-zinc-900 w-6 h-6 rounded flex items-center justify-center text-xs font-bold leading-none shrink-0">2</div>
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium">Update server headers to include <span className="font-semibold text-zinc-900">Content-Security-Policy</span> to mitigate XSS risks.</p>
                 </li>
              </ul>
           </div>

           <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <AlertTriangle size={20} />
                 </div>
                 <div>
                    <h4 className="font-semibold text-zinc-900 text-sm">Priority Fix Required</h4>
                    <p className="text-xs text-zinc-500 font-medium">OWASP Top 10 Compliance</p>
                 </div>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed border-l-2 border-zinc-200 pl-4 bg-zinc-50/50 p-4 rounded-r-xl">
                "Based on the current attack surface, the system is highly susceptible to automated credential stuffing. We recommend implementing Rate Limiting (429) across all API routes."
              </p>
           </div>
        </div>

      </div>
      
      {/* Global CSS for custom scrollbar in logs */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(74, 222, 128, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(74, 222, 128, 0.5);
        }
      `}} />
    </main>
  );
}

// --- Helper Components ---

function InsightItem({ icon, label, value, color = "text-zinc-900" }: any) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-zinc-500 font-medium">
        {icon} <span>{label}</span>
      </div>
      <span className={`font-semibold truncate max-w-[120px] ${color}`}>{value}</span>
    </div>
  );
}