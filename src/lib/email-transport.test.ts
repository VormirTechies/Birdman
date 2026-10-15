// @vitest-environment node
import { describe, expect, it } from 'vitest';
import nodemailer from 'nodemailer';

describe('Nodemailer compatibility without external delivery', () => {
  const transport = () => nodemailer.createTransport({
    streamTransport: true, buffer: true,
    disableFileAccess: true, disableUrlAccess: true,
  });

  it('builds an HTML message using a structured recipient', async () => {
    const result = await transport().sendMail({
      from: 'Birdman <sender@example.com>',
      to: { address: 'visitor@example.com', name: '' },
      subject: 'Booking confirmed', html: '<p>Your booking is confirmed.</p>',
    });
    expect(result.envelope.to).toEqual(['visitor@example.com']);
    expect(result.message.toString()).toContain('Your booking is confirmed.');
  });

  it.each(['file', 'URL'])('blocks %s attachment access', async (kind) => {
    await expect(transport().sendMail({
      from: 'sender@example.com', to: 'visitor@example.com', subject: 'Test',
      attachments: [{ filename: 'test.txt', path: kind === 'file'
        ? 'not-a-real-file.txt' : 'https://example.invalid/private' }],
    })).rejects.toThrow(/access rejected/i);
  });
});
