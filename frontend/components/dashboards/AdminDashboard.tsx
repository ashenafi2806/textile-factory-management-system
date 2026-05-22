'use client';
import Link from 'next/link';

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Console (ADMIN)</h2>
        <p className="text-slate-500 font-medium">Control center for global configurations and infrastructure.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard title="Backend API" status="Online" color="text-emerald-600" icon="⚡" />
        <StatusCard title="Database" status="Syncing" color="text-indigo-600" icon="🗄️" />
        <StatusCard title="Redis Cache" status="Active" color="text-rose-600" icon="🧠" />
        <StatusCard title="Users Active" status="24" color="text-slate-900" icon="👥" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickLink href="/admin/users" title="User Access Control" desc="Manage authentication, roles, and security policies." icon="🔑" />
        <QuickLink href="/admin/logs" title="System Audit Logs" desc="Track every critical action performed within the environment." icon="📜" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickLink href="/inventory" title="Inventory Dashboard" desc="Monitor low stock, category summaries, and recent inventory movement." icon="📦" />
        <QuickLink href="/inventory/items" title="Inventory Items" desc="Browse, search, restock, issue, and manage all inventory items." icon="🧰" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickLink href="/maintenance" title="Maintenance Dashboard" desc="Track open tasks, critical issues, and failure reports from the factory floor." icon="🛠️" />
        <QuickLink href="/maintenance/my-tasks" title="Technician Workbench" desc="Review assigned maintenance tasks and complete work orders with spare parts used." icon="⚙️" />
      </div>
    </div>
  );
}

function StatusCard({ title, status, color, icon }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
      <div className="text-3xl mb-4">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-xl font-black ${color} tracking-tight uppercase`}>{status}</p>
    </div>
  );
}

function QuickLink({ href, title, desc, icon }: any) {
  return (
    <Link href={href} className="bg-slate-900 text-white p-8 rounded-[2.5rem] hover:bg-slate-800 transition-all group relative overflow-hidden">
       <div className="absolute top-0 right-0 p-8 opacity-20 text-4xl group-hover:scale-110 transition-transform">{icon}</div>
       <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">{title}</h3>
       <p className="text-slate-400 font-bold text-sm max-w-sm">{desc}</p>
       <div className="mt-6 flex items-center space-x-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
          <span>Manage</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4-4m4 4H3"/></svg>
       </div>
    </Link>
  );
}
