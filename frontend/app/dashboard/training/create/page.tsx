"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/context/auth-context";
import {
  useCreateTrainingCourse,
  useAddTrainingStep,
} from "@/hooks/useTraining";
import { TRAINING_CATEGORIES } from "@/lib/training-utils";
import {
  BookOpen,
  CheckCircle2,
  Film,
  Plus,
  Users,
} from "lucide-react";

const ALLOWED_ROLES = ["ADMIN", "HR_ADMIN", "MANAGER", "SUPERVISOR"];

type LessonDraft = {
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  fileUrl: string;
  requiresConfirmation: boolean;
};

const emptyLesson = (): LessonDraft => ({
  title: "",
  description: "",
  content: "",
  videoUrl: "",
  fileUrl: "",
  requiresConfirmation: false,
});

export default function CreateTrainingCoursePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const createCourse = useCreateTrainingCourse();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [isRequired, setIsRequired] = useState(true);
  const [orderIndex, setOrderIndex] = useState(1);

  const [lesson, setLesson] = useState<LessonDraft>(emptyLesson());
  const [addedLessons, setAddedLessons] = useState<string[]>([]);
  const addStep = useAddTrainingStep(courseId ?? "");

  const canCreate = useMemo(
    () => Boolean(user?.roles?.some((role) => ALLOWED_ROLES.includes(role))),
    [user],
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    try {
      const created = await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        isRequired,
        orderIndex: Number(orderIndex),
      });
      const id = (created as { id?: string })?.id;
      if (!id) {
        toast.error("Course created but id missing — open Training Manage");
        router.push("/training/manage");
        return;
      }
      setCourseId(id);
      setCourseTitle(title.trim());
      setStep(2);
      toast.success("Course created — now add lessons (videos & text)");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(
        Array.isArray(message)
          ? message.join(", ")
          : message || "Failed to create course. Restart backend after migration.",
      );
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !lesson.title.trim()) {
      return toast.error("Lesson title is required");
    }
    try {
      await addStep.mutateAsync({
        title: lesson.title.trim(),
        description: lesson.description.trim() || undefined,
        content: lesson.content.trim() || undefined,
        videoUrl: lesson.videoUrl.trim() || undefined,
        fileUrl: lesson.fileUrl.trim() || undefined,
        requiresConfirmation: lesson.requiresConfirmation,
      });
      setAddedLessons((prev) => [...prev, lesson.title.trim()]);
      setLesson(emptyLesson());
      toast.success("Lesson added");
    } catch {
      toast.error("Failed to add lesson");
    }
  };

  if (isLoading) {
    return <div className="p-8 pt-24 text-slate-500">Loading…</div>;
  }

  if (!canCreate) {
    return (
      <div className="mx-auto mt-20 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-700">Access denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 pt-20">
        <div>
          <Link
            href="/training/manage"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to training hub
          </Link>
          <h1 className="mt-3 text-3xl font-black text-slate-900">
            Create training course
          </h1>
          <p className="mt-2 text-slate-600">
            Step 1: course details → Step 2: add lessons (video links, text, files) →
            Step 3: enroll workers.
          </p>
        </div>

        <WizardSteps current={step} />

        {step === 1 && (
          <form
            onSubmit={handleCreateCourse}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Course information
            </h2>
            <Field label="Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={inputClass}
                placeholder="e.g. Machine Safety Orientation"
              />
            </Field>
            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="What will workers learn?"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClass}
                >
                  {TRAINING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Display order">
                <input
                  type="number"
                  min={0}
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
              />
              Required for all workers
            </label>
            <button
              type="submit"
              disabled={createCourse.isPending}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {createCourse.isPending
                ? "Creating…"
                : "Continue — add lessons next →"}
            </button>
          </form>
        )}

        {step === 2 && courseId && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="font-semibold text-indigo-900">{courseTitle}</p>
              <p className="mt-1 text-sm text-indigo-700">
                Add one or more lessons. Each lesson can include a YouTube/video URL,
                written instructions, and an optional document link.
              </p>
            </div>

            {addedLessons.length > 0 && (
              <ul className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase text-emerald-800">
                  Lessons added ({addedLessons.length})
                </p>
                {addedLessons.map((t, i) => (
                  <li key={i} className="mt-1 flex items-center gap-2 text-sm text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    {t}
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={handleAddLesson}
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <Film className="h-5 w-5 text-indigo-600" />
                Add lesson / course material
              </h2>
              <Field label="Lesson title" required>
                <input
                  value={lesson.title}
                  onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Watch: PPE overview"
                />
              </Field>
              <Field label="Short summary">
                <input
                  value={lesson.description}
                  onChange={(e) =>
                    setLesson({ ...lesson, description: e.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Video URL (YouTube or uploaded file path)">
                <input
                  value={lesson.videoUrl}
                  onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </Field>
              <Field label="Text content / instructions">
                <textarea
                  value={lesson.content}
                  onChange={(e) => setLesson({ ...lesson, content: e.target.value })}
                  rows={6}
                  className={inputClass}
                  placeholder="Write the learning material workers should read..."
                />
              </Field>
              <Field label="Document link (PDF path or URL)">
                <input
                  value={lesson.fileUrl}
                  onChange={(e) => setLesson({ ...lesson, fileUrl: e.target.value })}
                  className={inputClass}
                  placeholder="/uploads/training/manual.pdf or https://..."
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={lesson.requiresConfirmation}
                  onChange={(e) =>
                    setLesson({
                      ...lesson,
                      requiresConfirmation: e.target.checked,
                    })
                  }
                />
                Worker must confirm they understood this lesson
              </label>
              <button
                type="submit"
                disabled={addStep.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-indigo-600 bg-white py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                {addStep.isPending ? "Saving…" : "Add this lesson"}
              </button>
            </form>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white"
              >
                {addedLessons.length === 0
                  ? "Skip lessons for now →"
                  : "Done adding lessons →"}
              </button>
              <Link
                href={`/training/manage/courses/${courseId}`}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-center text-sm font-semibold text-slate-700"
              >
                Open full editor
              </Link>
            </div>
          </div>
        )}

        {step === 3 && courseId && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">Course ready</h2>
            <p className="mt-2 text-slate-600">
              {addedLessons.length} lesson(s) added to &quot;{courseTitle}&quot;.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/training/manage/courses/${courseId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white"
              >
                <Users className="h-4 w-4" />
                Enroll employees
              </Link>
              <Link
                href="/training/manage"
                className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700"
              >
                Back to all courses
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function WizardSteps({ current }: { current: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Course info" },
    { n: 2, label: "Lessons & materials" },
    { n: 3, label: "Finish" },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((item, i) => (
        <div key={item.n} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              current >= item.n
                ? "bg-indigo-600 text-white"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {current > item.n ? <CheckCircle2 className="h-4 w-4" /> : item.n}
          </div>
          <span
            className={`hidden text-xs font-semibold sm:inline ${
              current === item.n ? "text-indigo-700" : "text-slate-500"
            }`}
          >
            {item.label}
          </span>
          {i < items.length - 1 && (
            <div className="mx-1 h-0.5 flex-1 bg-slate-200" />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
    </div>
  );
}
