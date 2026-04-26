'use client';
import Link from 'next/link';

export function HRDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Human Resources Terminal</h2>
        <p className="text-slate-500 font-medium">Workforce onboarding, department hierarchy, and staff management.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/hr-admin/worker-directory" className="bg-indigo-600 text-white p-10 rounded-[2.5rem] shadow-xl shadow-indigo-100 group hover:scale-[1.02] transition-transform">
           <div className="text-4xl mb-6">👥</div>
           <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Worker Directory</h3>
           <p className="text-indigo-100 font-bold text-sm">Onboard new personnel and manage employee master records.</p>
        </Link>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Departments</h3>
             <p className="text-slate-400 font-medium text-sm">Current structure: 4 Units, 12 Teams</p>
           </div>
           <button className="text-indigo-600 font-black text-xs uppercase tracking-widest text-left hover:underline pt-4">Edit Hierarchy</button>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
           <div>
             <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Hiring Queue</h3>
             <p className="text-slate-400 font-medium text-sm">3 Open Requisitions from Storekeeper</p>
           </div>
           <button className="text-emerald-600 font-black text-xs uppercase tracking-widest text-left hover:underline pt-4">Review Requests</button>
        </div>
      </div>
    </div>
  );
}
