"use client";

import Link from "next/link";
import { FileText, Users } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useSidebar } from "@/context/sidebar-context";
import { useCanPerform } from "@/hooks/useCanPerform";
import StaffingDashboard from "@/components/workforce/StaffingDashboard";

export default function StaffingPage() {
  const { contentOffset, isDesktop } = useSidebar();
  const canView = useCanPerform(["MANAGER", "HR_ADMIN", "ADMIN"]);

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <Navbar />
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-xl font-bold text-rose-800">Access denied</h1>
            <p className="mt-2 text-sm text-rose-700">
              Staffing planning is restricted to Managers and HR staff.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <header className="relative overflow-hidden rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-700 p-6 text-white shadow-xl shadow-teal-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-100">
                Workforce planning
              </p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                Staffing & headcount
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-teal-50 sm:text-base">
                Compare current headcount against approved hiring requisitions.
                Identify gaps, track pending approvals, and plan recruitment
                across departments.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/manager/hiring-requests"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20"
              >
                <FileText className="h-4 w-4" />
                Hiring requests
              </Link>
              <Link
                href="/manager/analytics"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20"
              >
                <Users className="h-4 w-4" />
                Analytics
              </Link>
            </div>
          </div>
        </header>

        <StaffingDashboard />
      </div>
    </div>
  );
}
