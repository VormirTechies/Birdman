import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type { DatePicker } from '@/app/admin/_components/DatePicker';
import SettingsPage from '@/app/admin/settings/page';

vi.mock('@/lib/firebase/authenticated-fetch', () => ({
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// Isolate date selection from the popover's geometry; keep the real mode selector,
// settings form and preview component so payloads and visible state are exercised.
vi.mock('@/app/admin/_components/DatePicker', () => ({
  DatePicker: ({ value, onChange }: ComponentProps<typeof DatePicker>) => (
    <input aria-label="Date picker" type="date" value={`${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`}
      onChange={event => onChange(new Date(`${event.target.value}T12:00:00`))} />
  ),
}));

const scope = { startDate: '2026-10-16', endDate: '2027-04-14' };
const preview = { success: true, scope, affectedDatesCount: 181, affectedDates: ['2026-10-16'],
  existingBookingsCount: 0, bookingsByDate: [], sampleCurrentSettings: [], willBlock: false };
const day = { success: true, settings: { maxCapacity: 120, startTime: '18:00:00', isOpen: false } };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const fetchMock = vi.fn<typeof fetch>();
const posted = (path: string) => fetchMock.mock.calls.filter(([url]) => url === path).map(([, init]) => JSON.parse(String(init?.body)));
const previewPath = '/api/admin/settings/preview';
const applyPath = '/api/admin/settings/bulk-update';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async url => {
    if (String(url).startsWith('/api/calendar/day/')) return json(day);
    if (url === previewPath) return json(preview);
    return json({ success: true, affectedCount: 181, cancelledBookingsCount: 0, emailsSent: 0, emailsFailed: 0 });
  });
});

describe('Settings V2 selected changes and reviewed scope', () => {
  it('starts with no settings selected and explains the bounded window', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('heading', { name: 'Calendar Settings' })).toBeInTheDocument();
    expect(screen.getByText(/181 dates, inclusive/)).toBeInTheDocument();
    for (const field of screen.getAllByRole('checkbox')) expect(field).not.toBeChecked();
    expect(screen.queryByLabelText('Maximum Capacity')).not.toBeInTheDocument();
  });
  it('rejects an empty change set without calling an API', async () => {
    const { toast } = await import('sonner');
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    expect(toast.error).toHaveBeenCalledWith('Select at least one setting to change');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends capacity only and applies the exact reviewed date scope', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);
    await user.click(screen.getByLabelText('Change capacity'));
    fireEvent.change(screen.getByLabelText('Maximum Capacity'), { target: { value: '80' } });
    await user.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await screen.findByRole('button', { name: 'Confirm & Apply' });
    expect(posted(previewPath)).toEqual([{ applyMode: 'all_days', settings: { maxCapacity: 80 } }]);
    expect(screen.getByText(/2026-10-16 through 2027-04-14/)).toBeInTheDocument();
    expect(screen.getByLabelText('Change capacity')).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Confirm & Apply' }));
    await waitFor(() => expect(posted(applyPath)).toEqual([{ applyMode: 'all_days', settings: { maxCapacity: 80 }, scope }]));
    await waitFor(() => expect(screen.getByLabelText('Change capacity')).not.toBeChecked());
  });
  it('omits a field when it is unchecked, including a previously selected close action', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change booking availability'));
    fireEvent.click(screen.getByLabelText('Open for Bookings'));
    expect(screen.getByRole('alert')).toHaveTextContent('cancel existing confirmed bookings');
    fireEvent.click(screen.getByLabelText('Change booking availability'));
    fireEvent.click(screen.getByLabelText('Change visiting time'));
    fireEvent.change(screen.getByLabelText('Visiting Hour (India time)'), { target: { value: '15:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await screen.findByRole('button', { name: 'Confirm & Apply' });
    expect(posted(previewPath)[0].settings).toEqual({ startTime: '15:00:00' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('preserves explicit zero capacity and false availability', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    fireEvent.change(screen.getByLabelText('Maximum Capacity'), { target: { value: '0' } });
    fireEvent.click(screen.getByLabelText('Change booking availability'));
    fireEvent.click(screen.getByLabelText('Open for Bookings'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await screen.findByRole('button', { name: 'Confirm & Apply' });
    expect(posted(previewPath)[0].settings).toEqual({ maxCapacity: 0, isOpen: false });
  });
  it('reset clears selections rather than submitting fallback values', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    fireEvent.click(screen.getByLabelText('Change visiting time'));
    fireEvent.click(screen.getByRole('button', { name: 'Reset changes' }));
    expect(screen.queryByLabelText('Maximum Capacity')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Visiting Hour (India time)')).not.toBeInTheDocument();
    for (const field of screen.getAllByRole('checkbox')) expect(field).not.toBeChecked();
  });
  it('loads current day values without selecting fields automatically', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /One Day/ }));
    await waitFor(() => expect(screen.getByLabelText('Change capacity')).toBeEnabled());
    expect(screen.getByLabelText('Change capacity')).not.toBeChecked();
    // Clicking the active mode again must not leave the form stuck loading.
    fireEvent.click(screen.getByRole('button', { name: /One Day/ }));
    expect(screen.getByLabelText('Change capacity')).toBeEnabled();
    fireEvent.click(screen.getByLabelText('Change capacity'));
    expect(screen.getByLabelText('Maximum Capacity')).toHaveValue(120);
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await screen.findByRole('button', { name: 'Confirm & Apply' });
    expect(posted(previewPath)[0].settings).toEqual({ maxCapacity: 120 });
  });
  it('blocks preview after a day-settings load failure', async () => {
    fetchMock.mockResolvedValue(json({ error: 'Unavailable' }, 500));
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /One Day/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.getByRole('button', { name: 'Preview Changes' })).toBeDisabled();
    expect(posted(previewPath)).toHaveLength(0);
  });
  it('ignores a delayed response for a previously selected date', async () => {
    let finishFirst!: (value: Response) => void;
    let calls = 0;
    fetchMock.mockImplementation(async () => {
      calls += 1;
      if (calls === 1) return new Promise(resolve => { finishFirst = resolve; });
      return json({ ...day, settings: { ...day.settings, maxCapacity: 70 } });
    });
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /One Day/ }));
    expect(screen.getByRole('button', { name: 'Preview Changes' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Date picker'), { target: { value: '2026-11-02' } });
    await waitFor(() => expect(screen.getByLabelText('Change capacity')).toBeEnabled());
    await act(async () => finishFirst(json(day)));
    fireEvent.click(screen.getByLabelText('Change capacity'));
    expect(screen.getByLabelText('Maximum Capacity')).toHaveValue(70);
  });
  it('sends only inclusive range dates and selected fields', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Date Range/ }));
    const pickers = screen.getAllByLabelText('Date picker');
    fireEvent.change(pickers[0], { target: { value: '2026-11-02' } });
    fireEvent.change(pickers[1], { target: { value: '2026-11-03' } });
    fireEvent.click(screen.getByLabelText('Change visiting time'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await screen.findByRole('button', { name: 'Confirm & Apply' });
    expect(posted(previewPath)[0]).toEqual({ applyMode: 'date_range', startDate: '2026-11-02', endDate: '2026-11-03', settings: { startTime: '16:30:00' } });
  });
  it('prevents duplicate preview requests while the first request is pending', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(async () => new Promise(resolve => { finish = resolve; }));
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    const button = screen.getByRole('button', { name: 'Preview Changes' });
    fireEvent.click(button); fireEvent.click(button);
    expect(posted(previewPath)).toHaveLength(1);
    await act(async () => finish(json(preview)));
    expect(screen.getByRole('button', { name: 'Confirm & Apply' })).toBeInTheDocument();
  });
  it.each(['-1', '201', '2.5', ''])('rejects invalid selected capacity %s', async value => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    fireEvent.change(screen.getByLabelText('Maximum Capacity'), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('keeps changes when preview fails, without opening a review', async () => {
    fetchMock.mockResolvedValue(json({ error: 'Preview unavailable' }, 500));
    const { toast } = await import('sonner');
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Preview unavailable'));
    expect(screen.getByLabelText('Maximum Capacity')).toHaveValue(100);
    expect(screen.queryByRole('button', { name: 'Confirm & Apply' })).not.toBeInTheDocument();
  });
  it('cancel review permits editing and requires a fresh preview', async () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Change capacity')).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Maximum Capacity'), { target: { value: '70' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    await screen.findByRole('button', { name: 'Confirm & Apply' });
    expect(posted(previewPath).at(-1).settings).toEqual({ maxCapacity: 70 });
    expect(posted(applyPath)).toHaveLength(0);
  });
  it('prevents duplicate apply requests and keeps review open on failure', async () => {
    let finish!: (value: Response) => void;
    fetchMock.mockImplementation(async url => url === applyPath ? new Promise(resolve => { finish = resolve; }) : json(preview));
    const { toast } = await import('sonner');
    render(<SettingsPage />);
    fireEvent.click(screen.getByLabelText('Change capacity'));
    fireEvent.click(screen.getByRole('button', { name: 'Preview Changes' }));
    const button = await screen.findByRole('button', { name: 'Confirm & Apply' });
    fireEvent.click(button); fireEvent.click(button);
    expect(posted(applyPath)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await act(async () => finish(json({ error: 'Apply unavailable' }, 500)));
    expect(toast.error).toHaveBeenCalledWith('Apply unavailable');
    expect(screen.getByRole('button', { name: 'Confirm & Apply' })).toBeEnabled();
    expect(screen.getByLabelText('Maximum Capacity')).toHaveValue(100);
  });
});
