import { expect, test } from '@playwright/test';

const selectInsideLabel = (page: import('@playwright/test').Page, labelText: string) =>
  page.locator('label').filter({ hasText: labelText }).locator('select').first();

test.describe('Sikkim salary calculator browser workflows', () => {
  test('the main calculator computes a Level 17 salary with the correct Sikkim PT band', async ({ page }) => {
    await page.goto('/');

    await page.locator('#level').selectOption('17');
    await expect(page.locator('#cell')).toBeEnabled();
    await page.locator('#cell').selectOption('1');
    await page.locator('#daRate').fill('60');

    await page.locator('details summary').filter({ hasText: 'Allowances & deductions' }).click();
    await page.locator('#pensionMode').selectOption('none');
    await page.locator('#ptMode').selectOption('auto');

    await page.getByRole('button', { name: 'Calculate monthly salary' }).click();

    const result = page.locator('.result-card');
    await expect(result).toBeVisible();
    await expect(result).toContainText('₹89,400');
    await expect(result).toContainText('₹89,600');
    await expect(result).toContainText('Level 15 and above — ₹200');
  });

  test('the payslip form calculates, records the month and updates the annual summary', async ({ page }) => {
    await page.goto('/payslip-generator');

    await page.getByLabel('Basic pay (₹)', { exact: true }).fill('56000');
    await page.getByLabel('DA rate (%)', { exact: true }).fill('60');
    await selectInsideLabel(page, 'Pension arrangement').selectOption('none');
    await selectInsideLabel(page, 'Professional Tax treatment').selectOption('auto');
    await selectInsideLabel(page, 'Professional Tax pay-level band').selectOption('level-15-and-above');

    const statement = page.locator('#print-slip');
    await expect(statement).toContainText('₹89,400');
    await expect(statement).toContainText('₹89,600');

    await page.getByRole('button', { name: 'Add / update this month' }).click();
    await expect(page.locator('[role="status"]').filter({ hasText: 'Current month added to annual summary.' })).toBeVisible();
    await expect(page.getByText('2026 gross', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Print / Save salary slip as PDF' })).toBeEnabled();
  });

  test('the arrears workflow applies an effective-dated increment and produces a complete printable statement', async ({ page }) => {
    await page.goto('/arrears-planner');

    await page.getByLabel('From month', { exact: true }).fill('2026-01');
    await page.getByLabel('To month', { exact: true }).fill('2026-02');
    await page.getByLabel('Basic pay (₹)', { exact: true }).fill('56000');
    await page.getByLabel('DA rate (%)', { exact: true }).fill('60');
    await selectInsideLabel(page, 'Pension arrangement').selectOption('none');
    await selectInsideLabel(page, 'Professional Tax treatment').selectOption('none');

    await page.getByLabel('Effective month', { exact: true }).fill('2026-02');
    await selectInsideLabel(page, 'Change type').selectOption('annual-increment');
    await page.getByLabel('Order / payslip reference', { exact: true }).fill('Synthetic browser QA fixture — increment');
    await page.getByLabel('New basic pay (₹)', { exact: true }).fill('57000');
    await page.getByRole('button', { name: 'Add effective-dated change' }).click();

    const monthlyTable = page.locator('table').filter({ hasText: 'Actual net paid (₹)' });
    await expect(monthlyTable).toContainText('2026-02');
    await expect(monthlyTable).toContainText('57,000');

    await page.getByLabel('Actual net salary credited for 2026-01').fill('89600');
    await page.getByLabel('Actual net salary credited for 2026-02').fill('91200');

    await expect(page.getByText('Ready for print preview.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download CSV' })).toBeEnabled();
    await expect(page.getByText('Salary / Arrears Calculation Statement', { exact: true })).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    await expect(page.getByText('Salary / Arrears Calculation Statement', { exact: true })).toBeVisible();
  });

  test('the key employee tools load at a mobile viewport without document-level horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const routes = [
      '/',
      '/payslip-generator',
      '/arrears-planner',
      '/pay-progression',
      '/retirement-planner',
      '/gpf-planner',
      '/temporary-pay'
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth
      }));
      expect(
        dimensions.document,
        'Unexpected horizontal overflow on ' + route
      ).toBeLessThanOrEqual(dimensions.viewport + 1);
    }
  });
});
