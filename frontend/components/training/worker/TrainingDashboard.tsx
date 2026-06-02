/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  useWorkerEnrolledCourses,
  useOverallTrainingProgress,
  useRequiredCourses,
} from '@/hooks/useWorkerTraining';
import { Link } from 'react-router-dom';

export function WorkerTrainingDashboard() {
  const { data: progress, isLoading: progressLoading } = useOverallTrainingProgress();
  const { data: requiredCourses, isLoading: requiredLoading } = useRequiredCourses();
  const { data: enrollments, isLoading: enrollmentsLoading } = useWorkerEnrolledCourses();

  if (progressLoading || requiredLoading || enrollmentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading training data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Training</h1>

      {/* Overall Progress Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress?.overallProgress || 0}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-blue-600">
            {Math.round(progress?.overallProgress || 0)}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className="text-2xl font-bold">{progress?.totalCourses}</div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{progress?.completedCourses}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{progress?.inProgressCourses}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>
      </div>

      {/* Required Courses Alert */}
      {requiredCourses?.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have {requiredCourses.length} required course{requiredCourses.length > 1 ? 's' : ''} to complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Courses List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">My Courses</h2>
        <div className="space-y-4">
          {enrollments?.map((enrollment: any) => (
            <WorkerCourseCard key={enrollment.id} enrollment={enrollment} />
          ))}
          {(!enrollments || enrollments.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>You are not enrolled in any courses yet.</p>
              <Link to="/training/available" className="text-blue-600 hover:underline mt-2 inline-block">
                Browse Available Courses →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Course Card Component
function WorkerCourseCard({ enrollment }: { enrollment: any }) {
  const course = enrollment.course;
  const progress = enrollment.progress;
  const status = enrollment.status;

  const getStatusColor = () => {
    if (status === 'COMPLETED') return 'text-green-600 bg-green-100';
    if (status === 'IN_PROGRESS') return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getStatusText = () => {
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'IN_PROGRESS') return 'In Progress';
    return 'Not Started';
  };

  return (
    <Link to={`/training/course/${course.id}`} className="block">
      <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">{course.title}</h3>
            {course.description && (
              <p className="text-gray-600 text-sm mt-1">{course.description}</p>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {course.isRequired && (
          <div className="mt-2 text-xs text-red-600">
            ⚠️ Required Course
          </div>
        )}
      </div>
    </Link>
  );
}