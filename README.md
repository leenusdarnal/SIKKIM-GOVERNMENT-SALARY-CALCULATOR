# Sikkim Government Salary Calculator

A Sikkim-specific salary estimation application built with SvelteKit 3, Svelte 5, TypeScript and Tailwind CSS 4.

> This is an estimate tool, not an official Government payroll system. Confirm rates and eligibility with the applicable signed Government order and the employee's DDO / Accounts section.

## Features
- All 23 State pay levels with the exact variable cell counts printed in Schedule Part A (794 cells total).
- Temporary consolidated-pay and direct-recruit training allowance references from applicable Department of Personnel notifications.
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
- src/routes — SvelteKit routes; /pay-progression provides pay history, /gpf-planner provides the GPF planner, and /arrears-planner provides the arrears estimator.
- src/lib/data/pay-matrix.ts — 23 Government pay levels and 794 official cells.
- src/lib/salary.ts — regular salary calculation engine.
- src/lib/pay-progression.ts — pay-cell progression and history validation.
- src/lib/pay-history-management.ts — validated edit/delete helpers and chronology-preserving updates.
- src/lib/pay-history-storage.ts — browser-local history persistence, versioned backup/restore and CSV export.
- src/lib/arrears.ts — effective-dated month-by-month arrears model and CSV statement export.\n- src/lib/historical-rates.ts — source-backed effective-dated DA, HRA, SBCA and transport-rate validation and resolution.
- src/lib/arrears-storage.ts — browser-local arrears draft persistence, versioned JSON backup/restore and monthly payslip CSV import/template.
- src/lib/temporary-pay.ts — temporary consolidated-pay and training allowance schedule.
- src/lib/sources.ts — in-app source register.
- SOURCES.md — source evidence and limitations.
- PAY-PROGRESSION-AUDIT.md — progression scope, sources and limitations.
- PAY-HISTORY-STORAGE-AUDIT.md — service-history storage, backup and data-handling notes. The same page also supports individual record management and filtering.
- ARREARS-PLANNER-AUDIT.md — arrears formula, effective-dated inputs, assumptions and exclusions.\n- HISTORICAL-RATE-ENGINE-AUDIT.md — historical rate schedule validation, provenance requirements and limitations.

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

## Source and calculation notes
See SOURCES.md. The 2018 Revised Pay Rules specify 1 January and 1 July as increment dates, but individual eligibility is not inferred from appointment date alone. The progression page is a service-record aid, not a pay-fixation authority. Direct-recruit fixation, promotion fixation, retrospective arrears and cohort-specific regularisation/ACPS calculations remain unautomated pending complete rule validation.

## License
No license file is currently provided. Obtain permission from the repository owner before reuse or redistribution.
