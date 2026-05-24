'use client';
import { useState } from 'react';
import api from '@/lib/api';

const SKILL_LEVELS = ['Junior', 'Intermediate', 'Expert'];
const ROLES = ['WORKER', 'SUPERVISOR', 'MANAGER', 'HR_ADMIN', 'ADMIN'];

export function WorkerModal({ isOpen, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState<any>({
    username: '',
    email: '',
    employeeId: '',
    position: '',
    salary: '',
    phoneNumber: '',
    skillLevel: 'Junior',
    emergencyContact: '',
    roles: ['WORKER'],
  });

  if (!isOpen) return null;

  const handleRoleToggle = (role: string) => {
    const newRoles = formData.roles.includes(role)
      ? formData.roles.filter((r: string) => r !== role)
      : [...formData.roles, role];
    setFormData({ ...formData, roles: newRoles });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.employeeId) delete payload.employeeId;
      payload.salary = payload.salary ? parseFloat(payload.salary) : undefined;
      await api.post('/workforce/workers', payload);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to create worker', error);
      alert('Error creating worker');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-2xl shadow-2xl border border-slate-100 my-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Factory Enrollment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Username</label>
               <input 
                 required
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                 value={formData.username}
                 onChange={(e) => setFormData({...formData, username: e.target.value})}
               />
             </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Employee ID</label>
                <input 
                  placeholder="Auto-generated if empty"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                />
              </div>

             <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
               <input 
                 required
                 type="email"
                 className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                 value={formData.email}
                 onChange={(e) => setFormData({...formData, email: e.target.value})}
               />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Phone Number</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Position</label>
                <input 
                  required
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Monthly Salary (ETB)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                />
             </div>

             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Skill Level</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold appearance-none"
                  value={formData.skillLevel}
                  onChange={(e) => setFormData({...formData, skillLevel: e.target.value})}
                >
                  {SKILL_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Emergency Contact</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-900 focus:border-indigo-500 outline-none transition-all font-bold"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Access Level (System Roles)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ROLES.map(role => (
                <div 
                  key={role} 
                  onClick={() => handleRoleToggle(role)}
                  className={`flex items-center space-x-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.roles.includes(role) 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border ${formData.roles.includes(role) ? 'bg-white border-white' : 'bg-white border-slate-300'}`}>
                     {formData.roles.includes(role) && <svg className="w-3 h-3 text-indigo-600 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                  </div>
                  <span className="text-xs font-bold truncate">{role.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button 
              type="submit"
              className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all active:scale-95"
            >
              Confirm Enrollment
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all font-black"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
