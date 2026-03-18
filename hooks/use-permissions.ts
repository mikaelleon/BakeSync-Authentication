'use client'

import { useAuth } from '@/lib/auth-context'
import { userManager } from '@/lib/user-management'

/**
 * Custom hook for permission checking
 * Provides easy access to user permissions and role-based checks
 *
 * @example
 * const { hasPermission, canManageInventory, canViewFinancials } = usePermissions()
 * if (hasPermission('viewFinancials')) {
 *   // render financial data
 * }
 */
export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return userManager.hasPermission(user.role, permission)
  }

  const getDataAccessScope = () => {
    if (!user) {
      return {
        canViewAll: false,
        canEditAll: false,
        canDeleteAll: false,
        canManageUsers: false,
        canViewFinancials: false,
        canManageInventory: false,
        canManageRecipes: false,
        canManageSuppliers: false,
        canAccessPOS: false
      }
    }
    return userManager.getDataAccessScope(user.role)
  }

  // Convenience properties
  const scope = getDataAccessScope()

  return {
    hasPermission,
    getDataAccessScope,
    // Direct access scope properties for convenience
    canViewAll: scope.canViewAll,
    canEditAll: scope.canEditAll,
    canDeleteAll: scope.canDeleteAll,
    canManageUsers: scope.canManageUsers,
    canViewFinancials: scope.canViewFinancials,
    canManageInventory: scope.canManageInventory,
    canManageRecipes: scope.canManageRecipes,
    canManageSuppliers: scope.canManageSuppliers,
    canAccessPOS: scope.canAccessPOS,
    // Role for conditional rendering
    userRole: user?.role,
    isOwner: user?.role === 'owner',
    isBaker: user?.role === 'baker',
    isCashier: user?.role === 'cashier'
  }
}
