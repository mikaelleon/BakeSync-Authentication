import { test, expect } from '@playwright/test'

test.describe('Email Verification Database Functions', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing data
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('create_verification_code function generates 6-digit codes', async ({ page }) => {
    // Navigate to a page that can execute SQL
    await page.goto('/debug')
    
    // Execute the create_verification_code function
    const result = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('create_verification_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@example.com',
        p_type: 'signup',
        p_expires_hours: 24
      })
      
      return { data, error }
    })

    // Check that function executed successfully
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data.success).toBe(true)
    expect(result.data.code).toMatch(/^\d{6}$/) // Should be exactly 6 digits
    expect(result.data.verification_id).toBeDefined()
    expect(result.data.expires_at).toBeDefined()
  })

  test('verify_email_code function validates correct codes', async ({ page }) => {
    // First create a verification code
    await page.goto('/debug')
    
    const createResult = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('create_verification_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@example.com',
        p_type: 'signup',
        p_expires_hours: 24
      })
      
      return { data, error }
    })

    expect(createResult.error).toBeNull()
    expect(createResult.data.success).toBe(true)
    
    const verificationCode = createResult.data.code

    // Now verify the code
    const verifyResult = await page.evaluate(async (code) => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_code: code,
        p_type: 'signup'
      })
      
      return { data, error }
    }, verificationCode)

    // Check that verification was successful
    expect(verifyResult.error).toBeNull()
    expect(verifyResult.data.success).toBe(true)
    expect(verifyResult.data.verified_at).toBeDefined()
  })

  test('verify_email_code function rejects invalid codes', async ({ page }) => {
    await page.goto('/debug')
    
    // Try to verify with an invalid code
    const verifyResult = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_code: '000000', // Invalid code
        p_type: 'signup'
      })
      
      return { data, error }
    })

    // Check that verification failed
    expect(verifyResult.error).toBeNull()
    expect(verifyResult.data.success).toBe(false)
    expect(verifyResult.data.error).toContain('Invalid or expired verification code')
  })

  test('verify_email_code function rejects expired codes', async ({ page }) => {
    // Create a verification code with very short expiry
    await page.goto('/debug')
    
    const createResult = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('create_verification_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@example.com',
        p_type: 'signup',
        p_expires_hours: 0.001 // Very short expiry (about 3.6 seconds)
      })
      
      return { data, error }
    })

    expect(createResult.error).toBeNull()
    expect(createResult.data.success).toBe(true)
    
    const verificationCode = createResult.data.code

    // Wait for the code to expire
    await page.waitForTimeout(5000)

    // Try to verify the expired code
    const verifyResult = await page.evaluate(async (code) => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_code: code,
        p_type: 'signup'
      })
      
      return { data, error }
    }, verificationCode)

    // Check that verification failed due to expiry
    expect(verifyResult.error).toBeNull()
    expect(verifyResult.data.success).toBe(false)
    expect(verifyResult.data.error).toContain('Invalid or expired verification code')
  })

  test('verify_email_code function increments attempts on failure', async ({ page }) => {
    // Create a verification code
    await page.goto('/debug')
    
    const createResult = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('create_verification_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@example.com',
        p_type: 'signup',
        p_expires_hours: 24
      })
      
      return { data, error }
    })

    expect(createResult.error).toBeNull()
    expect(createResult.data.success).toBe(true)

    // Try to verify with wrong code multiple times
    for (let i = 0; i < 3; i++) {
      const verifyResult = await page.evaluate(async () => {
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()
        
        const { data, error } = await supabase.rpc('verify_email_code', {
          p_user_id: '00000000-0000-0000-0000-000000000000',
          p_code: '000000', // Wrong code
          p_type: 'signup'
        })
        
        return { data, error }
      })

      expect(verifyResult.error).toBeNull()
      expect(verifyResult.data.success).toBe(false)
    }

    // Check that attempts were incremented
    const attemptsResult = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('email_verifications')
        .select('attempts')
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
        .eq('type', 'signup')
        .single()
      
      return { data, error }
    })

    expect(attemptsResult.error).toBeNull()
    expect(attemptsResult.data).not.toBeNull()
    expect(attemptsResult.data?.attempts).toBe(3)
  })

  test('verify_email_code function prevents reuse of verified codes', async ({ page }) => {
    // Create a verification code
    await page.goto('/debug')
    
    const createResult = await page.evaluate(async () => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('create_verification_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_email: 'test@example.com',
        p_type: 'signup',
        p_expires_hours: 24
      })
      
      return { data, error }
    })

    expect(createResult.error).toBeNull()
    expect(createResult.data.success).toBe(true)
    
    const verificationCode = createResult.data.code

    // Verify the code successfully
    const verifyResult1 = await page.evaluate(async (code) => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_code: code,
        p_type: 'signup'
      })
      
      return { data, error }
    }, verificationCode)

    expect(verifyResult1.error).toBeNull()
    expect(verifyResult1.data.success).toBe(true)

    // Try to verify the same code again
    const verifyResult2 = await page.evaluate(async (code) => {
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      
      const { data, error } = await supabase.rpc('verify_email_code', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_code: code,
        p_type: 'signup'
      })
      
      return { data, error }
    }, verificationCode)

    // Should fail because code was already used
    expect(verifyResult2.error).toBeNull()
    expect(verifyResult2.data.success).toBe(false)
    expect(verifyResult2.data.error).toContain('Invalid or expired verification code')
  })
})
