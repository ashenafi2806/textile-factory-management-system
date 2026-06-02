// components/training/WorkerTrainingProgress.tsx
import React from 'react';
import { useWorkerTrainingProgress, useCompleteStep } from '@/hooks/useTraining';

export function WorkerTrainingProgress({ workerId }: { workerId: string }) {
  const { data: enrollments, isLoading } = useWorkerTrainingProgress(workerId);
  const completeStep = useCompleteStep();

  if (isLoading) return <div>Loading progress...</div>;

  return (
    <div>
      <h2>Training Progress</h2>
      {enrollments?.map((enrollment) => (
        <div key={enrollment.id}>
          <h3>{enrollment.course?.title}</h3>
          <progress value={enrollment.progress} max={100} />
          <span>{enrollment.progress}% Complete</span>
          <p>Status: {enrollment.status}</p>
          
          {enrollment.course?.steps?.map((step) => (
            <div key={step.id}>
              <input
                type="checkbox"
                checked={step.isCompleted}
                onChange={() =>
                  completeStep.mutate({
                    enrollmentId: enrollment.id,
                    stepId: step.id,
                  })
                }
              />
              <label>{step.title}</label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}