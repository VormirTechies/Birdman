'use client';

import { Users } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ChecklistVisitor {
  id: string;
  visitorName: string;
  phone: string;
  visited: boolean;
  adults: number;
  children: number;
  numberOfGuests: number; // Deprecated, kept for backward compatibility
}

interface VisitorChecklistItemProps {
  visitor: ChecklistVisitor;
  onToggle: (id: string, visited: boolean) => void;
  isUpdating: boolean;
}

const AVATAR_COLORS = [
  { bg: '#C8E6C9', text: '#2E7D32' },
  { bg: '#FFE0B2', text: '#E65100' },
  { bg: '#F8BBD0', text: '#C2185B' },
  { bg: '#BBDEFB', text: '#1976D2' },
  { bg: '#E1BEE7', text: '#7B1FA2' },
  { bg: '#FFF9C4', text: '#F57F17' },
  { bg: '#B2EBF2', text: '#00838F' },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function VisitorChecklistItem({
  visitor,
  onToggle,
  isUpdating,
}: VisitorChecklistItemProps) {
  const colors = getAvatarColor(visitor.visitorName);
  const initials = getInitials(visitor.visitorName);

  return (
    <motion.div
      layout
      layoutId={visitor.id}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#F0F0F0] shadow-sm"
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 select-none"
        style={{
          background: colors.bg,
          color: colors.text,
          fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)',
        }}
      >
        {initials}
      </div>

      {/* Name & Phone */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold text-[#212121] truncate"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          {visitor.visitorName}
        </p>
        <p
          className="text-xs text-[#757575] mt-0.5"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          {visitor.phone}
        </p>
        <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[#E8F5E9]">
          <Users className="w-3 h-3 text-[#2E7D32]" />
          <span
            className="text-xs font-semibold text-[#2E7D32]"
            style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
          >
            {visitor.children > 0 
              ? `${visitor.adults}A / ${visitor.children}C`
              : `${visitor.adults} ${visitor.adults === 1 ? 'adult' : 'adults'}`
            }
          </span>
        </div>
      </div>

      {/* Visited toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-xs font-medium text-[#757575] hidden lg:inline"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          Visited
        </span>
        <button
          role="switch"
          aria-checked={visitor.visited}
          aria-label={`Mark ${visitor.visitorName} as ${visitor.visited ? 'not visited' : 'visited'}`}
          disabled={isUpdating}
          onClick={() => onToggle(visitor.id, !visitor.visited)}
          className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: visitor.visited ? '#2E7D32' : '#D1D5DB' }}
        >
          <span
            className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{ transform: visitor.visited ? 'translateX(22px)' : 'translateX(4px)' }}
          />
        </button>
      </div>
    </motion.div>
  );
}
