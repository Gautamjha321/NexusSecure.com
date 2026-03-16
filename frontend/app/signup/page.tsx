"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Shield,
  ArrowRight,
  Zap,
  BarChart3,
  Globe,
} from "lucide-react";
import api from "@/lib/api";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      setLoading(true);
      await api.post("register/", {
        username: form.username,
        email: form.email,
        password: form.password,
        password2: form.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try a different username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* === Left Panel: Brand/Visual === */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between p-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Nexus<span className="text-slate-400 font-light">OS</span></span>
        </Link>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-slate-300 mb-6">
              <Zap className="w-3 h-3 text-amber-400" />
              Start scanning in under 60 seconds
            </div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
              Security scanning<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-indigo-300">
                for everyone.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              Professional-grade vulnerability detection without the enterprise price tag.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: <Zap className="w-4 h-4 text-amber-400" />, label: "Instant scanning", desc: "Results in seconds, not hours" },
              { icon: <BarChart3 className="w-4 h-4 text-sky-400" />, label: "Detailed reports", desc: "CVSS scores with remediation steps" },
              { icon: <Globe className="w-4 h-4 text-emerald-400" />, label: "Any target URL", desc: "Scan any publicly accessible domain" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3.5 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="mt-0.5 p-2 bg-white/10 rounded-lg shrink-0">{item.icon}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{item.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["A", "B", "C"].map((c) => (
              <div key={c} className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">{c}</div>
            ))}
          </div>
          <p className="text-slate-400 text-xs">Join <span className="text-white font-semibold">2,400+</span> users already scanning</p>
        </div>
      </div>

      {/* === Right Panel: Form === */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md">

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="p-2 rounded-xl bg-slate-900">
              <Shield className="text-white w-4 h-4" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">Nexus<span className="text-slate-400 font-light">OS</span></span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create account</h2>
            <p className="text-slate-500 text-sm">Free forever. No credit card required.</p>
          </div>

          {success && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Account created! Redirecting to login...
            </div>
          )}

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex gap-2">
              <span className="font-semibold shrink-0">Error:</span> {error}
            </div>
          )}

          <form onSubmit={register} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Choose a username"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              By creating an account, you agree to our{" "}
              <span className="text-slate-600 underline cursor-pointer">Terms of Service</span>{" "}
              and{" "}
              <span className="text-slate-600 underline cursor-pointer">Privacy Policy</span>.
            </p>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white py-3.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-4 w-4" /> Creating account...</>
              ) : (
                <>Create account <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-center text-slate-500 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
                Sign in →
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}