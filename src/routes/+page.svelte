<script lang="ts">
  import SalaryCalculator from '../lib/components/SalaryCalculator.svelte';
</script>
<svelte:head>
  <title>Sikkim Government Salary Calculator | Monthly Pay Estimate</title>
  <meta name="description" content="Estimate monthly salary for Sikkim Government employees using the State pay matrix, DA, allowances, CPS/GPF and applicable deductions." />
  <meta name="keywords" content="Sikkim salary calculator, Sikkim government pay matrix, DA, HRA, CPS, professional tax" />
  <meta name="theme-color" content="#f4f6f3" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Sikkim Government Salary Calculator" />
  <meta property="og:description" content="A transparent monthly salary estimate for Sikkim Government employees." />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Sikkim Government Salary Calculator" />
  <meta name="twitter:description" content="Estimate monthly pay, allowances and deductions for Sikkim Government employees." />
</svelte:head>
<div class="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
  <nav aria-label="Salary calculator tools" class="mx-auto grid max-w-5xl grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-2">
    <a class="rounded-lg px-2 py-2 text-center text-xs leading-4 underline underline-offset-4 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-emerald-900/50" href="/temporary-pay">Temporary & training pay</a>
    <a class="rounded-lg px-2 py-2 text-center text-xs leading-4 underline underline-offset-4 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-emerald-900/50" href="/pay-progression">Pay progression & service history</a>
    <a class="rounded-lg px-2 py-2 text-center text-xs leading-4 underline underline-offset-4 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-emerald-900/50" href="/gpf-planner">GPF contribution planner</a>
    <a class="rounded-lg px-2 py-2 text-center text-xs leading-4 underline underline-offset-4 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-emerald-900/50" href="/arrears-planner">Salary arrears planner</a>
    <a class="rounded-lg px-2 py-2 text-center text-xs leading-4 underline underline-offset-4 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-emerald-900/50" href="/retirement-planner">Retirement benefits estimator</a>
    <a class="rounded-lg px-2 py-2 text-center text-xs leading-4 underline underline-offset-4 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 dark:hover:bg-emerald-900/50" href="/payslip-generator">Monthly salary slip</a>
  </nav>
</div>
<SalaryCalculator />
