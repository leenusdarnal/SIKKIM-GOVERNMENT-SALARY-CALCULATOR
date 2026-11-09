# Sikkim Government Salary Calculator

A Sikkim-specific salary estimation application rebuilt with **SvelteKit 3, Svelte 5, TypeScript and Tailwind CSS 4**.

The app preserves the repository's 23 pay levels and 794 official pay-matrix cells while separating calculation logic, source references, UI components and automated tests.

> This is an estimate tool, not an official Government payroll system. Confirm rates and eligibility with the applicable signed Government order and the employee's DDO / Accounts section.

## Technology

- SvelteKit 3 and Svelte 5
- TypeScript
- Tailwind CSS 4 with the official Vite plugin
- Vitest for calculation regression tests
- Vercel adapter
- Node.js 24+

## Features

- All 23 State pay levels with the exact variable cell counts printed in Schedule Part A (794 cells total).
- Separate temporary consolidated-pay calculator based on Department of Personnel Notification No. M(164)/42/GEN/DOP dated 12 August 2026, including equivalent-grade-pay and specific-post categories.
- Direct-recruit first-year training allowance references by group and training location; temporary driver pay remains manually entered from the Labour Department daily-wage rate.
- Salary-month field and editable DA rate; 60% is the latest located revised-pay rate effective 1 January 2026. Historical months require a manually verified rate.
- HRA and SBCA are not presumed payable: HRA starts disabled and SBCA starts at 0%; reference rates remain editable.
- Manual transport and other monthly earnings.
- Explicit pension-scheme selection; CPS/CPF employee contribution at 10% of Basic Pay + DA is calculated only when the user selects it, with the State matching share shown separately.
- GPF, manual pension and no-pension options.
- Sikkim Professional Tax salary slabs, with manual and exempt overrides.
- Editable GIS, stamp/fixed fee, TDS, loan and other deductions.
- Gross earnings, employee deductions, take-home pay and separate State CPS contribution.
- Interactive pay-matrix viewer, responsive layout, dark mode, print-friendly statement and source register.
- Browser-only calculations. No employee identity, bank details or payroll credentials are requested.

## Project structure

- src/routes — SvelteKit routes and layout.
- src/lib/components — Svelte UI components.
- src/lib/data/pay-matrix.ts — 23 Government pay levels and 794 official pay-matrix cells.
- src/lib/salary.ts — framework-independent regular salary calculation engine.
- src/lib/temporary-pay.ts — temporary consolidated-pay and training allowance schedule.
- src/lib/sources.ts — source register rendered in the app.
- src/lib/salary.test.ts — Vitest calculation and matrix tests.
- SOURCES.md — expanded source evidence and limitations.

## Run locally

Requirements: Node.js 24+ and npm.

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run check
npm test
npm run build
```

GitHub Actions runs all three checks on pushes and pull requests.

## Deploy to Vercel

The repository is configured with @sveltejs/adapter-vercel and vercel.json. Connect the GitHub repository to the existing Vercel project, then use:

- Install command: npm install
- Build command: npm run build
- Framework preset: SvelteKit

The adapter manages the output directory. Node.js 24 is selected through .nvmrc and package.json.

## Source and calculation notes

See [SOURCES.md](SOURCES.md) for notification references, links and caveats. Important qualifications:

- The full Government pay matrix is in the 2018 Revised Pay Rules Schedule, Part A. The separately listed State Bank-hosted reference PDF is treated as an operational reference for Sikkim State Government employees and contains only selected levels; all 23 Government levels are retained.
- The 60% DA reference is based on Finance Department Circular No. GOS/1(32)/Bud/Fin/2001-2002/Part II/07 dated 1 October 2026, effective 1 January 2026; verify later orders and employee category.
- HRA 12% and SBCA 8% are departmental reference values, not universal entitlements; HRA is disabled and SBCA is 0% by default.
- Pension scheme eligibility is employee- and service-specific. The calculator requires explicit selection and does not infer CPS/CPF or OPS from appointment date alone.
- GIS, transport, stamp fee, tax deductions and loans remain employee-specific inputs.
- Automatic Professional Tax uses the Sikkim salary-earner slabs; manual override is available.

## License

No license file is currently provided. Obtain permission from the repository owner before reuse or redistribution.


### Allowance and deduction safeguards

HRA, SBCA, transport and other posting-specific allowances are not assumed to be universal entitlements. Professional Tax requires an explicit selection; the automatic gross-pay slab is an optional estimate, while manual payslip entry is the recommended path pending confirmation of the statutory assessment base and individual exemptions. See [SOURCES.md](SOURCES.md) and [ALLOWANCE-DEDUCTION-AUDIT.md](ALLOWANCE-DEDUCTION-AUDIT.md).
