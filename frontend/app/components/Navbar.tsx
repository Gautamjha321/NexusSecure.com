"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShieldCheck, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 py-4 ${
        scrolled ? "glass shadow-lg py-3" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div 
            whileHover={{ rotate: 10 }}
            className="bg-indigo-600 p-2 rounded-xl shadow-indigo-200 shadow-lg"
          >
            <ShieldCheck className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Nexus<span className="text-indigo-600">Secure</span>
          </span>
        </Link>
        
        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 font-semibold text-slate-600">
          {["Features", "Vulnerability DB", "Pricing"].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase().replace(" ", "-")}`} 
              className="hover:text-indigo-600 transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden sm:inline px-5 py-2 text-slate-600 hover:text-indigo-600 font-bold transition">
            Login
          </Link>
          <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-7 py-2.5 rounded-full font-bold text-sm sm:text-base shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
            Get Started
          </Link>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute left-4 right-4 top-full mt-2 glass rounded-2xl shadow-2xl p-4 flex flex-col gap-2"
          >
            {["Features", "Vulnerability DB", "Pricing", "Login"].map((item) => (
              <Link 
                key={item}
                href={item === "Login" ? "/login" : `#${item.toLowerCase().replace(" ", "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
              >
                {item}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
