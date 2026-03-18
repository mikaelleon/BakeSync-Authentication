import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { test } from '@playwright/test';

Given('the BakeSync application is running', async function () {
  // Navigate to the application
  await test.step('Navigate to application', async () => {
    await this.page.goto('http://localhost:3001');
  });
});

Given('I am on the login page', async function () {
  await test.step('Navigate to login page', async () => {
    await this.page.goto('http://localhost:3001/login');
    await this.page.waitForLoadState('networkidle');
  });
});

Given('I have a valid user account with email {string} and password {string}', async function (email: string, password: string) {
  // This is a demo account that should exist in the system
  this.testUser = { email, password };
});

Given('I have an invalid user account', async function () {
  this.testUser = { email: 'invalid@example.com', password: 'wrongpassword' };
});

When('I enter my email {string}', async function (email: string) {
  await test.step('Enter email', async () => {
    await this.page.fill('input[type="email"]', email);
  });
});

When('I enter my password {string}', async function (password: string) {
  await test.step('Enter password', async () => {
    await this.page.fill('input[type="password"]', password);
  });
});

When('I click the {string} button', async function (buttonText: string) {
  await test.step(`Click ${buttonText} button`, async () => {
    await this.page.click(`button:has-text("${buttonText}")`);
    await this.page.waitForLoadState('networkidle');
  });
});

Then('I should be redirected to the dashboard', async function () {
  await test.step('Verify dashboard redirect', async () => {
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(this.page.url()).toContain('/dashboard');
  });
});

Then('I should see my user role displayed as {string}', async function (role: string) {
  await test.step('Verify user role display', async () => {
    // Look for role indicator in the UI
    const roleElement = await this.page.locator(`text=${role}`).first();
    await expect(roleElement).toBeVisible();
  });
});

Then('I should have access to all system features', async function () {
  await test.step('Verify system features access', async () => {
    // Check for sidebar navigation items
    const sidebarItems = await this.page.locator('[data-testid="sidebar-item"]');
    const count = await sidebarItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

Then('I should see an error message {string}', async function (errorMessage: string) {
  await test.step('Verify error message', async () => {
    const errorElement = await this.page.locator(`text=${errorMessage}`);
    await expect(errorElement).toBeVisible();
  });
});

Then('I should remain on the login page', async function () {
  await test.step('Verify login page', async () => {
    expect(this.page.url()).toContain('/login');
  });
});

Given('I am logged in as an owner', async function () {
  await test.step('Login as owner', async () => {
    await this.page.goto('http://localhost:3001/login');
    await this.page.fill('input[type="email"]', 'owner@bakesync.com');
    await this.page.fill('input[type="password"]', 'owner123');
    await this.page.click('button:has-text("Sign In")');
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

Given('I am logged in as a baker', async function () {
  await test.step('Login as baker', async () => {
    await this.page.goto('http://localhost:3001/login');
    await this.page.fill('input[type="email"]', 'baker@bakesync.com');
    await this.page.fill('input[type="password"]', 'baker123');
    await this.page.click('button:has-text("Sign In")');
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

Given('I am logged in as a cashier', async function () {
  await test.step('Login as cashier', async () => {
    await this.page.goto('http://localhost:3001/login');
    await this.page.fill('input[type="email"]', 'cashier@bakesync.com');
    await this.page.fill('input[type="password"]', 'cashier123');
    await this.page.click('button:has-text("Sign In")');
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

When('I click the logout button', async function () {
  await test.step('Click logout', async () => {
    await this.page.click('button:has-text("Logout")');
    await this.page.waitForLoadState('networkidle');
  });
});

Then('I should be redirected to the login page', async function () {
  await test.step('Verify login redirect', async () => {
    await this.page.waitForURL('**/login', { timeout: 10000 });
    expect(this.page.url()).toContain('/login');
  });
});

Then('my session should be cleared', async function () {
  await test.step('Verify session cleared', async () => {
    // Check that user-specific elements are not visible
    const userMenu = await this.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).not.toBeVisible();
  });
});

Given('I am not logged in', async function () {
  await test.step('Ensure not logged in', async () => {
    // Clear any existing session
    await this.page.context().clearCookies();
  });
});

When('I try to access {string}', async function (url: string) {
  await test.step('Access protected route', async () => {
    await this.page.goto(`http://localhost:3001${url}`);
    await this.page.waitForLoadState('networkidle');
  });
});

Then('I should see a message to log in first', async function () {
  await test.step('Verify login prompt', async () => {
    const loginPrompt = await this.page.locator('text=Please log in');
    await expect(loginPrompt).toBeVisible();
  });
});

When('I try to access the financials page', async function () {
  await test.step('Access financials page', async () => {
    await this.page.goto('http://localhost:3001/demo/financials');
    await this.page.waitForLoadState('networkidle');
  });
});

Then('I should see an access denied message', async function () {
  await test.step('Verify access denied', async () => {
    const accessDenied = await this.page.locator('text=Access denied');
    await expect(accessDenied).toBeVisible();
  });
});

Then('I should be redirected to an allowed page', async function () {
  await test.step('Verify redirect to allowed page', async () => {
    // Should be redirected to dashboard or another allowed page
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

When('I refresh the page', async function () {
  await test.step('Refresh page', async () => {
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
  });
});

Then('I should remain logged in', async function () {
  await test.step('Verify still logged in', async () => {
    // Check for user-specific elements
    const userMenu = await this.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
  });
});

Then('I should see the dashboard without re-authentication', async function () {
  await test.step('Verify dashboard access', async () => {
    expect(this.page.url()).toContain('/dashboard');
  });
});

Given('I have accounts for different roles', async function () {
  this.accounts = [
    { email: 'cashier@bakesync.com', password: 'cashier123', role: 'Cashier' },
    { email: 'baker@bakesync.com', password: 'baker123', role: 'Baker' }
  ];
});

When('I log in as a cashier', async function () {
  await test.step('Login as cashier', async () => {
    await this.page.goto('http://localhost:3001/login');
    await this.page.fill('input[type="email"]', 'cashier@bakesync.com');
    await this.page.fill('input[type="password"]', 'cashier123');
    await this.page.click('button:has-text("Sign In")');
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

Then('I should see cashier-specific features', async function () {
  await test.step('Verify cashier features', async () => {
    // Check for POS access
    const posLink = await this.page.locator('a:has-text("POS")');
    await expect(posLink).toBeVisible();
  });
});

When('I log out and log in as a baker', async function () {
  await test.step('Logout and login as baker', async () => {
    await this.page.click('button:has-text("Logout")');
    await this.page.waitForURL('**/login', { timeout: 10000 });
    await this.page.fill('input[type="email"]', 'baker@bakesync.com');
    await this.page.fill('input[type="password"]', 'baker123');
    await this.page.click('button:has-text("Sign In")');
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  });
});

Then('I should see baker-specific features', async function () {
  await test.step('Verify baker features', async () => {
    // Check for production access
    const productionLink = await this.page.locator('a:has-text("Production")');
    await expect(productionLink).toBeVisible();
  });
});

Then('the interface should update based on my role', async function () {
  await test.step('Verify role-based interface', async () => {
    // Check that the interface reflects the current role
    const roleIndicator = await this.page.locator('[data-testid="user-role"]');
    await expect(roleIndicator).toBeVisible();
  });
});
