"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const dashboardLinks = [
  { href: "/dashboard/manager", label: "Manager", roles: ["MANAGER", "ADMIN"] },
  {
    href: "/dashboard/supervisor",
    label: "Supervisor",
    roles: ["SUPERVISOR", "PRODUCTION_SUPERVISOR", "ADMIN"],
  },
  {
    href: "/dashboard/qa-staff",
    label: "QA Staff",
    roles: ["QA_STAFF", "QA_MANAGER", "ADMIN"],
  },
  {
    href: "/dashboard/qa-manager",
    label: "QA Manager",
    roles: ["QA_MANAGER", "ADMIN"],
  },
  {
    href: "/production",
    label: "Production",
    roles: [
      "PRODUCTION_MANAGER",
      "PRODUCTION_SUPERVISOR",
      "QA_MANAGER",
      "QA_STAFF",
      "ADMIN",
    ],
  },
];

import { useSidebar } from "@/context/sidebar-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { sidebarWidth, contentOffset, isDesktop } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <main
        style={isDesktop ? { paddingLeft: contentOffset } : undefined}
        className="pt-20 md:pt-16 transition-all duration-300"
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
