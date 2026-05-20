import Link from 'next/link';

export default function EmailTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Email Templates Preview
        </h1>
        <p className="text-gray-600 mb-8">
          Click on any template below to preview it with dummy data
        </p>

        <div className="grid gap-4">
          <Link
            href="/emails/confirmation"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              🦜 Booking Confirmation
            </h2>
            <p className="text-gray-600 text-sm">
              Sent immediately after a visitor successfully books a time slot
            </p>
          </Link>

          <Link
            href="/emails/reminder"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ⏰ Booking Reminder
            </h2>
            <p className="text-gray-600 text-sm">
              Sent on the day of the visit as a friendly reminder
            </p>
          </Link>

          <Link
            href="/emails/reschedule"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              📅 Booking Reschedule
            </h2>
            <p className="text-gray-600 text-sm">
              Sent when a visitor or admin changes the booking date/time
            </p>
          </Link>

          <Link
            href="/emails/cancellation"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              🦜 Booking Cancellation
            </h2>
            <p className="text-gray-600 text-sm">
              Sent when a booking is cancelled by admin or system
            </p>
          </Link>

          <Link
            href="/emails/vip-welcome"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-amber-200"
            style={{ borderColor: '#FF8C00' }}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#FF8C00' }}>
              ⭐ VIP Welcome
            </h2>
            <p className="text-gray-600 text-sm">
              Sent to VIP visitors when they book — gold-accented welcome-back email
            </p>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> These previews use dummy data for testing purposes. 
            The actual emails sent to visitors will contain real booking information.
          </p>
        </div>
      </div>
    </div>
  );
}
