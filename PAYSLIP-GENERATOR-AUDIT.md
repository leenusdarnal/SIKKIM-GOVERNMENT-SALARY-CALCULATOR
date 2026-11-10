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
