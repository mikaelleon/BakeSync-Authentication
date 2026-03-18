// Bakeshop Info Cache - Reduces redundant API calls
import type { User } from "./auth-context"

interface BakeshopInfo {
  id: string
  name: string
  slug: string
  isDemo: boolean
  currency?: string
}

interface CacheEntry {
  info: BakeshopInfo | null
  timestamp: number
  userId: string
}

// Cache with 5 minute TTL
const CACHE_TTL = 5 * 60 * 1000
const cache = new Map<string, CacheEntry>()

export function getCachedBakeshopInfo(userId: string): BakeshopInfo | null | undefined {
  const entry = cache.get(userId)
  if (!entry) return undefined
  
  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(userId)
    return undefined
  }
  
  return entry.info
}

export function setCachedBakeshopInfo(userId: string, info: BakeshopInfo | null): void {
  cache.set(userId, {
    info,
    timestamp: Date.now(),
    userId
  })
}

export function clearBakeshopCache(userId?: string): void {
  if (userId) {
    cache.delete(userId)
  } else {
    cache.clear()
  }
}


