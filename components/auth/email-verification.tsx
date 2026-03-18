"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Mail, Clock, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const verificationCodeSchema = z.object({
  code: z.string()
    .min(1, "Please enter a verification code")
    .refine((val) => val.length === 6, "Please enter a 6-digit verification code")
    .refine((val) => /^\d{6}$/.test(val), "Please enter a 6-digit verification code")
})

type VerificationCodeData = z.infer<typeof verificationCodeSchema>

interface EmailVerificationProps {
  email: string
  onVerified: () => void
  onResend?: () => void
}

export function EmailVerification({ email, onVerified, onResend }: EmailVerificationProps) {
  const { verifyEmail, resendVerification } = useAuth()
  const [verificationSent, setVerificationSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    trigger,
    setValue
  } = useForm<VerificationCodeData>({
    resolver: zodResolver(verificationCodeSchema),
    mode: "onChange",
    defaultValues: {
      code: ""
    }
  })

  const watchedCode = watch("code")

  // Log when valid code is entered
  useEffect(() => {
    if (watchedCode && watchedCode.length === 6 && /^\d{6}$/.test(watchedCode)) {
      console.log('Valid 6-digit code entered:', watchedCode)
    }
  }, [watchedCode])

  // Debug logging - MOVED AFTER useForm hook
  console.log('EmailVerification component state:', {
    email,
    verificationSent,
    isResending,
    error,
    formErrors: errors,
    watchedCode,
    hasInteracted
  })

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSendVerification = async () => {
    try {
      console.log('Sending verification email to:', email)
      setIsResending(true)
      setError(null)
      
      // Try to use the auth context to resend verification
      try {
        await resendVerification()
        console.log('Verification email sent successfully via auth context')
      } catch (authError) {
        console.warn('Auth context resend failed, trying direct Supabase call:', authError)
        
        // Fallback: Use Supabase directly
        const { createClient } = await import('@/lib/supabase-client')
        const supabase = createClient()
        
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email
        })
        
        if (error) {
          throw new Error(error.message)
        }
        
        console.log('Verification email sent successfully via direct Supabase call')
      }
      
      setVerificationSent(true)
      setCooldown(60) // 60 second cooldown
    } catch (err) {
      console.error('Error sending verification email:', err)
      setError(err instanceof Error ? err.message : "Failed to send verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  const handleVerifyCode = async (data: VerificationCodeData) => {
    try {
      console.log('Verifying code:', data.code)
      setIsVerifying(true)
      setError(null)
      
      // Use the auth context to verify the code
      await verifyEmail(data.code)
      
      console.log('Code verification successful')
      setSuccess(true)
      setTimeout(() => onVerified(), 1000)
    } catch (err) {
      console.error('Code verification failed:', err)
      setAttempts(prev => prev + 1)
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.")
      reset()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    await handleSendVerification()
    if (onResend) {
      onResend()
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Verified!</h2>
            <p className="text-gray-600">
              Your email has been successfully verified. Redirecting...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <p className="text-gray-600">
          We've sent a verification code to
        </p>
        <Badge variant="secondary" className="mt-2">
          {email}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {!verificationSent ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Click the button below to send a verification code to your email address.
            </p>
            <Button 
              onClick={handleSendVerification}
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Verification Code
                </>
              )}
            </Button>
            
            {/* Debug button for testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('Manually setting verification sent to true')
                    setVerificationSent(true)
                  }}
                  className="w-full"
                >
                  Debug: Skip to Code Input
                </Button>
                <Button 
                  variant="outline"
                  onClick={async () => {
                    console.log('Manually triggering validation')
                    const isValid = await trigger("code")
                    console.log('Validation result:', isValid)
                    console.log('Current errors:', errors)
                  }}
                  className="w-full"
                >
                  Debug: Trigger Validation
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Enter the 6-digit code we sent to your email address.
              </p>
            </div>

            <form onSubmit={handleSubmit(handleVerifyCode)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <Input
                    id="code"
                    {...register("code")}
                    placeholder="123456"
                    className={`text-center text-lg tracking-widest ${
                      watchedCode && watchedCode.length === 6 && /^\d{6}$/.test(watchedCode)
                        ? 'border-green-500 bg-green-50'
                        : errors.code
                        ? 'border-red-500'
                        : ''
                    }`}
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setValue("code", value)
                      setHasInteracted(true)
                      // Trigger validation after a short delay
                      setTimeout(() => trigger("code"), 10)
                    }}
                  />
                  {watchedCode && watchedCode.length === 6 && /^\d{6}$/.test(watchedCode) && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code.message}</p>
                )}
                {watchedCode && watchedCode.length === 6 && /^\d{6}$/.test(watchedCode) && !errors.code && (
                  <p className="text-sm text-green-600">✓ Valid verification code</p>
                )}
              </div>

              {error && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {attempts > 0 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    {attempts} attempt{attempts !== 1 ? 's' : ''} failed. 
                    {attempts >= 3 && " Please request a new code."}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify Email"}
              </Button>
              
              {/* Debug button for testing */}
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    console.log('Current form state:')
                    console.log('- Watched code:', watchedCode)
                    console.log('- Form errors:', errors)
                    console.log('- Code length:', watchedCode?.length)
                    console.log('- Is valid 6 digits:', /^\d{6}$/.test(watchedCode || ''))
                    
                    const isValid = await trigger("code")
                    console.log('Manual validation result:', isValid)
                  }}
                  className="w-full"
                >
                  Debug: Check Form State
                </Button>
              )}
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Didn't receive the code?
              </p>
              <Button
                variant="outline"
                onClick={handleResendCode}
                disabled={cooldown > 0 || isResending}
                className="w-full"
              >
                {cooldown > 0 ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Resend in {cooldown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        <div className="text-center text-xs text-gray-500">
          <p>
            The verification code will expire in 24 hours.
          </p>
          <p className="mt-1">
            If you don't see the email, check your spam folder.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

