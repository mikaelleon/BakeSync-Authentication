import { test, expect } from '@playwright/test'

test.describe('Interface Glitching Analysis', () => {
  const accounts = [
    { email: 'owner@bakesync.com', password: 'owner123', name: 'Owner' },
    { email: 'baker@bakesync.com', password: 'baker123', name: 'Baker' },
    { email: 'cashier@bakesync.com', password: 'cashier123', name: 'Cashier' }
  ]

  for (const account of accounts) {
    test(`${account.name} interface glitching analysis`, async ({ page }) => {
      console.log(`\n=== Analyzing ${account.name} Interface Glitching ===\n`)

      const consoleMessages: string[] = []
      const networkRequests: string[] = []
      const errors: string[] = []

      // Monitor console messages
      page.on('console', msg => {
        const message = `[${msg.type()}] ${msg.text()}`
        consoleMessages.push(message)
        if (msg.type() === 'error') {
          errors.push(message)
        }
      })

      // Monitor network requests
      page.on('request', request => {
        networkRequests.push(`${request.method()} ${request.url()}`)
      })

      // Monitor page errors
      page.on('pageerror', error => {
        errors.push(`Page Error: ${error.message}`)
      })

      // Navigate to login
      console.log('1. Navigating to login page...')
      await page.goto('http://localhost:3000/login')
      await page.waitForTimeout(2000)

      // Fill login form
      console.log('2. Filling login form...')
      await page.fill('input[id="email"]', account.email)
      await page.fill('input[id="password"]', account.password)
      
      // Click login and monitor what happens
      console.log('3. Clicking login button...')
      await page.click('button:has-text("Sign In")')

      // Monitor the transition period
      console.log('4. Monitoring transition period...')
      let currentUrl = page.url()
      let urlChanges = 0
      const maxWaitTime = 10000 // 10 seconds
      const startTime = Date.now()

      while (Date.now() - startTime < maxWaitTime) {
        const newUrl = page.url()
        if (newUrl !== currentUrl) {
          urlChanges++
          console.log(`   URL change ${urlChanges}: ${currentUrl} -> ${newUrl}`)
          currentUrl = newUrl
        }
        await page.waitForTimeout(100)
      }

      console.log(`5. Final URL after ${maxWaitTime}ms: ${currentUrl}`)
      console.log(`   Total URL changes: ${urlChanges}`)

      // Check if we reached the dashboard
      if (currentUrl.includes('/demo/dashboard')) {
        console.log('✅ Successfully reached dashboard')
        
        // Wait for sidebar to load
        console.log('6. Waiting for sidebar to load...')
        try {
          await page.waitForSelector('[data-sidebar="menu-button"]', { timeout: 5000 })
          const sidebarItems = await page.locator('[data-sidebar="menu-button"]').allTextContents()
          console.log(`   Sidebar items loaded: ${sidebarItems.length} items`)
          console.log(`   Items: ${sidebarItems.join(', ')}`)
        } catch (e) {
          console.log('❌ Sidebar failed to load within timeout')
        }

        // Check for any loading states or glitches
        console.log('7. Checking for loading states...')
        const loadingElements = await page.locator('[data-loading="true"], .loading, .spinner').count()
        console.log(`   Loading elements found: ${loadingElements}`)

        // Check for error states
        console.log('8. Checking for error states...')
        const errorElements = await page.locator('[data-error="true"], .error, [role="alert"]').count()
        console.log(`   Error elements found: ${errorElements}`)

      } else {
        console.log('❌ Failed to reach dashboard')
        console.log(`   Stuck at: ${currentUrl}`)
      }

      // Analyze console errors
      console.log('\n9. Console Error Analysis:')
      if (errors.length > 0) {
        console.log(`   Total errors: ${errors.length}`)
        errors.slice(0, 10).forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`)
        })
        if (errors.length > 10) {
          console.log(`   ... and ${errors.length - 10} more errors`)
        }
      } else {
        console.log('   No console errors detected')
      }

      // Analyze network requests
      console.log('\n10. Network Request Analysis:')
      const failedRequests = networkRequests.filter(req => req.includes('404') || req.includes('406') || req.includes('500'))
      console.log(`   Total requests: ${networkRequests.length}`)
      console.log(`   Failed requests: ${failedRequests.length}`)
      if (failedRequests.length > 0) {
        console.log('   Failed requests:')
        failedRequests.slice(0, 5).forEach((req, i) => {
          console.log(`   ${i + 1}. ${req}`)
        })
      }

      // Check for specific glitching patterns
      console.log('\n11. Glitching Pattern Analysis:')
      
      // Check if user object is being set multiple times
      const userSetMessages = consoleMessages.filter(msg => msg.includes('Setting user with role'))
      console.log(`   User object set ${userSetMessages.length} times`)
      
      // Check for profile loading issues
      const profileLoadMessages = consoleMessages.filter(msg => msg.includes('Loading user profile'))
      console.log(`   Profile loaded ${profileLoadMessages.length} times`)
      
      // Check for role assignment issues
      const roleMessages = consoleMessages.filter(msg => msg.includes('role') && msg.includes('assigned'))
      console.log(`   Role assignment messages: ${roleMessages.length}`)

      // Take a screenshot for visual analysis
      await page.screenshot({ 
        path: `interface-glitching-${account.name.toLowerCase()}.png`, 
        fullPage: true 
      })
      console.log(`   Screenshot saved: interface-glitching-${account.name.toLowerCase()}.png`)

      console.log(`\n=== ${account.name} Analysis Complete ===\n`)
    })
  }
})
