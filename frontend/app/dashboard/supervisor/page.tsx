"use client";

import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { ProductionSupervisorDashboard } from "@/components/dashboards/ProductionSupervisorDashboard";

export default function ProductionSupervisorPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user.roles.includes("PRODUCTION_SUPERVISOR") && !user.roles.includes("ADMIN")) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
          <p className="mt-2 text-slate-600">
            Only Production Supervisors can use this page.
          </p>
        </div>
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
              Supervisor Control
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Production Supervisor Dashboard
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Manage your assigned orders, record output, and escalate issues
              from one streamlined console.
            </p>
          </header>
          <ProductionSupervisorDashboard />
        </div>
      </main>
    </div>
  );
}
