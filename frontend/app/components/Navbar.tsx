"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const { isAuthenticated, loading, logout } = useAuth();

  if (loading) return null;

  return (
    <nav className="flex justify-between items-center px-8 py-5 border-b bg-white">
      <Link href="/" className="font-bold text-xl text-indigo-600">
        NexusSecure
      </Link>

      <div className="flex gap-4">
        {!isAuthenticated ? (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </>
        ) : (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <button onClick={logout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
