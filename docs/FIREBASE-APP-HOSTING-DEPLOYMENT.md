# Firebase Migration v1.0 Production Release Playbook

This runbook releases the first production Firebase migration for the Birdman
Next.js application on Firebase App Hosting.

**Release version:** `1.0.0`

**Release status:** Release candidate — do not mark production-ready until every
required gate and smoke test in this document has passed.

**Firebase scope:** Authentication, Feedback, Gallery, Bookings, and Calendar.

## v1.0 scope and acceptance

| Slice | Production system | Included in v1.0 |
| --- | --- | --- |
| Administrator identity | Firebase Authentication | Sign-in, sign-out, forgot/reset password, in-session password change, user creation, and user listing |
| Administrator authorization | `birdman-db/adminUsers/{uid}` | Server-side `role: "admin"` lookup for every protected API |
| Feedback | `birdman-db/feedback` | Public submission/listing, moderation, cursor pagination, recommendation limit, and homepage Visitor Reviews |
| Gallery metadata | `birdman-db/gallery` | Public/admin cursor listing and metadata management |
| Gallery media | Firebase Storage `gallery/public/**` | Optimized display WebP, thumbnail WebP, upload, public read, and deletion |
| Bookings | `birdman-db/bookings` | Public/admin creation, self-service changes, cancellation, listing, and status management |
| Booking capacity | `birdman-db/bookingDays/{yyyy-mm-dd}` | Transactional confirmed-guest totals used to prevent overbooking |
| Booking numbers | `birdman-db/_counters/bookings` | Monotonic server-owned booking-number allocation |
| Calendar | `birdman-db/calendar_settings` | Availability settings, monthly capacity totals, day details, and bulk closures |

The following are deliberately outside this Firebase v1.0 cutover:

- Email delivery hardening, Firestore reminder scheduling, and push-notification
  migration. These are tracked as Phase 2 in
  [FIREBASE-NOTIFICATIONS-ROADMAP.md](./FIREBASE-NOTIFICATIONS-ROADMAP.md).
- Historical Supabase gallery import while the source quota issue remains.
- Meiyazhagan and Story video migration.
- A Firebase-hosted gallery hero video; the local fallback remains active.
- Removal of Supabase/Postgres dependencies still used by non-v1.0 features.

### Release approval record

Complete this immediately before the live rollout:

```text
Release commit: ______________________________
Release operator: ____________________________
Rules/indexes deployed at: ___________________
Production gallery seeded at: _______________
App Hosting rollout ID: ______________________
Smoke tests completed at: ____________________
Rollback owner: ______________________________
```

## Production targets

- Firebase project: `birdman-7e745`
- Firestore database: `birdman-db`
- Firestore edition: Standard
- Firestore region: `asia-southeast1`
- Storage bucket: `birdman-7e745.firebasestorage.app`
- Local Firestore database: `(default)`

## 1. Review and commit the working tree

Review all intended changes before committing. The v1.0 commit must contain the
Authentication, Feedback, Gallery, Bookings, and Calendar Firebase migrations
together.

```powershell
git status
git diff --check
git diff
```

When everything is correct:

```powershell
git add .
git commit -m "Release Firebase migration v1.0"
```

Do not push to the App Hosting live branch yet if automatic rollouts are
enabled.

## 2. Verify Firebase resources

Confirm that the CLI is using the correct project and that the named production
database exists:

```powershell
npx firebase-tools use birdman-7e745
npx firebase-tools firestore:databases:get birdman-db --project birdman-7e745
```

Confirm the following values in the output:

- Database ID is `birdman-db`.
- Edition is `STANDARD`.
- Location is `asia-southeast1`.

The named database has been provisioned, but gallery documents will not exist
until the production seed or migration is run.

## 3. Configure App Hosting environment variables

The repository currently contains `apphosting.emulator.yaml`, which is only for
local emulation. Never copy its emulator hosts or `(default)` database ID into
production. Local `.env.production` is ignored by Git and is not the production
App Hosting configuration.

The root production `apphosting.yaml`, when introduced, is the source-controlled
source of truth for the backend. Until every existing application variable and
secret has been mapped into that file, preserve and verify the current App
Hosting backend settings in the Firebase Console. Adding a partial production
file that drops legacy variables can break non-v1.0 features.

Open:

**Firebase Console → App Hosting → Backend → Settings → Environment variables**

Add these non-secret production values:

| Variable | Value | Availability |
| --- | --- | --- |
| `FIRESTORE_DATABASE_ID` | `birdman-db` | Runtime |
| `FIREBASE_STORAGE_BUCKET` | `birdman-7e745.firebasestorage.app` | Runtime |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `birdman-7e745` | Build and Runtime |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `birdman-7e745.firebasestorage.app` | Build and Runtime |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Value from the `birdman-7e745` Web App | Build and Runtime |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Value from the Firebase Web App | Build and Runtime |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Value from the Firebase Web App | Build and Runtime |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Value from the Firebase Web App | Build and Runtime |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Web App value, if Analytics is enabled | Build and Runtime |
| `NEXT_PUBLIC_BASE_URL` | Final HTTPS application domain | Build and Runtime |

Do not configure emulator variables in production:

```text
FIRESTORE_EMULATOR_HOST
FIREBASE_STORAGE_EMULATOR_HOST
STORAGE_EMULATOR_HOST
NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL
```

Do not upload `FIREBASE_PRIVATE_KEY` or `FIREBASE_CLIENT_EMAIL` to App Hosting.
The deployed Admin SDK should use App Hosting's Google service identity.

Reference: [Configure App Hosting](https://firebase.google.com/docs/app-hosting/configure)

## 4. Preserve existing application configuration

Several active application features still use Postgres, Supabase, Upstash,
email, cron, and web-push services. Preserve all existing production values.

Store sensitive values through App Hosting secrets or Google Secret Manager:

```text
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GMAIL_USER
GMAIL_PASS
CRON_SECRET
VAPID_PRIVATE_KEY
```

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are required for the
production feedback submission limit of three requests per IP per hour. The
application deliberately fails open if Upstash is unavailable, so a successful
feedback submission alone does not prove that rate limiting is active. Verify
the Upstash analytics/prefix `birdman:feedback` after the smoke test.

Preserve applicable public or non-secret configuration:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
NEXT_PUBLIC_MAP_LINK
EMAIL_FROM
EMAIL_CC
```

App Hosting requires the Blaze billing plan. Configure a billing budget alert
before the production rollout.

Reference: [Get started with App Hosting](https://firebase.google.com/docs/app-hosting/get-started)

## 5. Deploy Firestore and Storage configuration

Deploy the named-database rules, indexes, and Storage rules before deploying the
application:

```powershell
npx firebase-tools deploy --only "firestore:rules,firestore:indexes,storage" --config firebase.json --project birdman-7e745
```

Then inspect the named-database indexes:

```powershell
npx firebase-tools firestore:indexes --database=birdman-db --project birdman-7e745
```

Wait until required indexes are ready before rolling out the application.

Confirm the required composite indexes are present and ready:

- `feedback`: `status ASC`, `createdAt DESC`, `__name__ DESC`.
- `gallery`: `uploadedAt DESC`, `__name__ DESC`.
- `bookings`: `status ASC`, `bookingDate ASC`.
- `bookings`: `status ASC`, `createdAt DESC`.
- `bookings`: `visited ASC`, `bookingDate ASC`.
- `bookings`: `bookingDate ASC`, `bookingTime ASC`.

Also confirm the configured single-field exemptions for private/large fields,
including feedback `email` and `message`, and gallery caption/Storage paths.

The deployed rules should provide these behaviors:

- All direct Firestore reads and writes are denied.
- Public Storage reads are allowed only below `gallery/public/**`.
- All client Storage writes are denied.
- Server-side Admin SDK operations continue through IAM.

The Firebase CLI currently warns that `auth.authorizedDomains` in
`firebase.json` is an unknown property. Configure Authentication providers and
domains through the Firebase Console rather than relying on that configuration
section.

References:

- [Manage Firestore databases](https://firebase.google.com/docs/firestore/manage-databases)
- [Deploy Firebase Security Rules](https://firebase.google.com/docs/rules/manage-deploy)

## 6. Apply Firebase Storage CORS

Review `firebase-storage-cors.json`. Add every deployed origin that should load
Storage media directly, including the generated App Hosting domain if it will
be used alongside the custom domain.

Apply the configuration using Google Cloud CLI:

```powershell
gcloud storage buckets update gs://birdman-7e745.firebasestorage.app --cors-file=firebase-storage-cors.json
```

Alternatively:

```powershell
gsutil cors set firebase-storage-cors.json gs://birdman-7e745.firebasestorage.app
```

Reference: [Download Firebase Storage files on the web](https://firebase.google.com/docs/storage/web/download-files)

## 7. Configure Firebase Authentication

In Firebase Console:

1. Open **Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Open **Authentication → Settings → Authorized domains**.
4. Add the generated App Hosting domain.
5. Add `www.parrotsudarson.org` and every other production custom domain.
6. Configure the password-reset template action URL as:
   `https://www.parrotsudarson.org/admin/reset-password`.

Reference: [Firebase password authentication](https://firebase.google.com/docs/auth/web/password-auth)

For every administrator:

1. Create or verify the user in Firebase Authentication.
2. Copy the Firebase UID.
3. Open the `birdman-db` Firestore database.
4. Create `adminUsers/{uid}` with:

```json
{
  "role": "admin",
  "displayName": "Administrator Name"
}
```

A Firebase user without this role document can authenticate but will receive
`403 Forbidden` from protected administrator APIs.

Custom claims such as `{ "role": "admin" }` do not grant access in v1.0. The
Firestore `adminUsers/{uid}` document is the only administrator allowlist used
by the server.

### Seed production administrators from a local file

For several administrators, create this ignored local file:
`.firebase/production-admin-users.json`.

```json
[
  {
    "email": "admin.one@example.com",
    "displayName": "First Administrator",
    "password": "ReplaceWithAStrongPassword1"
  },
  {
    "email": "existing.admin@example.com",
    "displayName": "Existing Administrator"
  }
]
```

The password is required only when the Firebase Authentication user does not
already exist. Existing users are found by email and their password is never
changed. The seed file is under `.firebase/`, which is excluded by `.gitignore`;
never commit it.

Authenticate Application Default Credentials if needed:

```powershell
gcloud auth application-default login
```

Remove emulator variables and run the guarded production seed:

```powershell
Remove-Item Env:FIREBASE_AUTH_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:FIREBASE_STORAGE_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:STORAGE_EMULATOR_HOST -ErrorAction SilentlyContinue
npm run seed:auth:production -- --confirm-production
```

To use a different ignored JSON file:

```powershell
npm run seed:auth:production -- --confirm-production --users-file C:\secure\production-admin-users.json
```

The command is idempotent, targets project `birdman-7e745` and database
`birdman-db`, creates missing Auth users, and writes `adminUsers/{uid}` with
`role: "admin"`. It refuses emulator hosts and conflicting project/database
environment variables.

## 8. Verify the production feedback cutover

Feedback does not require a production seed. The `feedback` collection is
created by the first successful public submission.

Before rollout, confirm these implementation contracts:

- `POST /api/feedback` validates name, email, and a 20–500 character message.
- New submissions always write `status: "pending"` and server-owned timestamps.
- The honeypot receives a generic success response without writing a document.
- `GET /api/feedback` returns only approved records with cursor pagination.
- Public responses contain `id`, `name`, `message`, and `createdAt`; email is
  never returned.
- Admin pending and approved tabs use ten-record cursor pages.
- Approve changes pending feedback to approved; reject/delete removes it.
- Only approved feedback can be recommended, and at most five can be
  recommended at once.
- Homepage Visitor Reviews contain only recommended approved feedback.

Do not create an empty collection manually. Use one production smoke-test
submission after the application rollout, moderate it through `/admin/feedback`,
and delete it when verification is complete.

## 9. Seed the production gallery

If Application Default Credentials are not configured locally:

```powershell
gcloud auth application-default login
```

Remove emulator variables from the current terminal before running any
production seed:

```powershell
Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:FIREBASE_STORAGE_EMULATOR_HOST -ErrorAction SilentlyContinue
Remove-Item Env:STORAGE_EMULATOR_HOST -ErrorAction SilentlyContinue
```

Seed the 18 checked-in gallery images:

```powershell
npm run seed:gallery:production -- --confirm-production
```

The seed is idempotent. Existing records with matching checksums or legacy IDs
are skipped.

Verify the result in Firebase Console:

- `birdman-db` contains the `gallery` collection.
- Storage contains `gallery/public/{documentId}/image.webp`.
- Storage contains `gallery/public/{documentId}/thumbnail.webp`.

Do not run the deferred Supabase migration until the source quota problem has
been resolved.

## 10. Reconcile booking capacity before cutover

The booking APIs reserve and release seats transactionally through
`bookingDays/{date}`. Existing booking documents must therefore be reconciled
before the Firebase-backed application is deployed. This step is mandatory even
when the migration/import command reports success.

If legacy bookings still need to be imported, run the guarded migration first.
Use its dry-run mode and review its report before allowing production writes.
After import, audit the derived counters without writing:

```powershell
Remove-Item Env:FIRESTORE_EMULATOR_HOST -ErrorAction SilentlyContinue
npm run reconcile:bookings:production -- --dry-run
```

Review every reported date and the proposed booking-number counter. Then apply
the repair explicitly:

```powershell
npm run reconcile:bookings:production -- --confirm-production
```

The production command is pinned to project `birdman-7e745` and database
`birdman-db`, refuses an emulator host, and will not write without
`--confirm-production`. It derives capacity only from `status: "confirmed"`
bookings, never decreases `_counters/bookings.value`, and backfills the
server-owned six-digit public `bookingCode` (for example, `#000023`) from each
numeric `bookingNumber`.

Use this order for the live cutover:

1. Deploy Firestore rules and indexes, and wait for all indexes to become ready.
2. Import legacy booking documents if required.
3. Run the production reconciliation and confirm no unexpected differences.
4. Deploy the App Hosting application.
5. Immediately run the dry-run audit again; it should report zero differences.

For local verification, start the emulator and run:

```powershell
npm run reconcile:bookings:emulator -- --dry-run
npm run reconcile:bookings:emulator
```

Do not commit booking CSV exports, reconciliation output containing visitor
details, or generated emulator persistence data.

## 11. Clean the production source

App Hosting builds from the Git repository. Files ignored by Git remain local,
but tracked files are included in the source checkout used for the build even
when they are not part of the final Next.js runtime bundle.

### Remove tracked generated files

The following tracked files are generated output or temporary notes and are not
needed in production:

```text
build-output.txt
reset-test-output.txt
test-current.txt
test-output-verbose.txt
newreq.txt
src/lib/hooks/useRealtimeBookings.ts.backup
```

Remove them from the repository:

```powershell
git rm build-output.txt reset-test-output.txt test-current.txt test-output-verbose.txt newreq.txt
git rm src/lib/hooks/useRealtimeBookings.ts.backup
```

Add the generated output filenames to `.gitignore` so they are not accidentally
committed again.

### Remove unused starter assets

These default Next.js starter SVG files currently have no references in the
application:

```text
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
```

Remove them:

```powershell
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

### Remove Supabase exports from Git

The following files are currently tracked even though `supabase-export/` is in
`.gitignore`:

```text
supabase-export/bookings-final.csv
supabase-export/calendar_settings.csv
supabase-export/visitors.csv
```

These exports may contain visitor names, phone numbers, email addresses, and
booking information. They must not be included in the App Hosting source or
remain in the active repository.

Keep the files locally while removing them from Git tracking:

```powershell
git rm --cached -r supabase-export
```

Because these files were previously committed, removing them from the latest
commit does not remove them from Git history. If the repository is public or
broadly accessible, clean the history with `git filter-repo` or BFG and perform
a coordinated force push. Do not rewrite shared Git history without notifying
every collaborator first.

The existing migration scripts can continue reading locally retained files
because `.gitignore` prevents the export directory from being recommitted.

### Remove or disable the Firebase debug endpoint

The route below is not appropriate for general production access:

```text
src/app/api/debug/firebase-health/route.ts
```

It currently accepts `CRON_SECRET` through a query parameter or header, reports
internal exception details and environment-variable presence, and writes an
`_debug/firebase-health` Firestore document.

Before deployment, either delete the route or make it return `404` whenever
`NODE_ENV === "production"`. Do not put debug secrets in URLs because URLs may
appear in browser history, proxy logs, analytics, and server logs.

### Remove or disable email preview pages

These pages are documented as development-only but currently generate public
production routes:

```text
src/app/emails/
```

That directory exposes `/emails`, `/emails/confirmation`, `/emails/reminder`,
`/emails/reschedule`, `/emails/cancellation`, and `/emails/vip-welcome`.

Delete the preview pages or add a production guard that calls `notFound()`.
Keep the real reusable email components in the root `emails/` directory.

### Archive superseded gallery scripts

The following scripts target the old Postgres/Supabase gallery implementation:

```text
scripts/init-storage.ts
scripts/list-gallery.ts
scripts/seed-gallery.ts
scripts/migrate-gallery.ts
```

They are not active runtime code, but retaining them beside the Firebase scripts
can lead to accidental writes to the legacy system. Remove them after Firebase
migration acceptance or move them under an explicitly named legacy scripts
directory.

Keep these new Firebase gallery scripts:

```text
scripts/gallery-firebase-utils.ts
scripts/seed-gallery-firebase.ts
scripts/migrate-gallery-to-firebase.ts
```

### Files that are safe to keep

The following directories and files are useful for development and do not
create public production routes by themselves:

```text
__tests__/
e2e/
docs/
src/legacy/
firebase.emulator.json
apphosting.emulator.yaml
firebase-storage-cors.json
```

`src/legacy/` is non-routable because it is outside `src/app`. Keep it until the
Firebase migrations have been accepted, then archive or remove it later.

These local files are already ignored and are not sent through a GitHub-backed
App Hosting rollout:

```text
.env.local
.env.production
.env.vercel
.firebase/
.next/
coverage/
test-results/
firebase-debug.log
firestore-debug.log
tsconfig.tsbuildinfo
node_modules/
```

They may be deleted locally to recover disk space, but local deletion is not a
deployment requirement.

If Vercel has been completely retired, `vercel.json` and the ignored
`.env.vercel` file can also be removed. Keep them only if Vercel previews are
still used.

Finally, review the unrelated uncommitted modification to
`scripts/seed-auth-users-emulator.ts` and confirm it is intentional before
including it in the deployment commit.

## 12. Run final validation

Run the complete local checks after all configuration and code changes:

```powershell
npm run lint
npm run test:ci
npm run build
```

All three commands must exit successfully. Do not waive failures as
"unrelated" in the v1.0 release record; either fix them or explicitly remove
invalid tests from the release suite in a reviewed commit.

Then validate the emulator workflow:

```powershell
npm run emulators:start
```

In a second terminal:

```powershell
npm run seed:auth:emulator
npm run seed:feedback:emulator
npm run seed:gallery:emulator
npm run reconcile:bookings:emulator
```

Check:

```text
http://127.0.0.1:7001/admin/login
http://127.0.0.1:7001/admin/profile
http://127.0.0.1:7001/admin/feedback
http://127.0.0.1:7001/feedback
http://127.0.0.1:7001/api/feedback?limit=10
http://127.0.0.1:7001/gallery
http://127.0.0.1:7001/api/gallery?limit=15
http://127.0.0.1:7001/admin/gallery
http://127.0.0.1:7001/booking
http://127.0.0.1:7001/booking-status
http://127.0.0.1:7001/admin/bookings
http://127.0.0.1:7001/admin/calendar
```

In the emulator, complete one full workflow for each slice:

1. Sign in as a seeded administrator and verify `/api/admin/session` succeeds.
2. Submit feedback, approve it, recommend it, confirm it appears publicly and
   on the homepage, then delete it.
3. Upload, edit, list, view, and delete one gallery image.
4. Sign in as a seeded non-admin and verify protected APIs return `403`.
5. Verify direct Firestore reads/writes and direct Storage writes are denied.
6. With a date at 97/100 seats, request ten guests and verify the API/UI reports
   exactly three available seats without creating a booking.
7. Create, move, and cancel a booking; verify both affected `bookingDays`
   counters and the admin calendar totals after every mutation.

## 13. Trigger the App Hosting rollout

If the backend uses GitHub automatic rollouts, push the reviewed commit to the
configured live branch:

```powershell
git push origin <live-branch>
```

Monitor:

**Firebase Console → App Hosting → Backend → Rollouts**

If automatic rollouts are disabled, select **Create rollout** in the Firebase
Console and deploy the exact reviewed commit.

Reference: [Manage App Hosting rollouts](https://firebase.google.com/docs/app-hosting/rollouts)

## 14. Production smoke tests

After the rollout completes, verify all of the following:

### Authentication

- Administrator sign-in works and `/api/admin/session` returns only `uid`,
  `email`, `displayName`, and `role`.
- Wrong credentials fail without revealing whether an account exists.
- A valid Firebase user without `adminUsers/{uid}` is signed out and receives
  the permission message.
- A non-administrator receives `403` from protected APIs.
- The Profile page lists Firebase Authentication users.
- An administrator can create a normal user and an administrator; only the
  administrator receives an `adminUsers/{uid}` role document.
- Forgot-password email uses the production domain and a valid link completes
  at `/admin/reset-password`.
- In-session password change requires reauthentication.

### Feedback

- Submit one uniquely named test feedback and receive `201` with `pending`.
- Confirm the Firestore document exists in `birdman-db`, with normalized email,
  server timestamps, and no client-controlled status.
- Confirm pending feedback is absent from `/feedback` and `GET /api/feedback`.
- Approve it in `/admin/feedback` and confirm it appears publicly.
- Verify the public API response does not contain `email`, `approvedBy`, or
  other moderation metadata.
- Toggle Recommended and confirm it appears under homepage Visitor Reviews.
- Confirm a sixth recommendation is rejected while five are active.
- Verify pending/approved ten-record pagination and scroll restoration.
- Delete the smoke-test feedback and verify Firestore/public/homepage removal.
- Confirm Upstash recorded the `birdman:feedback` rate-limit request.

### Gallery

- `/gallery` displays production images.
- Gallery cards use thumbnails.
- The lightbox loads display-sized images.
- Infinite loading works after the first 15 images.
- `GET /api/gallery?limit=15` returns cursor pagination.
- Public gallery responses do not expose Storage paths, uploader IDs,
  categories, order, checksums, or other administrative metadata.
- The admin gallery loads 15 records per page.
- Admin upload, edit, pagination, scroll-to-top, and delete work.
- New uploads create two WebP objects and one Firestore document.

### Bookings and calendar

- A public booking creates one `bookings` document, increments the matching
  `bookingDays/{date}.confirmedGuests`, and allocates a unique booking number.
- The API, confirmation page, email, and booking-status flow show the same
  six-digit reference, such as `#000023`; Firestore retains the numeric counter
  alongside the formatted `bookingCode`.
- A request larger than the remaining capacity receives `409` and returns the
  exact number of available seats; no partial or oversized booking is created.
- Concurrent requests cannot push a date beyond its configured capacity.
- Self-service rescheduling releases the old date and reserves the new date in
  the same transaction.
- Self-service and administrator cancellation release capacity exactly once;
  repeated cancellation cannot make a counter negative.
- Administrator create, edit, status change, and delete keep counters aligned.
- A calendar bulk closure cancels affected confirmed bookings through the same
  transactional capacity path.
- Monthly calendar totals and day availability match `bookingDays`, while day
  booking lists contain only the corresponding confirmed bookings.
- A post-smoke-test production reconciliation dry run reports zero differences.

### Security and privacy

- Direct client Firestore operations remain denied.
- Direct client Storage writes remain denied.
- Anonymous Storage reads succeed only for `gallery/public/**`.
- Protected Auth, Feedback, Gallery, Booking, and Calendar administrator APIs
  return `401` for a missing/invalid token and `403` for an authenticated
  non-admin.
- Feedback email, gallery Storage paths/checksums/uploader details, and
  `adminUsers` documents are not exposed by public APIs.

Keep `GALLERY_HERO_VIDEO_URL` unset until the fixed hero video has been copied
to Firebase Storage. The public gallery will use its local fallback image in the
meantime.

## 15. Rollback plan

If a critical v1.0 smoke test fails:

1. Stop further administrator mutations and gallery uploads.
2. Roll App Hosting back to the last known-good rollout from Firebase Console.
3. Do not delete Firebase Auth users, `adminUsers`, feedback, gallery documents,
   or Storage objects created during the rollout; preserve them for diagnosis.
4. Keep Supabase/Postgres data and media unchanged until v1.0 acceptance.
5. Record the failed rollout ID, UTC time, endpoint, response code, and relevant
   Cloud Run log correlation data.
6. Fix and validate locally, deploy rules/indexes first if they changed, and
   create a new rollout from a reviewed commit.

An App Hosting rollback changes application code but does not roll back
Firestore, Authentication, or Storage data. Any data correction must therefore
be reviewed and executed separately.

## 16. Release acceptance and tag

The release is accepted only after every Authentication, Feedback, Gallery,
Booking, Calendar, Security, and Privacy smoke test passes. Complete the release
approval record at the top of this document, then tag the exact deployed commit:

```powershell
git tag -a v1.0.0 -m "Firebase migration v1.0 production release"
git push origin v1.0.0
```

Do not create or push the tag before the deployed commit has passed production
smoke tests.

## 17. Post-deployment monitoring

- Review the App Hosting rollout and Cloud Build logs.
- Review Cloud Run errors for server-side API failures.
- Monitor Firestore and Storage usage.
- Confirm Upstash rate limiting is operational.
- Test email delivery and password-reset email links.
- Review feedback submission rate-limit analytics and moderation errors.
- Review gallery image-processing failures, Storage egress, and orphaned object
  warnings.
- Run the booking reconciliation in dry-run mode after rollout and after any
  manual production data repair; investigate any counter drift immediately.
- Configure budget alerts and review Firebase usage regularly.
- Retain Supabase media and Postgres gallery records until the deferred
  migration has been verified and formally accepted.
