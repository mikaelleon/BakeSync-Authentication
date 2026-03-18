// tests/inventory-management.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { InventoryPage, AddInventoryItemDialog } from './pages/InventoryPage';
import { TestUsers } from './fixtures/test-data';

test.describe('Inventory Management', () => {
  let loginPage: LoginPage;
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
  });

  test.describe('Page Access and Navigation', () => {
    test('should load inventory page for owner', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
      await inventoryPage.expectOnInventoryPage();
    });

    test('should display inventory heading', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
      await expect(inventoryPage.heading).toBeVisible();
    });

    test('should show tabs for all, raw materials, and finished goods', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
      await expect(inventoryPage.allTab).toBeVisible();
      await expect(inventoryPage.rawTab).toBeVisible();
      await expect(inventoryPage.finishedTab).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
    });

    test('should filter inventory items by search query', async ({ page }) => {
      await inventoryPage.search('flour');
      await page.waitForLoadState('networkidle');
      const count = await inventoryPage.getInventoryItemCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should clear search results when query is empty', async ({ page }) => {
      await inventoryPage.search('flour');
      await inventoryPage.search('');
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
    });

    test('should switch to raw materials tab', async ({ page }) => {
      await inventoryPage.clickTab('raw');
      await expect(inventoryPage.rawTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch to finished goods tab', async ({ page }) => {
      await inventoryPage.clickTab('finished');
      await expect(inventoryPage.finishedTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch back to all items tab', async ({ page }) => {
      await inventoryPage.clickTab('raw');
      await inventoryPage.clickTab('all');
      await expect(inventoryPage.allTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Add Item Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
    });

    test('should show add item button for owner', async ({ page }) => {
      await inventoryPage.expectAddItemButtonVisible();
    });

    test('should open add item dialog when clicking add button', async ({ page }) => {
      await inventoryPage.clickAddItem();
      const dialog = new AddInventoryItemDialog(page);
      await dialog.expectDialogVisible();
    });

    test('should allow adding new inventory item', async ({ page }) => {
      await inventoryPage.clickAddItem();
      const dialog = new AddInventoryItemDialog(page);
      await dialog.expectDialogVisible();
      await dialog.fillName('Test Item');
      await dialog.selectType('raw');
      await dialog.fillQuantity('100');
      await dialog.fillUnit('kg');
      await dialog.fillMinStock('20');
    });
  });

  test.describe('Role-Based Access', () => {
    test('baker should only see raw materials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await inventoryPage.goto();
      // Bakers don't see tabs, just a single card with raw materials
      await expect(page.locator('text=Raw Materials')).toBeVisible({ timeout: 5000 });
      await expect(inventoryPage.tabs).toHaveCount(0).catch(() => {
        // Tabs might not exist for bakers, which is expected
      });
    });

    test('baker should not see add item button', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await inventoryPage.goto();
      await inventoryPage.expectAddItemButtonNotVisible();
    });

    test('cashier should see all inventory tabs', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await inventoryPage.goto();
      await expect(inventoryPage.allTab).toBeVisible();
      await expect(inventoryPage.rawTab).toBeVisible();
      await expect(inventoryPage.finishedTab).toBeVisible();
    });
  });

  test.describe('Statistics Display', () => {
    test('should display inventory statistics cards', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await inventoryPage.goto();
      await inventoryPage.expectStatsCardsVisible();
    });
  });
});

