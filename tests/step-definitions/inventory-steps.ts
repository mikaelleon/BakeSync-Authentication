// tests/step-definitions/inventory-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am logged in as a baker', async function (this: CustomWorld) {
  await this.page.goto('/login');
  await this.page.fill('[data-testid="email"]', 'baker@bakeshop.com');
  await this.page.fill('[data-testid="password"]', 'password123');
  await this.page.click('[data-testid="login-button"]');
  await expect(this.page).toHaveURL(/.*dashboard/);
});

When('I navigate to the inventory page', async function (this: CustomWorld) {
  await this.page.goto('/inventory');
  await expect(this.page).toHaveURL(/.*inventory/);
});

Then('I should see all inventory items', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="inventory-table"]')).toBeVisible();
});

Then('I should see current stock levels', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="stock-levels"]')).toBeVisible();
});

Then('I should see minimum stock thresholds', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="min-stock-thresholds"]')).toBeVisible();
});

When('I click {string} for an item', async function (this: CustomWorld, action: string) {
  await this.page.click(`[data-testid="${action.toLowerCase().replace(/\s+/g, '-')}-button"]`);
});

When('I enter new quantity {string}', async function (this: CustomWorld, quantity: string) {
  await this.page.fill('[data-testid="quantity-input"]', quantity);
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`);
});

Then('the stock level should be updated', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="stock-updated"]')).toBeVisible();
});

Then('I should see the new quantity', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="updated-quantity"]')).toBeVisible();
});

Given('I have an item with stock below minimum threshold', async function (this: CustomWorld) {
  // Setup test data with low stock item
  await this.page.goto('/inventory');
  // This would typically involve setting up test data
});

Then('I should see a low stock warning', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="low-stock-warning"]')).toBeVisible();
});

Then('I should receive a notification', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="notification"]')).toBeVisible();
});

When('I select category {string}', async function (this: CustomWorld, category: string) {
  await this.page.selectOption('[data-testid="category-filter"]', category);
});

Then('I should see only items in that category', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="filtered-items"]')).toBeVisible();
});

Then('the filter should be applied', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="filter-active"]')).toBeVisible();
});

When('I search for {string}', async function (this: CustomWorld, searchTerm: string) {
  await this.page.fill('[data-testid="search-input"]', searchTerm);
});

Then('I should see only items containing {string}', async function (this: CustomWorld, searchTerm: string) {
  await expect(this.page.locator(`[data-testid="search-results"]:has-text("${searchTerm}")`)).toBeVisible();
});

Then('the search results should be relevant', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="search-results"]')).toBeVisible();
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`);
});

When('I enter item name {string}', async function (this: CustomWorld, itemName: string) {
  await this.page.fill('[data-testid="item-name"]', itemName);
});

When('I select category {string}', async function (this: CustomWorld, category: string) {
  await this.page.selectOption('[data-testid="item-category"]', category);
});

When('I enter quantity {string}', async function (this: CustomWorld, quantity: string) {
  await this.page.fill('[data-testid="item-quantity"]', quantity);
});

When('I enter unit {string}', async function (this: CustomWorld, unit: string) {
  await this.page.selectOption('[data-testid="item-unit"]', unit);
});

Then('the item should be added to inventory', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="item-added"]')).toBeVisible();
});

Then('I should see it in the inventory list', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="inventory-list"]')).toBeVisible();
});
