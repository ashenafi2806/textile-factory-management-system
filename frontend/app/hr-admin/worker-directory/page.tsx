'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function WorkerDirectory() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await api.get('/workforce/workers');
        setWorkers(response.data);
      } catch (error) {
        console.error('Failed to fetch workers', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Worker Master Records</h1>
            <p className="text-gray-500 mt-1">Manage organizational hierarchy and worker profiles.</p>
          </div>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            + Add New Worker
          </button>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Worker Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Loading records...</td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No worker records found.</td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-indigo-600">{worker.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{worker.user.username}</div>
                      <div className="text-sm text-gray-500">{worker.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{worker.position}</td>
                    <td className="px-6 py-4 text-gray-600">{worker.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button className="text-gray-400 hover:text-indigo-600 transition-colors">Edit</button>
                      <button className="text-gray-400 hover:text-red-600 transition-colors">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
