'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { WorkerModal } from '@/components/workforce/WorkerModal';

export default function WorkerDirectory() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/workforce/workers');
      setWorkers(response.data);
    } catch (error) {
      console.error('Failed to fetch workers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-8 bg-gray-50 min-h-screen pt-12">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Worker Directory</h1>
              <p className="text-gray-500 font-medium mt-1">Central database for all factory personnel and organizational hierarchy.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
              <span>Add New Worker</span>
            </button>
          </header>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Employee ID</th>
                  <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Worker Identity</th>
                  <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Job Position</th>
                  <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Department</th>
                  <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600 mb-4"></div>
                        <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Querying database...</span>
                      </div>
                    </td>
                  </tr>
                ) : workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center text-gray-400 font-bold italic bg-gray-50/20">
                      No worker records found. Click "Add New Worker" to begin.
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-indigo-50/30 transition-all group">
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg font-mono text-sm font-bold border border-indigo-100">
                          {worker.employeeId}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-sm">{worker.user.username}</div>
                        <div className="text-sm text-gray-400 font-medium">{worker.user.email}</div>
                      </td>
                      <td className="px-8 py-6 text-gray-600 font-bold">{worker.position}</td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-200">
                          {worker.department?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right space-x-3">
                        <button className="text-gray-400 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest transition-colors">Details</button>
                        <button className="text-gray-400 hover:text-rose-600 font-bold text-xs uppercase tracking-widest transition-colors">Remove</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <WorkerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchWorkers}
      />
    </>
  );
}
