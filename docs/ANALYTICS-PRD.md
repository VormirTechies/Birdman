# Birdman Web Analytics and API Observability PRD

**Status:** Draft for approval · **Date:** 21 November 2026 · **Site:** parrotsudarson.org

**Proposed owners:** Product/BA owns metric definitions and acceptance; Engineering owns instrumentation; Operations owns billing review; the site owner approves privacy and production rollout.

## Problem and decision

The billing snapshot shows ₹1,197.29 in cumulative project cost, with ₹843.19 (~70%) attributed to Firestore. This identifies the largest service cost, but doesn't establish which routes caused it or whether the recent calendar and notification changes reduced daily reads.

Use **GA4 for public visitor behavior**, **App Hosting/Cloud Logging for HTTP traffic**, and **Firestore usage and billing for cost**. These are separate measurements. A visitor can view a page without triggering a backend request, a worker can call an API without a page view, and a single request can incur many database reads.

## Users and goals

- As a site owner, I want to see which public pages visitors use and where they stop in the booking flow, so I can prioritize improvements.
- As production support, I want daily request totals, errors, and latency by route and method, so I can distinguish traffic spikes from expensive queries.
- As the cost owner, I want to compare Firestore read volume and cost across rollouts, so I can decide whether reduced notification traffic is worth keeping.

**Out of scope:** Admin user behavior in GA4, individual visitor tracking, ad integrations, BigQuery export, automatic cost attribution to each route, and changes to booking, notification delivery, or Firestore logic. Do not add Firestore reads or writes for telemetry.

## Measurement requirements

| Question | Source | MVP output |
| --- | --- | --- |
| Which public pages get used? | GA4 | Daily page views and sessions by normalized public page, including home, booking, booking status, gallery, and feedback |
| Where do visitors leave booking? | GA4 | Booking page → review → confirm attempt → confirmation funnel for measured sessions |
| Which APIs get called? | App Hosting logs | Daily counts by normalized path, method, and status class; 5xx rate and p95 latency where available |
| What changed in the bill? | Firestore usage and Cloud Billing | Daily named-database read operations and read-SKU cost; rollout comparison with traffic and known changes annotated |

GA4 only represents measured visitors. It is not the ledger for bookings or an exact measure of server traffic. Use existing booking reports as the reference for confirmed bookings; do not add database scans to reconcile analytics.

### Public analytics event contract

| Event | Trigger |
| --- | --- |
| `page_view` | Initial render of an allowlisted public route and each completed client navigation to a different normalized page; not prefetch or query-only edits |
| `booking_review_view` | Valid details accepted and review screen shown |
| `booking_confirm_attempt` | One event per actual confirmation attempt, not a blocked double-click |
| `booking_confirmed` | Server confirms success; not on reload or when a user checks an existing booking |
| `booking_confirm_failed` | Confirmation request fails; use only an allowlisted category such as capacity, validation, rate limit, or unavailable |

Keep review and confirmation steps as events if they share `/book`; don't invent page views to represent them. Use one GA4 web stream and one tagging integration. Prefer explicit page views for an allowlisted route map; disable competing automatic page-view triggers and verify actual navigation in DebugView. [Google's page-view implementation guidance](https://developers.google.com/analytics/devguides/collection/ga4/views)

### API and database diagnostics

Start with existing logs. Group application endpoints by normalized route template, not by raw URLs or dynamic IDs. Track all available `/api/` traffic, with named views for calendar, bookings, the admin notification inbox, and the worker. Separate Cloud Run origin traffic from CDN-served requests; don't add their totals blindly. Mark any logging gaps and isolate worker traffic from visitor traffic. Add low-cardinality log-based counters only if existing reports are insufficient and the Operations owner approves the cost. [App Hosting logs and metrics](https://firebase.google.com/docs/app-hosting/logging)

For high-impact routes, inspect the query pattern and use bounded Query Explain checks to assess per-query read cost where supported. Keep estimates separate from billed totals; do not enable per-request query analysis in production. [Firestore Query Explain](https://docs.cloud.google.com/firestore/native/docs/query-explain)

## Privacy and operational guardrails

- Enable the tag only on the production public site and only after the approved consent condition is met. Do not collect from admin, API, emulator, or preview routes. Confirm withdrawal behavior and update the privacy notice before launch.
- Step 2 QA exception: set `NEXT_PUBLIC_GA4_LOCAL_QA=true` in the dev server environment, restart it, then use the **Enable QA Analytics** control on localhost. This sends debug events only to the separate Birdman QA property; Firebase emulators do not ingest them. Turn Enhanced Measurement off on that QA stream before a live smoke test. Leave the flag unset for normal development.
- Use approved route templates and sanitized URLs, titles, and referrers. Never transmit names, email, phone, booking IDs, dates tied to a booking, tokens, feedback text, raw URLs with query strings, or raw errors. Disable automatic collection features not needed by the MVP. Inspect actual outgoing payloads, not just event-builder inputs. [Google Analytics PII guidance](https://support.google.com/analytics/answer/6366371)
- Don't add request bodies, tokens, or visitor-level identifiers to operational logs. Limit report access to approved roles, and agree retention and ownership before launch.
- Load analytics without blocking navigation or submissions. Missing config, denied consent, ad blockers, or tag failures must not change booking behavior. Keep a documented disable switch and rollback procedure. No paid exports or verbose new logging by default.

## Delivery plan and acceptance

1. **Baseline now — Operations.** Confirm rollout timestamp, capture daily Firestore read units and SKU cost, and extract existing API route counts. Compare five complete post-rollout days with matching weekdays where possible. Use a consistent reporting timezone, note partial/delayed billing data, and annotate booking traffic and other changes. Calendar and notification changes shipped together; aggregate savings cannot isolate either change.
2. **Configure and implement — Product and Engineering.** Confirm GA4 property ownership, event definitions, consent experience, privacy notice, and release flag. Implement public page views first and the booking funnel second. Keep the analytics release separate from booking or cost changes where practical.
3. **QA and release — QA, Engineering, and site owner.** In a separate QA destination, verify exactly one page view for each intended navigation (initial, client link, back/forward), and none for prefetch, query-only changes, admin routes, or denied consent. Exercise success, capacity rejection, rate limit, retry, reload, and double-click. Inspect network payloads for forbidden fields. Verify booking works with analytics blocked or misconfigured. For API reporting, reconcile controlled route/method/status requests against the available logs and document coverage. Obtain approval before enabling production collection.
4. **Review — Product and Operations.** Deliver the public page report, booking funnel, API traffic breakdown, and five-day cost comparison. Report read units/day and ₹/day, plus percentage change if the baseline is nonzero. Where volume or deployment overlap makes attribution uncertain, report the limitation instead of claiming savings. Decide whether to keep the inbox hidden and which query to optimize next.

**Release gate:** QA evidence, privacy approval, verified rollback, and a named report owner. **Open decisions:** Who owns the GA4 property? What are the approved consent and retention settings? Which daily read or spend threshold should trigger an investigation? Finalize these before enabling production analytics.
