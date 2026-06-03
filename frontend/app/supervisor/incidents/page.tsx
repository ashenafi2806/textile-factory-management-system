"use client";

import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import Incidents from "@/components/workforce/Incidents";

export default function SupervisorIncidentsPage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-600 via-red-600 to-orange-700 p-6 text-white shadow-xl shadow-rose-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-100">
            Supervisor workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
            Incidents & safety
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-rose-50 sm:text-base">
            Record, track, and approve workplace incidents. Keep a clear audit
            trail for HR and management review.
          </p>
        </header>

        <Incidents />
      </main>
    </div>
  );
}
