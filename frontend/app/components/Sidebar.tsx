"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  LayoutDashboard,
  Activity,
  BarChart3,
  Terminal,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Live Scans", href: "/live-scans", icon: Activity },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "API Console", href: "/api-console", icon: Terminal },
  { label: "Integration", href: "/integration", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user: authUser, logout } = useAuth();

  return (
    <aside className="w-64 bg-white hidden lg:flex flex-col border-r border-zinc-200 sticky top-0 h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-100">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-zinc-900 p-2 rounded-lg shadow-sm">
            <Shield className="text-white w-5 h-5" />
          </div>
          <span className="text-zinc-900 font-bold tracking-tight text-xl">
            Nexus<span className="text-zinc-500 font-normal">OS</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 mt-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                isActive
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-zinc-900" : "text-zinc-400"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-6 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-3 mb-4 p-2 bg-white rounded-xl border border-zinc-200 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-sm font-semibold text-zinc-900 shrink-0">
            {authUser?.username?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="truncate flex-1">
            <p className="text-sm font-semibold text-zinc-900 truncate">
              {authUser?.username || "Guest User"}
            </p>
            <p className="text-xs text-zinc-500">
              {authUser ? "Pro License" : "Public Access"}
            </p>
          </div>
        </div>
        {authUser ? (
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-900 p-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-100"
          >
            <LogOut size={16} /> Sign Out
          </button>
        ) : (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 text-zinc-900 bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 p-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  );
}
