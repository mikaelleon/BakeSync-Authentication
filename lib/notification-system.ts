import { createClient } from "@/lib/supabase-client"
import type { NotificationSettings as UserNotificationSettings } from "@/lib/user-management-enhanced"

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: Date
  readAt?: Date
  expiresAt?: Date
}

export type NotificationType = 
  | 'inventory_low_stock'
  | 'inventory_critical_stock'
  | 'production_reminder'
  | 'team_invitation'
  | 'team_member_joined'
  | 'team_member_left'
  | 'purchase_order_received'
  | 'purchase_order_delayed'
  | 'system_alert'
  | 'security_alert'
  | 'general'

export interface NotificationSettings {
  userId: string
  email: boolean
  push: boolean
  inApp: boolean
  types: Record<NotificationType, boolean>
  quietHours: {
    enabled: boolean
    start: string // HH:MM format
    end: string // HH:MM format
    timezone: string
  }
}

export class NotificationManager {
  private supabase = createClient()

  // Map notification types to user preference keys
  private getPreferenceKeyForType(type: NotificationType): keyof UserNotificationSettings | null {
    const typeToPreferenceMap: Record<NotificationType, keyof UserNotificationSettings | null> = {
      'inventory_low_stock': 'lowStock',
      'inventory_critical_stock': 'lowStock',
      'production_reminder': 'productionReminders',
      'team_invitation': 'teamUpdates',
      'team_member_joined': 'teamUpdates',
      'team_member_left': 'teamUpdates',
      'purchase_order_received': 'systemAlerts',
      'purchase_order_delayed': 'systemAlerts',
      'system_alert': 'systemAlerts',
      'security_alert': 'systemAlerts',
      'general': null // Always allow general notifications
    }
    return typeToPreferenceMap[type] || null
  }

  // Check if user has enabled this notification type
  private async shouldCreateNotification(userId: string, type: NotificationType): Promise<boolean> {
    try {
      // Get user preferences from user_preferences table
      const { data: preferences, error } = await this.supabase
        .from('user_preferences')
        .select('notifications')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('Error checking user preferences, allowing notification:', error)
        return true // Default to allowing if we can't check
      }

      // If no preferences found, default to allowing notifications
      if (!preferences || !preferences.notifications) {
        return true
      }

      const notificationPrefs = preferences.notifications as UserNotificationSettings

      // Check specific notification type preference
      const preferenceKey = this.getPreferenceKeyForType(type)
      if (preferenceKey === null) {
        return true // Always allow if no specific preference (e.g., 'general')
      }

      // Check if this specific notification type is enabled
      // If the preference is explicitly false, don't create the notification
      // If it's true or undefined (default), allow the notification
      return notificationPrefs[preferenceKey] !== false
    } catch (error) {
      console.warn('Error checking notification preferences, allowing notification:', error)
      return true // Default to allowing if there's an error
    }
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    expiresAt?: Date
  ): Promise<Notification | null> {
    try {
      // Check if user has enabled this notification type
      const shouldCreate = await this.shouldCreateNotification(userId, type)
      if (!shouldCreate) {
        console.log(`Notification ${type} skipped for user ${userId} - preference disabled`)
        return null
      }

      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data: data || null,
          priority,
          expires_at: expiresAt?.toISOString() || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.is_read,
        priority: notification.priority,
        createdAt: new Date(notification.created_at),
        readAt: notification.read_at ? new Date(notification.read_at) : undefined,
        expiresAt: notification.expires_at ? new Date(notification.expires_at) : undefined
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (unreadOnly) {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(notification => ({
        id: notification.id,
        userId: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.is_read,
        priority: notification.priority,
        createdAt: new Date(notification.created_at),
        readAt: notification.read_at ? new Date(notification.read_at) : undefined,
        expiresAt: notification.expires_at ? new Date(notification.expires_at) : undefined
      }))
    } catch (error) {
      console.error('Error fetching user notifications:', error)
      throw error
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      throw error
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting notification:', error)
      throw error
    }
  }

  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const { data, error } = await this.supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return this.getDefaultNotificationSettings(userId)
      }

      return {
        userId: data.user_id,
        email: data.email,
        push: data.push,
        inApp: data.in_app,
        types: data.types || this.getDefaultNotificationTypes(),
        quietHours: data.quiet_hours || {
          enabled: false,
          start: '22:00',
          end: '08:00',
          timezone: 'UTC'
        }
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
      return this.getDefaultNotificationSettings(userId)
    }
  }

  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          email: settings.email,
          push: settings.push,
          in_app: settings.inApp,
          types: settings.types,
          quiet_hours: settings.quietHours,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating notification settings:', error)
      throw error
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  // Helper methods for creating specific notification types
  async createLowStockNotification(
    userId: string,
    itemName: string,
    currentStock: number,
    minStock: number
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'inventory_low_stock',
      'Low Stock Alert',
      `${itemName} is running low. Current: ${currentStock}, Minimum: ${minStock}`,
      { itemName, currentStock, minStock },
      'medium',
      new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
    )
  }

  async createCriticalStockNotification(
    userId: string,
    itemName: string,
    currentStock: number
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'inventory_critical_stock',
      'Critical Stock Alert',
      `${itemName} is critically low with only ${currentStock} remaining!`,
      { itemName, currentStock },
      'urgent',
      new Date(Date.now() + 2 * 60 * 60 * 1000) // Expires in 2 hours
    )
  }

  async createTeamInvitationNotification(
    userId: string,
    inviterName: string,
    bakeshopName: string,
    role: string
  ): Promise<Notification | null> {
    return this.createNotification(
      userId,
      'team_invitation',
      'Team Invitation',
      `${inviterName} invited you to join ${bakeshopName} as a ${role}`,
      { inviterName, bakeshopName, role },
      'medium',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
    )
  }

  private getDefaultNotificationSettings(userId: string): NotificationSettings {
    return {
      userId,
      email: true,
      push: true,
      inApp: true,
      types: this.getDefaultNotificationTypes(),
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'UTC'
      }
    }
  }

  private getDefaultNotificationTypes(): Record<NotificationType, boolean> {
    return {
      inventory_low_stock: true,
      inventory_critical_stock: true,
      production_reminder: true,
      team_invitation: true,
      team_member_joined: true,
      team_member_left: true,
      purchase_order_received: true,
      purchase_order_delayed: true,
      system_alert: true,
      security_alert: true,
      general: true
    }
  }
}

export const notificationManager = new NotificationManager()
