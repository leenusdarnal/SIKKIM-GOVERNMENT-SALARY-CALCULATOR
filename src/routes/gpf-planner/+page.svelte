<script lang="ts">
  import { calculateGpfContribution } from '../../lib/gpf';
  let referencePay = $state(0);
  let rate = $state(6);
  const result = $derived(calculateGpfContribution(referencePay, rate));
  const fmt = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
</script>

<svelte:head>
  <title>GPF Contribution Planner | Sikkim Government Salary Calculator</title>
  <meta name="description" content="Estimate monthly and annual GPF subscription using the Sikkim GPF contribution limits." />
</svelte:head>

<main class="min-h-screen bg-[#f4f6f3] px-4 py-8 text-slate-900 dark:bg-[#0b1411] dark:text-slate-100 sm:px-8">
  <div class="mx-auto max-w-4xl space-y-6">
    <a href="/" class="text-sm font-bold text-emerald-800 hover:underline dark:text-emerald-400">← Back to salary calculator</a>
    <header>
      <p class="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sikkim Government employee utility</p>
      <h1 class="mt-2 text-3xl font-black tracking-tight">GPF contribution planner</h1>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Estimate a monthly General Provident Fund subscription using the contribution limits in the Sikkim General Provident Fund Rules, 1984. Enter the applicable reference pay from your service/pay record; no employee pay is pre-filled.</p>
    </header>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="grid gap-5 sm:grid-cols-2">
        <label class="text-sm font-bold">Reference pay (₹)
          <input type="number" min="0" step="1" bind:value={referencePay} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          <span class="mt-1 block text-xs font-normal text-slate-500">No default is assumed. Enter the pay/emoluments figure applicable under the GPF Rules for the relevant subscription year. Do not automatically use today's basic pay without checking the rule.</span>
        </label>
        <label class="text-sm font-bold">Contribution percentage
          <input type="number" min="6" max="100" step="0.5" bind:value={rate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          <span class="mt-1 block text-xs font-normal text-slate-500">Permitted range under the cited rule: 6% to 100% of reference pay.</span>
        </label>
      </div>

      <div class="mt-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Estimated monthly subscription</p><p class="mt-1 text-2xl font-black">{result.valid ? fmt(result.monthlyContribution) : '—'}</p></div>
        <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Estimated annual subscription (12 months)</p><p class="mt-1 text-2xl font-black">{result.valid ? fmt(result.annualContribution) : '—'}</p></div>
        <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p class="text-xs text-slate-500">Minimum at 6%</p><p class="mt-1 text-lg font-bold">{result.referencePay > 0 ? fmt(result.minimumMonthlyContribution) : '—'}</p></div>
        <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p class="text-xs text-slate-500">Maximum at 100%</p><p class="mt-1 text-lg font-bold">{result.referencePay > 0 ? fmt(result.maximumMonthlyContribution) : '—'}</p></div>
      </div>
      <p class="mt-4 text-sm leading-6 {result.valid ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}" role="status">{result.message}</p>
    </section>

    <section class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 class="font-extrabold">Important limitations</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>This is a contribution illustration, not a determination that an employee is eligible for GPF membership. Confirm the applicable pension arrangement and GPF account status first.</li>
        <li>The Sikkim GPF Rules contain a reference-pay basis tied to the preceding 31 March. Use the figure confirmed by the Accounts/DDO section for the relevant subscription year.</li>
        <li>The planner does not calculate interest, advances, withdrawals, final balance, tax treatment or retirement settlement. It does not assume a current GPF interest rate.</li>
        <li>The annual figure assumes twelve equal monthly subscriptions; actual deductions may differ because of joining, retirement, leave or permitted subscription changes.</li>
      </ul>
    </section>
    <p class="text-xs text-slate-500">Primary source: General Provident Fund (Sikkim Services) Rules, 1984, Notification No. 8/Fin dated 16 October 1984, effective 1 January 1985. Verify the current amended rules and subscription order before acting.</p>
  </div>
</main>
