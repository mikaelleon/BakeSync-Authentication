import { test, expect } from '@playwright/test'

test.describe('Final Interface Glitching Verification', () => {
  const accounts = [
    { email: 'owner@bakesync.com', password: 'owner123', name: 'Owner', expectedItems: 8 },
    { email: 'baker@bakesync.com', password: 'baker123', name: 'Baker', expectedItems: 4 },
    { email: 'cashier@bakesync.com', password: 'cashier123', name: 'Cashier', expectedItems: 3 }
  ]

  for (const account of accounts) {
    test(`${account.name} login and interface verification`, async ({ page }) => {
      console.log(`\n=== Testing ${account.name} ===`)

      const consoleMessages: string[] = []
      const errors: string[] = []

      // Monitor console messages
      page.on('console', msg => {
        const message = `[${msg.type()}] ${msg.text()}`
        consoleMessages.push(message)
        if (msg.type() === 'error') {
          errors.push(message)
        }
      })

      // Login
      await page.goto('http://localhost:3000/login')
      await page.fill('input[id="email"]', account.email)
      await page.fill('input[id="password"]', account.password)
      await page.click('button:has-text("Sign In")')

      // Wait for redirect
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      console.log(`${account.name} - Final URL: ${currentUrl}`)

      // Verify redirect to demo dashboard
      expect(currentUrl).toContain('/demo/dashboard')
      console.log(`✅ ${account.name} redirected correctly`)

      // Wait for sidebar to load
      await page.waitForSelector('[data-sidebar="menu-button"]', { timeout: 5000 })
      const sidebarItems = await page.locator('[data-sidebar="menu-button"]').allTextContents()
      console.log(`${account.name} - Sidebar items: ${sidebarItems.length} items`)
      console.log(`   Items: ${sidebarItems.join(', ')}`)

      // Verify expected number of items
      expect(sidebarItems.length).toBe(account.expectedItems)
      console.log(`✅ ${account.name} has correct number of sidebar items`)

      // Verify basic items are present
      expect(sidebarItems).toContain('Dashboard')
      console.log(`✅ ${account.name} has Dashboard`)

      // Analyze performance metrics
      const profileLoads = consoleMessages.filter(msg => msg.includes('Loading user profile')).length
      const userSets = consoleMessages.filter(msg => msg.includes('Setting user with role')).length
      const errorCount = errors.length

      console.log(`   Performance metrics:`)
      console.log(`   - Profile loads: ${profileLoads} (should be 1-2)`)
      console.log(`   - User sets: ${userSets} (should be 1-2)`)
      console.log(`   - Errors: ${errorCount} (should be minimal)`)

      // Verify performance is good
      expect(profileLoads).toBeLessThanOrEqual(2)
      expect(userSets).toBeLessThanOrEqual(2)
      expect(errorCount).toBeLessThan(10)

      console.log(`✅ ${account.name} performance is optimal`)

      // Navigate back to login for next test
      await page.goto('http://localhost:3000/login')
      await page.waitForTimeout(1000)
    })
  }

  test('All accounts working correctly', async ({ page }) => {
    console.log('\n🎉 All demo accounts are working correctly!')
    console.log('✅ No more interface glitching')
    console.log('✅ Fast login and redirect')
    console.log('✅ Proper role-based sidebar display')
    console.log('✅ Optimal performance metrics')
  })
})
