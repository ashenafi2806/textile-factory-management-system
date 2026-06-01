'use client';

import { useAuth } from '@/context/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { QAStaffDashboard } from '@/components/dashboards/QAStaffDashboard';
import { useCanPerform } from '@/hooks/useCanPerform';

export default function QaDashboardPage() {
  const { user } = useAuth();
  const canView = useCanPerform(['QA_STAFF', 'QA_MANAGER', 'ADMIN']);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
            <p className="mt-2 text-rose-700">
              The QA Staff Dashboard is restricted to QA Staff, QA Managers, and
              Admins. Managers can monitor inspections from the Manager Console
              at <code className="rounded bg-rose-100 px-1 text-sm">/manager/leave-approvals</code>
              {" "}or by clicking <em>Inspections</em> on a production order.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <p className="text-indigo-600 font-black uppercase tracking-[.3em] text-[10px] mb-2">
              Quality Assurance
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              QA Staff Dashboard
            </h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Submit stage inspections for manager approval and track review status.
            </p>
          </header>
          <QAStaffDashboard />
        </div>
      </main>
    </div>
  );
}
