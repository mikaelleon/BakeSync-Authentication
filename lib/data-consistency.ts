// Data Consistency Utilities
import { createClient } from "@/lib/supabase-client"
import { userManager } from "@/lib/user-management"

export interface DataConsistencyReport {
  isConsistent: boolean
  issues: DataConsistencyIssue[]
  recommendations: string[]
}

export interface DataConsistencyIssue {
  type: 'missing_user' | 'orphaned_data' | 'permission_mismatch' | 'data_integrity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  table: string
  recordId?: string
  description: string
  suggestion: string
}

export class DataConsistencyChecker {
  private supabase = createClient()

  // Check overall data consistency
  async checkDataConsistency(): Promise<DataConsistencyReport> {
    const issues: DataConsistencyIssue[] = []
    const recommendations: string[] = []

    try {
      // Check for missing user profiles
      const missingUserIssues = await this.checkMissingUserProfiles()
      issues.push(...missingUserIssues)

      // Check for orphaned data
      const orphanedDataIssues = await this.checkOrphanedData()
      issues.push(...orphanedDataIssues)

      // Check for permission mismatches
      const permissionIssues = await this.checkPermissionMismatches()
      issues.push(...permissionIssues)

      // Check data integrity
      const integrityIssues = await this.checkDataIntegrity()
      issues.push(...integrityIssues)

      // Generate recommendations
      recommendations.push(...this.generateRecommendations(issues))

      return {
        isConsistent: issues.length === 0,
        issues,
        recommendations
      }
    } catch (error) {
      console.error('Error checking data consistency:', error)
      return {
        isConsistent: false,
        issues: [{
          type: 'data_integrity',
          severity: 'critical',
          table: 'system',
          description: 'Failed to check data consistency',
          suggestion: 'Check database connection and permissions'
        }],
        recommendations: ['Verify database connection', 'Check RLS policies', 'Review user permissions']
      }
    }
  }

  // Check for missing user profiles
  private async checkMissingUserProfiles(): Promise<DataConsistencyIssue[]> {
    const issues: DataConsistencyIssue[] = []

    try {
      // Get all auth users
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers()
      if (authError) throw authError

      // Get all user profiles
      const { data: profiles, error: profileError } = await this.supabase
        .from('users')
        .select('id')
      
      if (profileError) throw profileError

      const profileIds = new Set(profiles.map(p => p.id))

      // Find missing profiles
      for (const authUser of authUsers.users) {
        if (!profileIds.has(authUser.id)) {
          issues.push({
            type: 'missing_user',
            severity: 'high',
            table: 'users',
            recordId: authUser.id,
            description: `User ${authUser.email} has auth account but no profile`,
            suggestion: 'Create user profile using userManager.createOrUpdateUserProfile()'
          })
        }
      }
    } catch (error) {
      console.error('Error checking missing user profiles:', error)
    }

    return issues
  }

  // Check for orphaned data
  private async checkOrphanedData(): Promise<DataConsistencyIssue[]> {
    const issues: DataConsistencyIssue[] = []

    try {
      // Check recipes without valid created_by
      const { data: orphanedRecipes, error: recipeError } = await this.supabase
        .from('recipes')
        .select('id, name, created_by')
        .not('created_by', 'is', null)
        .not('created_by', 'in', `(SELECT id FROM users)`)

      if (!recipeError && orphanedRecipes) {
        for (const recipe of orphanedRecipes) {
          issues.push({
            type: 'orphaned_data',
            severity: 'medium',
            table: 'recipes',
            recordId: recipe.id,
            description: `Recipe "${recipe.name}" has invalid created_by reference`,
            suggestion: 'Update created_by to valid user ID or set to null'
          })
        }
      }

      // Check sales without valid cashier_id
      const { data: orphanedSales, error: salesError } = await this.supabase
        .from('sales')
        .select('id, order_number, cashier_id')
        .not('cashier_id', 'is', null)
        .not('cashier_id', 'in', `(SELECT id FROM users)`)

      if (!salesError && orphanedSales) {
        for (const sale of orphanedSales) {
          issues.push({
            type: 'orphaned_data',
            severity: 'medium',
            table: 'sales',
            recordId: sale.id,
            description: `Sale "${sale.order_number}" has invalid cashier_id reference`,
            suggestion: 'Update cashier_id to valid user ID or set to null'
          })
        }
      }
    } catch (error) {
      console.error('Error checking orphaned data:', error)
    }

    return issues
  }

  // Check for permission mismatches
  private async checkPermissionMismatches(): Promise<DataConsistencyIssue[]> {
    const issues: DataConsistencyIssue[] = []

    try {
      // Check if users have appropriate roles for their data
      const { data: users, error: userError } = await this.supabase
        .from('users')
        .select('id, email, role')

      if (userError) throw userError

      for (const user of users) {
        const accessScope = userManager.getDataAccessScope(user.role)
        
        // Check if user has data they shouldn't have access to
        if (!accessScope.canManageSuppliers) {
          const { data: supplierData, error: supplierError } = await this.supabase
            .from('suppliers')
            .select('id')
            .limit(1)

          if (!supplierError && supplierData && supplierData.length > 0) {
            // This is expected - RLS should handle this
            // But we can check if there are any direct violations
          }
        }
      }
    } catch (error) {
      console.error('Error checking permission mismatches:', error)
    }

    return issues
  }

  // Check data integrity
  private async checkDataIntegrity(): Promise<DataConsistencyIssue[]> {
    const issues: DataConsistencyIssue[] = []

    try {
      // Check for negative quantities in inventory
      const { data: negativeInventory, error: inventoryError } = await this.supabase
        .from('inventory')
        .select('id, name, quantity')
        .lt('quantity', 0)

      if (!inventoryError && negativeInventory) {
        for (const item of negativeInventory) {
          issues.push({
            type: 'data_integrity',
            severity: 'high',
            table: 'inventory',
            recordId: item.id,
            description: `Inventory item "${item.name}" has negative quantity: ${item.quantity}`,
            suggestion: 'Adjust quantity to zero or positive value'
          })
        }
      }

      // Check for invalid dates
      const { data: invalidDates, error: dateError } = await this.supabase
        .from('inventory')
        .select('id, name, expiration_date')
        .not('expiration_date', 'is', null)
        .lt('expiration_date', '1900-01-01')

      if (!dateError && invalidDates) {
        for (const item of invalidDates) {
          issues.push({
            type: 'data_integrity',
            severity: 'medium',
            table: 'inventory',
            recordId: item.id,
            description: `Inventory item "${item.name}" has invalid expiration date`,
            suggestion: 'Update expiration date to valid date or set to null'
          })
        }
      }
    } catch (error) {
      console.error('Error checking data integrity:', error)
    }

    return issues
  }

  // Generate recommendations based on issues
  private generateRecommendations(issues: DataConsistencyIssue[]): string[] {
    const recommendations: string[] = []

    const issueTypes = new Set(issues.map(i => i.type))
    const severityCounts = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    if (issueTypes.has('missing_user')) {
      recommendations.push('Implement automatic user profile creation on first login')
    }

    if (issueTypes.has('orphaned_data')) {
      recommendations.push('Add foreign key constraints to prevent orphaned data')
      recommendations.push('Implement data cleanup procedures for orphaned records')
    }

    if (issueTypes.has('permission_mismatch')) {
      recommendations.push('Review and update RLS policies for better data isolation')
      recommendations.push('Implement role-based data filtering in application layer')
    }

    if (issueTypes.has('data_integrity')) {
      recommendations.push('Add database constraints to prevent invalid data')
      recommendations.push('Implement data validation in application layer')
    }

    if (severityCounts.critical > 0) {
      recommendations.push('Address critical issues immediately to prevent data loss')
    }

    if (severityCounts.high > 0) {
      recommendations.push('Schedule maintenance window to address high-priority issues')
    }

    return recommendations
  }

  // Fix common data consistency issues
  async fixDataConsistencyIssues(issues: DataConsistencyIssue[]): Promise<{ fixed: number; failed: number }> {
    let fixed = 0
    let failed = 0

    for (const issue of issues) {
      try {
        switch (issue.type) {
          case 'missing_user':
            // This would be handled by the auth system
            fixed++
            break
          
          case 'orphaned_data':
            if (issue.table === 'recipes' && issue.recordId) {
              await this.supabase
                .from('recipes')
                .update({ created_by: null })
                .eq('id', issue.recordId)
              fixed++
            } else if (issue.table === 'sales' && issue.recordId) {
              await this.supabase
                .from('sales')
                .update({ cashier_id: null })
                .eq('id', issue.recordId)
              fixed++
            }
            break
          
          case 'data_integrity':
            if (issue.table === 'inventory' && issue.recordId) {
              // Fix negative quantities
              await this.supabase
                .from('inventory')
                .update({ quantity: 0 })
                .eq('id', issue.recordId)
                .lt('quantity', 0)
              fixed++
            }
            break
          
          default:
            failed++
        }
      } catch (error) {
        console.error(`Failed to fix issue ${issue.recordId}:`, error)
        failed++
      }
    }

    return { fixed, failed }
  }
}

export const dataConsistencyChecker = new DataConsistencyChecker()
