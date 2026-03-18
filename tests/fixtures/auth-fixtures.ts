// tests/fixtures/auth-fixtures.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { SignupPage } from '../pages/SignupPage';
import { TestUsers } from './test-data';

type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  signupPage: SignupPage;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  signupPage: async ({ page }, use) => {
    const signupPage = new SignupPage(page);
    await use(signupPage);
  },
});

export { expect } from '@playwright/test';

