"use client";

import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import ManagerAdminDashboard from "@/components/dashboards/ManagerAdminDashboard";
import { useSidebar } from "@/context/sidebar-context";
import { useCanPerform } from "@/hooks/useCanPerform";

export default function ManagerDashboardPage() {
  const { contentOffset, isDesktop } = useSidebar();
  const { user } = useAuth();
  const canView = useCanPerform(["MANAGER", "ADMIN"]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <Navbar />
        <main
          className="mx-auto max-w-2xl p-6"
          style={isDesktop ? { paddingLeft: contentOffset } : undefined}
        >
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-2xl font-bold text-rose-800">Access denied</h1>
            <p className="mt-2 text-rose-700">
              The Manager Dashboard is restricted to Manager and Admin roles.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <main className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 p-6 text-white shadow-xl shadow-indigo-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
            Manager workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
            Manager dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-indigo-100 sm:text-base">
            Workforce overview, quick links to approvals, staffing, hiring, and
            analytics — all in one place.
          </p>
        </header>

        <ManagerAdminDashboard />
      </main>
    </div>
  );
}
