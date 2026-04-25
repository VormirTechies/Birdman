'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Public types ────────────────────────────────────────────────────────────

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** 'danger' renders the item in red (e.g. Delete) */
  variant?: 'default' | 'danger';
}

export interface ActionGroup {
  /** Optional uppercase section label, e.g. "MANAGE" */
  label?: string;
  items: ActionItem[];
}

interface ActionsMenuProps {
  groups: ActionGroup[];
  /** Label shown on the built-in trigger button */
  triggerLabel?: string;
  /**
   * Pass an external element ref to use as the menu trigger.
   * When provided, the built-in "Actions" button is NOT rendered —
   * clicking the ref'd element opens/closes the menu instead.
   */
  triggerRef?: RefObject<HTMLElement | null>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ActionsMenu({
  groups,
  triggerLabel = 'Actions',
  triggerRef,
}: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const internalTriggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // The active trigger is either the external ref or the built-in button
  const activeTriggerRef = (triggerRef ?? internalTriggerRef) as RefObject<HTMLElement | null>;

  // Portal needs document (client-only)
  useEffect(() => setMounted(true), []);

  // ── Position helpers ───────────────────────────────────────────────────────

  const calculatePosition = useCallback(() => {
    const trigger = activeTriggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 224; // w-56
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 8) {
      left = rect.right - menuWidth;
    }
    setPosition({ top: rect.bottom + 8, left: Math.max(8, left) });
  }, [activeTriggerRef]);

  // ── Open / close ──────────────────────────────────────────────────────────

  const openMenu = useCallback(() => {
    calculatePosition();
    setIsOpen(true);
  }, [calculatePosition]);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  const toggleMenu = useCallback(() => {
    if (isOpen) closeMenu();
    else openMenu();
  }, [isOpen, openMenu, closeMenu]);

  // ── Attach click to external trigger ref ─────────────────────────────────

  useEffect(() => {
    if (!triggerRef?.current) return;
    const el = triggerRef.current;
    el.addEventListener('click', toggleMenu);
    return () => el.removeEventListener('click', toggleMenu);
  }, [triggerRef, toggleMenu]);

  // ── Outside-click to close ────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (activeTriggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, closeMenu, activeTriggerRef]);

  // ── Escape to close ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, closeMenu]);

  // ── Reposition on scroll / resize ─────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, calculatePosition]);

  // ── Item click handler ────────────────────────────────────────────────────

  const handleItemClick = (item: ActionItem) => {
    closeMenu();
    item.onClick();
  };

  // ── Dropdown portal ───────────────────────────────────────────────────────

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ top: position.top, left: position.left }}
          className="fixed z-50 w-56 bg-white rounded-2xl shadow-xl border border-[#E0E0E0] overflow-hidden"
        >
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="h-px bg-[#E0E0E0]" />}
              <div className="py-2">
                {group.label && (
                  <p className="px-4 pt-1 pb-1.5 text-xs font-semibold tracking-widest text-[#616161] uppercase">
                    {group.label}
                  </p>
                )}
                {group.items.map((item, ii) => (
                  <button
                    key={ii}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left',
                      item.variant === 'danger'
                        ? 'text-[#ba1a1a] hover:bg-[#ffdad6]'
                        : 'text-[#212121] hover:bg-[#F5F5F5]',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'w-4 h-4 shrink-0',
                        item.variant === 'danger'
                          ? 'text-[#ba1a1a]'
                          : 'text-[#2E7D32]',
                      )}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Built-in trigger — only rendered when no external triggerRef */}
      {!triggerRef && (
        <button
          ref={internalTriggerRef}
          onClick={toggleMenu}
          className="inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] active:bg-[#1B5E20] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-11 select-none"
        >
          {triggerLabel}
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      )}

      {/* Portal-rendered dropdown */}
      {mounted && createPortal(dropdown, document.body)}
    </>
  );
}
