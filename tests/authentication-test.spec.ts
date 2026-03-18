// tests/authentication-test.spec.ts
import { test, expect } from './fixtures/auth-fixtures';
import { TestUsers, InvalidCredentials, TestRoutes } from './fixtures/test-data';

test.describe('Authentication Workflow Tests', () => {
  test('Successful login with valid credentials', async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);

    await expect(loginPage.page).toHaveURL(
      new RegExp(TestRoutes.dashboard('demo'))
    );
    await dashboardPage.expectOnDashboard('demo');
  });

  test('Login with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(
      InvalidCredentials.email,
      InvalidCredentials.password
    );

    await loginPage.expectOnLoginPage();
    await loginPage.expectError();
  });

  test('Access protected route without authentication', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(TestRoutes.dashboard('demo'));
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*login/);
  });

  test('Role-based access control', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);

    await page.goto(TestRoutes.financials('demo'));
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    const hasAccessDenied = await page
      .getByText(/access denied|unauthorized/i)
      .isVisible()
      .catch(() => false);
    const isRedirected = !currentUrl.includes('/financials');

    expect(hasAccessDenied || isRedirected).toBeTruthy();
  });

  test('Successful logout', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.goto();
    await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);

    await dashboardPage.waitForLoad();

    const logoutButton = page
      .getByRole('button', { name: /logout/i })
      .first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      const userMenu = page.locator('[data-testid="user-menu"]');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByRole('button', { name: /logout/i }).click();
      }
    }

    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('Session persistence', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login(TestUsers.owner.email, TestUsers.owner.password);

    await dashboardPage.expectOnDashboard('demo');
    await dashboardPage.page.reload();
    await dashboardPage.waitForLoad();

    await dashboardPage.expectOnDashboard('demo');
  });

  test('Multiple role login', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.goto();
    await loginPage.login(
      TestUsers.cashier.email,
      TestUsers.cashier.password
    );

    await dashboardPage.waitForLoad();
    await expect(page.getByRole('link', { name: /pos/i })).toBeVisible();

    const logoutButton = page
      .getByRole('button', { name: /logout/i })
      .first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    }
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });

    await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);

    await dashboardPage.waitForLoad();
    await expect(page.getByRole('link', { name: /production/i })).toBeVisible();
  });
});
