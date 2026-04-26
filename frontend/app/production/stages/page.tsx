'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { api } from '@/lib/api';

export default function StagesTrackingPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  
  // Output Form
  const [outputForm, setOutputForm] = useState({ quantity: 0, defectCount: 0, notes: '' });

  useEffect(() => {
    fetchOrdersAndStages();
  }, []);

  const fetchOrdersAndStages = async () => {
    try {
      const res = await api.get('/production/orders');
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStage) return;
    try {
      await api.post(`/production/stages/${selectedStage.id}/output`, outputForm);
      setSelectedStage(null);
      setOutputForm({ quantity: 0, defectCount: 0, notes: '' });
      fetchOrdersAndStages(); // Refresh to see updated counts eventually or status
    } catch (error) {
      alert('Failed to record output.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto pt-16">
        <div className="max-w-7xl mx-auto space-y-8">
           <header>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Active Stage Tracking</h1>
              <p className="text-slate-500 font-medium mt-2">Monitor order progression across Cutting, Sewing, Finishing, and Packing.</p>
           </header>

           {isLoading ? (
             <div>Loading production data...</div>
           ) : (
             <div className="space-y-8">
               {orders.map((order: any) => (
                 <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                       <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Order {order.orderNumber}</span>
                          <h3 className="text-2xl font-black text-slate-900">{order.productName}</h3>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Target</span>
                          <span className="font-mono font-bold text-xl">{order.quantity} Units</span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       {order.stages.map((stage: any) => (
                         <div key={stage.id} 
                              className={`p-6 rounded-2xl border-2 transition-all ${
                                stage.status === 'COMPLETED' ? 'border-emerald-100 bg-emerald-50' : 
                                stage.status === 'IN_PROGRESS' ? 'border-indigo-200 bg-indigo-50 shadow-inner' : 'border-slate-100 bg-white hover:border-slate-200'
                              }`}>
                            <div className="flex justify-between items-start mb-4">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${
                                 stage.status === 'COMPLETED' ? 'text-emerald-700' :
                                 stage.status === 'IN_PROGRESS' ? 'text-indigo-700' : 'text-slate-400'
                               }`}>{stage.name}</span>
                               <span className="text-xs bg-white px-2 py-1 rounded-md font-bold text-slate-500">{stage.status.replace('_', ' ')}</span>
                            </div>
                            
                            <div className="mb-6 h-12">
                               {stage.assignedWorker ? (
                                 <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{(stage.assignedWorker.user?.username || 'U')[0].toUpperCase()}</div>
                                    <div className="text-xs font-bold text-slate-600 truncate">{stage.assignedWorker.user?.username}</div>
                                 </div>
                               ) : (
                                 <div className="text-xs italic text-slate-400">Unassigned Line</div>
                               )}
                            </div>

                            <button 
                               onClick={() => setSelectedStage(stage)}
                               className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                 stage.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-800 opacity-50 cursor-not-allowed' :
                                 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900'
                               }`}>
                               Log Output
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </main>

      {/* Output Modal */}
      {selectedStage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <form onSubmit={submitOutput} className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-10">
              <span className="text-indigo-600 font-black text-[10px] uppercase tracking-[.2em] mb-2 block">{selectedStage.name} Stage</span>
              <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">Record Batch</h3>
              
              <div className="space-y-6">
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Good Output (Units)</label>
                    <input required type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-mono text-2xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={outputForm.quantity || ''} onChange={e => setOutputForm({...outputForm, quantity: parseInt(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Defected Units</label>
                    <input type="number" min="0" className="w-full bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 font-mono font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-600/20 focus:border-rose-600" value={outputForm.defectCount} onChange={e => setOutputForm({...outputForm, defectCount: parseInt(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Shift Notes (Optional)</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600" value={outputForm.notes} onChange={e => setOutputForm({...outputForm, notes: e.target.value})} placeholder="Machine #3 running hot..." />
                 </div>
              </div>

              <div className="mt-10 flex flex-col space-y-3">
                 <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">Submit Output Log</button>
                 <button type="button" onClick={() => setSelectedStage(null)} className="w-full py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
}
