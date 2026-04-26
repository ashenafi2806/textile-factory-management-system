'use client';
import Link from 'next/link';

export function ProductionManagerDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Production Executive</h2>
        <p className="text-slate-500 font-medium">Orchestrate manufacturing runs, allocate capacity, and monitor output goals.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Active Orders" value="12" trend="+2 New" color="text-indigo-600" />
        <MetricCard title="Units in Production" value="4,500" trend="On Track" color="text-amber-600" />
        <MetricCard title="Completed Today" value="1,250" trend="-50 Short" color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Link href="/production/orders" className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
            <div className="flex items-center space-x-4 mb-8 text-indigo-600">
               <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">📋</div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Order Management</h3>
            <p className="text-slate-500 font-bold mt-4 max-w-sm mb-10">Create new production runs and assign them to supervisors.</p>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-indigo-600">
               <span>Launch Planner</span>
               <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4-4m4 4H3"/></svg>
            </div>
         </Link>

         <Link href="/production/stages" className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl group">
            <div className="flex items-center space-x-4 mb-8 text-amber-500">
               <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">⚙️</div>
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Live Stage Tracking</h3>
            <p className="text-slate-400 font-medium mt-4 max-w-sm mb-10">Monitor real-time task execution across Cutting, Sewing, and Finishing lines.</p>
            <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-white/80 bg-white/10 p-4 rounded-xl w-fit group-hover:bg-white/20 transition-all">
               <span>View Output Streams</span>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            </div>
         </Link>
      </div>
    </div>
  );
}

function MetricCard({ title, value, trend, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
       <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
       <h3 className={`text-4xl font-black ${color} tracking-tighter mb-2`}>{value}</h3>
       <span className="text-[10px] font-bold text-slate-500 uppercase">{trend}</span>
    </div>
  );
}
