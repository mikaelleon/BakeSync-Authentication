// Onboarding Completion Management
// Phase 1: Critical Foundation - BakeSync ERP

import { createClient } from "./supabase-client"
import type { User } from "./auth-context"

export interface OnboardingStatus {
  isCompleted: boolean
  currentStep: number
  completedSteps: number[]
  needsOnboarding: boolean
  completedAt?: string
  bakeshopId?: string
}

export interface OnboardingData {
  businessName?: string
  businessType?: string
  location?: string
  inventoryCategories?: any[]
  suppliers?: any[]
  teamMembers?: any[]
  [key: string]: any
}

const supabase = createClient()

/**
 * Check onboarding completion status for a user
 */
export async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    const { data, error } = await supabase.rpc('get_onboarding_status', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error getting onboarding status:', error)
      return {
        isCompleted: false,
        currentStep: 1,
        completedSteps: [],
        needsOnboarding: true
      }
    }

    return data as OnboardingStatus
  } catch (error) {
    console.error('Error getting onboarding status:', error)
    return {
      isCompleted: false,
      currentStep: 1,
      completedSteps: [],
      needsOnboarding: true
    }
  }
}

/**
 * Mark onboarding as complete for a user
 */
export async function markOnboardingComplete(
  userId: string,
  bakeshopId: string,
  onboardingData: OnboardingData = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('mark_onboarding_complete', {
      p_user_id: userId,
      p_bakeshop_id: bakeshopId,
      p_onboarding_data: onboardingData
    })

    if (error) {
      console.error('Error marking onboarding complete:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error marking onboarding complete:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Update onboarding progress (step completion)
 */
export async function updateOnboardingProgress(
  userId: string,
  bakeshopId: string,
  step: number,
  stepData: any = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current progress
    const currentStatus = await getOnboardingStatus(userId)
    
    // Add step to completed steps if not already there
    const completedSteps = [...currentStatus.completedSteps]
    if (!completedSteps.includes(step)) {
      completedSteps.push(step)
    }

    // Update the onboarding completion record
    const { error } = await supabase
      .from('onboarding_completion')
      .upsert({
        user_id: userId,
        bakeshop_id: bakeshopId,
        current_step: step,
        completed_steps: completedSteps,
        is_completed: false, // Will be set to true when all steps are done
        onboarding_data: stepData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,bakeshop_id'
      })

    if (error) {
      console.error('Error updating onboarding progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating onboarding progress:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Check if user needs onboarding
 */
export async function needsOnboarding(user: User): Promise<boolean> {
  if (!user?.id) return true

  // Demo accounts don't need onboarding
  if (user.email?.endsWith('@bakesync.com')) {
    return false
  }

  // Baker and cashier roles don't need onboarding - they join existing bakeshops
  if (user.role === 'baker' || user.role === 'cashier') {
    console.log('needsOnboarding: User is baker or cashier, no onboarding needed')
    return false
  }

  // If user has bakeshop info, they've completed onboarding
  // This is the most reliable check since bakeshop is created during onboarding
  if (user.bakeshopId || user.bakeshopSlug) {
    console.log('needsOnboarding: User has bakeshop info, onboarding complete')
    return false
  }

  // Try to check onboarding status via RPC (may not exist)
  try {
    const promiseWithTimeout = <T,>(p: Promise<T>, ms = 3000, defaultValue?: T) =>
      Promise.race([
        p,
        new Promise<T>(resolve => setTimeout(() => resolve(defaultValue as T), ms))
      ]) as Promise<T>

    const status = await promiseWithTimeout<any>(getOnboardingStatus(user.id), 3000, { needsOnboarding: true } as any)
    // Ensure we safely access needsOnboarding in case the race returned the default
    return !!(status && status.needsOnboarding)
  } catch (error) {
    console.warn('needsOnboarding: Error checking onboarding status, checking bakeshop directly:', error)
    
    // Fallback: Check if user has a bakeshop in the database
    try {
      const { data: bakeshop } = await supabase
        .from('bakeshops')
        .select('id')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .maybeSingle()
      
      if (bakeshop) {
        console.log('needsOnboarding: Found bakeshop for user, onboarding complete')
        return false
      }
    } catch (err) {
      console.error('needsOnboarding: Error checking bakeshop:', err)
    }
    
    // If we can't determine, assume onboarding is needed
    return true
  }
}

/**
 * Get the current onboarding step for a user
 */
export async function getCurrentOnboardingStep(userId: string): Promise<number> {
  const status = await getOnboardingStatus(userId)
  return status.currentStep
}

/**
 * Check if a specific onboarding step is completed
 */
export async function isOnboardingStepCompleted(
  userId: string, 
  step: number
): Promise<boolean> {
  const status = await getOnboardingStatus(userId)
  return status.completedSteps.includes(step)
}

/**
 * Get onboarding data for a user
 */
export async function getOnboardingData(userId: string): Promise<OnboardingData> {
  try {
    const { data, error } = await supabase
      .from('onboarding_completion')
      .select('onboarding_data')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error getting onboarding data:', error)
      return {}
    }

    return data.onboarding_data || {}
  } catch (error) {
    console.error('Error getting onboarding data:', error)
    return {}
  }
}

/**
 * Save onboarding data for a user
 */
export async function saveOnboardingData(
  userId: string,
  bakeshopId: string,
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('onboarding_completion')
      .upsert({
        user_id: userId,
        bakeshop_id: bakeshopId,
        onboarding_data: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,bakeshop_id'
      })

    if (error) {
      console.error('Error saving onboarding data:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Reset onboarding progress (for testing or re-onboarding)
 */
export async function resetOnboardingProgress(
  userId: string,
  bakeshopId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('onboarding_completion')
      .update({
        is_completed: false,
        current_step: 1,
        completed_steps: [],
        onboarding_data: {},
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('bakeshop_id', bakeshopId)

    if (error) {
      console.error('Error resetting onboarding progress:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error resetting onboarding progress:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Get onboarding statistics (for admin/analytics)
 */
export async function getOnboardingStats(): Promise<{
  totalUsers: number
  completedOnboarding: number
  inProgress: number
  notStarted: number
}> {
  try {
    const { data, error } = await supabase
      .from('onboarding_completion')
      .select('is_completed')

    if (error) {
      console.error('Error getting onboarding stats:', error)
      return {
        totalUsers: 0,
        completedOnboarding: 0,
        inProgress: 0,
        notStarted: 0
      }
    }

    const totalUsers = data.length
    const completedOnboarding = data.filter(record => record.is_completed).length
    const inProgress = data.filter(record => !record.is_completed && (record as any).completed_steps?.length > 0).length
    const notStarted = totalUsers - completedOnboarding - inProgress

    return {
      totalUsers,
      completedOnboarding,
      inProgress,
      notStarted
    }
  } catch (error) {
    console.error('Error getting onboarding stats:', error)
    return {
      totalUsers: 0,
      completedOnboarding: 0,
      inProgress: 0,
      notStarted: 0
    }
  }
}
