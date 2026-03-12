"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startScan } from "@/lib/scanApi";
import { Search, Globe, ShieldCheck, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
  const [scanUrl, setScanUrl] = useState("");
  const [isStartingScan, setIsStartingScan] = useState(false);
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
    <section className="relative pt-32 pb-24 px-6 overflow-hidden min-h-[90vh] flex items-center">
      {/* Ambient Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-5xl mx-auto text-center space-y-10 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm font-bold shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          <span className="text-indigo-900">New: AI-Powered Zero Day Detection</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight"
        >
          Secure Your Web Apps <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient">
            Before Hackers Do
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium"
        >
          The all-in-one penetration testing tool. Paste your URL to find SQLi, XSS, and broken auth vulnerabilities in seconds.
        </motion.p>

        {/* SCANNER INPUT */}
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          onSubmit={handleScanSubmit} 
          className="relative max-w-3xl mx-auto mt-12 p-3 glass rounded-3xl shadow-2xl shadow-indigo-200 border border-white flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1 flex items-center px-5 gap-3">
            <Globe className="text-indigo-400" />
            <input 
              type="url" 
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              placeholder="https://your-website.com" 
              className="w-full py-5 bg-transparent outline-none text-xl text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-medium"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={isStartingScan} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-indigo-200"
          >
            {isStartingScan ? (
              <span className="flex items-center gap-3">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> 
                Scanning...
              </span>
            ) : (
              <>
                <Search size={24} strokeWidth={3} /> 
                Start Free Scan
              </>
            )}
          </button>
        </motion.form>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="pt-16"
        >
           <p className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase mb-8">Trusted by industry leaders</p>
           <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 grayscale hover:grayscale-0 transition-all duration-700">
              <div className="text-xl font-black flex items-center gap-2"><ShieldCheck size={24}/> DEFEND.IO</div>
              <div className="text-xl font-black italic">SECURECORP</div>
              <div className="text-xl font-black flex items-center gap-1"><Zap size={24}/> NEXUS_NET</div>
              <div className="text-xl font-black tracking-widest flex items-center gap-2"><Lock size={20}/> VAULTED</div>
           </div>
        </motion.div>
      </div>
    </section>
  );
}
