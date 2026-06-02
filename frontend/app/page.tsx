"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-200">
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 blur-3xl xl:-top-24">
          <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30" />
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:max-w-xl lg:pt-8">

            <h1 className="mt-10 text-5xl font-black tracking-tight text-slate-900 sm:text-7xl">
              Next-generation{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
                textile factory
              </span>{" "}
              intelligence.
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-lg">
              Unify production, inventory, QA, and workforce management in one system.
            </p>

            <div className="mt-10 flex items-center gap-x-6">
              {/* MAIN BUTTON (dynamic) */}
              <Link
                href={user ? "/dashboard" : "/login"}
                className="rounded-full bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
              >
                {isLoading
                  ? "Loading..."
                  : user
                    ? "Go to Dashboard"
                    : "Sign In to Platform"}
              </Link>

              {/* SECOND BUTTON */}
              <Link
                href={user ? "/dashboard" : "/login"}
                className="text-sm font-black text-slate-900 hover:text-indigo-600 transition"
              >
                {user ? "View Dashboard →" : "Get Started →"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}