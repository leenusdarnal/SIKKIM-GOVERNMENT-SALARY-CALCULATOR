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
<div class="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
  New: <a class="underline underline-offset-4" href="/pay-progression">Pay progression & service history tool</a>
</div>
<SalaryCalculator />
