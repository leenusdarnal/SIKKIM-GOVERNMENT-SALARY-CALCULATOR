<script lang="ts">
  import { onMount } from 'svelte';
  import {
    calculateArrears,
    createArrearsCsv,
    getArrearsMonthKeys,
    type ArrearChange,
    type ArrearChangeType,
    type ArrearSalaryUpdate,
    type ArrearsInput
  } from '../../lib/arrears';
  import { DEFAULT_SALARY_INPUT, type SalaryInput } from '../../lib/salary';
  import {
    createArrearsEntryTemplateCsv,
    createArrearsScenario,
    loadArrearsScenario,
    parseArrearsEntryCsv,
    parseArrearsScenarioBackup,
    restoreArrearsScenario,
    saveArrearsScenario,
    serializeArrearsScenario,
    type ArrearsScenario
  } from '../../lib/arrears-storage';

  let startMonth = $state('2026-01');
  let endMonth = $state('2026-11');
  let baseSalary = $state<SalaryInput>({ ...DEFAULT_SALARY_INPUT, daRate: 0 });
  let changes = $state<ArrearChange[]>([]);
  let eventMonth = $state('2026-01');
  let eventPayableMonth = $state('');
  let eventType = $state<ArrearChangeType>('da-revision');
  let eventBasicPay = $state('');
  let eventDaRate = $state('');
  let eventDescription = $state('');
  let editingChangeIndex = $state<number | null>(null);
  let componentEvent = $state({
    hraEligible: '',
    hraRate: '',
    hraMinimum: '',
    sbcaRate: '',
    cpsRate: '',
    cpsEmployerRate: '',
    transportAllowance: '',
    otherEarnings: '',
    pensionMode: '',
    manualPension: '',
    professionalTaxMode: '',
    manualProfessionalTax: '',
    incomeTaxTds: '',
    gis: '',
    stampFee: '',
    otherDeductions: ''
  });
  let actualPaid = $state<Record<string, string>>({});
  let recoveryAmounts = $state<Record<string, string>>({});
  let payableDays = $state<Record<string, string>>({});
  let salaryFactorPercents = $state<Record<string, string>>({});
  let interestAnnualRate = $state('0');
  let interestSettlementDate = $state('');
  let formError = $state('');
  let draftStatus = $state('Waiting for local draft');
  let fileStatus = $state('');
  let draftReady = $state(false);

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
        : Number(recoveryAmounts[month]),
    payableDays:
      payableDays[month] === undefined || payableDays[month].trim() === ''
        ? null
        : Number(payableDays[month]),
    salaryFactorPercent:
      salaryFactorPercents[month] === undefined || salaryFactorPercents[month].trim() === ''
        ? 100
        : Number(salaryFactorPercents[month])
  })));
  const arrearsInput = $derived<ArrearsInput>({
    startMonth,
    endMonth,
    baseSalary: { ...baseSalary },
    changes,
    monthlyRecords,
    interestSettings: {
      annualRate: interestAnnualRate.trim() === '' ? 0 : Number(interestAnnualRate),
      settlementDate: interestSettlementDate
    }
  });
  const result = $derived(calculateArrears(arrearsInput));
  const missingPaidMonths = $derived(result.rows.filter((row) => row.actualTakeHome === null).length);
  const fmt = (value: number | null | undefined) =>
    value === null || value === undefined || !Number.isFinite(value)
      ? '—'
      : new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(Math.round(value));

  onMount(() => {
    try {
      const saved = loadArrearsScenario(window.localStorage);
      if (saved) {
        applyScenario(saved);
        draftStatus = 'Restored from this browser';
      } else {
        draftStatus = 'No saved scenario yet';
      }
    } catch {
      draftStatus = 'Local storage is unavailable in this browser';
    }
    draftReady = true;
  });

  $effect(() => {
    if (!draftReady) return;
    try {
      saveArrearsScenario(arrearsInput, window.localStorage);
      draftStatus = 'Saved privately in this browser';
    } catch {
      draftStatus = 'Draft not saved — check browser storage availability';
    }
  });

  function applyScenario(scenario: ArrearsScenario) {
    startMonth = scenario.startMonth;
    endMonth = scenario.endMonth;
    baseSalary = { ...scenario.baseSalary };
    changes = scenario.changes.map((change) => ({
      ...change,
      ...(change.salaryUpdates ? { salaryUpdates: { ...change.salaryUpdates } } : {})
    }));
    actualPaid = {};
    recoveryAmounts = {};
    payableDays = {};
    salaryFactorPercents = {};
    for (const record of scenario.monthlyRecords) {
      actualPaid[record.month] = record.actualTakeHome === null ? '' : String(record.actualTakeHome);
      recoveryAmounts[record.month] = String(record.recovery);
      payableDays[record.month] = record.payableDays === null || record.payableDays === undefined
        ? ''
        : String(record.payableDays);
      salaryFactorPercents[record.month] = record.salaryFactorPercent === undefined
        ? '100'
        : String(record.salaryFactorPercent);
    }
    interestAnnualRate = String(scenario.interestSettings?.annualRate ?? 0);
    interestSettlementDate = scenario.interestSettings?.settlementDate ?? '';
  }

  function updateActualPaid(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    actualPaid = { ...actualPaid, [month]: target.value };
  }

  function updateRecovery(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    recoveryAmounts = { ...recoveryAmounts, [month]: target.value };
  }

  function updatePayableDays(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    payableDays = { ...payableDays, [month]: target.value };
  }

  function updateSalaryFactor(month: string, event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    salaryFactorPercents = { ...salaryFactorPercents, [month]: target.value };
  }

  function resetComponentEvent() {
    componentEvent = {
      hraEligible: '', hraRate: '', hraMinimum: '', sbcaRate: '', cpsRate: '', cpsEmployerRate: '',
      transportAllowance: '', otherEarnings: '', pensionMode: '',
      manualPension: '', professionalTaxMode: '', manualProfessionalTax: '',
      incomeTaxTds: '', gis: '', stampFee: '', otherDeductions: ''
    };
  }

  function buildComponentUpdate(): ArrearSalaryUpdate {
    const update: ArrearSalaryUpdate = {};
    if (componentEvent.hraEligible !== '') update.hraEligible = componentEvent.hraEligible === 'yes';
    if (componentEvent.hraRate.trim() !== '') update.hraRate = Number(componentEvent.hraRate);
    if (componentEvent.hraMinimum.trim() !== '') update.hraMinimum = Number(componentEvent.hraMinimum);
    if (componentEvent.sbcaRate.trim() !== '') update.sbcaRate = Number(componentEvent.sbcaRate);
    if (componentEvent.cpsRate.trim() !== '') update.cpsRate = Number(componentEvent.cpsRate);
    if (componentEvent.cpsEmployerRate.trim() !== '') update.cpsEmployerRate = Number(componentEvent.cpsEmployerRate);
    if (componentEvent.transportAllowance.trim() !== '') update.transportAllowance = Number(componentEvent.transportAllowance);
    if (componentEvent.otherEarnings.trim() !== '') update.otherEarnings = Number(componentEvent.otherEarnings);
    if (componentEvent.pensionMode !== '') update.pensionMode = componentEvent.pensionMode as SalaryInput['pensionMode'];
    if (componentEvent.manualPension.trim() !== '') update.manualPension = Number(componentEvent.manualPension);
    if (componentEvent.professionalTaxMode !== '') update.professionalTaxMode = componentEvent.professionalTaxMode as SalaryInput['professionalTaxMode'];
    if (componentEvent.manualProfessionalTax.trim() !== '') update.manualProfessionalTax = Number(componentEvent.manualProfessionalTax);
    if (componentEvent.incomeTaxTds.trim() !== '') update.incomeTaxTds = Number(componentEvent.incomeTaxTds);
    if (componentEvent.gis.trim() !== '') update.gis = Number(componentEvent.gis);
    if (componentEvent.stampFee.trim() !== '') update.stampFee = Number(componentEvent.stampFee);
    if (componentEvent.otherDeductions.trim() !== '') update.otherDeductions = Number(componentEvent.otherDeductions);
    return update;
  }

  function clearEventEditor() {
    editingChangeIndex = null;
    eventMonth = startMonth;
    eventPayableMonth = '';
    eventType = 'da-revision';
    eventBasicPay = '';
    eventDaRate = '';
    eventDescription = '';
    resetComponentEvent();
  }

  function addChange() {
    const basicPay = eventBasicPay.trim() === '' ? undefined : Number(eventBasicPay);
    const daRate = eventDaRate.trim() === '' ? undefined : Number(eventDaRate);
    const salaryUpdates = buildComponentUpdate();
    const hasSalaryUpdates = Object.keys(salaryUpdates).length > 0;
    const candidate: ArrearChange = {
      effectiveMonth: eventMonth,
      ...(eventPayableMonth.trim() === '' ? {} : { payableFromMonth: eventPayableMonth }),
      type: eventType,
      description: eventDescription.trim(),
      ...(basicPay === undefined ? {} : { basicPay }),
      ...(daRate === undefined ? {} : { daRate }),
      ...(hasSalaryUpdates ? { salaryUpdates } : {})
    };

    if (!candidate.description) {
      formError = 'Enter the Government order number, date or a clear payslip reference.';
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
    if (eventType === 'allowance-deduction' && !hasSalaryUpdates) {
      formError = 'Enter at least one allowance or deduction value for this effective month.';
      return;
    }

    if (editingChangeIndex === null) {
      changes = [...changes, candidate];
    } else {
      changes = changes.map((change, index) => index === editingChangeIndex ? candidate : change);
    }
    clearEventEditor();
    formError = '';
  }

  function editChange(index: number) {
    const change = changes[index];
    if (!change) return;
    editingChangeIndex = index;
    eventMonth = change.effectiveMonth;
    eventPayableMonth = change.payableFromMonth ?? '';
    eventType = change.type;
    eventBasicPay = change.basicPay === undefined ? '' : String(change.basicPay);
    eventDaRate = change.daRate === undefined ? '' : String(change.daRate);
    eventDescription = change.description;
    const update = change.salaryUpdates ?? {};
    componentEvent = {
      hraEligible: update.hraEligible === undefined ? '' : update.hraEligible ? 'yes' : 'no',
      hraRate: update.hraRate === undefined ? '' : String(update.hraRate),
      hraMinimum: update.hraMinimum === undefined ? '' : String(update.hraMinimum),
      sbcaRate: update.sbcaRate === undefined ? '' : String(update.sbcaRate),
      cpsRate: update.cpsRate === undefined ? '' : String(update.cpsRate),
      cpsEmployerRate: update.cpsEmployerRate === undefined ? '' : String(update.cpsEmployerRate),
      transportAllowance: update.transportAllowance === undefined ? '' : String(update.transportAllowance),
      otherEarnings: update.otherEarnings === undefined ? '' : String(update.otherEarnings),
      pensionMode: update.pensionMode ?? '',
      manualPension: update.manualPension === undefined ? '' : String(update.manualPension),
      professionalTaxMode: update.professionalTaxMode ?? '',
      manualProfessionalTax: update.manualProfessionalTax === undefined ? '' : String(update.manualProfessionalTax),
      incomeTaxTds: update.incomeTaxTds === undefined ? '' : String(update.incomeTaxTds),
      gis: update.gis === undefined ? '' : String(update.gis),
      stampFee: update.stampFee === undefined ? '' : String(update.stampFee),
      otherDeductions: update.otherDeductions === undefined ? '' : String(update.otherDeductions)
    };
    formError = '';
  }

  function componentChangeSummary(change: ArrearChange): string {
    const labels: Record<string, string> = {
      hraEligible: 'HRA eligibility',
      hraRate: 'HRA rate',
      hraMinimum: 'HRA minimum',
      sbcaRate: 'SBCA rate',
      cpsRate: 'CPS employee rate',
      cpsEmployerRate: 'CPS State rate',
      transportAllowance: 'Transport',
      otherEarnings: 'Other earnings',
      pensionMode: 'Pension',
      manualPension: 'GPF / manual pension',
      professionalTaxMode: 'Professional Tax mode',
      manualProfessionalTax: 'Professional Tax',
      incomeTaxTds: 'Income Tax TDS',
      gis: 'GIS',
      stampFee: 'Stamp / fixed fee',
      otherDeductions: 'Other deductions'
    };
    return Object.entries(change.salaryUpdates ?? {}).map(([key, value]) => {
      const display = typeof value === 'boolean'
        ? value ? 'Eligible' : 'Not eligible'
        : String(value) + (key.endsWith('Rate') ? '%' : '');
      return (labels[key] ?? key) + ': ' + display;
    }).join(' · ') || '—';
  }

  function removeChange(index: number) {
    changes = changes.filter((_, itemIndex) => itemIndex !== index);
    if (editingChangeIndex === index) clearEventEditor();
    else if (editingChangeIndex !== null && index < editingChangeIndex) editingChangeIndex -= 1;
  }

  function downloadText(filename: string, text: string, mimeType: string) {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportCsv() {
    try {
      downloadText(
        'sikkim-salary-arrears-' + startMonth + '-to-' + endMonth + '.csv',
        createArrearsCsv(result),
        'text/csv;charset=utf-8'
      );
      formError = '';
    } catch (cause) {
      formError = cause instanceof Error ? cause.message : 'Unable to export the arrears statement.';
    }
  }

  function exportJsonBackup() {
    try {
      const scenario = createArrearsScenario(arrearsInput);
      downloadText(
        'sikkim-salary-arrears-' + startMonth + '-to-' + endMonth + '.json',
        serializeArrearsScenario(scenario),
        'application/json;charset=utf-8'
      );
      fileStatus = 'JSON backup created.';
    } catch (cause) {
      fileStatus = cause instanceof Error ? cause.message : 'Unable to create the JSON backup.';
    }
  }

  async function restoreJsonFile(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    try {
      const scenario = parseArrearsScenarioBackup(await file.text());
      applyScenario(scenario);
      try {
        restoreArrearsScenario(await file.text(), window.localStorage);
        draftStatus = 'Backup restored and saved locally';
      } catch {
        draftStatus = 'Backup restored in this session; browser storage is unavailable';
      }
      fileStatus = 'JSON scenario restored.';
    } catch (cause) {
      fileStatus = cause instanceof Error ? cause.message : 'Unable to restore this JSON backup.';
    }
  }

  async function importCsvFile(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    target.value = '';
    if (!file) return;
    try {
      const imported = parseArrearsEntryCsv(await file.text(), months);
      for (const record of imported) {
        actualPaid = {
          ...actualPaid,
          [record.month]: record.actualTakeHome === null ? '' : String(record.actualTakeHome)
        };
        recoveryAmounts = { ...recoveryAmounts, [record.month]: String(record.recovery) };
        payableDays = { ...payableDays, [record.month]: record.payableDays === null || record.payableDays === undefined ? '' : String(record.payableDays) };
        salaryFactorPercents = { ...salaryFactorPercents, [record.month]: String(record.salaryFactorPercent ?? 100) };
      }
      fileStatus = imported.length + ' month(s) imported from CSV.';
    } catch (cause) {
      fileStatus = cause instanceof Error ? cause.message : 'Unable to import this CSV.';
    }
  }

  function downloadCsvTemplate() {
    try {
      downloadText(
        'sikkim-arrears-monthly-entry-template.csv',
        createArrearsEntryTemplateCsv(months),
        'text/csv;charset=utf-8'
      );
      fileStatus = 'CSV entry template created.';
    } catch (cause) {
      fileStatus = cause instanceof Error ? cause.message : 'Unable to create the CSV template.';
    }
  }

  function clearSavedScenario() {
    try {
      window.localStorage.removeItem('sikkim-salary-arrears-scenario-v1');
      startMonth = '2026-01';
      endMonth = '2026-11';
      baseSalary = { ...DEFAULT_SALARY_INPUT, daRate: 0 };
      changes = [];
      actualPaid = {};
      recoveryAmounts = {};
      payableDays = {};
      salaryFactorPercents = {};
      interestAnnualRate = '0';
      interestSettlementDate = '';
      clearEventEditor();
      fileStatus = 'Saved scenario cleared from this browser.';
      draftStatus = 'No saved scenario';
    } catch {
      fileStatus = 'Unable to clear browser-local storage.';
    }
  }

  function printStatement() {
    window.print();
  }
</script></script>

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

    <section class="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-extrabold">Scenario backup and monthly payslip import</h2>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">{draftStatus}. Data stays in this browser unless you export a file.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button type="button" onclick={exportJsonBackup} class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Download JSON backup</button>
          <button type="button" onclick={downloadCsvTemplate} class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold dark:border-slate-700">Download CSV template</button>
          <button type="button" onclick={clearSavedScenario} class="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 dark:border-red-900 dark:text-red-300">Clear scenario</button>
        </div>
      </div>
      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <label class="rounded-xl border border-dashed border-slate-300 p-3 text-xs font-bold dark:border-slate-700">Restore JSON scenario
          <input type="file" accept=".json,application/json" onchange={restoreJsonFile} class="mt-2 block w-full text-xs font-normal" />
        </label>
        <label class="rounded-xl border border-dashed border-slate-300 p-3 text-xs font-bold dark:border-slate-700">Import monthly actual salary / recovery CSV
          <input type="file" accept=".csv,text/csv" onchange={importCsvFile} class="mt-2 block w-full text-xs font-normal" />
        </label>
      </div>
      {#if fileStatus}
        <p role="status" class="mt-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">{fileStatus}</p>
      {/if}
      <p class="mt-3 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Local draft is browser-specific and not encrypted. JSON backups contain salary inputs and actual credited pay; store them securely and do not use a shared browser for confidential records. The CSV import accepts the template's columns and does not upload employee data.</p>
    </section>

    <section class="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      <h2 class="font-extrabold">Read before calculating</h2>
      <ul class="mt-2 list-disc space-y-1 pl-5">
        <li>This is an estimate, not an official pay-fixation or arrears sanction. Enter basic pay, DA and allowance/deduction changes from the employee's applicable signed Government orders and payslips.</li>
        <li>Each effective-dated change applies from the selected month onward. Increment, promotion, ACPS and pay fixation eligibility are not decided automatically; enter the pay actually fixed by the competent authority.</li>
        <li>Payable days and leave/pay factor are manual inputs. They do not decide leave eligibility or leave salary. Use the applicable leave order and DDO calculation; the factor proportionally adjusts Basic Pay, DA, HRA, SBCA and other entered earnings.</li>
        <li>Income Tax TDS is entered from the employee's tax computation or payslip. This planner does not estimate annual income-tax liability or select a tax regime.</li>
        <li>Interest is optional and defaults to zero. Enter a rate only where an order, court decision or competent authority authorises interest; the tool gives a simple-interest estimate on positive monthly net differences only.</li>
        <li>Enter actual net take-home credited for each month. Additional recovery is deducted from the arrears settlement; do not duplicate an amount already deducted in payroll.</li>
        <li>Periods are limited to 60 months. The 2018 revised-pay calculator does not convert pre-revised basic pay or automate pre-revised fixation. Manually entered DA rates up to 300% are available for a separately verified basis.</li>
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
            <input type="number" min="0" max="300" step="0.01" bind:value={baseSalary.daRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
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
          {#if baseSalary.pensionMode === 'cps'}
            <label class="text-sm font-bold">CPS / CPF employee rate (%)
              <input type="number" min="0" max="100" step="0.01" bind:value={baseSalary.cpsRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
            <label class="text-sm font-bold">State matching contribution rate (%)
              <input type="number" min="0" max="100" step="0.01" bind:value={baseSalary.cpsEmployerRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
            </label>
          {/if}
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
          <label class="text-sm font-bold">Income Tax TDS (₹)
            <input type="number" min="0" step="1" bind:value={baseSalary.incomeTaxTds} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
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
        <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">CPS/CPF uses the configured rate (10% standard reference) on Basic Pay + DA; GPF/manual pension and other deductions are manually entered. Income Tax TDS is separate from Sikkim Professional Tax and is not recalculated annually by this tool.</p>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">02 · Effective-dated changes</p>
      <h2 class="mt-1 text-xl font-black">Add dated salary, allowance and deduction changes</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">A change is applied from the selected month onward. Use a separate entry for each order/effective date.</p>

      <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label class="text-sm font-bold">Effective month
          <input type="month" bind:value={eventMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">Payable from (optional)
          <input type="month" bind:value={eventPayableMonth} min={eventMonth} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
        <label class="text-sm font-bold">Change type
          <select bind:value={eventType} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700">
            <option value="da-revision">DA revision</option>
            <option value="annual-increment">Annual increment</option>
            <option value="promotion">Promotion / upgradation</option>
            <option value="pay-fixation">Pay fixation order</option>
            <option value="manual-adjustment">Basic / DA adjustment</option>
            <option value="allowance-deduction">Allowance / deduction revision</option>
          </select>
        </label>
        <label class="text-sm font-bold">Order / payslip reference
          <input bind:value={eventDescription} maxlength="160" placeholder="Order number and date" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
        </label>
      </div>

      {#if eventType === 'allowance-deduction'}
        <div class="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h3 class="font-extrabold">Allowance and deduction changes</h3>
          <p class="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Leave a field unchanged to carry forward its previous value. Enter only items that change from this effective month.</p>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label class="text-sm font-bold">HRA eligibility
              <select bind:value={componentEvent.hraEligible} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Unchanged</option><option value="yes">Eligible</option><option value="no">Not eligible</option>
              </select>
            </label>
            <label class="text-sm font-bold">HRA rate (%)
              <input type="number" min="0" max="100" step="0.01" value={componentEvent.hraRate} oninput={(event) => (componentEvent.hraRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">HRA minimum (₹)
              <input type="number" min="0" step="1" value={componentEvent.hraMinimum} oninput={(event) => (componentEvent.hraMinimum = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">SBCA rate (%)
              <input type="number" min="0" max="100" step="0.01" value={componentEvent.sbcaRate} oninput={(event) => (componentEvent.sbcaRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Transport allowance (₹)
              <input type="number" min="0" step="1" value={componentEvent.transportAllowance} oninput={(event) => (componentEvent.transportAllowance = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Other earnings (₹)
              <input type="number" min="0" step="1" value={componentEvent.otherEarnings} oninput={(event) => (componentEvent.otherEarnings = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Pension arrangement
              <select bind:value={componentEvent.pensionMode} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Unchanged</option><option value="cps">CPS / CPF</option><option value="gpf">GPF</option><option value="manual">Manual pension</option><option value="none">No pension deduction</option>
              </select>
            </label>
            <label class="text-sm font-bold">CPS / CPF employee rate (%)
              <input type="number" min="0" max="100" step="0.01" value={componentEvent.cpsRate} oninput={(event) => (componentEvent.cpsRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">State matching contribution rate (%)
              <input type="number" min="0" max="100" step="0.01" value={componentEvent.cpsEmployerRate} oninput={(event) => (componentEvent.cpsEmployerRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Manual pension / GPF (₹)
              <input type="number" min="0" step="1" value={componentEvent.manualPension} oninput={(event) => (componentEvent.manualPension = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Professional Tax treatment
              <select bind:value={componentEvent.professionalTaxMode} class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <option value="">Unchanged</option><option value="auto">Indicative automatic slab</option><option value="manual">Manual payslip amount</option><option value="none">Not applicable / exempt</option>
              </select>
            </label>
            <label class="text-sm font-bold">Manual Professional Tax (₹)
              <input type="number" min="0" step="1" value={componentEvent.manualProfessionalTax} oninput={(event) => (componentEvent.manualProfessionalTax = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Income Tax TDS (₹)
              <input type="number" min="0" step="1" value={componentEvent.incomeTaxTds} oninput={(event) => (componentEvent.incomeTaxTds = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">GIS (₹)
              <input type="number" min="0" step="1" value={componentEvent.gis} oninput={(event) => (componentEvent.gis = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Stamp / fixed fee (₹)
              <input type="number" min="0" step="1" value={componentEvent.stampFee} oninput={(event) => (componentEvent.stampFee = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label class="text-sm font-bold">Other monthly deductions (₹)
              <input type="number" min="0" step="1" value={componentEvent.otherDeductions} oninput={(event) => (componentEvent.otherDeductions = (event.currentTarget as HTMLInputElement).value)} placeholder="Unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" />
            </label>
          </div>
        </div>
      {:else}
        <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label class="text-sm font-bold">New basic pay (₹)
            <input type="number" min="1" step="1" value={eventBasicPay} oninput={(event) => (eventBasicPay = (event.currentTarget as HTMLInputElement).value)} placeholder="Leave blank when unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
          <label class="text-sm font-bold">New DA rate (%)
            <input type="number" min="0" max="300" step="0.01" value={eventDaRate} oninput={(event) => (eventDaRate = (event.currentTarget as HTMLInputElement).value)} placeholder="Leave blank when unchanged" class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          </label>
        </div>
      {/if}
      <div class="mt-4 flex flex-wrap gap-2">
        <button type="button" onclick={addChange} class="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700">{editingChangeIndex === null ? 'Add effective-dated change' : 'Save edited change'}</button>
        {#if editingChangeIndex !== null}
          <button type="button" onclick={clearEventEditor} class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold dark:border-slate-700">Cancel edit</button>
        {/if}
      </div>
      {#if formError}
        <p role="alert" class="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">{formError}</p>
      {/if}
      {#if changes.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[1050px] text-left text-sm">
            <thead><tr class="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-700"><th class="py-3">Effective month</th><th>Change</th><th>New basic pay</th><th>New DA</th><th>Component changes</th><th>Order / reference</th><th></th></tr></thead>
            <tbody>
              {#each changes as change, index}
                <tr class="border-b border-slate-100 dark:border-slate-800">
                  <td class="py-3">{change.effectiveMonth}</td>
                  <td>{change.type.replaceAll('-', ' ')}</td>
                  <td>{change.basicPay === undefined ? '—' : fmt(change.basicPay)}</td>
                  <td>{change.daRate === undefined ? '—' : change.daRate + '%'}</td>
                  <td class="max-w-[280px] whitespace-normal text-xs">{componentChangeSummary(change)}</td>
                  <td>{change.description}</td>
                  <td class="whitespace-nowrap text-right">
                    <button type="button" onclick={() => editChange(index)} class="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold dark:border-slate-700">Edit</button>
                    <button type="button" onclick={() => removeChange(index)} class="ml-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 dark:border-red-900 dark:text-red-300">Remove</button>
                  </td>
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
      <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">03 · Optional interest calculation</p>
      <h2 class="mt-1 text-xl font-black">Interest on arrears (where authorised)</h2>
      <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Interest is switched off by default. Enter a rate and settlement date only when an applicable Government order, court decision or competent authority permits interest. The estimate uses simple interest on positive monthly net differences from each month-end to the settlement date; it does not decide legal entitlement.</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-bold">Authorised annual interest rate (%)
          <input type="number" min="0" max="50" step="0.01" bind:value={interestAnnualRate} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 dark:border-slate-700" />
          <span class="mt-1 block text-xs font-normal text-slate-500">Keep at 0 to disable interest.</span>
        </label>
        <label class="text-sm font-bold">Expected / actual settlement date
          <input type="date" bind:value={interestSettlementDate} disabled={Number(interestAnnualRate) <= 0} class="mt-1 w-full rounded-xl border border-slate-300 bg-transparent p-3 disabled:opacity-50 dark:border-slate-700" />
        </label>
      </div>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-[0.15em] text-emerald-800 dark:text-emerald-400">04 · Monthly comparison</p>
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
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Revised take-home total</p><p class="mt-1 text-xl font-black">{fmt(result.totals.revisedTakeHome)}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Actual credited total</p><p class="mt-1 text-xl font-black">{result.complete ? fmt(result.totals.actualTakeHome) : 'Pending'}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Additional recoveries</p><p class="mt-1 text-xl font-black">{fmt(result.totals.recoveries)}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Net arrears before interest</p><p class="mt-1 text-xl font-black">{result.complete ? fmt(result.totals.netArrears) : 'Pending'}</p></div>
          <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800"><p class="text-xs text-slate-500">Indicative interest</p><p class="mt-1 text-xl font-black">{fmt(result.totals.interestAmount)}</p></div>
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"><p class="text-xs text-emerald-800 dark:text-emerald-300">Total including interest</p><p class="mt-1 text-xl font-black text-emerald-950 dark:text-emerald-100">{result.complete ? fmt(result.totals.totalIncludingInterest) : 'Incomplete'}</p></div>
        </div>
        {#if !result.complete}
          <p class="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-300">{missingPaidMonths} month(s) still need the actual net salary credited before a final arrears total or CSV statement can be produced.</p>
        {:else}
          <div class="mt-3 rounded-xl border border-slate-200 p-3 text-xs leading-5 text-slate-600 dark:border-slate-700 dark:text-slate-300">
            Positive monthly arrears: <strong>{fmt(result.totals.positiveArrears)}</strong> · Negative balance / possible overpayment: <strong>{fmt(Math.abs(result.totals.negativeBalance))}</strong>. Interest is a separate estimate and not a statement of entitlement.
          </div>
        {/if}
      {/if}

      {#if result.rows.length}
        <div class="mt-5 overflow-x-auto">
          <table class="w-full min-w-[2700px] text-left text-sm">
            <thead>
              <tr class="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th class="py-3">Month</th><th>Calendar days</th><th>Payable days</th><th>Pay factor (%)</th><th>Basic pay</th><th>DA rate</th><th>DA</th><th>HRA</th><th>SBCA</th><th>Transport</th><th>Other earnings</th><th>Revised gross</th><th>CPS / GPF</th><th>Professional Tax</th><th>Income Tax TDS</th><th>GIS</th><th>Stamp fee</th><th>Other deductions</th><th>Total deductions</th><th>Revised take-home</th><th>Actual net paid (₹)</th><th>Recovery (₹)</th><th>Net difference</th><th>Interest days</th><th>Interest (₹)</th>
              </tr>
            </thead>
            <tbody>
              {#each result.rows as row (row.month)}
                <tr class="border-b border-slate-100 align-middle dark:border-slate-800">
                  <td class="py-3 font-bold">{row.month}</td>
                  <td>{row.daysInMonth}</td>
                  <td><input type="number" min="0" max={row.daysInMonth} step="0.5" value={payableDays[row.month] ?? ''} oninput={(event) => updatePayableDays(row.month, event)} aria-label={'Payable days for ' + row.month} placeholder="Full month" class="w-24 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td><input type="number" min="0" max="100" step="0.01" value={salaryFactorPercents[row.month] ?? '100'} oninput={(event) => updateSalaryFactor(row.month, event)} aria-label={'Leave or pay factor for ' + row.month} class="w-24 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td>{fmt(row.basicPay)}</td>
                  <td>{row.daRate}%</td>
                  <td>{fmt(row.da)}</td>
                  <td>{fmt(row.hra)}</td>
                  <td>{fmt(row.sbca)}</td>
                  <td>{fmt(row.transportAllowance)}</td>
                  <td>{fmt(row.otherEarnings)}</td>
                  <td>{fmt(row.grossEntitlement)}</td>
                  <td>{fmt(row.employeePension)}</td>
                  <td>{fmt(row.professionalTax)}</td>
                  <td>{fmt(row.incomeTaxTds)}</td>
                  <td>{fmt(row.gis)}</td>
                  <td>{fmt(row.stampFee)}</td>
                  <td>{fmt(row.otherDeductions)}</td>
                  <td>{fmt(row.employeeDeductions)}</td>
                  <td class="font-bold">{fmt(row.revisedTakeHome)}</td>
                  <td><input type="number" min="0" step="1" value={actualPaid[row.month] ?? ''} oninput={(event) => updateActualPaid(row.month, event)} aria-label={'Actual net salary credited for ' + row.month} placeholder="Enter credited amount" class="w-36 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td><input type="number" min="0" step="1" value={recoveryAmounts[row.month] ?? '0'} oninput={(event) => updateRecovery(row.month, event)} aria-label={'Additional recovery for ' + row.month} class="w-28 rounded-lg border border-slate-300 bg-transparent p-2 text-sm dark:border-slate-700" /></td>
                  <td class="font-bold">{fmt(row.netArrears)}</td>
                  <td>{row.interestDays}</td>
                  <td>{fmt(row.interestAmount)}</td>
                </tr>
                {#if row.appliedChanges.length}
                  <tr class="border-b border-slate-100 bg-emerald-50/60 dark:border-slate-800 dark:bg-emerald-950/20"><td colspan="25" class="px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200">Applied from this month: {row.appliedChanges.join(' · ')}</td></tr>
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
      <p class="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Every dated component change carries forward from its effective month until superseded. The model still does not calculate interest on arrears, income-tax recomputation, leave salary, DA on pre-revised pay, statutory rounding differences beyond the salary engine, or partial-month proration.</p>
    </section>
  </div>
</main>
