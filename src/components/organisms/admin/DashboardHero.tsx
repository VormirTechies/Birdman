'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  CalendarDays, 
  Clock, 
  CheckCircle2,
  Phone,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroStats {
  todayGuests: number;
  upcomingGuests: number;
  monthGuests: number;
  visitedToday: number;
}

interface Arrival {
  id: string;
  name: string;
  time: string;
  guests: number;
  phone: string;
  status: 'pending' | 'visited';
}

const mockArrivals: Arrival[] = [
  { id: '1', name: 'Senthil Kumar', time: '4:30 PM', guests: 4, phone: '98401 23456', status: 'pending' },
  { id: '2', name: 'Meenakshi Iyer', time: '4:45 PM', guests: 2, phone: '98842 11223', status: 'visited' },
  { id: '3', name: 'Rahul Dravid', time: '5:00 PM', guests: 6, phone: '90031 55667', status: 'pending' },
];

export function DashboardHero({ stats }: { stats: HeroStats }) {
  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* ── STATS CAROUSEL (SOFT BRANDED) ─────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 flex flex-wrap gap-4 md:gap-6">
          {[
            { label: 'Live Pax', value: stats.todayGuests, icon: Users, color: 'text-sanctuary-green', bg: 'bg-sanctuary-green/10' },
            { label: 'Upcoming', value: stats.upcomingGuests, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Cycle Count', value: stats.monthGuests, icon: LayoutDashboard, color: 'text-sanctuary-green', bg: 'bg-sanctuary-green/10' },
            { label: 'Safe Return', value: stats.visitedToday, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, i) => (
            <motion.div 
               key={stat.label}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.05, ease: "easeOut" }}
               className="bg-white px-6 py-5 rounded-[2rem] border border-black/[0.02] shadow-xl shadow-black/[0.01] min-w-[160px] flex-1 relative overflow-hidden group hover:shadow-black/[0.03] transition-all"
            >
               <div className="absolute inset-0 bg-zinc-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="flex items-center justify-between mb-4 relative">
                 <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 leading-none">{stat.label}</p>
                 <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shadow-sm", stat.bg)}>
                    <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                 </div>
               </div>
               <p className="text-3xl font-black text-zinc-900 tracking-tighter tabular-nums relative leading-none">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── REGISTRY INSIGHT (SIMPLIFIED FOR OVERVIEW) ────────────────────── */}
      <div className="bg-white rounded-[3rem] border border-black/[0.02] shadow-2xl shadow-black/[0.02] overflow-hidden">
        <div className="p-8 md:p-10 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/10">
           <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight mb-1">Immediate Inflow</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Awaiting Sanctuary Entry</p>
           </div>
           <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
           </div>
        </div>

        <div className="divide-y divide-zinc-50">
          {mockArrivals.map((arrival) => (
            <div key={arrival.id} className="p-6 md:px-10 flex items-center gap-6 group hover:bg-zinc-50/50 transition-colors">
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-sm",
                arrival.status === 'visited' ? 'bg-sanctuary-green text-white' : 'bg-amber-500 text-white'
              )}>
                <Users className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-base font-black text-zinc-900 tracking-tight truncate">{arrival.name}</p>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg",
                    arrival.status === 'visited' ? "bg-sanctuary-green/10 text-sanctuary-green" : "bg-amber-50 text-amber-600"
                  )}>
                    {arrival.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {arrival.time}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-3 h-3" /> {arrival.guests} Pax
                  </p>
                </div>
              </div>

              <a 
                href={`tel:${arrival.phone}`}
                className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center hover:bg-sanctuary-green hover:text-white transition-all active:scale-90 shadow-sm"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
