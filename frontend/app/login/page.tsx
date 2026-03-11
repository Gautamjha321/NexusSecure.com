"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  ArrowRight,
  User,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl");
  const { login: authLogin } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({ username: "", password: "" });

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!data.username || !data.password) {
      setError("Please fill in all fields");
      return;
    }
    try {
      setLoading(true);
      // Use the auth context's login — this sets both tokens AND updates the React user state
      await authLogin(data.username, data.password);
      if (redirectUrl) {
        router.push(`/dashboard?autoScanUrl=${encodeURIComponent(redirectUrl)}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* === Left Panel === */}
      <div className="hidden lg:flex w-[45%] relative overflow-hidden flex-col justify-between p-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-10%] w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[80px]" />
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
        <div className="relative z-10 space-y-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/15 rounded-full text-xs font-medium text-slate-300 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Trusted by 2,400+ security engineers
            </div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
              Vulnerability scanning<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-sky-300">
                made simple.
              </span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              Enterprise-grade security intelligence, available to every developer.
            </p>
          </div>

          <div className="space-y-3.5">
            {[
              "Real-time threat detection engine",
              "CVSS-scored, actionable reports",
              "Complete audit trail & history",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="text-emerald-400 h-4 w-4 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
          <p className="text-slate-300 text-sm leading-relaxed italic mb-3">
            "NexusOS found 14 critical issues in our API that other tools completely missed."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-sky-400 flex items-center justify-center text-white text-xs font-bold">R</div>
            <div>
              <p className="text-white text-xs font-semibold">Gautam Jha</p>
              <p className="text-slate-500 text-xs">Lead Security Engineer</p>
            </div>
          </div>
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Sign in</h2>
            <p className="text-slate-500 text-sm">Enter your credentials to access your dashboard</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex gap-2">
              <span className="font-semibold shrink-0">Error:</span> {error}
            </div>
          )}

          <form onSubmit={login} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                  value={data.username}
                  onChange={(e) => setData({ ...data, username: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white py-3.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-4 w-4" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <p className="text-center text-slate-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors">
                Create a free account →
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}