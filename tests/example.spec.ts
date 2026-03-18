// tests/example.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

test.describe('Page Accessibility', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/BakeSync/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page is accessible and displays form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(page).toHaveURL(/.*login/);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('signup page is accessible and displays form', async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    await expect(page).toHaveURL(/.*signup/);
    await expect(signupPage.emailInput).toBeVisible();
    await expect(signupPage.passwordInput).toBeVisible();
    await expect(signupPage.signUpButton).toBeVisible();
  });
});
