import { createClient } from "@/lib/supabase-client"
import type { UserRole } from "./auth-context"

export interface TeamMember {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  joinedAt: Date
  lastActiveAt?: Date
  permissions: string[]
  status: 'active' | 'inactive' | 'pending' | 'suspended'
}

export interface TeamInvitation {
  id: string
  email: string
  role: UserRole
  invitedBy: string
  invitedByName: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: Date
  createdAt: Date
  message?: string
}

export interface TeamStats {
  totalMembers: number
  activeMembers: number
  pendingInvitations: number
  roleDistribution: Record<UserRole, number>
  recentActivity: TeamActivity[]
}

export interface TeamActivity {
  id: string
  userId: string
  userName: string
  action: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}

export class TeamManager {
  private supabase = createClient()

  async getTeamMembers(bakeshopId: string): Promise<TeamMember[]> {
    try {
      if (!bakeshopId) {
        console.warn('getTeamMembers called without bakeshopId')
        return []
      }

      console.log('Fetching team members for bakeshopId:', bakeshopId)
      
      // Try using the RPC function first (if it exists)
      let data: any[] | null = null
      let error: any = null

      try {
        const result = await this.supabase
          .rpc('get_bakeshop_memberships', { p_bakeshop_id: bakeshopId })
        data = result.data
        error = result.error
      } catch (rpcError: any) {
        // If function doesn't exist (PGRST202), show helpful error
        if (rpcError?.code === 'PGRST202' || rpcError?.message?.includes('Could not find the function')) {
          console.error('❌ RPC function get_bakeshop_memberships not found!')
          console.error('📋 Please run the SQL script: docs/database/fix-bakeshop-memberships-rls-complete.sql')
          console.error('📋 Or run: docs/database/add-get-bakeshop-memberships-function.sql')
          // Return empty array with a warning - don't fall back to direct query
          // because it will only show the user's own membership, which is misleading
          console.warn('⚠️ Cannot show all team members without the RPC function. Returning empty array.')
          return []
        } else {
          throw rpcError
        }
      }

      console.log('Team members query result:', { data, error, count: data?.length || 0 })

      if (error) {
        console.error('Error fetching team members:', error)
        
        // Provide specific error messages
        if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
          console.error('❌ RPC function get_bakeshop_memberships not found in database!')
          console.error('📋 Please run the SQL script: docs/database/verify-and-fix-team-members.sql')
          console.error('📋 Or run: docs/database/fix-bakeshop-memberships-simple.sql')
          // Don't throw - return empty array with helpful message
          return []
        } else if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
          console.error('RLS policy error - user may not have permission to view memberships')
          console.error('Error details:', error)
          throw error
        } else if (error.message?.includes('not a member')) {
          console.error('User is not a member of this bakeshop')
          throw error
        } else {
          throw error
        }
      }

      // Handle case where data is null or empty
      if (!data || data.length === 0) {
        console.log('No team members found for bakeshopId:', bakeshopId)
        console.log('⚠️ This might mean:')
        console.log('   1. The function exists but returned no members (check if memberships exist)')
        console.log('   2. The user is not a member of this bakeshop')
        console.log('   3. All memberships are inactive')
        return []
      }

      // Map the function results to TeamMember format
      console.log('Raw data from function:', JSON.stringify(data, null, 2))
      
      const members = data
        .filter((membership: any) => {
          // Filter out memberships without profiles
          if (!membership.profile_id) {
            console.warn('⚠️ Membership without profile found:', {
              user_id: membership.user_id,
              role: membership.user_role,
              bakeshop_id: membership.bakeshop_id
            })
            console.warn('   This membership will be excluded from the team list')
            return false
          }
          return true
        })
        .map((membership: any) => {
          const member = {
            id: membership.profile_id,
            email: membership.profile_email || 'Unknown',
            name: membership.profile_name || 'Unknown',
            role: membership.user_role,
            isActive: membership.is_active,
            joinedAt: new Date(membership.joined_at),
            lastActiveAt: membership.profile_last_login_at ? new Date(membership.profile_last_login_at) : undefined,
            permissions: this.getRolePermissions(membership.user_role),
            status: membership.is_active ? 'active' : 'inactive'
          }
          console.log('Mapped member:', member)
          return member
        })
      
      console.log(`✅ Successfully mapped ${members.length} team members (including owner if present)`)
      return members
    } catch (error) {
      console.error('Error fetching team members:', error)
      // Return empty array instead of throwing to prevent dashboard from hanging
      return []
    }
  }

  async getPendingInvitations(bakeshopId: string): Promise<TeamInvitation[]> {
    if (!bakeshopId) {
      console.warn('getPendingInvitations called without bakeshopId')
      return []
    }
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select(`
          *,
          profiles!team_invitations_invited_by_fkey(
            name
          )
        `)
        .eq('bakeshop_id', bakeshopId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        invitedBy: invitation.invited_by,
        invitedByName: invitation.profiles?.name || 'Unknown',
        status: invitation.status,
        expiresAt: new Date(invitation.expires_at),
        createdAt: new Date(invitation.created_at),
        message: invitation.message
      }))
    } catch (error) {
      console.error('Error fetching pending invitations:', error)
      throw error
    }
  }

  async inviteTeamMember(
    bakeshopId: string,
    invitedBy: string,
    email: string,
    role: UserRole,
    message?: string
  ): Promise<TeamInvitation> {
    try {
      // Validate inputs
      if (!bakeshopId || !invitedBy || !email || !role) {
        throw new Error('Missing required fields: bakeshopId, invitedBy, email, and role are required')
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email address format')
      }

      // Validate role
      if (!['baker', 'cashier'].includes(role)) {
        throw new Error('Invalid role. Only "baker" and "cashier" roles can be invited')
      }

      const { data, error } = await this.supabase.rpc('create_team_invitation', {
        p_bakeshop_id: bakeshopId,
        p_invited_by: invitedBy,
        p_email: email,
        p_role: role,
        p_message: message || ''
      })

      if (error) {
        console.error('RPC error details:', error)
        // Provide more helpful error messages
        if (error.code === '42883') {
          throw new Error('The create_team_invitation function does not exist. Please run the database migration.')
        } else if (error.code === 'P0001') {
          throw new Error(error.message || 'Failed to create invitation')
        } else if (error.message) {
          throw new Error(error.message)
        } else {
          throw new Error(`Database error: ${error.code || 'Unknown error'}`)
        }
      }

      if (!data || !data.invitation_id) {
        throw new Error('Invalid response from server: missing invitation data')
      }

      return {
        id: data.invitation_id,
        email,
        role,
        invitedBy,
        invitedByName: 'You', // Will be updated when fetched
        status: 'pending',
        expiresAt: new Date(data.expires_at),
        createdAt: new Date(),
        message
      }
    } catch (error) {
      console.error('Error inviting team member:', error)
      // Re-throw with better error message
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error('Failed to invite team member: ' + String(error))
      }
    }
  }

  async updateTeamMemberRole(
    bakeshopId: string,
    userId: string,
    newRole: UserRole
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bakeshop_memberships')
        .update({
          user_role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('bakeshop_id', bakeshopId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating team member role:', error)
      throw error
    }
  }

  async removeTeamMember(bakeshopId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('bakeshop_memberships')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('bakeshop_id', bakeshopId)
        .eq('user_id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing team member:', error)
      throw error
    }
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('team_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) throw error
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      throw error
    }
  }

  async getTeamStats(bakeshopId: string): Promise<TeamStats> {
    try {
      // Return default stats if bakeshopId is not provided
      if (!bakeshopId) {
        console.warn('getTeamStats: No bakeshopId provided')
        return {
          totalMembers: 0,
          activeMembers: 0,
          pendingInvitations: 0,
          roleDistribution: { owner: 0, baker: 0, cashier: 0 },
          recentActivity: []
        }
      }

      // Get team members (returns empty array on error)
      const members = await this.getTeamMembers(bakeshopId)
      // Get pending invitations (returns empty array on error)
      const invitations = await this.getPendingInvitations(bakeshopId)

      // Calculate role distribution
      const roleDistribution: Record<UserRole, number> = { owner: 0, baker: 0, cashier: 0 }
      members.reduce((acc, member) => {
        acc[member.role] = (acc[member.role] || 0) + 1
        return acc
      }, roleDistribution)

      // Get recent activity (returns empty array on error)
      const recentActivity = await this.getTeamActivity(bakeshopId, 10)

      return {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.isActive).length,
        pendingInvitations: invitations.length,
        roleDistribution,
        recentActivity
      }
    } catch (error) {
      console.error('Error fetching team stats:', error)
      // Return default stats instead of throwing to prevent dashboard from hanging
      return {
        totalMembers: 0,
        activeMembers: 0,
        pendingInvitations: 0,
        roleDistribution: { owner: 0, baker: 0, cashier: 0 },
        recentActivity: []
      }
    }
  }

  async getTeamActivity(bakeshopId: string, limit: number = 20): Promise<TeamActivity[]> {
    try {
      // Return empty array if bakeshopId is not provided
      if (!bakeshopId) {
        console.warn('getTeamActivity: No bakeshopId provided')
        return []
      }
      const { data, error } = await this.supabase
        .from('user_activity_logs')
        .select(`
          *,
          profiles(
            name
          )
        `)
        .eq('bakeshop_id', bakeshopId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching team activity from user_activity_logs:', error)
        // Return empty array instead of throwing to prevent dashboard from hanging
        return []
      }

      // Handle case where data is null or empty
      if (!data || data.length === 0) {
        console.log('No team activity found for bakeshopId:', bakeshopId)
        return []
      }

      return data.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        userName: activity.profiles?.name || 'Unknown',
        action: activity.action,
        description: activity.description,
        timestamp: new Date(activity.timestamp),
        metadata: activity.metadata
      }))
    } catch (error) {
      console.error('Error fetching team activity:', error)
      // Return empty array instead of throwing to prevent dashboard from hanging
      return []
    }
  }

  private getRolePermissions(role: UserRole): string[] {
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
}

export const teamManager = new TeamManager()
