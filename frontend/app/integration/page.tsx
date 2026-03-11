"use client";

import Sidebar from "@/app/components/Sidebar";
import {
  Settings, Code2, Globe, Zap, CheckCircle2, Copy, 
  BookOpen, ArrowUpRight, Shield, Terminal, Webhook,
  Lock, Link,
} from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 hover:bg-zinc-200 rounded-md transition-colors text-zinc-400 hover:text-zinc-700"
      title="Copy"
    >
      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

const INTEGRATIONS = [
  {
    name: "GitHub Actions",
    desc: "Automatically scan on every push or pull request in your CI/CD pipeline.",
    icon: "GH",
    gradient: "from-zinc-700 to-zinc-900",
    badge: "CI/CD",
    badgeColor: "bg-zinc-100 text-zinc-700",
    snippet: "- name: NexusOS Scan\n  uses: nexus/scan-action@v1\n  with:\n    target: ${{ env.DEPLOY_URL }}",
  },
  {
    name: "Slack Alerts",
    desc: "Get instant Slack notifications when critical vulnerabilities are detected.",
    icon: "SL",
    gradient: "from-violet-600 to-indigo-700",
    badge: "Webhook",
    badgeColor: "bg-violet-100 text-violet-700",
    snippet: `POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL\nContent-Type: application/json\n{"text": "🚨 Critical vuln detected!"}`,
  },
  {
    name: "Jira",
    desc: "Automatically create Jira tickets for each vulnerability found.",
    icon: "JR",
    gradient: "from-sky-500 to-blue-700",
    badge: "Ticketing",
    badgeColor: "bg-sky-100 text-sky-700",
    snippet: `POST /rest/api/3/issue\n{\n  "summary": "NexusOS: SQL Injection",\n  "priority": "Critical"\n}`,
  },
  {
    name: "PagerDuty",
    desc: "Trigger on-call alerts for high or critical severity findings.",
    icon: "PD",
    gradient: "from-green-600 to-emerald-700",
    badge: "Alerting",
    badgeColor: "bg-emerald-100 text-emerald-700",
    snippet: `POST https://events.pagerduty.com/v2/enqueue\n{\n  "routing_key": "YOUR_KEY",\n  "event_action": "trigger"\n}`,
  },
];

const WEBHOOK_URL = "https://your-domain.com/api/webhooks/nexus";
const WEBHOOK_SECRET = "sk_nexus_••••••••••••••••••••••••";

export default function IntegrationPage() {
  const [activeTab, setActiveTab] = useState("integrations");

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-zinc-200 px-8 py-5 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-lg font-semibold text-zinc-900">Integrations</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Connect NexusOS to your existing tools and workflows</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-lg text-xs font-semibold text-zinc-500">
              <CheckCircle2 size={12} className="text-emerald-500" /> API Active
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">

          {/* Tabs */}
          <div className="flex bg-white p-1 rounded-xl border border-zinc-200 w-fit shadow-sm">
            {["integrations", "webhooks", "sdk"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── INTEGRATIONS TAB ── */}
          {activeTab === "integrations" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {INTEGRATIONS.map(int => (
                  <div key={int.name} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${int.gradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                          {int.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{int.name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${int.badgeColor}`}>{int.badge}</span>
                        </div>
                      </div>
                      <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors border border-zinc-200">
                        Connect <ArrowUpRight size={12} />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{int.desc}</p>
                    <div className="bg-[#09090b] rounded-xl border border-zinc-800 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">snippet</span>
                        <CopyButton text={int.snippet} />
                      </div>
                      <pre className="p-4 text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">{int.snippet}</pre>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="text-lg font-bold mb-1">Build a custom integration</p>
                  <p className="text-zinc-400 text-sm max-w-md">Use our REST API and webhooks to connect NexusOS to any tool in your security stack.</p>
                </div>
                <button
                  onClick={() => setActiveTab("sdk")}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-zinc-900 rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-colors shrink-0 shadow"
                >
                  <BookOpen size={16} /> View SDK Docs
                </button>
              </div>
            </>
          )}

          {/* ── WEBHOOKS TAB ── */}
          {activeTab === "webhooks" && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-violet-50 rounded-xl shrink-0"><Webhook size={18} className="text-violet-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 mb-1">Outbound Webhooks</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">NexusOS will POST a JSON payload to your endpoint whenever a scan completes or a new vulnerability is detected.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Your Webhook URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm text-zinc-700">
                      <Link size={14} className="text-zinc-400 shrink-0" />
                      {WEBHOOK_URL}
                    </div>
                    <CopyButton text={WEBHOOK_URL} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">Signing Secret</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm text-zinc-500">
                      <Lock size={14} className="text-zinc-400 shrink-0" />
                      {WEBHOOK_SECRET}
                    </div>
                    <button className="px-4 py-3 text-xs font-semibold bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 hover:bg-zinc-200 transition-colors">
                      Reveal
                    </button>
                  </div>
                </div>
              </div>

              {/* Payload preview */}
              <div className="bg-[#09090b] rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Terminal size={13} className="text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Webhook Payload Example</span>
                  </div>
                </div>
                <pre className="p-5 text-sm font-mono text-sky-300 leading-relaxed overflow-x-auto">{JSON.stringify({
                  event: "scan.completed",
                  scan_id: 42,
                  target_url: "https://example.com",
                  status: "completed",
                  vulnerability_count: 7,
                  timestamp: new Date().toISOString(),
                }, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* ── SDK TAB ── */}
          {activeTab === "sdk" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { lang: "Python", icon: "🐍", snippet: `import requests\n\nresponse = requests.post(\n  "http://localhost:8000/api/scan/start/",\n  json={"target_url": "https://example.com"}\n)\nprint(response.json())` },
                  { lang: "JavaScript", icon: "🟨", snippet: `const res = await fetch(\n  "http://localhost:8000/api/scan/start/",\n  {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ target_url: "https://example.com" })\n  }\n);\nconsole.log(await res.json());` },
                  { lang: "cURL", icon: "⚡", snippet: `curl -X POST \\\n  http://localhost:8000/api/scan/start/ \\\n  -H "Content-Type: application/json" \\\n  -d '{"target_url":"https://example.com"}'` },
                ].map(item => (
                  <div key={item.lang} className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <p className="text-sm font-semibold text-zinc-900">{item.lang}</p>
                      </div>
                    </div>
                    <div className="bg-[#09090b] p-4">
                      <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">{item.snippet}</pre>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-sky-50 rounded-xl"><BookOpen size={18} className="text-sky-600" /></div>
                  <p className="text-sm font-semibold text-zinc-900">Response Schema</p>
                </div>
                <div className="bg-zinc-50 rounded-xl border border-zinc-200 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-wide font-semibold">
                      <th className="px-4 py-3 text-left">Field</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Description</th>
                    </tr></thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[
                        ["id", "integer", "Unique scan identifier"],
                        ["target_url", "string", "The URL that was scanned"],
                        ["status", "enum", "pending | running | completed | failed"],
                        ["vulnerability_count", "integer", "Total vulnerabilities found"],
                        ["created_at", "ISO 8601", "Scan creation timestamp"],
                        ["vulnerabilities", "array", "List of vulnerability objects"],
                      ].map(([field, type, desc]) => (
                        <tr key={field as string} className="hover:bg-zinc-100/50">
                          <td className="px-4 py-3 font-mono text-zinc-800 font-semibold">{field}</td>
                          <td className="px-4 py-3 font-mono text-violet-600">{type}</td>
                          <td className="px-4 py-3 text-zinc-500">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
