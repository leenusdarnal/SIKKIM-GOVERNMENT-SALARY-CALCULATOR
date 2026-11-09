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

<SalaryCalculator />
