import { test, expect } from '@playwright/test'

test.describe('Email Verification System', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('complete email verification flow from signup to verification', async ({ page }) => {
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

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Check that verification form is present
    await expect(page.locator('input[name="code"]')).toBeVisible()
    await expect(page.locator('button:has-text("Verify")')).toBeVisible()
    await expect(page.locator('button:has-text("Resend")')).toBeVisible()
  })

  test('verify-email page accepts six-digit tokens correctly', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    // Set up mock verification data
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Check that the page loads correctly
    await expect(page.locator('text=Verify Your Email')).toBeVisible()
    await expect(page.locator('text=test@example.com')).toBeVisible()

    // Test with a valid 6-digit code
    const validCode = '123456'
    await page.fill('input[name="code"]', validCode)
    
    // Click verify button
    await page.click('button:has-text("Verify")')

    // Should show verification in progress
    await expect(page.locator('text=Verifying')).toBeVisible()
  })

  test('verify-email page handles invalid tokens correctly', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Test with an invalid code
    const invalidCode = '000000'
    await page.fill('input[name="code"]', invalidCode)
    
    // Click verify button
    await page.click('button:has-text("Verify")')

    // Should show error message
    await expect(page.locator('text=Invalid or expired verification code')).toBeVisible()
  })

  test('verify-email page handles empty tokens correctly', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Try to verify with empty code
    await page.click('button:has-text("Verify")')

    // Should show validation error
    await expect(page.locator('text=Please enter a verification code')).toBeVisible()
  })

  test('verify-email page handles non-six-digit tokens correctly', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Test with non-six-digit code
    const invalidCode = '12345' // Only 5 digits
    await page.fill('input[name="code"]', invalidCode)
    
    // Click verify button
    await page.click('button:has-text("Verify")')

    // Should show validation error
    await expect(page.locator('text=Please enter a 6-digit code')).toBeVisible()
  })

  test('verify-email page resend functionality works', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Click resend button
    await page.click('button:has-text("Resend")')

    // Should show resend confirmation
    await expect(page.locator('text=Verification email sent')).toBeVisible()
    
    // Should show cooldown timer
    await expect(page.locator('text=Resend in')).toBeVisible()
  })

  test('verify-email page redirects to login if no email found', async ({ page }) => {
    // Navigate to verify-email without any email data
    await page.goto('/verify-email')

    // Should redirect to login page
    await page.waitForURL('**/login**')
    await expect(page).toHaveTitle(/Login/)
  })

  test('verify-email page redirects to dashboard if user already verified', async ({ page }) => {
    // Mock a verified user
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      // Mock a verified user in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        email_confirmed_at: new Date().toISOString(),
        role: 'owner'
      }))
    })

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard**')
  })

  test('verify-email page handles multiple verification attempts correctly', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Try multiple invalid attempts
    for (let i = 0; i < 3; i++) {
      const invalidCode = `00000${i}`
      await page.fill('input[name="code"]', invalidCode)
      await page.click('button:has-text("Verify")')
      
      // Should show error message
      await expect(page.locator('text=Invalid or expired verification code')).toBeVisible()
      
      // Clear the input for next attempt
      await page.fill('input[name="code"]', '')
    }

    // Should show rate limiting message after multiple attempts
    await expect(page.locator('text=Too many attempts')).toBeVisible()
  })

  test('verify-email page handles expired tokens correctly', async ({ page }) => {
    // Mock a pending verification with expired token
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner',
        // Mock expired token
        tokenExpiry: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Try to verify with any code
    const code = '123456'
    await page.fill('input[name="code"]', code)
    await page.click('button:has-text("Verify")')

    // Should show expired token error
    await expect(page.locator('text=Verification code has expired')).toBeVisible()
  })

  test('verify-email page shows proper loading states', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Check initial loading state
    await expect(page.locator('text=Loading...')).toBeVisible()

    // Wait for page to load
    await page.waitForSelector('text=Verify Your Email', { timeout: 5000 })

    // Check that loading state is gone
    await expect(page.locator('text=Loading...')).not.toBeVisible()
  })

  test('verify-email page handles network errors gracefully', async ({ page }) => {
    // Mock a pending verification
    await page.goto('/verify-email?email=test@example.com')
    
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })

    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)

    // Mock network failure
    await page.route('**/auth/verify-otp', route => {
      route.abort('failed')
    })

    // Try to verify
    const code = '123456'
    await page.fill('input[name="code"]', code)
    await page.click('button:has-text("Verify")')

    // Should show network error
    await expect(page.locator('text=Network error')).toBeVisible()
  })
})
