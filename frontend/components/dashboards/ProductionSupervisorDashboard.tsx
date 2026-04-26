'use client';
import Link from 'next/link';

export function ProductionSupervisorDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Line Supervisor Console</h2>
        <p className="text-slate-500 font-medium">Record hourly outputs, track defect rates, and manage floor execution.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Link href="/production/stages" className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-xl flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute -right-10 -top-10 text-[10rem] opacity-10 font-black group-hover:rotate-12 transition-transform">⚙️</div>
            <div className="relative z-10">
               <h3 className="text-3xl font-black uppercase tracking-tighter">My Assigned Stages</h3>
               <p className="text-indigo-200 font-bold mt-4 max-w-sm mb-10">View the orders currently at your station. Log completed batches and report defects directly.</p>
               <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-widest text-indigo-600 bg-white p-4 rounded-xl w-fit group-hover:scale-105 transition-all">
                  <span>Log Production Output</span>
               </div>
            </div>
         </Link>

         <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 flex flex-col justify-between">
            <div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Current Shift Targets</h3>
               <div className="space-y-4">
                  <TargetItem name="Basic T-Shirts (Sewing)" progress={75} current={375} target={500} />
                  <TargetItem name="Denim Jackets (Finishing)" progress={40} current={40} target={100} />
               </div>
            </div>
            <button className="mt-8 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-indigo-600 transition-colors text-left underline">View Full Manifesto</button>
         </div>
      </div>
    </div>
  );
}

function TargetItem({ name, progress, current, target }: any) {
   return (
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
         <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-900">{name}</span>
            <span className="text-xs font-black text-emerald-600">{current} / {target}</span>
         </div>
         <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }}></div>
         </div>
      </div>
   );
}
