"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";
import {
  useTrainingCourses,
  useTrainingCompletionReport,
  useTrainingMaterials,
} from "@/hooks/useTraining";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";

const ALLOWED = ["ADMIN", "HR_ADMIN", "MANAGER", "SUPERVISOR"];

export default function TrainingManagePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { data: courses = [], isLoading } = useTrainingCourses();
  const { data: report } = useTrainingCompletionReport();
  const { data: materials = [] } = useTrainingMaterials();

  const allowed = user?.roles?.some((r) => ALLOWED.includes(r));

  if (authLoading) return null;

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <p className="text-slate-600">You do not have permission to manage training.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 pt-20">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
              Training administration
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Course management
            </h1>
            <p className="mt-2 text-slate-500">
              Create courses, add lessons, enroll employees, and track completion.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/training/create"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              New course (wizard)
            </Link>
            <Link
              href="/worker/training"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <GraduationCap className="h-4 w-4" />
              Learner view
            </Link>
          </div>
        </header>

        {report?.summary && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Workers" value={report.summary.totalWorkers} />
            <Metric label="Courses" value={report.summary.totalCourses} />
            <Metric label="Enrollments" value={report.summary.totalEnrollments} />
            <Metric label="Completed" value={report.summary.completedCourses} />
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="font-bold text-slate-900">Courses</h2>
            <p className="text-sm text-slate-500">
              {materials.length} resource file(s) in library
            </p>
          </div>
          {isLoading ? (
            <div className="p-8 text-slate-500">Loading…</div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-slate-600">No courses yet.</p>
              <Link
                href="/dashboard/training/create"
                className="mt-4 inline-block text-sm font-semibold text-indigo-600"
              >
                Create your first course →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {courses.map((c: any) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/training/manage/courses/${c.id}`)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{c.title}</p>
                      <p className="text-sm text-slate-500">
                        {c.category} · {c.steps?.length ?? 0} lessons ·{" "}
                        {c._count?.enrollments ?? 0} enrolled
                        {c.isRequired ? " · Required" : ""}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-indigo-600">
                      Edit & enroll →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold">Completion by course</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {(report?.courseCompletion ?? []).map((row: any) => (
              <li
                key={row.courseId}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-800">{row.courseTitle}</span>
                <span className="text-slate-600">
                  {row.completedEnrollments}/{row.totalEnrollments} done (
                  {row.completionRate.toFixed(0)}%)
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
