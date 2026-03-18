// tests/step-definitions/dashboard-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am logged in', async function (this: CustomWorld) {
  // Navigate to login and perform login
  await this.page.goto('/login');
  await this.page.fill('[data-testid="email"]', 'test@bakery.com');
  await this.page.fill('[data-testid="password"]', 'password123');
  await this.page.click('[data-testid="login-button"]');
  await expect(this.page).toHaveURL(/.*dashboard/);
});

Given('I am on the dashboard', async function (this: CustomWorld) {
  await this.page.goto('/dashboard');
  await expect(this.page).toHaveURL(/.*dashboard/);
});

When('I visit the dashboard', async function (this: CustomWorld) {
  await this.page.goto('/dashboard');
});

When('I click on the inventory menu item', async function (this: CustomWorld) {
  await this.page.click('[data-testid="inventory-menu"]');
});

When('I click on the recipes menu item', async function (this: CustomWorld) {
  await this.page.click('[data-testid="recipes-menu"]');
});

When('I click on the production menu item', async function (this: CustomWorld) {
  await this.page.click('[data-testid="production-menu"]');
});

Then('I should see the main navigation menu', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="main-navigation"]')).toBeVisible();
});

Then('I should see business metrics', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="business-metrics"]')).toBeVisible();
});

Then('I should see recent activity', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="recent-activity"]')).toBeVisible();
});

Then('I should be redirected to the inventory page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*inventory/);
});

Then('I should see the inventory table', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="inventory-table"]')).toBeVisible();
});

Then('I should be redirected to the recipes page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*recipes/);
});

Then('I should see the recipes list', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="recipes-list"]')).toBeVisible();
});

Then('I should be redirected to the production page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*production/);
});

Then('I should see the production schedule', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="production-schedule"]')).toBeVisible();
});
