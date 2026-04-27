'use client';

import { useState, useEffect } from 'react';
import { Users, X } from 'lucide-react';
import { Toggle } from '../../_components/Toggle';
import { RangeSlider } from '../../_components/RangeSlider';
import { TimePicker } from '../../_components/TimePicker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  onSave: () => void; // Callback to refresh calendar data
}

interface DaySettings {
  maxCapacity: number;
  startTime: string;
  isOpen: boolean;
}

interface DayStats {
  totalBooked: number;
  available: number;
  percentage: number;
}

/**
 * DayDetailsModal Component
 * 
 * Modal for managing daily calendar settings
 * Features:
 * - Status card showing bookings vs capacity
 * - Open for Bookings toggle
 * - Operating Hours time picker (default 4:30 PM)
 * - Maximum Capacity slider (0-200)
 */
export function DayDetailsModal({
  isOpen,
  onClose,
  date,
  onSave,
}: DayDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<DaySettings>({
    maxCapacity: 100,
    startTime: '16:30:00',
    isOpen: true,
  });
  const [stats, setStats] = useState<DayStats>({
    totalBooked: 0,
    available: 100,
    percentage: 0,
  });

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch day details when modal opens
  useEffect(() => {
    if (!isOpen || !date) return;

    const fetchDayDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/calendar/day/${date}`);
        if (!response.ok) throw new Error('Failed to fetch day details');

        const data = await response.json();

        setSettings({
          maxCapacity: data.settings.maxCapacity ?? 100,
          startTime: data.settings.startTime ?? '16:30:00',
          isOpen: data.settings.isOpen ?? true,
        });

        setStats(data.stats);
      } catch (error) {
        console.error('[DayDetailsModal] Error:', error);
        toast.error('Failed to load day details');
      } finally {
        setLoading(false);
      }
    };

    fetchDayDetails();
  }, [isOpen, date]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    // Parse YYYY-MM-DD in local timezone
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!date) return;

    setSaving(true);
    try {
      const response = await fetch('/api/calendar/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          ...settings,
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      toast.success('Calendar settings updated');
      onSave(); // Refresh parent data
      onClose();
    } catch (error) {
      console.error('[DayDetailsModal] Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate updated available spots
  const updatedAvailable = Math.max(0, settings.maxCapacity - stats.totalBooked);
  const updatedPercentage = settings.maxCapacity > 0
    ? Math.round((stats.totalBooked / settings.maxCapacity) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-family-body text-gray-900">
              {date ? formatDate(date) : 'Day Details'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage daily operations and capacity settings
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            suppressHydrationWarning
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4 p-6">
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4 p-6">
            {/* Status Card */}
            <div className={cn(
              'p-4 rounded-lg',
              updatedPercentage >= 100 ? 'bg-red-100' : 'bg-green-100'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-3 rounded-full',
                  updatedPercentage >= 100 ? 'bg-red-100' : 'bg-green-100'
                )}>
                  <Users className={cn(
                    'h-5 w-5',
                    updatedPercentage >= 100 ? 'text-red-600' : 'text-[#2E7D32]'
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">Current Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.totalBooked} / {settings.maxCapacity}
                  </p>
                </div>
                <div className={cn(
                  'text-2xl font-bold',
                  updatedPercentage >= 100 ? 'text-red-600' : 'text-[#2E7D32]'
                )}>
                  {updatedPercentage}%
                </div>
              </div>
            </div>

            {/* Open for Bookings Toggle */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <Toggle
                checked={settings.isOpen}
                onChange={(checked) =>
                  setSettings({ ...settings, isOpen: checked })
                }
                label="Open for Bookings"
                description={settings.isOpen ? 'Accepting new bookings' : 'Bookings disabled for this date'}
              />
            </div>

            {/* Operating Hours */}
            <TimePicker
              value={settings.startTime}
              onChange={(value) =>
                setSettings({ ...settings, startTime: value })
              }
              label="Visiting Hour"
              description="Visitors can start booking from this time"
            />

            {/* Maximum Capacity Slider */}
            <RangeSlider
              value={settings.maxCapacity}
              onChange={(value) =>
                setSettings({ ...settings, maxCapacity: value })
              }
              min={0}
              max={200}
              step={10}
              label="Maximum Capacity"
              showValue={true}
              unit="visitors"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2E7D32] rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            suppressHydrationWarning
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}