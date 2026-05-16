'use client';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tighter">TFMS</span>
            </Link>
            
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-bold transition-colors">Dashboard</Link>
              <Link href="/production/orders" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-bold transition-colors">Production</Link>
              <Link href="/production/stages" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-bold transition-colors">Stages</Link>
              <Link href="/hr-admin/worker-directory" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-bold transition-colors">Workforce</Link>
              <Link href="/supervisor/attendance" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-bold transition-colors">Attendance</Link>
              <Link href="/manager/leave-approvals" className="text-gray-600 hover:text-indigo-600 px-3 py-2 text-sm font-bold transition-colors">Leaves</Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-black text-gray-900 leading-tight">{user.username}</span>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {user.roles[0]}
              </span>
            </div>
            <button 
              onClick={logout}
              className="text-gray-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-all"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
