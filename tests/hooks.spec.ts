import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePermissions } from '@/hooks/use-permissions'
import { useArrayState } from '@/hooks/use-array-state'
import { userManager } from '@/lib/user-management'
import { useAuth } from '@/lib/auth-context'

// Mock the auth context
vi.mock('@/lib/auth-context', () => ({
  useAuth: vi.fn()
}))

describe('usePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false for all permissions when user is not authenticated', () => {
    ;(useAuth as any).mockReturnValue({ user: null })

    const { hasPermission, canManageInventory, canViewFinancials } = usePermissions()

    expect(hasPermission('viewDashboard')).toBe(false)
    expect(canManageInventory).toBe(false)
    expect(canViewFinancials).toBe(false)
  })

  it('returns correct permissions for owner role', () => {
    ;(useAuth as any).mockReturnValue({
      user: { role: 'owner', id: '123', email: 'owner@test.com' }
    })

    const {
      hasPermission,
      canManageInventory,
      canViewFinancials,
      canAccessPOS,
      isOwner,
      isBaker
    } = usePermissions()

    expect(isOwner).toBe(true)
    expect(isBaker).toBe(false)
    expect(canManageInventory).toBe(true)
    expect(canViewFinancials).toBe(true)
    expect(canAccessPOS).toBe(true)
    expect(hasPermission('manageUsers')).toBe(true)
  })

  it('returns correct permissions for baker role', () => {
    ;(useAuth as any).mockReturnValue({
      user: { role: 'baker', id: '123', email: 'baker@test.com' }
    })

    const { hasPermission, canViewFinancials, canManageInventory, isBaker } = usePermissions()

    expect(isBaker).toBe(true)
    expect(canManageInventory).toBe(true)
    expect(canViewFinancials).toBe(false)
    expect(hasPermission('manageUsers')).toBe(false)
  })

  it('returns correct permissions for cashier role', () => {
    ;(useAuth as any).mockReturnValue({
      user: { role: 'cashier', id: '123', email: 'cashier@test.com' }
    })

    const { hasPermission, canAccessPOS, canManageInventory, isCashier } = usePermissions()

    expect(isCashier).toBe(true)
    expect(canAccessPOS).toBe(true)
    expect(canManageInventory).toBe(false)
    expect(hasPermission('viewFinancials')).toBe(false)
  })
})

describe('useArrayState Hook', () => {
  it('returns array as-is when data is already an array', () => {
    const data = [1, 2, 3]
    const result = useArrayState(data)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([1, 2, 3])
  })

  it('wraps single item in array', () => {
    const data = 'single-item'
    const result = useArrayState(data)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(['single-item'])
  })

  it('returns default value for null', () => {
    const result = useArrayState(null, ['default'])

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual(['default'])
  })

  it('returns default value for undefined', () => {
    const result = useArrayState(undefined, [])

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([])
  })

  it('returns empty array as default when not provided', () => {
    const result = useArrayState(null)

    expect(Array.isArray(result)).toBe(true)
    expect(result).toEqual([])
  })
})
