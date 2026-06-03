"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import {
  useMyTrainingProgress,
  useTrainingCourses,
  useTrainingMaterials,
  useEnrollMe,
} from "@/hooks/useTraining";
import { useAuth } from "@/context/auth-context";
import type { TrainingEnrollment, TrainingCourse, TrainingMaterial } from "@/services/trainingService";
import { trainingAssetUrl } from "@/lib/training-utils";
import toast from "react-hot-toast";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Play,
  Settings,
} from "lucide-react";

const CREATOR_ROLES = ["ADMIN", "HR_ADMIN", "MANAGER", "SUPERVISOR"];

export default function WorkerTrainingPage() {
  const { user } = useAuth();
  const { data: myProgress = [], isLoading: progressLoading } = useMyTrainingProgress();
  const { data: courses = [], isLoading: coursesLoading } = useTrainingCourses();
  const { data: materials = [], isLoading: materialsLoading } = useTrainingMaterials();
  const enrollMe = useEnrollMe();

  const loading = progressLoading || coursesLoading || materialsLoading;
  const enrollments = myProgress as TrainingEnrollment[];
  const allCourses = courses as TrainingCourse[];
  const trainingMaterials = materials as TrainingMaterial[];

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const catalog = allCourses.filter((c) => !enrolledIds.has(c.id));

  const canManage = user?.roles?.some((r) => CREATOR_ROLES.includes(r));

  const stats = {
    enrolled: enrollments.length,
    completed: enrollments.filter((e) => e.status === "COMPLETED").length,
    inProgress: enrollments.filter((e) => e.status === "IN_PROGRESS").length,
    avg:
      enrollments.length > 0
        ? enrollments.reduce((s, e) => s + e.progress, 0) / enrollments.length
        : 0,
  };

  const handleQuickEnroll = async (courseId: string) => {
    try {
      await enrollMe.mutateAsync(courseId);
      toast.success("Enrolled! Opening course…");
      window.location.href = `/worker/training/course/${courseId}`;
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          "Enroll failed. Your account needs a worker profile.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 pt-20 md:px-6">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-200">
                Learning center
              </p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black md:text-4xl">
                <GraduationCap className="h-9 w-9" />
                My Training
              </h1>
              <p className="mt-3 max-w-xl text-indigo-100">
                Watch videos, read guides, and track your progress through assigned
                courses.
              </p>
            </div>
            {canManage && (
              <Link
                href="/training/manage"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold backdrop-blur hover:bg-white/25"
              >
                <Settings className="h-4 w-4" />
                Manage training
              </Link>
            )}
          </div>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Enrolled" value={stats.enrolled} icon={BookOpen} />
              <StatCard label="In progress" value={stats.inProgress} icon={Clock} />
              <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
              <StatCard
                label="Average progress"
                value={`${stats.avg.toFixed(0)}%`}
                icon={GraduationCap}
              />
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">Continue learning</h2>
              {enrollments.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                  You are not enrolled in any course yet. Browse the catalog below.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {enrollments.map((item) => (
                    <CourseCard
                      key={item.id}
                      course={item.course}
                      progress={item.progress}
                      status={item.status}
                      href={`/worker/training/course/${item.courseId}`}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">Course catalog</h2>
              <p className="text-sm text-slate-500">
                Enroll in a course to start structured lessons with videos and text.
              </p>
              {catalog.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  No new courses available right now.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catalog.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                        {course.category}
                      </span>
                      <h3 className="mt-2 font-bold text-slate-900">{course.title}</h3>
                      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">
                        {course.description || "No description"}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {course.steps?.length ?? 0} lessons
                        {course.isRequired ? " · Required" : ""}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleQuickEnroll(course.id)}
                        disabled={enrollMe.isPending}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        <Play className="h-4 w-4" />
                        Enroll & start
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900">Resource library</h2>
              <p className="text-sm text-slate-500">
                PDFs, documents, and reference files from HR.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trainingMaterials.length === 0 ? (
                  <p className="text-sm text-slate-500">No materials uploaded yet.</p>
                ) : (
                  trainingMaterials.map((m) => (
                    <a
                      key={m.id}
                      href={trainingAssetUrl(m.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{m.title}</p>
                        <p className="text-xs text-slate-500">{m.category}</p>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon className="h-5 w-5 text-indigo-500" />
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function CourseCard({
  course,
  progress,
  status,
  href,
}: {
  course?: TrainingCourse;
  progress: number;
  status: string;
  href: string;
}) {
  const tone =
    status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "IN_PROGRESS"
        ? "bg-blue-100 text-blue-800"
        : "bg-amber-100 text-amber-800";

  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-slate-900">{course?.title ?? "Course"}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${tone}`}>
          {status.replace("_", " ")}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-indigo-600">
        {progress.toFixed(0)}% · Continue →
      </p>
    </Link>
  );
}
