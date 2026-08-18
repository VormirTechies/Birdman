# Legacy booking APIs

These files are non-routable snapshots of the booking API implementations that
were active immediately before the Firestore booking v2 consolidation began.
They intentionally live outside `src/app` and must not be imported by active
application code.

Snapshot coverage:

- Public booking create/admin-list route.
- Public booking item route.
- Self-service lookup, update, and cancellation route.
- Booking statistics route.
- Administrator booking list/create route.
- Administrator booking item route.

Keep these files only as a migration reference. They do not define HTTP routes.
