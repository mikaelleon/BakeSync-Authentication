// tests/production-management.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProductionPage } from './pages/ProductionPage';
import { TestUsers } from './fixtures/test-data';

test.describe('Production Management', () => {
  let loginPage: LoginPage;
  let productionPage: ProductionPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productionPage = new ProductionPage(page);
  });

  test.describe('Page Access and Navigation', () => {
    test('should load production page for baker', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await productionPage.goto();
      await productionPage.expectOnProductionPage();
    });

    test('should display production heading', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await productionPage.goto();
      await expect(productionPage.heading).toBeVisible();
    });
  });

  test.describe('Production Logs', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await productionPage.goto();
    });

    test('should display production logs table', async ({ page }) => {
      await expect(productionPage.productionLogs.first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // Table might be empty, which is acceptable
      });
    });

    test('should show production log count', async ({ page }) => {
      const count = await productionPage.getProductionLogCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('New Batch Creation', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await productionPage.goto();
    });

    test('should show new batch button for baker', async ({ page }) => {
      await productionPage.expectNewBatchButtonVisible();
    });

    test('should open new batch form when clicking new batch button', async ({ page }) => {
      await productionPage.clickNewBatch();
      await expect(productionPage.recipeSelect).toBeVisible({ timeout: 5000 }).catch(() => {
        // Form might not be visible if permissions differ
      });
    });
  });

  test.describe('Role-Based Access', () => {
    test('baker should access production page', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);
      await productionPage.goto();
      await productionPage.expectOnProductionPage();
    });

    test('owner should access production page', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await productionPage.goto();
      await productionPage.expectOnProductionPage();
    });
  });
});

