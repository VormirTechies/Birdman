import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
const mocks = vi.hoisted(() => ({ config: vi.fn(), enable: vi.fn(), disable: vi.fn(), enabled: vi.fn() }));
vi.mock('@/lib/firebase/notification-client', () => ({
  getNotificationDeviceConfig: mocks.config, enableAdminNotifications: mocks.enable,
  disableAdminNotifications: mocks.disable, notificationsEnabledForCurrentUser: mocks.enabled,
}));
import { NotificationDeviceControl } from './NotificationDeviceControl';
beforeEach(() => {
  vi.resetAllMocks(); mocks.config.mockResolvedValue({ mode: 'fcm', configured: true, vapidKey: 'public-key' });
  mocks.enabled.mockReturnValue(false); mocks.enable.mockResolvedValue(true);
});
it('does not request permission on mount; enables only after a click', async () => {
  render(<NotificationDeviceControl />);
  const button = await screen.findByRole('button', { name: 'Enable notifications' });
  expect(mocks.enable).not.toHaveBeenCalled(); fireEvent.click(button);
  await screen.findByRole('button', { name: 'Disable notifications' });
  expect(mocks.enable).toHaveBeenCalledOnce(); fireEvent.click(screen.getByRole('button', { name: 'Disable notifications' }));
  await screen.findByRole('button', { name: 'Enable notifications' }); expect(mocks.disable).toHaveBeenCalledOnce();
});
it('restores previous consent without prompting again', async () => {
  mocks.enabled.mockReturnValue(true); render(<NotificationDeviceControl />);
  await screen.findByRole('button', { name: 'Disable notifications' });
  expect(mocks.enable).toHaveBeenCalledWith(expect.any(Object), false);
});
it('prevents duplicate requests and displays permission errors', async () => {
  let reject!: (error: Error) => void;
  mocks.enable.mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
  render(<NotificationDeviceControl />); const button = await screen.findByRole('button', { name: 'Enable notifications' });
  fireEvent.click(button); fireEvent.click(button); expect(mocks.enable).toHaveBeenCalledOnce();
  expect(screen.getByRole('button', { name: 'Please wait…' })).toBeDisabled();
  reject(new Error('Notifications are blocked.'));
  await screen.findByText('Notifications are blocked.');
});
it('labels local mock mode and disables unavailable production setup', async () => {
  mocks.config.mockResolvedValue({ mode: 'mock', configured: true });
  const view = render(<NotificationDeviceControl />);
  await screen.findByRole('button', { name: 'Register test device' });
  expect(screen.getByText(/no real push is sent/i)).toBeInTheDocument(); view.unmount();
  mocks.config.mockResolvedValue({ mode: 'fcm', configured: false }); render(<NotificationDeviceControl />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enable notifications' })).toBeDisabled());
});
