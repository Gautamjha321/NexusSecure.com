"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { startScan } from "@/lib/scanApi";
import { 
  ShieldCheck, 
  Search, 
  Lock, 
  Terminal, 
  Zap, 
  Bug, 
  Globe, 
  ArrowRight,
  ShieldAlert,
  FileText,
  Menu,
  X,
} from "lucide-react";

export default function Home() {
  const [scanUrl, setScanUrl] = useState("");
  const [isStartingScan, setIsStartingScan] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl.trim() || isStartingScan) return;
    
    setIsStartingScan(true);
    try {
      const newScan = await startScan(scanUrl);
      router.push(`/scan/${newScan.id}`);
    } catch (error) {
      console.error("Failed to start scan", error);
      alert("Failed to start scan. Please check the URL and try again.");
      setIsStartingScan(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      
      {/* --- Navbar --- */}
      <nav className="relative px-4 sm:px-8 py-5 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShieldCheck className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight">Nexus<span className="text-indigo-600">Secure</span></span>
          </div>
          
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#" className="hover:text-indigo-600 transition">Vulnerability DB</a>
            <a href="#" className="hover:text-indigo-600 transition">Pricing</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="hidden sm:inline px-5 py-2 text-slate-600 hover:text-indigo-600 font-semibold transition">
              Login
            </Link>
            <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-sm sm:text-base shadow-lg shadow-indigo-200 transition">
              Get Started
            </Link>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-full mt-1 mx-4 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-1">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">Features</a>
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">Vulnerability DB</a>
            <a href="#" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">Pricing</a>
            <div className="border-t border-slate-100 pt-2 mt-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">Login</Link>
            </div>
          </div>
        )}
      </nav>

      {/* --- Hero Section & URL Scanner --- */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        {/* Ambient Glowing Backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
        <div className="absolute top-10 right-20 w-[300px] h-[300px] bg-purple-50 rounded-full blur-3xl opacity-60 -z-10"></div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 border border-indigo-100/50 rounded-full text-sm font-bold shadow-sm shadow-indigo-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: AI-Powered Zero Day Detection
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
            Secure Your Web Apps <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient">
              Before Hackers Do.
            </span>
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
            The all-in-one penetration testing tool. Paste your URL to find SQLi, XSS, and broken auth vulnerabilities in seconds.
          </p>

          {/* MAIN SCANNER INPUT */}
          <form onSubmit={handleScanSubmit} className="relative max-w-2xl mx-auto mt-10 p-2.5 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-900/5 border border-white/50 ring-1 ring-slate-100 flex flex-col md:flex-row gap-2 transition-all hover:shadow-indigo-900/10">
            <div className="flex-1 flex items-center px-4 gap-3">
              <Globe className="text-slate-400" />
              <input 
                type="url" 
                value={scanUrl}
                onChange={(e) => setScanUrl(e.target.value)}
                placeholder="https://your-website.com" 
                className="w-full py-4 bg-transparent outline-none text-lg text-slate-700 font-medium placeholder:text-slate-400"
                required
              />
            </div>
            <button type="submit" disabled={isStartingScan} className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 shadow-lg shadow-indigo-200">
              {isStartingScan ? <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Engines Firing...</span> : <><Search size={20} /> Start Free Scan</>}
            </button>
          </form>
          
          <div className="pt-10">
             <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-6 drop-shadow-sm">Trusted by innovative security teams worldwide</p>
             <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="text-xl font-black flex items-center gap-2"><ShieldCheck size={24}/> DEFEND.IO</div>
                <div className="text-xl font-black italic">SECURECORP</div>
                <div className="text-xl font-black flex items-center gap-1"><Zap size={24}/> NEXUS_NET</div>
                <div className="text-xl font-black tracking-widest flex items-center gap-2"><Lock size={20}/> VAULTED</div>
             </div>
          </div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section id="features" className="bg-slate-50 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Comprehensive Bug Finding</h2>
            <p className="text-slate-500 mt-2">Automated testing for the modern web</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-rose-600 group-hover:text-white transition-all shadow-sm relative z-10">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 relative z-10">Vulnerability Scanning</h3>
              <p className="text-slate-500 leading-relaxed font-medium relative z-10">
                Detect OWASP Top 10 risks including SQL Injection, Cross-Site Scripting (XSS), and CSRF automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-gradient-to-br group-hover:from-indigo-500 group-hover:to-blue-600 group-hover:text-white transition-all shadow-sm relative z-10">
                <FileText size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 relative z-10">Remediation Reports</h3>
              <p className="text-slate-500 leading-relaxed font-medium relative z-10">
                Get detailed PDF reports with proof-of-concept (PoC) and clear steps to fix every bug found.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-green-500 group-hover:text-white transition-all shadow-sm relative z-10">
                <Terminal size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 relative z-10">API Pentesting</h3>
              <p className="text-slate-500 leading-relaxed font-medium relative z-10">
                Not just websites! Paste your Swagger/OpenAPI URL to test your backend endpoints for leaks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- How It Works --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How NexusSecure Works</h2>
            <p className="text-slate-500 mt-2">Enterprise-grade security in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-100 via-indigo-200 to-indigo-100 border-t-2 border-dashed border-indigo-200" z-index="-1"></div>
            
            <div className="text-center relative z-10 bg-white pt-4">
              <div className="w-20 h-20 mx-auto bg-indigo-50 border-4 border-white text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100 mb-6">1</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Connect Target</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Simply paste your web application URL or API endpoint. No agent installations required.</p>
            </div>
            
            <div className="text-center relative z-10 bg-white pt-4">
              <div className="w-20 h-20 mx-auto bg-indigo-50 border-4 border-white text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100 mb-6">2</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Deep Analysis</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Our AI-driven engine passively and actively crawls your application to detect entry points.</p>
            </div>
            
            <div className="text-center relative z-10 bg-white pt-4">
              <div className="w-20 h-20 mx-auto bg-indigo-50 border-4 border-white text-indigo-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xl shadow-indigo-100 mb-6">3</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Remediate</h3>
              <p className="text-slate-500 max-w-xs mx-auto">Get actionable development advice with precise code snippets fixing the root cause within minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto bg-indigo-900 rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden text-center md:text-left">
          <div className="absolute top-0 right-0 p-10 opacity-10">
            <ShieldCheck size={300} className="text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to find your first bug?</h2>
              <p className="text-indigo-200 text-lg">Join 10,000+ security researchers and developers today.</p>
            </div>
            <div className="flex gap-4">
              <Link href="/signup" className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold hover:bg-indigo-50 transition flex items-center gap-2">
                Start Free Trial <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-slate-100 text-center text-slate-500 text-sm">
        <p>© 2026 NexusSecure PenTesting Lab. All rights reserved.</p>
      </footer>
    </main>
  );
}