# Monthly salary slip generator — audit and safeguards

## Reuse of calculation engine
The slip uses the existing `calculateSalary()` engine from `src/lib/salary.ts`. It does not introduce a second set of salary formulas. Employer CPS contribution is displayed separately as informational and is not deducted twice.

## Features
- Employee and payroll metadata: name, employee ID, designation, department, office, district, pay level and cell/stage.
- Month-specific salary calculation and earnings / deductions breakdown.
- Print / Save as PDF through browser print and CSV export.
- Annual gross, deductions and net totals from explicitly entered month snapshots.
- Comparison with the most recent earlier month in the entered history.
- Replacing an existing month preserves other months.

## Data and rule safeguards
- Employee metadata and month history remain in page state only; this feature does not persist or upload employee personal data.
- Rates, HRA eligibility, pension treatment and deduction amounts are entered or selected by the user; no new rates are assumed by the payslip UI.
- Existing salary engine behaviour and rules remain unchanged.
- Annual totals include only months entered in this session. They are not represented as a complete financial-year payroll record.
- Draft output is not an official pay certificate; DDO / Accounts verification is required.


## Final integration validation addendum — 10 November 2026
- The payslip model now calls the shared `validateSalaryInput()` guard, matching the main salary calculator and arrears engine.
- Invalid inputs suppress all salary amounts in the UI report and annual summary; the CSV builder rejects an invalid model, and the print / add-month actions are disabled until valid.
- Annual total aggregation is checked after summing; unsafe totals invalidate the model rather than being displayed.
- Regression tests cover common salary validation, overflow withholding, CPS/GPF confirmation, Professional Tax treatment, annual cut-off, duplicate months and CSV formula-prefix neutralisation.
- Employee details and monthly history remain session-only. This is a draft statement, not an official pay certificate.
