# Sikkim Government Salary Calculator

A Sikkim-specific salary estimation application rebuilt with **SvelteKit 3, Svelte 5, TypeScript and Tailwind CSS 4**.

The app preserves the repository's 23 pay levels and 920 pay-matrix cells while separating calculation logic, source references, UI components and automated tests.

> This is an estimate tool, not an official Government payroll system. Confirm rates and eligibility with the applicable signed Government order and the employee's DDO / Accounts section.

## Technology

- SvelteKit 3 and Svelte 5
- TypeScript
- Tailwind CSS 4 with the official Vite plugin
- Vitest for calculation regression tests
- Vercel adapter
- Node.js 24+

## Features

- All 23 State pay levels and 40 pay cells per level.
- Editable DA rate, with 60% shown as the most recently publicly reported revised-pay rate effective 1 January 2026. Verify the signed Finance Department order before payroll use.
- Editable HRA and SBCA reference rates, HRA eligibility and optional HRA minimum.
- Manual transport and other monthly earnings.
- Sikkim CPS employee contribution at 10% of Basic Pay + DA for eligible covered employees, with the State matching share displayed separately.
- GPF, manual pension and no-pension options.
- Sikkim Professional Tax salary slabs, with manual and exempt overrides.
- Editable GIS, stamp/fixed fee, TDS, loan and other deductions.
- Gross earnings, employee deductions, take-home pay and separate State CPS contribution.
- Interactive pay-matrix viewer, responsive layout, dark mode, print-friendly statement and source register.
- Browser-only calculations. No employee identity, bank details or payroll credentials are requested.

## Project structure

- src/routes — SvelteKit routes and layout.
- src/lib/components — Svelte UI components.
- src/lib/data/pay-matrix.ts — 23 × 40 pay-matrix data.
- src/lib/salary.ts — framework-independent salary calculation engine.
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

- Pay matrix data is retained from the previous app and should be checked cell-by-cell against the signed 2018 Rules schedule before official use.
- The 60% DA default is based on public reporting; the signed State circular was not located during implementation.
- HRA 12% and SBCA 8% are departmental reference values, not claims of universal eligibility.
- Sikkim CPS is not assumed to be identical to every Central Government NPS arrangement. Appointment category and rule exclusions matter.
- GIS, transport, stamp fee, tax deductions and loans remain employee-specific inputs.
- Automatic Professional Tax uses the Sikkim salary-earner slabs; manual override is available.

## License

No license file is currently provided. Obtain permission from the repository owner before reuse or redistribution.
