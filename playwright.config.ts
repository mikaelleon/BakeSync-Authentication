// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

// Validate base URL configuration
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
  throw new Error(
    'Invalid PLAYWRIGHT_BASE_URL. Must start with http:// or https://'
  );
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // WebKit is optional - skip if SKIP_WEBKIT env var is set
    ...(process.env.SKIP_WEBKIT
      ? []
      : [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]),
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});