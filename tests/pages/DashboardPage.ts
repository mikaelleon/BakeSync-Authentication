// tests/pages/DashboardPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly sidebarMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[role="complementary"]').first();
    this.sidebarMenuButton = page.locator('[role="menuitem"]');
  }

  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/dashboard`);
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.sidebar).toBeVisible({ timeout: 10000 });
  }

  async expectOnDashboard(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/dashboard`));
    await expect(this.sidebar).toBeVisible();
  }

  async getSidebarItems(): Promise<string[]> {
    await this.page.waitForLoadState('networkidle');
    const items = await this.sidebarMenuButton.allTextContents();
    return items.map(item => item.trim()).filter(item => item.length > 0);
  }

  async expectSidebarItemCount(count: number) {
    const items = await this.getSidebarItems();
    expect(items.length).toBe(count);
  }

  async clickSidebarItem(itemName: string) {
    await this.page.waitForLoadState('networkidle');
    const item = this.sidebarMenuButton.filter({ hasText: new RegExp(itemName, 'i') }).first();
    await expect(item).toBeVisible({ timeout: 5000 });
    await item.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectSidebarItemVisible(itemName: string) {
    await this.page.waitForLoadState('networkidle');
    await expect(
      this.sidebarMenuButton.filter({ hasText: new RegExp(itemName, 'i') }).first()
    ).toBeVisible({ timeout: 5000 });
  }
}

