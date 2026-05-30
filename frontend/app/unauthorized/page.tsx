'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="max-w-xl rounded-4xl border border-slate-800 bg-slate-900 p-10 text-center shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-[.3em] text-rose-400">
          Access Denied
        </p>
        <h1 className="mt-4 text-4xl font-black text-white">
          You are not allowed to access this area
        </h1>
        <p className="mt-4 text-slate-300">
          Your account does not have the role required for that page. If this seems wrong, ask an administrator to review your permissions.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard" className="rounded-3xl bg-white px-5 py-3 text-sm font-black text-slate-900">
            Go to Dashboard
          </Link>
          <Link href="/login" className="rounded-3xl border border-slate-700 px-5 py-3 text-sm font-black text-white">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
