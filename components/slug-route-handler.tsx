"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isValidBakeshopSlug, getBakeshopDisplayName, DEMO_BAKESHOP_SLUG } from "@/lib/bakeshop-names"

interface SlugRouteHandlerProps {
  children: React.ReactNode
  slug: string
}

export function SlugRouteHandler({ children, slug }: SlugRouteHandlerProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isValidating, setIsValidating] = useState(true)
  const validationRef = useRef(false)
  const redirectRef = useRef(false)

  // Optimized: Non-blocking validation - allow render while validating
  useEffect(() => {
    if (isLoading) {
      return
    }

    // Quick validation - if user exists, validate immediately
    if (user) {
      if (validationRef.current) return
      validationRef.current = true

      // Validate slug synchronously
      if (slug === DEMO_BAKESHOP_SLUG) {
        if (user.email.endsWith('@bakesync.com')) {
          setIsValidating(false)
          return
        } else {
          if (!redirectRef.current) {
            redirectRef.current = true
            router.push('/login')
          }
          return
        }
      } else {
        if (!isValidBakeshopSlug(slug)) {
          if (!redirectRef.current) {
            redirectRef.current = true
            router.push(`/${DEMO_BAKESHOP_SLUG}/dashboard`)
          }
          return
        }
        
        if (user.email.endsWith('@bakesync.com')) {
          if (!redirectRef.current) {
            redirectRef.current = true
            router.push(`/${DEMO_BAKESHOP_SLUG}/dashboard`)
          }
          return
        }
      }

      setIsValidating(false)
      return
    }

    // If no user, check session asynchronously (non-blocking)
    const checkSession = async () => {
      try {
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          if (!redirectRef.current) {
            redirectRef.current = true
            router.push('/login')
          }
          return
        }

        // Session exists - allow render to proceed, validation will happen when user loads
        setIsValidating(false)
      } catch (error) {
        console.error('SlugRouteHandler: Error checking session:', error)
        // On error, allow render to proceed (user might load)
        setIsValidating(false)
      }
    }

    // Non-blocking: Start validation immediately, don't wait
    checkSession()
    
    // Also set a short timeout to allow render if session check takes too long
    const timeoutId = setTimeout(() => {
      if (!redirectRef.current) {
        setIsValidating(false)
      }
    }, 100) // Very short timeout - just to prevent infinite loading

    return () => clearTimeout(timeoutId)
  }, [user, isLoading, slug, router])

  // Only show loading if we're actually waiting for auth
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

  // Allow children to render while validation happens in background
  // This enables instant tab switching
  return <>{children}</>
}
