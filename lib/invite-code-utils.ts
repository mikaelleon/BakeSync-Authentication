// lib/invite-code-utils.ts

import { createClient } from "@/lib/supabase-client"

/**
 * Generate a unique invite code for a bakeshop
 * Format: 6 uppercase alphanumeric characters (e.g., "ABC123")
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars (0, O, I, 1)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Validate an invite code format
 */
export function isValidInviteCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase())
}

/**
 * Validate and get bakeshop info from invite code
 * First checks role-specific codes, then falls back to general bakeshop invite code
 */
export async function validateInviteCode(code: string): Promise<{
  success: boolean
  bakeshopId?: string
  bakeshopName?: string
  role?: 'baker' | 'cashier'
  error?: string
}> {
  try {
    if (!isValidInviteCodeFormat(code)) {
      return {
        success: false,
        error: 'Invalid invite code format. Code must be 6 characters.'
      }
    }

    const supabase = createClient()
    const upperCode = code.toUpperCase()

    // First, try to find role-specific invite code
    const { data: roleCodeData, error: roleCodeError } = await supabase
      .rpc('validate_role_invite_code', {
        p_invite_code: upperCode
      })

    if (!roleCodeError && roleCodeData?.success) {
      // The RPC function already returns bakeshop_name, but if it's missing, fetch it
      let bakeshopName = roleCodeData.bakeshop_name
      
      if (!bakeshopName) {
        // Fallback: Get bakeshop name if not returned by RPC
        const { data: bakeshopData, error: bakeshopError } = await supabase
          .from('bakeshops')
          .select('name')
          .eq('id', roleCodeData.bakeshop_id)
          .maybeSingle()

        if (bakeshopError) {
          console.error('Error fetching bakeshop name:', bakeshopError)
        }
        
        bakeshopName = bakeshopData?.name
      }

      return {
        success: true,
        bakeshopId: roleCodeData.bakeshop_id,
        bakeshopName: bakeshopName || 'Bakery',
        role: roleCodeData.role
      }
    }

    // Fallback to general bakeshop invite code
    const { data, error } = await supabase
      .from('bakeshops')
      .select('id, name, invite_code')
      .eq('invite_code', upperCode)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: roleCodeData?.error || 'Invalid invite code. Please check the code and try again.'
      }
    }

    return {
      success: true,
      bakeshopId: data.id,
      bakeshopName: data.name
    }
  } catch (error) {
    console.error('Error validating invite code:', error)
    return {
      success: false,
      error: 'Failed to validate invite code. Please try again.'
    }
  }
}

/**
 * Create or regenerate a role-specific invite code
 */
export async function createRoleInviteCode(
  bakeshopId: string,
  role: 'baker' | 'cashier',
  expiresAt?: Date,
  maxUses?: number
): Promise<{
  success: boolean
  inviteCode?: string
  error?: string
}> {
  try {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData?.user?.id) {
      return {
        success: false,
        error: 'User authentication required'
      }
    }

    const { data, error } = await supabase.rpc('create_role_invite_code', {
      p_bakeshop_id: bakeshopId,
      p_role: role,
      p_created_by: userData.user.id,
      p_expires_at: expiresAt?.toISOString() || null,
      p_max_uses: maxUses || null
    })

    if (error) {
      console.error('Error creating role invite code:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Provide more helpful error messages
      if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Database function not found. Please run the SQL migration script: docs/database/fix-create-role-invite-code-function.sql'
        }
      }
      
      if (error.code === 'P0001' && error.message?.includes('Only owners')) {
        return {
          success: false,
          error: 'Only bakeshop owners can create invite codes'
        }
      }
      
      return {
        success: false,
        error: error.message || 'Failed to create invite code'
      }
    }

    // Check if data is in the expected format
    if (!data || typeof data !== 'object') {
      console.error('Unexpected response format:', data)
      return {
        success: false,
        error: 'Unexpected response from server'
      }
    }

    // Handle both JSONB object and direct property access
    const inviteCode = data.invite_code || (typeof data === 'object' && 'invite_code' in data ? data.invite_code : null)

    if (!inviteCode) {
      console.error('No invite code in response:', data)
      return {
        success: false,
        error: 'Failed to generate invite code'
      }
    }

    return {
      success: true,
      inviteCode: inviteCode
    }
  } catch (error) {
    console.error('Error creating role invite code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invite code'
    }
  }
}

/**
 * Get active role invite codes for a bakeshop
 */
export async function getRoleInviteCodes(bakeshopId: string): Promise<{
  success: boolean
  codes?: Array<{
    role: 'baker' | 'cashier'
    inviteCode: string
    expiresAt?: string
    maxUses?: number
    usageCount: number
    createdAt: string
  }>
  error?: string
}> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('role_invite_codes')
      .select('role, invite_code, expires_at, max_uses, usage_count, created_at')
      .eq('bakeshop_id', bakeshopId)
      .eq('is_active', true)
      .order('role', { ascending: true })

    if (error) {
      console.error('Error fetching role invite codes:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch invite codes'
      }
    }

    return {
      success: true,
      codes: data.map(code => ({
        role: code.role as 'baker' | 'cashier',
        inviteCode: code.invite_code,
        expiresAt: code.expires_at,
        maxUses: code.max_uses || undefined,
        usageCount: code.usage_count,
        createdAt: code.created_at
      }))
    }
  } catch (error) {
    console.error('Error fetching role invite codes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch invite codes'
    }
  }
}

/**
 * Deactivate a role invite code
 */
export async function deactivateRoleInviteCode(
  bakeshopId: string,
  role: 'baker' | 'cashier'
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('role_invite_codes')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('bakeshop_id', bakeshopId)
      .eq('role', role)
      .eq('is_active', true)

    if (error) {
      console.error('Error deactivating role invite code:', error)
      return {
        success: false,
        error: error.message || 'Failed to deactivate invite code'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deactivating role invite code:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate invite code'
    }
  }
}
