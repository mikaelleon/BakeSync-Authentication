import { test, expect } from '@playwright/test'

test.describe('Email Verification Fix Final Test', () => {
  test('verify the email verification fix is working', async ({ page }) => {
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
    
    // Test with the exact code from the screenshot: 544040
    console.log('Testing with code 544040 from screenshot...')
    await page.fill('input[name="code"]', '544040')
    await page.waitForTimeout(1000)
    
    // Check what error messages appear
    const errorMessages = await page.locator('[class*="text-red"], [class*="error"]').allTextContents()
    console.log('Error messages found:', errorMessages)
    
    // Check if the input field shows as valid (green border)
    const inputElement = page.locator('input[name="code"]')
    const className = await inputElement.getAttribute('class')
    console.log('Input class with 544040:', className)
    
    // Check for success indicators
    const successMessages = await page.locator('[class*="text-green"], [class*="success"]').allTextContents()
    console.log('Success messages found:', successMessages)
    
    // Check for checkmark icon
    const checkmarkIcon = await page.locator('.text-green-500').isVisible()
    console.log('Checkmark icon visible:', checkmarkIcon)
    
    // Take a screenshot to verify the fix
    await page.screenshot({ path: 'email-verification-fix-final.png' })
    
    // The code 544040 should be valid (6 digits, all numbers)
    // If the fix is working, there should be no error messages and the input should show as valid
    expect(errorMessages.length).toBe(0)
    expect(className).toContain('border-green-500')
  })
})
