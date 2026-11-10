# Integration QA audit — Sikkim Professional Tax and salary modules

## Finding and correction
The shared salary engine previously calculated automatic Professional Tax using gross-monthly-income slabs. This did not match the Sikkim-specific pay-level rule supplied for this calculator. The engine now uses an explicit pay-level band:
- Below Level 15: ₹150 per month.
- Level 15 and above: ₹200 per month.

The engine does not infer the band from gross salary. The regular pay-matrix calculator sets the band from the selected pay level; the payslip and arrears worksheets require an explicit band selection whenever automatic Professional Tax is chosen. Manual override and not-applicable options remain available.

## Cross-module changes
- `src/lib/salary.ts`: shared `SalaryInput` includes a typed Professional Tax pay-level band; automatic calculation uses the band, not gross pay.
- `src/lib/components/SalaryCalculator.svelte`: derives the band from the selected Sikkim pay-matrix level and updates explanatory copy.
- `src/lib/payslip.ts` and `src/routes/payslip-generator/+page.svelte`: automatic Professional Tax requires a selected band; UI presents both Sikkim bands.
- `src/lib/arrears.ts` and `src/routes/arrears-planner/+page.svelte`: opening salary basis and effective-dated changes support pay-level band selection; automatic mode is blocked when the band is missing.
- Salary, payslip and arrears tests cover band boundaries, missing-band safeguards and monthly application.

## Rule-source limitation
The ₹150 / ₹200 amounts and Level 15 threshold are based on the user's previously supplied Sikkim rule. Before treating this as a legally authoritative payroll configuration, attach or confirm the current Sikkim Government notification / circular and check applicability and exemptions with DDO / Accounts. This audit does not claim an independent legal verification of the underlying notification.

## QA boundaries
- No central-government gross-income slabs are used for automatic Sikkim PT.
- Manual PT and exempt/not-applicable paths remain explicit.
- This change does not modify CPS, GPF, GIS or other deduction formulas.
- No employee data is sent to a server by these local calculation modules.
- No merge or production deployment is performed as part of this QA stage.

## Additional payslip QA corrections
- Annual-to-date totals now include only records from the selected financial/calendar year up to and including the selected month; later months in the same year are excluded.
- Payslip validation now rejects non-finite, negative, or out-of-range salary inputs and requires explicit pension/GPF and Professional Tax treatment rather than silently presenting a zero deduction as a completed calculation.
- CSV text cells now neutralize spreadsheet formula prefixes (=, +, - and @) before export to reduce formula-injection risk when the file is opened in spreadsheet software.
- Regression tests cover annual cut-off, malformed salary inputs, unselected deduction treatments and formula-prefixed employee names.

## Arrears persistence QA correction
- Draft backup validation previously omitted the Sikkim Professional Tax pay-level band from its salary-update allowlist. A dated move between the below-Level-15 and Level-15-and-above bands could therefore be rejected during backup validation even though the arrears calculation accepted it.
- The storage validator now validates and preserves `professionalTaxLevelBand` in both the opening salary basis and effective-dated salary changes.
- A backup containing only a historical-rate schedule or only a selected-component list is now rejected as structurally inconsistent. Both must be present together, matching the calculation engine's contract.
- Regression tests cover pay-level-band round-trip and mismatched historical schedule/component data.

## GPF planner default-input QA
- Integration review found that the GPF planner prefilled reference pay with ₹56,000, which could be mistaken for an employee-specific or recommended value.
- The planner now starts with reference pay set to zero, displays no calculated contribution or limits until a valid reference-pay figure is entered, and explicitly states that no employee pay is pre-filled.
- The employee must still confirm the correct reference-pay basis for the relevant subscription year with the service/pay record and Accounts/DDO section. The 6%–100% rule range and the planner's other limitations remain unchanged.
