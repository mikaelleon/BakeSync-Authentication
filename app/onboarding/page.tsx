"use client"

import { EnhancedOnboarding } from "@/components/onboarding/enhanced-onboarding"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import type { User } from "@/lib/auth-context"
import { teamInvitationAPI } from "@/lib/api/team-invitations"

export default function OnboardingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Only redirect to login if we're absolutely sure there's no user
    // Add a longer delay to prevent race conditions with auth state loading
    // This is especially important for owners who just signed up
    // Don't redirect immediately - wait for auth state to fully initialize
    if (!isLoading) {
      const timer = setTimeout(() => {
        // Double-check that user is still null after delay
        // This prevents redirect loops when user state is still loading
        if (!user) {
          console.log('OnboardingPage: No user found after loading and delay, redirecting to login')
          router.push("/login")
        } else {
          console.log('OnboardingPage: User found:', user.email, 'Role:', user.role)
        }
      }, 2000) // Increased delay to allow auth state to fully load, especially after signup
      return () => clearTimeout(timer)
    }
  }, [user, isLoading, router])

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || user.email?.endsWith('@bakesync.com')) {
        // Demo users don't need onboarding status check
        setIsCheckingOnboarding(false)
        return
      }

      // Baker and cashier roles don't need onboarding - redirect to dashboard
      if (user.role === 'baker' || user.role === 'cashier') {
        console.log('OnboardingPage: User is baker or cashier, redirecting to dashboard')
        // Try to get bakeshop info and redirect
        try {
          const { clearBakeshopCache } = await import('@/lib/bakeshop-cache')
          clearBakeshopCache(user.id)
          const bakeshopInfo = await getBakeshopInfo(user, false)
          if (bakeshopInfo?.slug) {
            router.push(`/${bakeshopInfo.slug}/dashboard`)
            return
          }
          
          // If no bakeshop found via getBakeshopInfo, check for pending membership
          const { data: membership } = await supabase
            .from('bakeshop_memberships')
            .select('bakeshop_id, bakeshops(slug)')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()
          
          if (membership && membership.bakeshops) {
            const slug = (membership.bakeshops as any).slug
            if (slug) {
              router.push(`/${slug}/dashboard`)
              return
            }
          }
          
          // If still no bakeshop found, show a message instead of redirecting to login (avoids loop)
          console.warn('OnboardingPage: No bakeshop found for baker/cashier - they may need to wait for invitation')
          // Stay on onboarding page but show a message that they need to wait
          // Don't redirect to login to avoid loop
          setIsCheckingOnboarding(false)
        } catch (err) {
          console.warn('OnboardingPage: Error getting bakeshop info for baker/cashier:', err)
          // Don't redirect to login to avoid loop - just show the onboarding page
          setIsCheckingOnboarding(false)
        }
        return
      }

      // First check: If user has bakeshop info in state, they've completed onboarding
      if (user.bakeshopId && user.bakeshopSlug) {
        console.log('OnboardingPage: User has bakeshop info in state, redirecting to dashboard')
        router.push(`/${user.bakeshopSlug}/dashboard`)
        return
      }

      // Second check: Try to get bakeshop info from database (bypass cache to ensure fresh data)
      try {
        // Clear cache first to ensure we get fresh data
        const { clearBakeshopCache } = await import('@/lib/bakeshop-cache')
        clearBakeshopCache(user.id)
        
        const bakeshopInfo = await getBakeshopInfo(user, false) // Don't use cache
        if (bakeshopInfo?.slug) {
          console.log('OnboardingPage: Found bakeshop info, redirecting to dashboard')
          router.push(`/${bakeshopInfo.slug}/dashboard`)
          return
        }
      } catch (err) {
        console.warn('OnboardingPage: Error getting bakeshop info:', err)
      }

      // Third check: Check if user created a bakeshop directly
      try {
        const { data: bakeshop, error: bakeshopError } = await supabase
          .from('bakeshops')
          .select('id, slug')
          .eq('created_by', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!bakeshopError && bakeshop?.slug) {
          console.log('OnboardingPage: Found bakeshop by created_by, redirecting to dashboard')
          router.push(`/${bakeshop.slug}/dashboard`)
          return
        }
      } catch (err) {
        console.warn('OnboardingPage: Error checking bakeshop by created_by:', err)
      }

      // Fourth check: Try RPC function (may not exist)
      try {
        const { data: onboardingStatus, error } = await supabase.rpc('get_onboarding_status', {
          p_user_id: user.id
        })

        if (!error && onboardingStatus?.is_completed) {
          // User has already completed onboarding, redirect to their dashboard
          // Clear cache and bypass it to ensure fresh data
          const { clearBakeshopCache } = await import('@/lib/bakeshop-cache')
          clearBakeshopCache(user.id)
          const bakeshopInfo = await getBakeshopInfo(user, false) // Don't use cache
          if (bakeshopInfo?.slug) {
            router.push(`/${bakeshopInfo.slug}/dashboard`)
          } else {
            // Try to get bakeshop by created_by as fallback
            const { data: bakeshop } = await supabase
              .from('bakeshops')
              .select('slug')
              .eq('created_by', user.id)
              .eq('is_active', true)
              .maybeSingle()
            
            if (bakeshop?.slug) {
              router.push(`/${bakeshop.slug}/dashboard`)
            } else {
              console.warn('OnboardingPage: Onboarding marked complete but no bakeshop found')
              setIsCheckingOnboarding(false)
            }
          }
          return
        }
      } catch (err) {
        console.warn('OnboardingPage: RPC function may not exist, continuing:', err)
      }

      // No bakeshop found, user needs onboarding
      // This is expected for owners who just signed up
      console.log('OnboardingPage: No bakeshop found, user needs onboarding. Role:', user.role)
      setIsCheckingOnboarding(false)
    }

    // Only check onboarding status if we have a user and auth has finished loading
    // This prevents race conditions where user state hasn't loaded yet
    if (user && !isLoading) {
      checkOnboardingStatus()
    } else if (!isLoading && !user) {
      // If loading is complete and no user, we'll redirect to login (handled by other useEffect)
      console.log('OnboardingPage: Loading complete but no user found')
      setIsCheckingOnboarding(false)
    }
  }, [user, isLoading, router, supabase])

  if (isLoading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">
            {isLoading ? 'Loading...' : 'Checking onboarding status...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Show a message for bakers/cashiers who don't have a bakeshop yet
  // IMPORTANT: Only show invitation handler if role is explicitly baker or cashier
  // If role is undefined or null, default to showing onboarding (for owners)
  const userRole = user.role
  console.log('OnboardingPage: User role check:', { 
    role: userRole, 
    bakeshopId: user.bakeshopId, 
    bakeshopSlug: user.bakeshopSlug,
    email: user.email 
  })
  
  if (userRole === 'baker' || userRole === 'cashier') {
    if (!user.bakeshopId && !user.bakeshopSlug) {
      console.log('OnboardingPage: Showing invitation handler for baker/cashier without bakeshop')
      return <PendingInvitationHandler user={user} router={router} />
    }
  }
  
  // For owners or users with undefined role, show onboarding
  // This ensures owners can complete onboarding even if role detection failed
  console.log('OnboardingPage: Showing onboarding form for user:', userRole || 'undefined (defaulting to owner)')
  return <EnhancedOnboarding />
}

// Component to handle pending invitations for bakers/cashiers
function PendingInvitationHandler({ user, router }: { user: User; router: any }) {
  const [pendingInvitation, setPendingInvitation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkForPendingInvitations()
  }, [user.email])

  const checkForPendingInvitations = async () => {
    if (!user.email) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('Checking for pending invitations for email:', user.email)
      console.log('User ID:', user.id)
      
      const supabase = createClient()
      
      // First, check if user already has a membership (recovery from failed signup)
      const { data: existingMembership, error: membershipError } = await supabase
        .from('bakeshop_memberships')
        .select(`
          id,
          bakeshop_id,
          user_role,
          bakeshops!inner(
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (existingMembership && existingMembership.bakeshops) {
        console.log('Found existing membership! Redirecting to dashboard...')
        const bakeshop = Array.isArray(existingMembership.bakeshops) 
          ? existingMembership.bakeshops[0] 
          : existingMembership.bakeshops
        
        if (bakeshop?.slug) {
          window.location.href = `/${bakeshop.slug}/dashboard`
          return
        }
      }

      // Check user metadata for bakeshop info from signup
      // This helps recover from failed membership creation during signup
      try {
        const { data: authUser } = await supabase.auth.getUser()
        const signupMetadata = authUser?.user?.user_metadata
        
        if (signupMetadata?.bakeshopId && signupMetadata?.role) {
          console.log('Found bakeshop info in user metadata, attempting to create membership...')
          const bakeshopId = signupMetadata.bakeshopId
          const userRole = signupMetadata.role
          
          // Check if membership already exists
          const { data: membershipCheck } = await supabase
            .from('bakeshop_memberships')
            .select('id, bakeshops!inner(id, name, slug)')
            .eq('user_id', user.id)
            .eq('bakeshop_id', bakeshopId)
            .eq('is_active', true)
            .maybeSingle()

          if (membershipCheck) {
            const bakeshop = Array.isArray(membershipCheck.bakeshops) 
              ? membershipCheck.bakeshops[0] 
              : membershipCheck.bakeshops
            if (bakeshop?.slug) {
              console.log('Membership found! Redirecting to dashboard...')
              window.location.href = `/${bakeshop.slug}/dashboard`
              return
            }
          } else {
            // Try to create the membership using the RPC function if available
            try {
              const { data: createResult, error: createError } = await supabase
                .rpc('create_missing_membership', {
                  p_user_id: user.id,
                  p_bakeshop_id: bakeshopId,
                  p_role: userRole
                })

              if (createResult?.success) {
                console.log('Membership created via recovery function! Getting bakeshop info...')
                const { data: bakeshop } = await supabase
                  .from('bakeshops')
                  .select('slug')
                  .eq('id', bakeshopId)
                  .maybeSingle()
                
                if (bakeshop?.slug) {
                  window.location.href = `/${bakeshop.slug}/dashboard`
                  return
                }
              } else if (createError?.code !== '42883') {
                // Function doesn't exist, try direct insert
                console.log('Recovery function not available, trying direct insert...')
                const { error: insertError } = await supabase
                  .from('bakeshop_memberships')
                  .insert({
                    user_id: user.id,
                    bakeshop_id: bakeshopId,
                    user_role: userRole,
                    is_active: true,
                    joined_at: new Date().toISOString()
                  })

                if (!insertError) {
                  console.log('Membership created successfully! Getting bakeshop info...')
                  const { data: bakeshop } = await supabase
                    .from('bakeshops')
                    .select('slug')
                    .eq('id', bakeshopId)
                    .maybeSingle()
                  
                  if (bakeshop?.slug) {
                    window.location.href = `/${bakeshop.slug}/dashboard`
                    return
                  }
                } else {
                  console.error('Failed to create membership:', insertError)
                }
              }
            } catch (recoveryErr) {
              console.error('Error during membership recovery:', recoveryErr)
            }
          }
        }
      } catch (metadataErr) {
        console.warn('Error checking user metadata:', metadataErr)
      }
      
      // First, verify the user's profile email matches
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle()
      
      console.log('Profile check:', { profile, profileError, profileEmail: profile?.email, userEmail: user.email })
      
      // Also try direct query to debug RLS issues
      // Use the email from profile if available, otherwise use user.email
      const emailToCheck = profile?.email || user.email
      const { data: directQuery, error: directError } = await supabase
        .from('team_invitations')
        .select('*')
        .ilike('email', emailToCheck.toLowerCase().trim())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)

      console.log('Direct query result:', { 
        data: directQuery, 
        error: directError,
        emailUsed: emailToCheck,
        queryCount: directQuery?.length || 0
      })
      
      // Check for pending invitations by email using the API
      const result = await teamInvitationAPI.getPendingInvitationsByEmail(user.email)

      console.log('API result:', result)

      if (result.success && result.data && result.data.length > 0) {
        // Get the most recent invitation
        const invitation = result.data[0]
        console.log('Found pending invitation:', invitation)
        setPendingInvitation(invitation)
      } else if (directQuery && directQuery.length > 0) {
        // If API failed but direct query worked, use that data
        console.log('Using direct query result:', directQuery[0])
        // Fetch bakeshop info separately
        const { data: bakeshop } = await supabase
          .from('bakeshops')
          .select('id, name, slug')
          .eq('id', directQuery[0].bakeshop_id)
          .maybeSingle()
        
        setPendingInvitation({
          id: directQuery[0].id,
          email: directQuery[0].email,
          role: directQuery[0].role,
          token: directQuery[0].token,
          bakeshopId: directQuery[0].bakeshop_id,
          bakeshopName: bakeshop?.name || 'Unknown Bakeshop',
          bakeshopSlug: bakeshop?.slug || '',
          status: directQuery[0].status,
          message: directQuery[0].message,
          expiresAt: directQuery[0].expires_at,
          createdAt: directQuery[0].created_at
        })
      } else {
        console.log('No pending invitations found. Success:', result.success, 'Error:', result.error)
        setPendingInvitation(null)
        if (result.error) {
          setError(result.error)
        } else if (directError) {
          setError(`Unable to check invitations: ${directError.message}`)
        }
      }
    } catch (err) {
      console.error('Error checking for pending invitations:', err)
      setPendingInvitation(null)
      setError(err instanceof Error ? err.message : 'Failed to check for invitations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!pendingInvitation || !user.id) return

    try {
      setIsAccepting(true)
      setError(null)

      console.log('Accepting invitation:', {
        token: pendingInvitation.token?.substring(0, 10) + '...',
        userId: user.id,
        email: user.email
      })

      // Accept the invitation
      const result = await teamInvitationAPI.acceptInvitation(pendingInvitation.token, user.id)

      console.log('Accept invitation result:', result)

      if (result.success && result.data) {
        console.log('Invitation accepted successfully, membership created')
        
        // Wait a moment for the database to update and clear any caches
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Clear bakeshop cache to ensure fresh data
        try {
          const { clearBakeshopCache } = await import('@/lib/bakeshop-cache')
          clearBakeshopCache(user.id)
        } catch (cacheErr) {
          console.warn('Failed to clear cache:', cacheErr)
        }
        
        // Redirect to the bakeshop dashboard
        if (pendingInvitation.bakeshopSlug) {
          window.location.href = `/${pendingInvitation.bakeshopSlug}/dashboard`
        } else {
          // Fallback: reload the page to update user state
          window.location.reload()
        }
      } else {
        const errorMsg = result.error || 'Failed to accept invitation'
        console.error('Failed to accept invitation:', errorMsg)
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Checking for invitations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        {pendingInvitation ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Invitation Found!</h1>
              <p className="text-muted-foreground">
                You've been invited to join <strong>{pendingInvitation.bakeshopName}</strong> as a <strong>{pendingInvitation.role}</strong>.
              </p>
              {pendingInvitation.message && (
                <p className="text-sm text-muted-foreground italic">
                  "{pendingInvitation.message}"
                </p>
              )}
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={handleAcceptInvitation}
                disabled={isAccepting}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAccepting ? 'Accepting...' : 'Accept Invitation'}
              </button>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <button
                onClick={() => {
                  const supabase = createClient()
                  supabase.auth.signOut().then(() => {
                    window.location.href = '/login'
                  })
                }}
                className="text-sm text-muted-foreground hover:underline"
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Waiting for Invitation</h1>
              <p className="text-muted-foreground">
                You've successfully logged in, but you haven't been added to a bakeshop yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait for the bakeshop owner to send you an invitation, or contact them to be added to their team.
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={checkForPendingInvitations}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Checking...' : 'Check for invitations'}
              </button>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
              <button
                onClick={() => {
                  const supabase = createClient()
                  supabase.auth.signOut().then(() => {
                    window.location.href = '/login'
                  })
                }}
                className="text-sm text-muted-foreground hover:underline block w-full text-center"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}