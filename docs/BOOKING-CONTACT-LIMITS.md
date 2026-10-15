# Booking contact verification and guest limits

Visitors manage a booking using its booking code plus the email or phone used when booking. No OTP/email-verification step is required. Incorrect combinations return the same mismatch message for lookup, reschedule and cancellation. Contact details and booking number are rechecked inside the mutation transaction, preventing a change between lookup and commit from bypassing verification.

Each public booking allows at most 10 guests including children. Across the same date, bookings matching either the normalized phone or normalized email count once toward a 25-guest limit. Confirmed and completed bookings count; cancelled bookings do not. Reductions/cancellations remain available when migrated data already exceeds the limit. Rescheduling checks the destination date. Admin-created groups are not capped at 25, but they count toward subsequent public attempts for that contact/date. Admins must still respect total daily capacity and the existing per-booking rules.

The policy reads existing bookings for the date, including migrated bookings, within the existing day-capacity transaction. Creates, contact/status edits and deletions serialize through the day document, so parallel requests cannot bypass the contact limit. No additional quota collection or composite index is required.

Server-side rate limits use `_bookingAttemptLimits`: 10 public creation attempts or 20 self-service attempts per 15-minute fixed window per proxy-appended IP. Invalid/mismatched attempts count. All POST/PATCH/DELETE self-service operations share the same limit. Exceeding it returns 429 and Retry-After. If Firestore is unavailable, these routes return 503 rather than allowing unlimited requests. Existing stricter Upstash creation limiting still applies when configured. Shared-network visitors share an IP allowance. Production must verify that its ingress appends the actual client IP to the trusted forwarding header. People changing both their phone and email, or using multiple IPs, cannot be identified as the same person without stronger identity verification.

For groups above 25, set the server-only `GROUP_BOOKING_CONTACT_PHONE` environment variable using App Hosting settings/Secret Manager. Never use a NEXT_PUBLIC variable or commit the number. The local ignored env files are configured. The API returns the number only on the group-limit response; the UI then offers a call link. Anyone who receives that response can see the number. It is not available in the normal frontend bundle.

Rate-limit documents reuse expired windows. For automatic cleanup of inactive IP records, configure Firestore TTL on `_bookingAttemptLimits.resetsAt`; correctness does not depend on TTL.

## Validation

```powershell
npm run test:ci -- src/lib/booking-policy.test.ts src/app/api/bookings/route.test.ts src/app/api/bookings/self-service/route.test.ts
$env:RUN_BOOKING_EMULATOR_TESTS='true'
npm run test:ci -- src/lib/firebase/booking-contact.integration.test.ts
Remove-Item Env:RUN_BOOKING_EMULATOR_TESTS
```

The integration test targets only `127.0.0.1:7003` and uses an isolated demo project. It never reads or writes production records. Existing build/type errors from the release audit are separate from these changes.
