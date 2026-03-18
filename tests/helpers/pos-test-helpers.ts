// tests/helpers/pos-test-helpers.ts
/**
 * Helper utilities for POS tests
 */

import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { POSPage } from '../pages/POSPage';
import { TestUsers } from '../fixtures/test-data';

const testUser = TestUsers.posUser;

/**
 * Login and navigate to POS page
 * Returns the slug extracted from the dashboard URL
 * Throws error if user needs onboarding (test should skip)
 */
export async function loginAndNavigateToPOS(
  page: Page,
  loginPage: LoginPage,
  posPage: POSPage
): Promise<string> {
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
  
  // Wait for redirect - can go to dashboard or onboarding
  // Login uses window.location.href which causes full page reload, so wait longer
  await page.waitForURL(/.*\/(dashboard|onboarding)/, { timeout: 20000 });
  
  // If redirected to onboarding, throw error to skip test
  if (page.url().includes('/onboarding')) {
    throw new Error('SKIP_TEST: User needs onboarding');
  }
  
  // Extract slug from URL (format: /{slug}/dashboard)
  const url = page.url();
  const slugMatch = url.match(/\/([^\/]+)\/dashboard/);
  const slug = slugMatch ? slugMatch[1] : 'demo';
  
  // Navigate to POS
  await posPage.goto(slug);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for products to load
  
  return slug;
}
