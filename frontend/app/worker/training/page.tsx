import React from 'react';
import { useTrainingDashboardSummary, useTrainingCompletionReport } from '@/hooks/useTraining';

export function TrainingDashboard() {
  const { data: summary, isLoading: summaryLoading } = useTrainingDashboardSummary();
  const { data: report, isLoading: reportLoading } = useTrainingCompletionReport();

  if (summaryLoading || reportLoading) return <div>Loading dashboard...</div>;

  return (
    <div>
      <h2>Training Dashboard</h2>
      
      <div>
        <h3>Summary</h3>
        <p>Total Workers: {report?.summary.totalWorkers}</p>
        <p>Total Courses: {report?.summary.totalCourses}</p>
        <p>Completed Courses: {report?.summary.completedCourses}</p>
        <p>In Progress: {report?.summary.inProgressCourses}</p>
        <p>Not Started: {report?.summary.notStartedCourses}</p>
      </div>

      <div>
        <h3>Recent Training Materials</h3>
        {summary?.recentMaterials?.map((material: any) => (
          <div key={material.id}>
            <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
              {material.title}
            </a>
          </div>
        ))}
      </div>

      <div>
        <h3>Course Completion Rates</h3>
        {report?.courseCompletion?.map((course) => (
          <div key={course.courseId}>
            <span>{course.courseTitle}</span>
            <progress value={course.completionRate} max={100} />
            <span>{course.completionRate.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}