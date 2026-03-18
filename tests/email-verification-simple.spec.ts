import { test, expect } from '@playwright/test'

test.describe('Email Verification Simple Test', () => {
  test('verify email verification form works with correct selectors', async ({ page }) => {
    // Set up localStorage data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })
    
    // Navigate to verify-email page
    await page.goto('/verify-email')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that the page loads correctly
    await expect(page.locator('text=Verify Your Email')).toBeVisible()
    await expect(page.locator('text=test@example.com')).toBeVisible()
    
    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)
    
    // Check that form elements are now visible
    await expect(page.locator('input[name="code"]')).toBeVisible()
    await expect(page.locator('button:has-text("Verify")')).toBeVisible()
    
    // Test with a valid 6-digit code
    const validCode = '123456'
    await page.fill('input[name="code"]', validCode)
    
    // Click verify button
    await page.click('button:has-text("Verify")')
    
    // Wait a moment for any response
    await page.waitForTimeout(2000)
    
    // Check what actually appears on the page
    const bodyText = await page.textContent('body')
    console.log('Body text after verification attempt:', bodyText)
    
    // Check for any error messages that might appear
    const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').all()
    console.log('Error elements found:', errorElements.length)
    
    for (let i = 0; i < errorElements.length; i++) {
      const text = await errorElements[i].textContent()
      console.log(`Error element ${i}:`, text)
    }
    
    // Check for any success messages
    const successElements = await page.locator('[class*="success"], [class*="Success"]').all()
    console.log('Success elements found:', successElements.length)
    
    for (let i = 0; i < successElements.length; i++) {
      const text = await successElements[i].textContent()
      console.log(`Success element ${i}:`, text)
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'email-verification-simple-test.png' })
  })

  test('test email verification with invalid code', async ({ page }) => {
    // Set up localStorage data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('pendingUserData', JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        businessName: 'Test Bakery',
        role: 'owner'
      }))
    })
    
    // Navigate to verify-email page
    await page.goto('/verify-email')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    await page.waitForTimeout(1000)
    
    // Test with an invalid code
    const invalidCode = '000000'
    await page.fill('input[name="code"]', invalidCode)
    
    // Click verify button
    await page.click('button:has-text("Verify")')
    
    // Wait a moment for any response
    await page.waitForTimeout(2000)
    
    // Check what actually appears on the page
    const bodyText = await page.textContent('body')
    console.log('Body text after invalid verification attempt:', bodyText)
    
    // Check for any error messages that might appear
    const errorElements = await page.locator('[class*="error"], [class*="Error"], [role="alert"]').all()
    console.log('Error elements found:', errorElements.length)
    
    for (let i = 0; i < errorElements.length; i++) {
      const text = await errorElements[i].textContent()
      console.log(`Error element ${i}:`, text)
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'email-verification-invalid-test.png' })
  })
})
