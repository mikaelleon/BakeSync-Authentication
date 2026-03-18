"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { enhancedUserManager } from "@/lib/user-management-enhanced"
import { teamManager } from "@/lib/team-management"
import { notificationManager } from "@/lib/notification-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ArrowRight, ArrowLeft, Building2, Users, Settings, Bell, BarChart3, Croissant, AlertTriangle, RefreshCw } from "lucide-react"
import { generateBakeshopSlug } from "@/lib/bakeshop-names"
import { generateInviteCode } from "@/lib/invite-code-utils"
import { getCountryByCode, formatPhoneNumber, formatZipCode, validatePhoneNumber, validateZipCode } from "@/lib/country-data"
import { getRegions, getProvincesByRegion, getCitiesByProvince, getRegionName, getProvinceName, getCityName } from "@/lib/philippines-data"
import { getTranslations, type Language } from "@/lib/translations"

interface OnboardingData {
  businessName: string
  businessType: 'bakery' | 'cafe' | 'restaurant' | 'food_truck' | 'other'
  businessDescription?: string
  address: {
    street: string
    city: string
    cityCode?: string
    state: string
    province?: string
    provinceCode?: string
    region?: string
    regionCode?: string
    zipCode: string
    country: string
  }
  contact: {
    phone: string
    website?: string
    email: string
  }
  operatingHours: {
    monday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
    tuesday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
    wednesday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
    thursday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
    friday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
    saturday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
    sunday: { open: string; close: string; closed: boolean; is24Hours?: boolean }
  }
  preferences: {
    timezone: string
    currency: string
    language: string
    theme: 'light' | 'dark' | 'system'
  }
  notifications: {
    email: boolean
    push: boolean
    lowStock: boolean
    productionReminders: boolean
    teamUpdates: boolean
    systemAlerts: boolean
  }
  teamInvitations: Array<{
    email: string
    role: 'baker' | 'cashier'
    message?: string
  }>
}

const getStepTitles = (lang: Language) => {
  const t = getTranslations(lang)
  return [
    { id: 'business', title: t.onboarding.steps.business, icon: Building2 },
    { id: 'location', title: t.onboarding.steps.location, icon: Building2 },
    { id: 'hours', title: t.onboarding.steps.hours, icon: Settings },
    { id: 'preferences', title: t.onboarding.steps.preferences, icon: Settings },
    { id: 'notifications', title: t.onboarding.steps.notifications, icon: Bell },
    { id: 'team', title: t.onboarding.steps.team, icon: Users },
    { id: 'complete', title: t.onboarding.steps.complete, icon: CheckCircle }
]
}

export function EnhancedOnboarding() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const [data, setData] = useState<OnboardingData>({
    businessName: '',
    businessType: 'bakery',
    businessDescription: '',
    address: {
      street: '',
      city: '',
      cityCode: '',
      state: '',
      province: '',
      provinceCode: '',
      region: '',
      regionCode: '',
      zipCode: '',
      country: 'PH'
    },
    contact: {
      phone: '',
      website: '',
      email: user?.email || ''
    },
    operatingHours: {
      monday: { open: '08:00', close: '18:00', closed: false, is24Hours: false },
      tuesday: { open: '08:00', close: '18:00', closed: false, is24Hours: false },
      wednesday: { open: '08:00', close: '18:00', closed: false, is24Hours: false },
      thursday: { open: '08:00', close: '18:00', closed: false, is24Hours: false },
      friday: { open: '08:00', close: '18:00', closed: false, is24Hours: false },
      saturday: { open: '08:00', close: '18:00', closed: false, is24Hours: false },
      sunday: { open: '09:00', close: '17:00', closed: false, is24Hours: false }
    },
    preferences: {
      timezone: 'Asia/Manila', // Default to Philippines Time (PHT)
      currency: 'PHP', // Default to Philippine Peso
      language: 'en',
      theme: 'system'
    },
    notifications: {
      email: true,
      push: true,
      lowStock: true,
      productionReminders: true,
      teamUpdates: true,
      systemAlerts: true
    },
    teamInvitations: []
  })

  useEffect(() => {
    // Load existing onboarding data if available
    const savedData = localStorage.getItem('onboardingData')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        console.log('Loading onboarding data from localStorage:', parsed)
        // Merge saved data, ensuring businessName is properly set
        setData(prev => ({
          ...prev,
          businessName: parsed.businessName || prev.businessName,
          contact: {
            ...prev.contact,
            email: parsed.email || prev.contact.email
          }
        }))
      } catch (error) {
        console.error('Error loading saved onboarding data:', error)
      }
    }
  }, [])

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  // Get current language from preferences
  const currentLanguage = (data.preferences.language || 'en') as Language
  const t = getTranslations(currentLanguage)
  const STEPS = getStepTitles(currentLanguage)

  const validateCurrentStep = (): boolean => {
    const stepId = STEPS[currentStep]?.id
    
    switch (stepId) {
      case 'business':
        if (!data.businessName.trim()) {
          setError(t.onboarding.errors.businessNameRequired)
          return false
        }
        return true
      
      case 'location':
        const country = getCountryByCode('PH') // Always Philippines
        if (!data.address.street.trim() || !data.address.city.trim() || !data.address.zipCode.trim()) {
          setError(t.onboarding.errors.addressRequired)
          return false
        }
        if (!data.address.regionCode) {
          setError(t.onboarding.errors.regionRequired)
          return false
        }
        if (!data.address.provinceCode) {
          setError(t.onboarding.errors.provinceRequired)
          return false
        }
        if (!data.address.cityCode) {
          setError(t.onboarding.errors.cityRequired)
          return false
        }
        if (!data.contact.phone.trim()) {
          setError(t.onboarding.errors.phoneRequired)
          return false
        }
        if (!validatePhoneNumber(data.contact.phone, 'PH')) {
          setError(t.onboarding.errors.phoneFormat)
          return false
        }
        if (!validateZipCode(data.address.zipCode, 'PH')) {
          setError(t.onboarding.errors.zipFormat)
          return false
        }
        return true
      
      case 'hours':
        // Hours are optional, but validate format if provided
        return true
      
      case 'preferences':
        // Preferences have defaults, so always valid
        return true
      
      case 'notifications':
        // Notifications have defaults, so always valid
        return true
      
      case 'team':
        // Team setup is optional
        return true
      
      default:
        return true
    }
  }

  const nextStep = () => {
    if (!validateCurrentStep()) {
      return
    }
    
    if (currentStep < STEPS.length - 1) {
      setError(null) // Clear any previous errors
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    // Allow going to any previous step without validation
    if (stepIndex < currentStep) {
      setError(null)
      setCurrentStep(stepIndex)
      return
    }
    
    // If going forward, validate current step first
    if (stepIndex > currentStep) {
      if (!validateCurrentStep()) {
        return
      }
      setError(null)
      setCompletedSteps(prev => new Set([...prev, currentStep]))
      setCurrentStep(stepIndex)
      return
    }
    
    // If clicking on current step, do nothing
    if (stepIndex === currentStep) {
      return
    }
  }

  const handleComplete = async () => {
    if (!user) return

    // Clear any previous errors
    setError(null)

    // Validate required fields using the same validation as validateCurrentStep
    if (!data.businessName.trim()) {
      setError(t.onboarding.errors.businessNameRequired)
      return
    }

    // Validate address fields (matching the location step validation)
    if (!data.address.street.trim() || !data.address.city.trim() || !data.address.zipCode.trim()) {
      setError(t.onboarding.errors.addressRequired)
      return
    }
    if (!data.address.regionCode) {
      setError(t.onboarding.errors.regionRequired)
      return
    }
    if (!data.address.provinceCode) {
      setError(t.onboarding.errors.provinceRequired)
      return
    }
    if (!data.address.cityCode) {
      setError(t.onboarding.errors.cityRequired)
      return
    }
    if (!data.contact.phone.trim()) {
      setError(t.onboarding.errors.phoneRequired)
      return
    }
    if (!validatePhoneNumber(data.contact.phone, 'PH')) {
      setError(t.onboarding.errors.phoneFormat)
      return
    }
    if (!validateZipCode(data.address.zipCode, 'PH')) {
      setError(t.onboarding.errors.zipFormat)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Generate bakeshop slug from business name
      const bakeshopSlug = generateBakeshopSlug(data.businessName)
      
      // Create bakeshop
      const { createClient } = await import('@/lib/supabase-client')
      const supabase = createClient()

      console.log('Step 1: Checking for existing bakeshop...')
      // Check if user already has a bakeshop (in case they're retrying after a partial completion)
      const { data: existingBakeshop } = await supabase
        .from('bakeshop_memberships')
        .select('bakeshop_id, bakeshops(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      let bakeshop: any = null

      if (existingBakeshop?.bakeshops) {
        // User already has a bakeshop, use it
        console.log('Found existing bakeshop, using it:', existingBakeshop.bakeshop_id)
        bakeshop = existingBakeshop.bakeshops
      } else {
        // Create new bakeshop
        console.log('Step 1: Creating new bakeshop...')
        // Generate invite code for the bakeshop
        const inviteCode = generateInviteCode()
        
        // Use RPC function to create bakeshop (bypasses RLS to avoid recursion)
        // This function also automatically creates the owner membership
        console.log('Creating bakeshop using RPC function...')
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('create_bakeshop', {
          p_name: data.businessName,
          p_slug: bakeshopSlug,
          p_business_type: data.businessType,
          p_description: data.businessDescription || null,
          p_address: data.address || null,
          p_contact_info: data.contact || null,
          p_operating_hours: data.operatingHours || null,
          p_timezone: data.preferences.timezone,
          p_currency: data.preferences.currency,
          p_language: data.preferences.language,
          p_invite_code: inviteCode
        })
        
        if (rpcError) {
          console.error('RPC function error:', rpcError)
          console.error('Error code:', rpcError.code)
          console.error('Error message:', rpcError.message)
          console.error('Error details:', rpcError.details)
          console.error('Error hint:', rpcError.hint)
          
          // Check if it's a function not found error
          if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
            const errorDetails = [
              'Database function not found. Please ensure the create_bakeshop function is installed.',
              '',
              'TROUBLESHOOTING:',
              '1. Verify the function exists by running this in Supabase SQL Editor:',
              '   SELECT proname FROM pg_proc WHERE proname = \'create_bakeshop\';',
              '',
              '2. If no results, run the function creation script:',
              '   File: docs/database/create-bakeshop-function-only.sql',
              '',
              '3. Check for errors when running the SQL script',
              '4. Verify you\'re using the correct Supabase project',
              '5. Try refreshing your browser and clearing cache',
              '',
              `Error Code: ${rpcError.code || 'Unknown'}`,
              `Error Message: ${rpcError.message || 'No message'}`
            ].join('\n')
            
            throw new Error(errorDetails)
          }
          
          // Check if it's a duplicate key error (bakeshop already exists)
          if (rpcError.code === '23505' || rpcError.message?.includes('duplicate') || rpcError.message?.includes('unique')) {
            // Try to fetch the existing bakeshop by slug
            const { data: existingBySlug } = await supabase
              .from('bakeshops')
              .select('*')
              .eq('slug', bakeshopSlug)
              .eq('created_by', user.id)
              .maybeSingle()
            
            if (existingBySlug) {
              console.log('Found existing bakeshop by slug, using it')
              bakeshop = existingBySlug
            } else {
              throw new Error(`Bakeshop with this name already exists. Please use a different business name.`)
            }
          } else {
            // For any other error, throw with the message
            throw new Error(`Failed to create bakeshop: ${rpcError.message || 'Unknown error'}`)
          }
        } else if (rpcData) {
          // RPC function returns JSONB, which Supabase converts to an object
          // Handle both array and single object responses (for backward compatibility)
          const bakeshopData = Array.isArray(rpcData) ? rpcData[0] : rpcData
          
          if (bakeshopData) {
            console.log('Bakeshop created successfully via RPC function:', bakeshopData)
            bakeshop = bakeshopData
          } else {
            throw new Error('Failed to create bakeshop: No data returned from RPC function')
          }
        } else {
          throw new Error('Failed to create bakeshop: No data returned')
        }
        
        // Store invite code for display in complete step
        if (bakeshop?.invite_code) {
          localStorage.setItem('bakeshopInviteCode', bakeshop.invite_code)
        }
        
        // Note: The RPC function already creates the owner membership, so we don't need to create it manually
      }

      if (!bakeshop || !bakeshop.id) {
        throw new Error('Bakeshop was not found or created successfully')
      }

      console.log('Step 2: Checking bakeshop membership...')
      // Check if membership already exists (create_bakeshop function creates it automatically)
      const { data: existingMembership } = await supabase
        .from('bakeshop_memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('bakeshop_id', bakeshop.id)
        .maybeSingle()

      if (existingMembership) {
        console.log('Membership already exists (created by create_bakeshop function), skipping creation')
      } else {
        console.log('Membership does not exist, creating it...')
        // Get the user's role from user_metadata or localStorage
        let userRole: 'owner' | 'baker' | 'cashier' = 'owner' // Default to owner
        
        try {
          // First, try to get from localStorage (stored during signup)
          const onboardingData = localStorage.getItem('onboardingData')
          if (onboardingData) {
            const parsed = JSON.parse(onboardingData)
            if (parsed.role && ['owner', 'baker', 'cashier'].includes(parsed.role)) {
              userRole = parsed.role
              console.log('Role from localStorage:', userRole)
            }
          }
          
          // If not found in localStorage, try user_metadata
          if (userRole === 'owner') {
            const { data: authUser } = await supabase.auth.getUser()
            if (authUser?.user?.user_metadata?.role && ['owner', 'baker', 'cashier'].includes(authUser.user.user_metadata.role)) {
              userRole = authUser.user.user_metadata.role
              console.log('Role from user_metadata:', userRole)
            }
          }
        } catch (err) {
          console.warn('Could not determine user role, defaulting to owner:', err)
        }
        
        // Create bakeshop membership with the correct role
        // Use insert instead of upsert to avoid SELECT that causes recursion
        const { error: membershipError, data: membershipData } = await supabase
          .from('bakeshop_memberships')
          .insert({
            user_id: user.id,
            bakeshop_id: bakeshop.id,
            user_role: userRole,
            is_active: true,
            joined_at: new Date().toISOString()
          })
          .select()

        if (membershipError) {
          console.error('Error creating bakeshop membership:', membershipError)
          // Check if it's a duplicate key error (membership was created between checks)
          if (membershipError.code === '23505' || membershipError.message?.includes('duplicate') || membershipError.message?.includes('unique')) {
            console.log('Membership already exists (race condition), continuing...')
          } else {
            // This is critical - throw error to prevent continuing without membership
            throw new Error(`Failed to create bakeshop membership: ${membershipError.message || 'Unknown error'}`)
          }
        } else {
          console.log('Bakeshop membership created successfully:', membershipData)
        }
      }

      console.log('Step 3: Updating user profile...')
      // Update user profile with bakeshop info (non-critical, continue on error)
      try {
      await enhancedUserManager.updateUserProfile(user.id, {
        bakeshopId: bakeshop.id,
        bakeshopName: bakeshop.name
      })
      } catch (profileError) {
        console.warn('Warning: Failed to update user profile (non-critical):', profileError)
        // Continue anyway
      }

      console.log('Step 4: Updating AuthContext...')
      // Manually update the user in the AuthContext to ensure bakeshopSlug is present
      // This is crucial for the subsequent redirect to work correctly
      try {
        updateUser({
          ...user,
          bakeshopId: bakeshop.id,
          bakeshopSlug: bakeshop.slug
        }, 'onboarding-complete')
      } catch (updateError) {
        console.warn('Warning: Failed to update AuthContext (non-critical):', updateError)
        // Continue anyway
      }

      console.log('Step 5: Updating user preferences...')
      // Update user preferences (non-critical, continue on error)
      try {
      await enhancedUserManager.updateUserPreferences(user.id, {
        theme: data.preferences.theme,
        language: data.preferences.language,
        timezone: data.preferences.timezone,
        notifications: data.notifications
      })
      } catch (prefsError) {
        console.warn('Warning: Failed to update user preferences (non-critical):', prefsError)
        // Continue anyway
      }

      console.log('Step 6: Sending team invitations...')
      // Send team invitations (non-critical, continue on error)
      for (const invitation of data.teamInvitations) {
        try {
          await teamManager.inviteTeamMember(
            bakeshop.id,
            user.id,
            invitation.email,
            invitation.role,
            invitation.message
          )

          // Create notification for invitation
          await notificationManager.createTeamInvitationNotification(
            user.id,
            user.name,
            data.businessName,
            invitation.role
          )
        } catch (inviteError) {
          console.error('Error sending invitation:', inviteError)
          // Continue with other invitations
        }
      }

      console.log('Step 7: Marking onboarding as complete...')
      // Mark onboarding as complete in the database (non-critical, continue on error)
      try {
      const { error: completionError } = await supabase.rpc('mark_onboarding_complete', {
        p_user_id: user.id,
        p_bakeshop_id: bakeshop.id,
        p_onboarding_data: {
          businessName: data.businessName,
          businessType: data.businessType,
          address: data.address,
          contact: data.contact,
          completedAt: new Date().toISOString()
        }
      })

      if (completionError) {
          console.warn('Warning: Failed to mark onboarding complete (non-critical):', completionError)
        // Continue anyway - this is not critical
        }
      } catch (rpcError) {
        console.warn('Warning: RPC function may not exist (non-critical):', rpcError)
        // Continue anyway
      }

      console.log('Step 8: Logging activity...')
      // Log onboarding completion (non-critical, continue on error)
      try {
      await enhancedUserManager.logUserActivity(
        user.id,
        'onboarding_completed',
        'Completed business setup and onboarding process',
        { bakeshopId: bakeshop.id, businessName: data.businessName }
      )
      } catch (logError) {
        console.warn('Warning: Failed to log activity (non-critical):', logError)
        // Continue anyway
      }

      // Clear onboarding data
      localStorage.removeItem('onboardingData')
      
      // Clear bakeshop cache to ensure fresh data is loaded
      try {
        const { clearBakeshopCache } = await import('@/lib/bakeshop-cache')
        clearBakeshopCache(user.id)
      } catch (cacheError) {
        console.warn('Warning: Failed to clear bakeshop cache (non-critical):', cacheError)
      }

      console.log('Onboarding completed successfully:', {
        bakeshopId: bakeshop.id,
        bakeshopSlug: bakeshop.slug,
        userId: user.id
      })

      // Wait a bit for the user state to update in AuthContext
      // This ensures the dashboard can access the bakeshop info
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to appropriate slug-based dashboard
      const isDemo = user.email?.endsWith('@bakesync.com')
      const dashboardPath = isDemo ? '/demo/dashboard' : `/${bakeshop.slug}/dashboard`
      
      console.log('Redirecting to dashboard:', dashboardPath)
      
      // Use window.location.href for a full page reload to ensure auth state is synced
      // This ensures the user profile with bakeshop info is loaded correctly
      // Don't set isLoading to false here - let the redirect happen while still loading
      window.location.href = dashboardPath
    } catch (err) {
      console.error('Error completing onboarding:', err)
      setIsLoading(false) // Stop loading on error
      
      // Extract detailed error message
      let errorMessage = 'Failed to complete setup'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'object' && err !== null) {
        const supabaseError = err as any
        if (supabaseError.message) {
          errorMessage = supabaseError.message
        } else if (supabaseError.error?.message) {
          errorMessage = supabaseError.error.message
        }
      }
      
      console.error('Onboarding error details:', {
        error: err,
        errorMessage,
        data: {
          businessName: data.businessName,
          businessType: data.businessType,
          address: data.address,
          contact: data.contact
        }
      })
      setError(errorMessage)
    }
    // Note: We don't set isLoading to false in finally block for successful completion
    // because we want to redirect while still showing loading state
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/signup">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sign Up
              </Button>
            </Link>
          </div>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Croissant className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Welcome to BakeSync
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Let's set up your bakery management system in just a few steps
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                  <span className="text-sm font-semibold text-primary">{currentStep + 1}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    {STEPS[currentStep].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {currentLanguage === 'tl' ? 'Hakbang' : 'Step'} {currentStep + 1} {currentLanguage === 'tl' ? 'ng' : 'of'} {STEPS.length}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="px-3 py-1">
                {Math.round(progress)}% {currentLanguage === 'tl' ? 'Kumpleto' : 'Complete'}
              </Badge>
            </div>
            
            <Progress value={progress} className="h-3 mb-4" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {STEPS.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                    index < currentStep 
                      ? 'bg-success/10 text-success hover:bg-success/20 border border-success/20' 
                      : index === currentStep
                      ? 'bg-primary/10 text-primary ring-2 ring-primary/20 hover:bg-primary/20 border border-primary/20'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                  }`}
                  disabled={index === currentStep}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    index < currentStep 
                      ? 'bg-success/20' 
                      : index === currentStep
                      ? 'bg-primary/20'
                      : 'bg-muted'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      React.createElement(step.icon, { className: "h-4 w-4" })
                    )}
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {step.title}
                  </span>
                </button>
              ))}
            </div>
            </CardContent>
          </Card>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6 sm:p-8">
            {/* Show error alert for all steps except the complete step */}
            {error && currentStep !== 6 && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {currentStep === 0 && <BusinessDetailsStep data={data} updateData={updateData} language={currentLanguage} />}
            {currentStep === 1 && <LocationContactStep data={data} updateData={updateData} language={currentLanguage} />}
            {currentStep === 2 && <OperatingHoursStep data={data} updateData={updateData} language={currentLanguage} />}
            {currentStep === 3 && <PreferencesStep data={data} updateData={updateData} />}
            {currentStep === 4 && <NotificationsStep data={data} updateData={updateData} language={currentLanguage} />}
            {currentStep === 5 && <TeamSetupStep data={data} updateData={updateData} language={currentLanguage} />}
            {currentStep === 6 && <CompleteStep data={data} onComplete={handleComplete} isLoading={isLoading} error={error} language={currentLanguage} />}

            {/* Navigation */}
            {currentStep < STEPS.length - 1 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.onboarding.navigation.previous}
                </Button>

                <Button 
                  onClick={nextStep}
                >
                  {currentStep === STEPS.length - 2 ? t.onboarding.navigation.complete : t.onboarding.navigation.next}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Step Components
function BusinessDetailsStep({ data, updateData, language }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void; language: Language }) {
  const t = getTranslations(language)
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold tracking-tight mb-2">{t.onboarding.business.title}</h3>
        <p className="text-muted-foreground">{t.onboarding.business.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="businessName">
            {t.onboarding.business.businessName}
          </Label>
          <Input
            id="businessName"
            value={data.businessName}
            onChange={(e) => updateData({ businessName: e.target.value })}
            placeholder="e.g., Sweet Dreams Bakery"
            required
          />
          <p className="text-xs text-muted-foreground">{language === 'tl' ? 'Ipapakita ito sa iyong dashboard' : 'This will be displayed on your dashboard'}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessType">
            {t.onboarding.business.businessType}
          </Label>
          <Select
            value={data.businessType}
            onValueChange={(value) => updateData({ businessType: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === 'tl' ? 'Pumili ng uri ng negosyo' : 'Select your business type'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bakery">{t.onboarding.business.businessTypeOptions.bakery}</SelectItem>
              <SelectItem value="cafe">{t.onboarding.business.businessTypeOptions.cafe}</SelectItem>
              <SelectItem value="restaurant">{t.onboarding.business.businessTypeOptions.restaurant}</SelectItem>
              <SelectItem value="food_truck">{t.onboarding.business.businessTypeOptions.food_truck}</SelectItem>
              <SelectItem value="other">{t.onboarding.business.businessTypeOptions.other}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{language === 'tl' ? 'Tumutulong ito sa amin na magbigay ng mga nauugnay na feature' : 'This helps us provide relevant features'}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="businessDescription">
          {t.onboarding.business.businessDescription}
        </Label>
        <Textarea
          id="businessDescription"
          value={data.businessDescription}
          onChange={(e) => updateData({ businessDescription: e.target.value })}
          placeholder={language === 'tl' ? 'Sabihin sa amin ang tungkol sa iyong negosyo, kung ano ang ginagawa nitong espesyal, at kung ano ang kilala mo...' : "Tell us about your business, what makes it special, and what you're known for..."}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">{language === 'tl' ? 'Opsiyonal: Tumulong sa amin na mas maunawaan ang iyong negosyo' : 'Optional: Help us understand your business better'}</p>
      </div>
    </div>
  )
}

function LocationContactStep({ data, updateData, language }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void; language: Language }) {
  const t = getTranslations(language)
  const selectedCountry = getCountryByCode('PH') // Always Philippines
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [zipError, setZipError] = useState<string | null>(null)
  
  const regions = getRegions()
  const provinces = data.address.regionCode ? getProvincesByRegion(data.address.regionCode) : []
  const cities = data.address.regionCode && data.address.provinceCode 
    ? getCitiesByProvince(data.address.regionCode, data.address.provinceCode) 
    : []

  const handleRegionChange = (regionCode: string) => {
    const regionName = getRegionName(regionCode)
    updateData({
      address: {
        ...data.address,
        regionCode,
        region: regionName,
        provinceCode: '',
        province: '',
        cityCode: '',
        city: ''
      }
    })
  }

  const handleProvinceChange = (provinceCode: string) => {
    const provinceName = getProvinceName(data.address.regionCode || '', provinceCode)
    updateData({
      address: {
        ...data.address,
        provinceCode,
        province: provinceName,
        cityCode: '',
        city: ''
      }
    })
  }

  const handleCityChange = (cityCode: string) => {
    const cityName = getCityName(data.address.regionCode || '', data.address.provinceCode || '', cityCode)
    updateData({
      address: {
        ...data.address,
        cityCode,
        city: cityName
      }
    })
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value, 'PH')
    updateData({ contact: { ...data.contact, phone: formatted } })
    
    if (formatted && !validatePhoneNumber(formatted, 'PH')) {
      setPhoneError(`Format: ${selectedCountry?.phoneFormat.example || '+639123456789'}`)
    } else {
      setPhoneError(null)
    }
  }

  const handleZipChange = (value: string) => {
    const formatted = formatZipCode(value, 'PH')
    updateData({ address: { ...data.address, zipCode: formatted } })
    
    if (formatted && !validateZipCode(formatted, 'PH')) {
      setZipError(`Format: ${selectedCountry?.zipCodeFormat.example || '1000'}`)
    } else {
      setZipError(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
          <div className="space-y-2">
          <Label htmlFor="country">{t.onboarding.location.country}</Label>
          <Input
            id="country"
            value="Philippines"
            disabled
            className="bg-muted"
          />
        </div>

        <h3 className="text-xl font-bold tracking-tight mb-4">{t.onboarding.location.address}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="street">{t.onboarding.location.street}</Label>
            <Input
              id="street"
              value={data.address.street}
              onChange={(e) => updateData({ address: { ...data.address, street: e.target.value } })}
              placeholder="123 Main St"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region">{t.onboarding.location.region}</Label>
            <Select
              value={data.address.regionCode || ''}
              onValueChange={handleRegionChange}
            >
              <SelectTrigger id="region" className="h-11">
                <SelectValue placeholder={language === 'tl' ? 'Pumili ng Rehiyon' : 'Select Region'} />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.code} value={region.code}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">{t.onboarding.location.province}</Label>
            <Select
              value={data.address.provinceCode || ''}
              onValueChange={handleProvinceChange}
              disabled={!data.address.regionCode}
            >
              <SelectTrigger id="province" className="h-11">
                <SelectValue placeholder={data.address.regionCode ? (language === 'tl' ? 'Pumili ng Lalawigan' : 'Select Province') : (language === 'tl' ? 'Pumili muna ng Rehiyon' : 'Select Region first')} />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province.code} value={province.code}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">{t.onboarding.location.city}</Label>
            <Select
              value={data.address.cityCode || ''}
              onValueChange={handleCityChange}
              disabled={!data.address.provinceCode}
            >
              <SelectTrigger id="city" className="h-11">
                <SelectValue placeholder={data.address.provinceCode ? (language === 'tl' ? 'Pumili ng Lungsod' : 'Select City') : (language === 'tl' ? 'Pumili muna ng Lalawigan' : 'Select Province first')} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.code} value={city.code}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">{t.onboarding.location.zipCode}</Label>
            <Input
              id="zipCode"
              type="text"
              value={data.address.zipCode}
              onChange={(e) => handleZipChange(e.target.value)}
              placeholder="1000"
              maxLength={4}
              required
              onKeyDown={(e) => {
                // Only allow numbers
                if (!/[0-9]/.test(e.key) && 
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
            />
            {zipError && (
              <p className="text-xs text-destructive">{zipError}</p>
            )}
            <p className="text-xs text-gray-500">{t.onboarding.location.zipExample}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight mb-4">{t.onboarding.location.contact}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">{t.onboarding.location.phone}</Label>
            <Input
              id="phone"
              type="tel"
              value={data.contact.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder={selectedCountry?.phoneFormat.placeholder || '+639123456789'}
              maxLength={selectedCountry?.phoneFormat.maxLength || 13}
              required
              onKeyDown={(e) => {
                // Only allow numbers, +, and navigation keys
                if (!/[0-9+]/.test(e.key) && 
                    !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault()
                }
              }}
            />
            {phoneError && (
              <p className="text-xs text-destructive">{phoneError}</p>
            )}
            <p className="text-xs text-gray-500">{t.onboarding.location.phoneExample}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t.onboarding.location.website}</Label>
            <Input
              id="website"
              type="url"
              value={data.contact.website}
              onChange={(e) => updateData({ contact: { ...data.contact, website: e.target.value } })}
              placeholder="https://yourbakery.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function OperatingHoursStep({ data, updateData, language }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void; language: Language }) {
  const t = getTranslations(language)
  const days = [
    { key: 'monday', label: t.onboarding.days.monday },
    { key: 'tuesday', label: t.onboarding.days.tuesday },
    { key: 'wednesday', label: t.onboarding.days.wednesday },
    { key: 'thursday', label: t.onboarding.days.thursday },
    { key: 'friday', label: t.onboarding.days.friday },
    { key: 'saturday', label: t.onboarding.days.saturday },
    { key: 'sunday', label: t.onboarding.days.sunday }
  ] as const

  const handle24HoursChange = (dayKey: string, checked: boolean) => {
    updateData({
      operatingHours: {
        ...data.operatingHours,
        [dayKey]: {
          ...data.operatingHours[dayKey as keyof typeof data.operatingHours],
          is24Hours: checked,
          open: checked ? '00:00' : data.operatingHours[dayKey as keyof typeof data.operatingHours].open || '08:00',
          close: checked ? '23:59' : data.operatingHours[dayKey as keyof typeof data.operatingHours].close || '18:00',
          closed: false // Uncheck closed if 24 hours is selected
        }
      }
    })
  }

  const handleClosedChange = (dayKey: string, checked: boolean) => {
    updateData({
      operatingHours: {
        ...data.operatingHours,
        [dayKey]: {
          ...data.operatingHours[dayKey as keyof typeof data.operatingHours],
          closed: checked,
          is24Hours: false // Uncheck 24 hours if closed is selected
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">{t.onboarding.hours.title}</h3>
        <p className="text-muted-foreground">{t.onboarding.hours.description}</p>
      </div>
      {days.map((day) => {
        const dayData = data.operatingHours[day.key]
        const is24Hours = dayData.is24Hours || false
        const isClosed = dayData.closed || false
        
        return (
        <div key={day.key} className="flex items-center space-x-4 p-4 border rounded-lg">
            <div className="w-24">
            <Label className="font-medium">{day.label}</Label>
          </div>
            <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`${day.key}-closed`}
                  checked={isClosed}
                  onCheckedChange={(checked) => handleClosedChange(day.key, checked as boolean)}
            />
                <Label htmlFor={`${day.key}-closed`}>{t.onboarding.hours.closed}</Label>
          </div>
              
              {!isClosed && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${day.key}-24hours`}
                      checked={is24Hours}
                      onCheckedChange={(checked) => handle24HoursChange(day.key, checked as boolean)}
                    />
                    <Label htmlFor={`${day.key}-24hours`}>{t.onboarding.hours.hours24Label}</Label>
                  </div>
                  
                  {!is24Hours && (
            <div className="flex items-center space-x-2">
              <Input
                type="time"
                        value={dayData.open}
                onChange={(e) => 
                  updateData({
                    operatingHours: {
                      ...data.operatingHours,
                      [day.key]: {
                                ...dayData,
                        open: e.target.value
                      }
                    }
                  })
                }
                className="w-32"
              />
                      <span>{language === 'tl' ? 'hanggang' : 'to'}</span>
              <Input
                type="time"
                        value={dayData.close}
                onChange={(e) => 
                  updateData({
                    operatingHours: {
                      ...data.operatingHours,
                      [day.key]: {
                                ...dayData,
                        close: e.target.value
                      }
                    }
                  })
                }
                className="w-32"
              />
            </div>
          )}
                  
                  {is24Hours && (
                    <div className="text-sm text-muted-foreground font-medium">
                      {t.onboarding.hours.hours24}
        </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PreferencesStep({ data, updateData }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void }) {
  const { getAvailableCurrencies } = require('@/lib/currency-utils')
  const currencies = getAvailableCurrencies()
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">Preferences</h3>
        <p className="text-muted-foreground">Configure your system preferences</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={data.preferences.currency || 'PHP'}
            onValueChange={(value) => updateData({ preferences: { ...data.preferences, currency: value } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency: any) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Default currency: Philippine Peso (₱)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={data.preferences.language}
            onValueChange={(value) => updateData({ preferences: { ...data.preferences, language: value } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="tl">Tagalog</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

function NotificationsStep({ data, updateData, language }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void; language: Language }) {
  const t = getTranslations(language)
  const notificationOptions = [
    { key: 'email', label: t.onboarding.notifications.email, description: t.onboarding.notifications.emailDesc },
    { key: 'push', label: t.onboarding.notifications.push, description: t.onboarding.notifications.pushDesc },
    { key: 'lowStock', label: t.onboarding.notifications.lowStock, description: t.onboarding.notifications.lowStockDesc },
    { key: 'productionReminders', label: t.onboarding.notifications.productionReminders, description: t.onboarding.notifications.productionRemindersDesc },
    { key: 'teamUpdates', label: t.onboarding.notifications.teamUpdates, description: t.onboarding.notifications.teamUpdatesDesc },
    { key: 'systemAlerts', label: t.onboarding.notifications.systemAlerts, description: t.onboarding.notifications.systemAlertsDesc }
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2">{t.onboarding.notifications.title}</h3>
        <p className="text-muted-foreground">{t.onboarding.notifications.description}</p>
      </div>
      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id={option.key}
              checked={data.notifications[option.key]}
              onCheckedChange={(checked) => 
                updateData({
                  notifications: {
                    ...data.notifications,
                    [option.key]: checked as boolean
                  }
                })
              }
            />
            <div className="space-y-1">
              <Label htmlFor={option.key} className="font-medium">
                {option.label}
              </Label>
              <p className="text-sm text-gray-600">{option.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamSetupStep({ data, updateData, language }: { data: OnboardingData; updateData: (updates: Partial<OnboardingData>) => void; language: Language }) {
  const t = getTranslations(language)
  const addTeamMember = () => {
    updateData({
      teamInvitations: [
        ...data.teamInvitations,
        { email: '', role: 'baker', message: '' }
      ]
    })
  }

  const updateTeamMember = (index: number, updates: Partial<{ email: string; role: 'baker' | 'cashier'; message: string }>) => {
    const updated = [...data.teamInvitations]
    updated[index] = { ...updated[index], ...updates }
    updateData({ teamInvitations: updated })
  }

  const removeTeamMember = (index: number) => {
    const updated = data.teamInvitations.filter((_, i) => i !== index)
    updateData({ teamInvitations: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold tracking-tight mb-4">Invite Team Members</h3>
        <p className="text-gray-600 mb-4">
          Invite your team members to join your bakery management system. You can always add more later.
        </p>
      </div>

      <div className="space-y-4">
        {data.teamInvitations.map((member, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="font-medium">Team Member {index + 1}</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeTeamMember(index)}
              >
                Remove
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`email-${index}`}>Email Address *</Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  value={member.email}
                  onChange={(e) => updateTeamMember(index, { email: e.target.value })}
                  placeholder="teammate@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`role-${index}`}>Role *</Label>
                <Select
                  value={member.role}
                  onValueChange={(value) => updateTeamMember(index, { role: value as 'baker' | 'cashier' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baker">Baker</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`message-${index}`}>Personal Message (Optional)</Label>
              <Textarea
                id={`message-${index}`}
                value={member.message}
                onChange={(e) => updateTeamMember(index, { message: e.target.value })}
                placeholder="Welcome to our team! Looking forward to working with you."
                rows={2}
              />
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addTeamMember} className="w-full">
          <Users className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>
    </div>
  )
}

function CompleteStep({ data, onComplete, isLoading, error, language }: { data: OnboardingData; onComplete: () => void; isLoading: boolean; error: string | null; language: Language }) {
  const t = getTranslations(language)
  
  // If there's an error, show error state instead of success
  if (error) {
    return (
      <div className="text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-3">Setup Failed</h3>
          <p className="text-lg text-gray-600">
            There was an error completing your setup. Please try again.
          </p>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-xl text-left space-y-3 max-w-md mx-auto">
          <h4 className="font-semibold text-red-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Error Details:
          </h4>
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>
        </div>
        <div className="pt-4">
          <Button
            onClick={onComplete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 h-12 text-base font-medium"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Show success state when no error
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-2">
            Setup Complete!
          </h3>
          <p className="text-muted-foreground">
            Your bakery management system is ready to go. Let's start managing your business!
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            What's Next
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <span className="text-sm">Set up your inventory items</span>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <span className="text-sm">Add your recipes and ingredients</span>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <span className="text-sm">Configure your suppliers</span>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">4</span>
              </div>
              <span className="text-sm">Start logging production</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center pt-4">
        <Button
          onClick={onComplete}
          disabled={isLoading}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Completing Setup...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
