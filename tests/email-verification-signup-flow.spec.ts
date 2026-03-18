import { test, expect } from '@playwright/test'

test.describe('Email Verification Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('complete signup flow with email verification', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out signup form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should redirect to verify-email page
    await page.waitForURL('**/verify-email**')
    await expect(page).toHaveTitle(/Verify Email/)

    // Check that email is displayed
    await expect(page.locator('text=test@example.com')).toBeVisible()

    // Check that verification form is present
    await expect(page.locator('input[placeholder*="code"], input[placeholder*="Code"]')).toBeVisible()
    await expect(page.locator('button:has-text("Verify")')).toBeVisible()
    await expect(page.locator('button:has-text("Resend")')).toBeVisible()

    // Check that pending user data is stored
    const pendingData = await page.evaluate(() => {
      return localStorage.getItem('pendingUserData')
    })
    expect(pendingData).toBeTruthy()
    
    const userData = JSON.parse(pendingData!)
    expect(userData.email).toBe('test@example.com')
    expect(userData.name).toBe('Test User')
    expect(userData.businessName).toBe('Test Bakery')
    expect(userData.role).toBe('owner')
  })

  test('signup flow handles email verification bypass in development', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out signup form with demo email
    await page.fill('input[name="name"]', 'Demo User')
    await page.fill('input[name="email"]', 'demo@bakesync.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="businessName"]', 'Demo Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should redirect directly to onboarding (bypassing email verification)
    await page.waitForURL('**/onboarding**')
    await expect(page).toHaveTitle(/Onboarding/)

    // Check that no pending verification data is stored
    const pendingData = await page.evaluate(() => {
      return localStorage.getItem('pendingUserData')
    })
    expect(pendingData).toBeNull()
  })

  test('signup flow shows proper error messages for invalid data', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Try to submit with empty fields
    await page.click('button[type="submit"]')

    // Should show validation errors
    await expect(page.locator('text=Name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('signup flow handles password mismatch correctly', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'differentpassword')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('signup flow handles invalid email format correctly', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out form with invalid email
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show invalid email error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('signup flow handles weak password correctly', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out form with weak password
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show weak password error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('signup flow handles existing email correctly', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out form with existing email
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'owner@bakesync.com') // Existing demo email
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show existing email error
    await expect(page.locator('text=User already registered')).toBeVisible()
  })

  test('signup flow preserves form data on validation errors', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out form with some valid data
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'differentpassword') // Mismatch
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()

    // Check that form data is preserved
    await expect(page.locator('input[name="name"]')).toHaveValue('Test User')
    await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com')
    await expect(page.locator('input[name="businessName"]')).toHaveValue('Test Bakery')
    await expect(page.locator('select[name="role"]')).toHaveValue('owner')
  })

  test('signup flow handles network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/auth/signup', route => {
      route.abort('failed')
    })

    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out signup form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show network error
    await expect(page.locator('text=Network error')).toBeVisible()
  })

  test('signup flow shows loading state during submission', async ({ page }) => {
    // Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveTitle(/Sign Up/)

    // Fill out signup form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.fill('input[name="businessName"]', 'Test Bakery')
    await page.selectOption('select[name="role"]', 'owner')

    // Submit signup form
    await page.click('button[type="submit"]')

    // Should show loading state
    await expect(page.locator('text=Creating account')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })
})
