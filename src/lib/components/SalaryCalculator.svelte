<script lang="ts">
  import { onMount } from 'svelte';
  import { PAY_LEVELS, PAY_MATRIX, PAY_MATRIX_TOTAL_CELLS } from '../data/pay-matrix';
  import {
    calculateSalary,
    DEFAULT_SALARY_INPUT,
    validateGpfSubscription,
    type SalaryInput,
    type SalaryResult
  } from '../salary';
  import { SALARY_SOURCES } from '../sources';
  import { getTemporaryPay, TEMPORARY_PAY_OPTIONS } from '../temporary-pay';

  let selectedLevel = $state<number | ''>('');
  let selectedCell = $state<number | ''>('');
  let form = $state<SalaryInput>({ ...DEFAULT_SALARY_INPUT });
  let appointmentDate = $state('');
  let salaryMonth = $state('2026-11');
  let calculationError = $state('');
  let hasCalculated = $state(false);
  let dark = $state(false);
  let matrixOpen = $state(false);
  let showSources = $state(false);
  let temporaryOptionId = $state('');
  let temporaryDailyRate = $state(0);
  let temporaryPayableDays = $state(0);
  const temporaryOption = $derived(TEMPORARY_PAY_OPTIONS.find((option) => option.id === temporaryOptionId));
  const temporaryAmount = $derived(temporaryOptionId ? getTemporaryPay(temporaryOptionId, temporaryPayableDays, temporaryDailyRate) : null);

  const currentCells = $derived(selectedLevel !== '' ? PAY_MATRIX[selectedLevel] ?? [] : []);
  const daNeedsManualVerification = $derived(
    salaryMonth !== '' && (salaryMonth < '2026-01' || salaryMonth > '2026-11')
  );
  const selectedBasic = $derived(
    selectedLevel !== '' && selectedCell !== ''
      ? PAY_MATRIX[selectedLevel]?.[selectedCell - 1] ?? 0
      : 0
  );
  const result = $derived<SalaryResult | null>(
    hasCalculated && selectedBasic > 0
      ? calculateSalary({ ...form, basicPay: selectedBasic })
      : null
  );
  const fmt = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.round(value));

  onMount(() => {
    dark = localStorage.getItem('sikkim-salary-theme') === 'dark';
  });

  function changeLevel() {
    selectedCell = '';
    hasCalculated = false;
  }

  function calculate() {
    if (!selectedBasic) {
      hasCalculated = false;
      calculationError = 'Choose a pay level and cell before calculating.';
      return;
    }
    if (form.pensionMode === 'unselected') {
      hasCalculated = false;
      calculationError = 'Select the pension arrangement applicable to your service before calculating.';
      return;
    }
    if (form.pensionMode === 'cps' && form.cpsMembershipConfirmed !== true) {
      hasCalculated = false;
      calculationError = 'Confirm the employee’s CPS membership and applicable contribution basis from the signed pension option / service record and DDO or Accounts before calculating.';
      return;
    }
    if (form.pensionMode === 'gpf') {
      const gpfErrors = validateGpfSubscription(form.gpfReferencePay, form.manualPension, form.gpfMembershipConfirmed);
      if (gpfErrors.length) {
        hasCalculated = false;
        calculationError = gpfErrors[0];
        return;
      }
    }
    if (form.professionalTaxMode === 'unselected') {
      hasCalculated = false;
      calculationError = 'Select a Professional Tax treatment, enter the amount from your payslip, or mark it not applicable where exempt.';
      return;
    }
    form.professionalTaxLevelBand = Number(selectedLevel) >= 15 ? 'level-15-and-above' : 'below-level-15';
    calculationError = '';
    hasCalculated = true;
  }

  function changeSalaryMonth() {
    if (salaryMonth && (salaryMonth < '2026-01' || salaryMonth > '2026-11')) {
      form.daRate = 0;
    } else if (form.daRate === 0) {
      form.daRate = 60;
    }
    hasCalculated = false;
    calculationError = '';
  }

  function reset() {
    selectedLevel = '';
    selectedCell = '';
    form = { ...DEFAULT_SALARY_INPUT };
    appointmentDate = '';
    salaryMonth = '2026-11';
    calculationError = '';
    hasCalculated = false;
    matrixOpen = false;
  }

  function toggleTheme() {
    dark = !dark;
    localStorage.setItem('sikkim-salary-theme', dark ? 'dark' : 'light');
  }

  function printStatement() {
    window.print();
  }

</script>

<div class:dark class="app-shell min-h-screen bg-[#f4f6f3] text-slate-900 transition-colors dark:bg-[#0b1411] dark:text-slate-100">
  <div class="mx-auto flex min-h-screen max-w-[1600px]">
    <aside class="no-print hidden w-[250px] shrink-0 border-r border-slate-200/80 bg-white/80 px-5 py-6 dark:border-slate-800 dark:bg-[#0e1915] lg:flex lg:flex-col">
      <a href="#top" class="flex items-center gap-3 rounded-2xl">
        <span class="grid size-11 place-items-center rounded-2xl bg-emerald-800 text-white shadow-lg shadow-emerald-950/15">
          <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
            <path d="M4 19.5V5.8L12 2l8 3.8v13.7H4Z" />
            <path d="M8 8h8M8 11.5h8M8 15h3m2 0h3M9 19.5v-2.8h6v2.8" />
          </svg>
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-black tracking-tight">Sikkim Salary</span>
          <span class="block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Employee tools</span>
        </span>
      </a>

      <div class="mt-10">
        <p class="eyebrow px-3">Workspace</p>
        <nav class="mt-3 space-y-1" aria-label="Main navigation">
          <a href="#calculator" class="nav-link active">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h8"/></svg>
            Salary calculator
          </a>
          <a href="#pay-matrix" class="nav-link">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 4v16m6-16v16"/></svg>
            Pay matrix
          </a>
          <a href="#sources" class="nav-link">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 3.5h10l4 4V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"/><path d="M14 3.5V8h5M8 12h8M8 16h8"/></svg>
            Rules & sources
          </a>
        </nav>
      </div>

      <div class="mt-auto space-y-4">
        <div class="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div class="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
            <span class="size-2 rounded-full bg-emerald-500"></span>
            <span class="text-xs font-extrabold">Private by design</span>
          </div>
          <p class="mt-2 text-[11px] leading-5 text-emerald-900/70 dark:text-emerald-100/70">Your entries stay in this browser. No employee login or payroll account is needed.</p>
        </div>
        <p class="px-2 text-[10px] leading-4 text-slate-400">Independent estimate tool<br/>Not an official payroll system</p>
      </div>
    </aside>

    <div class="min-w-0 flex-1">
      <header id="top" class="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-[#f8faf7]/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1411]/90">
        <div class="mx-auto flex min-h-[70px] max-w-[1320px] items-center gap-3 px-4 sm:px-6 xl:px-10">
          <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white lg:hidden">
            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 19.5V5.8L12 2l8 3.8v13.7H4Z"/><path d="M8 8h8M8 11.5h8M8 15h3m2 0h3"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Government of Sikkim · Employee utility</p>
            <p class="mt-0.5 truncate text-sm font-extrabold tracking-tight">Salary estimation workspace</p>
          </div>
          <span class="hidden items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-bold text-emerald-800 sm:inline-flex dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300">
            <span class="size-1.5 rounded-full bg-emerald-500"></span>
            Local calculation
          </span>
          <button type="button" onclick={toggleTheme} class="icon-button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
            {#if dark}
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.2 15.3A8 8 0 1 1 8.7 3.8 6.2 6.2 0 0 0 20.2 15.3Z"/></svg>
            {/if}
          </button>
          <button type="button" onclick={printStatement} class="button-secondary hidden sm:inline-flex">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>
            Print
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-[1320px] px-4 pb-12 pt-7 sm:px-6 sm:pt-9 xl:px-10">
        <section class="mb-8">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div class="max-w-3xl">
              <p class="eyebrow">Monthly pay · Revised pay structure</p>
              <h1 class="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl dark:text-white">Your salary, <span class="text-emerald-800 dark:text-emerald-400">clearly explained.</span></h1>
              <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">Build a monthly estimate from your Sikkim Government pay-matrix cell, then review earnings, deductions and the estimated amount in hand.</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <span class="stat-chip"><strong>23</strong> pay levels</span>
              <span class="stat-chip"><strong>{PAY_MATRIX_TOTAL_CELLS}</strong> official pay cells</span>
              <span class="stat-chip"><strong>INR</strong> currency</span>
            </div>
          </div>
        </section>

        <section class="mb-7 grid gap-3 sm:grid-cols-3">
          <article class="info-tile">
            <span class="info-icon bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 18V6m0 12h16M7 14l3-3 3 2 5-6"/></svg>
            </span>
            <div><p class="text-xs font-bold text-slate-500 dark:text-slate-400">Pay structure</p><p class="mt-1 text-sm font-extrabold">2018 Revised Pay Matrix</p></div>
          </article>
          <article class="info-tile">
            <span class="info-icon bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v18m5-14H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6"/></svg>
            </span>
            <div><p class="text-xs font-bold text-slate-500 dark:text-slate-400">DA reference input</p><p class="mt-1 text-sm font-extrabold">60% reported from Jan 2026</p></div>
          </article>
          <article class="info-tile">
            <span class="info-icon bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 3 20h18L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>
            </span>
            <div><p class="text-xs font-bold text-slate-500 dark:text-slate-400">Important</p><p class="mt-1 text-sm font-extrabold">Verify eligibility & current orders</p></div>
          </article>
        </section>

        <section id="temporary-pay" class="mb-7 scroll-mt-28 surface-card p-5 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow">Separate pay pathway · Temporary appointments</p>
              <h2 class="mt-1 text-xl font-black tracking-tight">Temporary employee & training pay</h2>
              <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">Uses the Department of Personnel notification dated 12 August 2026 for temporary consolidated pay and the 25 July 2024 amendment for direct-recruit training allowances. This is separate from the regular pay-matrix calculator.</p>
            </div>
            <span class="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Not regular pay</span>
          </div>
          <div class="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.65fr)]">
            <div>
              <label for="temporaryPayOption" class="field-label">Appointment / post category</label>
              <select id="temporaryPayOption" bind:value={temporaryOptionId} class="field-control">
                <option value="">Select the applicable notification category</option>
                <optgroup label="Temporary Group C / D — equivalent grade pay">
                  {#each TEMPORARY_PAY_OPTIONS.filter((option) => option.id.startsWith('gp-')) as option}
                    <option value={option.id}>{option.label}</option>
                  {/each}
                </optgroup>
                <optgroup label="Temporary — specific posts">
                  {#each TEMPORARY_PAY_OPTIONS.filter((option) => option.category === 'specific-post') as option}
                    <option value={option.id}>{option.label}</option>
                  {/each}
                </optgroup>
                <optgroup label="Direct recruitment — first-year training allowance">
                  {#each TEMPORARY_PAY_OPTIONS.filter((option) => option.category === 'training') as option}
                    <option value={option.id}>{option.label}</option>
                  {/each}
                </optgroup>
                <optgroup label="Temporary driver">
                  <option value="driver-daily-wage">Driver — enter Labour Department daily wage rate</option>
                </optgroup>
              </select>
            </div>
            {#if temporaryOption?.category === 'driver-manual'}
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label for="driverDailyRate" class="field-label">Daily rate (₹)</label>
                  <input id="driverDailyRate" type="number" min="0" bind:value={temporaryDailyRate} class="field-control" />
                </div>
                <div>
                  <label for="driverDays" class="field-label">Payable days</label>
                  <input id="driverDays" type="number" min="0" max="31" bind:value={temporaryPayableDays} class="field-control" />
                </div>
              </div>
            {/if}
          </div>
          {#if temporaryOption}
            <div class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <p class="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-300">Monthly consolidated / training amount</p>
              {#if temporaryAmount !== null}
                <p class="mt-1 text-3xl font-black tracking-tight text-emerald-950 dark:text-emerald-100">{fmt(temporaryAmount)}</p>
                <p class="mt-1 text-xs text-emerald-900/70 dark:text-emerald-200/70">{temporaryOption.category === 'driver-manual' ? 'Calculated as daily rate × payable days.' : 'Amount prescribed by the selected notification row.'}</p>
              {:else}
                <p class="mt-1 text-sm font-bold text-amber-800 dark:text-amber-300">Enter a valid daily rate and payable days.</p>
              {/if}
            </div>
            {#if temporaryOption.note}
              <p class="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-400">{temporaryOption.note}</p>
            {/if}
          {/if}
          <div class="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <strong>Important:</strong> Consolidated pay is not Basic Pay in the regular pay matrix. Do not add DA, HRA, SBCA or CPS/GPF automatically to this amount. The 2026 notification specifies a separate daily-wage basis for temporary drivers. Deductions, arrears, leave salary and employee-specific terms are not calculated in this first increment; confirm the appointment order and DDO bill.
          </div>
          <div class="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p class="text-sm font-extrabold">Regularisation transition — reference only</p>
            <p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">The Department of Personnel notification dated 25 July 2024 states that certain employees regularised after completing 8 or 4 years of service as on 31 December 2023 would draw their previous temporary consolidated pay for the first year from the effective regularisation date, then be placed in Level 1/2/3 for the next four years, with pay regulated after five years under Notification No. 99/GEN/DOP dated 6 February 2020. This is a specific transition provision, not a general guarantee of regularisation. Verify later orders and the employee's individual regularisation order before using it for a pay-fixation calculation.</p>
          </div>
        </section>

        <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(390px,0.98fr)]">
          <section id="calculator" class="scroll-mt-28 space-y-5">
            <div class="surface-card overflow-hidden">
              <div class="section-heading">
                <div class="flex items-center gap-3">
                  <span class="step-badge">01</span>
                  <div>
                    <p class="text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-800 dark:text-emerald-400">Employee details</p>
                    <h2 class="text-lg font-black tracking-tight">Select your basic pay</h2>
                  </div>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Required</span>
              </div>

              <div class="space-y-5 p-5 sm:p-6">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="level" class="field-label">Pay Matrix level</label>
                    <select id="level" bind:value={selectedLevel} onchange={changeLevel} class="field-control">
                      <option value="">Choose your level</option>
                      {#each PAY_LEVELS as item}
                        <option value={item}>Level {item}</option>
                      {/each}
                    </select>
                  </div>
                  <div>
                    <label for="cell" class="field-label">Pay cell</label>
                    <select id="cell" bind:value={selectedCell} disabled={!selectedLevel} class="field-control disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="">Choose your cell</option>
                      {#each currentCells as pay, index}
                        <option value={index + 1}>Cell {index + 1} · {fmt(pay)}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <div class="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/25">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p class="text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-800/70 dark:text-emerald-300/70">Selected basic pay</p>
                      <p class="mt-1 text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-100">{selectedBasic ? fmt(selectedBasic) : '—'}</p>
                    </div>
                    {#if selectedBasic}
                      <span class="rounded-full bg-white px-3 py-1.5 text-[11px] font-extrabold text-emerald-900 shadow-sm dark:bg-emerald-900/70 dark:text-emerald-100">Level {selectedLevel} · Cell {selectedCell}</span>
                    {:else}
                      <span class="text-xs font-semibold text-emerald-900/60 dark:text-emerald-200/60">Select a level and cell</span>
                    {/if}
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="salaryMonth" class="field-label">Salary month</label>
                    <input id="salaryMonth" type="month" bind:value={salaryMonth} onchange={changeSalaryMonth} class="field-control" required />
                    <p class="field-help">Choose the month you are estimating; rule rates may change by effective date.</p>
                  </div>
                  <div>
                    <label for="appointmentDate" class="field-label">Date of appointment</label>
                    <input id="appointmentDate" type="date" bind:value={appointmentDate} class="field-control" />
                    <p class="field-help">Optional context for pension-scheme checks; it does not determine eligibility on its own.</p>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <label for="daRate" class="field-label mb-0">Dearness Allowance (DA)</label>
                    <span class="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-extrabold text-sky-800 dark:bg-sky-950 dark:text-sky-200">{daNeedsManualVerification ? 'Rate needs verification' : '60% latest reference'}</span>
                  </div>
                  <div class="relative">
                    <input id="daRate" type="number" min="0" max="200" step="0.5" bind:value={form.daRate} class="field-control pr-12 text-right font-bold tabular-nums" />
                    <span class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                  </div>
                  {#if daNeedsManualVerification}
                    <p class="field-help text-amber-700 dark:text-amber-300">The available rule register verifies 60% only for January–November 2026. For this earlier or future month, enter the rate from the applicable Finance Department order or payslip.</p>
                  {:else}
                    <p class="field-help">60% is the latest revised-pay reference located, effective 1 January 2026. Check for any later order covering the selected month and verify the rate for your employee category.</p>
                  {/if}
                </div>

                <div class="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row dark:border-slate-800">
                  <button type="button" onclick={calculate} disabled={!selectedBasic} class="button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-45">
                    Calculate monthly salary
                    <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                  </button>
                  <button type="button" onclick={reset} class="button-secondary">Reset form</button>
                </div>
                <p class="text-xs text-slate-400" aria-live="polite">{selectedBasic ? ('Ready to calculate Level ' + selectedLevel + ', Cell ' + selectedCell + ' · ' + fmt(selectedBasic)) : 'Choose your pay level and cell to continue.'}</p>
                {#if calculationError}
                  <p class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="alert">{calculationError}</p>
                {/if}
              </div>
            </div>

            <details class="surface-card group">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
                <span class="flex items-center gap-3">
                  <span class="step-badge muted">02</span>
                  <span><span class="block text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">Personalise estimate</span><span class="mt-0.5 block text-base font-black">Allowances & deductions</span></span>
                </span>
                <span class="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 dark:bg-slate-800 dark:text-slate-300"><span class="text-xl leading-none">+</span></span>
              </summary>
              <div class="space-y-5 border-t border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
                <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">These components can depend on posting, accommodation, appointment category and individual service conditions. Reference values are editable and should be checked against current orders and your payslip.</p>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="hraRate" class="field-label">HRA rate (%)</label>
                    <input id="hraRate" type="number" min="0" max="100" step="0.5" bind:value={form.hraRate} class="field-control" />
                    <p class="field-help">12% departmental disclosure reference only; not a verified universal rate.</p>
                  </div>
                  <div>
                    <label for="hraMinimum" class="field-label">HRA minimum (₹)</label>
                    <input id="hraMinimum" type="number" min="0" bind:value={form.hraMinimum} class="field-control" />
                    <p class="field-help">No current universal minimum has been verified; leave at ₹0 unless your applicable order specifies one.</p>
                  </div>
                </div>
                <label class="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-xs font-semibold leading-5 dark:border-slate-700">
                  <input type="checkbox" bind:checked={form.hraEligible} class="mt-0.5 size-4 accent-emerald-700" />
                  <span>HRA is admissible to this employee under the applicable order. Turn this off where Government accommodation is provided or HRA is otherwise not payable.</span>
                </label>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="sbcaRate" class="field-label">SBCA rate (%)</label>
                    <input id="sbcaRate" type="number" min="0" max="100" step="0.5" bind:value={form.sbcaRate} class="field-control" />
                    <p class="field-help">8% departmental disclosure reference only; eligibility and current rate are not verified for every posting.</p>
                  </div>
                  <div>
                    <label for="transport" class="field-label">Transport allowance (₹)</label>
                    <input id="transport" type="number" min="0" bind:value={form.transportAllowance} class="field-control" />
                    <p class="field-help">Enter only where admissible under the current order or shown on your payslip.</p>
                  </div>
                  <div>
                    <label for="otherEarnings" class="field-label">Other monthly earnings (₹)</label>
                    <input id="otherEarnings" type="number" min="0" bind:value={form.otherEarnings} class="field-control" />
                  </div>
                </div>

                <div class="border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">Pension and provident fund</p>
                  <div>
                    <label for="pensionMode" class="field-label">Pension deduction scheme</label>
                    <select id="pensionMode" value={form.pensionMode} onchange={(event) => { form.pensionMode = (event.currentTarget as HTMLSelectElement).value as SalaryInput['pensionMode']; form.cpsMembershipConfirmed = false; form.gpfMembershipConfirmed = false; hasCalculated = false; }} class="field-control">
                      <option value="unselected" disabled>Select applicable pension arrangement</option>
                      <option value="cps">Sikkim CPS / CPF — 10% employee contribution (where covered)</option>
                      <option value="gpf">GPF — enter monthly amount</option>
                      <option value="manual">Other pension — manual amount</option>
                      <option value="none">OPS / no employee contribution (only where applicable)</option>
                    </select>
                  </div>
                  <p class="field-help">Choose the arrangement shown in the employee’s applicable pension option, service records and DDO / Accounts confirmation. Do not infer CPS/CPF or OPS eligibility from appointment date alone.</p>
                  {#if form.pensionMode === 'cps'}
                    <label class="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      <input type="checkbox" checked={form.cpsMembershipConfirmed === true} onchange={(event) => { form.cpsMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked; hasCalculated = false; }} class="mt-1 size-4 shrink-0" />
                      <span>I have verified this employee’s CPS / CPF membership and the applicable contribution basis against the signed pension option / order, service record and DDO / Accounts confirmation.</span>
                    </label>
                    <p class="field-help">The 9 February 2024 DOP notification announced restoration of OPS for employees appointed on or after 1 April 2006 and said detailed reversion modalities would follow. Confirm the employee’s actual option / implementation status; appointment date alone is not sufficient. <a class="underline" href="https://dop.sikkim.gov.in/notificationdoc/23.pdf" target="_blank" rel="noreferrer">Notification No. 23/GEN/DOP</a>.</p>
                  {/if}
                  {#if form.pensionMode === 'gpf'}
                    <div class="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label for="gpfReferencePay" class="field-label">GPF reference pay for subscription year (₹)</label>
                        <input id="gpfReferencePay" type="number" min="1" step="1" bind:value={form.gpfReferencePay} class="field-control" />
                        <p class="field-help">Enter the rule-defined reference pay for the relevant subscription year, confirmed by Accounts / DDO. Do not automatically use current Basic Pay.</p>
                      </div>
                      <div>
                        <label for="manualPension" class="field-label">Monthly GPF subscription (₹)</label>
                        <input id="manualPension" type="number" min="0" step="1" bind:value={form.manualPension} class="field-control" />
                        <p class="field-help">Must be within 6%–100% of the reference pay under the cited Sikkim GPF rule.</p>
                      </div>
                    </div>
                    <label class="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                      <input type="checkbox" checked={form.gpfMembershipConfirmed === true} onchange={(event) => { form.gpfMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked; hasCalculated = false; }} class="mt-1 size-4 shrink-0" />
                      <span>I have verified the employee’s GPF account / membership and authority to subscribe against the service record and DDO / Accounts confirmation.</span>
                    </label>
                    <p class="field-help">GPF is an employee subscription only. No employer matching contribution is added.</p>
                  {:else if form.pensionMode === 'manual'}
                    <div class="mt-4">
                      <label for="manualPension" class="field-label">Monthly other pension amount (₹)</label>
                      <input id="manualPension" type="number" min="0" bind:value={form.manualPension} class="field-control" />
                    </div>
                  {/if}
                </div>

                <div class="border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">Statutory and other deductions</p>
                  <div>
                    <label for="ptMode" class="field-label">Professional Tax</label>
                    <select id="ptMode" bind:value={form.professionalTaxMode} class="field-control">
                      <option value="unselected" disabled>Select Professional Tax treatment</option>
                      <option value="manual">Manual amount from payslip (recommended)</option>
                      <option value="auto">Automatic — based on selected pay level</option>
                      <option value="none">Not applicable / exempt</option>
                    </select>
                    <p class="field-help">Automatic mode uses the selected pay level: ₹150 below Level 15 and ₹200 for Level 15 and above, as per the Sikkim-specific rule supplied for this calculator. Confirm applicability and any exemption with DDO / Accounts.</p>
                  </div>
                  {#if form.professionalTaxMode === 'manual'}
                    <div class="mt-4">
                      <label for="manualPt" class="field-label">Monthly Professional Tax (₹)</label>
                      <input id="manualPt" type="number" min="0" bind:value={form.manualProfessionalTax} class="field-control" />
                    </div>
                  {/if}
                  <div class="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label for="gis" class="field-label">GIS deduction (₹)</label>
                      <input id="gis" type="number" min="0" bind:value={form.gis} class="field-control" />
                      <p class="field-help">Current universal subscription rate not verified; use your payslip / office order.</p>
                    </div>
                    <div>
                      <label for="stampFee" class="field-label">Stamp / fixed fee (₹)</label>
                      <input id="stampFee" type="number" min="0" bind:value={form.stampFee} class="field-control" />
                      <p class="field-help">Enter only when required by a current order or displayed on your payslip.</p>
                    </div>
                    <div class="sm:col-span-2">
                      <label for="otherDeductions" class="field-label">TDS, loans and other deductions (₹)</label>
                      <input id="otherDeductions" type="number" min="0" bind:value={form.otherDeductions} class="field-control" />
                    </div>
                  </div>
                </div>
              </div>
            </details>

            <section class="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div class="flex gap-3">
                <svg viewBox="0 0 24 24" class="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 3 20h18L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>
                <div><p class="text-xs font-extrabold text-amber-950 dark:text-amber-100">Use this as an estimate</p><p class="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-100/70">Rates, eligibility and deductions can change through Government orders. Confirm the applicable month, service category and employee-specific entitlements with your DDO / Accounts section.</p></div>
              </div>
            </section>
          </section>

          <section class="min-w-0 space-y-5">
            {#if result}
              <section class="result-card print-card" aria-live="polite">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-100/70">Monthly estimate</p>
                    <h2 class="mt-1 text-lg font-black tracking-tight text-white">Estimated take-home pay</h2>
                  </div>
                  <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-50">Illustrative</span>
                </div>
                <p class="mt-7 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">{fmt(result.takeHome)}</p>
                <p class="mt-2 text-xs font-medium text-emerald-50/70">{salaryMonth} · Level {selectedLevel} · Cell {selectedCell} · Basic {fmt(result.basicPay)}</p>
                <div class="mt-7 grid grid-cols-2 gap-3">
                  <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-50/65">Gross earnings</p>
                    <p class="mt-1 text-xl font-extrabold text-white">{fmt(result.gross)}</p>
                  </div>
                  <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-emerald-50/65">Deductions</p>
                    <p class="mt-1 text-xl font-extrabold text-white">{fmt(result.totalDeductions)}</p>
                  </div>
                </div>
                <div class="mt-5 flex items-center justify-between gap-4 border-t border-white/15 pt-4 text-xs text-emerald-50/75">
                  <span>Calculation updates when you edit an input after calculating.</span>
                  <button type="button" onclick={printStatement} class="rounded-lg border border-white/20 px-3 py-2 font-bold text-white transition hover:bg-white/10">Print result</button>
                </div>
                {#if form.pensionMode === 'cps'}
                  <p class="mt-4 rounded-xl border border-white/15 bg-white/5 p-3 text-xs leading-5 text-emerald-50/80">After CPS membership is explicitly confirmed, this calculator applies the configured 10% employee share on Basic Pay + DA and shows an equal State share separately. Verify the applicable base and current scheme treatment against the employee’s option and Finance / DDO records.</p>
                {/if}
              </section>

              <section class="surface-card p-5 sm:p-6">
                <div class="flex items-center justify-between gap-3">
                  <div><p class="eyebrow">Calculation details</p><h2 class="mt-1 text-lg font-black">Salary breakdown</h2></div>
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">INR / month</span>
                </div>

                <div class="mt-5">
                  <div class="mb-2 flex items-center justify-between"><p class="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-800 dark:text-emerald-400">Earnings</p><span class="text-xs font-bold text-slate-400">{fmt(result.gross)}</span></div>
                  <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-700">
                    {#each [
                      { label: 'Basic Pay', value: result.basicPay },
                      { label: 'Dearness Allowance (' + result.daRate + '%)', value: result.da },
                      { label: 'House Rent Allowance', value: result.hra },
                      { label: 'SBCA', value: result.sbca },
                      { label: 'Transport Allowance', value: result.transportAllowance },
                      { label: 'Other monthly earnings', value: result.otherEarnings }
                    ] as item}
                      <div class="flex items-center justify-between gap-4 py-3 text-sm"><span class="text-slate-500 dark:text-slate-400">{item.label}</span><strong class="tabular-nums">{fmt(item.value)}</strong></div>
                    {/each}
                  </div>
                  <div class="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200"><span>Gross salary</span><span class="tabular-nums">{fmt(result.gross)}</span></div>
                </div>

                <div class="mt-6">
                  <div class="mb-2 flex items-center justify-between"><p class="text-[10px] font-extrabold uppercase tracking-[0.16em] text-rose-700 dark:text-rose-300">Employee deductions</p><span class="text-xs font-bold text-slate-400">{fmt(result.totalDeductions)}</span></div>
                  <div class="divide-y divide-slate-100 rounded-xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-700">
                    {#each [
                      { label: result.pensionLabel, value: result.employeePension },
                      { label: 'Professional Tax (' + result.professionalTaxBand + ')', value: result.professionalTax },
                      { label: 'GIS deduction', value: result.gis },
                      { label: 'Stamp / fixed fee', value: result.stampFee },
                      { label: 'TDS, loans and other deductions', value: result.otherDeductions }
                    ] as item}
                      <div class="flex items-center justify-between gap-4 py-3 text-sm"><span class="max-w-[70%] text-slate-500 dark:text-slate-400">{item.label}</span><strong class="whitespace-nowrap tabular-nums">{fmt(item.value)}</strong></div>
                    {/each}
                  </div>
                  <div class="mt-2 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-950 dark:bg-rose-950/40 dark:text-rose-200"><span>Total deductions</span><span class="tabular-nums">{fmt(result.totalDeductions)}</span></div>
                </div>

                {#if result.employerCpsContribution > 0}
                  <div class="mt-5 rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                    <div class="flex items-start justify-between gap-4"><div><p class="text-sm font-extrabold text-sky-950 dark:text-sky-100">State matching CPS contribution</p><p class="mt-1 text-xs leading-5 text-sky-900/75 dark:text-sky-100/70">Shown separately; this amount is not deducted from employee take-home pay.</p></div><strong class="whitespace-nowrap text-sm tabular-nums text-sky-950 dark:text-sky-100">{fmt(result.employerCpsContribution)}</strong></div>
                  </div>
                {/if}
              </section>
            {:else}
              <section class="empty-state">
                <div class="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <svg viewBox="0 0 24 24" class="size-7" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2"/></svg>
                </div>
                <p class="eyebrow mt-5">Your result space</p>
                <h2 class="mt-2 text-xl font-black tracking-tight">Your salary summary will appear here.</h2>
                <p class="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">Choose a pay level and cell, personalise any applicable allowances and deductions, then calculate to see the full breakdown.</p>
                <div class="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-2 text-left">
                  <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><span class="block text-[10px] font-bold text-slate-400">01</span><span class="mt-1 block text-xs font-extrabold">Basic pay</span></div>
                  <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><span class="block text-[10px] font-bold text-slate-400">02</span><span class="mt-1 block text-xs font-extrabold">Allowances</span></div>
                  <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><span class="block text-[10px] font-bold text-slate-400">03</span><span class="mt-1 block text-xs font-extrabold">Deductions</span></div>
                </div>
              </section>
            {/if}

            <section class="surface-card p-5 sm:p-6">
              <h2 class="text-sm font-black">How this estimate is built</h2>
              <div class="mt-4 space-y-3">
                <div class="flex gap-3"><span class="number-dot">1</span><p class="text-xs leading-5 text-slate-600 dark:text-slate-400"><strong class="text-slate-900 dark:text-slate-200">DA</strong> is the selected percentage of Basic Pay.</p></div>
                <div class="flex gap-3"><span class="number-dot">2</span><p class="text-xs leading-5 text-slate-600 dark:text-slate-400"><strong class="text-slate-900 dark:text-slate-200">HRA and SBCA</strong> use editable reference rates; HRA can be switched off.</p></div>
                <div class="flex gap-3"><span class="number-dot">3</span><p class="text-xs leading-5 text-slate-600 dark:text-slate-400"><strong class="text-slate-900 dark:text-slate-200">CPS</strong> is calculated only after individual membership and the applicable contribution basis are confirmed; the State share is shown separately.</p></div>
                <div class="flex gap-3"><span class="number-dot">4</span><p class="text-xs leading-5 text-slate-600 dark:text-slate-400"><strong class="text-slate-900 dark:text-slate-200">Professional Tax</strong> uses the Sikkim pay-level bands: ₹150 below Level 15 and ₹200 for Level 15 and above.</p></div>
              </div>
            </section>
          </section>
        </div>

        <section id="pay-matrix" class="scroll-mt-28 mt-8 surface-card p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3"><span class="step-badge muted">03</span><div><p class="eyebrow">Reference table</p><h2 class="text-lg font-black">Sikkim Government pay matrix</h2></div></div>
            <button type="button" onclick={() => (matrixOpen = !matrixOpen)} class="button-secondary">{matrixOpen ? 'Close matrix' : 'Explore pay cells'}</button>
          </div>
          <p class="mt-3 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">Choose a level in the calculator to browse the cells printed for that level in the official Government schedule. Selecting a cell here also updates the employee details form.</p>
          {#if matrixOpen && selectedLevel !== ''}
            <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p class="text-sm font-extrabold">Level {selectedLevel} <span class="font-normal text-slate-400">· {currentCells.length} cells</span></p>
              <p class="text-xs text-slate-400">Select a cell to use it as Basic Pay</p>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {#each currentCells as pay, index}
                <button type="button" onclick={() => { selectedCell = index + 1; hasCalculated = false; }} class={selectedCell === index + 1 ? 'matrix-cell selected' : 'matrix-cell'}>
                  <span>Cell {index + 1}</span><strong>{fmt(pay)}</strong>
                </button>
              {/each}
            </div>
          {:else if matrixOpen}
            <div class="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Select a Pay Matrix level in the calculator above to view its pay cells.</div>
          {/if}
        </section>

        <section id="sources" class="scroll-mt-28 mt-5 surface-card p-5 sm:p-6">
          <button type="button" onclick={() => (showSources = !showSources)} class="flex w-full items-center justify-between gap-4 text-left">
            <span class="flex items-center gap-3"><span class="step-badge muted">04</span><span><span class="eyebrow block">Transparency</span><span class="mt-0.5 block text-lg font-black">Rules & official sources</span><span class="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Review the references and limitations behind the estimates.</span></span></span>
            <span class="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><span class="text-xl">{showSources ? '−' : '+'}</span></span>
          </button>
          {#if showSources}
            <div class="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2 dark:border-slate-800">
              {#each SALARY_SOURCES as source}
                <article class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 dark:border-slate-700 dark:hover:border-emerald-800">
                  <a href={source.url} target="_blank" rel="noreferrer" class="text-sm font-extrabold leading-5 text-emerald-900 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-700 dark:text-emerald-300">{source.title}</a>
                  <p class="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">{source.authority}</p>
                  <p class="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-400">{source.note}</p>
                </article>
              {/each}
            </div>
          {/if}
        </section>

        <footer class="no-print mt-8 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400">
          <span>Built for Sikkim Government employees · Independent estimate tool</span>
          <span>Confirm applicable rules and employee-specific entitlements with your DDO / Accounts section.</span>
        </footer>
      </main>
    </div>
  </div>
</div>
