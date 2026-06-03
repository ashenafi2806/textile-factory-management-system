"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Clock,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";
import { useWorkers } from "@/hooks/useWorkers";
import { useStaffingDashboard } from "@/hooks/useStaffing";
import { useQuery } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";

const quickLinks = [
  {
    href: "/workforce/workers",
    label: "Workers",
    description: "Browse employee directory and roles",
    icon: Users,
    color: "indigo",
  },
  {
    href: "/manager/attendance/report",
    label: "Attendance report",
    description: "Present, late, absent, and leave trends",
    icon: Calendar,
    color: "indigo",
  },
  {
    href: "/manager/leave-approvals",
    label: "Leave approvals",
    description: "Review pending time-off requests",
    icon: Calendar,
    color: "violet",
  },
  {
    href: "/manager/analytics",
    label: "Workforce analytics",
    description: "Headcount, leave impact, utilization",
    icon: BarChart3,
    color: "emerald",
  },
  {
    href: "/workforce/staffing",
    label: "Staffing plan",
    description: "Gaps, headcount, hiring pipeline",
    icon: TrendingUp,
    color: "teal",
  },
  {
    href: "/manager/hiring-requests",
    label: "Hiring requests",
    description: "Submit and track requisitions",
    icon: FileText,
    color: "amber",
  },
  {
    href: "/manager/leave-approvals?tab=overtime",
    label: "Overtime",
    description: "Approve overtime submissions",
    icon: Clock,
    color: "rose",
  },
];

const colorMap: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
  violet: "bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
  emerald: "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
  teal: "bg-teal-100 text-teal-600 group-hover:bg-teal-600 group-hover:text-white",
  amber: "bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  rose: "bg-rose-100 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
};

export default function ManagerAdminDashboard() {
  const { data: workers = [] } = useWorkers();
  const { data: staffing } = useStaffingDashboard();

  const { data: pendingLeaves = [] } = useQuery({
    queryKey: ["manager-dash-leaves"],
    queryFn: () =>
      workforceService.getPendingLeaves().then((r) => r.data ?? []),
  });

  const { data: hiring = [] } = useQuery({
    queryKey: ["manager-dash-hiring"],
    queryFn: () =>
      workforceService.getHiringRequests().then((r) => r.data ?? []),
  });

  const openHiring = hiring.filter(
    (h: { status: string }) => h.status === "OPEN",
  ).length;

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total workers" value={workers.length} hint="Registered employees" />
        <MetricCard
          label="Pending leaves"
          value={pendingLeaves.length}
          hint="Awaiting your review"
          variant={pendingLeaves.length > 0 ? "amber" : "default"}
        />
        <MetricCard
          label="Open hiring reqs"
          value={openHiring}
          hint="Pending HR / manager action"
          variant={openHiring > 0 ? "indigo" : "default"}
        />
        <MetricCard
          label="Approved to hire"
          value={staffing?.approvedToHire ?? 0}
          hint="Positions in staffing pipeline"
          variant={(staffing?.approvedToHire ?? 0) > 0 ? "teal" : "default"}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Quick access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${colorMap[link.color]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 group-hover:text-indigo-700">
                    {link.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {(staffing?.gaps?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5">
          <h3 className="font-bold text-amber-900">Staffing attention needed</h3>
          <p className="mt-1 text-sm text-amber-800">
            {staffing!.gaps!.length} approved hiring gap(s) —{" "}
            <Link href="/workforce/staffing" className="font-semibold underline">
              view staffing plan
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  variant = "default",
}: {
  label: string;
  value: number;
  hint: string;
  variant?: "default" | "amber" | "indigo" | "teal";
}) {
  const styles = {
    default: "border-slate-200 bg-white",
    amber: "border-amber-200 bg-amber-50/60",
    indigo: "border-indigo-200 bg-indigo-50/60",
    teal: "border-teal-200 bg-teal-50/60",
  };
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${styles[variant]}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  );
}
