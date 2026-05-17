import { render } from '@react-email/render';
import BookingCancellation from '../../../../emails/booking-cancellation';

export default async function CancellationPreview() {
  // Dummy data for preview
  const dummyData = {
    visitorName: 'Meera Krishnan',
    bookingDate: '2026-05-19',
    bookingTime: '17:00:00',
    adults: 4,
    children: 1,
    numberOfGuests: 5,
    bookingId: 'BOC-9512C',
  };

  const emailHtml = await render(<BookingCancellation {...dummyData} />);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Preview: Booking Cancellation
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
