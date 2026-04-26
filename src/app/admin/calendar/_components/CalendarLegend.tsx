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
      color: 'bg-white border border-gray-300',
      label: 'No bookings',
      description: '(0 booked)',
    },
    {
      color: 'bg-green-100',
      label: 'Available',
      description: '(1-70% capacity)',
    },
    {
      color: 'bg-green-700',
      label: 'Almost full',
      description: '(71-100% capacity)',
    },
    {
      color: 'bg-gray-300',
      label: 'Closed / Past',
      description: '(Disabled)',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className={`w-4 h-4 rounded ${item.color}`}
            aria-hidden="true"
          />
          <span className="text-gray-700">
            {item.label}
            <span className="text-gray-500 ml-1">{item.description}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
