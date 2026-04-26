'use client';
import Link from 'next/link';

export function SupervisorDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Supervisor Ops</h2>
        <p className="text-slate-500 font-medium">Daily attendance logging, rotation management, and shift tracking.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href="/supervisor/attendance" className="bg-emerald-600 text-white p-10 rounded-[3rem] shadow-xl shadow-emerald-100 flex flex-col justify-between group">
           <h3 className="text-3xl font-black uppercase tracking-tighter">Attendance Log</h3>
           <p className="text-emerald-100 font-bold mt-4 max-w-sm mb-10 text-xl font-mono">Present: 18 / 20</p>
           <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest bg-white/20 p-4 rounded-2xl w-fit group-hover:bg-white/30 transition-colors">
              <span>Start Daily Census</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
           </div>
        </Link>
        
        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 flex flex-col justify-between">
           <div>
             <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Rotation Engine</h3>
             <p className="text-slate-400 font-bold mt-4 max-w-sm">Current Pattern: Morning (2d) → Night (2d) → Off (2d)</p>
           </div>
           <div className="mt-8 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <span>Upcoming Transition</span>
                 <span className="text-indigo-600 font-black">28 Apr</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
