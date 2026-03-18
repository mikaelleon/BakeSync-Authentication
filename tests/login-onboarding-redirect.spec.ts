import { test, expect } from '@playwright/test'

test.describe('Login Onboarding Redirect Flow', () => {
  test('new user should be redirected to onboarding after login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in login form with new user credentials
    await page.fill('input[name="email"]', 'keochan.artizea@gmail.com')
    await page.fill('input[name="password"]', 'owner123')
    
    // Mock the login response to simulate a new user without bakeshopId
    await page.route('**/auth/v1/token*', async route => {
      const response = await route.fetch()
      const data = await response.json()
      
      // Mock successful login response
      const mockResponse = {
        ...data,
        user: {
          id: 'new-user-id',
          email: 'keochan.artizea@gmail.com',
          email_confirmed_at: new Date().toISOString(),
          role: 'owner'
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })
    
    // Mock the user profile response to simulate no bakeshopId
    await page.route('**/rest/v1/user_profiles*', async route => {
      const mockResponse = {
        id: 'new-user-id',
        email: 'keochan.artizea@gmail.com',
        name: 'Test User',
        role: 'owner',
        bakeshopId: null, // No bakeshopId means user needs onboarding
        bakeshopSlug: null
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })
    
    // Click login button
    await page.click('button:has-text("Sign In")')
    
    // Should redirect to onboarding page
    await page.waitForURL('**/onboarding**')
    
    // Verify we're on the onboarding page
    await expect(page.locator('h1')).toContainText(/onboarding|setup|welcome/i)
  })

  test('existing user with bakeshop should be redirected to their dashboard after login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in login form with existing user credentials
    await page.fill('input[name="email"]', 'existing@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Mock the login response
    await page.route('**/auth/v1/token*', async route => {
      const response = await route.fetch()
      const data = await response.json()
      
      const mockResponse = {
        ...data,
        user: {
          id: 'existing-user-id',
          email: 'existing@example.com',
          email_confirmed_at: new Date().toISOString(),
          role: 'owner'
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })
    
    // Mock the user profile response with bakeshopId
    await page.route('**/rest/v1/user_profiles*', async route => {
      const mockResponse = {
        id: 'existing-user-id',
        email: 'existing@example.com',
        name: 'Existing User',
        role: 'owner',
        bakeshopId: 'bakeshop-123',
        bakeshopSlug: 'my-bakery'
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })
    
    // Click login button
    await page.click('button:has-text("Sign In")')
    
    // Should redirect to user's bakeshop dashboard
    await page.waitForURL('**/my-bakery/dashboard**')
    
    // Verify we're on the dashboard
    await expect(page.locator('h1')).toContainText(/dashboard/i)
  })

  test('demo user should be redirected to demo dashboard after login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in login form with demo user credentials
    await page.fill('input[name="email"]', 'owner@bakesync.com')
    await page.fill('input[name="password"]', 'owner123')
    
    // Mock the login response
    await page.route('**/auth/v1/token*', async route => {
      const response = await route.fetch()
      const data = await response.json()
      
      const mockResponse = {
        ...data,
        user: {
          id: 'demo-user-id',
          email: 'owner@bakesync.com',
          email_confirmed_at: new Date().toISOString(),
          role: 'owner'
        }
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })
    
    // Mock the user profile response for demo user
    await page.route('**/rest/v1/user_profiles*', async route => {
      const mockResponse = {
        id: 'demo-user-id',
        email: 'owner@bakesync.com',
        name: 'Demo Owner',
        role: 'owner',
        bakeshopId: null,
        bakeshopSlug: null
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      })
    })
    
    // Click login button
    await page.click('button:has-text("Sign In")')
    
    // Should redirect to demo dashboard
    await page.waitForURL('**/demo/dashboard**')
    
    // Verify we're on the demo dashboard
    await expect(page.locator('h1')).toContainText(/dashboard/i)
  })
})
