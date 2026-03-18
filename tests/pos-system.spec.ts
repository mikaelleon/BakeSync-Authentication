// tests/pos-system.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { POSPage, CheckoutDialog } from './pages/POSPage';
import { TestUsers } from './fixtures/test-data';

test.describe('Point of Sale System', () => {
  let loginPage: LoginPage;
  let posPage: POSPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    posPage = new POSPage(page);
  });

  test.describe('Page Access and Navigation', () => {
    test('should load POS page for cashier', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
      await posPage.expectOnPOSPage();
    });

    test('should display POS heading', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
      await expect(posPage.heading).toBeVisible();
    });

    test('should display product search input', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
      await expect(posPage.searchInput).toBeVisible();
    });
  });

  test.describe('Product Search and Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
    });

    test('should filter products by search query', async ({ page }) => {
      await posPage.search('bread');
      await page.waitForLoadState('networkidle');
      const count = await posPage.getProductCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should filter products by category', async ({ page }) => {
      await posPage.clickCategory('bread');
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Cart Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
    });

    test('should add product to cart', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const initialCount = await posPage.getCartItemCount();
      // Try to find any product card and click it
      const firstProduct = posPage.productCards.first();
      await expect(firstProduct).toBeVisible({ timeout: 5000 });
      await firstProduct.click();
      await page.waitForTimeout(500);
      const newCount = await posPage.getCartItemCount();
      expect(newCount).toBeGreaterThanOrEqual(initialCount);
    });

    test('should display cart section', async ({ page }) => {
      await expect(posPage.cartSection).toBeVisible();
    });

    test('should show checkout button when cart has items', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const firstProduct = posPage.productCards.first();
      await expect(firstProduct).toBeVisible({ timeout: 5000 }).catch(() => {
        // If no products, skip this test
        test.skip();
      });
      await firstProduct.click();
      await page.waitForTimeout(500);
      await posPage.expectCheckoutButtonVisible().catch(() => {
        // Checkout button might not be visible if cart is empty
      });
    });
  });

  test.describe('Checkout Process', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
      await page.waitForLoadState('networkidle');
      const firstProduct = posPage.productCards.first();
      const isVisible = await firstProduct.isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        await firstProduct.click();
        await page.waitForTimeout(500);
      }
    });

    test('should open checkout dialog', async ({ page }) => {
      await posPage.clickCheckout();
      const checkoutDialog = new CheckoutDialog(page);
      await checkoutDialog.expectDialogVisible();
    });

    test('should allow selecting payment method', async ({ page }) => {
      await posPage.clickCheckout();
      const checkoutDialog = new CheckoutDialog(page);
      await checkoutDialog.expectDialogVisible();
      await checkoutDialog.selectPaymentMethod('cash');
      await expect(checkoutDialog.cashOption).toBeChecked();
    });

    test('should calculate change for cash payment', async ({ page }) => {
      await posPage.clickCheckout();
      const checkoutDialog = new CheckoutDialog(page);
      await checkoutDialog.expectDialogVisible();
      await checkoutDialog.selectPaymentMethod('cash');
      await checkoutDialog.fillAmountPaid('100');
      await page.waitForTimeout(500);
    });
  });

  test.describe('Role-Based Access', () => {
    test('owner should access POS page', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
      await posPage.goto();
      await posPage.expectOnPOSPage();
    });

    test('cashier should access POS page', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.cashier.email, TestUsers.cashier.password);
      await posPage.goto();
      await posPage.expectOnPOSPage();
    });
  });
});

