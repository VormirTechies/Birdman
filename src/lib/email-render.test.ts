// @vitest-environment node
import { createElement } from 'react';
import { render } from '@react-email/render';
import { describe, expect, it } from 'vitest';
import Confirmation from '../../emails/booking-confirmation';
import Reminder from '../../emails/booking-reminder';
import Reschedule from '../../emails/booking-reschedule';
import Cancellation from '../../emails/booking-cancellation';
import VipWelcome from '../../emails/vip-welcome';

const props = {
  visitorName: 'Test <script>alert(1)</script> Visitor',
  bookingDate: '2026-11-01', bookingTime: '16:30:00', adults: 2, children: 1,
  bookingId: '#000023', manageUrl: 'https://example.com/booking-status',
};
const templates = [
  ['confirmation', createElement(Confirmation, props)],
  ['reminder', createElement(Reminder, props)],
  ['reschedule', createElement(Reschedule, {
    ...props, oldDate: '2026-10-31', oldTime: '16:30:00',
    newDate: props.bookingDate, newTime: props.bookingTime,
  })],
  ['cancellation', createElement(Cancellation, props)],
  ['VIP', createElement(VipWelcome, { ...props, totalVisits: 2 })],
] as const;

describe('Production email rendering without the preview CLI', () => {
  it.each(templates)('renders %s and escapes visitor input', async (_name, template) => {
    const html = await render(template);
    expect(html).toContain('<html');
    expect(html).toContain('Visitor');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
