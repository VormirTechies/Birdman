import { render } from '@react-email/render';
import BookingReschedule from '../../../../emails/booking-reschedule';

export default async function ReschedulePreview() {
  // Dummy data for preview
  const dummyData = {
    visitorName: 'Arun Patel',
    oldDate: '2026-05-18',
    oldTime: '14:00:00',
    newDate: '2026-05-22',
    newTime: '16:30:00',
    adults: 2,
    children: 0,
    numberOfGuests: 2,
    bookingId: 'BOC-7821B',
  };

  const emailHtml = await render(<BookingReschedule {...dummyData} />);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Preview: Booking Reschedule
          </h1>
          <p className="text-gray-600 text-sm">
            This is how the email will appear to recipients. Scroll down to see the full template.
          </p>
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs text-gray-600 mb-1"><strong>Preview Data:</strong></p>
            <pre className="text-xs text-gray-700 font-mono">
{JSON.stringify(dummyData, null, 2)}
            </pre>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <iframe
            srcDoc={emailHtml}
            className="w-full h-[800px] border-0"
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}
