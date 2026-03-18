# Playwright Testing Setup

This project now has Playwright testing configured with Gherkin support using Cucumber.js.

## Project Structure

```
tests/
├── pages/                      # Page Object Model classes
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── SignupPage.ts
│   └── RecipePage.ts
├── fixtures/                   # Test fixtures and data
│   ├── test-data.ts
│   └── auth-fixtures.ts
├── features/                    # Gherkin feature files
│   ├── authentication.feature
│   ├── onboarding.feature
│   └── dashboard.feature
├── step-definitions/            # Step definition files
│   ├── auth-steps.ts
│   ├── onboarding-steps.ts
│   └── dashboard-steps.ts
├── support/                     # Support files
│   ├── world.ts                # Custom world for Cucumber
│   └── hooks.ts                # Before/After hooks
├── authentication.spec.ts      # Authentication tests
├── navigation.spec.ts          # Navigation tests
└── example.spec.ts             # Sample Playwright test
```

## Available Scripts

- `pnpm test` - Run Playwright tests
- `pnpm test:ui` - Run tests with UI mode
- `pnpm test:headed` - Run tests in headed mode (visible browser)
- `pnpm test:cucumber` - Run Cucumber/Gherkin tests
- `pnpm test:all` - Run both Playwright and Cucumber tests
- `pnpm test:debug` - Run tests in debug mode

## Running Tests

**Note:** The dev server starts automatically when running tests. No need to manually start `pnpm dev`.

### Playwright Tests
```bash
# Run all Playwright tests (server starts automatically)
pnpm test

# Run with UI (interactive mode)
pnpm test:ui

# Run in headed mode (see browser)
pnpm test:headed

# Run specific test file
pnpm test tests/authentication.spec.ts

# Skip WebKit tests if dependencies are missing
SKIP_WEBKIT=1 pnpm test
```

### Cucumber/Gherkin Tests
```bash
# Run all Gherkin feature files
pnpm test:cucumber

# Run specific feature file
pnpm test:cucumber tests/features/authentication.feature
```

## Test Data Attributes

To make tests more reliable, add `data-testid` attributes to your React components:

```tsx
// Example for login form
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
  Login
</button>
```

## Configuration Files

- `playwright.config.ts` - Playwright configuration
- `cucumber.config.js` - Cucumber configuration

## Browser Support

- Chromium (default)
- Firefox
- WebKit (Safari) - Optional, can be skipped with `SKIP_WEBKIT=1`

## Page Object Model

The test suite uses the Page Object Model (POM) pattern for better maintainability:

- **LoginPage**: Handles login form interactions
- **DashboardPage**: Manages dashboard navigation and assertions
- **SignupPage**: Handles signup form interactions
- **RecipePage**: Manages recipe-related page interactions

All page objects use semantic selectors (`getByRole`, `getByLabel`) for reliability.

## Reports

- Playwright HTML reports: `playwright-report/`
- Cucumber HTML reports: `reports/cucumber-report.html`
- Cucumber JSON reports: `reports/cucumber-report.json`

## Next Steps

1. Add `data-testid` attributes to your React components
2. Update step definitions to match your actual UI elements
3. Add more feature files for different user journeys
4. Set up CI/CD integration for automated testing

## Troubleshooting

### WebKit Dependencies Missing

If WebKit tests fail with missing library errors:

```bash
# Option 1: Install dependencies (Linux)
sudo apt-get update
sudo apt-get install -y libicu66 libwebp6 libffi7

# Option 2: Skip WebKit tests
SKIP_WEBKIT=1 pnpm test
```

### Server Not Starting

The dev server should start automatically. If tests fail with connection errors:

1. Ensure port 3000 is available
2. Check that `pnpm dev` works manually
3. Increase timeout in `playwright.config.ts` if needed

### Test Failures

- Use `pnpm test:ui` for interactive debugging
- Check screenshots in `test-results/` directory
- Review HTML reports in `playwright-report/`
