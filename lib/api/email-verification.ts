import { createClient } from "@/lib/supabase-client"

export interface EmailVerification {
  id: string
  userId: string
  email: string
  code: string
  type: 'signup' | 'password_reset' | 'email_change' | 'invitation'
  expiresAt: string
  verifiedAt?: string
  attempts: number
  createdAt: string
}

export interface CreateVerificationData {
  email: string
  type: 'signup' | 'password_reset' | 'email_change' | 'invitation'
  expiresHours?: number
}

export class EmailVerificationAPI {
  private supabase = createClient()

  async createVerification(userId: string, verificationData: CreateVerificationData) {
    try {
      const { data, error } = await this.supabase.rpc('create_email_verification', {
        p_user_id: userId,
        p_email: verificationData.email,
        p_type: verificationData.type,
        p_expires_hours: verificationData.expiresHours || 24
      })

      if (error) throw error

      return {
        success: true,
        data: {
          verificationId: data.verification_id,
          code: data.code,
          expiresAt: data.expires_at
        }
      }
    } catch (error) {
      console.error('Error creating email verification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create verification'
      }
    }
  }

  async verifyCode(userId: string, code: string, type: 'signup' | 'password_reset' | 'email_change' | 'invitation') {
    try {
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          error: 'Invalid user ID provided'
        }
      }

      if (!code || typeof code !== 'string') {
        return {
          success: false,
          error: 'Verification code is required'
        }
      }

      // Validate code format (should be 6 digits for email verification)
      if (type === 'signup' || type === 'email_change') {
        const codeRegex = /^\d{6}$/
        if (!codeRegex.test(code.trim())) {
          return {
            success: false,
            error: 'Verification code must be 6 digits'
          }
        }
      }

      // Sanitize code (remove whitespace)
      const sanitizedCode = code.trim()

      const { data, error } = await this.supabase.rpc('verify_email_code', {
        p_user_id: userId,
        p_code: sanitizedCode,
        p_type: type
      })

      if (error) throw error

      return {
        success: true,
        data: {
          verifiedAt: data.verified_at
        }
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify code'
      }
    }
  }

  async getVerificationStatus(userId: string, type: 'signup' | 'password_reset' | 'email_change' | 'invitation') {
    try {
      const { data, error } = await this.supabase
        .from('email_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: true,
            data: null
          }
        }
        throw error
      }

      return {
        success: true,
        data: {
          id: data.id,
          email: data.email,
          type: data.type,
          expiresAt: data.expires_at,
          verifiedAt: data.verified_at,
          attempts: data.attempts,
          isExpired: new Date(data.expires_at) < new Date(),
          isVerified: !!data.verified_at
        }
      }
    } catch (error) {
      console.error('Error getting verification status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get verification status'
      }
    }
  }

  async resendVerification(userId: string, email: string, type: 'signup' | 'password_reset' | 'email_change' | 'invitation') {
    try {
      // Validate inputs
      if (!userId || typeof userId !== 'string') {
        return {
          success: false,
          error: 'Invalid user ID provided'
        }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email || !emailRegex.test(email)) {
        return {
          success: false,
          error: 'Valid email address is required'
        }
      }

      // Cancel any existing verifications for this user and type
      const { error: updateError } = await this.supabase
        .from('email_verifications')
        .update({ 
          expires_at: new Date().toISOString() // Expire immediately
        })
        .eq('user_id', userId)
        .eq('type', type)
        .is('verified_at', null)

      // Log but don't fail if cancellation fails
      if (updateError) {
        console.warn('Failed to cancel existing verification:', updateError)
      }

      // Create new verification
      return await this.createVerification(userId, { email, type })
    } catch (error) {
      console.error('Error resending verification:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resend verification'
      }
    }
  }

  async cleanupExpiredVerifications() {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_verifications')

      if (error) throw error

      return {
        success: true,
        data: {
          deletedCount: data
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired verifications:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup verifications'
      }
    }
  }
}

export const emailVerificationAPI = new EmailVerificationAPI()
