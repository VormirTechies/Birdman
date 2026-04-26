'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  // Generate time options (8 AM to 8 PM in 30-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute of [0, 30]) {
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
    const date = new Date(dateStr + 'T00:00:00');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" suppressHydrationWarning>
        <DialogHeader>
          <DialogTitle>
            {date ? formatDate(date) : 'Day Details'}
          </DialogTitle>
          <DialogDescription>
            Manage daily operations and capacity settings
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-6">
            <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Status Card */}
            <div className={cn(
              'p-4 rounded-lg border-2',
              updatedPercentage >= 100 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-3 rounded-full',
                  updatedPercentage >= 100 ? 'bg-red-100' : 'bg-blue-100'
                )}>
                  <Users className={cn(
                    'h-6 w-6',
                    updatedPercentage >= 100 ? 'text-red-600' : 'text-blue-600'
                  )} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalBooked} / {settings.maxCapacity}
                  </p>
                  <p className="text-xs text-gray-500">
                    {updatedAvailable} spots available
                  </p>
                </div>
                <div className={cn(
                  'text-3xl font-bold',
                  updatedPercentage >= 100 ? 'text-red-600' : 'text-blue-600'
                )}>
                  {updatedPercentage}%
                </div>
              </div>
            </div>

            {/* Open for Bookings Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">Open for Bookings</h4>
                <p className="text-sm text-gray-500">
                  {settings.isOpen ? 'Accepting new bookings' : 'Bookings disabled for this date'}
                </p>
              </div>
              <Switch
                checked={settings.isOpen}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, isOpen: checked })
                }
                suppressHydrationWarning
              />
            </div>

            {/* Operating Hours */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">
                Operating Hours
              </label>
              <Select
                value={settings.startTime}
                onValueChange={(value) =>
                  setSettings({ ...settings, startTime: value })
                }
              >
                <SelectTrigger suppressHydrationWarning>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Visitors can start booking from this time
              </p>
            </div>

            {/* Maximum Capacity Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  Maximum Capacity
                </label>
                <span className="text-sm font-bold text-blue-600">
                  {settings.maxCapacity} visitors
                </span>
              </div>
              <Slider
                value={[settings.maxCapacity]}
                onValueChange={([value]) =>
                  setSettings({ ...settings, maxCapacity: value })
                }
                min={0}
                max={200}
                step={10}
                className="w-full"
                suppressHydrationWarning
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>100</span>
                <span>200</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            suppressHydrationWarning
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || saving}
            suppressHydrationWarning
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
