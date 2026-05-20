import { render } from '@react-email/render';
import VipWelcome from '../../../../emails/vip-welcome';

export default async function VipWelcomePreview() {
  const dummyData = {
    visitorName: 'Priya Venkataraman',
    bookingDate: '2026-05-20',
    bookingTime: '16:30:00',
    adults: 2,
    children: 1,
    bookingId: 'BOC-9876B',
    totalVisits: 4,
  };

  const emailHtml = await render(<VipWelcome {...dummyData} />);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Preview: VIP Welcome
          </h1>
          <p className="text-gray-600 text-sm">
            Sent to VIP visitors when they book. Gold-accented welcome-back email.
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
            className="w-full h-[900px] border-0"
            title="VIP Welcome Email Preview"
          />
        </div>
      </div>
    </div>
  );
}
