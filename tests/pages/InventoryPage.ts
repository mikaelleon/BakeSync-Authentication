// tests/pages/InventoryPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addItemButton: Locator;
  readonly inventoryTable: Locator;
  readonly tabs: Locator;
  readonly allTab: Locator;
  readonly rawTab: Locator;
  readonly finishedTab: Locator;
  readonly statsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Inventory' });
    this.searchInput = page.getByPlaceholder('Search inventory...');
    this.addItemButton = page.getByRole('button', { name: /add item/i });
    this.inventoryTable = page.locator('table');
    this.tabs = page.locator('[role="tablist"]');
    this.allTab = page.getByRole('tab', { name: /all items/i });
    this.rawTab = page.getByRole('tab', { name: /raw materials/i });
    this.finishedTab = page.getByRole('tab', { name: /finished goods/i });
    this.statsCards = page.locator('.card').filter({ hasText: /low stock|critical|expiring/i });
  }

  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/inventory`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 10000 });
  }

  async expectOnInventoryPage(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/inventory`));
    await expect(this.heading).toBeVisible();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  async clickAddItem() {
    await this.addItemButton.click();
  }

  async expectAddItemButtonVisible() {
    await expect(this.addItemButton).toBeVisible();
  }

  async expectAddItemButtonNotVisible() {
    await expect(this.addItemButton).not.toBeVisible();
  }

  async clickTab(tabName: 'all' | 'raw' | 'finished') {
    await this.page.waitForLoadState('networkidle');
    switch (tabName) {
      case 'all':
        await this.allTab.click();
        break;
      case 'raw':
        await this.rawTab.click();
        break;
      case 'finished':
        await this.finishedTab.click();
        break;
    }
    await this.page.waitForLoadState('networkidle');
  }

  async getInventoryItemCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    const table = this.inventoryTable.first();
    if (await table.count() === 0) return 0;
    const rows = table.locator('tbody tr');
    return await rows.count();
  }

  async expectInventoryItemCount(count: number) {
    const actualCount = await this.getInventoryItemCount();
    expect(actualCount).toBe(count);
  }

  async expectStatsCardsVisible() {
    await expect(this.statsCards.first()).toBeVisible();
  }
}

export class AddInventoryItemDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly quantityInput: Locator;
  readonly unitInput: Locator;
  readonly minStockInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.nameInput = page.getByLabel(/name/i);
    this.typeSelect = page.getByLabel(/type/i);
    this.quantityInput = page.getByLabel(/quantity/i);
    this.unitInput = page.getByLabel(/unit/i);
    this.minStockInput = page.getByLabel(/min.*stock/i);
    this.saveButton = page.getByRole('button', { name: /save|add/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
  }

  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible();
  }

  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  async selectType(type: 'raw' | 'finished') {
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).click();
  }

  async fillQuantity(quantity: string) {
    await this.quantityInput.fill(quantity);
  }

  async fillUnit(unit: string) {
    await this.unitInput.fill(unit);
  }

  async fillMinStock(minStock: string) {
    await this.minStockInput.fill(minStock);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async clickCancel() {
    await this.cancelButton.click();
  }
}

