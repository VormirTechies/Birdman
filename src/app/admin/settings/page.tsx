'use client';

import { ShieldCheck, Calendar, User, Bell, Clock, Users, Loader2, LogOut } from 'lucide-react';
import { AdminSecurity } from '@/components/organisms/AdminSecurity';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'security' | 'schedule'>('schedule');
  const [slotTime, setSlotTime] = useState('');
  const [maxGuests, setMaxGuests] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setSlotTime(data.config.default_slot_time || '16:30');
          setMaxGuests(data.config.default_max_guests || '100');
        }
      })
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await Promise.all([
        fetch('/api/admin/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'default_slot_time', value: slotTime }) }),
        fetch('/api/admin/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'default_max_guests', value: maxGuests }) })
      ]);
      toast.success('Settings updated successfully');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-black text-zinc-900 mb-2 tracking-tight">Configuration</h1>
        <p className="text-zinc-400 font-bold text-sm uppercase tracking-wider">System defaults & secure workspace access</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <nav className="flex flex-col gap-1.5 sticky top-32">
             <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-3 px-5 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === 'schedule' ? 'text-sanctuary-green bg-sanctuary-green/10 shadow-sm' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}>
                <Calendar className="w-5 h-5" />
                Capacity Control
             </button>
             <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-5 py-4 text-sm font-bold rounded-2xl transition-all ${activeTab === 'security' ? 'text-sanctuary-green bg-sanctuary-green/10 shadow-sm' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}>
                <ShieldCheck className="w-5 h-5" />
                Access Keys
             </button>
             <div className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-zinc-300 cursor-not-allowed grayscale">
                <User className="w-5 h-5" />
                Profile Info
             </div>
             <div className="flex items-center gap-3 px-5 py-4 text-sm font-bold text-zinc-300 cursor-not-allowed grayscale">
                <Bell className="w-5 h-5" />
                Alert System
             </div>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeTab === 'schedule' && (
             <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/[0.01] p-8 md:p-10">
                <div className="flex items-center gap-5 mb-10">
                   <div className="w-14 h-14 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-lg">
                       <Calendar className="w-7 h-7 text-white" />
                   </div>
                   <div>
                       <h2 className="text-xl font-black text-zinc-900 tracking-tight">Capacity Control</h2>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Operational defaults</p>
                   </div>
                </div>
                
                {loadingConfig ? (
                   <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-sanctuary-green" /></div>
                ) : (
                   <div className="space-y-8">
                      <div className="space-y-2">
                         <label className="block text-sm font-black text-zinc-900 tracking-tight">Session Timing</label>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Default arrival window</p>
                         <div className="relative pt-2">
                            <Clock className="absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input 
                               type="time" 
                               value={slotTime} 
                               onChange={e => setSlotTime(e.target.value)} 
                               className="w-full text-base font-bold bg-zinc-50 border border-black/5 rounded-2xl px-12 py-4 outline-none focus:bg-white focus:border-sanctuary-green/30 focus:ring-2 focus:ring-sanctuary-green/10 transition-all font-sans"
                            />
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                         <label className="block text-sm font-black text-zinc-900 tracking-tight">Daily Threshold</label>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Maximum daily guest capacity</p>
                         <div className="relative pt-2">
                            <Users className="absolute left-4 top-[calc(50%+4px)] -translate-y-1/2 w-4 h-4 text-zinc-300" />
                            <input 
                               type="number" 
                               min="1"
                               value={maxGuests} 
                               onChange={e => setMaxGuests(e.target.value)} 
                               className="w-full text-base font-bold bg-zinc-50 border border-black/5 rounded-2xl px-12 py-4 outline-none focus:bg-white focus:border-sanctuary-green/30 focus:ring-2 focus:ring-sanctuary-green/10 transition-all font-sans"
                            />
                         </div>
                      </div>

                      <div className="pt-6 mt-10 border-t border-black/5 flex justify-end">
                         <Button onClick={handleSaveConfig} disabled={savingConfig || !slotTime || !maxGuests} className="bg-sanctuary-green hover:bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest h-14 px-10 shadow-xl shadow-sanctuary-green/10 transition-all active:scale-95 text-xs">
                            {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Parameters'}
                         </Button>
                      </div>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'security' && (
             <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-2xl shadow-zinc-900/[0.02] p-8 md:p-10">
                <div className="flex items-center gap-5 mb-10">
                   <div className="w-14 h-14 bg-zinc-900 rounded-3xl flex items-center justify-center shadow-lg">
                       <ShieldCheck className="w-7 h-7 text-white" />
                   </div>
                   <div>
                       <h2 className="text-xl font-black text-zinc-900 tracking-tight">Access Control</h2>
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Security & credentials</p>
                   </div>
                </div>

                <AdminSecurity isOpen={true} onClose={() => {}} isEmbed={true} />
             </div>
          )}

          {/* ── LOGOUT SECTION ────────────────────────────────────────────── */}
          <div className="mt-8 bg-zinc-900 rounded-[2.5rem] p-8 md:p-10 text-white border border-zinc-800 shadow-2xl shadow-zinc-900/20">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                      <LogOut className="w-6 h-6 text-red-400" /> Termination
                   </h2>
                   <p className="text-sm text-zinc-400 font-medium mt-1">Safely end your current administrative session.</p>
                </div>
                <Button onClick={async () => {
                   const { createClient } = await import('@/lib/supabase/client');
                   const supabase = createClient();
                   await supabase.auth.signOut();
                   window.location.href = '/admin/login';
                }} className="bg-white hover:bg-red-50 text-zinc-900 rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg">
                   Sign Out Now
                </Button>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
