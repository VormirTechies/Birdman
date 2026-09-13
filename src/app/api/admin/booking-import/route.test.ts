// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), migrate: vi.fn() }));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/firebase/admin', () => ({ adminDb: {}, firestoreDatabaseId: 'birdman-db' }));
vi.mock('@/lib/firebase/booking-csv-import', () => ({ importBookingCsv: mocks.migrate }));
import { POST } from './route';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '');
  vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '');
  mocks.auth.mockResolvedValue({ user: { uid: 'admin' } });
});
function request(extra = {}) { return new Request('http://localhost/api/admin/booking-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: 'test', target: 'production', offset: '+05:30', dryRun: true, ...extra }) }); }
it('denies unauthorized requests without importing', async () => {
  mocks.auth.mockResolvedValue({ user: null, response: new Response(null, { status: 403 }) });
  expect((await POST(request())).status).toBe(403);
  expect(mocks.migrate).not.toHaveBeenCalled();
});
it('prevents an emulator identity from authorizing production', async () => {
  vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:7002');
  expect((await POST(request())).status).toBe(503);
  expect(mocks.migrate).not.toHaveBeenCalled();
});
it('requires explicit live confirmation', async () => {
  expect((await POST(request({ dryRun: false }))).status).toBe(400);
  expect(mocks.migrate).not.toHaveBeenCalled();
});
it('passes preview mode and source timezone to the importer', async () => {
  mocks.migrate.mockResolvedValue({ inserts: 1 });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.migrate).toHaveBeenCalledWith({}, 'test', '+05:30', 'production', true);
});
it('imports only after live confirmation', async () => {
  mocks.migrate.mockResolvedValue({ inserts: 1 });
  expect((await POST(request({ dryRun: false, confirmation: 'IMPORT LIVE' }))).status).toBe(200);
  expect(mocks.migrate).toHaveBeenCalledWith({}, 'test', '+05:30', 'production', false);
});
