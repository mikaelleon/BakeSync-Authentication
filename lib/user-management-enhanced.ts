import { createClient } from "@/lib/supabase-client"
import type { UserRole } from "./auth-context"

export interface EnhancedUserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  bakeshopId?: string
  bakeshopName?: string
  permissions: string[]
  preferences: UserPreferences
  activityLog: ActivityLog[]
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

export class EnhancedUserManager {
  private supabase = createClient()

  async getUserProfile(userId: string): Promise<EnhancedUserProfile | null> {
    try {
      // First, try to get role from auth user metadata (for users who signed up but haven't completed onboarding)
      let defaultRole: 'owner' | 'baker' | 'cashier' = 'baker'
      try {
        const { data: authUser } = await this.supabase.auth.getUser()
        if (authUser?.user?.user_metadata?.role) {
          defaultRole = authUser.user.user_metadata.role as 'owner' | 'baker' | 'cashier'
        }
      } catch (err) {
        // If we can't get auth user, fall back to 'baker'
        console.warn('Could not get auth user metadata for role:', err)
      }

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
        .maybeSingle() // Use maybeSingle() to handle 0 rows gracefully (when user has no memberships)

      if (error) {
        if (error.code === 'PGRST116') {
          // User has no memberships yet - return a profile with the role from auth metadata
          // This handles the case where user signed up but hasn't completed onboarding
          const { data: profileData } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()
          
          if (profileData) {
            return {
              id: profileData.id,
              email: profileData.email,
              name: profileData.name,
              role: defaultRole,
              isActive: profileData.is_active,
              lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : undefined,
              createdAt: new Date(profileData.created_at),
              updatedAt: new Date(profileData.updated_at),
              bakeshopId: undefined,
              bakeshopName: undefined,
              permissions: this.getUserPermissions(defaultRole),
              preferences: await this.getUserPreferences(userId),
              activityLog: await this.getUserActivityLog(userId)
            }
          }
          return null
        }
        throw error
      }
      
      // If no data returned, user doesn't exist or has no memberships
      if (!data) return null

      // Validate that bakeshop_memberships array exists and has at least one element
      if (!data.bakeshop_memberships || data.bakeshop_memberships.length === 0) {
        console.warn(`User ${userId} has no active bakeshop memberships`)
        // Return profile with role from auth metadata if available
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          role: defaultRole,
          isActive: data.is_active,
          lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          bakeshopId: undefined,
          bakeshopName: undefined,
          permissions: this.getUserPermissions(defaultRole),
          preferences: await this.getUserPreferences(userId),
          activityLog: await this.getUserActivityLog(userId)
        }
      }

      const membership = data.bakeshop_memberships[0]
      const bakeshop = membership?.bakeshops

      // Validate membership data exists
      if (!membership) {
        console.warn(`User ${userId} has invalid membership data`)
        return null
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        role: membership.user_role || defaultRole,
        isActive: data.is_active && membership.is_active,
        lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        bakeshopId: bakeshop?.id,
        bakeshopName: bakeshop?.name,
        permissions: this.getUserPermissions(membership.user_role || 'baker'),
        preferences: await this.getUserPreferences(userId),
        activityLog: await this.getUserActivityLog(userId)
      }
    } catch (error) {
      console.error('Error fetching enhanced user profile:', error)
      throw error
    }
  }

  async updateUserProfile(userId: string, updates: Partial<EnhancedUserProfile>): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          name: updates.name,
          is_active: updates.isActive,
          last_login_at: updates.lastLoginAt?.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Update preferences if provided
      if (updates.preferences) {
        await this.updateUserPreferences(userId, updates.preferences)
      }

      // TODO: Store bakeshop info in a separate table or add columns to profiles table
      // For now, we'll skip storing bakeshop info in user preferences
      // as the user_preferences table doesn't have these columns
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

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
        notifications: data.notifications || {
          email: true,
          push: true,
          lowStock: true,
          productionReminders: true,
          teamUpdates: true,
          systemAlerts: true
        },
        dashboard: data.dashboard || {
          defaultView: 'overview',
          widgets: ['recent_activity', 'inventory_alerts', 'production_status'],
          refreshInterval: 30
        }
      } : {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          lowStock: true,
          productionReminders: true,
          teamUpdates: true,
          systemAlerts: true
        },
        dashboard: {
          defaultView: 'overview',
          widgets: ['recent_activity', 'inventory_alerts', 'production_status'],
          refreshInterval: 30
        }
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return this.getDefaultPreferences()
    }
  }

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

  async getUserActivityLog(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data.map(log => ({
        id: log.id,
        userId: log.user_id,
        action: log.action,
        description: log.description,
        metadata: log.metadata,
        timestamp: new Date(log.timestamp),
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }))
    } catch (error) {
      console.error('Error fetching user activity log:', error)
      return []
    }
  }

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
          bakeshop_id: null, // Will be set by the calling function
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

  private getUserPermissions(role: UserRole): string[] {
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

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        lowStock: true,
        productionReminders: true,
        teamUpdates: true,
        systemAlerts: true
      },
      dashboard: {
        defaultView: 'overview',
        widgets: ['recent_activity', 'inventory_alerts', 'production_status'],
        refreshInterval: 30
      }
    }
  }
}

export const enhancedUserManager = new EnhancedUserManager()
