'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import axios from 'axios';
import { api } from '@/lib/api';

export default function OrderManagementPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Order Form state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [formData, setFormData] = useState({
    orderNumber: '',
    productName: '',
    quantity: 100,
    deadline: '',
    priority: 'NORMAL'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/production/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/production/orders', formData);
      setShowOrderModal(false);
      fetchOrders();
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Check console.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto space-y-8">
           <header className="flex justify-between items-end">
              <div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">Production Planner</h1>
                 <p className="text-slate-500 font-medium mt-2">Manage orders, allocations, and deadlines.</p>
              </div>
              <button 
                 onClick={() => setShowOrderModal(true)}
                 className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
                 Launch New Run
              </button>
           </header>

           {isLoading ? (
             <div className="text-center py-20">Loading orders...</div>
           ) : (
             <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400">
                      <tr>
                         <th className="p-6">Order ID</th>
                         <th className="p-6">Product Line</th>
                         <th className="p-6">Quantity</th>
                         <th className="p-6">Status</th>
                         <th className="p-6">Deadline</th>
                         <th className="p-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-medium text-sm">
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">No production runs active.</td>
                        </tr>
                      )}
                      {orders.map((order: any) => (
                         <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-6">
                               <div className="flex items-center space-x-2">
                                  {order.priority === 'HIGH' && <span className="w-2 h-2 bg-rose-500 rounded-full"></span>}
                                  <span className="font-bold text-slate-900">{order.orderNumber}</span>
                               </div>
                            </td>
                            <td className="p-6">{order.productName}</td>
                            <td className="p-6 font-mono font-bold">{order.quantity}</td>
                            <td className="p-6">
                               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                 order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                 order.status === 'IN_PRODUCTION' ? 'bg-indigo-100 text-indigo-700' :
                                 order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                               }`}>
                                  {order.status.replace('_', ' ')}
                               </span>
                            </td>
                            <td className="p-6 text-slate-500">{new Date(order.deadline).toLocaleDateString()}</td>
                            <td className="p-6 text-right">
                               <button className="text-indigo-600 font-bold hover:underline">View Stages</button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      </main>

      {showOrderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <form onSubmit={handleCreateOrder} className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden p-10">
              <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter">New Production Run</h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Order Tracking ID</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={formData.orderNumber} onChange={e => setFormData({...formData, orderNumber: e.target.value})} placeholder="e.g. ORD-2026-001" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Product Name</label>
                    <input required type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Units</label>
                       <input required type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Target Date</label>
                       <input required type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                       <option value="LOW">Low Backup</option>
                       <option value="NORMAL">Normal Run</option>
                       <option value="HIGH">High Priority</option>
                       <option value="URGENT">Urgent Rush Run</option>
                    </select>
                 </div>
              </div>
              <div className="mt-10 flex space-x-4">
                 <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Manifest Order</button>
                 <button type="button" onClick={() => setShowOrderModal(false)} className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
