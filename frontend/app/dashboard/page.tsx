'use client';

import { useAuth } from '@/context/auth-context';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { HRDashboard } from '@/components/dashboards/HRDashboard';
import { ManagerDashboard } from '@/components/dashboards/ManagerDashboard';
import { SupervisorDashboard } from '@/components/dashboards/SupervisorDashboard';
import { StorekeeperDashboard } from '@/components/dashboards/StorekeeperDashboard';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  const roles = user.roles;

  const renderDashboard = () => {
    if (roles.includes('ADMIN')) return <AdminDashboard />;
    if (roles.includes('HR_ADMIN')) return <HRDashboard />;
    if (roles.includes('MANAGER')) return <ManagerDashboard />;
    if (roles.includes('STOREKEEPER')) return <StorekeeperDashboard />;
    if (roles.includes('SUPERVISOR')) return <SupervisorDashboard />;
    
    // Default fallback to a generic link list or a simple version of the portal
    return (
      <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Welcome to TFMS Portal</h3>
        <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 text-lg leading-relaxed italic">
          "Efficiency is doing things right; effectiveness is doing the right things."
        </p>
        <div className="flex flex-col items-center space-y-4">
           {roles.includes('WORKER') && (
             <Link href="/worker/dashboard" className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95">
                Launch My Worker Portal
             </Link>
           )}
           {roles.includes('PRODUCTION_MANAGER') && <DashboardPlaceholder title="Production Planning" />}
           {roles.includes('MAINTENANCE_MANAGER') && <DashboardPlaceholder title="Maintenance Engineering" />}
           {roles.includes('QA_MANAGER') && <DashboardPlaceholder title="Quality Control & QA" />}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <p className="text-indigo-600 font-black uppercase tracking-[.2em] text-[10px] mb-2">Authenticated Session</p>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Welcome back, {user.username}.</h1>
            </div>
          </header>

          <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-6">
            {renderDashboard()}
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 w-full max-w-lg text-left">
       <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Under Construction</span>
       <h4 className="text-xl font-bold text-slate-900 mb-2">{title} Dashboard</h4>
       <p className="text-slate-500 text-sm font-medium leading-relaxed">We are currently integrating the real-time data streams for {title.toLowerCase()} operations. Please check back shortly.</p>
    </div>
  );
}
