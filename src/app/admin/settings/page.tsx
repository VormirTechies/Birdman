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
        <h1 className="text-2xl md:text-3xl font-display font-bold text-canopy-dark mb-2">Workspace Settings</h1>
        <p className="text-canopy-dark/50">Manage workspace defaults and security credentials.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <nav className="flex flex-col gap-1 sticky top-32">
             <button onClick={() => setActiveTab('schedule')} className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'schedule' ? 'text-sanctuary-green bg-sanctuary-green/5 border border-sanctuary-green/10' : 'text-canopy-dark/40 hover:text-canopy-dark hover:bg-canopy-dark/5'}`}>
                <Calendar className="w-5 h-5" />
                Schedule & Capacity
             </button>
             <button onClick={() => setActiveTab('security')} className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'security' ? 'text-sanctuary-green bg-sanctuary-green/5 border border-sanctuary-green/10' : 'text-canopy-dark/40 hover:text-canopy-dark hover:bg-canopy-dark/5'}`}>
                <ShieldCheck className="w-5 h-5" />
                Security & Access
             </button>
             <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-canopy-dark/40 cursor-not-allowed">
                <User className="w-5 h-5" />
                Profile Info
             </div>
             <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-canopy-dark/40 cursor-not-allowed">
                <Bell className="w-5 h-5" />
                Notifications
             </div>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeTab === 'schedule' && (
             <div className="bg-white rounded-3xl border border-canopy-dark/5 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center">
                       <Calendar className="w-7 h-7 text-sanctuary-green" />
                   </div>
                   <div>
                       <h2 className="text-xl font-bold text-canopy-dark">Schedule & Capacity</h2>
                       <p className="text-sm text-canopy-dark/40">Set global defaults for bookings</p>
                   </div>
                </div>
                
                {loadingConfig ? (
                   <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-sanctuary-green" /></div>
                ) : (
                   <div className="space-y-6">
                      <div>
                         <label className="block text-sm font-bold text-canopy-dark mb-2">Default Session Time</label>
                         <p className="text-xs text-canopy-dark/40 mb-3">The default arrival time shown for all available dates.</p>
                         <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
                            <input 
                               type="time" 
                               value={slotTime} 
                               onChange={e => setSlotTime(e.target.value)} 
                               className="w-full text-base border border-canopy-dark/10 rounded-xl px-10 py-3 outline-none focus:border-sanctuary-green/50 focus:ring-2 focus:ring-sanctuary-green/30"
                            />
                         </div>
                      </div>
                      
                      <div>
                         <label className="block text-sm font-bold text-canopy-dark mb-2">Default Daily Capacity</label>
                         <p className="text-xs text-canopy-dark/40 mb-3">Maximum total visitors allowed per day before showing fully booked.</p>
                         <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
                            <input 
                               type="number" 
                               min="1"
                               value={maxGuests} 
                               onChange={e => setMaxGuests(e.target.value)} 
                               className="w-full text-base border border-canopy-dark/10 rounded-xl px-10 py-3 outline-none focus:border-sanctuary-green/50 focus:ring-2 focus:ring-sanctuary-green/30"
                            />
                         </div>
                      </div>

                      <div className="pt-4 mt-8 border-t border-canopy-dark/5 flex justify-end">
                         <Button onClick={handleSaveConfig} disabled={savingConfig || !slotTime || !maxGuests} className="bg-sanctuary-green hover:bg-sanctuary-green/90 text-white rounded-xl h-11 px-8">
                            {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Settings'}
                         </Button>
                      </div>
                   </div>
                )}
             </div>
          )}

          {activeTab === 'security' && (
             <div className="bg-white rounded-3xl border border-canopy-dark/5 shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center">
                       <ShieldCheck className="w-7 h-7 text-sanctuary-green" />
                   </div>
                   <div>
                       <h2 className="text-xl font-bold text-canopy-dark">Security Settings</h2>
                       <p className="text-sm text-canopy-dark/40">Credential management with OTP verification</p>
                   </div>
                </div>

                <AdminSecurity isOpen={true} onClose={() => {}} isEmbed={true} />
             </div>
          )}

          {/* ── LOGOUT SECTION ────────────────────────────────────────────── */}
          <div className="mt-8 bg-white rounded-3xl border border-red-500/10 shadow-sm p-6 md:p-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h2 className="text-xl font-bold text-canopy-dark flex items-center gap-2">
                      <LogOut className="w-5 h-5 text-red-500" /> Sign Out
                   </h2>
                   <p className="text-sm text-canopy-dark/40 mt-1">Safely end your current administrative session.</p>
                </div>
                <Button onClick={async () => {
                   const { createClient } = await import('@/lib/supabase/client');
                   const supabase = createClient();
                   await supabase.auth.signOut();
                   window.location.href = '/admin/login';
                }} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold">
                   Sign Out Now
                </Button>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
