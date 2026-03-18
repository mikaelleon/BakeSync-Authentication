// tests/pages/ProductionPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class ProductionPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newBatchButton: Locator;
  readonly productionLogs: Locator;
  readonly recipeSelect: Locator;
  readonly quantityInput: Locator;
  readonly startButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /production/i });
    this.newBatchButton = page.getByRole('button', { name: /new batch|start production|create batch/i });
    this.productionLogs = page.locator('table tbody tr, [class*="production"]');
    this.recipeSelect = page.getByLabel(/recipe/i);
    this.quantityInput = page.getByLabel(/quantity/i);
    this.startButton = page.getByRole('button', { name: /start|create|save/i });
  }

  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/production`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async expectOnProductionPage(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/production`));
    await expect(this.heading).toBeVisible();
  }

  async clickNewBatch() {
    await this.newBatchButton.click();
  }

  async expectNewBatchButtonVisible() {
    await expect(this.newBatchButton).toBeVisible();
  }

  async getProductionLogCount(): Promise<number> {
    return await this.productionLogs.count();
  }

  async expectProductionLogCount(count: number) {
    const actualCount = await this.getProductionLogCount();
    expect(actualCount).toBe(count);
  }

  async selectRecipe(recipeName: string) {
    await this.recipeSelect.click();
    await this.page.getByRole('option').filter({ hasText: recipeName }).click();
  }

  async fillQuantity(quantity: string) {
    await this.quantityInput.fill(quantity);
  }

  async clickStart() {
    await this.startButton.click();
  }
}

