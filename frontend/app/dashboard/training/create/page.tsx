"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { useCreateTrainingCourse } from "@/hooks/useTraining";

const ALLOWED_ROLES = ["ADMIN", "HR_ADMIN", "MANAGER", "SUPERVISOR"];

export default function CreateTrainingCoursePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const createCourse = useCreateTrainingCourse();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [isRequired, setIsRequired] = useState(true);
  const [orderIndex, setOrderIndex] = useState(1);

  const canCreate = useMemo(
    () => Boolean(user?.roles?.some((role) => ALLOWED_ROLES.includes(role))),
    [user],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;

    try {
      await createCourse.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        isRequired,
        orderIndex: Number(orderIndex),
      });
      toast.success("Training course created successfully");
      router.push("/worker/training");
    } catch (error: any) {
      const message = error?.response?.data?.message;
      toast.error(Array.isArray(message) ? message.join(", ") : "Failed to create course");
    }
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-slate-500">Loading...</div>;
  }

  if (!canCreate) {
    return (
      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-700">Access denied</h1>
        <p className="mt-2 text-sm text-red-600">
          Only Admin, HR Admin, Manager, and Supervisor can create training courses.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-3xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create Training Course</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add a new training course for workers.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            placeholder="e.g. Safety Orientation"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            placeholder="Course overview for workers"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="GENERAL"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Order Index</label>
            <input
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4"
          />
          Required course for workers
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createCourse.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {createCourse.isPending ? "Creating..." : "Create Course"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
