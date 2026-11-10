# Historical rate schedule engine — implementation audit

## Implemented
- Added a source-backed effective-dated schedule for DA, HRA, SBCA and transport allowance.
- Each entry records inclusive effective-from / effective-to months, value, unit, Government order / circular reference, explicit verification flag and optional employee-applicability note.
- Validation checks month formats, range order, units, numeric limits, source references, verification and overlapping periods for the same component.
- Month-specific resolution reports missing components. Rates outside their effective period, unverified rates and gaps are never silently filled by interpolation or guessed defaults.
- A guarded helper applies a complete resolution to a copy of the salary basis and refuses incomplete schedules.
- Regression tests cover effective-date boundaries, missing history, unverified sources, overlaps, invalid ranges, unit mismatches and immutable salary inputs.

## Deliberate boundaries
- No historical DA, HRA or SBCA percentages are pre-populated. The current 60% DA default is not treated as a historical schedule.
- Order applicability to an employee, cadre, posting, pay level or eligibility group must be verified before an entry is marked verified.
- The engine does not prorate mid-month changes, infer HRA eligibility, calculate arrears or determine entitlement.
- Transport allowance is a fixed INR amount; DA, HRA and SBCA are percentages.
- This is a calculation primitive for the next integration phase. The existing arrears planner remains unchanged until its UI can safely collect and preserve source metadata.

## Validation
Run npm run check, npm test and npm run build in CI. Production deployment remains deferred until all planned implementation and final QA stages are complete.
