'use client';

import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string; // HH:MM:SS format
  onChange: (value: string) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Custom Time Picker Component
 * 
 * A reusable time picker matching the design system
 * Used for operating hours selection in calendar settings
 */
export function TimePicker({
  value,
  onChange,
  label,
  description,
  disabled = false,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Generate time options (8 AM to 8 PM in 30-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 13; hour <= 20; hour++) {
      for (const minute of [0, 30]) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const displayTime = new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        times.push({ value: timeStr, label: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Format display value
  const displayValue = timeOptions.find(t => t.value === value)?.label || 'Select time';

  // Handle dropdown open with position calculation
  const handleToggleDropdown = () => {
    if (disabled) return;
    
    if (!isOpen && buttonRef.current) {
      // Calculate position before opening
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 240; // max-h-60 = 240px
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      // If not enough space below but more space above, show dropdown on top
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedOption = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen]);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="text-sm font-semibold text-gray-900">
          {label}
        </label>
      )}

      {/* Dropdown Trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={handleToggleDropdown}
          className={cn(
            'flex items-center justify-between w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg transition-colors',
            'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E7D32] focus:border-[#2E7D32]',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            isOpen && 'border-[#2E7D32] ring-2 ring-[#2E7D32]'
          )}
          suppressHydrationWarning
        >
          <span className="text-gray-900">{displayValue}</span>
          <Clock className="h-4 w-4 text-gray-500" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div 
            className={cn(
              "absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto",
              dropdownPosition === 'bottom' ? 'mt-2' : 'mb-2 bottom-full'
            )}
          >
            {timeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                data-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-4 py-2.5 text-sm text-left transition-colors',
                  'hover:bg-[#E8F5E9] focus:outline-none focus:bg-[#E8F5E9]',
                  option.value === value
                    ? 'bg-[#E8F5E9] text-[#2E7D32] font-medium'
                    : 'text-gray-900'
                )}
                suppressHydrationWarning
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
}
