"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Building2,
  Clock,
  UserPlus,
  Users,
  Layers,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";
import { useSidebar } from "@/context/sidebar-context";
import workforceService from "@/services/workforceService";

import AdminCreateShiftForm from "@/components/workforce/AdminCreateShiftForm";
import AdminCreateWorkerForm from "@/components/workforce/AdminCreateWorkerForm";
import AdminCreateDepartmentForm from "@/components/workforce/AdminCreateDepartmentForm";

type TabId = "setup" | "register";

export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabId>("setup");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await workforceService.getDepartments();
      return res.data ?? [];
    },
    enabled: Boolean(user),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await workforceService.getShifts();
      return res.data ?? [];
    },
    enabled: Boolean(user),
  });

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const res = await workforceService.getWorkers();
      return res.data ?? [];
    },
    enabled: Boolean(user),
  });

  if (!user) return null;

  if (
    !user.roles.includes("ADMIN") &&
    !user.roles.includes("HR_ADMIN") &&
    !user.roles.includes("SUPERVISOR")
  ) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-4 text-slate-600">
            You do not have permission to manage employee records.
          </p>
        </div>
      </div>
    );
  }

  const tabs: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
    {
      id: "setup",
      label: "Organization setup",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: "register",
      label: "Register employee",
      icon: <UserPlus className="h-4 w-4" />,
    },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white pt-20 md:pt-16"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-200/40 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200">
              HR Administration
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
              Workforce management
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-indigo-100 sm:text-base">
              Set up departments and shifts, then onboard employees with roles,
              contact details, and optional shift assignments — all in one
              place.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <StatPill
                icon={<Building2 className="h-4 w-4" />}
                label="Departments"
                value={departments.length}
              />
              <StatPill
                icon={<Clock className="h-4 w-4" />}
                label="Shift templates"
                value={shifts.length}
              />
              <StatPill
                icon={<Users className="h-4 w-4" />}
                label="Employees"
                value={workers.length}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/supervisor/shifts"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20"
              >
                <Clock className="h-4 w-4" />
                Manage shifts
              </Link>
              <Link
                href="/admin/attendance/report"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20"
              >
                <BarChart3 className="h-4 w-4" />
                Attendance report
              </Link>
            </div>
          </div>
        </header>

        {/* Workflow hint */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <span className="font-semibold text-slate-800">Recommended flow:</span>
          <WorkflowStep n={1} label="Create departments" />
          <span className="hidden text-slate-300 sm:inline">→</span>
          <WorkflowStep n={2} label="Define shifts" />
          <span className="hidden text-slate-300 sm:inline">→</span>
          <WorkflowStep n={3} label="Register employees" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "setup" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <AdminCreateDepartmentForm />
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <AdminCreateShiftForm />
            </section>
          </div>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <AdminCreateWorkerForm />
          </section>
        )}
      </div>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-indigo-200">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function WorkflowStep({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
        {n}
      </span>
      {label}
    </span>
  );
}
