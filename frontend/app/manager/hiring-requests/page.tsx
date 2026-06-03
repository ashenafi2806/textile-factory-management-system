"use client";

import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import { useCanPerform } from "@/hooks/useCanPerform";
import HiringRequisitions from "@/components/workforce/HiringRequisitions";
import Link from "next/link";
import { BarChart3, Users } from "lucide-react";

export default function ManagerHiringRequestsPage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();
  const canView = useCanPerform(["MANAGER", "HR_ADMIN", "ADMIN"]);

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
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-xl font-bold text-rose-800">Access denied</h1>
            <p className="mt-2 text-sm text-rose-700">
              Hiring requisitions are restricted to Managers and HR staff.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isHr =
    user.roles.includes("HR_ADMIN") || user.roles.includes("ADMIN");

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 p-6 text-white shadow-xl shadow-indigo-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
                Talent acquisition
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                Hiring requisitions
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-indigo-100 sm:text-base">
                {isHr
                  ? "Review manager requests, approve headcount, and feed approved roles into the staffing plan."
                  : "Request new hires for your department. HR will review and approve before recruitment begins."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/workforce/staffing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20"
              >
                <Users className="h-4 w-4" />
                Staffing plan
              </Link>
              <Link
                href="/manager/analytics"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20"
              >
                <BarChart3 className="h-4 w-4" />
                Workforce analytics
              </Link>
            </div>
          </div>
        </header>

        <HiringRequisitions />
      </div>
    </div>
  );
}
