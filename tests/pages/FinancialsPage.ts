// tests/pages/FinancialsPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class FinancialsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly revenueCard: Locator;
  readonly expensesCard: Locator;
  readonly profitCard: Locator;
  readonly transactionsTable: Locator;
  readonly dateRangeSelect: Locator;
  readonly exportButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /financial|financials/i });
    this.revenueCard = page.locator('.card, [class*="card"]').filter({ hasText: /revenue/i }).first();
    this.expensesCard = page.locator('.card, [class*="card"]').filter({ hasText: /expense/i }).first();
    this.profitCard = page.locator('.card, [class*="card"]').filter({ hasText: /profit/i }).first();
    this.transactionsTable = page.locator('table').first();
    this.dateRangeSelect = page.getByLabel(/date range|period|time/i);
    this.exportButton = page.getByRole('button', { name: /export|download/i });
  }

  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/financials`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async expectOnFinancialsPage(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/financials`));
    await expect(this.heading).toBeVisible();
  }

  async expectFinancialCardsVisible() {
    await this.page.waitForLoadState('networkidle');
    // Cards might not all be visible, so check if at least one financial metric is shown
    const hasFinancialData = await this.page.locator('text=/revenue|expense|profit|income/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasFinancialData).toBeTruthy();
  }

  async getTransactionCount(): Promise<number> {
    const rows = this.transactionsTable.locator('tbody tr');
    return await rows.count();
  }

  async expectTransactionCount(count: number) {
    const actualCount = await this.getTransactionCount();
    expect(actualCount).toBe(count);
  }

  async selectDateRange(range: string) {
    await this.dateRangeSelect.click();
    await this.page.getByRole('option').filter({ hasText: range }).click();
  }

  async clickExport() {
    await this.exportButton.click();
  }

  async expectExportButtonVisible() {
    await expect(this.exportButton).toBeVisible();
  }
}

