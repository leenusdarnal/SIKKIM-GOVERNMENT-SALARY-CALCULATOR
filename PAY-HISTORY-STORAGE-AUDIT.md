# Pay-history persistence and portability audit

Review date: 9 November 2026

## Implemented

- Service-history entries are restored from browser-local storage when the pay-progression page opens.
- Each accepted history change is saved to the current browser profile. No server endpoint, analytics event or payroll integration receives the entries.
- Users can download a versioned JSON backup, restore a JSON backup on another device/browser, or export the currently validated entries as CSV.
- Restoring a backup validates its schema, event types, dates, published pay-matrix cells, record count and note lengths before replacing the current history.
- The page asks before replacing an existing history or clearing all entries.
- Corrupt or unsupported saved data is reported and is not automatically overwritten at page load.
- CSV fields are quoted, and formula-like reference text is prefixed to reduce spreadsheet formula-injection risk.

## Data handling

- Storage key: `sikkim-salary-pay-history:v1`.
- Backup format: JSON with `schemaVersion: 1` and an `entries` array.
- Imports are limited to 1 MB and 500 entries. Optional reference notes are limited to 500 characters.
- Only the service-history page persists data. The monthly salary calculator's employee inputs are not included in this storage or export.
- Browser-local storage is not encrypted by this application. Do not use the feature on a public/shared device or store sensitive personal identifiers in the optional reference field. Export a backup before clearing browser data or changing devices.

## Validation

The new unit tests cover storage round-tripping, empty storage, corrupt data, unsupported event types, oversized files, invalid pay-matrix cells, chronological-order enforcement, CSV escaping/formula hardening and blocked storage.

The application remains an independent service-record aid. Persistence does not change official pay fixation, increment eligibility, promotion rules or entitlement decisions.
