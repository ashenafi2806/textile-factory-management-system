"use client";

import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import ManagerAdminDashboard from "@/components/dashboards/ManagerAdminDashboard";
import { useSidebar } from "@/context/sidebar-context";
import { useCanPerform } from "@/hooks/useCanPerform";

export default function ProductionManagerPage() {
  const { contentOffset, isDesktop, sidebarWidth } = useSidebar();
  const { user } = useAuth();
  const canView = useCanPerform(["MANAGER", "ADMIN"]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main
          className="flex-1 p-8 md:p-12 overflow-y-auto pt-20"
          style={isDesktop ? { marginLeft: `${sidebarWidth}px` } : undefined}
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
            <p className="mt-2 text-rose-700">
              The Manager Dashboard is restricted to the Manager role.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main
        className="flex-1 py-2 md:py-4 lg:py-6 px-0 overflow-y-auto pt-16 flex items-start justify-center"
        style={isDesktop ? { marginLeft: `${sidebarWidth}px` } : undefined}
      >
        <div className="w-full max-w-5xl mx-auto">
          <header className="mb-6 text-center md:text-left">
            <p className="text-indigo-600 font-black uppercase tracking-[.3em] text-[10px] mb-2">
              Manager Workspace
            </p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900">
              Manager Dashboard
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto md:mx-0">
              Workforce analytics, approvals, staffing and hiring tools for
              managers.
            </p>
          </header>
          <div className="bg-transparent">
            <ManagerAdminDashboard />
          </div>
        </div>
      </main>
    </div>
  );
}
