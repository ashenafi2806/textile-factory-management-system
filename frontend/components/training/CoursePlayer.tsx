"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Play,
} from "lucide-react";
import {
  useCourseForLearner,
  useCompleteStep,
  useEnrollMe,
} from "@/hooks/useTraining";
import type { TrainingStep } from "@/services/trainingService";
import {
  isVideoFileUrl,
  trainingAssetUrl,
  youtubeEmbedUrl,
} from "@/lib/training-utils";

function StepMedia({ step }: { step: TrainingStep }) {
  if (step.videoUrl) {
    const embed = youtubeEmbedUrl(step.videoUrl);
    if (embed) {
      return (
        <div className="aspect-video overflow-hidden rounded-xl bg-black">
          <iframe
            src={embed}
            title={step.title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    const src = trainingAssetUrl(step.videoUrl);
    if (isVideoFileUrl(src) || src.includes("/uploads/")) {
      return (
        <video
          src={src}
          controls
          className="aspect-video w-full rounded-xl bg-black"
        />
      );
    }
    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700"
      >
        <Play className="h-4 w-4" />
        Open video
      </a>
    );
  }
  return null;
}

export default function CoursePlayer({ courseId }: { courseId: string }) {
  const { data, isLoading, refetch } = useCourseForLearner(courseId);
  const enrollMe = useEnrollMe();
  const completeStep = useCompleteStep();
  const [activeIndex, setActiveIndex] = useState(0);

  const course = data?.course;
  const enrollment = data?.enrollment;
  const steps = course?.steps ?? [];

  const activeStep = steps[activeIndex];
  const progress = enrollment?.progress ?? 0;

  const handleEnroll = async () => {
    try {
      await enrollMe.mutateAsync(courseId);
      toast.success("Enrolled — start learning!");
      await refetch();
      setActiveIndex(0);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Could not enroll. Link a worker profile to your account.",
      );
    }
  };

  const handleComplete = async () => {
    if (!enrollment || !activeStep) return;
    try {
      await completeStep.mutateAsync({
        enrollmentId: enrollment.id,
        stepId: activeStep.id,
      });
      toast.success("Step completed");
      const res = await refetch();
      const updated = res.data?.course?.steps ?? [];
      const next = updated.findIndex((s) => !s.isCompleted);
      if (next >= 0 && next !== activeIndex) setActiveIndex(next);
      else if (activeIndex < updated.length - 1) setActiveIndex(activeIndex + 1);
    } catch {
      toast.error("Failed to mark step complete");
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-64 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center text-slate-600">
        Course not found.
        <Link href="/worker/training" className="mt-4 block text-indigo-600">
          Back to training
        </Link>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-indigo-400" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{course.title}</h1>
        <p className="mt-2 text-slate-600">{course.description}</p>
        <p className="mt-4 text-sm text-slate-500">
          {steps.length} lesson{steps.length !== 1 ? "s" : ""} · {course.category}
        </p>
        <button
          type="button"
          onClick={handleEnroll}
          disabled={enrollMe.isPending}
          className="mt-8 rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {enrollMe.isPending ? "Enrolling…" : "Start course"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link
            href="/worker/training"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-bold text-slate-900">{course.title}</h1>
            <div className="mt-1 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">{progress.toFixed(0)}% complete</p>
          </div>
          {enrollment.status === "COMPLETED" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-3 lg:p-6">
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Lessons
            </h2>
            <ul className="mt-3 space-y-1">
              {steps.map((step, i) => (
                <li key={step.id}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      i === activeIndex
                        ? "bg-indigo-50 font-semibold text-indigo-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {step.isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px]">
                        {i + 1}
                      </span>
                    )}
                    <span className="truncate">{step.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="lg:col-span-2">
          {activeStep ? (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Lesson {activeStep.stepOrder}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                {activeStep.title}
              </h2>
              {activeStep.description ? (
                <p className="mt-2 text-slate-600">{activeStep.description}</p>
              ) : null}

              <div className="mt-6 space-y-6">
                <StepMedia step={activeStep} />
                {activeStep.content ? (
                  <div className="prose prose-slate max-w-none whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-800">
                    {activeStep.content}
                  </div>
                ) : null}
                {activeStep.fileUrl ? (
                  <a
                    href={trainingAssetUrl(activeStep.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Download supporting document
                  </a>
                ) : null}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex gap-2">
                  {!activeStep.isCompleted && (
                    <button
                      type="button"
                      onClick={handleComplete}
                      disabled={completeStep.isPending}
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {completeStep.isPending
                        ? "Saving…"
                        : activeStep.requiresConfirmation
                          ? "I understand — mark complete"
                          : "Mark complete"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={activeIndex >= steps.length - 1}
                    onClick={() =>
                      setActiveIndex((i) => Math.min(steps.length - 1, i + 1))
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <p className="text-slate-500">This course has no lessons yet.</p>
          )}
        </main>
      </div>
    </div>
  );
}
