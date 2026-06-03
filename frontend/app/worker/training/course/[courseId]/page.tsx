"use client";

import { Navbar } from "@/components/layout/Navbar";
import CoursePlayer from "@/components/training/CoursePlayer";
import { use } from "react";

export default function WorkerCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);

  return (
    <>
      <Navbar />
      <div className="pt-16">
        <CoursePlayer courseId={courseId} />
      </div>
    </>
  );
}
