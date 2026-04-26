'use client';
import Link from 'next/link';

export function StorekeeperDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Warehouse Intelligence</h2>
        <p className="text-slate-500 font-medium">Inventory tracking, material issuance, and supplier coordination.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href="/inventory/dashboard" className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 text-6xl opacity-10 group-hover:scale-110 transition-transform">📦</div>
           <h3 className="text-4xl font-black mb-4 uppercase tracking-tighter">Stock Inventory</h3>
           <p className="text-slate-400 font-bold max-w-sm mb-8">Manage raw materials, machine spare parts, and finished good storage.</p>
           <div className="bg-white/10 p-4 rounded-2xl flex items-center space-x-4 border border-white/5">
              <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">4 Low stock alerts active</span>
           </div>
        </Link>

        <div className="grid grid-cols-1 gap-6">
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming Materials</h4>
                <p className="text-xl font-black text-slate-900">3 Restock Shipments</p>
              </div>
              <button className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Verify</button>
           </div>
           
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Requests</h4>
                <p className="text-xl font-black text-slate-900">8 Issuance Slips</p>
              </div>
              <button className="bg-indigo-100 text-indigo-700 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Issue</button>
           </div>
        </div>
      </div>
    </div>
  );
}
