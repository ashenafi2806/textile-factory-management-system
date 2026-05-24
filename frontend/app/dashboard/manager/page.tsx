"use client";

import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import ManagerAdminDashboard from "@/components/dashboards/ManagerAdminDashboard";

export default function ProductionManagerPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <p className="text-indigo-600 font-black uppercase tracking-[.3em] text-[10px] mb-2">
              Manager Workspace
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Manager Dashboard
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Workforce analytics, approvals, staffing and hiring tools for
              managers.
            </p>
          </header>
          <ManagerAdminDashboard />
        </div>
      </main>
    </div>
  );
}
