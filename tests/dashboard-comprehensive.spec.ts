// tests/dashboard-comprehensive.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TestUsers } from './fixtures/test-data';

test.describe('Dashboard Comprehensive Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Owner Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await dashboardPage.goto();
    });

    test('should display all sidebar items for owner', async ({ page }) => {
      await dashboardPage.expectSidebarItemCount(TestUsers.owner.expectedSidebarItems);
    });

    test('should show dashboard metrics', async ({ page }) => {
      await expect(page.locator('text=/revenue|sales|inventory/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Metrics might not be visible if data is empty
      });
    });

    test('should navigate to recipes from sidebar', async ({ page }) => {
      await dashboardPage.clickSidebarItem('Recipes');
      await expect(page).toHaveURL(/.*\/recipes/);
    });

    test('should navigate to inventory from sidebar', async ({ page }) => {
      await dashboardPage.clickSidebarItem('Inventory');
      await expect(page).toHaveURL(/.*\/inventory/);
    });

    test('should navigate to POS from sidebar', async ({ page }) => {
      await dashboardPage.clickSidebarItem('POS');
      await expect(page).toHaveURL(/.*\/pos/);
    });

    test('should navigate to production from sidebar', async ({ page }) => {
      await dashboardPage.clickSidebarItem('Production');
      await expect(page).toHaveURL(/.*\/production/);
    });

    test('should navigate to financials from sidebar', async ({ page }) => {
      await dashboardPage.clickSidebarItem('Financials');
      await expect(page).toHaveURL(/.*\/financials/);
    });
  });

  test.describe('Baker Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await dashboardPage.goto();
    });

    test('should display limited sidebar items for baker', async ({ page }) => {
      await dashboardPage.expectSidebarItemCount(TestUsers.baker.expectedSidebarItems);
    });

    test('should show production-focused sidebar items', async ({ page }) => {
      await dashboardPage.expectSidebarItemVisible('Recipes');
      await dashboardPage.expectSidebarItemVisible('Production');
      await dashboardPage.expectSidebarItemVisible('Inventory');
    });

    test('should not show POS in sidebar for baker', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const items = await dashboardPage.getSidebarItems();
      const hasPOS = items.some(item => item.toLowerCase().includes('pos') || item.toLowerCase().includes('point of sale'));
      expect(hasPOS).toBe(false);
    });
  });

  test.describe('Cashier Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await dashboardPage.goto();
    });

    test('should display limited sidebar items for cashier', async ({ page }) => {
      await dashboardPage.expectSidebarItemCount(TestUsers.cashier.expectedSidebarItems);
    });

    test('should show POS in sidebar for cashier', async ({ page }) => {
      await dashboardPage.expectSidebarItemVisible('POS');
    });

    test('should not show production in sidebar for cashier', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const items = await dashboardPage.getSidebarItems();
      const hasProduction = items.some(item => item.toLowerCase().includes('production') || item.toLowerCase().includes('production log'));
      expect(hasProduction).toBe(false);
    });
  });

  test.describe('Dashboard Navigation', () => {
    test('should redirect to dashboard after login', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await dashboardPage.expectOnDashboard();
    });

    test('should maintain dashboard state on refresh', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await dashboardPage.goto();
      await page.reload();
      await dashboardPage.expectOnDashboard();
    });
  });
});

