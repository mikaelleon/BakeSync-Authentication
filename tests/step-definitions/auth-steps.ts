// tests/step-definitions/auth-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the login page', async function (this: CustomWorld) {
  await this.page.goto('/login');
  await expect(this.page).toHaveURL(/.*login/);
});

Given('I am on the signup page', async function (this: CustomWorld) {
  await this.page.goto('/signup');
  await expect(this.page).toHaveURL(/.*signup/);
});

When('I enter valid credentials', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="email"]', 'test@bakery.com');
  await this.page.fill('[data-testid="password"]', 'password123');
});

When('I enter invalid credentials', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="email"]', 'invalid@email.com');
  await this.page.fill('[data-testid="password"]', 'wrongpassword');
});

When('I enter valid signup information', async function (this: CustomWorld) {
  await this.page.fill('[data-testid="signup-email"]', 'newuser@bakery.com');
  await this.page.fill('[data-testid="signup-password"]', 'password123');
  await this.page.fill('[data-testid="signup-confirm-password"]', 'password123');
});

When('I click the login button', async function (this: CustomWorld) {
  await this.page.click('[data-testid="login-button"]');
});

When('I click the signup button', async function (this: CustomWorld) {
  await this.page.click('[data-testid="signup-button"]');
});

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*dashboard/);
});

Then('I should see the dashboard title', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="dashboard-title"]')).toBeVisible();
});

Then('I should see an error message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="error-message"]')).toBeVisible();
});

Then('I should remain on the login page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*login/);
});

Then('I should see a verification message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="verification-message"]')).toBeVisible();
});

Then('I should be redirected to email verification', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*verify-email/);
});
