# Firestore API index coverage

Target: project `birdman-7e745`, database `birdman-db`.

Post-deployment verification: all 51 production composite indexes reached READY; all 74 query checks passed with zero failures.

`firestore.indexes.json` includes the definitions requested by live Firestore for the audited booking and visitor queries, and preserves previously configured indexes and field exemptions.

The deployment added 47 composite indexes without deleting indexes or changing documents. Together with four existing production composites, this gives 51 deployed composite indexes. The file additionally retains the gallery uploadedAt/document-ID definition; the gallery query is already served by automatic indexing and did not require another deployed composite.

## Repeat the read-only check

```powershell
node scripts/audit-firestore-indexes.cjs
```

Uses Application Default Credentials and explicitly targets production. Queries read at most one matching document per check and do not print personal data. No writes occur. A nonzero exit code indicates failed queries; inspect the output before assuming every failure is an index issue.

The 74 checks cover booking status/visited/date filters with date/time or createdAt sorting, visitor VIP filters with supported sort fields, both visitor-checkin field naming conventions, and feedback/gallery listing. They test query execution, not endpoint authentication, rendering, count aggregation, every parameter value or business correctness. Single-field and document-ID operations generally use automatic indexes.

Date equality plus descending date ordering produces some index definitions containing bookingDate twice with different directions. These are the exact definitions recommended and accepted by this production database, matching the current queries.

Future index changes should be checked against actual API queries. Do not assume one index per endpoint; endpoints can share indexes and optional filters can require additional definitions. Retain production indexes in the file before deploying so existing coverage is not accidentally removed.
