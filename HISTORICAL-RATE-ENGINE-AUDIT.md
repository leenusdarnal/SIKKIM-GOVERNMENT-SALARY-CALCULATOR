# Historical rate schedule engine — implementation audit

## Implemented
- Added a source-backed effective-dated schedule for DA, HRA, SBCA and transport allowance.
- Each entry records inclusive effective-from / effective-to months, value, unit, Government order / circular reference, explicit verification flag and optional employee-applicability note.
- Validation checks month formats, range order, units, numeric limits, source references, verification and overlapping periods for the same component.
- Month-specific resolution reports missing components. Rates outside their effective period, unverified rates and gaps are never silently filled by interpolation or guessed defaults.
- A guarded helper applies a complete resolution to a copy of the salary basis and refuses incomplete schedules.
- Regression tests cover effective-date boundaries, missing history, unverified sources, overlaps, invalid ranges, unit mismatches, immutable salary inputs and month-by-month arrears integration.

## Deliberate boundaries
- No historical DA, HRA or SBCA percentages are pre-populated. The current 60% DA default is not treated as a historical schedule.
- Order applicability to an employee, cadre, posting, pay level or eligibility group must be verified before an entry is marked verified.
- The engine does not prorate mid-month changes, infer HRA eligibility, calculate arrears or determine entitlement.
- Transport allowance is a fixed INR amount; DA, HRA and SBCA are percentages.
- Integrated the schedule resolver into the arrears calculation model. The caller explicitly selects which components are schedule-controlled; each month resolves the effective rate and carries its source reference into the row's applied-change audit trail.
- The arrears calculation is blocked for the selected historical period if any month lacks a verified rate, the schedule is invalid, or a component is selected more than once.
- The existing arrears UI has not yet been extended to author and persist the full schedule. This integration is available through the typed arrears input model; UI and draft-persistence integration are a separate follow-on task.

## Validation
Run npm run check, npm test and npm run build in CI. Production deployment remains deferred until all planned implementation and final QA stages are complete.
