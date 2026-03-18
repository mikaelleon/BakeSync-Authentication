"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { createClient } from "@/lib/supabase-client"
import { userManager } from "@/lib/user-management"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export type UserRole = "owner" | "baker" | "cashier"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  email_confirmed_at?: string
  bakeshopId?: string
  bakeshopSlug?: string
}

interface AuthContextType {
  user: User | null
  updateUser: (user: User | null, source: string) => void
  login: (email: string, password: string) => Promise<string>
  signup: (email: string, password: string, userData: {
    name: string
    businessName?: string
    role: UserRole
    bakeshopId?: string
    bakeshopName?: string
    inviteCode?: string
  }) => Promise<{ needsVerification: boolean }>
  verifyEmail: (code: string) => Promise<void>
  resendVerification: () => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabaseRef = useRef<any | null>(null)
  const loadingProfileRef = useRef<Set<string>>(new Set())
  const userUpdateInProgressRef = useRef<boolean>(false)
  const hasInitializedRef = useRef<boolean>(false)
  const isLoggingOutRef = useRef<boolean>(false)

  // Helper function to get role from email
  const getRoleFromEmail = useCallback((email: string): UserRole => {
    if (email === 'owner@bakesync.com') return 'owner'
    if (email === 'baker@bakesync.com') return 'baker'
    if (email === 'cashier@bakesync.com') return 'cashier'
    if (email.endsWith('@bakesync.com')) return 'owner' // Default demo users to owner
    return 'baker' // Production users default to baker
  }, [])

  // Helper function to create user object from auth user
  const createUserFromAuth = useCallback((authUser: SupabaseUser): User => {
    // First, try to get role from user_metadata (set during signup)
    // This is critical for owners who sign up - their role is stored here
    let userRole: UserRole = 'owner' // Default to owner for new signups
    if (authUser.user_metadata?.role && ['owner', 'baker', 'cashier'].includes(authUser.user_metadata.role)) {
      userRole = authUser.user_metadata.role as UserRole
      console.log('createUserFromAuth: Using role from user_metadata:', userRole, 'for email:', authUser.email)
    } else {
      // Fall back to email-based detection (for demo accounts)
      userRole = getRoleFromEmail(authUser.email || '')
      console.log('createUserFromAuth: Using role from email detection:', userRole, 'for email:', authUser.email)
    }
    
    // Also check localStorage as a fallback (stored during signup)
    if (userRole === 'baker' && typeof window !== 'undefined') {
      try {
        const pendingData = localStorage.getItem('pendingUserData')
        const onboardingData = localStorage.getItem('onboardingData')
        if (pendingData) {
          const parsed = JSON.parse(pendingData)
          if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
            userRole = parsed.role as UserRole
            console.log('createUserFromAuth: Using role from pendingUserData:', userRole)
          }
        } else if (onboardingData) {
          const parsed = JSON.parse(onboardingData)
          if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
            userRole = parsed.role as UserRole
            console.log('createUserFromAuth: Using role from onboardingData:', userRole)
          }
        }
      } catch (err) {
        console.warn('createUserFromAuth: Error reading localStorage:', err)
      }
    }
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      role: userRole,
      email_confirmed_at: authUser.email_confirmed_at,
      bakeshopId: undefined,
      bakeshopSlug: undefined
    }
  }, [getRoleFromEmail])

  // Optimized user update function that prevents conflicts
  const updateUser = useCallback((newUser: User | null, source: string) => {
    if (userUpdateInProgressRef.current) {
      console.log(`User update in progress, skipping update from ${source}`)
      return
    }
    
    // Don't restore user if logout is in progress (unless explicitly clearing user)
    if (isLoggingOutRef.current && newUser !== null) {
      console.log(`Logout in progress, blocking user restoration from ${source}`)
      return
    }
    
    userUpdateInProgressRef.current = true
    
    setUser(prevUser => {
      // If newUser is null, just set to null (logout)
      if (newUser === null) {
        console.log(`Logging out user from ${source}`)
        userUpdateInProgressRef.current = false
        return null
      }
      
      // If it's the same user with the same role, don't update
      if (prevUser && 
          prevUser.id && 
          prevUser.id === newUser.id && 
          prevUser.role === newUser.role &&
          prevUser.email === newUser.email) {
        console.log(`User already up to date, skipping update from ${source}`)
        userUpdateInProgressRef.current = false
        return prevUser
      }
      
      console.log(`Updating user from ${source}:`, { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      })
      userUpdateInProgressRef.current = false
      return newUser
    })
  }, [])

  const loadUserProfile = useCallback(async (userId: string, skipIfSame = false): Promise<User | null> => {
    // Prevent multiple simultaneous loads of the same user profile
    if (loadingProfileRef.current.has(userId)) {
      console.log('Profile already loading for userId:', userId, '- skipping')
      return null
    }
    
    loadingProfileRef.current.add(userId)
    
    try {
      console.log('Loading user profile for userId:', userId)
      
      // Use user manager to get or create user profile
      const userProfile = await userManager.getUserProfile(userId)
      console.log('User profile loaded:', userProfile)
      
      if (userProfile) {
        // Get bakeshop information
        const bakeshopInfo = await getBakeshopInfo({
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role
        })
        console.log('Bakeshop info loaded:', bakeshopInfo)
        
        // For demo users, ALWAYS use email-based role assignment
        const finalRole = userProfile.email.endsWith('@bakesync.com') 
          ? getRoleFromEmail(userProfile.email)
          : userProfile.role
        
        console.log('Final role assigned:', finalRole, 'for email:', userProfile.email)
        
        const enrichedUser: User = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: finalRole,
          email_confirmed_at: userProfile.email_confirmed_at,
          bakeshopId: bakeshopInfo?.id,
          bakeshopSlug: bakeshopInfo?.slug
        }
        
        // Only update user if the bakeshop info has changed or if skipIfSame is false
        // This prevents unnecessary updates that trigger dashboard reloads
        if (!skipIfSame || !user || user.bakeshopId !== enrichedUser.bakeshopId || user.bakeshopSlug !== enrichedUser.bakeshopSlug) {
        updateUser(enrichedUser, 'profile-load')
        } else {
          console.log('User profile unchanged, skipping update to prevent reload')
        }
        return enrichedUser
      } else {
        console.log('No profile found for userId:', userId)
        return null
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      return null
    } finally {
      loadingProfileRef.current.delete(userId)
    }
  }, [getRoleFromEmail, updateUser, user])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      // Prevent multiple initializations using ref
      if (hasInitializedRef.current) {
        console.log('getInitialSession: Already initialized, skipping')
        // If user is already set, we're good. Otherwise, we need to check session again
        if (user) {
          if (mounted) {
            setIsLoading(false)
          }
          return
        }
        // If user is not set but we've initialized, check session again
        console.log('getInitialSession: User not set but initialized, checking session again')
      }
      hasInitializedRef.current = true
      
      try {
        console.log('Getting initial session...')
        // Lazily initialize supabase client. If env vars are missing, createClient may throw.
        if (!supabaseRef.current) {
          try {
            supabaseRef.current = createClient()
          } catch (err) {
            console.warn('Supabase client not initialized. Missing environment configuration:', err)
            if (mounted) setIsLoading(false)
            return
          }
        }

        const supabase = supabaseRef.current
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) {
          setIsLoading(false)
          return
        }
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }
        
        if (session?.user) {
          // Don't restore session if logout is in progress
          if (isLoggingOutRef.current) {
            console.log('Logout in progress, skipping session restoration')
            updateUser(null, 'logout-in-progress')
            if (mounted) {
              setIsLoading(false)
            }
            return
          }
          
          // Verify session is still valid by checking expiration
          const now = Math.floor(Date.now() / 1000)
          const expiresAt = session.expires_at
          
          if (expiresAt && expiresAt < now) {
            console.log('Session expired, clearing session')
            // Session expired, sign out
            await supabase.auth.signOut()
            updateUser(null, 'expired-session')
            if (mounted) {
              setIsLoading(false)
            }
            return
          }
          
          console.log('User found in session, setting up user...')
          
          // Create user from auth data immediately
          const authUser = createUserFromAuth(session.user)
          
          // Always update user on initial session load to ensure user state is set
          // This is critical for the protected routes to work
          updateUser(authUser, 'initial-session')
          
          // Try to load profile data in background (non-blocking)
          // This will update the user with bakeshop info when available
          loadUserProfile(session.user.id, false).catch(err => {
            console.warn('Failed to load user profile, using auth data:', err)
          })
        } else {
          console.log('No user in session')
          // Ensure user state is null when there's no session
          updateUser(null, 'no-session')
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        // Always set loading to false, even if there's an error
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes (only if supabase client is available)
    let subscription: any = null
    if (supabaseRef.current && supabaseRef.current.auth && supabaseRef.current.auth.onAuthStateChange) {
      const result = supabaseRef.current.auth.onAuthStateChange(
        async (event: string, session: any) => {
        if (!mounted) return
        
        try {
          console.log('Auth state changed:', event, session?.user?.id)
          
          // Ignore INITIAL_SESSION events - we handle those in getInitialSession
          if (event === 'INITIAL_SESSION') {
            console.log('Ignoring INITIAL_SESSION event (already handled in getInitialSession)')
            return
          }
          
          if (event === 'SIGNED_IN' && session?.user) {
            // Don't restore session if logout is in progress
            if (isLoggingOutRef.current) {
              console.log('Logout in progress, ignoring SIGNED_IN event')
              updateUser(null, 'logout-in-progress')
              return
            }
            
            // Only update if user is different
            if (!user || user.id !== session.user.id) {
            // Create user from auth data immediately
            const authUser = createUserFromAuth(session.user)
            updateUser(authUser, 'auth-state-change')
            
            // Try to load profile data in background (non-blocking)
              // Skip if user already has bakeshop info to prevent unnecessary reloads
              loadUserProfile(session.user.id, true).catch(err => {
              console.warn('Failed to load user profile, using auth data:', err)
            })
            } else {
              console.log('User already signed in, skipping update')
            }
          } else if (event === 'SIGNED_OUT') {
            // Clear logout flag when sign out event is received
            isLoggingOutRef.current = false
            updateUser(null, 'sign-out')
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        }
        }
      )

      subscription = result?.data?.subscription ?? null
    } else {
      console.warn('Supabase client not available, skipping auth state subscription setup')
    }

    return () => {
      mounted = false
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      } catch (err) {
        console.warn('Error unsubscribing auth subscription:', err)
      }
    }
  }, []) // Empty dependency array - only run once on mount

  const login = async (email: string, password: string): Promise<string> => {
    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Check if the error is due to unconfirmed email
      if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED')
      }
      throw new Error(error.message)
    }

    if (!data.user) {
      throw new Error('Login failed: No user data returned')
    }

      const authUser = createUserFromAuth(data.user)
      
    // For demo users, set the correct role immediately
      const isDemo = authUser.email.endsWith('@bakesync.com')
      if (isDemo) {
      console.log('Demo user detected, setting correct role...')
        updateUser(authUser, 'demo-login')
      // Return the redirect path instead of redirecting here
      return '/demo/dashboard'
    }
    
    // Update user state first
      updateUser(authUser, 'production-login')
      
      // Helper function to get dashboard URL (defined at function scope)
      const getDashboardUrl = async (user: User): Promise<string> => {
        // Demo users go to demo dashboard
        if (user.email?.endsWith('@bakesync.com')) {
          return '/demo/dashboard'
        }
        
        // If user has bakeshop slug, use it
        if (user.bakeshopSlug) {
          return `/${user.bakeshopSlug}/dashboard`
        }
        
        // Try to get bakeshop info
        try {
          const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
          const bakeshopInfo = await getBakeshopInfo(user, false)
          if (bakeshopInfo?.slug) {
            return `/${bakeshopInfo.slug}/dashboard`
          }
        } catch (err) {
          console.warn('Error getting bakeshop info:', err)
        }
        
        // For bakers/cashiers without bakeshop, check for pending membership
        if (user.role === 'baker' || user.role === 'cashier') {
          try {
            const { data: membership } = await supabase
              .from('bakeshop_memberships')
              .select('bakeshop_id, bakeshops(slug)')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .maybeSingle()
            
            if (membership && membership.bakeshops) {
              const slug = (membership.bakeshops as any).slug
              if (slug) {
                return `/${slug}/dashboard`
              }
            }
          } catch (err) {
            console.warn('Error checking bakeshop membership:', err)
          }
          
          // No bakeshop found for baker/cashier - don't redirect to login (avoids loop)
          // Return onboarding path - the onboarding page will detect baker/cashier and handle appropriately
          return '/onboarding'
        }
        
        // Fallback: owners go to onboarding
        if (user.role === 'owner') {
          return '/onboarding'
        } else {
          // Unknown role or other cases - redirect to login
          return '/login'
        }
      }
      
      // For production users, load profile data to determine correct path
    try {
      const profileData = await loadUserProfile(data.user.id, false)
      
        if (profileData) {
        // Update user with profile data (this ensures user state is set before redirect)
        const enrichedUser: User = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role,
          email_confirmed_at: profileData.email_confirmed_at,
          bakeshopId: profileData.bakeshopId,
          bakeshopSlug: profileData.bakeshopSlug
        }
        updateUser(enrichedUser, 'profile-load')
        
        // Wait a bit to ensure state update is processed
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Determine redirect path based on onboarding status
        // Baker and cashier roles don't need onboarding
        if (enrichedUser.role === 'baker' || enrichedUser.role === 'cashier') {
          if (enrichedUser.bakeshopId && enrichedUser.bakeshopSlug) {
            console.log('Login: User is baker/cashier with bakeshop info, redirecting to dashboard')
            return `/${enrichedUser.bakeshopSlug}/dashboard`
          } else {
            // Try to get bakeshop info for baker/cashier
            const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
            const bakeshopInfo = await getBakeshopInfo(enrichedUser, false)
            if (bakeshopInfo?.slug) {
              console.log('Login: Found bakeshop info for baker/cashier, redirecting to dashboard')
              return `/${bakeshopInfo.slug}/dashboard`
            }
            // If no bakeshop found, check if they have a pending membership
            // Try to find any bakeshop membership for this user
            try {
              const { data: membership } = await supabase
                .from('bakeshop_memberships')
                .select('bakeshop_id, bakeshops(slug)')
                .eq('user_id', enrichedUser.id)
                .eq('is_active', true)
                .maybeSingle()
              
              if (membership && membership.bakeshops) {
                const slug = (membership.bakeshops as any).slug
                if (slug) {
                  console.log('Login: Found bakeshop membership for baker/cashier, redirecting to dashboard')
                  return `/${slug}/dashboard`
                }
              }
            } catch (err) {
              console.warn('Error checking bakeshop membership:', err)
            }
            
            // If still no bakeshop found, don't redirect back to login (avoids loop)
            // Instead, redirect to onboarding page which will show appropriate message
            // or stay on current page - but we need to return a valid path
            console.warn('Login: No bakeshop found for baker/cashier - they may need to wait for invitation')
            // Return onboarding path - the onboarding page will detect baker/cashier and handle appropriately
            // This prevents the redirect loop while still providing a valid path
            return '/onboarding'
          }
        }
        
        // If user has bakeshop info, assume onboarding is complete
        if (enrichedUser.bakeshopId && enrichedUser.bakeshopSlug) {
          console.log('Login: User has bakeshop info, redirecting to dashboard')
          return `/${enrichedUser.bakeshopSlug}/dashboard`
        }
        
        // Try to check onboarding status via RPC
            try {
              const { data: onboardingStatus, error } = await supabase.rpc('get_onboarding_status', {
                p_user_id: data.user.id
              })

              if (error) {
            console.warn('Error checking onboarding status (RPC may not exist):', error)
            // If RPC fails but user has bakeshop, assume complete
            if (enrichedUser.bakeshopId || enrichedUser.bakeshopSlug) {
              // Try to get bakeshop slug if we have ID but not slug
              if (enrichedUser.bakeshopId && !enrichedUser.bakeshopSlug) {
                try {
                  const { data: bakeshopData } = await supabase
                    .from('bakeshops')
                    .select('slug')
                    .eq('id', enrichedUser.bakeshopId)
                    .maybeSingle()
                  
                  if (bakeshopData?.slug) {
                    enrichedUser.bakeshopSlug = bakeshopData.slug
                    updateUser(enrichedUser, 'slug-found')
                    return `/${bakeshopData.slug}/dashboard`
                  }
                } catch (err) {
                  console.error('Error getting bakeshop slug:', err)
                }
              }
              // Try to get dashboard URL
              return await getDashboardUrl(enrichedUser)
            }
            // Try to get dashboard URL
            return await getDashboardUrl(enrichedUser)
              }

              if (onboardingStatus?.is_completed) {
                // User has completed onboarding, get their bakeshop info
            let bakeshopInfo = await getBakeshopInfo(enrichedUser)
            
            // If getBakeshopInfo fails, try to get bakeshop directly from bakeshops table
            // (user might be the creator but membership not created yet)
            if (!bakeshopInfo) {
              try {
                const { data: bakeshopData, error: bakeshopError } = await supabase
                  .from('bakeshops')
                  .select('id, name, slug')
                  .eq('created_by', data.user.id)
                  .eq('is_active', true)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle()
                
                if (!bakeshopError && bakeshopData) {
                  bakeshopInfo = {
                    id: bakeshopData.id,
                    name: bakeshopData.name,
                    slug: bakeshopData.slug,
                    isDemo: false
                  }
                  
                  // Update enriched user with bakeshop info
                  enrichedUser.bakeshopId = bakeshopData.id
                  enrichedUser.bakeshopSlug = bakeshopData.slug
                  updateUser(enrichedUser, 'bakeshop-found')
                }
              } catch (err) {
                console.error('Error getting bakeshop from created_by:', err)
              }
            }
            
                if (bakeshopInfo) {
              return `/${bakeshopInfo.slug}/dashboard`
                } else {
                  // Fallback: try to get dashboard URL
              console.warn('User completed onboarding but no bakeshop found')
              return await getDashboardUrl(enrichedUser)
                }
              } else {
                // User needs to complete onboarding - owners go to onboarding, others get dashboard URL
            if (enrichedUser.role === 'owner') {
              return '/onboarding'
            } else {
              return await getDashboardUrl(enrichedUser)
            }
              }
            } catch (err) {
              console.error('Error checking onboarding status:', err)
          // If user has bakeshop info, assume onboarding complete
          if (enrichedUser.bakeshopId && enrichedUser.bakeshopSlug) {
            return `/${enrichedUser.bakeshopSlug}/dashboard`
          }
              // Default: try to get dashboard URL
          return await getDashboardUrl(enrichedUser)
            }
        } else {
        // If profile loading fails, try to get dashboard URL
        // Create a minimal user object for the helper
        const minimalUser: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || 'User',
          role: getRoleFromEmail(data.user.email || ''),
          email_confirmed_at: data.user.email_confirmed_at
        }
        return await getDashboardUrl(minimalUser)
      }
    } catch (err) {
      console.warn('Failed to load user profile, using auth data:', err)
      // If profile loading fails, try to get dashboard URL
      // Create a minimal user object for the helper
      const minimalUser: User = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name || 'User',
        role: getRoleFromEmail(data.user.email || ''),
        email_confirmed_at: data.user.email_confirmed_at
      }
      return await getDashboardUrl(minimalUser)
    }
  }

  const signup = async (email: string, password: string, userData: {
    name: string
    businessName?: string
    role: UserRole
    bakeshopId?: string
    bakeshopName?: string
    inviteCode?: string
  }) => {
    // Check for rate limiting in localStorage
    const lastSignupAttempt = localStorage.getItem(`signup_attempt_${email}`)
    const lastAttemptTime = lastSignupAttempt ? parseInt(lastSignupAttempt, 10) : 0
    const timeSinceLastAttempt = Date.now() - lastAttemptTime
    const RATE_LIMIT_WINDOW = 60000 // 1 minute between attempts per email
    
    if (timeSinceLastAttempt < RATE_LIMIT_WINDOW && lastAttemptTime > 0) {
      const remainingSeconds = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastAttempt) / 1000)
      throw new Error(`Please wait ${remainingSeconds} seconds before trying again. This helps prevent email rate limits.`)
    }

    // Check if we should skip email verification (for development/testing)
    const SKIP_EMAIL_VERIFICATION = 
      process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === 'true' ||
      (process.env.NODE_ENV === 'development' && localStorage.getItem('skipEmailVerification') === 'true')
    
    const isDemoAccount = email.endsWith('@bakesync.com')

    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
        data: {
          name: userData.name,
          business_name: userData.businessName || '',
          role: userData.role,
          bakeshop_id: userData.bakeshopId,
          bakeshop_name: userData.bakeshopName,
          invite_code: userData.inviteCode
        },
        // Skip email confirmation if enabled
        ...(SKIP_EMAIL_VERIFICATION && !isDemoAccount ? { 
          emailRedirectTo: undefined 
        } : {})
      }
    })

    if (error) {
      // Store attempt time for rate limiting
      localStorage.setItem(`signup_attempt_${email}`, Date.now().toString())
      
      // Provide user-friendly error messages for common issues
      if (error.message.toLowerCase().includes('rate limit') || 
          error.message.toLowerCase().includes('email rate limit') ||
          error.message.toLowerCase().includes('too many requests')) {
        throw new Error(
          'Email rate limit exceeded. Please wait a few minutes before trying again. ' +
          'If this persists, you may need to configure custom SMTP in your Supabase dashboard.'
        )
      }
      
      if (error.message.toLowerCase().includes('user already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.')
      }
      
      throw new Error(error.message)
    }
    
    // Store successful attempt time
    localStorage.setItem(`signup_attempt_${email}`, Date.now().toString())

    if (data.user) {
      // Store user data in localStorage for verification
      localStorage.setItem('pendingUserData', JSON.stringify({
        email,
        name: userData.name,
        businessName: userData.businessName || '',
        role: userData.role,
        bakeshopId: userData.bakeshopId,
        bakeshopName: userData.bakeshopName,
        inviteCode: userData.inviteCode
      }))

      // For development/testing: Force email verification for non-demo accounts
      // This ensures the verification flow is always tested
      const forceVerification = process.env.NODE_ENV === 'development' && !isDemoAccount

      if (data.user.email_confirmed_at && !forceVerification) {
        // Email is already confirmed, create profile immediately
        try {
          // Get role from user_metadata (set during signup) or fallback to email-based detection
          const roleFromMetadata = data.user.user_metadata?.role as UserRole | undefined
          const userRole = roleFromMetadata || getRoleFromEmail(data.user.email || '')
          
          // For bakers/cashiers with invite code, create bakeshop membership
          if (userData.bakeshopId && userData.role !== 'owner') {
            try {
              const { createClient } = await import('@/lib/supabase-client')
              const supabase = createClient()
              
              // Create bakeshop membership for invited user
              // First check if it already exists (might have been created in a previous attempt)
              const { data: existingMembership } = await supabase
                .from('bakeshop_memberships')
                .select('id')
                .eq('user_id', data.user.id)
                .eq('bakeshop_id', userData.bakeshopId)
                .eq('is_active', true)
                .maybeSingle()

              if (!existingMembership) {
                const { error: membershipError } = await supabase
                  .from('bakeshop_memberships')
                  .insert({
                    user_id: data.user.id,
                    bakeshop_id: userData.bakeshopId,
                    user_role: userData.role,
                    is_active: true,
                    joined_at: new Date().toISOString()
                  })
                
                if (membershipError) {
                  console.error('Error creating bakeshop membership:', membershipError)
                  // Don't throw - store in metadata so recovery can happen later
                  // The user can use "Check for invitations" to recover
                  console.warn('Membership creation failed, but user can recover using "Check for invitations"')
                  // Store bakeshop info in user metadata for recovery
                  await supabase.auth.updateUser({
                    data: {
                      ...data.user.user_metadata,
                      bakeshopId: userData.bakeshopId,
                      bakeshopName: userData.bakeshopName,
                      role: userData.role,
                      needsMembershipRecovery: true
                    }
                  })
                } else {
                  console.log('Bakeshop membership created successfully for', userData.role)
                }
              } else {
                console.log('Bakeshop membership already exists')
              }
            } catch (err) {
              console.error('Error setting up bakeshop membership:', err)
              // Don't throw - allow user to sign up and recover later
              // Store recovery info in metadata
              try {
                await supabase.auth.updateUser({
                  data: {
                    ...data.user.user_metadata,
                    bakeshopId: userData.bakeshopId,
                    bakeshopName: userData.bakeshopName,
                    role: userData.role,
                    needsMembershipRecovery: true
                  }
                })
              } catch (updateErr) {
                console.error('Error storing recovery info:', updateErr)
              }
              // Continue with profile creation - user can recover using "Check for invitations"
            }
          }
          
          const profileData = {
            id: data.user.id,
            email: data.user.email || '',
            name: userData.name || 'User',
            role: userRole,
            email_confirmed_at: data.user.email_confirmed_at,
            bakeshopId: userData.bakeshopId,
            bakeshopSlug: undefined
          }
          const newProfile = await userManager.createOrUpdateUserProfile(profileData)
          if (newProfile) {
            updateUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role,
              email_confirmed_at: data.user.email_confirmed_at,
              bakeshopId: newProfile.bakeshopId || userData.bakeshopId,
              bakeshopSlug: newProfile.bakeshopSlug
            }, 'signup-confirmed')
            
            // Store onboarding data for immediate redirect (use role from metadata, not email detection)
            localStorage.setItem('onboardingData', JSON.stringify({
              businessName: userData.businessName || '',
              fullName: userData.name,
              role: userRole, // Use the role from metadata or email detection
              email: data.user.email,
              bakeshopId: userData.bakeshopId,
              bakeshopName: userData.bakeshopName
            }))
          }
        } catch (err) {
          console.warn('Failed to create user profile, using auth data:', err)
        }
      }
    }

    // Handle email verification bypass for development
    // If skipping verification and user was created, auto-confirm and create profile
    if (SKIP_EMAIL_VERIFICATION && !isDemoAccount && data.user && !data.user.email_confirmed_at) {
      console.log('🔧 Development mode: Auto-confirming email to bypass verification')
      
      try {
        // Create user profile immediately
        // For bakers/cashiers with invite code, create bakeshop membership
        if (userData.bakeshopId && userData.role !== 'owner') {
          try {
            const { createClient } = await import('@/lib/supabase-client')
            const supabase = createClient()
            
            // Create bakeshop membership for invited user
            const { error: membershipError } = await supabase
              .from('bakeshop_memberships')
              .insert({
                user_id: data.user.id,
                bakeshop_id: userData.bakeshopId,
                user_role: userData.role,
                is_active: true
              })
            
            if (membershipError) {
              console.error('Error creating bakeshop membership:', membershipError)
              throw new Error('Failed to join bakery. Please contact support.')
            }
          } catch (err) {
            console.error('Error setting up bakeshop membership:', err)
            throw err
          }
        }
        
        const profileData = {
          id: data.user.id,
          email: data.user.email || email,
          name: userData.name,
          role: userData.role,
          email_confirmed_at: new Date().toISOString(),
          bakeshopId: userData.bakeshopId,
          bakeshopSlug: undefined
        }
        
        const newProfile = await userManager.createOrUpdateUserProfile(profileData)
        if (newProfile) {
          updateUser({
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.name,
            role: newProfile.role,
            email_confirmed_at: new Date().toISOString(),
            bakeshopId: newProfile.bakeshopId || userData.bakeshopId,
            bakeshopSlug: newProfile.bakeshopSlug
          }, 'signup-bypass')
          
          // Store onboarding data
          localStorage.setItem('onboardingData', JSON.stringify({
            businessName: userData.businessName || '',
            fullName: userData.name,
            role: userData.role,
            email: email,
            bakeshopId: userData.bakeshopId,
            bakeshopName: userData.bakeshopName
          }))
          
          return { needsVerification: false }
        }
      } catch (err) {
        console.warn('Failed to auto-create profile, will require verification:', err)
      }
    }

    // Force verification for development testing (except demo accounts and when bypass is enabled)
    const needsVerification = (SKIP_EMAIL_VERIFICATION || isDemoAccount) 
      ? false 
      : (process.env.NODE_ENV === 'development' && !isDemoAccount 
      ? true 
          : !data.user?.email_confirmed_at)

    console.log('Signup result:', { 
      email, 
      email_confirmed_at: data.user?.email_confirmed_at, 
      needsVerification,
      isDemoAccount,
      skipVerification: SKIP_EMAIL_VERIFICATION
    })

    return { needsVerification }
  }

  const verifyEmail = async (code: string, email?: string) => {
    const verifyParams: any = {
      token: code,
      type: 'email'
    }
    
    if (email) {
      verifyParams.email = email
    }
    
    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase not configured')

    const { data, error } = await supabase.auth.verifyOtp(verifyParams)

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      // Create user profile after email verification
      try {
        // Get role from user_metadata (set during signup) or fallback to email-based detection
        const roleFromMetadata = data.user.user_metadata?.role as UserRole | undefined
        const userRole = roleFromMetadata || getRoleFromEmail(data.user.email || '')
        
        // Get pending user data from localStorage if available
        const pendingData = localStorage.getItem('pendingUserData')
        let userName = 'User'
        let businessName = ''
        let bakeshopId: string | undefined = undefined
        let bakeshopName: string | undefined = undefined
        
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData)
            userName = parsed.name || 'User'
            businessName = parsed.businessName || ''
            bakeshopId = parsed.bakeshopId
            bakeshopName = parsed.bakeshopName
          } catch (err) {
            console.warn('Failed to parse pending user data:', err)
          }
        }
        
        // For bakers/cashiers with invite code, create bakeshop membership
        if (bakeshopId && userRole !== 'owner') {
          try {
            const { createClient } = await import('@/lib/supabase-client')
            const supabase = createClient()
            
            // Create bakeshop membership for invited user
            const { error: membershipError } = await supabase
              .from('bakeshop_memberships')
              .insert({
                user_id: data.user.id,
                bakeshop_id: bakeshopId,
                user_role: userRole,
                is_active: true,
                joined_at: new Date().toISOString()
              })
            
            if (membershipError) {
              console.error('Error creating bakeshop membership:', membershipError)
              // Don't throw - continue with profile creation
              // The user can still access the system, just won't have bakeshop access yet
            } else {
              console.log('Bakeshop membership created successfully for', userRole)
            }
          } catch (err) {
            console.error('Error setting up bakeshop membership:', err)
            // Don't throw - continue with profile creation
          }
        }
        
        const profileData = {
          id: data.user.id,
          email: data.user.email || '',
          name: userName,
          role: userRole,
          email_confirmed_at: data.user.email_confirmed_at,
          bakeshopId: bakeshopId,
          bakeshopSlug: undefined
        }
        const newProfile = await userManager.createOrUpdateUserProfile(profileData)
        if (newProfile) {
          // Get bakeshop slug if we have bakeshopId
          let bakeshopSlug = newProfile.bakeshopSlug
          if (bakeshopId && !bakeshopSlug) {
            try {
              const { createClient } = await import('@/lib/supabase-client')
              const supabase = createClient()
              const { data: bakeshopData } = await supabase
                .from('bakeshops')
                .select('slug')
                .eq('id', bakeshopId)
                .maybeSingle()
              
              if (bakeshopData?.slug) {
                bakeshopSlug = bakeshopData.slug
              }
            } catch (err) {
              console.warn('Error getting bakeshop slug:', err)
            }
          }
          
          updateUser({
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.name,
            role: newProfile.role,
            email_confirmed_at: data.user.email_confirmed_at,
            bakeshopId: newProfile.bakeshopId || bakeshopId,
            bakeshopSlug: bakeshopSlug
          }, 'email-verification')
          
          // Store onboarding data for redirect
          localStorage.setItem('onboardingData', JSON.stringify({
            businessName: businessName,
            fullName: userName,
            role: userRole,
            email: data.user.email,
            bakeshopId: bakeshopId,
            bakeshopName: bakeshopName
          }))
          
          // Clear pending user data after successful verification
          localStorage.removeItem('pendingUserData')
        }
      } catch (err) {
        console.warn('Failed to create user profile after verification:', err)
      }
    }
  }

  const resendVerification = async () => {
    const pendingData = localStorage.getItem('pendingUserData')
    if (!pendingData) {
      throw new Error('No pending verification found. Please try signing up again.')
    }
    
    const userData = JSON.parse(pendingData)
    const email = userData.email

    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase not configured')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const logout = async () => {
    // Set logout flag to prevent session restoration
    isLoggingOutRef.current = true
    
    // Clear user state immediately to prevent any race conditions
    updateUser(null, 'logout')
    
    // Clear all caches and storage
    try {
      // Clear bakeshop cache
      const { clearBakeshopCache } = await import('@/lib/bakeshop-cache')
      clearBakeshopCache()
      
      // Clear localStorage items related to auth and onboarding
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingUserData')
        localStorage.removeItem('onboardingData')
        localStorage.removeItem('pendingVerificationEmail')
        // Clear any other auth-related items
        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.startsWith('signup_attempt_') || key.startsWith('auth_') || key.startsWith('bakeshop_'))) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
        
        // Clear sessionStorage as well
        sessionStorage.clear()
      }
    } catch (error) {
      console.warn('Error clearing caches during logout:', error)
      // Continue with logout even if cache clearing fails
    }
    
    // Sign out from Supabase (this clears the session)
    const supabase = supabaseRef.current
    if (!supabase) throw new Error('Supabase not configured')

    const { error } = await supabase.auth.signOut()
    if (error) {
      // Reset flag on error
      isLoggingOutRef.current = false
      throw new Error(error.message)
    }
    
    // Wait a bit to ensure session is fully cleared and auth state change events are processed
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Verify session is actually cleared
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.warn('Session still exists after signOut, forcing another signOut')
        await supabase.auth.signOut()
        // Wait again
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    } catch (err) {
      console.warn('Error verifying session clear:', err)
    }
    
    // Force a page reload to ensure all state is cleared
    // This prevents any stale state from persisting
    if (typeof window !== 'undefined') {
      // Reset the flag after a delay to allow redirect to complete
      // This prevents the flag from blocking future logins
      setTimeout(() => {
        isLoggingOutRef.current = false
      }, 1000)
      
      window.location.href = '/login'
    } else {
      // If no window, reset flag immediately
      isLoggingOutRef.current = false
    }
  }

  return <AuthContext.Provider value={{ user, updateUser, login, signup, verifyEmail, resendVerification, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}