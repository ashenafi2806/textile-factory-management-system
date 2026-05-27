"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Navbar } from "@/components/layout/Navbar";
import { useIncident, useApproveIncident } from "@/hooks/useIncidents";

export default function IncidentPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const { data, isLoading } = useIncident(id);
  const approve = useApproveIncident();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="rounded border bg-white p-6">
              <h1 className="text-2xl font-bold mb-2">{data?.title}</h1>
              <div className="text-sm text-slate-500 mb-4">
                Severity: {data?.severity}
              </div>
              <p className="mb-4">{data?.description}</p>
              <div className="text-xs text-slate-400 mb-4">
                Reported by: {data?.reportedBy}
              </div>
              <div className="space-x-2">
                {(user.roles.includes("MANAGER") ||
                  user.roles.includes("HR_ADMIN") ||
                  user.roles.includes("ADMIN")) &&
                data?.status === "OPEN" ? (
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await approve.mutateAsync(id);
                      router.refresh();
                    }}
                  >
                    Approve
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
