// components/training/EnrollWorkerForm.tsx
import React, { useState } from 'react';
import { useEnrollInCourse, useTrainingCourses } from '@/hooks/useTraining';

export function EnrollWorkerForm({ workerId }: { workerId: string }) {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const { data: courses } = useTrainingCourses();
  const enroll = useEnrollInCourse();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseId) {
      enroll.mutate({ workerId, courseId: selectedCourseId });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
        <option value="">Select a course</option>
        {courses?.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title} {course.isRequired ? '(Required)' : ''}
          </option>
        ))}
      </select>
      <button type="submit" disabled={enroll.isPending}>
        {enroll.isPending ? 'Enrolling...' : 'Enroll Worker'}
      </button>
    </form>
  );
}