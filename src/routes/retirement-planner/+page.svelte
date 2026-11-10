<script lang="ts">
 import {calculateRetirementEstimate,DEFAULT_RETIREMENT_INPUT,type RetirementEstimateInput} from '../../lib/retirement';
 let input=$state<RetirementEstimateInput>({...DEFAULT_RETIREMENT_INPUT});
 const result=$derived(calculateRetirementEstimate(input));
 const fmt=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
 const fields=[
  {key:'pensionableEmoluments',label:'Pensionable monthly emoluments (₹)',help:'Enter the emoluments base confirmed for the applicable pension arrangement.'},
  {key:'pensionRatePercent',label:'Pension percentage (%)',help:'Enter the percentage from the applicable scheme/order; no default is assumed.'},
  {key:'commutationPercent',label:'Pension commutation percentage (%)',help:'Enter the permitted percentage confirmed for this employee.'},
  {key:'commutationMultiplierMonths',label:'Commutation multiplier (months)',help:'Enter the approved multiplier/factor converted to an equivalent number of months.'},
  {key:'gratuityEmoluments',label:'Gratuity emoluments base (₹)',help:'Enter the applicable gratuity emoluments.'},
  {key:'gratuityServiceUnits',label:'Eligible service units',help:'Enter service units as defined by the applicable rule (e.g. completed periods).'},
  {key:'gratuityMultiplier',label:'Gratuity multiplier',help:'Enter the numerator multiplier from the applicable formula.'},
  {key:'gratuityDivisor',label:'Gratuity divisor',help:'Required when gratuity formula inputs are used.'},
  {key:'gratuityCeiling',label:'Gratuity ceiling (₹)',help:'Enter the current employee-applicable ceiling confirmed by Accounts.'},
  {key:'leaveSalaryMonthly',label:'Monthly leave-salary base (₹)',help:'Enter the leave salary base approved for encashment.'},
  {key:'eligibleLeaveDays',label:'Eligible leave days',help:'Enter the balance certified by the leave-sanctioning authority.'},
  {key:'leaveEncashmentDivisor',label:'Leave-encashment divisor',help:'Enter the divisor prescribed for this employee and leave type.'},
  {key:'otherRetirementBenefits',label:'Other one-time benefits (₹)',help:'Optional manually verified amount; no benefit is assumed.'}
 ] as const;
</script>
<svelte:head>
 <title>Retirement Benefits Estimator | Sikkim Government Salary Calculator</title>
 <meta name="description" content="Illustrative retirement benefit worksheet for Sikkim Government employees using employee-specific rule inputs confirmed by Accounts." />
</svelte:head>
<main class="min-h-screen bg-[#f4f6f3] px-4 py-8 text-slate-900 dark:bg-[#0b1411] dark:text-slate-100 sm:px-8">
 <div class="mx-auto max-w-5xl space-y-6">
  <a href="/" class="text-sm font-bold text-emerald-800 hover:underline dark:text-emerald-400">← Back to salary calculator</a>
  <header><p class="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">Sikkim Government employee utility</p><h1 class="mt-2 text-3xl font-black tracking-tight">Retirement benefits estimator</h1><p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">A configurable worksheet for pension, commutation, gratuity and leave encashment. Enter only figures and formula parameters confirmed for the employee by the applicable scheme, signed order and DDO / Accounts section.</p></header>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
   <div class="flex flex-wrap items-center justify-between gap-3"><h2 class="text-lg font-black">Employee-specific rule inputs</h2><button type="button" class="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700" onclick={()=>input={...DEFAULT_RETIREMENT_INPUT}}>Reset all inputs</button></div>
   <p class="mt-2 text-xs leading-5 text-slate-500">All values start at zero intentionally. The calculator does not decide OPS/CPS/GPF eligibility, qualifying service, pension rate, gratuity formula, ceiling or leave entitlement.</p>
   <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each fields as field}
     <label class="text-sm font-bold">{field.label}
      <input type="number" min="0" step="any" bind:value={input[field.key]} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
      <span class="mt-1 block text-xs font-normal leading-5 text-slate-500">{field.help}</span>
     </label>
    {/each}
   </div>
   {#if !result.valid}<div class="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="alert"><strong>Review required</strong><ul class="mt-2 list-disc pl-5">{#each result.errors as error}<li>{error}</li>{/each}</ul></div>{/if}
  </section>
  <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
   <h2 class="text-lg font-black">Estimated results</h2>
   {#if !result.valid}<p class="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100" role="status">Results are withheld because one or more benefit sections are incomplete or invalid. Complete the required inputs and review the validation messages above.</p>{/if}
   <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Estimated monthly pension</p><p class="mt-1 text-2xl font-black">{fmt(result.monthlyPension)}</p></div>
    <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Monthly pension after commutation</p><p class="mt-1 text-2xl font-black">{fmt(result.residualMonthlyPension)}</p></div>
    <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Commutation lump sum</p><p class="mt-1 text-2xl font-black">{fmt(result.commutationLumpSum)}</p></div>
    <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p class="text-xs text-slate-500">Gratuity (after entered ceiling)</p><p class="mt-1 text-xl font-black">{fmt(result.gratuity)}</p><p class="mt-1 text-xs text-slate-500">Before ceiling: {fmt(result.gratuityBeforeCeiling)}</p></div>
    <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p class="text-xs text-slate-500">Leave encashment</p><p class="mt-1 text-xl font-black">{fmt(result.leaveEncashment)}</p></div>
    <div class="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"><p class="text-xs text-slate-500">Other one-time benefits</p><p class="mt-1 text-xl font-black">{fmt(result.otherRetirementBenefits)}</p></div>
   </div>
   <div class="mt-4 rounded-2xl bg-emerald-950 p-5 text-white"><p class="text-xs font-bold uppercase tracking-wider text-emerald-200">Total estimated one-time benefits</p><p class="mt-1 text-3xl font-black">{fmt(result.totalOneTimeBenefits)}</p><p class="mt-2 text-xs text-emerald-100">Excludes recurring monthly pension and any unentered benefits, deductions, tax or recoveries.</p></div>
   <div class="mt-5 flex flex-wrap gap-3"><button type="button" class="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-900" disabled={!result.valid} onclick={()=>window.print()} class:opacity-40={!result.valid} class:cursor-not-allowed={!result.valid}>Print / Save as PDF</button></div>
  </section>
  <section class="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
   <h2 class="font-extrabold">Important safeguards</h2>
   <ul class="mt-2 list-disc space-y-1 pl-5">
    <li>This is a configurable illustration, not a statement of Sikkim Government pension or retirement rules.</li>
    <li>No OPS, CPS/CPF, NPS, GPF or other scheme eligibility is inferred. Different employee cohorts and appointments may be governed by different orders.</li>
    <li>Every percentage, formula multiplier, divisor, ceiling, emoluments base, qualifying service unit and leave balance must be confirmed from the employee's records and applicable current rules.</li>
    <li>Family pension, tax, interest, deductions, recoveries, medical benefits and survivor entitlements are not calculated in this stage.</li>
    <li>Do not use this estimate for sanction or payment without verification and approval by the competent authority.</li>
   </ul>
  </section>
  <p class="text-xs text-slate-500">No official pension-rate schedule or retirement ceiling is preloaded. Enter only verified employee-specific values.</p>
 </div>
</main>
<style>
 @media print { @page {size:A4 portrait;margin:12mm;} :global(body){background:#fff!important;color:#111!important;} main{min-height:0!important;padding:0!important;background:#fff!important;color:#111!important;} main>div{max-width:none!important;} button,a{display:none!important;} section{break-inside:avoid;box-shadow:none!important;} input{border:0!important;padding:2px!important;} }
</style>
