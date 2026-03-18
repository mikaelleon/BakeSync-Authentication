// tests/authentication.spec.ts
import { test, expect } from './fixtures/auth-fixtures';
import { TestUsers, InvalidCredentials, TestRoutes } from './fixtures/test-data';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should successfully login with valid owner credentials', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.owner.email,
        TestUsers.owner.password
      );

      await expect(loginPage.page).toHaveURL(
        new RegExp(TestRoutes.dashboard('demo'))
      );
      await dashboardPage.expectOnDashboard('demo');
    });

    test('should successfully login with valid baker credentials', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);

      await expect(loginPage.page).toHaveURL(
        new RegExp(TestRoutes.dashboard('demo'))
      );
      await dashboardPage.expectOnDashboard('demo');
    });

    test('should successfully login with valid cashier credentials', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.cashier.email,
        TestUsers.cashier.password
      );

      await expect(loginPage.page).toHaveURL(
        new RegExp(TestRoutes.dashboard('demo'))
      );
      await dashboardPage.expectOnDashboard('demo');
    });

    test('should display error message with invalid credentials', async ({
      loginPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        InvalidCredentials.email,
        InvalidCredentials.password
      );

      await loginPage.expectOnLoginPage();
      await loginPage.expectError();
    });

    test('should remain on login page after failed login', async ({
      loginPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        InvalidCredentials.email,
        InvalidCredentials.password
      );

      await loginPage.expectOnLoginPage();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route without authentication', async ({
      page,
    }) => {
      await page.context().clearCookies();
      await page.goto(TestRoutes.dashboard('demo'));

      await expect(page).toHaveURL(/.*login/);
    });

    test('should allow access to dashboard after successful login', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.owner.email,
        TestUsers.owner.password
      );

      await dashboardPage.expectOnDashboard('demo');
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('should show correct sidebar items for owner role', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.owner.email,
        TestUsers.owner.password
      );

      await dashboardPage.waitForLoad();
      await dashboardPage.expectSidebarItemCount(
        TestUsers.owner.expectedSidebarItems
      );
    });

    test('should show correct sidebar items for baker role', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(TestUsers.baker.email, TestUsers.baker.password);

      await dashboardPage.waitForLoad();
      await dashboardPage.expectSidebarItemCount(
        TestUsers.baker.expectedSidebarItems
      );
    });

    test('should show correct sidebar items for cashier role', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.cashier.email,
        TestUsers.cashier.password
      );

      await dashboardPage.waitForLoad();
      await dashboardPage.expectSidebarItemCount(
        TestUsers.cashier.expectedSidebarItems
      );
    });

    test('should restrict access to financials for baker role', async ({
      loginPage,
      page,
    }) => {
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
  });

  test.describe('Session Management', () => {
    test('should persist session after page reload', async ({
      loginPage,
      dashboardPage,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.owner.email,
        TestUsers.owner.password
      );

      await dashboardPage.expectOnDashboard('demo');
      await dashboardPage.page.reload();
      await dashboardPage.waitForLoad();

      await dashboardPage.expectOnDashboard('demo');
    });

    test('should logout and redirect to login page', async ({
      loginPage,
      dashboardPage,
      page,
    }) => {
      await loginPage.goto();
      await loginPage.login(
        TestUsers.owner.email,
        TestUsers.owner.password
      );

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
  });
});

