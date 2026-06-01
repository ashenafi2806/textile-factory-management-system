"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";

import AdminCreateShiftForm from "@/components/workforce/AdminCreateShiftForm";
import AdminCreateWorkerForm from "@/components/workforce/AdminCreateWorkerForm";

import { useSidebar } from "@/context/sidebar-context";
export default function EmployeeManagementPage() {
  const { user } = useAuth();
  const { contentOffset, isDesktop } = useSidebar();

  if (!user) return null;

  if (!user.roles.includes("ADMIN") && !user.roles.includes("HR_ADMIN") && !user.roles.includes("SUPERVISOR")) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-4xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-4 text-slate-600">
            You do not have permission to manage employee records.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="pt-20 md:pt-16 min-h-screen bg-slate-50"
      style={isDesktop ? { paddingLeft: contentOffset } : undefined}
    >
      <Navbar />
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">
            Workforce Management
          </h1>
          <p className="mt-2 text-slate-600">
            Create workers and shifts from a single
            admin/HR workflow.
          </p>
        </div>

        <div className="mt-6 grid gap-8 xl:grid-cols-[1.45fr_0.55fr]">
          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <AdminCreateWorkerForm />
          </section>

          <section className="space-y-6">

            <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <AdminCreateShiftForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
