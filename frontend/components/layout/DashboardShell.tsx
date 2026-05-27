'use client';

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

const dashboardLinks = [
  { href: '/dashboard/manager', label: 'Manager', roles: ['MANAGER', 'ADMIN'] },
  { href: '/dashboard/supervisor', label: 'Supervisor', roles: ['SUPERVISOR', 'PRODUCTION_SUPERVISOR', 'ADMIN'] },
  { href: '/dashboard/qa-staff', label: 'QA Staff', roles: ['QA_STAFF', 'QA_MANAGER', 'ADMIN'] },
  { href: '/dashboard/qa-manager', label: 'QA Manager', roles: ['QA_MANAGER', 'ADMIN'] },
  { href: '/production', label: 'Production', roles: ['PRODUCTION_MANAGER', 'PRODUCTION_SUPERVISOR', 'QA_MANAGER', 'QA_STAFF', 'ADMIN'] },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const visibleLinks = user
    ? dashboardLinks.filter((link) => link.roles.some((role) => user.roles.includes(role)))
    : dashboardLinks;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-indigo-600">Dashboard</p>
            <h1 className="text-2xl font-black text-slate-900">Textile Factory Management</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{user.username}</p>
                  <p className="text-xs uppercase tracking-[.24em] text-slate-500">{user.roles[0]}</p>
                </div>
                <button
                  onClick={logout}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 xl:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[.28em] text-slate-400">Quick Nav</p>
          <nav className="space-y-2">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-3xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
