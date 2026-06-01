'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { useCanPerform } from '@/hooks/useCanPerform';

export default function InventoryDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canView = useCanPerform([
    'STOREKEEPER',
    'MANAGER',
    'PRODUCTION_MANAGER',
    'ADMIN',
  ]);
  const canManage = useCanPerform(['STOREKEEPER', 'ADMIN']);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/inventory');
        setItems(res.data);
      } catch (error) {
        console.error('Failed to fetch inventory', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  return (
    <>
      <Navbar />
      {!canView ? (
        <div className="p-8 bg-slate-50 min-h-screen pt-20">
          <div className="max-w-2xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h1 className="text-2xl font-bold text-rose-800">Access Denied</h1>
            <p className="mt-2 text-rose-700">
              Inventory is restricted to Storekeepers, Managers, Production
              Managers, and Admins.
            </p>
          </div>
        </div>
      ) : (
      <div className="p-8 bg-slate-50 min-h-screen pt-12">
        <div className="max-w-7xl mx-auto">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventory Control</h1>
              <p className="text-slate-500 font-medium">Real-time tracking of raw materials and spare parts.</p>
            </div>
            {canManage ? (
              <div className="flex space-x-4">
                <button className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all">Restock Item</button>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">New Material</button>
              </div>
            ) : null}
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <StatsBox title="Total SKU" value={items.length} color="bg-indigo-600" />
            <StatsBox title="Low Stock" value={items.filter(i => i.quantity <= i.minThreshold).length} color="bg-rose-500" />
            <StatsBox title="Issued Today" value="12" color="bg-emerald-500" />
            <StatsBox title="Warehouse Utilization" value="78%" color="bg-slate-900" />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">SKU / Item Name</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Stock Level</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Accessing Warehouse Database...</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="text-xs font-mono font-bold text-indigo-600 mb-1">{item.sku}</div>
                      <div className="font-black text-slate-900 uppercase text-sm group-hover:text-indigo-600 transition-colors">{item.name}</div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200">
                         {item.category.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <span className={`text-xl font-black ${item.quantity <= item.minThreshold ? 'text-rose-600' : 'text-slate-900'}`}>
                          {item.quantity} {item.unit}
                        </span>
                        {item.quantity <= item.minThreshold && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-black uppercase">Low</span>
                        )}
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                         <div 
                           className={`h-full ${item.quantity <= item.minThreshold ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                           style={{ width: `${Math.min((item.quantity / (item.minThreshold * 2)) * 100, 100)}%` }}
                         ></div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-500 font-bold text-sm tracking-tight">{item.location || 'N/A'}</td>
                    <td className="px-8 py-6 text-right">
                       <button className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">View History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
    </>
  );
}

function StatsBox({ title, value, color }: any) {
  return (
    <div className={`${color} p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform`}>
       <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{title}</p>
       <h2 className="text-4xl font-black tracking-tighter">{value}</h2>
    </div>
  );
}
