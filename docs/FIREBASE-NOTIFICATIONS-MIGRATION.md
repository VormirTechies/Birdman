# Firebase notification migration

## Scope and progress

Steps 1–6 and the local automated portion of Step 7 are implemented; live FCM credentials are user-configured but actual browser push delivery, runtime IAM verification and TTL/index deployment are not verified. Browser registration, atomic booking event hooks, the protected delivery worker and persistent admin inbox are available. Nothing is delivered automatically in production until the worker is deployed and its scheduler configured.

1. Foundation configuration: confirmed production birdman-7e745 / birdman-db is STANDARD / FIRESTORE_NATIVE; local database remains (default). Lazy Admin Messaging accessor rejects emulator use. Configuration defaults to mock locally and FCM in production, rejects unsafe live/mock combinations and validates the public VAPID key.
2. Firestore storage and cleanup: strict models, transactional idempotent history/outbox staging, TTL definitions and bounded emulator cleanup.
3. Authenticated admin device registration (implemented): explicit permission button, multiple devices, ownership validation, token refresh/logout removal. Server derives uid; callers cannot select another administrator.
4. Booking transactions (implemented): confirmed, changed, cancelled and available-to-full transitions. Stage notification after transaction reads and before other writes. Batch staging reads all event identities before any writes. Stable event keys derive from booking revision/capacity transition; never from a public request.
5. Background delivery (implemented): protected worker, leases, retries/backoff, recipient role/disabled-user checks, invalid registration cleanup and terminal job expiry. Per-device receipts prevent ordinary successful-device retries; client event-ID deduplication remains Step 6. FCM delivery is best-effort, not exactly-once.
6. Admin inbox (implemented): cursor pagination (20), per-admin read/dismiss state, expiry filtering, authenticated polling and foreground/background push using the existing service worker. Generic lock-screen text, private details behind authorization.
7. Tests (local automated coverage implemented): real emulator authorization, ownership, rules, concurrency/rollback, retries and browser inbox. Real production FCM acceptance remains pending.
8. Deploy and smoke test before retiring active legacy push code. Email remains a separate phase.

## Step 1 production prerequisites

- Firebase Console → project birdman-7e745 → Project settings → Cloud Messaging → Web Push certificates. Generate/import credentials and set `NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY` to the PUBLIC key. Public keys are not secrets; private keys must never be committed or bundled.
- Existing Firebase web config must include the correct `messagingSenderId`, API key, app ID and project ID. No service-account JSON should be committed. The server uses Application Default Credentials.
- Verify the FCM API/registration API and grant the actual sending runtime service account least-privilege FCM send access (`roles/firebasecloudmessaging.admin` if using the predefined send role). Verify permission rather than assuming App Hosting has it.
- `NOTIFICATIONS_DELIVERY_MODE=fcm` for production (default); `mock` for local development (default). FCM has no emulator. Do not send real push while testing with emulator records.
- `getAdminMessaging()` is lazy and does not send messages. Configuration `configured` currently checks presence/format only, not actual project credentials or delivery.
- Actual browser setup and runtime configuration checks will be wired in Step 3. Missing push config must not prevent bookings or the admin inbox from working.

## Step 2 collections and retention

All collections are top-level; existing Firestore rules deny all direct client reads/writes, including these paths. Admin SDK bypasses rules, so future APIs must verify Firebase identity and adminUsers role. Device tokens are sensitive: never return them in list APIs or log them.

| Collection | Purpose | Retention |
| --- | --- | --- |
| adminNotifications | Event history, type, booking reference, generic text, server timestamps | 90 days from event creation |
| adminNotificationStates | uid, event ID, read/dismiss timestamps | Same expiresAt as its parent event, not 90 days after reading |
| adminNotificationDevices | uid, FCM registration, lastSeenAt | 30 days after last refresh; refresh periodically while signed in |
| notificationDeliveryJobs | pending/processing/terminal state, attempts, next attempt, lease, error code | Completed: 7 days after completion; failed: 30 days after terminal failure |
| notificationDeliveryReceipts | Event/device IDs and sent/skipped outcomes, never raw tokens | Same expiry as notification history (90 days) |

Each uses `expiresAt` Timestamp for TTL. Read state uses a deterministic hash of the UID/event-ID tuple, with its own TTL so parent deletion cannot orphan it. Device registration uses deterministic token hashes with transactional ownership enforcement. Read/dismiss writes are provided by Step 6.

## Step 3 usage and behavior

Validation on 2026-10-14: eight targeted suites passed 60 tests, including four real emulator integration tests for event persistence/cleanup and device ownership/concurrency. Changed-file lint, service-worker syntax and diff checks passed. Production compilation succeeded; unrelated old test-fixture TypeScript errors still block the complete build. No real push was sent, no production registration was created and no deployment was performed.

- Log in as an administrator. The Admin notifications card appears above page content.
- Production: click Enable notifications and approve the browser prompt. No prompt is shown automatically. Requires a supported browser/secure context; blocked permission must be changed in browser site settings.
- Local: click Register test device. This writes a mock registration to (default); it never requests browser permission or calls FCM. Mock registrations cannot be submitted to the production endpoint.
- GET /api/admin/notifications/devices returns public setup information, not registrations/tokens. POST registers/refreshes `{ token }`; DELETE removes `{ token }`. All use authenticatedFetch and requireAdmin with revocation/disabled-user checking. Request bodies are limited to 8 KiB and strictly validated. Ownership is immutable; uid and expiry are server-owned. Registration rechecks adminUsers inside the transaction.
- Refresh runs on mount/visibility and every six hours while visible, only after prior opt-in. It refreshes 30-day expiry and detects changed FCM tokens. Token storage is Firebase SDK-managed IndexedDB; application localStorage contains only the opt-in UID. Mock tokens use sessionStorage.
- Header/sidebar logout removes the current registration and revokes the browser token before signing out. If server deletion fails but SDK revocation succeeds, logout can proceed; the invalid server row is later cleaned up. If both fail, show an error and require retry. Other devices are not removed.
- Existing `/sw.js` is retained for PWA caching and imports a same-origin dynamic FCM initializer. Only public Firebase configuration is serialized. Foreground/inbox delivery behavior is completed in Step 6; no booking push sender is activated in Step 3.
- Registration checks a worker readiness handshake after updates, so missing configuration or failed CDN imports do not silently produce an enabled state. Messaging SDK code loads only when needed; permission is requested from the button gesture before loading SDK/network code.
- Existing direct-client Firestore deny rules are unchanged. Registration tokens are not displayed in API responses or logged.
- Existing legacy subscriptions do not become FCM registrations automatically. Users must opt in again. Background worker/role rechecks remain essential in Step 5 before delivery.

## Step 4 event behavior

- `createFirestoreBooking` stages a confirmed event and, when the committed seat count crosses from below capacity to full, a capacity-full event. Both public and admin creation use this shared transaction.
- Booking date/time, guest counts, contact/name and status changes stage a changed event; entering cancelled stages a cancellation; reactivating a cancelled booking stages confirmation. No-op changes, reminder/email bookkeeping and check-in-only flags do not create alerts.
- Rescheduling releases the old date and updates the destination count atomically; a destination reaching full stages its full-capacity event in the same transaction. Bulk date cancellation already uses the shared cancellation repository, so each successful cancellation has its own atomic event.
- Deleting a confirmed booking releases seats and stages cancellation before removing the booking document. Deleting cancelled/completed history does not create another cancellation. Step 6 must handle notifications referring to removed bookings without failing the inbox.
- `notificationRevision` is server-owned on booking documents; missing historical values start at zero. `notificationFullRevision` is server-owned on bookingDays. Both stay out of public/admin booking DTOs and are indexing-exempt. Neither field can be supplied through the strict booking schemas.
- Full alerts fire once per below-full → full booking transition. After cancellation/reschedule frees seats, refilling can create another full alert with a new transition revision. Merely editing a calendar capacity setting does not create an alert in this phase.
- Notification text is generic and contains no visitor name, email or phone. The private history includes the booking document reference/date for authorized dashboard navigation.
- Events and pending jobs commit with booking/counter changes. A failed capacity check, contact verification, closed date, event collision or transaction failure writes nothing. Sending errors later must not undo bookings; the worker handles them independently in Step 5.
- Stable identities prevent transaction retries/no-op repeated updates from duplicating events. Public POST creation idempotency is not added here: separate successful submissions remain separate bookings subject to the existing contact and rate limits.
- Legacy Postgres push calls were removed from public/admin creation handlers. Legacy standalone push endpoints/files remain for archival/cutover in Step 8, not used by this booking flow. Do not deploy this slice expecting delivery before Step 5.

Tests cover event privacy, read-before-write batching, concurrent capacity contention, cancellation retries/refill, reschedule/guest increases, deletion, older records, and rollback. Integration tests use isolated emulator projects and send no real push.

Step 4 validation on 2026-10-14: targeted unit/API and real emulator tests passed; changed-file lint and diff checks passed. Build compilation succeeded, with the same unrelated existing TypeScript test-fixture errors blocking the full build. One initial heavily parallel emulator run exceeded the old 5-second timeout; the concurrent foundation integration test now has a 20-second timeout and passed on rerun. No production records were changed and nothing was deployed.

TTL is asynchronous (typically within 24 hours), costs document deletes, and does not recursively delete subcollections. Readers/senders must exclude expired records immediately; don't wait for physical deletion. Pending jobs have no expiry; alert on backlog and terminalize exhausted jobs in Step 5. History retention also bounds event deduplication; never retry old events beyond that window.

The checked-in firestore.indexes.json contains TTL policies and indexes for worker scheduling and device selection. expiresAt single-field indexes remain enabled intentionally for bounded manual cleanup. Token/body indexing is exempted.

### Production deployment (not executed)

Review and deploy indexes to the named production database through firebase.json:

```powershell
npx firebase-tools deploy --only firestore:indexes --project birdman-7e745
gcloud firestore fields ttls list --database=birdman-db --project=birdman-7e745
```

If TTL policies aren't enabled by the installed CLI, enable each explicitly (example):

```powershell
gcloud firestore fields ttls update expiresAt --collection-group=adminNotifications --enable-ttl --database=birdman-db --project=birdman-7e745
```

Repeat for adminNotificationStates, adminNotificationDevices, notificationDeliveryJobs, notificationDeliveryReceipts. Wait for all five TTL policies to become ACTIVE and composite indexes READY before production activation. Enabling TTL can delete already-expired documents; review the exact collections first.

### Emulator cleanup

Do not rely on emulator TTL execution. This command always targets loopback/(default), rejects live mode and affects only notification collections:

```powershell
npm run cleanup:notifications:emulator
# After reviewing the dry-run counts, permanently delete expired local records:
npm run cleanup:notifications:emulator -- --apply
```

At most 100 expired documents per collection per invocation. Repeat for a larger backlog. It rechecks expiry transactionally before deletion, so a refreshed device is retained. There is no public cleanup HTTP endpoint. No production cleanup command is added.

### Validation

```powershell
npx vitest run src/lib/firebase/notification-foundation.test.ts
$env:RUN_NOTIFICATION_EMULATOR_TESTS='true'
npx vitest run src/lib/firebase/notification-foundation.integration.test.ts
Remove-Item Env:RUN_NOTIFICATION_EMULATOR_TESTS
```

Validation on 2026-10-14: 23 unit tests and 2 real emulator integration tests passed; changed-file lint and diff checks passed. Emulator cleanup dry-run succeeded and found zero expired app records; no app records were deleted. Integration tests use an isolated demo project on 127.0.0.1:7003; they never touch production or the app's local records. Full production build remains subject to the existing unrelated TypeScript fixture errors. Push browser delivery and authorization/rules tests will be completed with the API/UI steps.

References: [FCM web setup](https://firebase.google.com/docs/cloud-messaging/web/get-started), [Firestore TTL behavior](https://firebase.google.com/docs/firestore/ttl), [FCM registration maintenance](https://firebase.google.com/docs/cloud-messaging/manage-tokens).

## Step 5 delivery worker

### Runtime behavior

- POST /api/cron/notification-delivery requires an exact Authorization bearer matching the dedicated server-only NOTIFICATIONS_WORKER_SECRET. Missing, blank or shorter-than-32-character secrets fail closed. GET and Firebase admin login tokens do not authorize delivery.
- Scans at most five due jobs per call and twenty device records per job page. Starts no more work after a 35-second budget; in-flight Admin SDK/Auth requests can extend elapsed time. The endpoint exports maxDuration=180; verify actual hosting timeout and scheduler deadline before activation.
- Claims jobs transactionally with a random lease identity and two-minute lease. Renews before sending; expired leases are recoverable and old workers cannot finalize another worker's lease.
- Uses the existing status/nextAttemptAt index. Device pages use document-ID cursors; successful pages reset the page retry counter and continue later. Aggregate `retried` includes scheduled page/budget continuation.
- Rechecks device ownership/expiry, adminUsers role and Firebase Auth user disabled/deleted state. Rechecks role/device after Auth lookup. Revocation immediately after the last check can still race an external send; push text stays generic, without booking contact data.
- Invalid/unregistered token errors delete only the matching registration. Payload/credential errors terminalize the job without deleting valid devices. Temporary/unknown errors retry with exponential backoff and jitter, starting at least one minute later. Five attempts per page or work older than 24 hours becomes failed with 30-day expiry. Completed jobs expire after seven days.
- Receipts record sent/skipped per event/device until the event's 90-day expiry. Successful devices are skipped on retries. A crash after FCM acceptance but before receipt persistence can duplicate a message; the browser tag and event ID support deduplication, but delivery is not exactly once. Sent means accepted by FCM, not displayed/read.
- No eligible devices completes the push job; history remains for the future inbox. New registrations behind an advanced cursor need not receive historical push. Delivery never changes bookings.
- Local mode never calls FCM. It still checks roles/account state; set FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:7002 before starting the local app. Mock registrations cannot go through the FCM adapter.

### Production setup (manual; not executed)

1. Finish build fixes, deploy notification indexes/all five TTL policies, and verify runtime FCM API/send permissions from Step 1.
2. Generate a strong random dedicated worker secret (at least 32 characters). Store it in Secret Manager and expose it to birdman-web as NOTIFICATIONS_WORKER_SECRET, RUNTIME only. Never use NEXT_PUBLIC, commit a value, or put it in a URL.
3. App Hosting supports firebase-tools apphosting:secrets:set and apphosting:secrets:grantaccess. Add a secret reference to the existing configuration without replacing its other variables. Example fragment only:

```yaml
env:
  - variable: NOTIFICATIONS_WORKER_SECRET
    secret: notification-worker-secret
    availability:
      - RUNTIME
```

4. Deploy the worker and Step 6 foreground/background/inbox handling before end-to-end acceptance testing.
5. Configure a Google Cloud Scheduler HTTP job in asia-southeast1:
   - Name: birdman-admin-notification-delivery.
   - Schedule: `* * * * *`; timezone Asia/Kolkata.
   - Method: POST.
   - URL: `https://birdman-web--birdman-7e745.asia-southeast1.hosted.app/api/cron/notification-delivery`.
   - Header: Authorization, value `Bearer <worker secret>`.
   - Attempt deadline: 180 seconds, consistent with the verified hosting timeout.
   - Restrict who can view/edit Scheduler configuration: the custom header contains the shared secret. Rotate the App Hosting secret and Scheduler header together. OIDC can replace this shared-secret integration in a later hardening slice; current code does not accept OIDC tokens.
6. Enable scheduling only after a controlled test. Overlap is handled by leases. Monitor failed/retried counts, backlog and overdue processing leases; job failures can exist even with HTTP 200.

For a local run, configure a dedicated local secret in ignored .env.local, ensure the app uses mock delivery and both emulators, restart it, and POST to the same route at localhost:7001 with the matching authorization header. Do not call dev:live when intending to test mock delivery. No production worker calls have been made.

### Tests

Step 5 validation on 2026-10-14: six targeted suites passed 54 tests, including eight delivery emulator cases plus booking-event/cleanup regression coverage. Changed-file lint and diff checks passed; all five notification TTL definitions are present. Production compilation succeeded, but existing unrelated TypeScript fixture errors still block the complete build. Production FCM delivery, actual Auth/IAM configuration and Scheduler execution remain unverified; no production notifications were sent and nothing was deployed.

Integration tests use isolated demo projects and fake Auth/delivery adapters; no messages are sent and no app records are altered:

```powershell
$env:RUN_NOTIFICATION_EMULATOR_TESTS='true'
npx vitest run --testTimeout=20000 src/lib/firebase/notification-delivery.integration.test.ts src/lib/firebase/notification-delivery-policy.test.ts src/app/api/cron/notification-delivery/route.test.ts
Remove-Item Env:RUN_NOTIFICATION_EMULATOR_TESTS
```

References: [FCM retry guidance](https://firebase.google.com/docs/cloud-messaging/scale-fcm), [FCM error codes](https://firebase.google.com/docs/cloud-messaging/error-codes).

## Step 6 persistent admin inbox

- The header bell reads persisted Firestore history, not a temporary browser array. Opening it refreshes but does not mark read or clear events. Default/max page size is 20, with cursor Previous/Next and Latest navigation.
- `GET /api/admin/notifications?limit=20&cursor=...` returns notification text/type/date, creation time, read status, safe `/admin` navigation and a booking-exists flag. It never returns device tokens, state owner IDs, visitor contact details or complete booking records. Firebase bearer verification checks revocation/disabled users and the Firestore administrator role on every request.
- `PATCH /api/admin/notifications` accepts only `{ ids: [...], action: "read" | "dismiss" }`, at most 20 SHA-256 event IDs and a 4 KiB streamed body. The verified UID is server-owned; the transaction rechecks the role and all events before writes. Unknown/expired events reject the entire batch. Read/dismiss timestamps are idempotent and never extend parent retention.
- Mark page read and individual Mark read/Dismiss actions persist separately for each administrator. Dismiss hides the event only for that administrator; it does not delete shared history, undo a booking or cancel a push already queued. Other devices for the same account see changes on their next refresh.
- Listing orders by creation timestamp and document ID descending, preserving nanosecond cursor precision. It scans at most 100 history rows and looks ahead one; heavily dismissed pages can be empty with Next still available. Expired history is excluded before physical TTL deletion. Removed bookings show an explanatory state instead of failing the inbox.
- Unread count uses Firestore aggregation counts over live history minus that admin's live read states. The new `adminNotificationStates` index covers `uid`, `read`, `expiresAt`; deploy it before production activation. Creation ordering uses the existing automatic descending creation-time/document-ID index. Counts are eventually consistent across these two independent queries and clamped at zero; manually deleting unexpired history can leave read states affecting the count until expiry. Normal application retention does not delete history before expiry.
- Visible admin tabs poll every 30 seconds and refresh on focus/visibility. Requests are aborted/superseded on navigation/account changes; logout clears private inbox state. Polling and the inbox work without notification permission or FCM configuration.
- Foreground FCM is subscribed only after opt-in in FCM mode. Push event IDs trigger an authorized API refresh; push body text is never rendered directly. Bounded event-ID deduplication suppresses repeated refresh signals. No Firebase Messaging network calls are made in mock mode.
- The existing `/sw.js` handles background FCM through its imported same-origin worker configuration. FCM displays notification payloads itself; the background callback does not display them a second time. It signals only same-origin admin windows and deduplicates refresh signals. The sender's event-ID notification tag reduces duplicate visible notifications; it does not guarantee exactly-once delivery.
- Click handling is registered before Firebase initialization. It focuses a same-origin admin window or opens `/admin`; payload URLs cannot redirect visitors to another origin. Every destination still requires normal admin authorization.
- Production FCM display/click behavior still needs a real browser smoke test in Step 7/8; local tests use mocked SDK callbacks and isolated named emulator test databases (not the app's default database). No real notifications were sent or production data changed.

Validation commands:

Step 6 validation on 2026-10-15: nine targeted suites passed 53 tests, including five isolated Firestore emulator inbox cases. Changed-file lint and service-worker syntax checks passed. Live browser FCM display, deployment/index activation and scheduling remain unverified. The complete production build remains blocked by existing unrelated TypeScript test-fixture errors.

```powershell
$env:RUN_NOTIFICATION_EMULATOR_TESTS='true'
npx vitest run --testTimeout=20000 src/lib/firebase/notification-inbox.integration.test.ts src/app/api/admin/notifications/route.test.ts src/components/providers/NotificationProvider.test.tsx src/lib/firebase/notification-worker-click.test.ts src/app/api/notifications/worker/route.test.ts src/lib/firebase/notification-client.test.ts
Remove-Item Env:RUN_NOTIFICATION_EMULATOR_TESTS
```

## Step 7 verification and repeatable tests

The story under test is: administrator sign-in → authorized device registration → booking transaction/event outbox → mock worker/receipts → authorized inbox → browser read/dismiss/pagination → persisted account state.

Run the notification-specific suite after starting the Auth and Firestore emulators:

```powershell
npm run emulators:start
# In a second terminal:
npm run test:notifications:emulator
npm run test:notifications:browser
```

The emulator runner checks loopback ports 7002/7003, forces mock mode, and propagates test failures as a nonzero exit code. It does not load dotenv or production secrets. Integration data uses isolated named test databases; this avoids imported default-database fixtures changing counts. Firestore rules tests explicitly compile/load the checked-in rules into their demo project with Firebase's development-only rules testing library. No application or production rules are deployed.

The browser command uses Chromium and starts its own Next.js server on 127.0.0.1:7101, a separate ignored `.next-notification-tests` build directory, and the `notifications-browser-test` emulator database. It never reuses the running application server. It creates one temporary Auth emulator user and role document and removes only its own fixture IDs/UID/device/state records in `finally`. Synthetic notification fixtures create no delivery jobs; the browser test cannot cause a push to other administrators. Screenshots/traces remain in ignored `test-results`. Browser binaries must be installed. Next.js font compilation requires Google Fonts network access (or usable cached fonts); a restricted environment may emit fallback-font warnings.

### Evidence and scope

| Boundary | Local evidence |
| --- | --- |
| Firebase identity → notification APIs | Real emulator-issued ID tokens; missing, malformed, expired, revoked and disabled tokens rejected; missing/non-admin Firestore roles rejected despite caller role claims |
| Booking → history/outbox | Atomic confirmed/full/changed/cancelled events; failed booking mutations write no alerts; stable event deduplication |
| Outbox → delivery receipts | Mock delivery with real Auth lookups, retries/backoff, invalid-token pruning, lease recovery, concurrent-worker fencing, successful-device retry suppression |
| Direct client → Firestore | Anonymous, ordinary and allowlisted/claim-bearing admins denied get/list/create/update/delete and nested writes on all five notification collections and adminUsers |
| Inbox → account state | Timestamp-tie cursor pagination, immediate expiry exclusion, bounded dismissed scans, independent admin states and unchanged parent retention |
| API response → browser | Chromium real HTTP sign-in/device registration, 20-item Next/Previous, explicit read/dismiss persistence across reload, and device disable/removal |
| Browser async races | Stale requests cannot restore another account's private inbox; duplicate mutations are locked; foreground/background SDK callbacks and event-ID deduplication are mocked, not live FCM |

Testing uncovered a native login-form submission before hydration: without an attached React handler, the old form defaulted to GET, placing credentials in a URL. The login/recovery forms now explicitly use POST, and submit stays disabled until hydration. An SSR regression test verifies both protections. URL status messages now use a hydration-safe external-store snapshot rather than a cascading state effect. The React checklist influenced these changes; normal sign-in/recovery behavior remains covered by tests.

### Rules-only audit assessment

This assessment is limited to the checked-in deny-all direct-client Firestore policy. It is not a claim that the entire application or production IAM configuration is vulnerability-free. No rules were loosened or regenerated.

```json
{
  "score": 5,
  "summary": "No direct-client bypass found in tested notification and adminUsers paths. All client reads and writes are denied; authorized server APIs use Admin SDK and require separate identity, role, ownership and input validation. Production rules and IAM deployment remain unverified.",
  "findings": []
}
```

Create/update bypass, ownership changes, role escalation, extra fields, oversized strings, malformed timestamps, private-token reads and orphaned nested writes were all rejected by the emulator. Since client writes are universally denied, field validators in client rules would not grant or strengthen access; server schemas enforce permitted inputs. Server SDKs bypass security rules, so passing these tests does not replace API authorization tests. [Firebase rules testing documentation](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

### Remaining real-FCM acceptance checklist (Step 7 live portion / Step 8 cutover)

1. Verify notification indexes are READY and all five TTL policies are ACTIVE in birdman-db. The full-build fixture errors are resolved; see the preparation checkpoint below for deployment and IAM evidence.
2. Use a controlled administrator/test device with explicit permission. Verify opt-in and unregister/logout, including blocked/unsupported permission states. Confirm there are no legacy subscriptions unexpectedly receiving messages.
3. Generate controlled confirmed, changed, cancelled and capacity-full events. Verify foreground inbox refresh, background OS display, closed-tab delivery and safe click navigation on a real supported browser.
4. Verify generic lock-screen text contains no visitor name/email/phone. Verify another administrator's read/dismiss state is independent and the same account's other tab reflects changes after refresh.
5. Verify scheduler calls the protected worker, unauthorized requests are denied, backlog drains, successful receipts prevent ordinary retries, and invalid registrations are pruned. Do not interpret FCM acceptance as guaranteed display or read.
6. Record actual deployed SHA, browser/device, API responses, job/receipt outcomes, policy/index status and results. Only then mark live acceptance complete and retire legacy push code in Step 8. No deployment, production worker call or real push has been performed by this local test phase.

Step 7 local validation on 2026-10-15: 20 targeted suites passed 138 tests, including real Auth/Firestore integration, direct-client rule denials and concurrent worker fencing. One Chromium end-to-end test passed against the isolated Next.js app with actual HTTP notification APIs. Changed-file lint and diff checks passed. Production compilation succeeded; existing unrelated TypeScript test-fixture errors still block the full build. No production data was changed, no real push was sent and nothing was deployed.

### Production preparation checkpoint - 2026-10-16

- Full production build, including TypeScript and static-page generation, passed. An additional 14 targeted suites passed 178 tests for booking security, email, gallery Storage helpers, and calendar settings.
- Changed-file lint is not fully green: two pre-existing `react-hooks/set-state-in-effect` errors remain in `BookingClient.tsx` and `BookingStatusClient.tsx`, plus seven unused-variable warnings in test mocks/service-worker catches. The flagged effect bodies also exist at the pre-release HEAD; they were not introduced by this V2 diff.
- Deployed the three notification composite indexes and all five notification TTL policies to `birdman-db`. Immediately after deployment they were `CREATING`; confirm `READY`/`ACTIVE` before live acceptance. TTL deletes expired notification records, not bookings.
- Corrected TTL field overrides to include explicit ascending/descending single-field indexes, retaining cleanup queries. Removed the redundant gallery `uploadedAt DESC, __name__ DESC` composite definition rejected by the production API; Firestore's automatic single-field index supports that ordering.
- Confirmed the App Hosting runtime account is `firebase-app-hosting-compute@birdman-7e745.iam.gserviceaccount.com`. Its existing `roles/firebase.sdkAdminServiceAgent` role includes FCM send permission; no extra messaging role was added.
- Confirmed App Hosting automatically deploys pushes to `firebase-hosting`. The Cloud Scheduler API is disabled; no scheduler was activated, worker invoked, or real FCM push sent during this preparation.
- The backend CLI unexpectedly returned plaintext SMTP and worker credentials from console environment overrides. Rotate the SMTP app password and `NOTIFICATIONS_WORKER_SECRET`, and store replacements in Secret Manager before activating delivery. Do not copy credential values into Git, documentation, or logs.
- Production browser/device acceptance, backlog review, scheduler setup, and legacy push retirement remain pending. This checkpoint does not certify the entire application as production-ready.
