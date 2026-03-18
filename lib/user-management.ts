// User Management Utilities for Data Consistency
import { createClient } from "@/lib/supabase-client"
import type { User, UserRole } from "./auth-context"

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'owner' | 'baker' | 'cashier'
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  email_confirmed_at?: string
  bakeshopId?: string
  bakeshopSlug?: string
  bakeshopName?: string
  permissions?: string[]
  preferences?: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  notifications: NotificationSettings
  dashboard: DashboardSettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  lowStock: boolean
  productionReminders: boolean
  teamUpdates: boolean
  systemAlerts: boolean
}

export interface DashboardSettings {
  defaultView: 'overview' | 'production' | 'sales' | 'inventory'
  widgets: string[]
  refreshInterval: number
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  description: string
  metadata?: Record<string, any>
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export class UserManager {
  private supabase = createClient()

  // Create or update user profile
  async createOrUpdateUserProfile(user: User): Promise<UserProfile> {
    // First, create or update the profile
    const { data: profileData, error: profileError } = await this.supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        is_active: true,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (profileError) throw profileError

    // Get the user's bakeshop membership to determine their role
    const { data: membershipData, error: membershipError } = await this.supabase
      .from('bakeshop_memberships')
      .select('user_role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle() // Use maybeSingle() to handle 0 rows gracefully

    if (membershipError && membershipError.code !== 'PGRST116') {
      throw membershipError
    }

    const userRole = membershipData?.user_role || user.role

    return {
      id: profileData.id,
      email: profileData.email,
      name: profileData.name,
      role: userRole,
      isActive: profileData.is_active,
      lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : undefined,
      createdAt: new Date(profileData.created_at),
      updatedAt: new Date(profileData.updated_at)
    }
  }

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get the profile data with bakeshop membership
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          bakeshop_memberships!inner(
            user_role,
            is_active,
            bakeshops!inner(
              id,
              name
            )
          )
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          // User has no memberships yet - try to get basic profile
          // This is expected for owners who haven't completed onboarding
          const { data: profileData } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
          
          if (profileData) {
            // Try to get role from user_metadata (set during signup)
            let userRole: UserRole = 'owner' // Default to owner for new signups
            try {
              const { data: authUser } = await this.supabase.auth.getUser()
              if (authUser?.user?.user_metadata?.role && ['owner', 'baker', 'cashier'].includes(authUser.user.user_metadata.role)) {
                userRole = authUser.user.user_metadata.role as UserRole
                console.log('getUserProfile: Using role from user_metadata:', userRole)
              } else {
                // Check localStorage for role (stored during signup)
                if (typeof window !== 'undefined') {
                  const pendingData = localStorage.getItem('pendingUserData')
                  const onboardingData = localStorage.getItem('onboardingData')
                  if (pendingData) {
                    try {
                      const parsed = JSON.parse(pendingData)
                      if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
                        userRole = parsed.role as UserRole
                        console.log('getUserProfile: Using role from pendingUserData:', userRole)
                      }
                    } catch (e) {
                      console.warn('Failed to parse pendingUserData:', e)
                    }
                  } else if (onboardingData) {
                    try {
                      const parsed = JSON.parse(onboardingData)
                      if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
                        userRole = parsed.role as UserRole
                        console.log('getUserProfile: Using role from onboardingData:', userRole)
                      }
                    } catch (e) {
                      console.warn('Failed to parse onboardingData:', e)
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('Error getting role from user_metadata, defaulting to owner:', err)
            }
            
            console.log('getUserProfile: No membership found, using role:', userRole, 'for user:', userId)
            return {
              id: profileData.id,
              email: profileData.email,
              name: profileData.name,
              role: userRole,
              isActive: profileData.is_active,
              lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : undefined,
              createdAt: new Date(profileData.created_at),
              updatedAt: new Date(profileData.updated_at),
              permissions: this.getUserPermissions(userRole),
              preferences: await this.getUserPreferences(userId)
            }
          }
          return null
        }
        throw error
      }

      if (!data) return null

      // Validate bakeshop membership exists
      if (!data.bakeshop_memberships || data.bakeshop_memberships.length === 0) {
        console.warn(`User ${userId} has no active bakeshop memberships`)
        // Try to get role from user_metadata (set during signup)
        let userRole: UserRole = 'owner' // Default to owner for new signups
        try {
          const { data: authUser } = await this.supabase.auth.getUser()
          if (authUser?.user?.user_metadata?.role && ['owner', 'baker', 'cashier'].includes(authUser.user.user_metadata.role)) {
            userRole = authUser.user.user_metadata.role as UserRole
            console.log('getUserProfile: Using role from user_metadata (no membership):', userRole)
          } else {
            // Check localStorage for role (stored during signup)
            if (typeof window !== 'undefined') {
              const pendingData = localStorage.getItem('pendingUserData')
              const onboardingData = localStorage.getItem('onboardingData')
              if (pendingData) {
                try {
                  const parsed = JSON.parse(pendingData)
                  if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
                    userRole = parsed.role as UserRole
                    console.log('getUserProfile: Using role from pendingUserData (no membership):', userRole)
                  }
                } catch (e) {
                  console.warn('Failed to parse pendingUserData:', e)
                }
              } else if (onboardingData) {
                try {
                  const parsed = JSON.parse(onboardingData)
                  if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
                    userRole = parsed.role as UserRole
                    console.log('getUserProfile: Using role from onboardingData (no membership):', userRole)
                  }
                } catch (e) {
                  console.warn('Failed to parse onboardingData:', e)
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error getting role from user_metadata (no membership), defaulting to owner:', err)
        }
        
        console.log('getUserProfile: No membership found, using role:', userRole)
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: userRole,
          isActive: data.is_active,
          lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          permissions: this.getUserPermissions(userRole),
          preferences: await this.getUserPreferences(userId)
        }
      }

      const membership = data.bakeshop_memberships[0]
      const bakeshop = membership?.bakeshops
      const userRole = membership.user_role || 'baker'

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: userRole,
        isActive: data.is_active && membership.is_active,
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        bakeshopId: bakeshop?.id,
        bakeshopName: bakeshop?.name,
        permissions: this.getUserPermissions(userRole),
        preferences: await this.getUserPreferences(userId)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  // Get all users (owner only)
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select(`
        *,
        bakeshop_memberships!inner(user_role)
      `)
      .eq('bakeshop_memberships.is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.bakeshop_memberships[0]?.user_role || 'baker',
      isActive: user.is_active,
      lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    }))
  }

  // Update user role (owner only)
  async updateUserRole(userId: string, newRole: 'owner' | 'baker' | 'cashier'): Promise<void> {
    const { error } = await this.supabase
      .from('bakeshop_memberships')
      .update({ 
        user_role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
  }

  // Deactivate user (owner only)
  async deactivateUser(userId: string): Promise<void> {
    // Deactivate the profile
    const { error: profileError } = await this.supabase
      .from('profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) throw profileError

    // Deactivate the bakeshop membership
    const { error: membershipError } = await this.supabase
      .from('bakeshop_memberships')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (membershipError) throw membershipError
  }

  // Check if user has permission
  hasPermission(userRole: 'owner' | 'baker' | 'cashier', permission: string): boolean {
    const permissions = {
      // Dashboard
      viewDashboard: ['owner', 'baker'],
      
      // Recipes
      viewRecipes: ['owner', 'baker'],
      createRecipe: ['owner'],
      editRecipe: ['owner'],
      deleteRecipe: ['owner'],
      
      // Inventory
      viewInventory: ['owner', 'baker'],
      addInventory: ['owner'],
      editInventory: ['owner'],
      logProduction: ['owner', 'baker'],
      
      // Supply Chain
      viewSuppliers: ['owner'],
      managePurchaseOrders: ['owner'],
      receiveDelivery: ['owner'],
      
      // POS
      accessPOS: ['owner', 'cashier'],
      
      // Financial
      viewFinancials: ['owner'],
      manageExpenses: ['owner'],
      generateReports: ['owner'],
      
      // User Management
      manageUsers: ['owner']
    }

    const allowedRoles = permissions[permission as keyof typeof permissions]
    return allowedRoles ? allowedRoles.includes(userRole) : false
  }

  // Get user's accessible data based on role
  getDataAccessScope(userRole: 'owner' | 'baker' | 'cashier') {
    switch (userRole) {
      case 'owner':
        return {
          canViewAll: true,
          canEditAll: true,
          canDeleteAll: true,
          canManageUsers: true,
          canViewFinancials: true,
          canManageInventory: true,
          canManageRecipes: true,
          canManageSuppliers: true,
          canAccessPOS: true
        }
      case 'baker':
        return {
          canViewAll: false,
          canEditAll: false,
          canDeleteAll: false,
          canManageUsers: false,
          canViewFinancials: false,
          canManageInventory: true,
          canManageRecipes: true,
          canManageSuppliers: false,
          canAccessPOS: false
        }
      case 'cashier':
        return {
          canViewAll: false,
          canEditAll: false,
          canDeleteAll: false,
          canManageUsers: false,
          canViewFinancials: false,
          canManageInventory: false,
          canManageRecipes: false,
          canManageSuppliers: false,
          canAccessPOS: true
        }
      default:
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
  }

  // Get user permissions array
  private getUserPermissions(role: 'owner' | 'baker' | 'cashier'): string[] {
    const permissions = {
      owner: [
        'view_dashboard', 'manage_users', 'manage_bakeshop', 'view_financials',
        'manage_inventory', 'manage_recipes', 'manage_production', 'manage_suppliers',
        'manage_purchase_orders', 'access_pos', 'manage_products', 'view_analytics',
        'manage_settings', 'manage_team', 'view_reports'
      ],
      baker: [
        'view_dashboard', 'view_recipes', 'manage_recipes', 'view_inventory',
        'manage_inventory', 'log_production', 'view_production', 'access_pos'
      ],
      cashier: [
        'view_dashboard', 'access_pos', 'manage_products', 'view_inventory',
        'process_sales', 'view_sales'
      ]
    }

    return permissions[role] || []
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data ? {
        theme: data.theme || 'system',
        language: data.language || 'en',
        timezone: data.timezone || 'UTC',
        notifications: data.notifications || this.getDefaultNotifications(),
        dashboard: data.dashboard || this.getDefaultDashboardSettings()
      } : this.getDefaultPreferences()
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return this.getDefaultPreferences()
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          theme: preferences.theme,
          language: preferences.language,
          timezone: preferences.timezone,
          notifications: preferences.notifications,
          dashboard: preferences.dashboard,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }
  }

  // Get user activity log
  async getUserActivityLog(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        description: log.description,
        metadata: log.metadata,
        timestamp: new Date(log.timestamp),
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      })) || []
    } catch (error) {
      console.error('Error fetching user activity log:', error)
      return []
    }
  }

  // Log user activity
  async logUserActivity(
    userId: string,
    action: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          bakeshop_id: null,
          action,
          description,
          metadata,
          timestamp: new Date().toISOString(),
          ip_address: typeof window !== 'undefined' ? 'client' : 'server',
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
        })

      if (error) throw error
    } catch (error) {
      console.error('Error logging user activity:', error)
      // Don't throw - logging shouldn't break the app
    }
  }

  // Default preferences helper
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications: this.getDefaultNotifications(),
      dashboard: this.getDefaultDashboardSettings()
    }
  }

  private getDefaultNotifications(): NotificationSettings {
    return {
      email: true,
      push: true,
      lowStock: true,
      productionReminders: true,
      teamUpdates: true,
      systemAlerts: true
    }
  }

  private getDefaultDashboardSettings(): DashboardSettings {
    return {
      defaultView: 'overview',
      widgets: ['recent_activity', 'inventory_alerts', 'production_status'],
      refreshInterval: 30
    }
  }
}

export const userManager = new UserManager()
