// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { expect, it, vi } from 'vitest';
it('registers safe click navigation before FCM initialization and never opens payload URLs', async () => {
  const handlers = new Map<string, (event: unknown) => void>(); const openWindow = vi.fn();
  const focus = vi.fn(); const postMessage = vi.fn(); const order: string[] = [];
  const clients = { matchAll: vi.fn().mockResolvedValue([{ url: 'https://evil.example/admin', focus }]), openWindow };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { URL, importScripts: () => order.push('fcm'),
    self: { location: { origin: 'https://birdman.example' }, clients, addEventListener: (name: string, callback: (event: unknown) => void) => { handlers.set(name, callback); order.push(name); } } });
  expect(order.indexOf('notificationclick')).toBeLessThan(order.indexOf('fcm'));
  let pending: Promise<unknown> | undefined;
  const event = { action: '', notification: { close: vi.fn(), data: { url: 'https://evil.example', FCM_MSG: { data: { notificationId: 'a'.repeat(64) } } } },
    stopImmediatePropagation: vi.fn(), waitUntil: (promise: Promise<unknown>) => { pending = promise; } };
  handlers.get('notificationclick')!(event); await pending;
  expect(openWindow).toHaveBeenCalledWith('/admin'); expect(focus).not.toHaveBeenCalled();
  clients.matchAll.mockResolvedValue([{ url: 'https://birdman.example/admin/history', focus, postMessage }]);
  handlers.get('notificationclick')!(event); await pending;
  expect(focus).toHaveBeenCalledOnce(); expect(postMessage).toHaveBeenCalledWith({ type: 'BIRDMAN_NOTIFICATION', notificationId: 'a'.repeat(64) });
});
