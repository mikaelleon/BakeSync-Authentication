"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Croissant, AlertTriangle, Eye, EyeOff, Crown, ChefHat, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { validateInviteCode } from "@/lib/invite-code-utils"

export default function SignupPage() {
  const router = useRouter()
  const { signup } = useAuth()
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "owner" as "owner" | "baker" | "cashier",
    inviteCode: ""
  })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [inviteCodeError, setInviteCodeError] = useState("")
  const [validatedBakeshop, setValidatedBakeshop] = useState<{ id: string; name: string; role?: 'baker' | 'cashier' } | null>(null)

  // Validate invite code when baker/cashier is selected
  const handleInviteCodeChange = async (code: string) => {
    setFormData(prev => ({ ...prev, inviteCode: code }))
    setInviteCodeError("")
    setValidatedBakeshop(null)

    if (formData.role === "owner") {
      return // No invite code needed for owners
    }

    if (!code.trim()) {
      setInviteCodeError("Invite code is required for bakers and cashiers")
      return
    }

    if (code.length === 6) {
      const validation = await validateInviteCode(code)
      if (validation.success && validation.bakeshopId && validation.bakeshopName) {
        setValidatedBakeshop({
          id: validation.bakeshopId,
          name: validation.bakeshopName,
          role: validation.role
        })
        setInviteCodeError("")
        
        // If the invite code is role-specific, auto-select that role
        if (validation.role && (validation.role === 'baker' || validation.role === 'cashier')) {
          setFormData(prev => ({ ...prev, role: validation.role! }))
        }
      } else {
        setInviteCodeError(validation.error || "Invalid invite code")
        setValidatedBakeshop(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    // Validate invite code for bakers/cashiers
    if (formData.role !== "owner") {
      if (!formData.inviteCode.trim()) {
        setError("Invite code is required for bakers and cashiers")
        setIsLoading(false)
        return
      }

      if (!validatedBakeshop) {
        setError("Please enter a valid invite code")
        setIsLoading(false)
        return
      }
    }

    try {
      // For bakers/cashiers, store validated bakeshop info
      const signupMetadata: any = {
        name: formData.fullName,
        role: formData.role
      }

      if (formData.role === "owner") {
        signupMetadata.businessName = formData.businessName
      } else if (validatedBakeshop) {
        // Store bakeshop info for invited members
        signupMetadata.bakeshopId = validatedBakeshop.id
        signupMetadata.bakeshopName = validatedBakeshop.name
        signupMetadata.inviteCode = formData.inviteCode
      }

      // Create user account using auth context
      const result = await signup(formData.email, formData.password, signupMetadata)

      // Always redirect to email verification if needed
      // Even if email is auto-confirmed, we should still check the result
      if (result.needsVerification) {
        // Store user data for after verification
        localStorage.setItem('pendingUserData', JSON.stringify({
          email: formData.email,
          name: formData.fullName,
          businessName: formData.businessName || '',
          role: formData.role,
          bakeshopId: validatedBakeshop?.id,
          bakeshopName: validatedBakeshop?.name,
          inviteCode: formData.inviteCode
        }))
        
        // Redirect to email verification page
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        // Email is already confirmed (development mode or demo account)
        // Wait longer for auth state to update and user to be logged in
        // This is critical for owners who need to go to onboarding
        console.log('Signup: Email confirmed, waiting for auth state to update...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Check if user is actually logged in before redirecting
        try {
          const { createClient } = await import('@/lib/supabase-client')
          const supabase = createClient()
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            // User is not logged in yet, redirect to verify-email instead
            console.warn('Signup: User not logged in after signup, redirecting to verify-email')
            localStorage.setItem('pendingUserData', JSON.stringify({
              email: formData.email,
              name: formData.fullName,
              businessName: formData.businessName || '',
              role: formData.role,
              bakeshopId: validatedBakeshop?.id,
              bakeshopName: validatedBakeshop?.name,
              inviteCode: formData.inviteCode
            }))
            router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
            return
          }
          
          console.log('Signup: Session confirmed, user ID:', session.user.id)
          
          // Store onboarding data in localStorage
          localStorage.setItem('onboardingData', JSON.stringify({
            businessName: formData.businessName,
            fullName: formData.fullName,
            role: formData.role,
            email: formData.email,
            bakeshopId: validatedBakeshop?.id,
            bakeshopName: validatedBakeshop?.name
          }))

          // For bakers/cashiers, try to get bakeshop slug and redirect to their dashboard
          if (formData.role !== "owner" && validatedBakeshop) {
            // Try to get bakeshop slug
            try {
              const { data: bakeshop } = await supabase
                .from('bakeshops')
                .select('slug')
                .eq('id', validatedBakeshop.id)
                .single()
              
              if (bakeshop?.slug) {
                console.log('Signup: Redirecting baker/cashier to dashboard:', bakeshop.slug)
                router.push(`/${bakeshop.slug}/dashboard`)
              } else {
                // No bakeshop slug found - shouldn't happen, but redirect to login
                console.warn('Signup: Baker/cashier without bakeshop slug, redirecting to login')
                router.push('/login')
              }
            } catch (err) {
              console.warn('Error getting bakeshop slug:', err)
              // Fallback: redirect to login for bakers/cashiers
              router.push('/login')
            }
          } else {
            // Owners go to onboarding (can complete setup)
            console.log('Signup: Redirecting owner to onboarding')
            // Use window.location for a full page reload to ensure auth state is synced
            window.location.href = '/onboarding'
          }
        } catch (err) {
          console.error('Error checking session after signup:', err)
          // On error, redirect to verify-email to be safe
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sign up failed"
      setError(errorMessage)
      
      // If it's a rate limit error, show additional help
      if (errorMessage.toLowerCase().includes('rate limit')) {
        console.warn('Rate limit error detected. Consider:', [
          '1. Wait a few minutes before trying again',
          '2. Configure custom SMTP in Supabase Dashboard',
          '3. Use a different email for testing',
          '4. Check Supabase project limits'
        ])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Croissant className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Join BakeSync</CardTitle>
            <CardDescription className="mt-2">
              Create your account to start managing your bakery
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{error}</p>
                    {error.toLowerCase().includes('rate limit') && (
                      <div className="mt-2 text-sm space-y-2">
                        <p className="font-medium">Quick Fixes:</p>
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                          <p className="font-semibold text-blue-900">Option 1: Disable Email Confirmation (Recommended)</p>
                          <p className="text-blue-800 text-xs">
                            Go to Supabase Dashboard → Authentication → Settings → Disable "Enable email confirmations"
                          </p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded p-3 space-y-2">
                          <p className="font-semibold text-green-900">Option 2: Enable Development Bypass</p>
                          <p className="text-green-800 text-xs">
                            Open browser console (F12) and run: <code className="bg-green-100 px-1 rounded">localStorage.setItem('skipEmailVerification', 'true')</code>
                          </p>
                        </div>
                        <div className="bg-purple-50 border border-purple-200 rounded p-3 space-y-2">
                          <p className="font-semibold text-purple-900">Option 3: Use Demo Account</p>
                          <p className="text-purple-800 text-xs">
                            Use <code className="bg-purple-100 px-1 rounded">owner@bakesync.com</code> or <code className="bg-purple-100 px-1 rounded">baker@bakesync.com</code> for testing
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          See <code className="bg-gray-100 px-1 rounded">docs/RATE_LIMIT_SOLUTION.md</code> for detailed instructions
                        </p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {formData.role === "owner" && (
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  type="text"
                  placeholder="Your Bakery Name"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your Full Name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Label>Select Your Role</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => {
                  handleInputChange('role', value)
                  // Clear invite code when switching to owner
                  if (value === "owner") {
                    setFormData(prev => ({ ...prev, inviteCode: "" }))
                    setInviteCodeError("")
                    setValidatedBakeshop(null)
                  }
                }}
                disabled={isLoading}
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem value="owner" id="role-owner" className="peer sr-only" />
                  <Label
                    htmlFor="role-owner"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Crown className="mb-3 h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Owner</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Full access to all features
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="baker" id="role-baker" className="peer sr-only" />
                  <Label
                    htmlFor="role-baker"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <ChefHat className="mb-3 h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Baker</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Recipes, production, inventory
                      </div>
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="cashier" id="role-cashier" className="peer sr-only" />
                  <Label
                    htmlFor="role-cashier"
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <ShoppingCart className="mb-3 h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">Cashier</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        POS, sales, transactions
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formData.role !== "owner" && (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code *</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="Enter 6-character invite code"
                  value={formData.inviteCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                    handleInviteCodeChange(code)
                  }}
                  maxLength={6}
                  required={true}
                  disabled={isLoading}
                  className={inviteCodeError ? "border-destructive" : validatedBakeshop ? "border-green-500" : ""}
                />
                {inviteCodeError && (
                  <p className="text-sm text-destructive">{inviteCodeError}</p>
                )}
                {validatedBakeshop && (
                  <div className="text-sm text-green-600 space-y-1">
                    <p>✓ Valid code for: {validatedBakeshop.name}</p>
                    {validatedBakeshop.role && (
                      <p className="font-medium">Role: {validatedBakeshop.role.charAt(0).toUpperCase() + validatedBakeshop.role.slice(1)}</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ask your bakery owner for the invite code
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
