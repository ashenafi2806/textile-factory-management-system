/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useWorkerCourseContent,
  useCompleteCourseStep,
  useWorkerEnrolledCourses,
} from '@/hooks/useWorkerTraining';
import { useQueryClient } from '@tanstack/react-query';

export function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: course, isLoading } = useWorkerCourseContent(courseId);
  const { data: enrollments } = useWorkerEnrolledCourses();
  const completeStep = useCompleteCourseStep();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Find enrollment for this course
  const enrollment = enrollments?.find((e: any) => e.courseId === courseId);
  const steps = course?.steps || [];
  const currentStep = steps[currentStepIndex];
  const isStepCompleted = currentStep?.isCompleted || false;

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Course completed
      navigate('/training');
    }
  };

  const handleCompleteStep = async () => {
    if (!enrollment || !currentStep) return;

    await completeStep.mutateAsync({
      stepId: currentStep.id,
      enrollmentId: enrollment.id,
    });

    // Refetch to update progress
    queryClient.invalidateQueries({ queryKey: ["worker", "training", "course", courseId] });
    queryClient.invalidateQueries({ queryKey: ["worker", "training", "enrolled-courses"] });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-gray-500">Loading course content...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Course not found</h2>
        <button
          onClick={() => navigate('/training')}
          className="mt-4 text-blue-600 hover:underline"
        >
          Back to Training
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Course Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/training')}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to My Training
        </button>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        {course.description && (
          <p className="text-gray-600 mt-2">{course.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Course Progress</span>
          <span>{Math.round(enrollment?.progress || 0)}%</span>
        </div>
        <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${enrollment?.progress || 0}%` }}
          />
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex gap-4 mb-6 overflow-x-auto">
        {steps.map((step: any, idx: number) => (
          <button
            key={step.id}
            onClick={() => setCurrentStepIndex(idx)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              idx === currentStepIndex
                ? 'bg-blue-600 text-white'
                : step.isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {step.isCompleted && '✓ '}
            {step.title}
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{currentStep?.title}</h2>
        
        {currentStep?.description && (
          <p className="text-gray-600 mb-4">{currentStep.description}</p>
        )}

        {/* Video Content */}
        {currentStep?.videoUrl && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Video Tutorial</h3>
            <div className="aspect-w-16 aspect-h-9">
              <video
                src={currentStep.videoUrl}
                controls
                className="w-full rounded-lg"
                poster="/video-placeholder.jpg"
              />
            </div>
          </div>
        )}

        {/* Text Content */}
        {currentStep?.content && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Instructions</h3>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">
                {currentStep.content}
              </pre>
            </div>
          </div>
        )}

        {/* File Attachment */}
        {currentStep?.fileUrl && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Resources</h3>
            <a
              href={currentStep.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              📄 Download Supporting Document
            </a>
          </div>
        )}

        {/* Complete Step Button */}
        {!isStepCompleted && (
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={handleCompleteStep}
              disabled={completeStep.isPending}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {completeStep.isPending ? 'Completing...' : '✓ Mark as Complete'}
            </button>
          </div>
        )}

        {isStepCompleted && (
          <div className="mt-6 pt-4 border-t">
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-center">
              ✓ Step completed!
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          
          {isStepCompleted && (
            <button
              onClick={handleNextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentStepIndex === steps.length - 1 ? 'Finish Course' : 'Next Step'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}