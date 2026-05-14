'use client';

import { X, AlertTriangle, Calendar, Users, Clock, Eye, EyeOff, Mail } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import type { PreviewData, ApplyMode, CalendarSettings } from '../page';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: PreviewData;
  onConfirm: () => void;
  isApplying: boolean;
  applyMode: ApplyMode;
  settings: CalendarSettings;
}

export function PreviewModal({
  isOpen,
  onClose,
  previewData,
  onConfirm,
  isApplying,
  applyMode,
  settings,
}: PreviewModalProps) {
  const {
    affectedDatesCount,
    affectedDates,
    existingBookingsCount,
    bookingsByDate,
    sampleCurrentSettings,
    willBlock,
  } = previewData;

  const getModeLabel = () => {
    switch (applyMode) {
      case 'all_days':
        return 'All Days';
      case 'one_day':
        return 'One Day';
      case 'date_range':
        return 'Date Range';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E0E0E0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#212121]">Preview Changes</h2>
                <p className="text-sm text-[#616161]">Review before applying</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isApplying}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-[#616161]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Warning Banner for Blocked Dates */}
            {willBlock && existingBookingsCount > 0 && (
              <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-[#ba1a1a] mb-1">
                    {existingBookingsCount} Booking(s) Will Be Cancelled
                  </p>
                  <p className="text-red-800">
                    These bookings will be automatically cancelled and visitors will be notified via email about the cancellation.
                  </p>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F5F5] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#616161]" />
                  <span className="text-sm font-medium text-[#616161]">Apply Mode</span>
                </div>
                <div className="text-2xl font-bold text-[#212121]">{getModeLabel()}</div>
              </div>

              <div className="p-4 bg-[#F5F5F5] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-[#616161]" />
                  <span className="text-sm font-medium text-[#616161]">Affected Dates</span>
                </div>
                <div className="text-2xl font-bold text-[#212121]">
                  {affectedDatesCount} {affectedDatesCount === 1 ? 'Date' : 'Dates'}
                </div>
              </div>

              {existingBookingsCount > 0 && (
                <>
                  <div className="p-4 bg-[#FFF3E0] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-[#E65100]" />
                      <span className="text-sm font-medium text-[#E65100]">Existing Bookings</span>
                    </div>
                    <div className="text-2xl font-bold text-[#E65100]">
                      {existingBookingsCount}
                    </div>
                  </div>

                  {willBlock && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-[#ba1a1a]" />
                        <span className="text-sm font-medium text-[#ba1a1a]">Emails to Send</span>
                      </div>
                      <div className="text-2xl font-bold text-[#ba1a1a]">
                        {existingBookingsCount}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Settings to Apply */}
            <div className="space-y-3">
              <h3 className="font-semibold text-[#212121]">Settings to Apply</h3>
              <div className="space-y-2">
                {settings.maxCapacity !== undefined && (
                  <div className="flex items-center gap-2 p-3 bg-[#E8F5E9] rounded-lg">
                    <Users className="w-4 h-4 text-[#2E7D32]" />
                    <span className="text-sm text-[#212121]">
                      <strong>Max Capacity:</strong> {settings.maxCapacity} visitors
                    </span>
                  </div>
                )}
                {settings.startTime !== undefined && (
                  <div className="flex items-center gap-2 p-3 bg-[#E8F5E9] rounded-lg">
                    <Clock className="w-4 h-4 text-[#2E7D32]" />
                    <span className="text-sm text-[#212121]">
                      <strong>Start Time:</strong> {settings.startTime.slice(0, 5)}
                    </span>
                  </div>
                )}
                {settings.isOpen !== undefined && (
                  <div className="flex items-center gap-2 p-3 bg-[#E8F5E9] rounded-lg">
                    {settings.isOpen ? (
                      <Eye className="w-4 h-4 text-[#2E7D32]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-[#ba1a1a]" />
                    )}
                    <span className="text-sm text-[#212121]">
                      <strong>Status:</strong> {settings.isOpen ? 'Open for bookings' : 'Blocked'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sample Affected Dates */}
            {affectedDates.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-[#212121]">
                  Sample Affected Dates {affectedDates.length < affectedDatesCount && `(showing first 10)`}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {affectedDates.map((date) => (
                    <div
                      key={date}
                      className="p-2 bg-[#F5F5F5] rounded text-sm text-[#212121] text-center"
                    >
                      {new Date(date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings by Date */}
            {bookingsByDate.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-[#212121]">Bookings by Date</h3>
                <div className="space-y-2">
                  {bookingsByDate.map((item) => (
                    <div
                      key={item.date}
                      className="flex items-center justify-between p-3 bg-[#FFF3E0] rounded-lg"
                    >
                      <span className="text-sm text-[#212121]">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-sm font-semibold text-[#E65100]">
                        {item.count} {item.count === 1 ? 'booking' : 'bookings'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Current Settings */}
            {sampleCurrentSettings.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-[#212121]">Current Settings (Sample)</h3>
                <div className="space-y-2">
                  {sampleCurrentSettings.map((item) => (
                    <div
                      key={item.date}
                      className="p-3 bg-[#F5F5F5] rounded-lg text-sm"
                    >
                      <div className="font-medium text-[#212121] mb-1">
                        {new Date(item.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[#616161] space-y-0.5">
                        <div>Capacity: {item.maxCapacity ?? 'Not set'}</div>
                        <div>Time: {item.startTime ? item.startTime.slice(0, 5) : 'Not set'}</div>
                        <div>Status: {item.isOpen ? 'Open' : 'Blocked'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E0E0E0]">
            <button
              onClick={onClose}
              disabled={isApplying}
              className="px-6 py-3 rounded-lg font-medium text-[#616161] hover:bg-[#F5F5F5] disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isApplying}
              className="px-6 py-3 bg-[#2E7D32] text-white rounded-lg font-medium hover:bg-[#1B5E20] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApplying ? 'Applying...' : 'Confirm & Apply'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
