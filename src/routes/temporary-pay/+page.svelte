<script lang="ts">
  import { calculateTemporaryPay, TEMPORARY_PAY_OPTIONS } from '../../lib/temporary-pay';

  let optionId = $state('gp-3800');
  let salaryMonth = $state('2026-11');
  let sourceVerified = $state(false);
  let daysInMonth = $state(30);
  let payableDays = $state(30);
  let dailyRate = $state(0);
  let dailyRateSourceReference = $state('');
  let dailyRateEffectiveFrom = $state('');
  let dailyRateVerified = $state(false);

  const selected = $derived(TEMPORARY_PAY_OPTIONS.find((item) => item.id === optionId));
  const result = $derived(calculateTemporaryPay({
    optionId, salaryMonth, sourceVerified,
    daysInMonth: Number(daysInMonth), payableDays: Number(payableDays),
    dailyRate: Number(dailyRate), dailyRateSourceReference,
    dailyRateEffectiveFrom, dailyRateVerified
  }));
  const fmt = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const groups = [
    { label: 'Group C / D consolidated pay', values: TEMPORARY_PAY_OPTIONS.filter((item) => item.category === 'group-c' || item.category === 'group-d') },
    { label: 'Specified posts', values: TEMPORARY_PAY_OPTIONS.filter((item) => item.category === 'specific-post') },
    { label: 'Direct-recruit training allowance', values: TEMPORARY_PAY_OPTIONS.filter((item) => item.category === 'training') },
    { label: 'Daily-wage category', values: TEMPORARY_PAY_OPTIONS.filter((item) => item.category === 'driver-manual') }
  ];
</script>

<svelte:head>
  <title>Temporary Pay Calculator | Sikkim Government Salary Calculator</title>
  <meta name="description" content="Check source-referenced Sikkim temporary consolidated pay and direct-recruit training allowance schedules." />
</svelte:head>

<main class="min-h-screen bg-[#f4f6f3] px-4 py-8 text-slate-900 dark:bg-[#0b1411] dark:text-slate-100 sm:px-8">
  <div class="mx-auto max-w-5xl space-y-6">
    <a href="/" class="text-sm font-bold text-emerald-800 hover:underline dark:text-emerald-400">← Back to salary calculator</a>
    <header>
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sikkim Government employee utility</p>
      <h1 class="mt-2 text-3xl font-black tracking-tight">Temporary & training pay calculator</h1>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">A source-referenced lookup for the Department of Personnel's temporary consolidated-pay and direct-recruit training schedules. The selected notification must be confirmed against the employee's engagement or appointment order.</p>
    </header>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="text-sm font-bold">Pay category / post
          <select bind:value={optionId} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
            {#each groups as group}
              <optgroup label={group.label}>
                {#each group.values as item}
                  <option value={item.id}>{item.label}</option>
                {/each}
              </optgroup>
            {/each}
          </select>
        </label>
        <label class="text-sm font-bold">Salary month
          <input type="month" bind:value={salaryMonth} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
      </div>

      {#if selected}
        <div class="mt-5 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
          <p class="font-extrabold">{selected.sourceReference}</p>
          <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">Effective from {selected.effectiveFrom}. Basis: {selected.basis === 'monthly' ? 'monthly consolidated amount' : 'daily wage'}.</p>
          <a class="mt-2 inline-block text-xs font-bold text-emerald-800 underline dark:text-emerald-300" href={selected.sourceUrl} target="_blank" rel="noreferrer">Open official notification ↗</a>
          {#if selected.note}<p class="mt-2 text-xs leading-5 text-amber-800 dark:text-amber-200">{selected.note}</p>{/if}
        </div>
      {/if}

      {#if selected?.basis === 'daily'}
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-bold">Labour Department daily rate (₹)
            <input type="number" min="0" step="0.01" bind:value={dailyRate} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Payable days
            <input type="number" min="1" max="31" step="1" bind:value={payableDays} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Days in selected month
            <input type="number" min="28" max="31" step="1" bind:value={daysInMonth} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Labour Department notification effective date
            <input type="date" bind:value={dailyRateEffectiveFrom} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold sm:col-span-2">Labour Department notification number / date
            <input bind:value={dailyRateSourceReference} placeholder="Enter the applicable Labour Department order reference" class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="flex items-start gap-3 text-sm sm:col-span-2">
            <input type="checkbox" bind:checked={dailyRateVerified} class="mt-1" />
            <span>I have checked that this daily rate applies to this driver/category and selected salary month.</span>
          </label>
        </div>
      {:else}
        <div class="mt-5 grid gap-4 sm:grid-cols-2">
          <label class="text-sm font-bold">Days in selected month (optional validation)
            <input type="number" min="28" max="31" step="1" bind:value={daysInMonth} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">Payable days (optional; full month only)
            <input type="number" min="1" max="31" step="1" bind:value={payableDays} class="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            <span class="mt-1 block text-xs font-normal text-slate-500">Partial-month proration is intentionally blocked until an applicable order or DDO-approved formula is entered.</span>
          </label>
        </div>
      {/if}

      <label class="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <input type="checkbox" bind:checked={sourceVerified} class="mt-1" />
        <span>I have checked the cited notification, its effective date, post/category equivalence and applicability against the employee's appointment/engagement order and relevant DDO / Establishment records.</span>
      </label>

      <div class="mt-6 rounded-2xl border p-5 {result.valid ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}" aria-live="polite">
        <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Validated monthly / period amount</p>
        <p class="mt-2 text-3xl font-black tabular-nums">{result.valid && result.amount !== null ? fmt(result.amount) : '—'}</p>
        {#if result.valid}
          <p class="mt-2 text-sm text-emerald-800 dark:text-emerald-200">Calculation validated against the entered source confirmations. This remains an estimate, not a pay sanction.</p>
        {:else}
          <ul class="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-200">
            {#each result.errors as error}<li>{error}</li>{/each}
          </ul>
        {/if}
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 class="font-extrabold">Important boundaries</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
        <li>Temporary consolidated pay is not combined with regular-pay DA, HRA, SBCA, CPS/GPF or other allowances in this tool.</li>
        <li>Monthly rates are not prorated. A partial-month calculation needs an applicable Government order or DDO-approved formula.</li>
        <li>The driver daily rate must come from the applicable Labour Department notification. The DOP order does not provide the amount.</li>
        <li>The tool does not determine eligibility, grade-pay equivalence, training duration, regularisation or later pay fixation.</li>
      </ul>
      <p class="mt-4 text-xs text-slate-500">Primary sources: <a class="underline" href="https://dop.sikkim.gov.in/notificationdoc/M(164).pdf" target="_blank" rel="noreferrer">DOP Notification No. M(164)/42/GEN/DOP dated 12 August 2026</a> and <a class="underline" href="https://dop.sikkim.gov.in/notificationdoc/J(1)86-GEN-DOP%20(Direct).pdf" target="_blank" rel="noreferrer">DOP Notification No. J(1)/86-GEN/DOP dated 25 July 2024</a>.</p>
    </section>
  </div>
</main>
