// Account Type Detection & Environment Logic
// Phase 1: Critical Foundation - BakeSync ERP

import type { User } from "./auth-context"

export interface BakeshopInfo {
  id: string
  name: string
  slug: string
  isDemo: boolean
}

export interface AccountEnvironment {
  type: 'demo' | 'production'
  bakeshop: BakeshopInfo | null
  needsOnboarding: boolean
}

/**
 * Check if a user account is a demo account
 * Demo accounts are identified by @bakesync.com email domain
 */
export function isDemoAccount(user: User): boolean {
  if (!user?.email) return false
  return user.email.endsWith('@bakesync.com')
}

/**
 * Get the bakeshop slug for URL generation
 * Demo accounts use 'demo', production accounts use their business slug
 */
export function getBakeshopSlug(user: User, bakeshopInfo?: BakeshopInfo): string {
  if (isDemoAccount(user)) {
    return 'demo'
  }
  // Prefer user.bakeshopSlug if available, then bakeshopInfo, then default
  return user.bakeshopSlug || bakeshopInfo?.slug || 'default'
}

/**
 * Generate URL path with appropriate prefix based on account type
 */
export function generateUrlPath(path: string, user: User, bakeshopInfo?: BakeshopInfo): string {
  const slug = getBakeshopSlug(user, bakeshopInfo)
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  return `/${slug}/${cleanPath}`
}

/**
 * Parse URL to extract bakeshop slug and path
 */
export function parseUrlPath(urlPath: string): { slug: string; path: string } {
  const segments = urlPath.split('/').filter(Boolean)
  
  if (segments.length === 0) {
    return { slug: '', path: '' }
  }
  
  const slug = segments[0]
  const path = segments.slice(1).join('/')
  
  return { slug, path }
}

/**
 * Check if a URL path is for demo environment
 */
export function isDemoUrl(urlPath: string): boolean {
  const { slug } = parseUrlPath(urlPath)
  return slug === 'demo'
}

/**
 * Check if a URL path is for production environment
 */
export function isProductionUrl(urlPath: string): boolean {
  const { slug } = parseUrlPath(urlPath)
  return slug !== 'demo' && slug !== ''
}

/**
 * Get account environment information
 */
export function getAccountEnvironment(user: User, bakeshopInfo?: BakeshopInfo): AccountEnvironment {
  const isDemo = isDemoAccount(user)
  
  return {
    type: isDemo ? 'demo' : 'production',
    bakeshop: bakeshopInfo || null,
    needsOnboarding: false // This will be determined by onboarding completion check
  }
}

/**
 * Validate business name for slug generation
 */
export function validateBusinessName(businessName: string): { isValid: boolean; error?: string } {
  if (!businessName || businessName.trim().length === 0) {
    return { isValid: false, error: 'Business name is required' }
  }
  
  if (businessName.trim().length < 2) {
    return { isValid: false, error: 'Business name must be at least 2 characters long' }
  }
  
  if (businessName.trim().length > 50) {
    return { isValid: false, error: 'Business name must be less than 50 characters' }
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(businessName)) {
    return { isValid: false, error: 'Business name contains invalid characters' }
  }
  
  return { isValid: true }
}

/**
 * Generate a URL-friendly slug from business name (client-side version)
 * This matches the server-side generate_business_slug function
 */
export function generateBusinessSlug(businessName: string): string {
  // Convert to lowercase and replace non-alphanumeric characters with hyphens
  let slug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Ensure slug is not empty
  if (!slug) {
    slug = 'business'
  }
  
  return slug
}

/**
 * Check if user should be redirected to onboarding
 */
export function shouldRedirectToOnboarding(
  user: User, 
  onboardingStatus: { isCompleted: boolean; needsOnboarding: boolean }
): boolean {
  // Demo accounts don't need onboarding
  if (isDemoAccount(user)) {
    return false
  }
  
  // Baker and cashier roles don't need onboarding
  if (user.role === 'baker' || user.role === 'cashier') {
    return false
  }
  
  // Production accounts need onboarding if not completed
  return !onboardingStatus.isCompleted && onboardingStatus.needsOnboarding
}

/**
 * Get the appropriate redirect path after login
 */
export function getPostLoginRedirectPath(
  user: User, 
  onboardingStatus: { isCompleted: boolean; needsOnboarding: boolean },
  bakeshopInfo?: BakeshopInfo
): string {
  // Check if user needs onboarding
  if (shouldRedirectToOnboarding(user, onboardingStatus)) {
    return '/onboarding'
  }
  
  // Generate appropriate dashboard URL
  return generateUrlPath('/dashboard', user, bakeshopInfo)
}

/**
 * Check if current route matches user's environment
 */
export function isRouteAccessible(
  currentPath: string,
  user: User,
  bakeshopInfo?: BakeshopInfo
): boolean {
  const { slug } = parseUrlPath(currentPath)
  const expectedSlug = getBakeshopSlug(user, bakeshopInfo)
  
  return slug === expectedSlug
}

/**
 * Get environment-specific data loading strategy
 */
export function getDataLoadingStrategy(user: User): 'demo' | 'production' | 'mixed' {
  if (isDemoAccount(user)) {
    return 'demo'
  }
  
  // For now, production accounts use mixed strategy
  // This will be refined in Phase 4
  return 'production'
}
