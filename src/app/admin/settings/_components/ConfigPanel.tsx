'use client';

import { Sliders, AlertTriangle } from 'lucide-react';
import { TimePicker } from '../../_components/TimePicker';
import { RangeSlider } from '../../_components/RangeSlider';
import { Toggle } from '../../_components/Toggle';
import type { CalendarSettings } from '../page';

interface ConfigPanelProps {
  settings: CalendarSettings;
  setSettings: (settings: CalendarSettings) => void;
  isLoading?: boolean;
}

export function ConfigPanel({ settings, setSettings, isLoading }: ConfigPanelProps) {
  const handleChange = (key: keyof CalendarSettings, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg border border-[#E0E0E0] p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Sliders className="w-5 h-5 text-[#2E7D32]" />
        <h2 className="text-lg font-semibold text-[#212121]">Configuration</h2>
        {isLoading && (
          <span className="ml-auto text-sm text-gray-500 animate-pulse">
            Loading settings...
          </span>
        )}
      </div>

      {/* Open for Bookings Toggle */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <Toggle
          checked={settings.isOpen !== false}
          onChange={(checked) => handleChange('isOpen', checked)}
          label="Open for Bookings"
          description={
            settings.isOpen !== false
              ? 'Accepting new bookings'
              : 'Bookings disabled for selected dates'
          }
        />
      </div>

      {settings.isOpen === false && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
          <p className="text-sm text-red-900">
            <strong>Warning:</strong> Existing bookings for blocked dates will be automatically cancelled, and visitors will be notified via email.
          </p>
        </div>
      )}

      {/* Operating Hours */}
      <TimePicker
        value={settings.startTime ?? '16:00:00'}
        onChange={(value) => handleChange('startTime', value)}
        label="Visiting Hour"
        description="Visitors can start booking from this time"
      />

      {/* Maximum Capacity Slider */}
      <RangeSlider
        value={settings.maxCapacity ?? 100}
        onChange={(value) => handleChange('maxCapacity', value)}
        min={0}
        max={200}
        step={10}
        label="Maximum Capacity"
        showValue={true}
        unit="visitors"
      />

      {/* Clear All Button */}
      <div className="pt-4 border-t border-[#E0E0E0]">
        <button
          onClick={() =>
            setSettings({
              maxCapacity: undefined,
              startTime: undefined,
              isOpen: undefined,
            })
          }
          className="text-sm text-[#616161] hover:text-[#212121] underline"
        >
          Clear all settings
        </button>
      </div>
    </div>
  );
}
