'use client';

/**
 * CalendarLegend Component
 * 
 * Displays the color-coded legend for the calendar view
 * Shows what each color represents (capacity levels, disabled days)
 */
export function CalendarLegend() {
  const legendItems = [
    {
      color: 'bg-white border border-gray-300 rounded-sm',
      label: 'Open (0 Booked)',
    },
    {
      color: 'bg-green-100 rounded-sm',
      label: 'Filling Up',
    },
    {
      color: 'bg-green-700 rounded-sm',
      label: 'Fully Booked',
    },
    {
      color: 'bg-gray-300 rounded-sm',
      label: 'Disabled / Past',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 md:w-4 md:h-4 ${item.color}`}
            aria-hidden="true"
          />
          <span className="text-gray-400 text-sm">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
