# Admin notification cost experiment

Admin notifications are temporarily hidden by default. Checklist, Calendar, and History are the fallback. The admin layout does not mount the active inbox provider or push device controls, so the updated UI stops polling the notification APIs. Existing push registrations, background delivery, and the scheduler are unchanged.

Once deployed, record the rollout time and review 3–7 complete days of named-database Firestore read operations and cost against comparable weekdays and booking traffic. Check notification API traffic separately from calendar traffic. If the calendar optimization ships in the same rollout, do not attribute the total read reduction to notifications alone.

On return, review these numbers before deciding whether to restore the inbox. To restore it, set `NEXT_PUBLIC_ADMIN_NOTIFICATIONS_ENABLED=true` at build time and rebuild/redeploy. No data migration is needed.
