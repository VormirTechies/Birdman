import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), enabled: vi.fn(), config: vi.fn(), onMessage: vi.fn(),
  auth: { currentUser: { uid: 'admin-a' } as { uid: string } | null },
  authChanged: undefined as undefined | ((user: User | null) => void), foreground: undefined as undefined | ((payload: { data: { notificationId: string } }) => void) }));
vi.mock('@/firebase', () => ({ auth: mocks.auth, firebaseConfigError: null }));
vi.mock('firebase/auth', () => ({ onAuthStateChanged: (_auth: unknown, callback: (user: User | null) => void) => {
  mocks.authChanged = callback; callback(mocks.auth.currentUser as User); return vi.fn();
} }));
vi.mock('@/lib/firebase/authenticated-fetch', () => ({ authenticatedFetch: mocks.fetch }));
vi.mock('@/lib/firebase/notification-client', () => ({ getNotificationDeviceConfig: mocks.config, notificationsEnabledForCurrentUser: mocks.enabled }));
vi.mock('firebase/app', () => ({ getApp: () => ({}) }));
vi.mock('firebase/messaging', () => ({ getMessaging: () => ({}), isSupported: async () => true, onMessage: mocks.onMessage }));
import { NotificationProvider, useNotifications } from './NotificationProvider';
import { NotificationInbox } from '@/app/admin/_components/NotificationInbox';
const id = 'a'.repeat(64);
const page = { notifications: [{ id, title: 'Booking confirmed', body: 'A booking was confirmed.', type: 'booking_confirmed',
  bookingDate: '2099-11-01', bookingExists: false, createdAt: new Date().toISOString(), read: false, url: '/admin' }],
  unreadCount: 1, pagination: { limit: 20, hasMore: true, nextCursor: 'next-page' } };
let worker: EventTarget;
beforeEach(() => {
  vi.resetAllMocks(); mocks.auth.currentUser = { uid: 'admin-a' }; mocks.enabled.mockReturnValue(false);
  mocks.config.mockResolvedValue({ mode: 'mock', configured: true });
  mocks.fetch.mockImplementation(async (_url: string, init?: RequestInit) => new Response(JSON.stringify(init?.method === 'PATCH' ? { success: true } : page)));
  worker = new EventTarget(); Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: worker });
  window.history.replaceState({}, '', '/admin');
  mocks.onMessage.mockImplementation((_messaging, callback) => { mocks.foreground = callback; return vi.fn(); });
});
afterEach(cleanup);
function Badge() { const { unreadCount } = useNotifications(); return <span data-testid="badge">{unreadCount}</span>; }
const mount = () => render(<NotificationProvider><Badge /><NotificationInbox /></NotificationProvider>);
it('does not restore private rows when an old account request resolves after an account switch', async () => {
  let finishOld: (response: Response) => void = () => {};
  mocks.fetch.mockImplementationOnce(() => new Promise<Response>(resolve => { finishOld = resolve; }));
  mount(); await waitFor(() => expect(mocks.fetch).toHaveBeenCalledOnce());
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ ...page, notifications: [], unreadCount: 0 })));
  act(() => { mocks.auth.currentUser = { uid: 'admin-b' }; mocks.authChanged?.(mocks.auth.currentUser as User); });
  await screen.findByText('No notifications on this page.');
  await act(async () => { finishOld(new Response(JSON.stringify(page))); });
  expect(screen.queryByText('Booking confirmed')).not.toBeInTheDocument(); expect(screen.getByTestId('badge')).toHaveTextContent('0');
});
it('locks duplicate read/dismiss mutations while a request is outstanding', async () => {
  mount(); await screen.findByText('Booking confirmed');
  let finish: (response: Response) => void = () => {};
  mocks.fetch.mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }));
  const button = screen.getByRole('button', { name: 'Dismiss' }); fireEvent.click(button); fireEvent.click(button);
  expect(button).toBeDisabled();
  expect(mocks.fetch.mock.calls.filter(call => call[1]?.method === 'PATCH')).toHaveLength(1);
  await act(async () => { finish(new Response(JSON.stringify({ success: true }))); });
});
it('loads persisted events without auto-clearing and persists explicit per-page actions', async () => {
  mount(); await screen.findByText('Booking confirmed');
  expect(screen.getByText('The booking is no longer available.')).toBeInTheDocument();
  expect(mocks.fetch.mock.calls.some(call => call[1]?.method === 'PATCH')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Mark page read' }));
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/notifications', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ ids: [id], action: 'read' }) })));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Dismiss' })).not.toBeDisabled());
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/notifications', expect.objectContaining({ body: JSON.stringify({ ids: [id], action: 'dismiss' }) })));
});
it('uses cursor Next/Previous rather than offsets and supports returning to latest', async () => {
  mount(); await screen.findByText('Booking confirmed');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/notifications?limit=20&cursor=next-page', expect.anything()));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Previous' })).not.toBeDisabled());
  fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
  await waitFor(() => expect(mocks.fetch.mock.calls.at(-1)?.[0]).toBe('/api/admin/notifications?limit=20'));
});
it('deduplicates worker event IDs and never renders untrusted push text', async () => {
  mount(); await screen.findByText('Booking confirmed'); const count = mocks.fetch.mock.calls.length;
  act(() => { for (let i = 0; i < 2; i++) worker.dispatchEvent(new MessageEvent('message', { data: { type: 'BIRDMAN_NOTIFICATION', notificationId: id, body: 'untrusted secret' } })); });
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(count + 1));
  expect(screen.queryByText('untrusted secret')).not.toBeInTheDocument();
  act(() => worker.dispatchEvent(new MessageEvent('message', { data: { type: 'BIRDMAN_NOTIFICATION', notificationId: '../invalid' } })));
  expect(mocks.fetch).toHaveBeenCalledTimes(count + 1);
});
it('subscribes to foreground FCM only after opt-in in live mode', async () => {
  mocks.enabled.mockReturnValue(true); mocks.config.mockResolvedValue({ mode: 'fcm', configured: true });
  mount(); await waitFor(() => expect(mocks.onMessage).toHaveBeenCalledOnce());
  const count = mocks.fetch.mock.calls.length;
  act(() => mocks.foreground?.({ data: { notificationId: id } }));
  await waitFor(() => expect(mocks.fetch).toHaveBeenCalledTimes(count + 1));
});
it('clears private events on logout and displays API errors with retry', async () => {
  mount(); await screen.findByText('Booking confirmed');
  act(() => { mocks.auth.currentUser = null; mocks.authChanged?.(null); });
  expect(screen.queryByText('Booking confirmed')).not.toBeInTheDocument(); expect(screen.getByTestId('badge')).toHaveTextContent('0');
  mocks.fetch.mockResolvedValue(new Response('{}', { status: 503 }));
  act(() => { mocks.auth.currentUser = { uid: 'admin-b' }; mocks.authChanged?.(mocks.auth.currentUser as User); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load notifications');
  mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ ...page, notifications: [] })));
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('No notifications on this page.');
});
