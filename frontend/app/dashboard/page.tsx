"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { startScan, getScanHistory, deleteScan, ScanResult } from "@/lib/scanApi";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { 
  LogOut, Activity, ShieldCheck, Bell, LayoutDashboard, Search, Trash2, Eye, 
  Loader2, AlertTriangle, ShieldAlert, Globe, Filter, Zap, Settings, 
  Terminal, BarChart3, Shield, Cpu, Database, ChevronRight, PlusCircle, Download
} from "lucide-react";
import { downloadCSV } from "@/lib/exportUtils";
import Sidebar from "@/app/components/Sidebar";

// --- Mock Data for Trends ---
const trendData = [
  { date: 'Jan', bugs: 40 }, { date: 'Feb', bugs: 30 }, { date: 'Mar', bugs: 65 },
  { date: 'Apr', bugs: 45 }, { date: 'May', bugs: 90 }, { date: 'Jun', bugs: 55 },
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, logout, loading: authLoading } = useAuth();
  const [scans, setScans] = useState<any[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [scanUrl, setScanUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  // Auth loading state — resolves after 1s max so guests always see the dashboard
  const [showLoader, setShowLoader] = useState(true);

  const deleteScanApi = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this scan report?")) return;
    try {
      await deleteScan(id); // Using the imported deleteScan function
      setScans(prev => prev ? prev.filter(s => s.id !== id) : null); // Update state
    } catch (err: any) {
      console.error(err);
      setScanError("Failed to delete scan.");
    }
  };

  const handleQuickScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl.trim()) return;
    try {
      setIsScanning(true);
      setScanError("");
      const newScan = await startScan(scanUrl);
      setScanUrl("");
      router.push(`/scan/${newScan.id}`);
    } catch (error: any) {
      setScanError(error?.response?.data?.error || "Failed to start scan");
    } finally {
      setIsScanning(false);
    }
  };

  // Resolve loader when auth check completes (or after 1s fallback for guests)
  useEffect(() => {
    if (!authLoading) setShowLoader(false);
    const timer = setTimeout(() => setShowLoader(false), 1000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  useEffect(() => {
    const fetchHistory = () => {
      getScanHistory()
        .then((res) => setScans(res.results || []))
        .catch(() => setScans(prev => prev || []));
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const autoScanUrl = searchParams.get("autoScanUrl");
    if (autoScanUrl && !isScanning) {
        setScanUrl(autoScanUrl);
        // We use a small timeout to let the UI settle before starting the scan automatically
        setTimeout(() => {
            setIsScanning(true);
            setScanError("");
            startScan(autoScanUrl)
              .then(newScan => {
                 setScanUrl("");
                 router.replace(`/scan/${newScan.id}`);
              })
              .catch((error: any) => {
                 setScanError(error?.response?.data?.error || "Failed to start scan");
              })
              .finally(() => setIsScanning(false));

        }, 500);
    }
  }, [searchParams]);

  const scanList = scans ?? [];
  const filteredScans = scanList.filter(s => {
    const matchesSearch = s.target_url.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "running") return matchesSearch && s.status !== "completed";
    if (activeTab === "completed") return matchesSearch && s.status === "completed";
    return matchesSearch;
  });

  const totalBugs = scanList.reduce((sum, s) => sum + (s.vulnerability_count || 0), 0);
  const securityScore = Math.max(5, 100 - (totalBugs * 1.2));

  const handleExportHistory = () => {
    if (!filteredScans.length) return;
    
    const exportData = filteredScans.map(scan => ({
      "Scan ID": scan.id,
      "Target URL": scan.target_url,
      "Status": scan.status,
      "Vulnerabilities Found": scan.vulnerability_count || 0,
      "Scan Date": new Date(scan.created_at).toLocaleString(),
    }));

    downloadCSV(exportData, `nexus-scan-history-${new Date().toISOString().split('T')[0]}.csv`);
  };

  if (showLoader) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <ShieldCheck className="text-indigo-500 w-8 h-8" />
      </div>
      <p className="mt-8 text-indigo-200/50 font-mono text-[10px] tracking-[0.5em] uppercase">Initialising Kernel...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      
      <Sidebar />

      {/* --- 2. MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col overflow-x-hidden min-w-0 pb-6 sm:pb-8">
        
        {/* Top Navbar */}
        <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 md:px-8 py-3 md:py-4 sticky top-0 z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 tracking-tight">Overview</h2>
              <div className="hidden md:block h-5 w-[1px] bg-zinc-200 mx-1"></div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-zinc-500">System Operational</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                 <input 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search Scans..." 
                   className="w-full sm:w-48 md:w-64 pl-9 pr-4 py-2 bg-zinc-100 border border-transparent rounded-lg text-sm transition-colors focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 outline-none placeholder:text-zinc-500"
                 />
              </div>
              <form onSubmit={handleQuickScan} className="flex items-center gap-2">
                <input 
                  type="url"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="https://example.com" 
                  className="hidden lg:block px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm w-52 xl:w-64 focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 shadow-sm outline-none transition-all placeholder:text-zinc-400"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isScanning}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-zinc-900 text-white rounded-lg shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-75 text-sm font-medium whitespace-nowrap active:scale-95"
                >
                   {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                   <span className="hidden sm:inline">Quick Scan</span>
                   <span className="sm:hidden">Scan</span>
                </button>
              </form>
            </div>
          </div>
          {/* Mobile scan url input */}
          <form onSubmit={handleQuickScan} className="mt-2 lg:hidden flex gap-2">
            <input 
              type="url"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              placeholder="Scan a URL: https://example.com" 
              className="flex-1 px-3 py-2 bg-zinc-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-zinc-300 focus:ring-4 focus:ring-zinc-100 outline-none placeholder:text-zinc-400"
            />
          </form>
        </header>

        {scanError && (
          <div className="absolute top-20 right-8 bg-red-100 text-red-600 px-4 py-3 rounded-xl border border-red-200 shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle size={16} />
            <span className="text-xs font-bold">{scanError}</span>
            <button onClick={() => setScanError("")} className="ml-2 font-black text-red-400 hover:text-red-700">×</button>
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Dashboard Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard label="Critical Threats" value={totalBugs} trend="+12% from last week" color="text-zinc-900"/>
            <StatCard label="Assets Monitored" value={scanList.length} trend="All systems online" color="text-zinc-900"/>
            <StatCard label="Security Index" value={`${securityScore}%`} trend="Infrastructure Health" color="text-zinc-900"/>
            
            {/* Engine Load Stats */}
            <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between mt-2 sm:mt-0">
               <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                 <span>Engine Load</span>
               </div>
               <div className="space-y-4 mt-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5"><span className="text-zinc-500">CPU</span> <span className="text-zinc-900">24%</span></div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full"><div className="bg-zinc-900 w-[24%] h-full rounded-full"></div></div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5"><span className="text-zinc-500">RAM</span> <span className="text-zinc-900">48%</span></div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full"><div className="bg-zinc-500 w-[48%] h-full rounded-full"></div></div>
                  </div>
               </div>
            </div>
          </div>

          {/* Charts & Feed Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 xl:gap-8">
            
            {/* Main History Chart */}
            <div className="md:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-zinc-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                 <div>
                    <h3 className="text-base font-semibold text-zinc-900">Threat Analytics</h3>
                    <p className="text-sm text-zinc-500 mt-1">Incidents detected over time</p>
                 </div>
                 <div className="flex bg-zinc-100 p-1 rounded-lg">
                    <button className="px-3 py-1.5 text-xs font-medium bg-white text-zinc-900 rounded-md shadow-sm">7D</button>
                    <button className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">30D</button>
                 </div>
              </div>
              <div className="h-[220px] sm:h-[260px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorBugs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.05}/>
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} dx={-10} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="bugs" stroke="#18181b" strokeWidth={2} fillOpacity={1} fill="url(#colorBugs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="bg-[#09090b] rounded-2xl p-4 sm:p-6 text-zinc-300 font-mono text-xs shadow-sm relative overflow-hidden border border-zinc-800 flex flex-col max-h-[320px] md:max-h-[360px]">
              <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
                </div>
                <span className="text-zinc-500 text-[10px] font-medium tracking-widest uppercase">system.log</span>
              </div>
              <div className="space-y-3 opacity-90 relative z-10 custom-scrollbar overflow-y-auto pr-2 flex-1">
                <div className="flex gap-4">
                  <span className="text-zinc-500 shrink-0">12:44:01</span>
                  <span className="text-zinc-300">Connecting secure relay...</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-500 shrink-0">12:44:05</span>
                  <span className="text-zinc-300">Scanning ports: 80, 443, 8080</span>
                </div>
                <div className="flex gap-4 animate-pulse">
                  <span className="text-zinc-500 shrink-0">12:44:10</span>
                  <span className="text-zinc-100 font-medium">Warning: Unauthenticated endpoint detected.</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-500 shrink-0">12:44:12</span>
                  <span className="text-zinc-300">Encrypting report payload...</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-zinc-500 shrink-0">12:44:15</span>
                  <span className="text-emerald-400">Engine ready for next task.</span>
                </div>
                <div className="flex flex-col gap-1 mt-6 animate-pulse opacity-50">
                   <div className="w-2 h-4 bg-zinc-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Audit Table */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div className="flex flex-wrap bg-white p-1 rounded-lg border border-zinc-200 gap-1">
                  <TabButton label="All Scans" count={scanList.length} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                  <TabButton label="Running" count={scanList.filter(s => s.status !== 'completed').length} active={activeTab === 'running'} onClick={() => setActiveTab('running')} />
                  <TabButton label="Completed" count={scanList.filter(s => s.status === 'completed').length} active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} />
               </div>
               <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                 <button 
                   onClick={handleExportHistory}
                   disabled={!filteredScans.length}
                   className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-50"
                 >
                    <Download size={14}/> Export CSV
                 </button>
                 <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
                    <Filter size={14}/> Filter
                 </button>
               </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
              {/* Mobile card view */}
              <div className="sm:hidden divide-y divide-zinc-100">
                {filteredScans.map((scan) => (
                  <div key={scan.id} className="p-4 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="bg-white border border-zinc-200 p-1.5 rounded-lg text-zinc-400 shadow-sm shrink-0 mt-0.5">
                        <Globe size={14}/>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 break-all">{scan.target_url}</p>
                    </div>
                    <div className="flex items-center justify-between pl-8">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                          scan.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' 
                          : scan.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100/50'
                          : 'bg-amber-50 text-amber-700 border-amber-100/50 animate-pulse'
                        }`}>{scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}</span>
                        <span className="text-xs text-zinc-500">{scan.vulnerability_count} issues</span>
                      </div>
                      <div className="flex gap-1">
                        <Link href={`/scan/${scan.id}`} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"><Eye size={15}/></Link>
                        <button onClick={() => deleteScanApi(scan.id)} className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15}/></button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 pl-8">{new Date(scan.created_at).toLocaleString()}</p>
                  </div>
                ))}
                {filteredScans.length === 0 && (
                  <p className="px-4 py-10 text-center text-zinc-500 text-sm">No scans found matching criteria.</p>
                )}
              </div>
              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-200 text-xs font-semibold text-zinc-500 tracking-wide">
                      <th className="px-4 md:px-6 py-4">Target URL</th>
                      <th className="px-4 md:px-6 py-4 font-normal text-zinc-500">Status</th>
                      <th className="px-4 md:px-6 py-4 font-normal text-zinc-500 hidden md:table-cell">Vulnerabilities</th>
                      <th className="px-4 md:px-6 py-4 text-right font-normal text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredScans.map((scan) => (
                      <tr key={scan.id} className="group hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white border border-zinc-200 p-2 rounded-lg text-zinc-400 shadow-sm hidden sm:flex">
                              <Globe size={16}/>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 truncate max-w-[160px] md:max-w-xs lg:max-w-sm">{scan.target_url}</p>
                              <p className="text-xs text-zinc-500 mt-0.5">{new Date(scan.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                             scan.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' 
                             : scan.status === 'failed' ? 'bg-red-50 text-red-700 border-red-100/50'
                             : 'bg-amber-50 text-amber-700 border-amber-100/50 animate-pulse'
                           }`}>
                             {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                           </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                          <span className={`text-sm font-medium ${scan.vulnerability_count > 0 ? 'text-zinc-900' : 'text-zinc-500'}`}>
                             {scan.vulnerability_count} issues
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link href={`/scan/${scan.id}`} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                                <Eye size={16}/>
                              </Link>
                              <button onClick={() => deleteScanApi(scan.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={16}/>
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                    {filteredScans.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">
                          No scans found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
               </table>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><ShieldCheck className="text-indigo-500 w-8 h-8 animate-pulse" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}

// --- Helper Components ---

function SidebarItem({ icon, label, active = false }: any) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
      active ? 'bg-zinc-100 text-zinc-900 font-medium font-semibold' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
    }`}>
      <div className={`${active ? 'text-zinc-900' : 'text-zinc-400'}`}>{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function StatCard({ label, value, trend, color }: any) {
  return (
    <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <h4 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 ${color}`}>{value}</h4>
      <p className="text-xs sm:text-sm font-medium text-zinc-400">{trend}</p>
    </div>
  );
}

function TabButton({ label, count, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-zinc-100 text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
      }`}
    >
      {label} <span className={`px-1.5 py-0.5 rounded text-[10px] ${active ? 'bg-zinc-200/50' : 'bg-zinc-100/50 text-zinc-400'}`}>{count}</span>
    </button>
  );
}