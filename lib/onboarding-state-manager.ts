import { createClient } from "@/lib/supabase-client"
import type { UserRole } from "./auth-context"

export interface OnboardingStep {
  id: number
  title: string
  description: string
  isCompleted: boolean
  completedAt?: Date
  data?: any
}

export interface OnboardingProgress {
  userId: string
  bakeshopId: string
  role: UserRole
  currentStep: number
  totalSteps: number
  isCompleted: boolean
  completedAt?: Date
  steps: OnboardingStep[]
  lastUpdated: Date
}

export interface OnboardingState {
  currentStep: number
  completedSteps: number[]
  stepData: Record<number, any>
  isCompleted: boolean
  lastSaved: Date
}

export class OnboardingStateManager {
  private supabase = createClient()

  // Get onboarding steps based on user role
  getOnboardingSteps(role: UserRole): OnboardingStep[] {
    const baseSteps = [
      {
        id: 1,
        title: 'Welcome & Setup',
        description: 'Complete your account setup and preferences',
        isCompleted: false
      }
    ]

    switch (role) {
      case 'owner':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Business Details',
            description: 'Set up your business information and location',
            isCompleted: false
          },
          {
            id: 3,
            title: 'Initial Inventory',
            description: 'Add your raw materials and products',
            isCompleted: false
          },
          {
            id: 4,
            title: 'Team Setup',
            description: 'Invite team members and assign roles',
            isCompleted: false
          },
          {
            id: 5,
            title: 'System Configuration',
            description: 'Configure settings and preferences',
            isCompleted: false
          }
        ]

      case 'baker':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'Production Setup',
            description: 'Configure your production workflow and preferences',
            isCompleted: false
          },
          {
            id: 3,
            title: 'Recipe Management',
            description: 'Set up your recipe management preferences',
            isCompleted: false
          },
          {
            id: 4,
            title: 'Inventory Access',
            description: 'Configure inventory access and alerts',
            isCompleted: false
          }
        ]

      case 'cashier':
        return [
          ...baseSteps,
          {
            id: 2,
            title: 'POS Setup',
            description: 'Configure your point of sale settings',
            isCompleted: false
          },
          {
            id: 3,
            title: 'Product Knowledge',
            description: 'Learn about products and customer service',
            isCompleted: false
          },
          {
            id: 4,
            title: 'Sales Training',
            description: 'Complete sales training and certification',
            isCompleted: false
          }
        ]

      default:
        return baseSteps
    }
  }

  // Save onboarding progress to database
  async saveProgress(
    userId: string,
    bakeshopId: string,
    role: UserRole,
    stepNumber: number,
    stepData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.rpc('save_onboarding_progress', {
        p_user_id: userId,
        p_bakeshop_id: bakeshopId,
        p_role: role,
        p_step_number: stepNumber,
        p_step_data: stepData
      })

      if (error) throw error

      // Also save to localStorage as backup
      this.saveToLocalStorage(userId, stepNumber, stepData)

      return { success: true }
    } catch (error) {
      console.error('Error saving onboarding progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save progress'
      }
    }
  }

  // Load onboarding progress from database
  async loadProgress(userId: string, bakeshopId: string, role: UserRole): Promise<OnboardingProgress | null> {
    try {
      const { data, error } = await this.supabase
        .from('onboarding_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('bakeshop_id', bakeshopId)
        .eq('role', role)
        .order('step_number', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        return null
      }

      const steps = this.getOnboardingSteps(role)
      const completedSteps = data.filter(item => item.is_completed)
      const currentStep = Math.max(...completedSteps.map(s => s.step_number)) + 1
      const isCompleted = completedSteps.length === steps.length

      // Update steps with completion status
      steps.forEach(step => {
        const completedStep = completedSteps.find(s => s.step_number === step.id)
        if (completedStep) {
          step.isCompleted = true
          step.completedAt = new Date(completedStep.completed_at)
          step.data = completedStep.step_data
        }
      })

      return {
        userId,
        bakeshopId,
        role,
        currentStep: Math.min(currentStep, steps.length),
        totalSteps: steps.length,
        isCompleted,
        completedAt: isCompleted ? new Date(Math.max(...completedSteps.map(s => new Date(s.completed_at).getTime()))) : undefined,
        steps,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error)
      // Fallback to localStorage
      return this.loadFromLocalStorage(userId, bakeshopId, role)
    }
  }

  // Resume incomplete onboarding session
  async resumeOnboarding(userId: string, bakeshopId: string, role: UserRole): Promise<OnboardingProgress | null> {
    try {
      // Try database first
      const progress = await this.loadProgress(userId, bakeshopId, role)
      if (progress && !progress.isCompleted) {
        return progress
      }

      // Fallback to localStorage
      return this.loadFromLocalStorage(userId, bakeshopId, role)
    } catch (error) {
      console.error('Error resuming onboarding:', error)
      return null
    }
  }

  // Mark step as completed
  async completeStep(
    userId: string,
    bakeshopId: string,
    role: UserRole,
    stepNumber: number,
    stepData: any
  ): Promise<{ success: boolean; isFullyCompleted?: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.rpc('complete_onboarding_step', {
        p_user_id: userId,
        p_bakeshop_id: bakeshopId,
        p_role: role,
        p_step_number: stepNumber,
        p_step_data: stepData
      })

      if (error) throw error

      // Check if all steps are completed
      const progress = await this.loadProgress(userId, bakeshopId, role)
      const isFullyCompleted = progress?.isCompleted || false

      return { success: true, isFullyCompleted }
    } catch (error) {
      console.error('Error completing step:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete step'
      }
    }
  }

  // Reset onboarding progress
  async resetProgress(userId: string, bakeshopId: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('onboarding_completion')
        .delete()
        .eq('user_id', userId)
        .eq('bakeshop_id', bakeshopId)
        .eq('role', role)

      if (error) throw error

      // Clear localStorage
      this.clearLocalStorage(userId)

      return { success: true }
    } catch (error) {
      console.error('Error resetting progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset progress'
      }
    }
  }

  // Get onboarding completion status
  async getCompletionStatus(userId: string, bakeshopId: string, role: UserRole): Promise<{
    isCompleted: boolean
    currentStep: number
    totalSteps: number
    progressPercentage: number
  }> {
    try {
      const progress = await this.loadProgress(userId, bakeshopId, role)
      
      if (!progress) {
        const steps = this.getOnboardingSteps(role)
        return {
          isCompleted: false,
          currentStep: 1,
          totalSteps: steps.length,
          progressPercentage: 0
        }
      }

      return {
        isCompleted: progress.isCompleted,
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        progressPercentage: Math.round((progress.steps.filter(s => s.isCompleted).length / progress.totalSteps) * 100)
      }
    } catch (error) {
      console.error('Error getting completion status:', error)
      return {
        isCompleted: false,
        currentStep: 1,
        totalSteps: 1,
        progressPercentage: 0
      }
    }
  }

  // LocalStorage backup methods
  private saveToLocalStorage(userId: string, stepNumber: number, stepData: any): void {
    if (typeof window === 'undefined') return

    try {
      const key = `onboarding_${userId}`
      const existing = localStorage.getItem(key)
      const data = existing ? JSON.parse(existing) : { steps: {}, lastSaved: new Date().toISOString() }
      
      data.steps[stepNumber] = {
        data: stepData,
        completedAt: new Date().toISOString()
      }
      data.lastSaved = new Date().toISOString()

      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }

  private loadFromLocalStorage(userId: string, bakeshopId: string, role: UserRole): OnboardingProgress | null {
    if (typeof window === 'undefined') return null

    try {
      const key = `onboarding_${userId}`
      const saved = localStorage.getItem(key)
      
      if (!saved) return null

      const data = JSON.parse(saved)
      const steps = this.getOnboardingSteps(role)
      const completedSteps = Object.keys(data.steps).map(Number)
      const currentStep = Math.max(...completedSteps) + 1
      const isCompleted = completedSteps.length === steps.length

      // Update steps with completion status
      steps.forEach(step => {
        if (completedSteps.includes(step.id)) {
          step.isCompleted = true
          step.completedAt = new Date(data.steps[step.id].completedAt)
          step.data = data.steps[step.id].data
        }
      })

      return {
        userId,
        bakeshopId,
        role,
        currentStep: Math.min(currentStep, steps.length),
        totalSteps: steps.length,
        isCompleted,
        completedAt: isCompleted ? new Date(Math.max(...completedSteps.map(s => new Date(data.steps[s].completedAt).getTime()))) : undefined,
        steps,
        lastUpdated: new Date(data.lastSaved)
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
      return null
    }
  }

  private clearLocalStorage(userId: string): void {
    if (typeof window === 'undefined') return

    try {
      const key = `onboarding_${userId}`
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }

  // Validate step data
  validateStepData(stepNumber: number, stepData: any, role: UserRole): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    switch (role) {
      case 'owner':
        switch (stepNumber) {
          case 2: // Business Details
            if (!stepData.businessName?.trim()) {
              errors.push('Business name is required')
            }
            if (!stepData.businessType?.trim()) {
              errors.push('Business type is required')
            }
            if (!stepData.address?.trim()) {
              errors.push('Address is required')
            }
            if (!stepData.city?.trim()) {
              errors.push('City is required')
            }
            if (!stepData.state?.trim()) {
              errors.push('State is required')
            }
            if (!stepData.zipCode?.trim()) {
              errors.push('ZIP code is required')
            }
            if (!stepData.phone?.trim()) {
              errors.push('Phone number is required')
            }
            if (!stepData.email?.trim()) {
              errors.push('Email is required')
            }
            break
          case 3: // Initial Inventory
            if (!stepData.rawMaterials || stepData.rawMaterials.length === 0) {
              errors.push('At least one raw material is required')
            }
            if (!stepData.products || stepData.products.length === 0) {
              errors.push('At least one product is required')
            }
            break
        }
        break

      case 'baker':
        switch (stepNumber) {
          case 2: // Production Setup
            if (!stepData.workSchedule?.trim()) {
              errors.push('Work schedule is required')
            }
            if (!stepData.productionGoals?.trim()) {
              errors.push('Production goals are required')
            }
            break
        }
        break

      case 'cashier':
        switch (stepNumber) {
          case 2: // POS Setup
            if (!stepData.posSettings?.defaultPaymentMethod) {
              errors.push('Default payment method is required')
            }
            break
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const onboardingStateManager = new OnboardingStateManager()
