'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Info } from 'lucide-react';
import { ApplyModeSelector } from './_components/ApplyModeSelector';
import { ConfigPanel } from './_components/ConfigPanel';
import { PreviewModal } from './_components/PreviewModal';
import { createClient } from '@/lib/supabase/client';

export type ApplyMode = 'all_days' | 'one_day' | 'date_range';

export interface CalendarSettings {
  maxCapacity?: number;
  startTime?: string;
  isOpen?: boolean;
}

export interface PreviewData {
  affectedDatesCount: number;
  affectedDates: string[];
  existingBookingsCount: number;
  bookingsByDate: { date: string; count: number }[];
  sampleCurrentSettings: Array<{
    date: string;
    maxCapacity: number | null;
    startTime: string | null;
    isOpen: boolean;
  }>;
  willBlock: boolean;
}

export default function SettingsPage() {
  const [applyMode, setApplyMode] = useState<ApplyMode>('all_days');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [settings, setSettings] = useState<CalendarSettings>({
    maxCapacity: 100,
    startTime: '16:30:00',
    isOpen: true,
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  // Get admin user ID on mount
  useEffect(() => {
    const getAdminId = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Use Supabase user ID directly for tracking
          setAdminId(user.id);
        }
      } catch (error) {
        console.error('[Settings] Error getting admin ID:', error);
      }
    };

    getAdminId();
  }, []);

  // Fetch current settings for selected date (one_day mode)
  useEffect(() => {
    const fetchDateSettings = async () => {
      if (applyMode !== 'one_day' || !selectedDate) {
        return;
      }

      setIsLoadingSettings(true);

      try {
        const response = await fetch(`/api/calendar/day/${selectedDate}`);
        
        if (!response.ok) {
          console.error('[Settings] Failed to fetch date settings');
          return;
        }

        const data = await response.json();
        
        if (data.success && data.settings) {
          // Update form with current settings from DB
          setSettings({
            maxCapacity: data.settings.maxCapacity,
            startTime: data.settings.startTime,
            isOpen: data.settings.isOpen,
          });
          
          // Show toast notification
          toast.info('Loaded current settings for selected date', { duration: 2000 });
        }
      } catch (error) {
        console.error('[Settings] Error fetching date settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchDateSettings();
  }, [selectedDate, applyMode]);

  const handlePreview = async () => {
    if (!validateInputs()) return;

    setIsLoadingPreview(true);

    try {
      const payload: any = {
        applyMode,
        settings,
      };

      if (applyMode === 'one_day' && selectedDate) {
        payload.date = selectedDate;
      } else if (applyMode === 'date_range' && startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      const response = await fetch('/api/admin/settings/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to load preview');
        return;
      }

      setPreviewData(data);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('[Settings] Preview error:', error);
      toast.error('Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmApply = async () => {
    if (!adminId) {
      toast.error('Admin user not found. Please log in again.');
      return;
    }

    setIsApplying(true);

    try {
      const payload: any = {
        applyMode,
        settings,
        adminId,
      };

      if (applyMode === 'one_day' && selectedDate) {
        payload.date = selectedDate;
      } else if (applyMode === 'date_range' && startDate && endDate) {
        payload.startDate = startDate;
        payload.endDate = endDate;
      }

      const response = await fetch('/api/admin/settings/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to apply settings');
        return;
      }

      // Show success message with details
      const { affectedCount, cancelledBookingsCount, emailsSent, emailsFailed } = data;
      
      let successMessage = `Updated ${affectedCount} date(s)`;
      if (cancelledBookingsCount > 0) {
        successMessage += `\nCancelled ${cancelledBookingsCount} booking(s)`;
        successMessage += `\nSent ${emailsSent} email(s)`;
        if (emailsFailed > 0) {
          successMessage += `\n${emailsFailed} email(s) failed to send`;
        }
      }

      toast.success(successMessage, { duration: 5000 });

      // Close modal
      setIsPreviewOpen(false);
      setPreviewData(null);
    } catch (error) {
      console.error('[Settings] Apply error:', error);
      toast.error('Failed to apply settings');
    } finally {
      setIsApplying(false);
    }
  };

  const validateInputs = (): boolean => {
    if (applyMode === 'one_day' && !selectedDate) {
      toast.error('Please select a date');
      return false;
    }

    if (applyMode === 'date_range') {
      if (!startDate || !endDate) {
        toast.error('Please select start and end dates');
        return false;
      }
      if (startDate > endDate) {
        toast.error('Start date must be before end date');
        return false;
      }
    }

    // Validate at least one setting is provided
    if (
      settings.maxCapacity === undefined &&
      settings.startTime === undefined &&
      settings.isOpen === undefined
    ) {
      toast.error('Please configure at least one setting');
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" suppressHydrationWarning>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-family-body text-[#212121]">Calendar Settings</h1>
        <p className="text-sm text-[#9E9E9E] mt-0.5">
          Configure{' '}
          <span className="text-[#2E7D32] font-medium">capacity, timings,</span>
          {' '}and availability
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Preview Before Applying</p>
          <p className="text-blue-700">
            All changes will be previewed before applying. If you block dates, existing bookings will be automatically cancelled and visitors will be notified via email.
          </p>
        </div>
      </div>

      {/* Apply Mode Selector */}
      <ApplyModeSelector
        applyMode={applyMode}
        setApplyMode={setApplyMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />

      {/* Configuration Panel */}
      <ConfigPanel 
        settings={settings} 
        setSettings={setSettings} 
        isLoading={isLoadingSettings}
      />

      {/* Preview Button */}
      <div className="flex justify-end pb-16">
        <button
          onClick={handlePreview}
          disabled={isLoadingPreview}
          className="px-6 py-3 bg-[#2E7D32] text-white rounded-lg font-medium hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoadingPreview ? 'Loading...' : 'Preview Changes'}
        </button>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewData(null);
          }}
          previewData={previewData}
          onConfirm={handleConfirmApply}
          isApplying={isApplying}
          applyMode={applyMode}
          settings={settings}
        />
      )}
    </div>
  );
}
