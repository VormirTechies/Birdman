# PROD-001: Booking calendar advertises seats on a full date

- Priority: P1 / High - misleading availability prevents successful booking completion.
- Reported: 2026-10-23 (Asia/Kolkata).
- Status: Fix verified locally by the reporter; awaiting deployment and live verification. A successful release build remains required.
- User story: As a visitor, I want accurate available seats before reviewing my booking so I do not complete the form for a full date.

## Reproduction

1. Open `/book`, select a date whose confirmed bookings exist but whose `bookingDays/{date}` counter is absent.
2. Calendar advertises the full capacity; enter contact details and guest count.
3. Review, accept the checkbox, and confirm.
4. API rejects with `BOOKING_CAPACITY_EXCEEDED`; UI returns to the form.

## Evidence and cause

Read-only production checks: `2026-10-24` public calendar reported 0 booked / 100 available; `bookingDays/2026-10-24` was absent. A projected confirmed-booking query found 33 bookings / 104 guests. Capacity is 100 according to the public calendar and reported POST response. No production POST was replayed and no records were modified.

Monthly availability reads only daily counters and defaults missing counters to zero. Booking creation correctly falls back to confirmed-booking totals inside its transaction. The divergent fallback logic causes the false availability; rejecting this request prevents further overbooking. The origin of the existing 104 guests is not established by these checks.

## Fix and acceptance criteria

- For missing counters, monthly availability totals confirmed bookings, including children, without returning visitor details.
- Existing counters remain authoritative; fallback does not double-count them.
- Cancelled bookings do not reserve seats; genuinely empty dates remain available.
- A date with 104 confirmed guests and capacity 100 reports zero remaining seats and cannot be selected.
- Booking transaction capacity protection remains unchanged, including concurrent last-seat conflicts.
- Regression tests pass; deploy only after approval, then verify the production calendar read-only.

## Operational follow-up

Investigate the source of existing over-capacity bookings separately. Counter reconciliation is a potential maintenance task, not permission to cancel bookings or reset counts. The read fallback adds a projected month-range query when daily counters are incomplete; complete counter reconciliation can remove that legacy-read overhead later.

## Verification

- Four targeted suites passed 24 tests: calendar repository, capacity arithmetic, public booking API, and booking-calendar UI.
- TypeScript (`tsc --noEmit`), changed-file ESLint, and Git whitespace checks passed.
- Production build remains unverified: first attempt could not download Google Fonts in the sandbox; subsequent network-enabled attempts failed because Turbopack CSS child processes resolved an NVM proxy with no active Node version. Invoking the installed Node 24 executable directly runs unit tests, but did not fix the build worker environment.
- Reporter confirmed the local booking page works as expected on 2026-10-23. Local API checks returned 0, 3, and 100 remaining seats for October 24, 25, and 26 respectively.
- Reproduction seed: `npm run seed:bookings:support:emulator`. This command targets only `127.0.0.1:7003` / `(default)`, uses synthetic records, and refuses occupied dates instead of overwriting existing local bookings. Run it once against empty fixture dates; it intentionally leaves October 24's daily counter missing when run on October 23. Subsequent runs use tomorrow and the following two dates.
- This fix is being committed at the reporter's request. No push, deployment, counter reconciliation, or production write has been performed. Live verification remains pending after deployment.
