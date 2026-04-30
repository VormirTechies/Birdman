'use client';

import { AnimatePresence } from 'framer-motion';
import { VisitorChecklistItem, type ChecklistVisitor } from './VisitorChecklistItem';

interface VisitorChecklistListProps {
  visitors: ChecklistVisitor[];
  updatingId: string | null;
  onToggle: (id: string, visited: boolean) => void;
}

export function VisitorChecklistList({
  visitors,
  updatingId,
  onToggle,
}: VisitorChecklistListProps) {
  if (visitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p
          className="text-[#9E9E9E] text-sm"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          No visitors booked for this date.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {visitors.map((visitor) => (
          <VisitorChecklistItem
            key={visitor.id}
            visitor={visitor}
            onToggle={onToggle}
            isUpdating={updatingId === visitor.id}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
