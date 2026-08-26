# Firebase Notifications Migration Roadmap

This document defines the next Firebase migration phase for transactional email,
scheduled reminders, and administrator browser push notifications.

**Phase:** 2 — Notifications and delivery reliability

**Status:** Planned. Immediate production email configuration repair is required.

**Firebase project:** `birdman-7e745`

**Production Firestore database:** `birdman-db`

## Confirmed production incident

Cloud Run logs for App Hosting revision `birdman-web-build-2026-08-18-001`
confirm that booking confirmation and cancellation email attempts reach the
email service but fail with:

```text
[Email Service] Missing GMAIL_USER or GMAIL_PASS environment variables
```

The Firestore booking write succeeds first. Email delivery is intentionally
non-blocking, so the booking API can return success while `emailSent` and the
Firestore `confirmationSent` field remain false.

## Immediate production recovery

1. Create or update the two production secrets. Enter only the Gmail address
   and its Google App Password; do not use the normal account password.

   ```powershell
   npx firebase-tools apphosting:secrets:set GMAIL_USER --project birdman-7e745
   npx firebase-tools apphosting:secrets:set GMAIL_PASS --project birdman-7e745
   ```

2. Grant the `birdman-web` App Hosting backend access when prompted.
3. Bind both secret names to runtime variables with the exact names
   `GMAIL_USER` and `GMAIL_PASS` in App Hosting backend settings. When the root
   production `apphosting.yaml` becomes the complete source of truth, use:

   ```yaml
   env:
     - variable: GMAIL_USER
       secret: GMAIL_USER
       availability:
         - RUNTIME
     - variable: GMAIL_PASS
       secret: GMAIL_PASS
       availability:
         - RUNTIME
   ```

   Do not introduce a partial production `apphosting.yaml` until all existing
   production variables have been mapped, because it could drop configuration
   required by other features.
4. Configure optional sender values as ordinary runtime variables:

   ```text
   EMAIL_FROM=Birdman of Chennai <the-same-authorized-gmail-address>
   EMAIL_CC=
   ```

5. Create a new App Hosting rollout. A running revision does not acquire newly
   added variables automatically.
6. Submit one controlled production booking and verify all four signals:

   - The response contains `emailSent: true`.
   - The booking has `confirmationSent: true` in `birdman-db`.
   - Cloud Run logs contain a successful provider message ID.
   - The message arrives in the recipient inbox or spam folder with the same
     booking code shown by the website.

Never print secret values in application, build, or deployment logs.

## Target architecture

Firestore booking transactions remain the source of truth. Notification
delivery becomes a separate, retryable pipeline so a transient provider outage
does not lose a message and does not roll back a valid booking.

Use a server-owned `notificationJobs` collection with documents containing:

- `channel`: `email` or `webPush`.
- `type`: `bookingConfirmation`, `bookingRescheduled`, `bookingCancelled`,
  `bookingReminder`, `adminNewBooking`, or another reviewed event.
- `bookingId` and optional administrator UID.
- A minimal template payload; do not copy unnecessary booking personal data.
- `status`: `pending`, `processing`, `sent`, `failed`, or `deadLetter`.
- `attempts`, `scheduledAt`, `lastAttemptAt`, `sentAt`, and `lastErrorCode`.
- `providerMessageId` when delivery succeeds.
- A unique `idempotencyKey` to prevent duplicate sends.
- Server-generated `createdAt` and `updatedAt` timestamps.

Clients receive no direct access to notification jobs or push subscriptions.
All reads and writes occur through privileged server code.

## Phase 2A — Stabilize transactional email

- Restore the missing App Hosting secrets and complete the immediate smoke test.
- Add startup/runtime configuration validation that reports missing variable
  names without exposing values.
- Put email delivery behind a provider interface so Gmail SMTP can be replaced
  without changing booking APIs.
- Decide on the production transport. Gmail SMTP can remain the short-term
  recovery transport; a verified-domain transactional provider is preferred
  for production deliverability, rate limits, and provider event reporting.
- Keep Firebase Authentication password-reset email managed by Firebase Auth;
  it is separate from custom booking emails.
- Add structured delivery logs containing notification type, booking ID,
  attempt number, provider result, and a correlation ID—never the email body,
  password, or complete recipient address.

**Exit criteria:** confirmation, reschedule, cancellation, and bulk-closure
emails pass production smoke tests and failures are observable.

## Phase 2B — Firestore outbox and retry worker

- Create a notification job atomically with, or immediately after, each booking
  state transition using a deterministic idempotency key.
- Deliver jobs from a Firebase/Google-managed worker rather than relying on
  unawaited work after an App Hosting response.
- Use bounded exponential retry for transient errors and move permanent or
  exhausted failures to `deadLetter`.
- Make workers transactionally claim jobs so concurrent instances cannot send
  the same message twice.
- Add an administrator retry action for dead-letter jobs without exposing
  provider credentials.
- Retain only the minimum delivery metadata required for support and auditing.

**Exit criteria:** a forced provider failure retries successfully without
duplicating an email or altering the booking.

## Phase 2C — Migrate reminders to Firestore

- Replace the Postgres calls in `GET /api/cron/send-reminders` with a Firestore
  query over eligible confirmed bookings.
- Define the reminder policy explicitly, including India timezone, send window,
  cancellation/reschedule behavior, and whether the reminder is same-day or
  24 hours before the visit.
- Use Cloud Scheduler to invoke a protected worker, or use a scheduled Cloud
  Function. Do not rely on the obsolete Vercel Cron comment/configuration.
- Store reminder jobs with deterministic keys and update `reminderSent` and
  `reminderSentAt` only after confirmed delivery.
- Authenticate scheduler calls with service identity where possible. If an HTTP
  secret remains, accept it only in an authorization header and rotate it.

**Exit criteria:** the scheduled production run reads only `birdman-db`, sends
each eligible reminder once, and produces a visible execution result.

## Phase 2D — Move browser push subscriptions to Firestore

- Preserve standards-based Web Push and VAPID initially; adopting Firebase
  Cloud Messaging is optional and not required for the migration.
- Store subscriptions under
  `adminPushSubscriptions/{uid}/subscriptions/{subscriptionId}` with endpoint,
  encrypted subscription payload, timestamps, user-agent summary, and VAPID
  key version.
- Require a valid Firebase administrator bearer token for subscribe,
  unsubscribe, list-own-devices, and test operations.
- Replace all `push_subscriptions` Postgres reads, inserts, deletes, and runtime
  table creation.
- Prune subscriptions when push services return `404` or `410`.
- If the production origin and VAPID key remain unchanged, migrate valid legacy
  subscriptions once. Otherwise require administrators to grant permission and
  subscribe again.
- Queue admin push jobs through the same outbox so booking creation is never
  delayed by push delivery.

**Exit criteria:** a signed-in administrator can subscribe multiple devices,
receive test and new-booking notifications, unsubscribe, and lose no booking
when push delivery fails.

## Phase 2E — Operations, security, and retirement

- Add delivery dashboards/alerts for missing configuration, failure rate,
  dead-letter count, reminder execution, and absence of active admin devices.
- Add retention cleanup for old sent jobs and stale subscriptions.
- Add rate limits to administrative test-send operations.
- Verify email links and push URLs always use the production HTTPS origin.
- Remove the Postgres push-subscription schema and queries only after a
  production observation period and successful migration/renewal of devices.
- Remove `DATABASE_URL` only when no other active feature or maintenance script
  depends on Postgres.
- Update the App Hosting release runbook and incident/rollback documentation.

## Test plan

- Unit-test every email template and provider result mapping.
- Test missing configuration, authentication rejection, transient retry,
  permanent failure, dead-letter handling, and idempotency.
- Test confirmation, reschedule, cancellation, bulk cancellation, and reminder
  event creation from Firestore bookings.
- Test reminder timezone boundaries and reschedule/cancellation races.
- Test push subscribe, duplicate subscription replacement, multi-device
  delivery, unsubscribe, expired subscription pruning, and non-admin rejection.
- Confirm direct Firestore client access to jobs and subscriptions fails.
- Run emulator integration tests, lint, the complete unit suite, and production
  build before rollout.
- In production, use controlled recipient/admin devices and verify provider,
  Cloud Run/Function, Firestore, browser, and inbox evidence end to end.

## Definition of done

Phase 2 is complete only when:

- No active email, reminder, or push path reads or writes Postgres.
- All custom notifications originate from Firestore-backed events/jobs.
- Booking writes remain successful during notification-provider outages.
- Duplicate event delivery is prevented by tested idempotency keys.
- Failures retry, become visible, and can be safely replayed.
- Production smoke tests and monitoring remain healthy through the agreed
  observation period.

