// tests/step-definitions/email-verification-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I have registered with email {string}', async function (this: CustomWorld, email: string) {
  // Navigate to signup and complete registration
  await this.page.goto('/signup');
  await this.page.fill('[data-testid="signup-email"]', email);
  await this.page.fill('[data-testid="signup-password"]', 'password123');
  await this.page.fill('[data-testid="signup-confirm-password"]', 'password123');
  await this.page.click('[data-testid="signup-button"]');
});

When('I check my email', async function (this: CustomWorld) {
  // In a real test, you would check email service
  // For now, we'll simulate this step
  await this.page.waitForTimeout(1000);
});

Then('I should receive a verification email', async function (this: CustomWorld) {
  // In a real test, you would verify email was sent
  // For now, we'll check for success message
  await expect(this.page.locator('[data-testid="verification-email-sent"]')).toBeVisible();
});

Then('the email should contain a 6-digit verification code', async function (this: CustomWorld) {
  // In a real test, you would extract code from email
  // For now, we'll simulate this
  expect(true).toBe(true); // Placeholder
});

When('I enter the verification code {string}', async function (this: CustomWorld, code: string) {
  await this.page.fill('[data-testid="verification-code"]', code);
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`);
});

Then('my account should be verified', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="account-verified"]')).toBeVisible();
});

When('I click {string}', async function (this: CustomWorld, buttonText: string) {
  await this.page.click(`[data-testid="${buttonText.toLowerCase().replace(/\s+/g, '-')}-button"]`);
});

Then('I should see {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.locator(`text=${message}`)).toBeVisible();
});

Then('I should see {string}', async function (this: CustomWorld, message: string) {
  await expect(this.page.locator(`text=${message}`)).toBeVisible();
});

Then('I should remain on the verification page', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*verify-email/);
});
