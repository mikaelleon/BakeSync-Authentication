# POS Module - Comprehensive Test Suite Documentation

## Overview

This document describes the comprehensive Playwright test suite for the Point of Sale (POS) module in BakeSync ERP. The test suite covers all critical user interactions, workflows, validations, and edge cases.

## Test Credentials

**Email:** shio@gmail.com  
**Password:** Shio@123

## Test Structure

### Test File
- **Location:** `tests/pos-comprehensive.spec.ts`
- **Page Objects:** `tests/pages/POSPage.ts`

### Test Organization

The test suite is organized into the following test groups:

1. **Authentication and Navigation** - Login, navigation, page loading
2. **Product Search and Filtering** - Search functionality, filtering products
3. **Category Filtering** - Category-based product filtering
4. **Cart Management - Adding Items** - Adding products to cart
5. **Cart Management - Modifying Quantities** - Increasing/decreasing quantities
6. **Cart Management - Removing Items** - Removing items from cart
7. **Cart Management - Clearing Cart** - Clearing entire cart
8. **Checkout Process - Dialog Opening** - Opening checkout dialog
9. **Payment Methods - Cash** - Cash payment flow and validations
10. **Payment Methods - Card and GCash** - Card and GCash payment flows
11. **Input Validations** - Form validations and error handling
12. **Transaction Processing** - Complete transaction flows for all payment methods
13. **Receipt Generation** - Receipt display and functionality
14. **Recent Transactions** - Transaction history display
15. **Edge Cases and Error Handling** - Error scenarios and edge cases
16. **UI Responsiveness and Interactions** - Keyboard navigation, loading states

## Test Coverage

### ✅ Covered Features

- **Authentication**
  - Login with valid credentials
  - Navigation to POS page
  - Page element visibility

- **Product Management**
  - Product search
  - Category filtering
  - Product display
  - Stock badges
  - Empty states

- **Cart Operations**
  - Adding products to cart
  - Increasing quantities
  - Decreasing quantities
  - Removing items
  - Clearing cart
  - Cart total calculations
  - Cart item count display

- **Checkout Process**
  - Opening checkout dialog
  - Payment method selection (Cash, Card, GCash)
  - Amount paid input (Cash)
  - Change calculation (Cash)
  - Order total display
  - Dialog cancellation

- **Payment Processing**
  - Cash payment with change calculation
  - Card payment
  - GCash payment
  - Payment validation
  - Insufficient payment handling

- **Receipt Generation**
  - Receipt dialog display
  - Order number display
  - Receipt items display
  - Payment method display
  - Print receipt functionality
  - Receipt closing

- **Recent Transactions**
  - Transaction list display
  - Empty state handling
  - Transaction display after completion

- **Error Handling**
  - Empty cart checkout prevention
  - Invalid payment amount validation
  - Insufficient payment handling
  - Out of stock handling

- **Edge Cases**
  - Rapid product additions
  - Multiple category changes
  - Page refresh handling
  - Keyboard navigation
  - Loading states

## Running the Tests

### Prerequisites

1. Ensure the development server is running:
   ```bash
   pnpm dev
   ```

2. Ensure test credentials are valid:
   - Email: shio@gmail.com
   - Password: Shio@123

### Run All POS Tests

```bash
# Run all POS comprehensive tests
npx playwright test tests/pos-comprehensive.spec.ts

# Run with UI mode (interactive)
npx playwright test tests/pos-comprehensive.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/pos-comprehensive.spec.ts --headed

# Run specific test group
npx playwright test tests/pos-comprehensive.spec.ts -g "Cart Management"
```

### Run Specific Test Groups

```bash
# Authentication tests
npx playwright test tests/pos-comprehensive.spec.ts -g "Authentication"

# Cart management tests
npx playwright test tests/pos-comprehensive.spec.ts -g "Cart Management"

# Payment tests
npx playwright test tests/pos-comprehensive.spec.ts -g "Payment"

# Transaction tests
npx playwright test tests/pos-comprehensive.spec.ts -g "Transaction"
```

### Debug Tests

```bash
# Run in debug mode
npx playwright test tests/pos-comprehensive.spec.ts --debug

# Run specific test with debug
npx playwright test tests/pos-comprehensive.spec.ts -g "should add product to cart" --debug
```

## Page Object Model

### POSPage Class

The `POSPage` class provides methods for interacting with the POS interface:

**Navigation:**
- `goto(slug)` - Navigate to POS page
- `waitForLoad()` - Wait for page to load
- `expectOnPOSPage()` - Verify on POS page

**Product Operations:**
- `search(query)` - Search for products
- `clearSearch()` - Clear search
- `clickProduct(name)` - Click product by name
- `clickFirstProduct()` - Click first available product
- `getProductCount()` - Get product count
- `getProductStock(name)` - Get product stock

**Category Operations:**
- `clickCategory(name)` - Filter by category
- `clickSyncProducts()` - Sync products

**Cart Operations:**
- `getCartItemCount()` - Get cart item count
- `getCartTotal()` - Get cart total
- `increaseQuantity(name)` - Increase item quantity
- `decreaseQuantity(name)` - Decrease item quantity
- `removeItem(name)` - Remove item from cart
- `clearCart()` - Clear entire cart
- `clickCheckout()` - Open checkout dialog

**Recent Transactions:**
- `getRecentTransactionsCount()` - Get transaction count
- `expectTransactionInList(orderNumber)` - Verify transaction in list

### CheckoutDialog Class

Methods for interacting with the checkout dialog:

- `expectDialogVisible()` - Verify dialog is visible
- `selectPaymentMethod(method)` - Select payment method
- `fillAmountPaid(amount)` - Fill amount paid (cash)
- `getChangeAmount()` - Get change amount
- `getTotalAmount()` - Get total amount
- `clickComplete()` - Complete payment
- `clickCancel()` - Cancel checkout
- `expectErrorToast()` - Verify error toast

### ReceiptDialog Class

Methods for interacting with the receipt dialog:

- `expectDialogVisible()` - Verify receipt is visible
- `getOrderNumber()` - Get order number
- `getTotal()` - Get receipt total
- `clickPrint()` - Print receipt
- `clickClose()` - Close receipt
- `expectPaymentMethod(method)` - Verify payment method

## Test Data

Test user credentials are stored in `tests/fixtures/test-data.ts`:

```typescript
posUser: {
  email: 'shio@gmail.com',
  password: 'Shio@123',
  role: 'owner',
}
```

## Best Practices

### Test Isolation

Each test is independent and should:
- Start with a fresh login
- Clean up after itself (if needed)
- Not depend on other tests

### Waiting Strategies

Tests use appropriate waiting strategies:
- `waitForLoadState('networkidle')` - Wait for network requests
- `waitForTimeout()` - Wait for UI updates
- `expect().toBeVisible()` - Wait for element visibility

### Error Handling

Tests handle edge cases:
- Empty product lists
- Empty cart scenarios
- Out of stock products
- Network errors

### Maintainability

- Page Object Model pattern for reusability
- Clear test descriptions
- Grouped related tests
- Helper methods for common operations

## Troubleshooting

### Common Issues

1. **Tests fail with "Element not visible"**
   - Ensure products are loaded: Wait for `networkidle` state
   - Check if products exist before interacting
   - Use appropriate timeouts

2. **Tests fail with "Login failed"**
   - Verify credentials are correct
   - Check if user account exists
   - Ensure development server is running

3. **Tests timeout**
   - Increase timeout for slow operations
   - Check network conditions
   - Verify server is responsive

4. **Cart operations fail**
   - Ensure products are added before modifying
   - Wait for UI updates after cart operations
   - Check if cart is empty before operations

### Debug Tips

1. Use `--headed` flag to see browser actions
2. Use `--debug` flag to step through tests
3. Add `await page.pause()` for manual inspection
4. Check browser console for errors
5. Review test screenshots on failure

## Future Enhancements

Potential additions to the test suite:

- [ ] Discount system tests (when implemented)
- [ ] Customer management tests (when implemented)
- [ ] Barcode scanning tests (when implemented)
- [ ] Receipt email tests (when implemented)
- [ ] Offline mode tests (when implemented)
- [ ] Performance tests
- [ ] Accessibility tests
- [ ] Mobile responsive tests

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use Page Object Model pattern
3. Add clear test descriptions
4. Group related tests
5. Handle edge cases
6. Update this documentation

## References

- [Playwright Documentation](https://playwright.dev/)
- [POS Module Implementation](../app/[slug]/pos/page.tsx)
- [Test Data Fixtures](./fixtures/test-data.ts)

