"use client";

import { ShieldAlert, FileText, Terminal, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    title: "Vulnerability Scanning",
    description: "Detect OWASP Top 10 risks including SQL Injection, XSS, and CSRF automatically with 99.9% accuracy.",
    icon: ShieldAlert,
    color: "red",
  },
  {
    title: "Remediation Reports",
    description: "Get detailed PDF reports with proof-of-concept (PoC) and clear steps to fix every bug found.",
    icon: FileText,
    color: "indigo",
  },
  {
    title: "API Pentesting",
    description: "Test your backend endpoints for leaks by simply uploading your Swagger or OpenAPI documentation.",
    icon: Terminal,
    color: "emerald",
  }
];

export default function Features() {
  return (
    <section id="features" className="py-32 px-6 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900"
          >
            Comprehensive Bug Finding
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 font-medium"
          >
            Automated testing built for modern development teams.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 group relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform`}></div>
              
              <div className={`w-16 h-16 bg-${feature.color}-50 text-${feature.color}-600 rounded-2xl flex items-center justify-center mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg shadow-${feature.color}-100/50 relative z-10`}>
                <feature.icon size={32} />
              </div>
              
              <h3 className="text-2xl font-black mb-4 text-slate-800 relative z-10">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed font-medium text-lg relative z-10">
                {feature.description}
              </p>
              
              <div className="mt-8 pt-8 border-t border-slate-50 flex items-center gap-2 text-indigo-600 font-bold group-hover:gap-4 transition-all opacity-0 group-hover:opacity-100">
                Learn more <CheckCircle2 size={18} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
