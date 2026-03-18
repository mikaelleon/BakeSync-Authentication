import { test, expect } from '@playwright/test'

test.describe('Email Verification to Onboarding Flow', () => {
  test('new user should be redirected to onboarding after email verification', async ({ page }) => {
    // Navigate to verify-email page with a new user email
    await page.goto('/verify-email?email=keochan.artizea@gmail.com')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    
    // Wait for the form to appear
    await page.waitForSelector('input[name="code"]')
    
    // Mock a verified user without bakeshopId (new user)
    await page.evaluate(() => {
      // Mock a verified user in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'keochan.artizea@gmail.com',
        email_confirmed_at: new Date().toISOString(),
        role: 'owner',
        bakeshopId: null, // No bakeshopId means user needs onboarding
        bakeshopSlug: null
      }))
    })
    
    // Enter a valid 6-digit code
    await page.fill('input[name="code"]', '123456')
    
    // Click verify button
    await page.click('button:has-text("Verify Email")')
    
    // Should redirect to onboarding page
    await page.waitForURL('**/onboarding**')
    
    // Verify we're on the onboarding page
    await expect(page.locator('h1')).toContainText(/onboarding|setup|welcome/i)
  })

  test('existing user with bakeshop should be redirected to dashboard after email verification', async ({ page }) => {
    // Navigate to verify-email page
    await page.goto('/verify-email?email=existing@example.com')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    
    // Wait for the form to appear
    await page.waitForSelector('input[name="code"]')
    
    // Mock a verified user with bakeshopId (existing user)
    await page.evaluate(() => {
      // Mock a verified user in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'existing@example.com',
        email_confirmed_at: new Date().toISOString(),
        role: 'owner',
        bakeshopId: 'bakeshop-123',
        bakeshopSlug: 'my-bakery'
      }))
    })
    
    // Enter a valid 6-digit code
    await page.fill('input[name="code"]', '123456')
    
    // Click verify button
    await page.click('button:has-text("Verify Email")')
    
    // Should redirect to user's bakeshop dashboard
    await page.waitForURL('**/my-bakery/dashboard**')
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText(/dashboard/i)
  })

  test('demo user should be redirected to demo dashboard after email verification', async ({ page }) => {
    // Navigate to verify-email page with demo user email
    await page.goto('/verify-email?email=owner@bakesync.com')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Click the "Send Verification Code" button to show the form
    await page.click('button:has-text("Send Verification Code")')
    
    // Wait for the form to appear
    await page.waitForSelector('input[name="code"]')
    
    // Mock a verified demo user
    await page.evaluate(() => {
      // Mock a verified user in localStorage
      localStorage.setItem('user', JSON.stringify({
        id: 'demo-user-id',
        email: 'owner@bakesync.com',
        email_confirmed_at: new Date().toISOString(),
        role: 'owner',
        bakeshopId: null,
        bakeshopSlug: null
      }))
    })
    
    // Enter a valid 6-digit code
    await page.fill('input[name="code"]', '123456')
    
    // Click verify button
    await page.click('button:has-text("Verify Email")')
    
    // Should redirect to demo dashboard
    await page.waitForURL('**/demo/dashboard**')
    
    // Verify we're on the demo dashboard
    await expect(page.locator('h1')).toContainText(/dashboard/i)
  })
})
