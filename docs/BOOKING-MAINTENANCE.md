# Booking maintenance during Firebase migration

Maintenance only affects `/book` and public `POST /api/bookings`. The homepage and all other public pages remain available. The booking page displays a maintenance message; direct API submissions receive HTTP 503 with `BOOKING_MAINTENANCE`. The API handler independently checks the flag to cover requests without proxy execution.

Bookings are paused by default, including when `MAINTENANCE_MODE` is unset. Keep this setting enabled until migration is complete. Set `MAINTENANCE_MODE=false` and redeploy/restart to reopen both the form and public submissions. This reuses the existing deployment flag; any environment that already sets it to false must change that value to true to pause bookings.

Existing booking status and admin workflows are not restricted by this public-new-booking gate. The maintenance message makes no promise about reopening time.

Verification:

```powershell
npm run test:ci -- __tests__/api/booking-maintenance.test.ts
```
