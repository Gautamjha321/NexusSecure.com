"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { useAuth } from "@/lib/auth";
import {
  Terminal, Copy, CheckCircle2, Code2, Key, BookOpen,
  ChevronRight, Lock, Globe, Shield, Zap,
} from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const ENDPOINTS = [
  {
    method: "POST", path: "scan/start/",
    desc: "Initiate a new vulnerability scan",
    body: JSON.stringify({ target_url: "https://example.com" }, null, 2),
    response: JSON.stringify({ id: 42, target_url: "https://example.com", status: "running" }, null, 2),
  },
  {
    method: "GET", path: "scan/result/{id}/",
    desc: "Retrieve full scan results and vulnerability list",
    body: null,
    response: JSON.stringify({ id: 42, status: "completed", vulnerability_count: 7, vulnerabilities: [] }, null, 2),
  },
  {
    method: "GET", path: "scan/history/",
    desc: "Get paginated scan history",
    body: null,
    response: JSON.stringify({ count: 12, results: [] }, null, 2),
  },
  {
    method: "DELETE", path: "scan/{id}/",
    desc: "Delete a scan and its associated data",
    body: null,
    response: JSON.stringify({ message: "Scan deleted." }, null, 2),
  },
];

const METHOD_STYLES: Record<string, string> = {
  GET:    "bg-sky-50 text-sky-700 border-sky-200",
  POST:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  DELETE: "bg-red-50 text-red-700 border-red-200",
  PATCH:  "bg-amber-50 text-amber-700 border-amber-200",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
      {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ApiConsolePage() {
  const { user } = useAuth();
  const [activeEndpoint, setActiveEndpoint] = useState(0);

  const ep = ENDPOINTS[activeEndpoint];
  const curlCmd = ep.body
    ? `curl -X ${ep.method} "${BASE_URL}/${ep.path}" \\\n  -H "Content-Type: application/json" \\\n  -d '${ep.body.replace(/\n/g, "")}'`
    : `curl -X ${ep.method} "${BASE_URL}/${ep.path}"`;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-zinc-200 px-8 py-5 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">API Console</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Interactive reference for the NexusOS scanner API</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-xs font-mono text-zinc-500">
              <Globe size={12} /> {BASE_URL}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

          {/* Info Banner */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex items-start gap-4">
            <div className="p-2.5 bg-indigo-50 rounded-xl shrink-0">
              <BookOpen size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">REST API — No auth required for scanning</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                The scanner API is publicly accessible for read/write operations to allow anonymous scanning. User-specific history requires a JWT access token in the <code className="font-mono bg-zinc-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code> header.
              </p>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Endpoint List */}
            <div className="lg:col-span-1 space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Endpoints</p>
              {ENDPOINTS.map((e, i) => (
                <button
                  key={i}
                  onClick={() => setActiveEndpoint(i)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                    activeEndpoint === i
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-md"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${activeEndpoint === i ? "bg-white/10 text-white border-white/20" : METHOD_STYLES[e.method]}`} >
                      {e.method}
                    </span>
                    <code className={`text-[11px] font-mono ${activeEndpoint === i ? "text-zinc-300" : "text-zinc-500"}`}>/{e.path}</code>
                  </div>
                  <p className={`text-xs ${activeEndpoint === i ? "text-zinc-400" : "text-zinc-500"}`}>{e.desc}</p>
                </button>
              ))}
            </div>

            {/* Endpoint Details */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${METHOD_STYLES[ep.method]}`}>{ep.method}</span>
                  <code className="text-sm font-mono text-zinc-700">/{ep.path}</code>
                </div>
                <p className="text-sm text-zinc-600">{ep.desc}</p>
              </div>

              {/* cURL */}
              <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Terminal size={13} className="text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">cURL</span>
                  </div>
                  <CopyButton text={curlCmd} />
                </div>
                <pre className="p-5 text-sm font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">{curlCmd}</pre>
              </div>

              {/* Request Body */}
              {ep.body && (
                <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Code2 size={13} className="text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Request Body</span>
                    </div>
                    <CopyButton text={ep.body} />
                  </div>
                  <pre className="p-5 text-sm font-mono text-emerald-400 leading-relaxed overflow-x-auto">{ep.body}</pre>
                </div>
              )}

              {/* Response */}
              <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Sample Response <span className="text-emerald-500 ml-1">200 OK</span></span>
                  </div>
                  <CopyButton text={ep.response} />
                </div>
                <pre className="p-5 text-sm font-mono text-sky-300 leading-relaxed overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
