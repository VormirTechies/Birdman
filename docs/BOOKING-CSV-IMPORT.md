# Booking CSV import

## Temporary admin page

Open `/admin/booking-import`, select the database and CSV, then preview. India time is selected by default. Type `IMPORT` for local or `IMPORT LIVE` for production to enable import. Changing the file, timezone or target clears the preview. Files are limited to 500 KB.

Targets are restricted to the server's configured environment. Use the local application for emulator imports and the production admin application for live imports. A deployed server cannot reach an emulator on your laptop, and an Auth emulator identity cannot authorize production writes. The page reports unavailable targets. The tool uses existing admin authorization and exposes no public import endpoint.

Remove `src/app/admin/booking-import` and `src/app/api/admin/booking-import` after migration to retire this temporary tool. The shared importer and CLI may remain.

The importer writes `bookings`, `_counters/bookings`, and only the affected `bookingDays` dates in one transaction. It preserves existing documents, rejects conflicts, and does not send notifications. Existing bookings on affected dates contribute to the totals. Other dates and visitor collections are untouched.

First verify the timezone of timezone-free Supabase timestamps. Use `--timestamp-offset Z` for UTC or `--timestamp-offset +05:30` for India time. This flag describes stored timestamps, not the local booking session time.

```powershell
npm run migrate:bookings -- --validate-only --file "C:\Users\vicky\Downloads\bookings_rows (39).csv" --timestamp-offset Z
npm run migrate:bookings -- --emulator --file "C:\Users\vicky\Downloads\bookings_rows (39).csv" --timestamp-offset Z --dry-run
```

After reviewing the dry run, remove `--dry-run` to import locally. Run again to check duplicate detection. Verify booking status, checklist and the calendar totals.

Production uses `birdman-7e745/birdman-db` and ADC, or an explicitly configured service account. Emulator uses `(default)` and a loopback Firestore host (default port 7003), without service-account keys. Production refuses a configured emulator host.

For production comparison, substitute `--production --dry-run`. Actual production writes additionally require `--confirm-production`. Back up production and briefly pause booking writes during the cutover. No public booking API is called.

The report lists proposed insert count, duplicates, counter and date totals. Validation or conflicts abort all writes. Conflicting rows must be reviewed manually; existing status or contact data is never overwritten. Stable IDs use `supabase-{legacyId}`. Matching older imports are left unchanged, including any missing legacy metadata. This importer accepts at most 450 writes per atomic operation; larger exports must be split. It scans existing bookings for collision detection, so read cost grows with collection size.

The provided export has 31 records for 2026-09-12, including 100 confirmed guests and 2 cancelled guests. Its highest booking number is 3570. Production totals may be higher if distinct bookings already exist.
