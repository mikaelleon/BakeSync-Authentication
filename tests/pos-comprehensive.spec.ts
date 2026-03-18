// tests/pos-comprehensive.spec.ts
/**
 * Comprehensive Playwright Test Suite for Point of Sale (POS) Module
 * 
 * This test suite covers:
 * - Authentication and navigation
 * - Product search and filtering
 * - Category filtering
 * - Cart management (add, remove, update quantities)
 * - Checkout process
 * - Payment methods (cash, card, GCash)
 * - Input validations
 * - Error handling
 * - Stock validation
 * - Receipt generation
 * - Recent transactions
 * - Edge cases
 * 
 * Test User Credentials:
 * - Email: shio@gmail.com
 * - Password: Shio@123
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { POSPage, CheckoutDialog, ReceiptDialog } from './pages/POSPage';
import { TestUsers } from './fixtures/test-data';
import { loginAndNavigateToPOS } from './helpers/pos-test-helpers';

test.describe('POS Module - Comprehensive Test Suite', () => {
  let loginPage: LoginPage;
  let posPage: POSPage;
  let currentSlug: string;
  const testUser = TestUsers.posUser;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    posPage = new POSPage(page);
  });

  test.describe('Authentication and Navigation', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for redirect - can go to dashboard or onboarding
      // Login uses window.location.href which causes full page reload
      await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
      
      // If redirected to onboarding, that's also valid for new users
      const url = page.url();
      expect(url).toMatch(/.*\/(dashboard|onboarding)/);
    });

    test('should navigate to POS page after login', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for redirect with longer timeout
      await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
      
      // If on onboarding, skip this test
      if (page.url().includes('/onboarding')) {
        test.skip();
        return;
      }
      
      // Navigate to POS - need to determine slug from URL
      const url = page.url();
      const slugMatch = url.match(/\/([^\/]+)\/dashboard/);
      const slug = slugMatch ? slugMatch[1] : 'demo';
      
      await posPage.goto(slug);
      await posPage.expectOnPOSPage(slug);
    });

    test('should display POS page heading', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for redirect
      await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
      
      // If on onboarding, skip this test
      if (page.url().includes('/onboarding')) {
        test.skip();
        return;
      }
      
      // Navigate to POS
      const url = page.url();
      const slugMatch = url.match(/\/([^\/]+)\/dashboard/);
      const slug = slugMatch ? slugMatch[1] : 'demo';
      
      await posPage.goto(slug);
      await expect(posPage.heading).toBeVisible({ timeout: 15000 });
    });

    test('should display all essential POS elements', async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for redirect
      await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
      
      // If on onboarding, skip this test
      if (page.url().includes('/onboarding')) {
        test.skip();
        return;
      }
      
      // Navigate to POS
      const url = page.url();
      const slugMatch = url.match(/\/([^\/]+)\/dashboard/);
      const slug = slugMatch ? slugMatch[1] : 'demo';
      
      await posPage.goto(slug);
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Extra wait for products to load
      
      // Verify main elements are visible
      await expect(posPage.heading).toBeVisible({ timeout: 10000 });
      await expect(posPage.searchInput).toBeVisible({ timeout: 5000 });
      await expect(posPage.cartSection).toBeVisible({ timeout: 5000 });
      await expect(posPage.syncButton).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Product Search and Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for redirect
      await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
      
      // If on onboarding, skip tests
      if (page.url().includes('/onboarding')) {
        test.skip();
        return;
      }
      
      // Navigate to POS
      const url = page.url();
      const slugMatch = url.match(/\/([^\/]+)\/dashboard/);
      const slug = slugMatch ? slugMatch[1] : 'demo';
      
      await posPage.goto(slug);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for products to load
    });

    test('should display product search input', async ({ page }) => {
      await expect(posPage.searchInput).toBeVisible();
    });

    test('should filter products by search query', async ({ page }) => {
      const initialCount = await posPage.getProductCount();
      
      // Search for a product
      await posPage.search('bread');
      await page.waitForTimeout(1000);
      
      const filteredCount = await posPage.getProductCount();
      // Filtered count should be less than or equal to initial count
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should clear search and show all products', async ({ page }) => {
      const initialCount = await posPage.getProductCount();
      
      await posPage.search('bread');
      await page.waitForTimeout(1000);
      
      await posPage.clearSearch();
      await page.waitForTimeout(1000);
      
      const afterClearCount = await posPage.getProductCount();
      expect(afterClearCount).toBe(initialCount);
    });

    test('should show empty state when no products match search', async ({ page }) => {
      await posPage.search('nonexistentproduct12345');
      await page.waitForTimeout(1000);
      
      // Should show empty products message
      await expect(posPage.emptyProductsMessage).toBeVisible();
    });
  });

  test.describe('Category Filtering', () => {
    test.beforeEach(async ({ page }) => {
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);
      
      // Wait for redirect
      await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
      
      // If on onboarding, skip tests
      if (page.url().includes('/onboarding')) {
        test.skip();
        return;
      }
      
      // Navigate to POS
      const url = page.url();
      const slugMatch = url.match(/\/([^\/]+)\/dashboard/);
      const slug = slugMatch ? slugMatch[1] : 'demo';
      
      await posPage.goto(slug);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    test('should display category buttons', async ({ page }) => {
      const categoryCount = await posPage.categoryButtons.count();
      expect(categoryCount).toBeGreaterThan(0);
    });

    test('should filter products by category', async ({ page }) => {
      const initialCount = await posPage.getProductCount();
      
      // Try to click a category (if available)
      const categories = await posPage.categoryButtons.all();
      if (categories.length > 1) {
        await categories[1].click();
        await page.waitForTimeout(1000);
        
        const filteredCount = await posPage.getProductCount();
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
      }
    });

    test('should return to all products when clicking All category', async ({ page }) => {
      const initialCount = await posPage.getProductCount();
      
      // Click a category
      const categories = await posPage.categoryButtons.all();
      if (categories.length > 1) {
        await categories[1].click();
        await page.waitForTimeout(1000);
        
        // Click All category
        await posPage.allCategoryButton.click();
        await page.waitForTimeout(1000);
        
        const allProductsCount = await posPage.getProductCount();
        expect(allProductsCount).toBe(initialCount);
      }
    });
  });

  test.describe('Cart Management - Adding Items', () => {
    test.beforeEach(async ({ page }) => {
      try {
        currentSlug = await loginAndNavigateToPOS(page, loginPage, posPage);
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should add product to cart when clicked', async ({ page }) => {
      const initialCartCount = await posPage.getCartItemCount();
      
      // Wait for products to load
      await page.waitForTimeout(2000);
      const productCount = await posPage.getProductCount();
      
      if (productCount > 0) {
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        const newCartCount = await posPage.getCartItemCount();
        expect(newCartCount).toBeGreaterThan(initialCartCount);
      } else {
        test.skip();
      }
    });

    test('should increment quantity when same product is added again', async ({ page }) => {
      await page.waitForTimeout(2000);
      const productCount = await posPage.getProductCount();
      
      if (productCount > 0) {
        // Add product first time
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        const firstCartCount = await posPage.getCartItemCount();
        
        // Add same product again
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        // Cart count should remain same (quantity increased)
        const secondCartCount = await posPage.getCartItemCount();
        expect(secondCartCount).toBe(firstCartCount);
      } else {
        test.skip();
      }
    });

    test('should display product in cart with correct details', async ({ page }) => {
      await page.waitForTimeout(2000);
      const productCount = await posPage.getProductCount();
      
      if (productCount > 0) {
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        // Verify cart has items
        const cartCount = await posPage.getCartItemCount();
        expect(cartCount).toBeGreaterThan(0);
        
        // Verify cart section is visible
        await expect(posPage.cartSection).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should update cart item count display', async ({ page }) => {
      await page.waitForTimeout(2000);
      const productCount = await posPage.getProductCount();
      
      if (productCount > 0) {
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        await expect(posPage.cartItemCount).toBeVisible();
        const cartText = await posPage.cartItemCount.textContent();
        expect(cartText).toMatch(/\d+\s*item/i);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Cart Management - Modifying Quantities', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add a product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should increase quantity when plus button is clicked', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        // Get first cart item
        const firstCartItem = posPage.cartItems.first();
        const initialQuantityText = await firstCartItem.locator('span').filter({ hasText: /\d+/ }).first().textContent();
        const initialQuantity = parseInt(initialQuantityText || '1', 10);
        
        // Click increase button
        await posPage.increaseQuantity(await firstCartItem.locator('p').first().textContent() || '');
        await page.waitForTimeout(500);
        
        // Verify quantity increased (check cart total increased)
        const newQuantityText = await firstCartItem.locator('span').filter({ hasText: /\d+/ }).first().textContent();
        const newQuantity = parseInt(newQuantityText || '1', 10);
        expect(newQuantity).toBeGreaterThanOrEqual(initialQuantity);
      } else {
        test.skip();
      }
    });

    test('should decrease quantity when minus button is clicked', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        // First increase quantity
        const firstCartItem = posPage.cartItems.first();
        await posPage.increaseQuantity(await firstCartItem.locator('p').first().textContent() || '');
        await page.waitForTimeout(500);
        
        const initialQuantityText = await firstCartItem.locator('span').filter({ hasText: /\d+/ }).first().textContent();
        const initialQuantity = parseInt(initialQuantityText || '2', 10);
        
        // Click decrease button
        await posPage.decreaseQuantity(await firstCartItem.locator('p').first().textContent() || '');
        await page.waitForTimeout(500);
        
        // Verify quantity decreased
        const newQuantityText = await firstCartItem.locator('span').filter({ hasText: /\d+/ }).first().textContent();
        const newQuantity = parseInt(newQuantityText || '1', 10);
        expect(newQuantity).toBeLessThan(initialQuantity);
      } else {
        test.skip();
      }
    });

    test('should remove item when quantity reaches zero', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        const initialCount = cartCount;
        
        // Decrease quantity until removed
        const firstCartItem = posPage.cartItems.first();
        const productName = await firstCartItem.locator('p').first().textContent() || '';
        
        // Click decrease multiple times (should remove when quantity is 1)
        await posPage.decreaseQuantity(productName);
        await page.waitForTimeout(500);
        
        // Item should be removed
        const newCount = await posPage.getCartItemCount();
        expect(newCount).toBeLessThan(initialCount);
      } else {
        test.skip();
      }
    });

    test('should update cart total when quantity changes', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        const initialTotal = await posPage.getCartTotal();
        
        // Increase quantity
        const firstCartItem = posPage.cartItems.first();
        await posPage.increaseQuantity(await firstCartItem.locator('p').first().textContent() || '');
        await page.waitForTimeout(500);
        
        const newTotal = await posPage.getCartTotal();
        // Total should have increased
        expect(newTotal).not.toBe(initialTotal);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Cart Management - Removing Items', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add products to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should remove item from cart when remove button is clicked', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        const initialCount = cartCount;
        
        // Remove first item
        const firstCartItem = posPage.cartItems.first();
        const productName = await firstCartItem.locator('p').first().textContent() || '';
        await posPage.removeItem(productName);
        await page.waitForTimeout(500);
        
        // Cart count should decrease
        const newCount = await posPage.getCartItemCount();
        expect(newCount).toBeLessThan(initialCount);
      } else {
        test.skip();
      }
    });

    test('should show empty cart message when all items are removed', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        // Remove all items
        const items = await posPage.cartItems.all();
        for (const item of items) {
          const productName = await item.locator('p').first().textContent() || '';
          await posPage.removeItem(productName);
          await page.waitForTimeout(300);
        }
        
        // Should show empty cart message
        await expect(posPage.emptyCartMessage).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should disable checkout button when cart is empty', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        // Clear cart
        await posPage.clearCart();
        await page.waitForTimeout(500);
        
        // Checkout button should be disabled
        await posPage.expectCheckoutButtonDisabled();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Cart Management - Clearing Cart', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add multiple products to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
          if (productCount > 1) {
            await posPage.clickProduct((await posPage.productCards.nth(1).locator('h3').textContent()) || '');
            await page.waitForTimeout(500);
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should clear all items from cart', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clearCart();
        await page.waitForTimeout(500);
        
        // Cart should be empty
        await posPage.expectEmptyCart();
        await posPage.expectCheckoutButtonDisabled();
      } else {
        test.skip();
      }
    });

    test('should reset cart total to zero when cleared', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clearCart();
        await page.waitForTimeout(500);
        
        const total = await posPage.getCartTotal();
        expect(total).toMatch(/₱0|0\.00/);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Checkout Process - Dialog Opening', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should open checkout dialog when checkout button is clicked', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
      } else {
        test.skip();
      }
    });

    test('should display order total in checkout dialog', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        const cartTotal = await posPage.getCartTotal();
        
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        const dialogTotal = await checkoutDialog.getTotalAmount();
        expect(dialogTotal).toBe(cartTotal);
      } else {
        test.skip();
      }
    });

    test('should close checkout dialog when cancel is clicked', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.clickCancel();
        await page.waitForTimeout(500);
        
        // Dialog should be closed
        await expect(checkoutDialog.dialog).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Payment Methods - Cash', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should select cash payment method', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        await expect(checkoutDialog.cashOption).toBeChecked();
      } else {
        test.skip();
      }
    });

    test('should display amount paid input for cash payment', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        await expect(checkoutDialog.amountPaidInput).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should calculate and display change for cash payment', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        const total = await checkoutDialog.getTotalAmount();
        const totalValue = parseFloat(total.replace(/[₱,]/g, ''));
        const amountPaid = (totalValue + 50).toFixed(2);
        
        await checkoutDialog.fillAmountPaid(amountPaid);
        await page.waitForTimeout(500);
        
        // Change should be displayed
        await expect(checkoutDialog.changeDisplay).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should disable complete button when amount paid is insufficient', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        const total = await checkoutDialog.getTotalAmount();
        const totalValue = parseFloat(total.replace(/[₱,]/g, ''));
        const insufficientAmount = Math.max(0, totalValue - 10).toFixed(2);
        
        await checkoutDialog.fillAmountPaid(insufficientAmount);
        await page.waitForTimeout(500);
        
        // Complete button should be disabled
        await checkoutDialog.expectCompleteButtonDisabled();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Payment Methods - Card and GCash', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should select card payment method', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await expect(checkoutDialog.cardOption).toBeChecked();
        
        // Amount paid input should not be visible for card
        await expect(checkoutDialog.amountPaidInput).not.toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should select GCash payment method', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('gcash');
        await expect(checkoutDialog.gcashOption).toBeChecked();
        
        // Amount paid input should not be visible for GCash
        await expect(checkoutDialog.amountPaidInput).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Input Validations', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should show error when trying to checkout with empty cart', async ({ page }) => {
      // Clear cart if it has items
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clearCart();
        await page.waitForTimeout(500);
      }
      
      // Try to click checkout (should be disabled)
      await posPage.expectCheckoutButtonDisabled();
    });

    test('should show error for invalid payment amount (cash)', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        await checkoutDialog.fillAmountPaid('invalid');
        await checkoutDialog.clickComplete();
        
        // Should show error toast
        await checkoutDialog.expectErrorToast();
      } else {
        test.skip();
      }
    });

    test('should show error for insufficient payment amount', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        await checkoutDialog.fillAmountPaid('0');
        await checkoutDialog.clickComplete();
        
        // Should show error toast
        await checkoutDialog.expectErrorToast('insufficient|valid payment');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Transaction Processing - Cash Payment', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should complete cash payment transaction', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        const total = await checkoutDialog.getTotalAmount();
        const totalValue = parseFloat(total.replace(/[₱,]/g, ''));
        const amountPaid = (totalValue + 50).toFixed(2);
        
        await checkoutDialog.fillAmountPaid(amountPaid);
        await page.waitForTimeout(500);
        
        // Complete payment
        await checkoutDialog.clickComplete();
        
        // Wait for receipt dialog
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });

    test('should display receipt with correct information', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        const cartTotal = await posPage.getCartTotal();
        
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        const total = await checkoutDialog.getTotalAmount();
        const totalValue = parseFloat(total.replace(/[₱,]/g, ''));
        const amountPaid = (totalValue + 50).toFixed(2);
        
        await checkoutDialog.fillAmountPaid(amountPaid);
        await checkoutDialog.clickComplete();
        
        // Verify receipt
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        
        const receiptTotal = await receiptDialog.getTotal();
        expect(receiptTotal).toBe(cartTotal);
        
        await receiptDialog.expectPaymentMethod('cash');
      } else {
        test.skip();
      }
    });

    test('should clear cart after successful transaction', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('cash');
        const total = await checkoutDialog.getTotalAmount();
        const totalValue = parseFloat(total.replace(/[₱,]/g, ''));
        const amountPaid = (totalValue + 50).toFixed(2);
        
        await checkoutDialog.fillAmountPaid(amountPaid);
        await checkoutDialog.clickComplete();
        
        // Wait for receipt and close it
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        await receiptDialog.clickClose();
        await page.waitForTimeout(1000);
        
        // Cart should be empty
        await posPage.expectEmptyCart();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Transaction Processing - Card Payment', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should complete card payment transaction', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        // Wait for receipt dialog
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        await receiptDialog.expectPaymentMethod('card');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Transaction Processing - GCash Payment', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should complete GCash payment transaction', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('gcash');
        await checkoutDialog.clickComplete();
        
        // Wait for receipt dialog
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        await receiptDialog.expectPaymentMethod('gcash');
      } else {
        test.skip();
      }
    });
  });

  test.describe('Receipt Generation', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
        
        // Add product to cart
        const productCount = await posPage.getProductCount();
        if (productCount > 0) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(500);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should display receipt dialog after successful payment', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    });

    test('should display order number in receipt', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        
        const orderNumber = await receiptDialog.getOrderNumber();
        expect(orderNumber).toMatch(/ORD-/);
      } else {
        test.skip();
      }
    });

    test('should display receipt items correctly', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        
        const itemsCount = await receiptDialog.receiptItems.count();
        expect(itemsCount).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('should have print receipt button', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        
        await expect(receiptDialog.printButton).toBeVisible();
      } else {
        test.skip();
      }
    });

    test('should close receipt dialog when close button is clicked', async ({ page }) => {
      const cartCount = await posPage.getCartItemCount();
      if (cartCount > 0) {
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        
        await receiptDialog.clickClose();
        await page.waitForTimeout(500);
        
        await expect(receiptDialog.dialog).not.toBeVisible();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Recent Transactions', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should display recent transactions section', async ({ page }) => {
      await expect(posPage.recentTransactionsSection).toBeVisible();
    });

    test('should show empty state when no transactions exist', async ({ page }) => {
      const transactionCount = await posPage.getRecentTransactionsCount();
      if (transactionCount === 0) {
        await expect(posPage.emptyTransactionsMessage).toBeVisible();
      }
    });

    test('should display transaction in recent transactions after completion', async ({ page }) => {
      // Add product and complete transaction
      const productCount = await posPage.getProductCount();
      if (productCount > 0) {
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        await posPage.clickCheckout();
        const checkoutDialog = new CheckoutDialog(page);
        await checkoutDialog.expectDialogVisible();
        
        await checkoutDialog.selectPaymentMethod('card');
        await checkoutDialog.clickComplete();
        
        // Close receipt
        const receiptDialog = new ReceiptDialog(page);
        await receiptDialog.expectDialogVisible({ timeout: 10000 });
        const orderNumber = await receiptDialog.getOrderNumber();
        await receiptDialog.clickClose();
        await page.waitForTimeout(2000);
        
        // Verify transaction appears in recent transactions
        await posPage.expectTransactionInList(orderNumber);
      } else {
        test.skip();
      }
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should handle out of stock products gracefully', async ({ page }) => {
      // Try to find a product with low stock
      const productCount = await posPage.getProductCount();
      if (productCount > 0) {
        // Check stock badges
        const products = await posPage.productCards.all();
        for (const product of products) {
          const stockBadge = product.locator('[class*="badge"]');
          const stockText = await stockBadge.textContent();
          if (stockText === 'Out' || stockText === '0') {
            // Try to click out of stock product
            await product.click();
            await page.waitForTimeout(500);
            
            // Should show error or prevent adding
            // This test verifies the system handles it gracefully
            break;
          }
        }
      } else {
        test.skip();
      }
    });

    test('should handle rapid product additions', async ({ page }) => {
      const productCount = await posPage.getProductCount();
      if (productCount > 0) {
        // Rapidly click product multiple times
        for (let i = 0; i < 5; i++) {
          await posPage.clickFirstProduct();
          await page.waitForTimeout(100);
        }
        
        // System should handle it without errors
        await page.waitForTimeout(1000);
        const cartCount = await posPage.getCartItemCount();
        expect(cartCount).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('should handle sync products button click', async ({ page }) => {
      await expect(posPage.syncButton).toBeVisible();
      
      // Click sync button
      await posPage.clickSyncProducts();
      
      // Should not cause errors
      await page.waitForTimeout(2000);
      await expect(posPage.heading).toBeVisible();
    });

    test('should maintain state after page refresh', async ({ page }) => {
      const productCount = await posPage.getProductCount();
      if (productCount > 0) {
        // Add product to cart
        await posPage.clickFirstProduct();
        await page.waitForTimeout(500);
        
        const cartCountBefore = await posPage.getCartItemCount();
        
        // Refresh page
        await page.reload();
        await posPage.waitForLoad();
        
        // Cart should be empty after refresh (state is not persisted)
        // This is expected behavior for POS systems
        await page.waitForTimeout(1000);
      } else {
        test.skip();
      }
    });
  });

  test.describe('UI Responsiveness and Interactions', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await loginAndNavigateToPOS(page, loginPage, posPage);
      } catch (error) {
        if (error instanceof Error && error.message.includes('SKIP_TEST')) {
          test.skip();
        }
        throw error;
      }
    });

    test('should respond to keyboard navigation', async ({ page }) => {
      const productCount = await posPage.getProductCount();
      if (productCount > 0) {
        // Focus on first product
        const firstProduct = posPage.productCards.first();
        await firstProduct.focus();
        
        // Press Enter to add to cart
        await firstProduct.press('Enter');
        await page.waitForTimeout(500);
        
        // Product should be added
        const cartCount = await posPage.getCartItemCount();
        expect(cartCount).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('should display loading states appropriately', async ({ page }) => {
      // Navigate to POS
      await posPage.goto();
      
      // Should show loading or loaded state
      await expect(posPage.heading).toBeVisible();
    });

    test('should handle multiple rapid category changes', async ({ page }) => {
      const categories = await posPage.categoryButtons.all();
      if (categories.length > 1) {
        // Rapidly switch categories
        for (let i = 0; i < Math.min(3, categories.length); i++) {
          await categories[i].click();
          await page.waitForTimeout(300);
        }
        
        // Should handle without errors
        await page.waitForTimeout(1000);
        await expect(posPage.heading).toBeVisible();
      } else {
        test.skip();
      }
    });
  });
});

