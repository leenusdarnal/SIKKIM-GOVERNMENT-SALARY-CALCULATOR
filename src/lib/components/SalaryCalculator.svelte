<script lang="ts">
  import { onMount } from 'svelte';
  import { PAY_LEVELS, PAY_MATRIX } from '#lib/data/pay-matrix';
  import {
    calculateSalary,
    DEFAULT_SALARY_INPUT,
    type SalaryInput,
    type SalaryResult
  } from '#lib/salary';
  import { SALARY_SOURCES } from '#lib/sources';

  let selectedLevel = $state<number | ''>('');
  let selectedCell = $state<number | ''>('');
  let form = $state<SalaryInput>({ ...DEFAULT_SALARY_INPUT });
  let appointmentDate = $state('');
  let result = $state<SalaryResult | null>(null);
  let dark = $state(false);
  let matrixOpen = $state(false);
  let showSources = $state(false);

  const currentCells = $derived(selectedLevel !== '' ? PAY_MATRIX[selectedLevel] : []);
  const selectedBasic = $derived(
    selectedLevel !== '' && selectedCell !== ''
      ? PAY_MATRIX[selectedLevel][selectedCell - 1]
      : 0
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
    result = null;
  }

  function calculate() {
    if (!selectedBasic) {
      result = null;
      return;
    }
    result = calculateSalary({ ...form, basicPay: selectedBasic });
  }

  function reset() {
    selectedLevel = '';
    selectedCell = '';
    form = { ...DEFAULT_SALARY_INPUT };
    appointmentDate = '';
    result = null;
    matrixOpen = false;
  }

  function toggleTheme() {
    dark = !dark;
    localStorage.setItem('sikkim-salary-theme', dark ? 'dark' : 'light');
  }

  function printStatement() {
    window.print();
  }

  const preCpsCutoff = $derived(
    form.pensionMode === 'cps' &&
    appointmentDate !== '' &&
    appointmentDate < '2006-04-01'
  );
</script>

<div class:dark class="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
  <header class="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
    <div class="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
      <div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15">
        <svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="3" />
          <path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h8" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-extrabold tracking-tight">Sikkim Government Salary Calculator</p>
        <p class="hidden text-xs text-slate-500 sm:block dark:text-slate-400">Pay matrix · allowances · deductions · take-home estimate</p>
      </div>
      <button
        type="button"
        onclick={toggleTheme}
        class="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Light mode' : 'Dark mode'}
      >
        {#if dark}
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20.2 15.3A8 8 0 1 1 8.7 3.8 6.2 6.2 0 0 0 20.2 15.3Z" /></svg>
        {/if}
      </button>
      <button
        type="button"
        onclick={printStatement}
        class="hidden rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 sm:inline-flex dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >Print statement</button>
    </div>
  </header>

  <main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
    <section class="relative mb-6 overflow-hidden rounded-3xl border border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-5 py-7 text-white shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-9">
      <div class="pointer-events-none absolute -right-10 -top-20 size-72 rounded-full border border-white/10 shadow-[0_0_0_28px_rgba(255,255,255,0.025),0_0_0_58px_rgba(255,255,255,0.02)]"></div>
      <div class="relative max-w-3xl">
        <p class="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-100">Sikkim State pay calculator</p>
        <h1 class="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">Understand your monthly salary, line by line.</h1>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">Select your Pay Matrix cell, apply the relevant DA and allowances, then see employee deductions and estimated take-home pay separately from the State pension contribution.</p>
        <div class="mt-5 flex flex-wrap gap-2 text-xs font-bold text-emerald-50">
          <span class="rounded-full bg-white/10 px-3 py-1.5">23 pay levels</span>
          <span class="rounded-full bg-white/10 px-3 py-1.5">920 matrix cells</span>
          <span class="rounded-full bg-white/10 px-3 py-1.5">Sikkim-specific PT slabs</span>
          <span class="rounded-full bg-white/10 px-3 py-1.5">Editable service deductions</span>
        </div>
      </div>
    </section>

    <div class="grid items-start gap-6 lg:grid-cols-[minmax(320px,390px)_minmax(0,1fr)]">
      <aside class="no-print space-y-5">
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div class="mb-5">
            <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">01 / Employee pay</p>
            <h2 class="mt-1 text-lg font-extrabold tracking-tight">Select your pay details</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose the level and exact cell shown on the employee's pay record.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label for="level" class="mb-1.5 block text-sm font-bold">Pay Matrix level</label>
              <select id="level" bind:value={selectedLevel} onchange={changeLevel} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 dark:border-slate-700 dark:bg-slate-950">
                <option value="">Select pay level</option>
                {#each PAY_LEVELS as item}
                  <option value={item}>Level {item}</option>
                {/each}
              </select>
            </div>

            <div>
              <label for="cell" class="mb-1.5 block text-sm font-bold">Basic pay cell</label>
              <select id="cell" bind:value={selectedCell} disabled={!selectedLevel} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950">
                <option value="">Select basic pay</option>
                {#each currentCells as pay, index}
                  <option value={index + 1}>Cell {index + 1} · {fmt(pay)}</option>
                {/each}
              </select>
            </div>

            <div class="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/50">
              <div class="flex items-center justify-between gap-3">
                <label for="daRate" class="text-sm font-bold text-sky-950 dark:text-sky-100">Dearness Allowance (DA)</label>
                <span class="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-extrabold text-sky-800 dark:bg-sky-900 dark:text-sky-100">60% reported rate</span>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <input id="daRate" type="number" min="0" max="200" step="0.5" bind:value={form.daRate} class="w-28 rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-right text-lg font-black text-slate-900 outline-none focus:ring-4 focus:ring-sky-500/10 dark:border-sky-800" />
                <span class="font-bold text-slate-500">%</span>
              </div>
              <p class="mt-2 text-xs leading-5 text-sky-900/80 dark:text-sky-100/80">60% from 1 January 2026 is publicly reported for revised-pay employees. The signed Finance Department circular was not independently located; confirm the rate for the salary month.</p>
            </div>

            <details class="rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
              <summary class="cursor-pointer list-none px-4 py-3 text-sm font-extrabold">Allowances, pension and deductions <span class="float-right text-slate-400">＋</span></summary>
              <div class="space-y-4 border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                <p class="text-xs leading-5 text-slate-500 dark:text-slate-400">Some components depend on the employee's post, location, accommodation and appointment conditions. Defaults marked as references are editable and should be checked against the applicable order or payslip.</p>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="hraRate" class="mb-1 block text-xs font-bold">HRA rate (%)</label>
                    <input id="hraRate" type="number" min="0" max="100" step="0.5" bind:value={form.hraRate} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <span class="mt-1 block text-[10px] text-slate-400">12% departmental reference</span>
                  </div>
                  <div>
                    <label for="hraMinimum" class="mb-1 block text-xs font-bold">HRA minimum (₹)</label>
                    <input id="hraMinimum" type="number" min="0" bind:value={form.hraMinimum} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>
                <label class="flex items-start gap-2 text-xs font-semibold leading-5">
                  <input type="checkbox" bind:checked={form.hraEligible} class="mt-0.5 size-4 accent-emerald-700" />
                  HRA is admissible to this employee (switch off where accommodation is provided or HRA is not payable).
                </label>

                <div>
                  <label for="sbcaRate" class="mb-1 block text-xs font-bold">SBCA rate (%)</label>
                  <input id="sbcaRate" type="number" min="0" max="100" step="0.5" bind:value={form.sbcaRate} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  <span class="mt-1 block text-[10px] text-slate-400">8% departmental reference only</span>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="transport" class="mb-1 block text-xs font-bold">Transport allowance (₹)</label>
                    <input id="transport" type="number" min="0" bind:value={form.transportAllowance} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                  <div>
                    <label for="otherEarnings" class="mb-1 block text-xs font-bold">Other earnings (₹)</label>
                    <input id="otherEarnings" type="number" min="0" bind:value={form.otherEarnings} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>

                <div>
                  <label for="appointmentDate" class="mb-1 block text-xs font-bold">Date of appointment (optional)</label>
                  <input id="appointmentDate" type="date" bind:value={appointmentDate} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  <p class="mt-1 text-[10px] leading-4 text-slate-400">Sikkim CPS generally applies to eligible appointments on/after 1 April 2006, subject to rule exclusions.</p>
                </div>

                <div>
                  <label for="pensionMode" class="mb-1 block text-xs font-bold">Pension deduction scheme</label>
                  <select id="pensionMode" bind:value={form.pensionMode} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="cps">Sikkim CPS — 10% employee contribution</option>
                    <option value="gpf">GPF — manual contribution</option>
                    <option value="manual">Other pension — manual amount</option>
                    <option value="none">No pension deduction</option>
                  </select>
                </div>
                {#if form.pensionMode === 'gpf' || form.pensionMode === 'manual'}
                  <div>
                    <label for="manualPension" class="mb-1 block text-xs font-bold">Monthly pension / GPF amount (₹)</label>
                    <input id="manualPension" type="number" min="0" bind:value={form.manualPension} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                {/if}

                <div>
                  <label for="ptMode" class="mb-1 block text-xs font-bold">Professional Tax</label>
                  <select id="ptMode" bind:value={form.professionalTaxMode} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                    <option value="auto">Automatic — Sikkim salary slabs</option>
                    <option value="manual">Manual amount from payslip</option>
                    <option value="none">Not applicable / exempt</option>
                  </select>
                </div>
                {#if form.professionalTaxMode === 'manual'}
                  <div>
                    <label for="manualPt" class="mb-1 block text-xs font-bold">Monthly Professional Tax (₹)</label>
                    <input id="manualPt" type="number" min="0" bind:value={form.manualProfessionalTax} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                {/if}

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label for="gis" class="mb-1 block text-xs font-bold">GIS deduction (₹)</label>
                    <input id="gis" type="number" min="0" bind:value={form.gis} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                  <div>
                    <label for="stampFee" class="mb-1 block text-xs font-bold">Stamp / fixed fee (₹)</label>
                    <input id="stampFee" type="number" min="0" bind:value={form.stampFee} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>
                <div>
                  <label for="otherDeductions" class="mb-1 block text-xs font-bold">TDS, loans and other deductions (₹)</label>
                  <input id="otherDeductions" type="number" min="0" bind:value={form.otherDeductions} class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
              </div>
            </details>

            <div class="flex gap-2 pt-1">
              <button type="button" onclick={calculate} disabled={!selectedBasic} class="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45">Calculate salary</button>
              <button type="button" onclick={reset} class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reset</button>
            </div>
            <p class="text-xs text-slate-400" aria-live="polite">{selectedBasic ? ('Selected Level ' + selectedLevel + ', Cell ' + selectedCell + ' — ' + fmt(selectedBasic)) : 'Select a pay level and basic-pay cell to begin.'}</p>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 class="text-sm font-extrabold">How the estimate is calculated</h2>
          <ul class="mt-3 space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
            <li><strong>DA:</strong> selected percentage × Basic Pay.</li>
            <li><strong>HRA / SBCA:</strong> editable reference rates; HRA can be disabled.</li>
            <li><strong>CPS:</strong> 10% employee contribution on Basic Pay + DA for eligible employees.</li>
            <li><strong>Professional Tax:</strong> based on monthly salary slab, not pay level.</li>
            <li><strong>GIS / TDS / loans:</strong> entered manually from the employee's own record.</li>
          </ul>
        </section>
      </aside>

      <section class="min-w-0 space-y-5">
        {#if result}
          <section class="print-card rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7 dark:border-emerald-900 dark:bg-slate-900" aria-live="polite">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-400">Salary estimate</p>
                <h2 class="mt-1 text-xl font-black tracking-tight">Monthly take-home salary</h2>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Level {selectedLevel} · Cell {selectedCell} · Basic Pay {fmt(result.basicPay)}</p>
              </div>
              <span class="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Estimate only</span>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p class="text-xs font-bold text-slate-500 dark:text-slate-400">Gross monthly earnings</p>
                <p class="mt-1 text-2xl font-black tracking-tight">{fmt(result.gross)}</p>
              </div>
              <div class="rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/40">
                <p class="text-xs font-bold text-rose-700 dark:text-rose-300">Total employee deductions</p>
                <p class="mt-1 text-2xl font-black tracking-tight text-rose-800 dark:text-rose-200">{fmt(result.totalDeductions)}</p>
              </div>
            </div>
            <div class="mt-3 rounded-2xl bg-emerald-700 p-5 text-white">
              <p class="text-sm font-bold text-emerald-50">Estimated net in-hand salary</p>
              <p class="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{fmt(result.takeHome)}</p>
            </div>
            {#if preCpsCutoff}
              <p class="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">The appointment date entered is before 1 April 2006. Check CPS coverage and applicable exclusions before using the selected scheme.</p>
            {:else if form.pensionMode === 'cps'}
              <p class="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs leading-5 text-sky-950 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100">CPS coverage depends on the post and service category, not just the appointment date. Confirm eligibility under the Sikkim Government Servants (Contributory Pension) Rules, 2006.</p>
            {/if}
          </section>

          <section class="print-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <h2 class="text-lg font-black tracking-tight">Salary breakdown</h2>
            <div class="mt-4">
              <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Earnings</p>
              <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-700">
                {#each [
                  { label: 'Basic Pay', value: result.basicPay },
                  { label: 'Dearness Allowance (' + result.daRate + '%)', value: result.da },
                  { label: 'House Rent Allowance', value: result.hra },
                  { label: 'SBCA', value: result.sbca },
                  { label: 'Transport Allowance', value: result.transportAllowance },
                  { label: 'Other monthly earnings', value: result.otherEarnings }
                ] as item}
                  <div class="flex items-center justify-between gap-4 py-3 text-sm">
                    <span class="text-slate-500 dark:text-slate-400">{item.label}</span>
                    <strong class="tabular-nums">{fmt(item.value)}</strong>
                  </div>
                {/each}
              </div>
              <div class="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                <span>Gross salary</span><span class="tabular-nums">{fmt(result.gross)}</span>
              </div>
            </div>

            <div class="mt-6">
              <p class="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">Employee deductions</p>
              <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4 dark:divide-slate-800 dark:border-slate-700">
                {#each [
                  { label: result.pensionLabel, value: result.employeePension },
                  { label: 'Professional Tax (' + result.professionalTaxBand + ')', value: result.professionalTax },
                  { label: 'GIS deduction', value: result.gis },
                  { label: 'Stamp / fixed fee', value: result.stampFee },
                  { label: 'TDS, loans and other deductions', value: result.otherDeductions }
                ] as item}
                  <div class="flex items-center justify-between gap-4 py-3 text-sm">
                    <span class="text-slate-500 dark:text-slate-400">{item.label}</span>
                    <strong class="tabular-nums">{fmt(item.value)}</strong>
                  </div>
                {/each}
              </div>
              <div class="mt-2 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
                <span>Total deductions</span><span class="tabular-nums">{fmt(result.totalDeductions)}</span>
              </div>
            </div>

            {#if result.employerCpsContribution > 0}
              <div class="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-900 dark:bg-sky-950/40">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-extrabold text-sky-950 dark:text-sky-100">State matching CPS contribution</p>
                    <p class="mt-1 text-xs leading-5 text-sky-900/80 dark:text-sky-100/80">Displayed separately. This is the Government's matching contribution and is not deducted from employee take-home pay.</p>
                  </div>
                  <strong class="whitespace-nowrap text-sm tabular-nums text-sky-950 dark:text-sky-100">{fmt(result.employerCpsContribution)}</strong>
                </div>
              </div>
            {/if}
          </section>
        {:else}
          <section class="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div class="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <svg viewBox="0 0 24 24" class="size-8" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3" /><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2" /></svg>
            </div>
            <h2 class="mt-4 text-xl font-black tracking-tight">Your salary estimate will appear here</h2>
            <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Select a Pay Matrix level and cell, review the allowance and deduction settings, then calculate your monthly salary.</p>
          </section>
        {/if}

        <section class="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-extrabold">Sikkim Pay Matrix</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">40 cells for each of the 23 levels. The selected basic pay is highlighted.</p>
            </div>
            <button type="button" onclick={() => (matrixOpen = !matrixOpen)} class="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">{matrixOpen ? 'Hide matrix' : 'View matrix'}</button>
          </div>
          {#if matrixOpen && selectedLevel !== ''}
            <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {#each currentCells as pay, index}
                <button
                  type="button"
                  onclick={() => { selectedCell = index + 1; result = null; }}
                  class={selectedCell === index + 1
                    ? 'rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 text-left text-xs font-extrabold tabular-nums text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100'
                    : 'rounded-xl border border-slate-200 px-3 py-2 text-left text-xs tabular-nums transition hover:border-emerald-400 dark:border-slate-700 dark:hover:border-emerald-600'}
                >Cell {index + 1}<span class="mt-0.5 block font-bold">{fmt(pay)}</span></button>
              {/each}
            </div>
          {:else if matrixOpen}
            <p class="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">Select a pay level above to view its 40 pay cells.</p>
          {/if}
        </section>

        <section class="no-print rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button type="button" onclick={() => (showSources = !showSources)} class="flex w-full items-center justify-between gap-4 text-left">
            <span>
              <span class="block text-sm font-extrabold">Sources and calculation notes</span>
              <span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">Primary Government sources and clearly marked reference assumptions</span>
            </span>
            <span class="text-xl text-slate-400">{showSources ? '−' : '+'}</span>
          </button>
          {#if showSources}
            <div class="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              {#each SALARY_SOURCES as source}
                <article class="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <a href={source.url} target="_blank" rel="noreferrer" class="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-600 dark:text-emerald-300">{source.title}</a>
                  <p class="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{source.authority}</p>
                  <p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{source.note}</p>
                </article>
              {/each}
            </div>
          {/if}
        </section>
      </section>
    </div>

    <footer class="mt-8 border-t border-slate-200 py-5 text-center text-xs leading-5 text-slate-500 dark:border-slate-800 dark:text-slate-400">
      This is an estimate tool, not an official Government payroll system. Confirm applicable rules, entitlements and deductions with your DDO / Accounts section. Allowance reference defaults are editable.
    </footer>
  </main>
</div>
