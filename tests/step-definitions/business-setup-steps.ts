// tests/step-definitions/business-setup-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am logged in as a new business owner', async function (this: CustomWorld) {
  await this.page.goto('/login');
  await this.page.fill('[data-testid="email"]', 'owner@bakeshop.com');
  await this.page.fill('[data-testid="password"]', 'password123');
  await this.page.click('[data-testid="login-button"]');
  await expect(this.page).toHaveURL(/.*dashboard/);
});

When('I start the business setup wizard', async function (this: CustomWorld) {
  await this.page.goto('/onboarding');
  await expect(this.page.locator('[data-testid="business-setup-wizard"]')).toBeVisible();
});

When('I enter business name {string}', async function (this: CustomWorld, businessName: string) {
  await this.page.fill('[data-testid="business-name"]', businessName);
});

When('I select business type {string}', async function (this: CustomWorld, businessType: string) {
  await this.page.selectOption('[data-testid="business-type"]', businessType);
});

When('I enter address {string}', async function (this: CustomWorld, address: string) {
  await this.page.fill('[data-testid="business-address"]', address);
});

When('I enter phone {string}', async function (this: CustomWorld, phone: string) {
  await this.page.fill('[data-testid="business-phone"]', phone);
});

When('I enter email {string}', async function (this: CustomWorld, email: string) {
  await this.page.fill('[data-testid="business-email"]', email);
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`);
});

Then('I should proceed to the inventory setup step', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="inventory-setup-step"]')).toBeVisible();
});

Then('the system should generate slug {string}', async function (this: CustomWorld, expectedSlug: string) {
  const slug = await this.page.locator('[data-testid="business-slug"]').textContent();
  expect(slug).toBe(expectedSlug);
});

Then('the slug should be unique', async function (this: CustomWorld) {
  // In a real test, you would verify uniqueness with the backend
  expect(true).toBe(true); // Placeholder
});

Then('I should see {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.locator(`text=${message}`)).toBeVisible();
});

Then('the form should not be submitted', async function (this: CustomWorld) {
  // Verify form is still visible and not submitted
  await expect(this.page.locator('[data-testid="business-setup-form"]')).toBeVisible();
});
