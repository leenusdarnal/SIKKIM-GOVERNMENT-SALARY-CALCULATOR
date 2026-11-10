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


## CPS / OPS integration QA — 10 November 2026

### Government-reference context
- The Finance Department's PGIPF Division information describes the State's Contributory Pension Scheme for covered employees appointed after 1 April 2006, with an employee contribution of 10% of Basic Pay plus DA and an equal State contribution. Reference: [Finance Department — Pension, Group Insurance Schemes, Contributory Pension Scheme and GPF (PGIPF Division)](https://www.sikkim.gov.in/department/departmentmenudetails?url=Menu%3Dfinance-revenue-expenditure-department%2Fpension-group-insurance-schemes-contributory-pension-scheme-and-general-provident-fund-pgipf-division).
- Department of Personnel Notification No. 23/GEN/DOP dated 09.02.2024 announced restoration of the Old Pension System with a view to bring State Government employees appointed on or after 01.04.2006 under the Sikkim Services (Pension) Rules, 1990. The notification stated that detailed guidelines on reversion modalities would be issued separately. Reference: [Notification No. 23/GEN/DOP dated 09.02.2024](https://dop.sikkim.gov.in/notificationdoc/23.pdf).
- Accordingly, appointment date is not used by this calculator to infer an individual's current CPS / OPS status. The signed pension option, service record, any later Government orders and DDO / Accounts implementation records must establish the applicable arrangement. The calculator does not claim to verify legal membership.

### Code and cross-module safeguards
- `src/lib/salary.ts`: added optional `cpsMembershipConfirmed` to `SalaryInput`. A selected CPS mode returns zero employee and State contributions until the flag is explicitly true. Once confirmed, the shared engine applies its configured 10% employee contribution on Basic Pay + DA and shows the equal State share separately.
- `src/lib/components/SalaryCalculator.svelte`: selecting CPS exposes an attestation checkbox requiring confirmation against the employee-specific signed pension option / service records and DDO / Accounts. Changing the selected scheme clears the attestation. Calculation is blocked until confirmation.
- `src/lib/payslip.ts` and `src/routes/payslip-generator/+page.svelte`: CPS payslip validation is blocked without confirmation. Changing the scheme clears the attestation. The employer / State matching share is informational only and is not included in employee deductions or take-home reduction.
- `src/lib/arrears.ts` and `src/routes/arrears-planner/+page.svelte`: opening CPS basis requires explicit confirmation; a dated change to CPS must carry a separate confirmation for that effective month. Changing the selected arrangement clears the UI attestation.
- Arrears month rows and totals now include the employer / State matching share as a separate reporting field. Arrears audit CSV, final CSV and print statement show it separately; it is not added to employee deductions or used to reduce revised take-home.
- `src/lib/arrears-storage.ts`: the new flag is persisted. Older version-1 drafts without the optional field remain structurally loadable, but any draft that selects CPS without re-confirmation is blocked by arrears calculation.
- Tests cover unconfirmed CPS blocking, successful confirmation, cross-module payslip / salary-engine consistency, State match separation, arrears dated-switch confirmation and legacy draft compatibility.

### Formula and applicability limitation
The 10% Basic Pay + DA employee / equal State contribution is the Finance Department's published scheme description used by this calculator. The individual's scheme coverage, option status, precise contribution base and any subsequent implementation instructions must still be confirmed against applicable orders and service / DDO records before payroll use. This change does not apply CPS universally, infer OPS automatically, or treat the checkbox as Government approval.

