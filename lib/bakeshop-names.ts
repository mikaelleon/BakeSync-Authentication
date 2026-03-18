// lib/bakeshop-names.ts

export function generateBakeshopSlug(businessName: string): string {
  const baseSlug = businessName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  // Add timestamp to make it unique
  const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
  return `${baseSlug}-${timestamp}`
}

export function getBakeshopDisplayName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function isValidBakeshopSlug(slug: string): boolean {
  // Check if slug follows the correct format (lowercase, hyphens, alphanumeric)
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && !slug.startsWith('-') && !slug.endsWith('-')
}

// Demo bakeshop for testing purposes
export const DEMO_BAKESHOP_SLUG = 'demo'
export const DEMO_BAKESHOP_NAME = 'Demo Bakery'
