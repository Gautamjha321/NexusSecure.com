"use client";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />

      {/* --- How It Works --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-slate-900"
            >
              How NexusSecure Works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-slate-500 font-medium"
            >
              Enterprise-grade security in three simple steps.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden md:block absolute top-20 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-indigo-50 via-indigo-200 to-indigo-50 border-t-2 border-dashed border-indigo-200" style={{ zIndex: -1 }}></div>
            
            {[
              { step: "1", title: "Connect Target", desc: "Simply paste your web application URL or API endpoint. No agent installations required." },
              { step: "2", title: "Deep Analysis", desc: "Our AI-driven engine passively and actively crawls your application to detect entry points." },
              { step: "3", title: "Remediate", desc: "Get actionable development advice with precise code snippets fixing the root cause within minutes." }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="text-center group"
              >
                <div className="w-24 h-24 mx-auto bg-indigo-50 border-8 border-white text-indigo-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-100 group-hover:scale-110 transition-transform mb-8">
                  {item.step}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section> 

      {/* --- CTA Section --- */}     
      <section className="py-24 px-6 mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto bg-indigo-900 rounded-[3rem] p-10 sm:p-16 md:p-24 relative overflow-hidden text-center md:text-left shadow-2xl shadow-indigo-200"
        >
          <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <ShieldCheck size={400} className="text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                Ready to find <br className="hidden md:block"/>
                your first bug?
              </h2>
              <p className="text-indigo-200 text-xl font-medium">Join 10,000+ security researchers and developers today.</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/signup" className="bg-white text-indigo-900 px-12 py-6 rounded-2xl font-black text-xl hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3">
                Start Free Trial <ArrowRight size={24} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-16 border-t border-slate-100/50 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-extrabold tracking-tight">Nexus<span className="text-indigo-600">Secure</span></span>
          </div>
          <p className="text-slate-500 font-medium italic text-center md:text-left">
            © 2026 NexusSecure. All rights reserved. Made by   <span className="font-semibold not-italic">Gautam Jha ❤</span>.
          </p>
          <div className="flex gap-6 text-slate-400 font-bold text-sm uppercase tracking-widest">
            <a href="#" className="hover:text-indigo-600 transition">Twitter</a>
            <a href="#" className="hover:text-indigo-600 transition">GitHub</a>
            <a href="#" className="hover:text-indigo-600 transition">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
