# CR-002: Standardize the supported Node 24 runtime

- Requested: 2026-11-16.
- Type: Runtime maintenance / change request.
- Priority: P2 / Normal; separate from PROD-002 outage recovery.
- Status: Local configuration updated; 26 targeted tests, TypeScript, runtime-metadata consistency, and a full Webpack production build passed on Node 24.22.3. Default Turbopack build remains blocked by local NVM worker resolution. No production runtime change or deployment performed.
- User story: As the application maintainer, I want development and build tooling to use a supported, patched Node release so releases are reproducible and do not silently move to an untested major version.

## Change

- Official Node release index checked on 2026-11-16: latest 24.x is `24.22.3` (2026-11-10, Krypton LTS).
- `.nvmrc` selects `24.22.3` for tools that support it. It does not automatically switch every Windows NVM installation.
- `package.json` and lockfile root metadata require `>=24.22.3 <25`. Newer Node 24 patches remain allowed; Node 26 is excluded until separately approved and tested.
- Existing local Node 24.22.3 installation is used explicitly for verification. No system-wide Node switch or dependency upgrades are included.
- Firebase's backend selection should remain `nodejs24`, matching package engines. This is a patch baseline update, not a major-runtime upgrade. App Hosting chooses the available matching buildpack patch; this metadata does not itself prove the patch running in a Cloud Run image.
- Node 26 remains Preview in Google's runtime support table at the time of this change.

## Release gates

Reporter approved committing and pushing the reviewed changes on 2026-11-16. This authorizes the configured branch-triggered rollout; it does not certify successful cloud build, runtime patch selection, or production recovery.

1. Run targeted booking/auth tests and TypeScript checks using Node 24.22.3.
2. Run production build under the same executable; retain actual failure evidence if the build is blocked.
3. Obtain approval before commit/push/rollout; pushes to `firebase-hosting` can automatically deploy.
4. Confirm backend runtime matches engines and review the Node 24 decommission warning if it persists despite documented support. Do not disable automatic base image updates merely to suppress a billing/runtime warning.
5. After an approved rollout, verify actual runtime/build metadata and public/admin smoke tests.

## Separate billing checkpoint

Read-only check on 2026-11-16: project billing enabled and linked account `open: true`. Direct Firebase login endpoint still returned HTTP 503. An open account alone does not establish completed service recovery. No billing account, payment method, DNS record, or production data was modified by this change.

## Validation evidence

- Explicit executable: local NVM installation `v24.22.3/node.exe`; verified output `v24.22.3`.
- Five targeted booking-window/calendar/booking-API/admin-auth/login suites: 26 tests passed.
- `tsc --noEmit` passed.
- Root package/lockfile engine metadata match; `.nvmrc` matches the tested executable; Git whitespace checks passed.
- Default Turbopack build failed in CSS processing because its child process resolved an NVM proxy with no active Node version. This is the same local tooling blocker seen before this patch update. Webpack build is an additional check only; default build configuration remains unchanged.
- `next build --webpack` completed successfully (exit 0), including TypeScript, 44 static pages, optimization, and build traces. This is a local compatibility check, not proof that the default Cloud Build path or a production rollout has succeeded.
- Build tooling also emitted a Next.js vulnerability warning. Dependency/security upgrades are not silently included in this Node-only request and require separate verification and scope.

## Sources

- https://nodejs.org/dist/index.json
- https://firebase.google.com/docs/app-hosting/frameworks-tooling#abiu
- https://docs.cloud.google.com/docs/buildpacks/runtime-support
