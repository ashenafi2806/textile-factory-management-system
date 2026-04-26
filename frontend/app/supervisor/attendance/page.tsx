'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';

export default function AttendanceLogging() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await api.get('/workforce/workers');
        setWorkers(response.data);
      } catch (error) {
        console.error('Failed to fetch team members', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const handleStatusChange = async (workerId: string, type: 'checkIn' | 'checkOut') => {
    try {
      const now = new Date().toISOString();
      await api.post('/workforce/attendance', {
        workerId,
        date: new Date().toISOString(),
        [type]: now,
      });
      alert(`${type === 'checkIn' ? 'Check-in' : 'Check-out'} recorded for ${workerId}`);
    } catch (error) {
      console.error('Failed to record attendance', error);
      alert('Error recording attendance');
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-8 bg-slate-50 min-h-screen pt-12">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Supervisor Dashboard</h1>
            <p className="text-slate-500 mt-2 text-lg">Daily Attendance Logging for Production Team A</p>
            <div className="mt-4 inline-block bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
              <span className="text-slate-700 font-medium">{new Date().toDateString()}</span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-slate-400 text-xl font-medium">Loading your team...</div>
            ) : workers.map((worker) => (
              <div key={worker.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100 border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {worker.user.username[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{worker.user.username}</h3>
                    <p className="text-slate-400 text-sm">{worker.position}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => handleStatusChange(worker.id, 'checkIn')}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-100"
                  >
                    Confirm Check-In
                  </button>
                  <button 
                    onClick={() => handleStatusChange(worker.id, 'checkOut')}
                    className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-100"
                  >
                    Log Check-Out
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
