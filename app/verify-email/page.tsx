"use client"

import { EmailVerification } from "@/components/auth/email-verification"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function VerifyEmailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email')
    const storedEmail = localStorage.getItem('pendingVerificationEmail')
    const pendingUserData = localStorage.getItem('pendingUserData')
    
    let targetEmail = ""
    
    if (emailParam) {
      targetEmail = emailParam
    } else if (storedEmail) {
      targetEmail = storedEmail
    } else if (pendingUserData) {
      const userData = JSON.parse(pendingUserData)
      targetEmail = userData.email
    } else if (user?.email) {
      targetEmail = user.email
    }

    if (targetEmail) {
      setEmail(targetEmail)
      setIsLoading(false)
    } else {
      // No email found, redirect to login
      router.push("/login")
    }
  }, [searchParams, user, router])

  useEffect(() => {
    // If user is logged in and verified, check if they need onboarding
    if (user && user.email_confirmed_at) {
      console.log('User is already verified, redirecting...', { 
        email: user.email, 
        bakeshopId: user.bakeshopId, 
        bakeshopSlug: user.bakeshopSlug 
      })
      
      setIsRedirecting(true)
      
      // For demo users, always go to demo dashboard
      if (user.email?.endsWith('@bakesync.com')) {
        router.push('/demo/dashboard')
        return
      }
      
      // Baker and cashier roles don't need onboarding - redirect to dashboard
      if (user.role === 'baker' || user.role === 'cashier') {
        if (user.bakeshopId && user.bakeshopSlug) {
          router.push(`/${user.bakeshopSlug}/dashboard`)
        } else {
          // Try to get bakeshop info (async IIFE)
          ;(async () => {
            try {
              const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
              const bakeshopInfo = await getBakeshopInfo(user, false)
              if (bakeshopInfo?.slug) {
                router.push(`/${bakeshopInfo.slug}/dashboard`)
              } else {
                // If no bakeshop found, they might need to wait for membership
                router.push('/login')
              }
            } catch (err) {
              console.error('Error getting bakeshop info:', err)
              router.push('/login')
            }
          })()
        }
        return
      }
      
      // Check if user has completed onboarding (has bakeshopId and bakeshopSlug)
      if (user.bakeshopId && user.bakeshopSlug) {
        // User has completed onboarding, redirect to their dashboard
        router.push(`/${user.bakeshopSlug}/dashboard`)
        return
      } else {
        // User needs to complete onboarding (only for owners)
        // Try to get bakeshop info first
        ;(async () => {
          try {
            const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
            const bakeshopInfo = await getBakeshopInfo(user, false)
            if (bakeshopInfo?.slug) {
              router.push(`/${bakeshopInfo.slug}/dashboard`)
            } else if (user.email?.endsWith('@bakesync.com')) {
              // Demo user
              router.push('/demo/dashboard')
            } else if (user.role === 'owner') {
              // Owner without bakeshop - needs onboarding
              router.push('/onboarding')
            } else {
              // Baker/cashier without bakeshop - shouldn't happen
              router.push('/login')
            }
          } catch (err) {
            console.error('Error getting bakeshop info:', err)
            // Fallback based on user type
            if (user.email?.endsWith('@bakesync.com')) {
              router.push('/demo/dashboard')
            } else if (user.role === 'owner') {
              router.push('/onboarding')
            } else {
              router.push('/login')
            }
          }
        })()
        return
      }
    }
  }, [user, router])

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">
            {isRedirecting ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!email) {
    return null
  }

  const handleVerified = () => {
    // Clear any stored verification data
    localStorage.removeItem('pendingVerificationEmail')
    localStorage.removeItem('pendingUserData')
    
    // The useEffect above will handle the redirect based on user state
    // This function just clears the data and lets the useEffect do the redirect
  }

  const handleResend = () => {
    // This could trigger additional logic like logging resend attempts
    console.log("Resending verification email")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <EmailVerification 
        email={email}
        onVerified={handleVerified}
        onResend={handleResend}
      />
    </div>
  )
}