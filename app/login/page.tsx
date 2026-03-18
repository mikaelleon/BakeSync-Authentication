"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Croissant, AlertTriangle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Redirect if already logged in - but verify session is valid first
  useEffect(() => {
    if (isLoading) return // Wait for auth to finish loading
    
    // Only redirect if we have a valid user AND a valid session
    const checkSessionAndRedirect = async () => {
      if (!user) return // No user, stay on login page
      
      // Add a delay to prevent race conditions with logout
      // This gives time for logout to fully complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      try {
        // Verify session is actually valid before redirecting
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // If there's an error or no session, clear user state and stay on login
        if (error || !session) {
          console.log('Login page: No valid session found, clearing user state')
          // Clear any stale user state - but don't redirect to avoid loops
          return
        }
        
        // Verify the session user matches the current user
        if (session.user.id !== user.id) {
          console.log('Login page: Session user mismatch, clearing state')
          return
        }
        
        // Verify session hasn't expired
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at && session.expires_at < now) {
          console.log('Login page: Session expired, clearing state')
          await supabase.auth.signOut()
          return
        }
        
        // Session is valid and matches user - safe to redirect
        const isDemo = user.email?.endsWith('@bakesync.com')
        if (isDemo) {
          router.push('/demo/dashboard')
        } else if (user.bakeshopSlug) {
          router.push(`/${user.bakeshopSlug}/dashboard`)
        } else {
          // User logged in but no bakeshop - try to get bakeshop info
          try {
            const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
            const bakeshopInfo = await getBakeshopInfo(user, false)
            if (bakeshopInfo?.slug) {
              router.push(`/${bakeshopInfo.slug}/dashboard`)
            } else if (user.email?.endsWith('@bakesync.com')) {
              // Demo user
              router.push('/demo/dashboard')
            } else {
              // No bakeshop found - stay on login page
              // Don't automatically redirect to onboarding - let user navigate manually
              // This prevents automatic redirects when first visiting the site
              console.log('Login page: User logged in but no bakeshop found - staying on login page')
              if (user.role === 'baker' || user.role === 'cashier') {
                // Baker/cashier without bakeshop - check for pending membership
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
                      router.push(`/${slug}/dashboard`)
                      return
                    }
                  }
                } catch (membershipErr) {
                  console.warn('Error checking bakeshop membership:', membershipErr)
                }
                
                // No membership found - show message instead of redirecting to login (avoids loop)
                // For now, stay on login page but show a message
                console.warn('Baker/cashier has no bakeshop membership - they may need to wait for invitation')
                // Don't redirect to avoid loop - the user is already logged in
                // The UI should show a message that they need to wait for an invitation
                return
              } else {
                // Unknown role - redirect to login
                router.push('/login')
              }
            }
          } catch (err) {
            console.error('Error getting bakeshop info:', err)
            // Fallback based on user type
            if (user.email?.endsWith('@bakesync.com')) {
              router.push('/demo/dashboard')
            } else {
              // Don't automatically redirect to onboarding from login page
              // Stay on login page - user can navigate to onboarding manually if needed
              console.log('Login page: Error getting bakeshop info - staying on login page')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking session on login page:', error)
        // On error, don't redirect - stay on login page
      }
    }
    
    checkSessionAndRedirect()
  }, [user, isLoading, router])
  
  // Clear any stale state when page loads with clear parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('clear') === 'true') {
        // Clear all auth-related storage
        localStorage.removeItem('pendingUserData')
        localStorage.removeItem('onboardingData')
        localStorage.removeItem('pendingVerificationEmail')
        sessionStorage.clear()
        
        // Remove the clear parameter from URL
        window.history.replaceState({}, '', '/login')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)

    try {
      // Wait for login to complete and get redirect path
      const redirectPath = await login(email, password)
      
      // Wait longer to ensure Supabase session is fully established
      // and user state is loaded in AuthContext
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Check if we have a session before redirecting
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Session not established after login')
      }
      
      // Use window.location.href for a full page reload to ensure state is synced
      // This ensures the auth state is properly loaded before navigation
      window.location.href = redirectPath
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_NOT_CONFIRMED') {
        // Store email for verification page
        localStorage.setItem('pendingVerificationEmail', email)
        // Redirect to verification page
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      } else {
        setError(err instanceof Error ? err.message : "Login failed")
        setIsLoggingIn(false) // Only set loading false on error
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Croissant className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">BakeSync</CardTitle>
            <CardDescription className="mt-2">Sign in to your bakery management system</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoggingIn || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoggingIn || isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoggingIn || isLoading}>
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Demo Accounts:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Owner: owner@bakesync.com / owner123</p>
                <p>Baker: baker@bakesync.com / baker123</p>
                <p>Cashier: cashier@bakesync.com / cashier123</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
