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
