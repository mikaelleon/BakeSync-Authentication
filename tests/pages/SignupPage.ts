// tests/pages/SignupPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class SignupPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly fullNameInput: Locator;
  readonly signUpButton: Locator;
  readonly errorAlert: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/^password$/i);
    this.confirmPasswordInput = page.getByLabel(/confirm password/i);
    this.fullNameInput = page.getByLabel(/full name/i);
    this.signUpButton = page.getByRole('button', { name: /sign up/i });
    this.errorAlert = page.getByRole('alert');
    this.loginLink = page.getByRole('link', { name: /sign in/i });
  }

  async goto() {
    await this.page.goto('/signup');
    await expect(this.emailInput).toBeVisible();
  }

  async fillForm(data: {
    email: string;
    password: string;
    confirmPassword?: string;
    fullName?: string;
  }) {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    if (data.confirmPassword) {
      await this.confirmPasswordInput.fill(data.confirmPassword);
    }
    if (data.fullName) {
      await this.fullNameInput.fill(data.fullName);
    }
  }

  async clickSignUp() {
    await this.signUpButton.click();
  }

  async expectError(message?: string) {
    await expect(this.errorAlert).toBeVisible();
    if (message) {
      await expect(this.errorAlert).toContainText(message);
    }
  }

  async expectOnSignupPage() {
    await expect(this.page).toHaveURL(/.*signup/);
    await expect(this.emailInput).toBeVisible();
  }
}

