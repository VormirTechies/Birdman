# PROD-002: Production administrator login missing Firebase client configuration

- Reported: 2026-11-14 (Asia/Kolkata).
- Priority: P1 / High - administrator access unavailable.
- Status: Root DNS corrected and billing account reopened. Last direct Firebase check still returned 503; post-recovery service health and administrator sign-in verification remain pending.
- User story: As an administrator, I need production sign-in to initialize Firebase correctly so I can access management pages.

## Report

Login displays `Missing Firebase client configuration: apiKey, authDomain, projectId, appId`. App Hosting reportedly displays `Node 24 has been decommissioned and is no longer available. Please update your runtime version to resume deployments.`

## Initial evidence

- `src/firebase.js` reads the four required client settings from `NEXT_PUBLIC_FIREBASE_*` environment variables. Missing values prevent Auth initialization before any sign-in request.
- Read-only backend inspection confirms nonempty current console overrides for the four required variables. This does not prove they were available to the serving build.
- Firebase's current App Hosting documentation still lists versioned `nodejs24` as supported; Google's buildpack lifecycle lists Node 24 decommissioning on 2028-10-31. The reported warning needs verification against the selected backend/runtime and actual build failure.
- No Firebase configuration values, credentials, or visitor records are recorded here.
- Live backend runtime is `nodejs24`. Traffic is 100% on `build-2026-10-27-001`, state `READY`, commit `2ced8db0ddca3b6c5d8eecc4edcdee6492fd04ca`. No newer build was present in the read-only inventory.
- The serving build explicitly includes nonempty required public Firebase variables with both `BUILD` and `RUNTIME` availability. Therefore missing current console settings or missing build scope is not established as the cause.
- Public `/admin/login` returned HTTP 200 without the configuration error in initial HTML. Browser hydration, served JavaScript and service-worker/cache behavior still need inspection; HTML alone does not verify interactive login.

## Confirmed custom-domain cause

- Incognito screenshot reproduces the same error; browser-local stale cache is not a sufficient explanation.
- `https://parrotsudarson.org/admin/login` responds with `Server: Vercel`, `x-vercel-id`, and `x-vercel-cache: HIT`. Its script URLs contain Vercel deployment identifiers.
- The public Firebase initialization module in the served JavaScript retains unresolved `process.env.NEXT_PUBLIC_FIREBASE_*` references (via the bundled process shim), with no embedded project marker. This explains missing client configuration in that browser deployment despite Firebase backend variables being present.
- DNS A lookup returned `216.198.79.1`. Treat exact hosting/DNS changes as approval-gated; do not guess Firebase destination records.
- Separate direct requests to the Firebase `hosted.app` hostname returned HTTP 500 and then HTTP 503. Firebase origin health must be restored before directing visitors there. The runtime warning remains unconfirmed and separate from the custom-domain client-bundle failure.
- Screenshot also exposed an entered password. User advised to rotate it; value was not repeated, stored, or used.

## Proposed recovery order

1. Confirm Firebase remains the intended hosting destination (rather than repairing the active Vercel deployment).
2. Diagnose and restore the Firebase origin, verify required browser config is embedded and login initializes there.
3. Verify custom-domain ownership/mapping and apply only Firebase-provided DNS records after authorization.
4. Verify custom domain serves the intended release, then complete authorized administrator sign-in acceptance.

## Firebase origin investigation - 2026-11-15

- Root domain now resolves to Firebase-requested `35.219.201.33`; both root and direct Firebase origin return HTTP 503.
- Cloud Run service and serving October 27 revision remain marked Ready; image import/container health checks succeeded at rollout time. No new failed rollout explains this outage.
- Recent Cloud Run request errors explicitly state: `The request failed because billing is disabled for this project.` Some requests also report instance startup failure.
- Project billing metadata reports `billingEnabled: true`, but the linked billing account reports `open: false`. Thus a billing link alone does not establish an active account. No account identifier, balance, or payment details were printed or recorded.
- Owner action required: reopen the closed billing account if eligible, or link an active billing account. Check Billing account management/payment notices for the reason; closure cause was not established by these read-only checks.
- Reopening/relinking billing may resume paid usage and must be performed/approved by the owner. Do not disable/re-enable project billing blindly, recreate the backend, delete resources, or change runtime to address this billing denial.
- Follow-up after reporter supplied Transactions/Blaze screenshots: a new lookup confirmed the linked account exactly matches the screenshot account, display name `Vormir Techies`, and still reports `open: false`; the project link still reports `billingEnabled: true`. Firebase origin still returns 503. Transactions and the Blaze-plan label do not establish that the linked account is open. Reporter should inspect Account management/account status and payment notices or contact Cloud Billing support if UI explicitly disagrees with the API. A prior declined transaction shown in the screenshot is not sufficient evidence of the closure cause or an instruction to make another payment.
- After billing remediation, recheck direct Firebase origin and custom domain, inspect any remaining startup errors, and verify administrator login. Runtime-console warning remains a separate unconfirmed issue if it persists.
- 2026-11-16 follow-up after reporter payment: linked billing account now reports `open: true`, project billing enabled. Direct Firebase login still returned HTTP 503 at that check, so recovery is not yet established. Local Node patch preparation is tracked separately in CR-002; no production redeployment has been performed.

## Acceptance criteria

- Identify the actual serving build and runtime and confirm the reported warning.
- Required public Firebase values are available during the Next.js build and embedded in the served client bundle.
- A supported runtime compatible with project dependencies builds successfully.
- Authorized administrator sign-in and session authorization work on the production domain after an approved rollout.
- No secret is added to Git or exposed through a public variable; no accounts, role documents, or booking records are modified for diagnosis.

## References

- https://firebase.google.com/docs/app-hosting/frameworks-tooling
- https://firebase.google.com/docs/app-hosting/configure
- https://docs.cloud.google.com/docs/buildpacks/runtime-support
