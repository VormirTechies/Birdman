'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  onExpandChange?: (expanded: boolean) => void;
  /** Always keep mobile input expanded — no collapse on blur */
  alwaysExpanded?: boolean;
}

export function SearchBar({ value, onChange, placeholder = 'Search bookings...', id = 'search', name = 'search', onExpandChange, alwaysExpanded = false }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded);
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChange('');
    if (!alwaysExpanded) {
      setIsExpanded(false);
      setIsFocused(false);
      onExpandChange?.(false);
    }
  };

  return (
    <>
      {/* Desktop: Always visible full-width input */}
      <div className="hidden lg:flex items-center gap-2 bg-transparent flex-1 border-2 border-transparent transition-colors rounded-lg">
        <Search className="w-4 h-4 text-[#616161] shrink-0 -mr-12 z-10" />
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ml-4 pl-8 py-2.5 flex-1 text-sm text-[#212121] placeholder:text-[#9E9E9E] bg-[#F5F5F5] border-none outline-none rounded-lg"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
          suppressHydrationWarning
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 hover:bg-[#E0E0E0] rounded-lg transition-colors cursor-pointer z-10 -ml-10"
            aria-label="Clear search"
            suppressHydrationWarning
          >
            <X className="w-4 h-4 text-[#616161]" />
          </button>
        )}
      </div>

      {/* Mobile: Expandable input with icon inside */}
      <div className="lg:hidden relative">
        <div
          className={`flex items-center bg-[#F5F5F5] rounded-xl overflow-hidden transition-all duration-200 ${
            isFocused ? 'border-2 border-[#2E7D32]' : 'border-2 border-transparent'
          }`}
        >
          <div className="absolute left-3 pointer-events-none z-10">
            <Search className="w-5 h-5 text-[#616161]" />
          </div>
          
          <motion.input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              setIsExpanded(true);
              setIsFocused(true);
              onExpandChange?.(true);
            }}
            onBlur={() => {
              if (!value && !alwaysExpanded) {
                setIsExpanded(false);
                onExpandChange?.(false);
              }
              setIsFocused(false);
            }}
            id={`${id}-mobile`}
            name={`${name}-mobile`}
            placeholder={isExpanded ? placeholder : ''}
            initial={false}
            animate={{
              width: isExpanded ? '100%' : '44px',
              paddingLeft: isExpanded ? '40px' : '10px',
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-11 text-sm text-[#212121] placeholder:text-[#9E9E9E] bg-transparent border-none outline-none pr-2.5"
            style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            suppressHydrationWarning
          />
          
          {value && isExpanded && (
            <button
              onClick={handleClear}
              className="absolute right-2 p-1 hover:bg-[#E0E0E0] rounded-lg transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-[#616161]" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
