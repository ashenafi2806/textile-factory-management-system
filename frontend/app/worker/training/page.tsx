"use client";

import React from "react";
import Link from "next/link";
import { useMyTrainingProgress, useTrainingMaterials } from "@/hooks/useTraining";
import { useAuth } from "@/context/auth-context";
import type { TrainingEnrollment, TrainingMaterial } from "@/services/trainingService";

export default function TrainingDashboard() {
  const { user } = useAuth();
  const { data: myProgress, isLoading: progressLoading } = useMyTrainingProgress();
  const { data: materials, isLoading: materialsLoading } = useTrainingMaterials();

  if (progressLoading || materialsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-10 w-72 rounded bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-white shadow-sm" />
        </div>
      </div>
    );
  }

  const enrollments = (myProgress as TrainingEnrollment[] | undefined) ?? [];
  const trainingMaterials = (materials as TrainingMaterial[] | undefined) ?? [];

  const completedCourses = enrollments.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const inProgressCourses = enrollments.filter(
    (item) => item.status === "IN_PROGRESS",
  ).length;
  const notStartedCourses = enrollments.filter(
    (item) => item.status === "NOT_STARTED",
  ).length;
  const avgProgress = enrollments.length
    ? enrollments.reduce((sum, item) => sum + item.progress, 0) / enrollments.length
    : 0;
  const canCreateTraining = Boolean(
    user?.roles?.some((role) =>
      ["ADMIN", "HR_ADMIN", "MANAGER", "SUPERVISOR"].includes(role),
    ),
  );

  const getStatusClasses = (status: TrainingEnrollment["status"]) => {
    if (status === "COMPLETED") return "bg-emerald-100 text-emerald-700";
    if (status === "IN_PROGRESS") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                Worker Portal
              </p>
              <h1 className="mt-2 text-3xl font-bold">Training Dashboard</h1>
              <p className="mt-2 text-sm text-indigo-100">
                Track your learning progress and access available training materials.
              </p>
            </div>
            {canCreateTraining && (
              <Link
                href="/training/create"
                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Create Course
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Enrolled" value={enrollments.length} tone="indigo" />
          <SummaryCard label="Completed" value={completedCourses} tone="green" />
          <SummaryCard label="In Progress" value={inProgressCourses} tone="blue" />
          <SummaryCard label="Not Started" value={notStartedCourses} tone="amber" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">My Course Progress</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Avg {avgProgress.toFixed(1)}%
              </span>
            </div>

            <div className="space-y-4">
              {enrollments.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  You are not enrolled in any course yet.
                </p>
              )}

              {enrollments.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">
                      {item.course?.title ?? "Untitled course"}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-sm font-medium text-slate-600">
                    {item.progress.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Latest Materials
            </h2>
            <div className="space-y-3">
              {trainingMaterials.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No materials available at the moment.
                </p>
              )}
              {trainingMaterials.slice(0, 6).map((material) => (
                <a
                  key={material.id}
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <p className="font-medium text-slate-900">{material.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {material.category}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "indigo" | "green" | "blue" | "amber";
}) {
  const toneClasses = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div
        className={`mt-2 inline-flex rounded-full px-3 py-1 text-2xl font-bold ${toneClasses[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}