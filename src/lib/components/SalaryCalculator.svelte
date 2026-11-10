<script lang="ts">
  import { onMount } from 'svelte';
  import { PAY_LEVELS, PAY_MATRIX } from '../data/pay-matrix';
  import {
    calculateSalary,
    DEFAULT_SALARY_INPUT,
    validateSalaryInput,
    type SalaryInput,
    type SalaryResult
  } from '../salary';
  import { SALARY_SOURCES } from '../sources';

  let selectedLevel = $state<number | ''>('');
  let selectedCell = $state<number | ''>('');
  let form = $state<SalaryInput>({ ...DEFAULT_SALARY_INPUT });
  let salaryMonth = $state('2026-11');
  let calculationError = $state('');
  let advancedError = $state('');
  let hasCalculated = $state(false);
  let advancedApplied = $state(false);
  let clientReady = $state(false);
  let dark = $state(false);
  let matrixOpen = $state(false);
  let showSources = $state(false);
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
      ? calculateSalary(
          advancedApplied
            ? { ...form, basicPay: selectedBasic }
            : {
                ...DEFAULT_SALARY_INPUT,
                basicPay: selectedBasic,
                daRate: Number(form.daRate),
                pensionMode: 'none',
                professionalTaxMode: 'none',
                professionalTaxLevelBand: Number(selectedLevel) >= 15
                  ? 'level-15-and-above'
                  : 'below-level-15'
              }
        )
      : null
  );
  const fmt = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Math.round(value));

  onMount(() => {
    try {
      dark = localStorage.getItem('sikkim-salary-theme') === 'dark';
    } catch {
      // Theme persistence is optional; a restricted browser still gets the light theme.
      dark = false;
    }
    clientReady = true;
  });

  function changeLevel(event: Event) {
    const value = (event.currentTarget as HTMLSelectElement).value;
    selectedLevel = value === '' ? '' : Number(value);
    selectedCell = '';
    hasCalculated = false;
    advancedApplied = false;
    advancedError = '';
  }

  function calculate() {
    if (!selectedBasic) {
      hasCalculated = false;
      calculationError = 'Choose a pay level and basic pay before calculating.';
      return;
    }

    const daRate = Number(form.daRate);
    if (!Number.isFinite(daRate) || daRate < 0 || daRate > 200) {
      hasCalculated = false;
      calculationError = 'Enter a valid DA rate between 0% and 200%.';
      return;
    }

    calculationError = '';
    advancedError = '';
    advancedApplied = false;
    hasCalculated = true;
  }

  function applyAdvanced() {
    form.professionalTaxLevelBand = Number(selectedLevel) >= 15
      ? 'level-15-and-above'
      : 'below-level-15';

    const errors = validateSalaryInput({ ...form, basicPay: selectedBasic });
    if (daNeedsManualVerification && Number(form.daRate) === 0) {
      errors.unshift('Enter the DA rate verified for the selected salary month.');
    }
    if (errors.length) {
      advancedError = errors[0];
      advancedApplied = false;
      return;
    }

    advancedError = '';
    advancedApplied = true;
  }

  function changeSalaryMonth() {
    if (salaryMonth && (salaryMonth < '2026-01' || salaryMonth > '2026-11')) {
      form.daRate = 0;
    } else if (form.daRate === 0) {
      form.daRate = 60;
    }
    advancedApplied = false;
    advancedError = '';
    calculationError = '';
  }

  function reset() {
    selectedLevel = '';
    selectedCell = '';
    form = { ...DEFAULT_SALARY_INPUT };
    salaryMonth = '2026-11';
    calculationError = '';
    advancedError = '';
    advancedApplied = false;
    hasCalculated = false;
    matrixOpen = false;
    showSources = false;
  }

  function toggleTheme() {
    dark = !dark;
    try {
      localStorage.setItem('sikkim-salary-theme', dark ? 'dark' : 'light');
    } catch {
      // Keep the in-memory theme toggle usable when browser storage is unavailable.
    }
  }

  function printStatement() {
    window.print();
  }

</script>

<div data-client-ready={clientReady ? 'true' : 'false'} class:dark class="app-shell min-h-screen bg-[#f4f6f3] text-slate-900 transition-colors dark:bg-[#0b1411] dark:text-slate-100">
  <div class="mx-auto flex min-h-screen max-w-[1600px]">


    <div class="min-w-0 flex-1">
      <header id="top" class="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-[#f8faf7]/90 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0b1411]/90">
        <div class="mx-auto flex min-h-[70px] max-w-[1320px] items-center gap-3 px-4 sm:px-6 xl:px-10">
          <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white">
            <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 19.5V5.8L12 2l8 3.8v13.7H4Z"/><path d="M8 8h8M8 11.5h8M8 15h3m2 0h3"/></svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Government of Sikkim · Employee utility</p>
            <p class="mt-0.5 text-sm font-extrabold tracking-tight sm:hidden">Sikkim Salary</p>
            <p class="mt-0.5 hidden truncate text-sm font-extrabold tracking-tight sm:block">Salary calculator</p>
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
          {#if hasCalculated}
            <button type="button" onclick={printStatement} class="button-secondary hidden sm:inline-flex">
              <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7z"/></svg>
              Print
            </button>
          {/if}
        </div>
      </header>

      <main class="mx-auto w-full max-w-3xl px-4 pb-12 pt-7 sm:px-6 sm:pt-9">
        <section class="mb-7">
          <p class="eyebrow">Government of Sikkim · Monthly pay estimate</p>
          <h1 class="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl dark:text-white">Sikkim Government Salary Calculator</h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">Select your Pay Matrix level, Basic Pay and Dearness Allowance to calculate your monthly salary.</p>
        </section>

        <div class="mx-auto grid w-full items-start gap-6">
          <section id="calculator" class="scroll-mt-28 space-y-5">
            <div class="surface-card overflow-hidden">
              <div class="section-heading">
                <div class="flex items-center gap-3">
                  <span class="step-badge">01</span>
                  <div>
                    <p class="text-[10px] font-extrabold uppercase tracking-[0.17em] text-emerald-800 dark:text-emerald-400">Step 1 · Select your pay</p>
                    <h2 class="text-lg font-black tracking-tight">Choose Pay Level and Basic Pay</h2>
                  </div>
                </div>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Required</span>
              </div>

              <div class="space-y-5 p-5 sm:p-6">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="level" class="field-label">Pay Level</label>
                    <select id="level" bind:value={selectedLevel} onchange={changeLevel} class="field-control">
                      <option value="">Choose your level</option>
                      {#each PAY_LEVELS as item}
                        <option value={item}>Level {item}</option>
                      {/each}
                    </select>
                  </div>
                  <div>
                    <label for="cell" class="field-label">Basic Pay</label>
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

                <div>
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <label for="daRate" class="field-label mb-0">Dearness Allowance (DA)</label>
                    <output for="daRate" class="rounded-full bg-sky-50 px-3 py-1 text-sm font-extrabold tabular-nums text-sky-800 dark:bg-sky-950 dark:text-sky-200">{Number(form.daRate).toFixed(1)}%</output>
                  </div>
                  <input id="daRate" type="range" min="0" max="200" step="0.5" bind:value={form.daRate} class="w-full accent-emerald-700" aria-describedby="da-help" />
                  <div class="mt-1 flex justify-between text-[10px] font-semibold text-slate-400"><span>0%</span><span>100%</span><span>200%</span></div>
                  <p id="da-help" class="field-help">60% is the latest located revised-pay reference for January–November 2026. Verify the latest applicable Finance Department order before use.</p>
                </div>

                <div class="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row dark:border-slate-800">
                  <button type="button" onclick={calculate} disabled={!selectedBasic} class="button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-45">
                    Calculate Salary
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



            <section class="surface-card p-5 sm:p-6">
              <h2 class="text-sm font-black">Calculation formula</h2>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Dearness Allowance</p>
                  <p class="mt-1 text-sm font-extrabold">Basic Pay × DA rate</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Basic gross estimate</p>
                  <p class="mt-1 text-sm font-extrabold">Basic Pay + DA</p>
                </div>
              </div>
              <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">HRA, SBCA, transport and employee-specific deductions are not assumed in this first estimate. You can add them after calculating.</p>
            </section>

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
                    <h2 class="mt-1 text-lg font-black tracking-tight text-white">{advancedApplied ? 'Estimated take-home pay' : 'Estimated monthly gross salary'}</h2>
                  </div>
                  <span class="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-50">Illustrative</span>
                </div>
                <p class="mt-7 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">{fmt(advancedApplied ? result.takeHome : result.gross)}</p>
                <p class="mt-2 text-xs font-medium text-emerald-50/70">{salaryMonth} · Level {selectedLevel} · Cell {selectedCell} · Basic {fmt(result.basicPay)}</p>
                {#if advancedApplied}
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
                {:else}
                  <p class="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80">This first estimate includes Basic Pay and DA only. Add applicable allowances and deductions below to estimate monthly in-hand pay.</p>
                {/if}
                <div class="mt-5 flex items-center justify-between gap-4 border-t border-white/15 pt-4 text-xs text-emerald-50/75">
                  <span>Calculation updates when you edit an input after calculating.</span>
                  <button type="button" onclick={printStatement} class="rounded-lg border border-white/20 px-3 py-2 font-bold text-white transition hover:bg-white/10">Print result</button>
                </div>
                {#if advancedApplied && form.pensionMode === 'cps'}
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
                      ...(advancedApplied ? [
                        { label: 'House Rent Allowance', value: result.hra },
                        { label: 'SBCA', value: result.sbca },
                        { label: 'Transport Allowance', value: result.transportAllowance },
                        { label: 'Other monthly earnings', value: result.otherEarnings }
                      ] : [])
                    ] as item}
                      <div class="flex items-center justify-between gap-4 py-3 text-sm"><span class="text-slate-500 dark:text-slate-400">{item.label}</span><strong class="tabular-nums">{fmt(item.value)}</strong></div>
                    {/each}
                  </div>
                  <div class="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-200"><span>Gross salary</span><span class="tabular-nums">{fmt(result.gross)}</span></div>
                </div>

                {#if advancedApplied}
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

                {/if}
                {#if advancedApplied && result.employerCpsContribution > 0}
                  <div class="mt-5 rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                    <div class="flex items-start justify-between gap-4"><div><p class="text-sm font-extrabold text-sky-950 dark:text-sky-100">State matching CPS contribution</p><p class="mt-1 text-xs leading-5 text-sky-900/75 dark:text-sky-100/70">Shown separately; this amount is not deducted from employee take-home pay.</p></div><strong class="whitespace-nowrap text-sm tabular-nums text-sky-950 dark:text-sky-100">{fmt(result.employerCpsContribution)}</strong></div>
                  </div>
                {/if}
              </section>
            {/if}



            {#if result}
            <details class="surface-card group">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6">
                <span class="flex items-center gap-3">
                  <span class="step-badge muted">02</span>
                  <span><span class="block text-[10px] font-extrabold uppercase tracking-[0.17em] text-slate-400">Personalise estimate</span><span class="mt-0.5 block text-base font-black">Allowances & deductions</span></span>
                </span>
                <span class="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 dark:bg-slate-800 dark:text-slate-300"><span class="text-xl leading-none">+</span></span>
              </summary>
              <div class="space-y-5 border-t border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
                <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">Add employee-specific details only when you need a more complete take-home estimate. Use current orders and the employee's payslip / DDO confirmation.</p>
                <div>
                  <label for="salaryMonth" class="field-label">Salary month</label>
                  <input id="salaryMonth" type="month" bind:value={salaryMonth} onchange={changeSalaryMonth} class="field-control" required />
                  <p class="field-help">The DA reference is limited to January–November 2026. For another month, enter the rate from the applicable order or payslip.</p>
                </div>

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
                    <select id="pensionMode" value={form.pensionMode} onchange={(event) => { form.pensionMode = (event.currentTarget as HTMLSelectElement).value as SalaryInput['pensionMode']; form.cpsMembershipConfirmed = false; form.gpfMembershipConfirmed = false; advancedApplied = false; advancedError = ''; }} class="field-control">
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
                      <input type="checkbox" checked={form.cpsMembershipConfirmed === true} onchange={(event) => { form.cpsMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked; advancedApplied = false; advancedError = ''; }} class="mt-1 size-4 shrink-0" />
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
                      <input type="checkbox" checked={form.gpfMembershipConfirmed === true} onchange={(event) => { form.gpfMembershipConfirmed = (event.currentTarget as HTMLInputElement).checked; advancedApplied = false; advancedError = ''; }} class="mt-1 size-4 shrink-0" />
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
                      <option value="auto">Reference estimate — based on selected pay level</option>
                      <option value="none">Not applicable / exempt</option>
                    </select>
                    <p class="field-help">This is an optional project reference estimate using ₹150 below Level 15 and ₹200 at Level 15 and above. The current official salary/wage schedule lists income-based ranges, and its published boundary wording needs clarification. Do not treat this estimate as a verified statutory rule; use the manual amount from the employee’s current payslip / DDO unless the pay-level rule is confirmed for that employee.</p>
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
                <div class="border-t border-slate-100 pt-5 dark:border-slate-800">
                  <button type="button" onclick={applyAdvanced} class="button-primary w-full">Apply details and calculate take-home pay</button>
                  {#if advancedError}
                    <p class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200" role="alert">{advancedError}</p>
                  {/if}
                </div>
              </div>
            </details>
              <section class="surface-card p-5 sm:p-6">
                <p class="eyebrow">More help</p>
                <h2 class="mt-1 text-lg font-black">What would you like to do next?</h2>
                <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Your basic salary estimate is ready. Open another tool only when you need it.</p>
                <div class="mt-4 grid gap-2 sm:grid-cols-2">
                  <a href="/payslip-generator" class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-700"><span class="block text-sm font-extrabold">Generate a salary slip</span><span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Prepare a monthly payslip and annual summary</span></a>
                  <a href="/arrears-planner" class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-700"><span class="block text-sm font-extrabold">Calculate salary arrears</span><span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Compare revised salary with actual payments</span></a>
                  <a href="/pay-progression" class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-700"><span class="block text-sm font-extrabold">Pay progression & service history</span><span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Track increments and service events</span></a>
                  <a href="/gpf-planner" class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-700"><span class="block text-sm font-extrabold">Plan GPF contributions</span><span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Estimate a rule-based subscription range</span></a>
                  <a href="/retirement-planner" class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-700"><span class="block text-sm font-extrabold">Estimate retirement benefits</span><span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Use employee-specific confirmed parameters</span></a>
                  <a href="/temporary-pay" class="rounded-xl border border-slate-200 p-4 transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-700"><span class="block text-sm font-extrabold">Temporary & training pay</span><span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Check notification-based temporary pay</span></a>
                </div>
              </section>
              <details class="surface-card group">
                <summary class="cursor-pointer list-none p-5 text-sm font-extrabold sm:p-6">How this estimate is built and the rules behind it</summary>
                <div class="space-y-3 border-t border-slate-100 px-5 py-5 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:px-6">
                  <p><strong class="text-slate-900 dark:text-slate-200">DA</strong> is the selected percentage of Basic Pay.</p>
                  <p><strong class="text-slate-900 dark:text-slate-200">HRA and SBCA</strong> are not presumed payable; eligibility and reference rates must be entered from applicable records.</p>
                  <p><strong class="text-slate-900 dark:text-slate-200">CPS / GPF</strong> requires individual scheme or membership confirmation. The State share is shown separately and is not deducted from employee take-home pay.</p>
                  <p><strong class="text-slate-900 dark:text-slate-200">Professional Tax</strong> uses a project reference estimate only when selected; the amount should be confirmed with DDO / Accounts.</p>
                  <p>All outputs are estimates, not official salary certificates or payroll instructions.</p>
                </div>
              </details>
            {/if}

          </section>
        </div>

        {#if hasCalculated}
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

        {/if}

        <footer class="no-print mt-8 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400">
          <span>Built for Sikkim Government employees · Independent estimate tool</span>
          <span>Confirm applicable rules and employee-specific entitlements with your DDO / Accounts section.</span>
        </footer>
      </main>
    </div>
  </div>
</div>
