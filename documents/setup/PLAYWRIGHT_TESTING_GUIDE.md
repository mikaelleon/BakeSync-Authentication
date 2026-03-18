# Playwright Testing Guide for BakeSync ERP

This comprehensive guide will walk you through testing your BakeSync ERP application using Playwright with Gherkin feature files.

## 📋 Prerequisites

Before running tests, ensure you have:

1. **Node.js and pnpm installed**
2. **Playwright browsers installed** (already done)
3. **Port 3000 available** (server starts automatically)
4. **Test data attributes** added to your React components (optional, semantic selectors preferred)

## 🚀 Quick Start

**Note:** The dev server starts automatically when running tests. No manual server startup required.

```bash
# Run all Playwright tests (server starts automatically)
pnpm test

# Or run with UI (recommended for development)
pnpm test:ui

# Skip WebKit if dependencies are missing
SKIP_WEBKIT=1 pnpm test
```

## 📁 Feature Files Overview

Your test suite includes comprehensive feature files covering all major workflows:

### Authentication & Registration
- `user-authentication.feature` - Login, signup, session management
- `email-verification.feature` - Email verification workflows

### Business Setup
- `business-setup.feature` - Business configuration wizard
- `inventory-setup.feature` - Initial inventory setup
- `team-invitation.feature` - Team member invitations

### Core Business Features
- `team-management.feature` - Team member management
- `inventory-management.feature` - Inventory tracking and management
- `recipe-management.feature` - Recipe creation and management
- `production-management.feature` - Production logging
- `point-of-sale.feature` - POS transactions
- `financial-management.feature` - Sales and expense tracking

### System Features
- `reporting-analytics.feature` - Analytics and reporting
- `system-administration.feature` - User preferences and settings
- `error-handling.feature` - Error scenarios and validation

## 🎯 Step-by-Step Testing Instructions

### Step 1: Prepare Your Application

Add `data-testid` attributes to your React components:

```tsx
// Example: Login form
<form data-testid="login-form">
  <input 
    data-testid="email"
    type="email" 
    placeholder="Email" 
  />
  <input 
    data-testid="password"
    type="password" 
    placeholder="Password" 
  />
  <button data-testid="login-button">
    Sign In
  </button>
</form>

// Example: Dashboard
<div data-testid="dashboard-title">
  <h1>Dashboard</h1>
</div>
```

### Step 2: Run Individual Feature Tests

```bash
# Test authentication features
pnpm test:cucumber tests/features/user-authentication.feature

# Test business setup
pnpm test:cucumber tests/features/business-setup.feature

# Test inventory management
pnpm test:cucumber tests/features/inventory-management.feature
```

### Step 3: Run Tests with Different Browsers

```bash
# Test on Chrome only
pnpm test --project=chromium

# Test on Firefox only
pnpm test --project=firefox

# Test on Safari only
pnpm test --project=webkit
```

### Step 4: Run Tests in Different Modes

```bash
# Headed mode (see browser)
pnpm test:headed

# Debug mode (step through tests)
pnpm test:debug

# UI mode (interactive)
pnpm test:ui
```

### Step 5: Generate Reports

```bash
# Run tests and generate HTML report
pnpm test --reporter=html

# View the report
open playwright-report/index.html
```

## 🔧 Configuration Options

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit is optional - skip if dependencies missing
    ...(process.env.SKIP_WEBKIT ? [] : [{
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    }]),
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Page Object Model

The test suite uses the Page Object Model (POM) pattern for maintainability:

- **LoginPage** (`tests/pages/LoginPage.ts`): Login form interactions
- **DashboardPage** (`tests/pages/DashboardPage.ts`): Dashboard navigation
- **SignupPage** (`tests/pages/SignupPage.ts`): Signup form interactions
- **RecipePage** (`tests/pages/RecipePage.ts`): Recipe management pages

Example usage:
```typescript
import { test, expect } from './fixtures/auth-fixtures';

test('should login successfully', async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login('owner@bakesync.com', 'owner123');
  await dashboardPage.expectOnDashboard('demo');
});
```

### Cucumber Configuration (`cucumber.config.js`)

```javascript
module.exports = {
  default: {
    require: [
      'tests/step-definitions/**/*.ts',
      'tests/support/**/*.ts'
    ],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    paths: ['tests/features/**/*.feature'],
    publishQuiet: true,
    dryRun: false,
    failFast: false
  }
};
```

## 📊 Test Reports

### Playwright Reports
- **Location**: `playwright-report/index.html`
- **Contains**: Test results, screenshots, videos, traces
- **Access**: Open in browser after running tests

### Cucumber Reports
- **HTML Report**: `reports/cucumber-report.html`
- **JSON Report**: `reports/cucumber-report.json`
- **Contains**: Feature execution details, step results

## 🐛 Debugging Tests

### 1. Debug Mode
```bash
# Run specific test in debug mode
pnpm test:debug tests/example.spec.ts

# Debug specific feature
pnpm test:cucumber tests/features/authentication.feature --debug
```

### 2. Screenshots and Videos
```bash
# Run with screenshots on failure
pnpm test --screenshot=only-on-failure

# Run with video recording
pnpm test --video=on
```

### 3. Trace Viewer
```bash
# Run with trace
pnpm test --trace=on

# Open trace viewer
pnpm exec playwright show-trace trace.zip
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: pnpm install
    - name: Install Playwright browsers
      run: pnpm exec playwright install --with-deps
    - name: Run Playwright tests
      run: pnpm test
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## 📝 Writing New Tests

### 1. Create Feature File
```gherkin
Feature: New Feature
  As a user
  I want to do something
  So that I can achieve a goal

  Scenario: Test scenario
    Given I am on the page
    When I do something
    Then I should see the result
```

### 2. Create Step Definitions
```typescript
// tests/step-definitions/new-feature-steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';

Given('I am on the page', async function (this: CustomWorld) {
  await this.page.goto('/page');
});

When('I do something', async function (this: CustomWorld) {
  await this.page.click('[data-testid="button"]');
});

Then('I should see the result', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="result"]')).toBeVisible();
});
```

## 🚨 Common Issues and Solutions

### Issue: Connection refused errors
**Solution**: The webServer config should start the server automatically. Ensure port 3000 is available and check server logs.

### Issue: WebKit tests fail with missing libraries
**Solution**: 
```bash
# Install dependencies (Linux)
sudo apt-get install -y libicu66 libwebp6 libffi7

# Or skip WebKit
SKIP_WEBKIT=1 pnpm test
```

### Issue: Tests fail with "Element not found"
**Solution**: Page Object Model uses semantic selectors. Ensure your components have proper labels and roles. Check `tests/pages/` for selector patterns.

### Issue: Tests timeout
**Solution**: Increase timeout in playwright.config.ts or use explicit `expect` assertions instead of `waitForTimeout`

### Issue: Tests run too slowly
**Solution**: Use `fullyParallel: true` and increase `workers` in config

## 📈 Best Practices

1. **Use data-testid attributes** instead of CSS selectors
2. **Write atomic tests** that don't depend on each other
3. **Use page object pattern** for complex pages
4. **Add proper waits** instead of hard-coded timeouts
5. **Clean up test data** after each test
6. **Use meaningful test descriptions**
7. **Group related tests** in feature files

## 🎯 Next Steps

1. **Add data-testid attributes** to all your React components
2. **Update step definitions** to match your actual UI elements
3. **Run tests regularly** during development
4. **Set up CI/CD** for automated testing
5. **Add more specific test scenarios** as needed

## 📞 Support

If you encounter issues:
1. Check the Playwright documentation
2. Review test reports for detailed error information
3. Use debug mode to step through failing tests
4. Check browser console for JavaScript errors

Happy testing! 🎉
