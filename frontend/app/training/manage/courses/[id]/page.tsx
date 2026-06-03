"use client";

import { use, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import {
  useTrainingCourse,
  useAddTrainingStep,
  useDeleteTrainingStep,
  useEnrollInCourse,
  useCourseCompletionReport,
} from "@/hooks/useTraining";
import { useQuery } from "@tanstack/react-query";
import workforceService from "@/services/workforceService";
import {
  ArrowLeft,
  Film,
  FileText,
  List,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

type Tab = "lessons" | "enroll" | "progress";

export default function ManageCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("lessons");
  const { data: course, isLoading, refetch } = useTrainingCourse(id);
  const { data: report, refetch: refetchReport } = useCourseCompletionReport(id);
  const addStep = useAddTrainingStep(id);
  const deleteStep = useDeleteTrainingStep(id);
  const enroll = useEnrollInCourse();

  const { data: workers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: () => workforceService.getWorkers().then((r) => r.data ?? []),
  });

  const [stepForm, setStepForm] = useState({
    title: "",
    description: "",
    content: "",
    videoUrl: "",
    fileUrl: "",
    requiresConfirmation: false,
  });
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);

  const submitStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepForm.title.trim()) return toast.error("Lesson title required");
    try {
      await addStep.mutateAsync(stepForm);
      toast.success("Course material added");
      setStepForm({
        title: "",
        description: "",
        content: "",
        videoUrl: "",
        fileUrl: "",
        requiresConfirmation: false,
      });
      refetch();
    } catch {
      toast.error("Failed to add material");
    }
  };

  const handleEnrollSelected = async () => {
    if (selectedWorkers.length === 0) return toast.error("Select at least one worker");
    try {
      for (const workerId of selectedWorkers) {
        await enroll.mutateAsync({ workerId, courseId: id });
      }
      toast.success(`Enrolled ${selectedWorkers.length} worker(s)`);
      setSelectedWorkers([]);
      refetch();
      refetchReport();
      setTab("progress");
    } catch {
      toast.error("Enrollment failed for some workers");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-24">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4 px-4">
          <div className="h-10 w-64 rounded bg-slate-200" />
          <div className="h-96 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!course) {
    return <div className="p-10 pt-24">Course not found</div>;
  }

  const lessonCount = course.steps?.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 pt-20">
        <Link
          href="/training/manage"
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Training hub
        </Link>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            {course.category}
            {course.isRequired ? " · Required" : ""}
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">{course.title}</h1>
          <p className="mt-2 text-slate-600">{course.description}</p>
          <p className="mt-3 text-sm text-slate-500">
            {lessonCount} lesson(s) · {course._count?.enrollments ?? 0} enrolled
          </p>
          {lessonCount === 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
              No lessons yet — open the <strong>Lessons & materials</strong> tab to add
              videos and text.
            </p>
          )}
        </header>

        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(
            [
              { id: "lessons" as Tab, label: "Lessons & materials", icon: Film },
              { id: "enroll" as Tab, label: "Enroll workers", icon: UserPlus },
              { id: "progress" as Tab, label: "Progress", icon: Users },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "lessons" && (
          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <Plus className="h-5 w-5 text-indigo-600" />
                Add lesson / material
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                YouTube URL, written content, or document link — workers see these in order.
              </p>
              <form onSubmit={submitStep} className="mt-4 space-y-3">
                <input
                  className={inputCls}
                  placeholder="Lesson title *"
                  value={stepForm.title}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, title: e.target.value })
                  }
                  required
                />
                <input
                  className={inputCls}
                  placeholder="Short summary"
                  value={stepForm.description}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, description: e.target.value })
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Video URL (YouTube or /uploads/training/...)"
                  value={stepForm.videoUrl}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, videoUrl: e.target.value })
                  }
                />
                <textarea
                  className={inputCls}
                  rows={5}
                  placeholder="Text instructions workers should read..."
                  value={stepForm.content}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, content: e.target.value })
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Document URL (optional)"
                  value={stepForm.fileUrl}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, fileUrl: e.target.value })
                  }
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={stepForm.requiresConfirmation}
                    onChange={(e) =>
                      setStepForm({
                        ...stepForm,
                        requiresConfirmation: e.target.checked,
                      })
                    }
                  />
                  Require confirmation before completing
                </label>
                <button
                  type="submit"
                  disabled={addStep.isPending}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {addStep.isPending ? "Saving…" : "Add to course"}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <List className="h-5 w-5" />
                Lesson list ({lessonCount})
              </h2>
              {lessonCount === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Empty course — add at least one lesson so workers have content.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {(course.steps ?? []).map((step: any) => (
                    <li
                      key={step.id}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {step.stepOrder}. {step.title}
                          </p>
                          <p className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                            {step.videoUrl && (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700">
                                <Film className="h-3 w-3" /> Video
                              </span>
                            )}
                            {step.content && (
                              <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-1.5 py-0.5">
                                <FileText className="h-3 w-3" /> Text
                              </span>
                            )}
                            {step.fileUrl && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                                Document
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Delete this lesson?")) return;
                            await deleteStep.mutateAsync(step.id);
                            refetch();
                          }}
                          className="text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {tab === "enroll" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Assign workers to this course</h2>
            <p className="mt-1 text-sm text-slate-500">
              Enrolled workers will see it on their training dashboard.
            </p>
            <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-2">
              {workers.map((w: any) => {
                const on = selectedWorkers.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                      on ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() =>
                        setSelectedWorkers((prev) =>
                          on ? prev.filter((x) => x !== w.id) : [...prev, w.id],
                        )
                      }
                    />
                    {w.fullName ?? w.user?.username ?? w.employeeId}
                    {w.department ? (
                      <span className="text-xs text-slate-400">({w.department})</span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleEnrollSelected}
              disabled={enroll.isPending}
              className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
            >
              Enroll selected workers
            </button>
          </section>
        )}

        {tab === "progress" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">Learner progress</h2>
            <ul className="mt-4 space-y-2">
              {(report?.enrollments ?? []).length === 0 ? (
                <li className="text-sm text-slate-500">
                  No enrollments — use the Enroll tab first.
                </li>
              ) : (
                (report?.enrollments ?? []).map((e: any) => (
                  <li
                    key={e.workerId}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{e.workerName}</p>
                      <p className="text-xs text-slate-500">{e.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">
                        {e.progress.toFixed(0)}%
                      </p>
                      <p className="text-xs text-slate-500">{e.status}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
