'use client';

import { useAuth } from '@/context/auth-context';
import { Show } from '@/components/auth/show';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <p className="mb-4">Welcome, {user.username} ({user.email})</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Show forRole="ADMIN">
          <div className="p-4 bg-red-100 border border-red-300 rounded">
            <h2 className="font-bold">Admin Section</h2>
            <p>Only visible to administrators.</p>
          </div>
        </Show>
        
        <Show forRole={['MANAGER', 'ADMIN']}>
          <div className="p-4 bg-blue-100 border border-blue-300 rounded">
            <h2 className="font-bold">Management Section</h2>
            <p>Visible to Managers and Admins.</p>
          </div>
        </Show>

        <div className="p-4 bg-gray-100 border border-gray-300 rounded">
          <h2 className="font-bold">General Info</h2>
          <p>Visible to everyone.</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
