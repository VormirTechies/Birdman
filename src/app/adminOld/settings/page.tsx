'use client';

import { ShieldCheck, Mail, Lock, User, Bell } from 'lucide-react';
import { AdminSecurity } from '@/components/organisms/AdminSecurity';

export default function AdminSettingsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Account Settings</h1>
        <p className="text-canopy-dark/50">Manage your administrative credentials and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <nav className="flex flex-col gap-1 sticky top-32">
             <div className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-sanctuary-green bg-sanctuary-green/5 rounded-xl border border-sanctuary-green/10">
                <ShieldCheck className="w-5 h-5" />
                Security & Access
             </div>
             <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-canopy-dark/40 hover:text-canopy-dark hover:bg-canopy-dark/5 rounded-xl transition-colors cursor-not-allowed">
                <User className="w-5 h-5" />
                Profile Info
             </div>
             <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-canopy-dark/40 hover:text-canopy-dark hover:bg-canopy-dark/5 rounded-xl transition-colors cursor-not-allowed">
                <Bell className="w-5 h-5" />
                Notifications
             </div>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-canopy-dark/5 shadow-sm p-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-sanctuary-green/10 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-sanctuary-green" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-canopy-dark">Security Settings</h2>
                    <p className="text-sm text-canopy-dark/40">Credential management with OTP verification</p>
                </div>
             </div>

             <AdminSecurity 
                isOpen={true} 
                onClose={() => {}} 
                isEmbed={true} // Adding this prop for embedded mode
             />
          </div>
          
          <div className="bg-white/40 border border-dashed border-canopy-dark/10 rounded-3xl p-8 text-center text-sm text-canopy-dark/30">
            <ShieldCheck className="w-8 h-8 mx-auto mb-4 opacity-10" />
            <p>Advanced security features like Two-Factor (2FA) and Login History are scheduled for Phase 4 deployment.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
