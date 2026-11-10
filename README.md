# Sikkim Government Salary Calculator

A Sikkim-specific salary estimation application built with SvelteKit 3, Svelte 5, TypeScript and Tailwind CSS 4.

> This is an estimate tool, not an official Government payroll system. Confirm rates and eligibility with the applicable signed Government order and the employee's DDO / Accounts section.

## Features
- Salary-first home page: choose Pay Level, Basic Pay and DA, then calculate a simple Basic Pay + DA gross estimate. Allowances, deductions, historical salary context and the separate employee tools appear only after the first result, when the user chooses to open them.
- All 23 State pay levels with the exact variable cell counts printed in Schedule Part A (794 cells total).
- Temporary consolidated-pay and direct-recruit training allowance calculator at /temporary-pay, with source references, effective-date checks, explicit applicability confirmation and no unsupported partial-month proration.
- Editable DA rate; 60% is the latest located revised-pay rate effective 1 January 2026. Historical months require a manually verified rate.
- HRA and SBCA are not presumed payable: HRA starts disabled and SBCA starts at 0%.
- Explicit pension-scheme selection; CPS/CPF employee contribution is calculated only when selected, with the State matching share shown separately.
- GPF, manual pension, Professional Tax manual/estimate/exempt options and editable employee-specific deductions.
- Historical rate schedule manager in the arrears planner: add, edit and delete source-referenced, effective-dated DA, HRA, SBCA and transport entries; select components for month-by-month arrears calculations. Unverified or missing periods block use, and schedules are included in local autosave and JSON backups.
- Pay progression and service history: exact matrix-cell scenario, explicit eligibility confirmation, an authority-led target-level matrix placement cross-check (no assumed fixation formula), and a chronological service record saved in browser-local storage, with validated JSON backup/restore and CSV export. Individual entries can be edited or deleted, with search by date/event/pay details/reference and filters by event/date range.
- GPF contribution planner: estimates monthly and annual subscription using the Sikkim GPF Rules' 6%–100% limits, with manual reference-pay input and explicit membership caveats.
- Salary arrears planner: month-by-month revised take-home using opening salary components and effective-dated DA/basic-pay changes for increments, promotion or pay fixation; supports historical HRA eligibility/rate, SBCA, transport, other earnings, pension/GPF, Professional Tax, GIS and deduction changes. Compares itemized monthly salary against actual net credited salary, subtracts separately entered arrears recoveries and exports a detailed CSV statement. Drafts auto-save locally, with versioned JSON backup/restore and validated monthly payslip CSV template/import.
- Browser-only calculations. No employee identity, bank details or payroll credentials are requested.

## Project structure

- Regular salary, payslip and arrears workflows share the same salary input validation guard; invalid and out-of-range salary inputs are withheld from result reports.
- src/routes — SvelteKit routes; /temporary-pay provides temporary/training pay, /pay-progression provides pay history, /gpf-planner provides the GPF planner, and /arrears-planner provides the arrears estimator.
- src/lib/data/pay-matrix.ts — 23 Government pay levels and 794 official cells.
- src/lib/salary.ts — regular salary calculation engine.
- src/lib/pay-progression.ts — pay-cell progression and history validation.
- src/lib/pay-history-management.ts — validated edit/delete helpers and chronology-preserving updates.
- src/lib/pay-history-storage.ts — browser-local history persistence, versioned backup/restore and CSV export.
- src/lib/arrears.ts — effective-dated month-by-month arrears model and CSV statement export.
- src/lib/historical-rates.ts — source-backed effective-dated DA, HRA, SBCA and transport-rate validation and resolution.
- src/lib/HistoricalRateEditor.svelte — add/edit/delete interface for historical rate schedules.
- src/lib/arrears-storage.ts — browser-local arrears draft persistence, versioned JSON backup/restore and monthly payslip CSV import/template.
- src/lib/temporary-pay.ts — source/effective-dated temporary consolidated-pay and training allowance schedule with guarded calculation.
- TEMPORARY-PAY-AUDIT.md — temporary-pay sources, validation rules and limitations.
- src/lib/sources.ts — in-app source register.
- SOURCES.md — source evidence and limitations.
- PAY-PROGRESSION-AUDIT.md — progression scope, sources and limitations.
- PAY-HISTORY-STORAGE-AUDIT.md — service-history storage, backup and data-handling notes. The same page also supports individual record management and filtering.
- ARREARS-PLANNER-AUDIT.md — arrears formula, effective-dated inputs, assumptions and exclusions.
- HISTORICAL-RATE-ENGINE-AUDIT.md — historical rate schedule validation, provenance requirements and limitations.

## Run locally
Requires Node.js 24+ and npm.

    npm install
    npm run dev

## Quality checks

    npm run check
    npm test
    npm run build

GitHub Actions runs all three checks on pushes and pull requests.

## Deploy to Vercel
The repository is configured with @sveltejs/adapter-vercel and vercel.json. Connect the GitHub repository to the existing Vercel project. Use install command npm install, build command npm run build, and framework preset SvelteKit.

## Deploy to GitHub Pages

GitHub Actions builds a separate static version with SvelteKit's static adapter and deploys it automatically whenever changes are pushed to `main`. The Vercel adapter and existing Vercel deployment remain unchanged.

- **GitHub Pages:** https://leenusdarnal.github.io/SIKKIM-GOVERNMENT-SALARY-CALCULATOR/
- **Build locally:** `npm run build:github-pages`
- **Workflow:** [Deploy to GitHub Pages](./.github/workflows/deploy-pages.yml)

The GitHub Pages build uses the repository base path and a 404 fallback for client-side routes. The live URL becomes available after the first successful Pages deployment and after GitHub Pages is enabled for this repository (Settings → Pages → Build and deployment → GitHub Actions).

## Source and calculation notes
See SOURCES.md. The 2018 Revised Pay Rules specify 1 January and 1 July as increment dates, but individual eligibility is not inferred from appointment date alone. The progression page is a service-record aid, not a pay-fixation authority. Direct-recruit fixation, promotion fixation, retrospective arrears and cohort-specific regularisation/ACPS calculations remain unautomated pending complete rule validation.

## License
No license file is currently provided. Obtain permission from the repository owner before reuse or redistribution.


### Printable salary / arrears statement
The arrears planner includes a print-ready A4 landscape statement for DDO / Accounts review. It is enabled only after valid calculation and complete monthly actual-pay entry. Optional employee metadata is session-only and excluded from draft persistence and JSON backups. Use the browser Print dialog and choose Save as PDF. See [SALARY-ARREARS-STATEMENT-AUDIT.md](./SALARY-ARREARS-STATEMENT-AUDIT.md). This is a draft calculation aid, not an official pay certificate or sanction.


### Retirement benefits estimator
The /retirement-planner route provides an employee-specific worksheet for monthly pension, commutation, gratuity and leave encashment. All scheme rates, emoluments bases, service units, multipliers, divisors and ceilings must be entered from applicable current signed orders and DDO / Accounts confirmation. The module deliberately starts with zero values and does not infer OPS/CPS/CPF/NPS/GPF eligibility. See [RETIREMENT-PLANNER-AUDIT.md](./RETIREMENT-PLANNER-AUDIT.md). It is an illustration, not a pension sanction calculator.


### Monthly salary slip generator
The /payslip-generator route creates a monthly draft salary statement using the existing salary calculation engine. It includes employee/payroll metadata, earnings and deductions, employer CPS contribution as informational, print / Save as PDF, CSV export, an annual summary of explicitly entered month snapshots and comparison with the most recent earlier month. Employee data and history remain session-only. Annual totals include only recorded months. See [PAYSLIP-GENERATOR-AUDIT.md](./PAYSLIP-GENERATOR-AUDIT.md).


### Integration QA note
Professional Tax supports a manual amount (recommended) and an optional ₹150 / ₹200 pay-level reference estimate supplied for this project. The estimate is not an independently verified statutory rule: the current official salary/wage schedule uses income-based ranges whose boundary wording needs clarification. Verify the employee-specific deduction with the current notification and DDO / Accounts before using the estimate. See [INTEGRATION-QA-AUDIT.md](./INTEGRATION-QA-AUDIT.md) and [SOURCES.md](./SOURCES.md).
