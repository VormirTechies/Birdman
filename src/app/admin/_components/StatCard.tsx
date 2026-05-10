'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatValue(n: number): string {
  if (n >= 1_000_000_000_000) return `${+(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${+(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${+(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend: string;
  /** true = positive (green), false = negative (red), null = neutral (grey) */
  trendUp: boolean | null;
  iconBg: string;
  iconColor: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className="w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-3 h-3 md:w-5 md:h-5" style={{ color: iconColor }} />
        </div>
        <span
          className={cn(
            'text-[10px] md:text-xs font-semibold px-2 py-1 rounded-full',
            trendUp === true && 'bg-[#E8F5E9] text-[#2E7D32]',
            trendUp === false && 'bg-[#ffdad6] text-[#ba1a1a]',
            trendUp === null && 'bg-[#F5F5F5] text-[#616161]',
          )}
        >
          {trend}
        </span>
      </div>
      <div>
        <p className="text-xs md:text-sm text-[#616161] font-semibold">{label}</p>
        <p
          className="text-2xl md:text-3xl font-bold text-[#212121] mt-0.5"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          {formatValue(value)}
        </p>
      </div>
    </div>
  );
}
