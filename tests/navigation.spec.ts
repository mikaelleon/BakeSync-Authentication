// tests/navigation.spec.ts
import { test, expect } from './fixtures/auth-fixtures';
import { TestUsers, TestRoutes } from './fixtures/test-data';

test.describe('Navigation', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);
  });

  test('should navigate to login page from signup page', async ({
    signupPage,
    loginPage,
  }) => {
    await signupPage.goto();
    await signupPage.loginLink.click();

    await loginPage.expectOnLoginPage();
  });

  test('should navigate to signup page from login page', async ({
    loginPage,
    signupPage,
  }) => {
    await loginPage.goto();
    await loginPage.signupLink.click();

    await signupPage.expectOnSignupPage();
  });

  test('should navigate between dashboard sections', async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto('demo');
    await dashboardPage.waitForLoad();

    const sidebarItems = await dashboardPage.getSidebarItems();
    expect(sidebarItems.length).toBeGreaterThan(0);

    if (sidebarItems.some((item) => item.toLowerCase().includes('pos'))) {
      await dashboardPage.clickSidebarItem('POS');
      await expect(page).toHaveURL(/.*pos/i);
    }
  });
});

