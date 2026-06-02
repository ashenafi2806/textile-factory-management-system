// components/training/TrainingCoursesList.tsx
import React from 'react';
import { useTrainingCourses, useDeleteTrainingCourse } from '@/hooks/useTraining';

export function TrainingCoursesList() {
  const { data: courses, isLoading, error } = useTrainingCourses();
  const deleteCourse = useDeleteTrainingCourse();

  if (isLoading) return <div>Loading courses...</div>;
  if (error) return <div>Error loading courses</div>;

  return (
    <div>
      <h2>Training Courses</h2>
      {courses?.map((course) => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <span>Required: {course.isRequired ? 'Yes' : 'No'}</span>
          <button onClick={() => deleteCourse.mutate(course.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}