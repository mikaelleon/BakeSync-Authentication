import { createClient } from "@/lib/supabase-client"

export interface TeamInvitation {
  id: string
  bakeshopId: string
  invitedBy: string
  email: string
  role: 'baker' | 'cashier'
  token: string
  message?: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: string
  acceptedAt?: string
  acceptedBy?: string
  createdAt: string
  updatedAt: string
}

export interface CreateInvitationData {
  email: string
  role: 'baker' | 'cashier'
  message?: string
}

export class TeamInvitationAPI {
  private supabase = createClient()

  async createInvitation(bakeshopId: string, invitationData: CreateInvitationData) {
    try {
      // Validate bakeshop ID
      if (!bakeshopId || typeof bakeshopId !== 'string') {
        return {
          success: false,
          error: 'Invalid bakeshop ID provided'
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(invitationData.email)) {
        return {
          success: false,
          error: 'Invalid email address format'
        }
      }

      // Get current user ID
      const { data: authData, error: authError } = await this.supabase.auth.getUser()
      if (authError || !authData?.user?.id) {
        return {
          success: false,
          error: 'User authentication required to create invitations'
        }
      }

      const { data, error } = await this.supabase.rpc('create_team_invitation', {
        p_bakeshop_id: bakeshopId,
        p_invited_by: authData.user.id,
        p_email: invitationData.email,
        p_role: invitationData.role,
        p_message: invitationData.message || null
      })

      if (error) throw error

      return {
        success: true,
        data: {
          invitationId: data.invitation_id,
          token: data.token,
          expiresAt: data.expires_at
        }
      }
    } catch (error) {
      console.error('Error creating team invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create invitation'
      }
    }
  }

  async getInvitationByToken(token: string) {
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select(`
          *,
          bakeshops!inner(name, slug)
        `)
        .eq('token', token)
        .single()

      if (error) throw error

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email,
          role: data.role,
          bakeshopName: data.bakeshops.name,
          bakeshopId: data.bakeshop_id,
          invitedBy: data.invited_by,
          invitedAt: data.created_at,
          expiresAt: data.expires_at,
          status: data.status,
          message: data.message
        }
      }
    } catch (error) {
      console.error('Error getting invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invitation'
      }
    }
  }

  async acceptInvitation(token: string, userId: string) {
    try {
      // Validate inputs
      if (!token || !userId) {
        return {
          success: false,
          error: 'Token and user ID are required'
        }
      }

      console.log('Accepting invitation:', { token: token.substring(0, 10) + '...', userId })

      const { data, error } = await this.supabase.rpc('accept_team_invitation', {
        p_token: token,
        p_user_id: userId
      })

      if (error) {
        console.error('RPC error details:', error)
        // Provide more helpful error messages
        if (error.code === '42883') {
          return {
            success: false,
            error: 'The accept_team_invitation function does not exist. Please run the database migration.'
          }
        } else if (error.code === 'P0001') {
          // This is a RAISE EXCEPTION from the function
          return {
            success: false,
            error: error.message || 'Failed to accept invitation'
          }
        } else if (error.message) {
          return {
            success: false,
            error: error.message
          }
        } else {
          return {
            success: false,
            error: `Database error: ${error.code || 'Unknown error'}`
          }
        }
      }

      if (!data || !data.bakeshop_id) {
        return {
          success: false,
          error: 'Invalid response from server: missing bakeshop data'
        }
      }

      return {
        success: true,
        data: {
          bakeshopId: data.bakeshop_id,
          role: data.role
        }
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to accept invitation'
      }
    }
  }

  async getPendingInvitationsByEmail(email: string) {
    try {
      // First, try to get invitations with bakeshop info
      // Use lowercase email for case-insensitive matching
      const lowerEmail = email.toLowerCase().trim()
      
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select(`
          *,
          bakeshops!inner(id, name, slug)
        `)
        .ilike('email', lowerEmail) // Case-insensitive match
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invitations with bakeshop info:', error)
        // Fallback: try without bakeshop join
        const { data: fallbackData, error: fallbackError } = await this.supabase
          .from('team_invitations')
          .select('*')
          .ilike('email', lowerEmail)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (fallbackError) {
          console.error('Error fetching invitations (fallback):', fallbackError)
          throw fallbackError
        }

        // If we got data without bakeshop info, fetch bakeshop info separately
        if (fallbackData && fallbackData.length > 0) {
          const invitationsWithBakeshop = await Promise.all(
            fallbackData.map(async (invitation) => {
              const { data: bakeshop } = await this.supabase
                .from('bakeshops')
                .select('id, name, slug')
                .eq('id', invitation.bakeshop_id)
                .maybeSingle()

              return {
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                token: invitation.token,
                bakeshopId: invitation.bakeshop_id,
                bakeshopName: bakeshop?.name || 'Unknown Bakeshop',
                bakeshopSlug: bakeshop?.slug || '',
                status: invitation.status,
                message: invitation.message,
                expiresAt: invitation.expires_at,
                createdAt: invitation.created_at
              }
            })
          )

          return {
            success: true,
            data: invitationsWithBakeshop
          }
        }

        return {
          success: true,
          data: []
        }
      }

      if (!data || data.length === 0) {
        // Try exact match as fallback
        const { data: exactData } = await this.supabase
          .from('team_invitations')
          .select('*')
          .eq('email', email)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (exactData && exactData.length > 0) {
          console.warn('Found invitations with exact match but not with ilike - possible case sensitivity issue')
        }
      }

      return {
        success: true,
        data: data.map(invitation => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          bakeshopId: invitation.bakeshop_id,
          bakeshopName: invitation.bakeshops.name,
          bakeshopSlug: invitation.bakeshops.slug,
          status: invitation.status,
          message: invitation.message,
          expiresAt: invitation.expires_at,
          createdAt: invitation.created_at
        }))
      }
    } catch (error) {
      console.error('Error getting pending invitations by email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invitations'
      }
    }
  }

  async getBakeshopInvitations(bakeshopId: string) {
    try {
      const { data, error } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('bakeshop_id', bakeshopId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data.map(invitation => ({
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          message: invitation.message,
          invitedAt: invitation.created_at,
          expiresAt: invitation.expires_at,
          acceptedAt: invitation.accepted_at
        }))
      }
    } catch (error) {
      console.error('Error getting bakeshop invitations:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get invitations'
      }
    }
  }

  async cancelInvitation(invitationId: string) {
    try {
      const { error } = await this.supabase
        .from('team_invitations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) throw error

      return {
        success: true,
        message: 'Invitation cancelled successfully'
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel invitation'
      }
    }
  }

  async resendInvitation(invitationId: string) {
    try {
      // Get the invitation details
      const { data: invitation, error: fetchError } = await this.supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single()

      if (fetchError) throw fetchError

      // Create a new invitation with the same details
      const { data, error } = await this.supabase.rpc('create_team_invitation', {
        p_bakeshop_id: invitation.bakeshop_id,
        p_invited_by: invitation.invited_by,
        p_email: invitation.email,
        p_role: invitation.role,
        p_message: invitation.message
      })

      if (error) throw error

      // Cancel the old invitation
      await this.cancelInvitation(invitationId)

      return {
        success: true,
        data: {
          invitationId: data.invitation_id,
          token: data.token,
          expiresAt: data.expires_at
        }
      }
    } catch (error) {
      console.error('Error resending invitation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend invitation'
      }
    }
  }
}

export const teamInvitationAPI = new TeamInvitationAPI()
