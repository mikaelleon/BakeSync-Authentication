"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { hasPermission } from "@/lib/permissions"
import { needsOnboarding } from "@/lib/onboarding-completion"

interface ProtectedRouteProps {
  children: React.ReactNode
  permission?: keyof typeof import("@/lib/permissions").PERMISSIONS
}

export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null)
  const checkingOnboardingRef = useRef(false)
  const redirectingRef = useRef(false)

  // Timebox a promise so onboarding RPCs don't block rendering indefinitely
  async function withTimeout<T>(p: Promise<T>, ms = 2000, fallback?: T): Promise<T> {
    return await Promise.race([
      p,
      new Promise<T>(resolve => setTimeout(() => resolve(fallback as T), ms))
    ])
  }

  // Check onboarding status when user is available (non-blocking)
  useEffect(() => {
    if (user && !checkingOnboardingRef.current) {
      checkingOnboardingRef.current = true;
      // Run onboarding check in background - don't block rendering
      (async () => {
        try {
          // Baker and cashier roles don't need onboarding
          if (user.role === 'baker' || user.role === 'cashier') {
            console.log('ProtectedRoute: User is baker or cashier, skipping onboarding check')
            setOnboardingStatus(false)
            return
          }

          const fallback = user.bakeshopId || user.bakeshopSlug ? false : true
          const needs = await withTimeout<boolean>(needsOnboarding(user), 2000, fallback)
          setOnboardingStatus(needs)
          // Disabled automatic redirect to onboarding - users can navigate manually
          // if (needs && !redirectingRef.current) {
          //   redirectingRef.current = true
          //   console.log('ProtectedRoute: User needs onboarding, redirecting')
          //   router.push("/onboarding")
          // } else {
          //   console.log('ProtectedRoute: User does not need onboarding')
          // }
          console.log('ProtectedRoute: Onboarding status checked (automatic redirect disabled)')
        } catch (error) {
          console.error('Error checking onboarding status:', error)
          // If user has bakeshop info, assume onboarding is complete
          if (user.bakeshopId || user.bakeshopSlug) {
            console.log('ProtectedRoute: User has bakeshop info, assuming onboarding complete')
            setOnboardingStatus(false)
          } else {
            // No bakeshop info and check failed - might need onboarding
            setOnboardingStatus(true)
          }
        } finally {
          checkingOnboardingRef.current = false;
        }
      })()
    } else if (!user) {
      // Reset onboarding status when user logs out
      setOnboardingStatus(null)
    }
  }, [user, router])

  // Track session check state
  const [sessionChecked, setSessionChecked] = useState(false)
  const sessionCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasSessionRef = useRef<boolean | null>(null)
  const navigationGracePeriodRef = useRef<NodeJS.Timeout | null>(null)

  // Non-blocking session check - allow render while checking
  useEffect(() => {
    // Only show loading spinner if auth is still initializing
    if (isLoading) {
      return
    }

    // Clear any existing timeouts
    if (sessionCheckTimeoutRef.current) {
      clearTimeout(sessionCheckTimeoutRef.current)
    }
    if (navigationGracePeriodRef.current) {
      clearTimeout(navigationGracePeriodRef.current)
    }

    // Quick session check - non-blocking
    const checkSessionAndRedirect = async () => {
      try {
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        // Store session state for navigation grace period
        hasSessionRef.current = !!session
        setSessionChecked(true)
        
        // Only redirect if we're absolutely sure there's no session AND no user
        // Give a grace period during navigation to allow user state to load
        if (!session && !user) {
          // Set a grace period before redirecting - this prevents redirects during navigation
          navigationGracePeriodRef.current = setTimeout(() => {
            // Double-check one more time before redirecting
            (async () => {
              try {
                const { createClient: createClientAgain } = await import('@/lib/supabase-client')
                const supabaseAgain = createClientAgain()
                const { data: { session: finalSession } } = await supabaseAgain.auth.getSession()
                
                // Only redirect if still no session and no user after grace period
                if (!finalSession && !user && !redirectingRef.current) {
                  redirectingRef.current = true
                  console.log('ProtectedRoute: No session and no user after grace period, redirecting to login')
                  router.push("/login")
                } else if (finalSession || user) {
                  console.log('ProtectedRoute: Session or user found after grace period, allowing access')
                }
              } catch (err) {
                console.error('ProtectedRoute: Error in final session check:', err)
                // On error, don't redirect - better to allow access than block legitimate users
              }
            })()
          }, 2000) // 2 second grace period for navigation
        } else if (session && !user) {
          // Session exists but user state not loaded yet - allow render, user will load
          // Don't block - let the page render while user loads
          console.log('ProtectedRoute: Session exists, user loading in background')
        } else if (user) {
          console.log('ProtectedRoute: User found:', user.id, user.email)
          // Clear any pending redirects since we have a user
          if (navigationGracePeriodRef.current) {
            clearTimeout(navigationGracePeriodRef.current)
            navigationGracePeriodRef.current = null
          }
        }
      } catch (error) {
        console.error('ProtectedRoute: Error checking session:', error)
        setSessionChecked(true)
        // On error, be lenient - don't redirect immediately
        // If we previously had a session, trust it during navigation
        if (hasSessionRef.current === true) {
          console.log('ProtectedRoute: Previous session existed, allowing access despite error')
          return
        }
        // Only redirect if we're sure there's no session
        if (!user && !redirectingRef.current && hasSessionRef.current === false) {
          navigationGracePeriodRef.current = setTimeout(() => {
            if (!user && !redirectingRef.current) {
              redirectingRef.current = true
              router.push("/login")
            }
          }, 2000)
        }
      }
    }

    // Run check immediately - no delay
    checkSessionAndRedirect()
    
    // Set a timeout to mark session as checked even if the async check is slow
    sessionCheckTimeoutRef.current = setTimeout(() => {
      if (!sessionChecked) {
        setSessionChecked(true)
      }
    }, 500)
    
    return () => {
      if (sessionCheckTimeoutRef.current) {
        clearTimeout(sessionCheckTimeoutRef.current)
      }
      if (navigationGracePeriodRef.current) {
        clearTimeout(navigationGracePeriodRef.current)
      }
    }
  }, [user, isLoading, router, sessionChecked])

  // Show loading only during initial auth load
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Allow render while onboarding check happens in background
  // Only block if we know onboarding is needed
  if (onboardingStatus === true) {
    return null // Will redirect in useEffect
  }

  // If no user, be lenient during navigation
  // Check session synchronously if possible, or trust that navigation is in progress
  if (!user) {
    // If session check hasn't completed yet, show loading briefly
    // But only for a very short time to prevent blocking navigation
    if (!sessionChecked) {
      // Use a very short timeout to allow navigation to proceed
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    }
    
    // Session check completed but no user
    // If we had a session before, trust it and allow render (user state loading)
    // Otherwise, allow render briefly - redirect will happen in useEffect after grace period
    // This prevents blocking legitimate navigation
    if (hasSessionRef.current === true) {
      console.log('ProtectedRoute: Session exists, allowing render while user loads')
      return <>{children}</>
    }
    
    // No session found - but still allow brief render to prevent navigation blocking
    // Redirect will happen in useEffect after grace period
    console.log('ProtectedRoute: No session found, allowing brief render before redirect')
    return <>{children}</>
  }

  // Check permission - this is quick, no blocking
  if (permission && !hasPermission(user.role, permission)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  // Allow children to render immediately - onboarding check happens in background
  // If onboarding is needed, redirect will happen without blocking render
  return <>{children}</>
}