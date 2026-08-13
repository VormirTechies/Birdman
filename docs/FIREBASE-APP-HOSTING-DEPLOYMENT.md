# Firebase App Hosting Pre-Deployment Guide

This checklist covers deployment of the Birdman Next.js application to Firebase
App Hosting after the Firestore feedback/authentication work and Firebase
gallery migration.

## Production targets

- Firebase project: `birdman-7e745`
- Firestore database: `birdman-db`
- Firestore edition: Standard
- Firestore region: `asia-southeast1`
- Storage bucket: `birdman-7e745.firebasestorage.app`
- Local Firestore database: `(default)`

## 1. Review and commit the working tree

Review all intended changes before committing. In particular, verify that any
changes outside the gallery migration, such as authentication seed scripts, are
intentional.

```powershell
git status
git diff --check
git diff
```

When everything is correct:

```powershell
git add .
git commit -m "Migrate gallery to Firestore and Firebase Storage"
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
local emulation. Local `.env.production` is ignored by Git and must not be
treated as the production App Hosting configuration.

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

## 8. Seed the production gallery

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

## 9. Clean the production source

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

## 10. Run final validation

Run the complete local checks after all configuration and code changes:

```powershell
npm run lint
npm run test:ci
npm run build
```

Then validate the emulator workflow:

```powershell
npm run emulators:start
```

In a second terminal:

```powershell
npm run seed:gallery:emulator
```

Check:

```text
http://127.0.0.1:7001/gallery
http://127.0.0.1:7001/api/gallery?limit=15
http://127.0.0.1:7001/admin/gallery
```

## 11. Trigger the App Hosting rollout

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

## 12. Production smoke tests

After the rollout completes, verify all of the following:

- `/gallery` displays production images.
- Gallery cards use thumbnails.
- The lightbox loads display-sized images.
- Infinite loading works after the first 15 images.
- `GET /api/gallery?limit=15` returns cursor pagination.
- Public gallery responses do not expose Storage paths, uploader IDs,
  categories, order, checksums, or other administrative metadata.
- Administrator sign-in works.
- A non-administrator receives `403` from protected APIs.
- The admin gallery loads 15 records per page.
- Admin upload, edit, pagination, scroll-to-top, and delete work.
- New uploads create two WebP objects and one Firestore document.
- Direct client Firestore operations remain denied.
- Direct client Storage writes remain denied.
- Password-reset links return to `/admin/reset-password` on the production
  domain.

Keep `GALLERY_HERO_VIDEO_URL` unset until the fixed hero video has been copied
to Firebase Storage. The public gallery will use its local fallback image in the
meantime.

## 13. Post-deployment monitoring

- Review the App Hosting rollout and Cloud Build logs.
- Review Cloud Run errors for server-side API failures.
- Monitor Firestore and Storage usage.
- Confirm Upstash rate limiting is operational.
- Test email delivery and password-reset email links.
- Configure budget alerts and review Firebase usage regularly.
- Retain Supabase media and Postgres gallery records until the deferred
  migration has been verified and formally accepted.
