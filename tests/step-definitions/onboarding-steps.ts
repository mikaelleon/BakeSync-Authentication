// tests/step-definitions/onboarding-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

When('I enter business details', async function (this: CustomWorld, dataTable) {
  const data = dataTable.hashes()[0];
  await this.page.fill('[data-testid="business-name"]', data['Business Name']);
  await this.page.fill('[data-testid="business-email"]', data['Email']);
  await this.page.selectOption('[data-testid="business-type"]', data['Business Type']);
});

When('I proceed to team setup', async function (this: CustomWorld) {
  await this.page.click('[data-testid="next-step-button"]');
  await expect(this.page.locator('[data-testid="team-setup-step"]')).toBeVisible();
});

When('I complete team configuration', async function (this: CustomWorld) {
  // Add team setup logic here
  await this.page.click('[data-testid="complete-team-setup"]');
});

When('I reach the inventory setup step', async function (this: CustomWorld) {
  await this.page.click('[data-testid="inventory-setup-step"]');
  await expect(this.page.locator('[data-testid="inventory-form"]')).toBeVisible();
});

When('I add an ingredient with name {string} and quantity {string} and unit {string}', 
  async function (this: CustomWorld, name: string, quantity: string, unit: string) {
    await this.page.fill('[data-testid="ingredient-name"]', name);
    await this.page.fill('[data-testid="ingredient-quantity"]', quantity);
    await this.page.selectOption('[data-testid="ingredient-unit"]', unit);
    await this.page.click('[data-testid="add-ingredient-button"]');
  }
);

When('I invite a team member with email {string}', async function (this: CustomWorld, email: string) {
  await this.page.fill('[data-testid="team-member-email"]', email);
});

When('I set their role as {string}', async function (this: CustomWorld, role: string) {
  await this.page.selectOption('[data-testid="team-member-role"]', role);
  await this.page.click('[data-testid="send-invitation-button"]');
});

Given('I have completed business details', async function (this: CustomWorld) {
  // Navigate to onboarding if not already there
  await this.page.goto('/onboarding');
  await expect(this.page.locator('[data-testid="onboarding-wizard"]')).toBeVisible();
});

Given('I am in the team setup step', async function (this: CustomWorld) {
  await this.page.goto('/onboarding');
  await this.page.click('[data-testid="team-setup-step"]');
  await expect(this.page.locator('[data-testid="team-setup-form"]')).toBeVisible();
});

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/.*dashboard/);
});

Then('I should see the onboarding completion message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="onboarding-complete"]')).toBeVisible();
});

Then('the ingredient should be saved successfully', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="ingredient-saved"]')).toBeVisible();
});

Then('I should proceed to the next step', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="next-step-available"]')).toBeVisible();
});

Then('the invitation should be sent', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="invitation-sent"]')).toBeVisible();
});

Then('I should see a confirmation message', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="confirmation-message"]')).toBeVisible();
});
