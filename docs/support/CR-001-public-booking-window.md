# CR-001: Expand public booking window to 45 days

- Type: Change request (not a production incident).
- Requested: 2026-10-23.
- Priority: P2 / Normal.
- Status: Implemented locally; 13 targeted tests and TypeScript passed. Awaiting user acceptance and release approval.
- User story: As a visitor planning a visit, I want to book up to 45 days ahead instead of 30 days so I can plan earlier.

## Acceptance criteria

- Public calendar permits today through day 45 inclusive, subject to capacity, opening settings, and same-day cutoff.
- Public creation API rejects past dates and day 46 onward, including manually submitted requests.
- Calendar upper bound and API share the 45-day constant; day boundaries use Asia/Kolkata (UTC+05:30).
- Admin access to dates is unchanged. Guest/contact limits and transactional capacity checks remain unchanged.
- Tests cover day 45, day 46, month/year rollover, and India midnight.
- Calendar includes four legends: green Available, yellow Filling up, grey Full, and red Not opened. Red matches the existing blocked-date styling; grey no longer ambiguously says Full / Closed.

## Scope

This request changes new public bookings only. Existing bookings are untouched. Changes to self-service rescheduling policy are not included. No database migration, production write, push, or deployment is part of local implementation.

## Verification

- Three suites / 13 tests passed: shared window boundaries, public creation API, and booking-calendar UI regressions.
- `tsc --noEmit` and Git whitespace checks passed.
- Full release build and production acceptance remain pending; this is not a deployment record.
