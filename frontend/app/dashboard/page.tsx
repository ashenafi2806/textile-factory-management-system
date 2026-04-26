'use client';

import { useAuth } from '@/context/auth-context';
import { Show } from '@/components/auth/show';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Simulation */}
      <aside className="w-full md:w-64 bg-indigo-900 text-white p-6 flex flex-col shadow-2xl z-10">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-white/20 p-2 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <span className="text-xl font-black tracking-tight uppercase">TFMS Core</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span>Overview</span>
          </Link>
          {/* Mock nav items */}
          <div className="pt-4 pb-2 text-xs font-bold text-indigo-300 uppercase tracking-widest pl-3">Subsystems</div>
          <Link href="#" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-indigo-100">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
             <span>Production</span>
          </Link>
          <Link href="#" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-indigo-100">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
             <span>Inventory</span>
          </Link>
        </nav>

        <div className="pt-10">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-rose-500/20 text-rose-300 rounded-xl hover:bg-rose-500 transition-all hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span className="font-bold">Exit System</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Terminal</h1>
            <p className="text-slate-500 font-medium mt-1">Logged in as <span className="text-indigo-600 font-bold">@{user.username}</span> • {user.roles.join(', ')}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
             <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold flex items-center space-x-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>DB Online</span>
             </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Admin Section */}
          <Show forRole="ADMIN">
            <DashboardCard 
              title="System Administration" 
              desc="Global settings, roles, and system health monitoring."
              icon="⚙️"
              color="bg-red-50"
              borderColor="border-red-100"
              textColor="text-red-600"
              href="#"
            />
          </Show>

          {/* HR Admin Section */}
          <Show forRole={['HR_ADMIN', 'ADMIN']}>
            <DashboardCard 
              title="Workforce Directory" 
              desc="Manage worker profiles, departments, and teams."
              icon="👤"
              color="bg-indigo-50"
              borderColor="border-indigo-100"
              textColor="text-indigo-600"
              href="/hr-admin/worker-directory"
            />
          </Show>

          {/* Supervisor Section */}
          <Show forRole={['SUPERVISOR', 'ADMIN']}>
            <DashboardCard 
              title="Attendance Logging" 
              desc="Record and verify daily worker check-ins."
              icon="📝"
              color="bg-emerald-50"
              borderColor="border-emerald-100"
              textColor="text-emerald-600"
              href="/supervisor/attendance"
            />
          </Show>

          {/* Manager Section */}
          <Show forRole={['MANAGER', 'ADMIN']}>
            <DashboardCard 
              title="Leave Approvals" 
              desc="Review and process pending worker leave requests."
              icon="📅"
              color="bg-purple-50"
              borderColor="border-purple-100"
              textColor="text-purple-600"
              href="/manager/leave-approvals"
            />
            <DashboardCard 
              title="Workforce Insights" 
              desc="View capacity analytics and performance data."
              icon="📊"
              color="bg-slate-900"
              borderColor="border-slate-800"
              textColor="text-slate-100"
              href="/manager/analytics"
              dark
            />
          </Show>

          {/* General Section */}
          <DashboardCard 
            title="My Attendance" 
            desc="View your personal check-in history."
            icon="⏱️"
            color="bg-white"
            borderColor="border-slate-200"
            textColor="text-slate-700"
            href="#"
          />
        </div>

        {/* System Activity Mockup */}
        <section className="mt-16 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
           <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
             <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
             <span>Recent System Events</span>
           </h2>
           <div className="space-y-4">
              <EventItem time="2 mins ago" user="hr_admin" action="created new worker record for EMP-2024" />
              <EventItem time="15 mins ago" user="manager_alice" action="approved 3 leave requests" />
              <EventItem time="1 hour ago" user="system" action="automated shift rotation completed" />
           </div>
        </section>
      </main>
    </div>
  );
}

function DashboardCard({ title, desc, icon, color, borderColor, textColor, href, dark = false }: any) {
  return (
    <Link href={href} className={`${color} ${borderColor} border-2 p-8 rounded-[2rem] hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col justify-between h-64`}>
       <div>
         <div className="text-4xl mb-4 group-hover:scale-110 transition-transform origin-left">{icon}</div>
         <h3 className={`text-xl font-extrabold ${dark ? 'text-white' : 'text-slate-900'} mb-2`}>{title}</h3>
         <p className={`text-sm ${dark ? 'text-slate-400' : 'text-slate-500'} font-medium line-clamp-2`}>{desc}</p>
       </div>
       <div className={`flex items-center space-x-2 ${textColor} font-bold text-sm tracking-tight pt-4`}>
         <span>Launch Module</span>
         <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4 4H3"/></svg>
       </div>
    </Link>
  );
}

function EventItem({ time, user, action }: any) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 rounded-lg px-3 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
        <p className="text-sm text-slate-600 font-medium">
          <span className="font-bold text-slate-900">{user}</span> {action}
        </p>
      </div>
      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{time}</span>
    </div>
  );
}
