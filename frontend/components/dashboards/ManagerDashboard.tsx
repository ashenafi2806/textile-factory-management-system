'use client';
import Link from 'next/link';

export function ManagerDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Factory Executive Terminal</h2>
        <p className="text-slate-500 font-medium">End-to-end analytics, production planning, and decision support.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Efficiency" value="94.2%" trend="+2.1%" color="text-indigo-600" />
        <MetricCard title="Inventory" value="Low Stock" trend="4 Items" color="text-rose-600" />
        <MetricCard title="Staffing" value="Safe" trend="98% Active" color="text-emerald-600" />
        <MetricCard title="Revenue" value="840K" trend="Monthly" color="text-slate-900" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Link href="/manager/analytics" className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-xl shadow-indigo-100 flex flex-col justify-between group">
            <h3 className="text-3xl font-black uppercase tracking-tighter">Capacity Analytics</h3>
            <p className="text-indigo-100 font-bold mt-4 max-w-sm mb-10">Real-time visualization of machine throughput and labor availability.</p>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest bg-white/20 p-4 rounded-2xl w-fit group-hover:bg-white/30 transition-colors">
               <span>Launch Intelligence</span>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
         </Link>

         <Link href="/manager/leave-approvals" className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-all group">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Operations Queue</h3>
            <p className="text-slate-500 font-bold mt-4 max-w-sm mb-10">Process leave requests, overtime approvals, and hiring requisitions.</p>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-indigo-600">
               <span>Review 12 Pending Actions</span>
               <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4-4m4 4H3"/></svg>
            </div>
         </Link>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
       <div className="flex items-baseline space-x-2">
         <span className={`text-2xl font-black ${color} tracking-tighter`}>{value}</span>
         <span className="text-[10px] font-bold text-slate-400">{trend}</span>
       </div>
    </div>
  );
}
