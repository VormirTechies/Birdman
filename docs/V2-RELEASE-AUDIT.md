# V2 release audit

Date: 2026-10-14 (Asia/Calcutta)
Branch: firebase-hosting
Reviewed commit: df6284a
Decision: hold v2 release until critical/high findings are resolved and release checks pass.

This is a source and dependency review, with targeted mocked API tests. It does not establish that a breach occurred. Production IAM, deployed rules, secret revocation, scheduler jobs, email delivery and complete browser flows were not verified in this audit. No production mutations were performed.

## Security findings

### S1 — Critical dependency findings

WebSocket follow-up on 2026-10-14: moved the React Email preview CLI (`react-email`) to devDependencies while keeping the production render/component libraries. Refreshed the affected dependency chain without overrides: Socket.IO 4.8.4, Engine.IO 6.6.11, socket.io-parser 4.2.7, socket.io-adapter 2.5.8, and ws 8.21.3 for preview / 8.22.0 for Supabase. Neither production nor full-development audits now flag ws, engine.io, or socket.io-parser. Production audit totals are 19 entries (0 critical, 8 high, 10 moderate, 1 low); moving the preview CLI also removes its other development-only findings from the production count. The actual five email templates render successfully and escape visitor input. Supabase remains installed for unmigrated legacy features. Production compilation succeeds, but existing unrelated test-fixture TypeScript errors continue to block the build. Use the committed lockfile with npm ci; no deployment was performed.

Follow-up remediation on 2026-10-14: Nodemailer upgraded from 8.0.4 to 10.1.1 and Drizzle ORM from 0.45.1 to 0.45.4 (manifest minimum 0.45.2). The email service now validates single recipients and configured CC addresses, rejects control characters, uses structured recipient addresses, and disables file/URL content access. The unused legacy verification sender also validates its six-digit code before HTML interpolation. The production audit no longer flags either package: 26 entries remain (0 critical, 12 high, 11 moderate, 3 low). Six targeted suites passed 67 tests, including real in-memory Nodemailer message generation without SMTP, content-access rejection, and Drizzle PostgreSQL identifier/value escaping. Changed-file lint and diff checks passed. Production compilation succeeded; existing unrelated test-fixture TypeScript errors still block the build. No real email delivery, live Postgres operations, production deployment, or secret changes were performed. Remaining dependency findings and the reminder/push Firestore migration are still pending.

Remediation on 2026-10-14: upgraded Next.js and eslint-config-next to 16.4.0 and Sharp to 0.35.5; refreshed package-lock.json. The follow-up production audit reports 28 entries (0 critical, 14 high, 11 moderate, 3 low). Four targeted suites passed all 18 tests, including actual Sharp conversion, orientation, no-upscaling and invalid-image checks. Production compilation succeeded, but the build remains blocked by the existing test-fixture TypeScript errors described in M6. These dependency changes have not been deployed; production remains unverified until a successful rollout.

`npm audit --omit=dev --json` reports 33 affected production dependency entries: 1 critical, 17 high, 12 moderate and 3 low. Entries can include transitive dependency chains and do not represent 33 proven exploitable paths. Next.js is pinned to 16.2.1. The maintainer's AVIF image-optimization RCE advisory includes this version. Image optimization is used by this app; exploitability was not tested.

References: package.json, package-lock.json, next.config.ts; https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4

Action: review reachability and upgrade to patched supported versions with tests. Do not apply a blanket forced audit fix; the reported Firebase fix proposes a major downgrade and requires review. Review sharp, nodemailer, Firebase/Admin dependencies and legacy packages too.

### S2 — High: calendar maintenance allows access when secret is absent

Remediation on 2026-10-14: the route now denies missing, empty or whitespace-only CRON_SECRET and missing/mismatched bearer authorization before any database access. Replaced obsolete PostgreSQL mocks with Firestore service mocks; all 10 tests and focused lint passed. Valid credentials preserve maintenance behavior. This fix is local and requires deployment; ensure the scheduler sends the configured bearer secret.

`src/app/api/cron/calendar-maintenance/route.ts:15` checks authorization only if CRON_SECRET exists. With no configured secret, an unauthenticated GET can delete past calendar settings and add a future setting through the Admin SDK.

Action: require the secret, deny missing/mismatched credentials, and test all three cases. Whether production currently has the secret was not checked.

### S3 — High: booking self-service uses contact details as authorization without rate limiting

Product decision and remediation on 2026-10-14: retain booking code plus original email/phone without OTP, per user requirements. Verification now checks country-code-safe contact matching and is repeated inside edit/cancel transactions. Persistent Firestore attempt limits cover creation and all self-service verbs; errors do not distinguish nonexistent code from wrong contact. Public bookings and edits also enforce a 25-guest contact/date quota including children, with a 10-guest per-booking cap. The phone for larger groups is held in a server-only environment variable. Identity remains knowledge-based: someone who already knows both values can still manage the booking. Users changing both contact fields or IPs cannot be identified as the same individual. See BOOKING-CONTACT-LIMITS.md. Changes are local and have not been deployed.

`src/app/api/bookings/self-service/route.ts:122` accepts a sequential booking number plus email or phone, then permits reads/rescheduling/cancellation. Phone matching discards all but the last 10 digits. `src/proxy.ts` limits only public booking creation and feedback POSTs, leaving self-service POST/PATCH/DELETE unthrottled. Contact details can be known to someone other than the visitor.

Action: require an expiring signed management token or email/phone verification for mutations; rate-limit lookup and mutation attempts. Keep public DTO masking and generic failure responses.

### S4 — High: historical private-key material and tracked personal data

Git inspection finds a private-key marker in `6ab4201:vercel-env-template.env`. That file is absent from the current branch, but removal does not remove history. Revocation and validity were not checked. `supabase-export/bookings-final.csv` and `supabase-export/visitors.csv` remain tracked despite ignore rules.

Action: confirm the exposed key was revoked, review its access history, and remove unnecessary tracked personal exports. Coordinate any Git history rewrite separately. Never reproduce key values in reports.

### S5 — Medium: revoked/disabled-user tokens are not checked

`src/lib/require-admin.ts:33` calls verifyIdToken(token) without the revocation check. An issued token may remain accepted until expiration if the admin role document remains present after disabling/revoking the user. Role-document removal is checked per request.

Action: use verifyIdToken(token, true) and test disabled/revoked accounts. Reference: https://firebase.google.com/docs/auth/admin/manage-sessions

### S6 — Medium: temporary import/debug routes remain in release

The admin import route is protected, but remains enabled for all administrators and scans all bookings inside a transaction. Imported-row matching is proportional to CSV rows times existing bookings. The debug health GET accepts CRON_SECRET in its URL, returns internal error text, and writes `_debug/firebase-health`.

Action: retire or explicitly gate temporary tools; remove URL secret authentication and mutating health checks. Preserve offline CLI migration if required.

### S7 — Medium: request-size and abuse limits are inconsistent

Gallery upload parses multipart data and materializes file bytes before enforcing the 5 MB limit. Public JSON handlers parse request bodies before field length validation. Booking/feedback throttles are disabled without Upstash configuration and allow requests when the limiter fails. The booking schema accepts a website honeypot, but the submit handler does not reject a populated value.

Action: enforce bounded body/file sizes before buffering, handle booking honeypot submissions, and define a tested production fallback for limiter failures. Verify trusted proxy IP handling in deployment.

## Migration and business-logic gaps

### M1 — High: maintenance changes have not reached this branch

`main` commit 8e5c79a pauses `/book` and POST `/api/bookings`. `firebase-hosting` lacks this gate. Deploying this branch before migration completion can reopen bookings.

Action: bring the maintenance implementation into the Firebase branch deliberately; preserve it until cutover is approved.

### M2 — High: public booking window and session time are not server-owned

The UI enforces 30 days ahead (`BookingClient.tsx:95`). The server schema validates date format, not that window. `booking-mappers.ts:48` persists the submitted bookingTime while cutoff validation uses the calendar setting's startTime. Modified requests can book beyond the UI window or store a different session time.

Action: enforce the agreed public window in the API/repository, and derive or verify the session time from the date's settings. Apply equivalent rules to public rescheduling. Preserve administrative overrides where intended.

### M3 — High: visitor/check-in data is not maintained by the booking workflow

Both creation routes omit visitorId; the mapper defaults it to null. Updating visited/VIP flags changes the booking document only. The repository does not create visitor_checkins or update visitors.totalVisits/visit dates, though visitor administration reads those collections.

Action: define and implement transactional visitor linkage, check-in transitions and idempotent visit-stat updates. Include repeated check-in/uncheck/delete tests and legacy linkage backfill.

### M4 — High: notifications are still coupled to legacy infrastructure

`src/app/api/cron/send-reminders/route.ts:3` queries and updates PostgreSQL, so it does not process new Firestore bookings. Push subscription storage and broadcast still use Drizzle/Postgres. Scheduling is recorded in vercel.json; a Firebase App Hosting scheduler job was not verified. Reminder date calculation uses UTC. Public cancellation/reschedule email promises are started without awaiting delivery and can be interrupted after response. Confirmation failure has no durable retry flow.

Action: migrate reminders/push storage, configure and verify scheduling in the deployed platform, use India calendar dates, and implement durable delivery/retry with idempotency.

### M5 — Medium: unsafe legacy seed command remains

`npm run seed:bookings` still uses DATABASE_URL and inserts dummy rows into PostgreSQL. It has no emulator target guard.

Action: archive/rename the command and provide an explicit emulator-only Firestore seeder.

### M6 — High release gate: tests/types/CI are not clean

Seven targeted API suites passed all 34 tests. Full TypeScript checking fails on stale generated routes after switching branches and real outdated test fixtures/types (admin settings, checklist, visitor components, gallery/history pages and feedback tests). Clearing generated artifacts will not repair those real type errors. The workflow triggers for main/develop only, so direct firebase-hosting pushes bypass this configured CI trigger.

Action: regenerate branch-specific route artifacts, fix real type errors, enable CI for the release branch, and require lint/unit/emulator-rule/integration/build/browser smoke checks before release.

## Firebase rules assessment

Static assessment only. Firestore denies every client read/write; Storage exposes only intentional public gallery reads and denies client writes. There is no client role self-assignment or create/update rule bypass in these files. Admin SDK access bypasses rules, so this rating does not cover API authorization, IAM or deployed-rule drift.

```json
{
  "score": 5,
  "summary": "Checked-in client-access rules deny all Firestore access and all Storage writes; intentional gallery reads are public. API and deployed configuration security are outside this static rules score.",
  "findings": []
}
```

## Recommended order

1. Close unauthenticated cron access; verify historical key revocation; patch dependencies.
2. Carry the maintenance gate across and protect booking self-service and admin token revocation.
3. Enforce server-owned booking dates/session time and complete visitor/check-in integration.
4. Complete or explicitly exclude reminders/push from v2 with a documented product decision.
5. Gate temporary tools, retire legacy seed commands, and remove tracked personal exports.
6. Repair CI/type errors and run full emulator and deployed smoke checks with controlled test data.

No code fixes, deployment changes, credential revocations or production security probes were performed as part of this report.
