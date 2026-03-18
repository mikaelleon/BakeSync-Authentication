// tests/pages/POSPage.ts
import { Page, Locator, expect } from '@playwright/test';

/**
 * Enhanced POS Page Object Model
 * Provides comprehensive methods for interacting with the Point of Sale interface
 */
export class POSPage {
  readonly page: Page;
  
  // Main elements
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly syncButton: Locator;
  
  // Product grid
  readonly productCards: Locator;
  readonly productGrid: Locator;
  readonly emptyProductsMessage: Locator;
  
  // Categories
  readonly categoryButtons: Locator;
  readonly allCategoryButton: Locator;
  
  // Cart section
  readonly cartSection: Locator;
  readonly cartTitle: Locator;
  readonly cartItemCount: Locator;
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;
  readonly cartSubtotal: Locator;
  readonly cartTax: Locator;
  readonly cartTotal: Locator;
  readonly clearCartButton: Locator;
  readonly checkoutButton: Locator;
  
  // Cart item controls
  readonly quantityDecreaseButton: (productId: string) => Locator;
  readonly quantityIncreaseButton: (productId: string) => Locator;
  readonly quantityDisplay: (productId: string) => Locator;
  readonly removeItemButton: (productId: string) => Locator;
  
  // Recent transactions
  readonly recentTransactionsSection: Locator;
  readonly recentTransactionsList: Locator;
  readonly emptyTransactionsMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main elements
    this.heading = page.getByRole('heading', { name: /point of sale/i });
    this.searchInput = page.getByPlaceholder(/search products/i);
    this.syncButton = page.getByRole('button', { name: /sync products/i });
    
    // Product grid
    this.productGrid = page.locator('[class*="grid"]').filter({ hasText: /₱/ }).first();
    this.productCards = page.locator('[role="button"]').filter({ has: page.locator('text=/₱/') });
    this.emptyProductsMessage = page.getByText(/no products available/i);
    
    // Categories
    this.categoryButtons = page.locator('button').filter({ hasText: /all|bread|pastry|cake|cookie|dessert|uncategorized/i });
    this.allCategoryButton = page.getByRole('button', { name: /^all$/i });
    
    // Cart section
    this.cartSection = page.locator('text=Current Order').locator('..').locator('..');
    this.cartTitle = page.getByText(/current order/i);
    this.cartItemCount = page.getByText(/\d+\s*item/i).first();
    this.cartItems = this.cartSection.locator('div').filter({ hasText: /₱/ }).filter({ hasNotText: /Total|Subtotal|Tax/ });
    this.emptyCartMessage = page.getByText(/cart is empty/i);
    this.cartSubtotal = page.getByText(/subtotal/i).locator('..').locator('span').last();
    this.cartTax = page.getByText(/^tax$/i).locator('..').locator('span').last();
    this.cartTotal = page.getByText(/^total$/i).locator('..').locator('span').last();
    this.clearCartButton = page.getByRole('button', { name: /clear/i });
    this.checkoutButton = page.getByRole('button', { name: /checkout/i });
    
    // Cart item controls (will be created dynamically)
    this.quantityDecreaseButton = (productId: string) => 
      page.locator(`[data-product-id="${productId}"]`).locator('button').filter({ has: page.locator('svg') }).first();
    this.quantityIncreaseButton = (productId: string) => 
      page.locator(`[data-product-id="${productId}"]`).locator('button').filter({ has: page.locator('svg') }).last();
    this.quantityDisplay = (productId: string) => 
      page.locator(`[data-product-id="${productId}"]`).locator('span').filter({ hasText: /\d+/ });
    this.removeItemButton = (productId: string) => 
      page.locator(`[data-product-id="${productId}"]`).locator('button').filter({ has: page.locator('svg[class*="trash"]') });
    
    // Recent transactions
    this.recentTransactionsSection = page.getByText(/recent transactions/i).locator('..').locator('..');
    this.recentTransactionsList = this.recentTransactionsSection.locator('div').filter({ hasText: /ORD-/ });
    this.emptyTransactionsMessage = page.getByText(/no transactions yet/i);
  }

  /**
   * Navigate to POS page
   */
  async goto(slug: string = 'demo') {
    await this.page.goto(`/${slug}/pos`);
    await this.waitForLoad();
  }

  /**
   * Wait for POS page to load
   */
  async waitForLoad() {
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
    // Wait a bit for products to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify we're on the POS page
   */
  async expectOnPOSPage(slug: string = 'demo') {
    await expect(this.page).toHaveURL(new RegExp(`.*/${slug}/pos`));
    await expect(this.heading).toBeVisible();
  }

  /**
   * Search for products
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for debounce
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Clear search
   */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click on a product card by name
   */
  async clickProduct(productName: string) {
    await this.page.waitForLoadState('networkidle');
    const product = this.productCards.filter({ hasText: new RegExp(productName, 'i') }).first();
    await expect(product).toBeVisible({ timeout: 10000 });
    await product.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click on the first available product
   */
  async clickFirstProduct() {
    await this.page.waitForLoadState('networkidle');
    const firstProduct = this.productCards.first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });
    await firstProduct.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Get product count
   */
  async getProductCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    return await this.productCards.count();
  }

  /**
   * Verify product count
   */
  async expectProductCount(count: number) {
    const actualCount = await this.getProductCount();
    expect(actualCount).toBe(count);
  }

  /**
   * Get product by name
   */
  async getProductByName(productName: string): Promise<Locator> {
    return this.productCards.filter({ hasText: new RegExp(productName, 'i') }).first();
  }

  /**
   * Get product stock badge
   */
  async getProductStock(productName: string): Promise<string> {
    const product = await this.getProductByName(productName);
    const badge = product.locator('[class*="badge"]');
    return await badge.textContent() || '0';
  }

  /**
   * Click category filter
   */
  async clickCategory(categoryName: string) {
    await this.page.waitForLoadState('networkidle');
    const category = this.categoryButtons.filter({ hasText: new RegExp(`^${categoryName}$`, 'i') }).first();
    await expect(category).toBeVisible({ timeout: 5000 });
    await category.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click sync products button
   */
  async clickSyncProducts() {
    await this.syncButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    const cartText = await this.cartItemCount.textContent().catch(() => '0 items');
    const match = cartText?.match(/(\d+)\s*item/i);
    if (match) return parseInt(match[1], 10);
    return await this.cartItems.count();
  }

  /**
   * Verify cart item count
   */
  async expectCartItemCount(count: number) {
    const actualCount = await this.getCartItemCount();
    expect(actualCount).toBe(count);
  }

  /**
   * Get cart total
   */
  async getCartTotal(): Promise<string> {
    return await this.cartTotal.textContent() || '₱0';
  }

  /**
   * Get cart subtotal
   */
  async getCartSubtotal(): Promise<string> {
    return await this.cartSubtotal.textContent() || '₱0';
  }

  /**
   * Increase quantity for a cart item
   */
  async increaseQuantity(productName: string) {
    const cartItem = this.cartItems.filter({ hasText: new RegExp(productName, 'i') }).first();
    await expect(cartItem).toBeVisible({ timeout: 5000 });
    // Find the plus button (last button with plus icon in the quantity controls)
    const buttons = cartItem.locator('button');
    const buttonCount = await buttons.count();
    // Plus button is typically the second to last button (before remove)
    const increaseButton = buttons.nth(buttonCount - 2);
    await increaseButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Decrease quantity for a cart item
   */
  async decreaseQuantity(productName: string) {
    const cartItem = this.cartItems.filter({ hasText: new RegExp(productName, 'i') }).first();
    await expect(cartItem).toBeVisible({ timeout: 5000 });
    // Find the minus button (first button with minus icon in the quantity controls)
    const buttons = cartItem.locator('button');
    const decreaseButton = buttons.first();
    await decreaseButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Remove item from cart
   */
  async removeItem(productName: string) {
    const cartItem = this.cartItems.filter({ hasText: new RegExp(productName, 'i') }).first();
    await expect(cartItem).toBeVisible({ timeout: 5000 });
    // Find the remove button (trash icon button)
    const buttons = cartItem.locator('button');
    const buttonCount = await buttons.count();
    // Remove button is typically the last button
    const removeButton = buttons.last();
    await removeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Clear cart
   */
  async clearCart() {
    await this.clearCartButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Click checkout button
   */
  async clickCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Verify checkout button is visible
   */
  async expectCheckoutButtonVisible() {
    await expect(this.checkoutButton).toBeVisible();
  }

  /**
   * Verify checkout button is disabled
   */
  async expectCheckoutButtonDisabled() {
    await expect(this.checkoutButton).toBeDisabled();
  }

  /**
   * Verify empty cart message
   */
  async expectEmptyCart() {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  /**
   * Verify empty products message
   */
  async expectEmptyProducts() {
    await expect(this.emptyProductsMessage).toBeVisible();
  }

  /**
   * Get recent transactions count
   */
  async getRecentTransactionsCount(): Promise<number> {
    return await this.recentTransactionsList.count();
  }

  /**
   * Verify transaction appears in recent transactions
   */
  async expectTransactionInList(orderNumber: string) {
    const transaction = this.recentTransactionsList.filter({ hasText: orderNumber });
    await expect(transaction).toBeVisible({ timeout: 5000 });
  }
}

/**
 * Checkout Dialog Page Object Model
 */
export class CheckoutDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly subtotalDisplay: Locator;
  readonly taxDisplay: Locator;
  readonly totalDisplay: Locator;
  readonly cashOption: Locator;
  readonly cardOption: Locator;
  readonly gcashOption: Locator;
  readonly amountPaidInput: Locator;
  readonly changeDisplay: Locator;
  readonly completeButton: Locator;
  readonly cancelButton: Locator;
  readonly errorToast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').filter({ hasText: /complete payment/i });
    this.dialogTitle = page.getByText(/complete payment/i);
    this.subtotalDisplay = this.dialog.locator('text=/subtotal/i').locator('..').locator('span').last();
    this.taxDisplay = this.dialog.locator('text=/^tax$/i').locator('..').locator('span').last();
    this.totalDisplay = this.dialog.locator('text=/^total$/i').locator('..').locator('span').last();
    this.cashOption = page.getByLabel(/cash/i);
    this.cardOption = page.getByLabel(/card/i);
    this.gcashOption = page.getByLabel(/gcash/i);
    this.amountPaidInput = page.getByLabel(/amount paid|amount/i);
    this.changeDisplay = page.locator('text=/change/i').locator('..').locator('span').last();
    this.completeButton = page.getByRole('button', { name: /complete payment|processing/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.errorToast = page.locator('[role="alert"]').filter({ hasText: /error|failed|invalid/i });
  }

  /**
   * Verify dialog is visible
   */
  async expectDialogVisible() {
    await expect(this.dialog).toBeVisible({ timeout: 5000 });
  }

  /**
   * Select payment method
   */
  async selectPaymentMethod(method: 'cash' | 'card' | 'gcash') {
    switch (method) {
      case 'cash':
        await this.cashOption.click();
        break;
      case 'card':
        await this.cardOption.click();
        break;
      case 'gcash':
        await this.gcashOption.click();
        break;
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill amount paid (for cash payments)
   */
  async fillAmountPaid(amount: string) {
    await this.amountPaidInput.fill(amount);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get change amount displayed
   */
  async getChangeAmount(): Promise<string> {
    return await this.changeDisplay.textContent() || '₱0';
  }

  /**
   * Get total amount
   */
  async getTotalAmount(): Promise<string> {
    return await this.totalDisplay.textContent() || '₱0';
  }

  /**
   * Click complete payment button
   */
  async clickComplete() {
    await this.completeButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify change is displayed
   */
  async expectChangeDisplayed(amount: string) {
    await expect(this.changeDisplay).toContainText(amount, { timeout: 2000 });
  }

  /**
   * Verify complete button is disabled
   */
  async expectCompleteButtonDisabled() {
    await expect(this.completeButton).toBeDisabled();
  }

  /**
   * Verify error toast is visible
   */
  async expectErrorToast(message?: string) {
    await expect(this.errorToast).toBeVisible({ timeout: 3000 });
    if (message) {
      await expect(this.errorToast).toContainText(message, { timeout: 1000 });
    }
  }
}

/**
 * Receipt Dialog Page Object Model
 */
export class ReceiptDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly orderNumber: Locator;
  readonly receiptItems: Locator;
  readonly receiptTotal: Locator;
  readonly paymentMethod: Locator;
  readonly amountPaid: Locator;
  readonly change: Locator;
  readonly closeButton: Locator;
  readonly printButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog').filter({ hasText: /receipt/i });
    this.dialogTitle = page.getByText(/receipt/i);
    this.orderNumber = this.dialog.locator('text=/order #|order number/i').locator('..').locator('span').last();
    this.receiptItems = this.dialog.locator('div').filter({ hasText: /x\s/ });
    this.receiptTotal = this.dialog.locator('text=/^total$/i').locator('..').locator('span').last();
    this.paymentMethod = this.dialog.locator('text=/payment method/i').locator('..').locator('[class*="badge"]');
    this.amountPaid = this.dialog.locator('text=/amount paid/i').locator('..').locator('span').last();
    this.change = this.dialog.locator('text=/change/i').locator('..').locator('span').last();
    this.closeButton = page.getByRole('button', { name: /close/i });
    this.printButton = page.getByRole('button', { name: /print receipt/i });
  }

  /**
   * Verify receipt dialog is visible
   */
  async expectDialogVisible(options?: { timeout?: number }) {
    await expect(this.dialog).toBeVisible({ timeout: options?.timeout ?? 5000 });
  }

  /**
   * Get order number from receipt
   */
  async getOrderNumber(): Promise<string> {
    return await this.orderNumber.textContent() || '';
  }

  /**
   * Verify order number
   */
  async expectOrderNumber(orderNumber: string) {
    await expect(this.orderNumber).toContainText(orderNumber);
  }

  /**
   * Get receipt total
   */
  async getTotal(): Promise<string> {
    return await this.receiptTotal.textContent() || '₱0';
  }

  /**
   * Click print button
   */
  async clickPrint() {
    await this.printButton.click();
  }

  /**
   * Click close button
   */
  async clickClose() {
    await this.closeButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify payment method
   */
  async expectPaymentMethod(method: string) {
    await expect(this.paymentMethod).toContainText(method, { ignoreCase: true });
  }
}
