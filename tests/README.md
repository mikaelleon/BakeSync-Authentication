# Playwright Test Structure

This directory contains Playwright tests following best practices with Page Object Model (POM) pattern.

## Structure

```
tests/
├── pages/              # Page Object Model classes
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── SignupPage.ts
│   ├── RecipePage.ts
│   ├── InventoryPage.ts
│   ├── POSPage.ts
│   ├── ProductionPage.ts
│   └── FinancialsPage.ts
├── fixtures/           # Test fixtures and data
│   ├── test-data.ts
│   └── auth-fixtures.ts
├── authentication.spec.ts
├── navigation.spec.ts
├── inventory-management.spec.ts
├── pos-system.spec.ts
├── production-management.spec.ts
├── financials-management.spec.ts
├── dashboard-comprehensive.spec.ts
└── example.spec.ts
```

## Page Object Model

Page Object classes encapsulate page-specific logic and locators:

- **LoginPage**: Handles login form interactions
- **DashboardPage**: Manages dashboard navigation and assertions
- **SignupPage**: Handles signup form interactions
- **RecipePage**: Manages recipe-related page interactions
- **InventoryPage**: Handles inventory management page interactions
- **POSPage**: Manages point of sale system interactions
- **ProductionPage**: Handles production management page interactions
- **FinancialsPage**: Manages financials page interactions

## Test Fixtures

Custom fixtures provide reusable test setup:

- **auth-fixtures.ts**: Extends base test with page objects
- **test-data.ts**: Centralized test data (users, routes, credentials)

## Running Tests

```bash
# Run all tests (automatically starts dev server)
pnpm test

# Run specific test file
pnpm test tests/authentication.spec.ts

# Run with UI mode
pnpm test:ui

# Run in headed mode
pnpm test:headed

# Skip WebKit tests (if dependencies are missing)
SKIP_WEBKIT=1 pnpm test
```

## Configuration

The Playwright config automatically:
- Starts the Next.js dev server before tests
- Reuses existing server if already running (non-CI)
- Captures screenshots on test failures
- Supports Chromium, Firefox, and WebKit browsers

## WebKit Dependencies

If WebKit tests fail with missing library errors, you can either:

1. **Install dependencies** (Linux):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libicu66 libwebp6 libffi7

   # Or skip WebKit tests
   SKIP_WEBKIT=1 pnpm test
   ```

2. **Skip WebKit** by setting environment variable:
   ```bash
   SKIP_WEBKIT=1 pnpm test
   ```

## Test Coverage

### Core Modules
- **Authentication**: Login, signup, email verification flows
- **Navigation**: Route navigation and sidebar interactions
- **Dashboard**: Role-based dashboard views and navigation
- **Recipes**: Recipe listing, creation, editing, and detail views
- **Inventory**: Inventory management, search, filtering, and CRUD operations
- **POS**: Point of sale system, cart management, and checkout
- **Production**: Production logs and batch creation
- **Financials**: Financial overview, transactions, and reporting

### Test Organization
- Tests are grouped by module using `test.describe`
- Each test is atomic and focused on one behavior
- Role-based access tests verify permission enforcement
- Page Object Model pattern ensures maintainability

## Best Practices Followed

1. **Selectors**: Uses `getByRole`, `getByLabel`, `getByPlaceholder`, and `data-testid` attributes
2. **Assertions**: Explicit `expect` statements instead of time-based waits
3. **POM**: All page interactions abstracted into Page Object classes
4. **Fixtures**: Reusable test setup and data
5. **Atomic Tests**: Each test focuses on one behavior
6. **No Brittle Selectors**: Avoids text-based and deep CSS selectors
7. **Error Handling**: Graceful handling of optional elements with `.catch()`
8. **Async Handling**: Proper `await` usage for all async operations
