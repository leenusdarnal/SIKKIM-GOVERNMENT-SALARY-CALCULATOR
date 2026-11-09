<script lang="ts">
  import {
    calculateArrears,
    createArrearsCsv,
    getArrearsMonthKeys,
    type ArrearChange,
    type ArrearChangeType,
    type SalaryInput
  } from '../../lib/arrears';
  import { DEFAULT_SALARY_INPUT } from '../../lib/salary';

  let startMonth = $state('2026-01');
  let endMonth = $state('2026-11');
  let baseSalary = $state<SalaryInput>({ ...DEFAULT_SALARY_INPUT, daRate: 0 });
  let changes = $state<ArrearChange[]>([]);
  let eventMonth = $state('2026-01');
  let eventType = $state<ArrearChangeType>('da-revision');
  let eventBasicPay = $state('');
  let eventDaRate = $state('');
  let eventDescription = $state('');
  let actualPaid = $state<Record<string, string>>({});
  let recoveryAmounts = $state<Record<string, string>>({});
  let formError = $state('');

  const months = $derived(getArrearsMonthKeys(startMonth, endMonth));
  const monthlyRecords = $derived(months.map((month) => ({
    month,
    actualTakeHome:
      actualPaid[month] === undefined || actualPaid[month].trim() === ''
        ? null
        : Number(actualPaid[month]),
    recovery:
      recoveryAmounts[month] === undefined || recoveryAmounts[month].trim() === ''
        ? 0
        : Number(recoveryAmounts[month])
  })));
  const result = $derived(calculateArrears({
    startMonth,
    endMonth,
    baseSalary: { ...baseSalary },
    changes,
    monthlyRecords
  }));
  const missingPaidMonths = $derived(result.rows.filter((row) => row.actualTakeHome === null).length);
  const fmt = (value: number | null | undefined) =>
    value === null || value === undefined || !Number.isFinite(value)
      ? '—'
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(Math.round(value));

  function updateActualPaid(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    actualPaid = { ...actualPaid, [month]: target.value };
  }

  function updateRecovery(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    recoveryAmounts = { ...recoveryAmounts, [month]: target.value };
  }

  function addChange() {
    const basicPay = eventBasicPay.trim() === '' ? undefined : Number(eventBasicPay);
    const daRate = eventDaRate.trim() === '' ? undefined : Number(eventDaRate);
    const candidate: ArrearChange = {
      effectiveMonth: eventMonth,
      type: eventType,
      description: eventDescription.trim(),
      ...(basicPay === undefined ? {} : { basicPay }),
      ...(daRate === undefined ? {} : { daRate })
    };

    if (!candidate.description) {
      formError = 'Enter the Government order number, date or a clear reference for this change.';
      return;
    }
    if (eventType === 'da-revision' && daRate === undefined) {
      formError = 'Enter the DA rate prescribed by the applicable order.';
      return;
    }
    if (['annual-increment', 'promotion', 'pay-fixation'].includes(eventType) && basicPay === undefined) {
      formError = 'Enter the new basic pay fixed by the increment / promotion / pay-fixation order.';
      return;
    }
    if (eventType === 'manual-adjustment' && basicPay === undefined && daRate === undefined) {
      formError = 'Enter a new basic pay and/or DA rate for this adjustment.';
      return;
    }

    changes = [...changes, candidate];
    eventBasicPay = '';
    eventDaRate = '';
    eventDescription = '';
    formError = '';
  }

  function removeChange(index: number) {
    changes = changes.filter((_, itemIndex) => itemIndex !== index);
  }

  function exportCsv() {
    try {
      const filename = 'sikkim-salary-arrears-' + startMonth + '-to-' + endMonth + '.csv';
      const blob = new Blob([createArrearsCsv(result)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      formError = '';
    } catch (cause) {
      formError = cause instanceof Error ? cause.message : 'Unable to export the arrears statement.';
    }
  }

  function printStatement() {
    window.print();
  }
</script>

<svelte:head>
  <title>Salary Arrears Planner | Sikkim Government Salary Calculator</title>
  <meta name="description" content="Prepare a month-by-month Sikkim Government salary arrears estimate using verified basic pay, DA changes, increments, promotion fixation, actual credited salary and recoveries." />
</svelte:head>

<main class="min-h-screen bg-[#f4f6f3] px-4 py-8 text-slate-900 dark:bg-[#0b1411] dark:text-slate-100 sm:px-8">
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="no-print flex flex-wrap items-center justify-between gap-3">
      <a href="/" class="text-sm font-bold text-emerald-800 hover:underline dark:text-emerald-400">← Back to salary calculator</a>
      <div class="flex flex-wrap gap-2 text-sm">
        <a href="/pay-progression" class="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">Pay progression</a>
        <a href="/gpf-planner" class="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-700">GPF planner</a>
      </div>
    </div>

    <header>
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sikkim Government employee utility</p>
      <h1 class="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Salary arrears planner</h1>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Reconstruct revised monthly take-home pay after a DA order, annual increment, promotion or pay-fixation order, compare it with the amount actually credited, and account for additional recoveries.</p>
    </header>

    <section class="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 class="font-extrabold">Read before calculating</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>This is an estimate, not an official pay-fixation or arrears sanction. Enter only DA rates and revised basic pay supported by the applicable signed Government order and the employee's fixation statement.</li>
        <li>The opening basic pay and DA rate are the revised entitlement basis for the first month in the selected period. Each dated change applies from that month onward.</li>
        <li>For increments, promotions and pay fixation, the tool does not decide eligibility or calculate the new basic pay automatically. Enter the basic pay fixed by the competent authority.</li>
        <li>Enter the net take-home amount actually credited for each month. Recovery entered below is an additional recovery from this arrears settlement; do not enter an amount already deducted from the credited salary a second time.</li>
        <li>Periods are limited to 60 months. The planner uses the salary engine's current component rules; it does not reconstruct past rule changes automatically.</li>
      </ul>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">01 · Period and opening entitlement</p>
          <h2 class="mt-1 text-xl font-black">Select the arrears period</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Set the revised salary components that apply at the beginning of the period.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{months.length || '—'} months</span>
      </div>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-bold">From month
          <input type="month" bind:value={startMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">To month
          <input type="month" bind:value={endMonth} min={startMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 class="text-base font-extrabold">Opening revised salary components</h3>
        <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Enter the applicable figures for the first month. DA is not pre-filled because its rate must match the employee category and the order's effective date.</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-sm font-bold">Basic pay (₹)
            <input type="number" min="1" step="1" bind:value={baseSalary.basicPay} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">DA rate (%)
            <input type="number" min="0" max="200" step="0.01" bind:value={baseSalary.daRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">HRA rate (%)
            <input type="number" min="0" max="100" step="0.01" bind:value={baseSalary.hraRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">HRA minimum (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.hraMinimum} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">SBCA rate (%)
            <input type="number" min="0" max="100" step="0.01" bind:value={baseSalary.sbcaRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Transport allowance (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.transportAllowance} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Other earnings (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.otherEarnings} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-bold dark:border-slate-700">
            <input type="checkbox" bind:checked={baseSalary.hraEligible} class="size-4" />
            HRA admissible for this employee
          </label>
        </div>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
        <h3 class="text-base font-extrabold">Opening deductions and pension arrangement</h3>
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-sm font-bold">Pension arrangement
            <select bind:value={baseSalary.pensionMode} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
              <option value="unselected">Select arrangement</option>
              <option value="cps">CPS / CPF</option>
              <option value="gpf">GPF</option>
              <option value="manual">Other manual pension</option>
              <option value="none">No employee pension deduction</option>
            </select>
          </label>
          <label class="text-sm font-bold">Professional Tax treatment
            <select bind:value={baseSalary.professionalTaxMode} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
              <option value="unselected">Select treatment</option>
              <option value="auto">Use calculator's indicative slab</option>
              <option value="manual">Manual payslip amount</option>
              <option value="none">Not applicable / exempt</option>
            </select>
          </label>
          {#if baseSalary.pensionMode === 'gpf' || baseSalary.pensionMode === 'manual'}
            <label class="text-sm font-bold">Monthly pension / GPF (₹)
              <input type="number" min="0" step="1" bind:value={baseSalary.manualPension} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
          {/if}
          {#if baseSalary.professionalTaxMode === 'manual'}
            <label class="text-sm font-bold">Monthly Professional Tax (₹)
              <input type="number" min="0" step="1" bind:value={baseSalary.manualProfessionalTax} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
          {/if}
          <label class="text-sm font-bold">GIS (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.gis} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Stamp / fixed fee (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.stampFee} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Other monthly deductions (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.otherDeductions} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
        </div>
        <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">CPS/CPF is recalculated as 10% of Basic Pay + DA under the existing salary engine. GPF and other manual pension contributions remain fixed unless you add a future enhancement for dated deduction changes.</p>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">02 · Effective-dated changes</p>
      <h2 class="mt-1 text-xl font-black">Add DA revisions, increments or promotion fixation</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">A change is applied from the selected month onward. Use a separate entry for each order/effective date.</p>

      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <label class="text-sm font-bold">Effective month
          <input type="month" bind:value={eventMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">Change type
          <select bind:value={eventType} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
            <option value="da-revision">DA revision</option>
            <option value="annual-increment">Annual increment</option>
            <option value="promotion">Promotion / upgradation</option>
            <option value="pay-fixation">Pay fixation order</option>
            <option value="manual-adjustment">Manual adjustment</option>
          </select>
        </label>
        <label class="text-sm font-bold">New basic pay (₹)
          <input type="number" min="1" step="1" value={eventBasicPay} oninput={(event) => (eventBasicPay = (event.currentTarget as HTMLInputElement).value)} placeholder="Leave blank when unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">New DA rate (%)
          <input type="number" min="0" max="200" step="0.01" value={eventDaRate} oninput={(event) => (eventDaRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Leave blank when unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold lg:col-span-1">Order / reference
          <input bind:value={eventDescription} maxlength="160" placeholder="Order number and date" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
      </div>
      <button type="button" onclick={addChange} class="mt-4 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">Add effective-dated change</button>
      {#if changes.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead><tr class="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700"><th class="py-3">Effective month</th><th>Change</th><th>New basic pay</th><th>New DA</th><th>Order / reference</th><th></th></tr></thead>
            <tbody>
              {#each changes as change, index}
                <tr class="border-b border-slate-100 dark:border-slate-800">
                  <td class="py-3">{change.effectiveMonth}</td>
                  <td>{change.type.replaceAll('-', ' ')}</td>
                  <td>{change.basicPay === undefined ? '—' : fmt(change.basicPay)}</td>
                  <td>{change.daRate === undefined ? '—' : change.daRate + '%'}</td>
                  <td>{change.description}</td>
                  <td class="text-right"><button type="button" onclick={() => removeChange(index)} class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40">Remove</button></td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No effective-dated changes added. The opening basic pay and DA rate will apply to every month.</p>
      {/if}
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">03 · Monthly comparison</p>
          <h2 class="mt-1 text-xl font-black">Enter actual salary credited</h2>
          <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">The revised take-home is calculated for each month. Fill in the net amount actually credited and any additional recovery to be deducted from this arrears settlement.</p>
        </div>
        <div class="no-print flex flex-wrap gap-2">
          <button type="button" onclick={printStatement} class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Print statement</button>
          <button type="button" onclick={exportCsv} disabled={!result.valid || !result.complete} class="rounded-lg bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Download CSV</button>
        </div>
      </div>

      {#if !result.valid}
        <div role="alert" class="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <p class="font-extrabold">Please correct these inputs:</p>
          <ul class="mt-2 list-disc pl-5">
            {#each result.errors as item}<li>{item}</li>{/each}
          </ul>
        </div>
      {:else}
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Revised take-home total</p><p class="mt-1 text-xl font-black">{fmt(result.totals.revisedTakeHome)}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Actual credited total</p><p class="mt-1 text-xl font-black">{result.complete ? fmt(result.totals.actualTakeHome) : 'Pending'}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Additional recoveries</p><p class="mt-1 text-xl font-black">{fmt(result.totals.recoveries)}</p></div>
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><p class="text-xs text-emerald-800 dark:text-emerald-300">{result.complete ? 'Net arrears / balance' : 'Net arrears estimate'}</p><p class="mt-1 text-xl font-black text-emerald-950 dark:text-emerald-100">{result.complete ? fmt(result.totals.netArrears) : 'Incomplete'}</p></div>
        </div>
        {#if !result.complete}
          <p class="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-300">{missingPaidMonths} month(s) still need the actual net salary credited before a final arrears total or CSV statement can be produced.</p>
        {:else}
          <div class="mt-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Positive arrears: <strong>{fmt(result.totals.positiveArrears)}</strong> · Negative balance / possible overpayment: <strong>{fmt(Math.abs(result.totals.negativeBalance))}</strong>. A negative net result is shown rather than silently reduced to zero.
          </div>
        {/if}
      {/if}

      {#if result.rows.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th class="py-3">Month</th><th>Basic pay</th><th>DA</th><th>Revised gross</th><th>Deductions</th><th>Revised take-home</th><th>Actual net paid (₹)</th><th>Recovery (₹)</th><th>Net difference</th>
              </tr>
            </thead>
            <tbody>
              {#each result.rows as row (row.month)}
                <tr class="border-b border-slate-100 align-middle dark:border-slate-800">
                  <td class="py-3 font-bold">{row.month}</td>
                  <td>{fmt(row.basicPay)}</td>
                  <td>{row.daRate}%</td>
                  <td>{fmt(row.grossEntitlement)}</td>
                  <td>{fmt(row.employeeDeductions)}</td>
                  <td class="font-bold">{fmt(row.revisedTakeHome)}</td>
                  <td><input type="number" min="0" step="1" value={actualPaid[row.month] ?? ''} oninput={(event) => updateActualPaid(row.month, event)} aria-label={'Actual net salary credited for ' + row.month} placeholder="Enter credited amount" class="w-36 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td><input type="number" min="0" step="1" value={recoveryAmounts[row.month] ?? '0'} oninput={(event) => updateRecovery(row.month, event)} aria-label={'Additional recovery for ' + row.month} class="w-28 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td class="font-bold">{fmt(row.netArrears)}</td>
                </tr>
                {#if row.appliedChanges.length}
                  <tr class="border-b border-slate-100 bg-emerald-50/60 dark:border-slate-800 dark:bg-emerald-950/20"><td colspan="9" class="px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200">Applied from this month: {row.appliedChanges.join(' · ')}</td></tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 class="font-extrabold">Government references and limitations</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
        <li><a class="font-semibold text-emerald-800 underline dark:text-emerald-400" href="https://www.sikkimfred.gov.in/DA%20Enhancement/Documents/DA%20Circular%202026.pdf" target="_blank" rel="noreferrer">Finance Department DA Circular dated 1 October 2026</a> — verify the employee category, rate and effective date before entering a DA change.</li>
        <li><a class="font-semibold text-emerald-800 underline dark:text-emerald-400" href="https://dop.sikkim.gov.in/circular/6780.pdf" target="_blank" rel="noreferrer">Department of Personnel clarification on EOL and annual increment dates</a> — qualifying service and leave can affect an employee's actual increment date.</li>
        <li><a class="font-semibold text-emerald-800 underline dark:text-emerald-400" href="https://www.sikkim.gov.in/uploads/Gazette/333_20240813.pdf" target="_blank" rel="noreferrer">Sikkim Government Services (Revised Pay) Rules, 2018</a> — use the applicable order and service book for individual fixation.</li>
      </ul>
      <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">The model recalculates CPS/CPF from Basic Pay + DA using the current salary engine. Other manual deductions and allowances remain at their opening values for all months in this version. It does not calculate interest on arrears, tax impact, leave salary, DA on pre-revised pay, pension revisions or statutory rounding differences beyond the salary engine.</p>
    </section>
  </div>
</main>
