"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from "lucide-react"
import { onboardingStateManager } from "@/lib/onboarding-state-manager"
import { ProductionSetupStep } from "./steps/production-setup-step"
import { InventorySetupStep as InventoryAccessStep } from "./steps/inventory-setup-step"
import { TeamSetupStep } from "./steps/team-setup-step"
import { ReviewStep } from "./steps/review-step"
import { RecipeManagementStep } from "./steps/baker-onboarding-steps"

// Some onboarding step components referenced in older flows are not present
// in the codebase (e.g. recipe-management-step, pos-setup-step, product-knowledge-step,
// sales-training-step). Use a lightweight placeholder component for those steps
// so onboarding flow remains functional until those steps are implemented.

function PlaceholderStep({ title }: { title?: string }) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">{title || 'Step'}</h3>
      <p className="text-sm text-muted-foreground">This step is not yet implemented.</p>
    </div>
  )
}

// Lightweight placeholder step components for missing cashier flows
function POSSetupStep({ data, onUpdate, onNext, onPrevious, isLoading }: any) {
  return (
    <div>
      <PlaceholderStep title="POS Setup" />
      <div className="flex justify-between mt-4">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
            Back
          </Button>
        )}
        <Button onClick={async () => { await onUpdate?.({}); onNext?.(); }} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function ProductKnowledgeStep({ data, onUpdate, onNext, onPrevious, isLoading }: any) {
  return (
    <div>
      <PlaceholderStep title="Product Knowledge" />
      <div className="flex justify-between mt-4">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
            Back
          </Button>
        )}
        <Button onClick={async () => { await onUpdate?.({}); onNext?.(); }} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  )
}

function SalesTrainingStep({ data, onUpdate, onNext, onPrevious, isLoading }: any) {
  return (
    <div>
      <PlaceholderStep title="Sales Training" />
      <div className="flex justify-between mt-4">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
            Back
          </Button>
        )}
        <Button onClick={async () => { await onUpdate?.({}); onNext?.(); }} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  )
}
import type { UserRole } from "@/lib/auth-context"

interface RoleBasedOnboardingProps {
  userId: string
  bakeshopId: string
  role: UserRole
  onComplete: () => void
  onCancel?: () => void
}

export function RoleBasedOnboarding({ userId, bakeshopId, role, onComplete, onCancel }: RoleBasedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepData, setStepData] = useState<Record<number, any>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{
    currentStep: number
    totalSteps: number
    progressPercentage: number
    isCompleted: boolean
  }>({
    currentStep: 1,
    totalSteps: 1,
    progressPercentage: 0,
    isCompleted: false
  })

  // Get role-specific steps
  const getSteps = () => {
    switch (role) {
      case 'baker':
        return [
          { id: 1, title: 'Production Setup', description: 'Configure your production workflow' },
          { id: 2, title: 'Recipe Management', description: 'Set up recipe preferences' },
          { id: 3, title: 'Inventory Access', description: 'Configure inventory access and alerts' }
        ]
      case 'cashier':
        return [
          { id: 1, title: 'POS Setup', description: 'Configure your point of sale settings' },
          { id: 2, title: 'Product Knowledge', description: 'Learn about products and customer service' },
          { id: 3, title: 'Sales Training', description: 'Complete sales training and certification' }
        ]
      default:
        return [
          { id: 1, title: 'Welcome', description: 'Complete your account setup' }
        ]
    }
  }

  const steps = getSteps()

  // Load existing progress on mount
  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const onboardingProgress = await onboardingStateManager.loadProgress(userId, bakeshopId, role)
      if (onboardingProgress) {
        setCurrentStep(onboardingProgress.currentStep)
          const completedCount = onboardingProgress.steps.filter(s => s.isCompleted).length
        setProgress({
          currentStep: onboardingProgress.currentStep,
          totalSteps: onboardingProgress.totalSteps,
            progressPercentage: Math.round((completedCount / onboardingProgress.totalSteps) * 100),
          isCompleted: onboardingProgress.isCompleted
        })
        
        // Load step data
        const loadedStepData: Record<number, any> = {}
        onboardingProgress.steps.forEach(step => {
          if (step.data) {
            loadedStepData[step.id] = step.data
          }
        })
        setStepData(loadedStepData)
      } else {
        // Set initial progress
        setProgress({
          currentStep: 1,
          totalSteps: steps.length,
          progressPercentage: 0,
          isCompleted: false
        })
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  const handleStepComplete = async (stepNumber: number, data: any) => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate step data
      const validation = onboardingStateManager.validateStepData(stepNumber, data, role)
      if (!validation.isValid) {
        setError(validation.errors.join(', '))
        return
      }

      // Save step data
      setStepData(prev => ({ ...prev, [stepNumber]: data }))

      // Save to database
      const result = await onboardingStateManager.saveProgress(userId, bakeshopId, role, stepNumber, data)
      if (!result.success) {
        throw new Error(result.error)
      }

      // Mark step as completed
      const completeResult = await onboardingStateManager.completeStep(userId, bakeshopId, role, stepNumber, data)
      if (!completeResult.success) {
        throw new Error(completeResult.error)
      }

      // Update progress
      const newProgress = await onboardingStateManager.getCompletionStatus(userId, bakeshopId, role)
      setProgress(newProgress)

      // Move to next step or complete
      if (completeResult.isFullyCompleted) {
        await handleComplete()
      } else {
        setCurrentStep(prev => Math.min(prev + 1, steps.length))
      }
    } catch (error) {
      console.error('Error completing step:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete step')
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setIsLoading(true)
      
      // Mark onboarding as completed
      await onboardingStateManager.completeStep(userId, bakeshopId, role, steps.length, { completed: true })
      
      onComplete()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const getStepComponent = () => {
    switch (role) {
      case 'baker':
        switch (currentStep) {
          case 1:
            return (
              <ProductionSetupStep
                data={stepData[1] || {}}
                onUpdate={(data: any) => handleStepComplete(1, data)}
                onNext={() => setCurrentStep(2)}
                isLoading={isLoading}
              />
            )
          case 2:
            return (
              <RecipeManagementStep
                data={stepData[2] || {}}
                onUpdate={(data: any) => handleStepComplete(2, data)}
                onNext={() => setCurrentStep(3)}
                onPrevious={handlePrevious}
                isLoading={isLoading}
              />
            )
          case 3:
            return (
              <InventoryAccessStep
                data={stepData[3] || {}}
                onUpdate={(data: any) => handleStepComplete(3, data)}
                onNext={handleComplete}
                onPrevious={handlePrevious}
                isLoading={isLoading}
              />
            )
          default:
            return null
        }
      case 'cashier':
        switch (currentStep) {
          case 1:
            return (
              <POSSetupStep
                data={stepData[1] || {}}
                onUpdate={(data: any) => handleStepComplete(1, data)}
                onNext={() => setCurrentStep(2)}
                isLoading={isLoading}
              />
            )
          case 2:
            return (
              <ProductKnowledgeStep
                data={stepData[2] || {}}
                onUpdate={(data: any) => handleStepComplete(2, data)}
                onNext={() => setCurrentStep(3)}
                onPrevious={handlePrevious}
                isLoading={isLoading}
              />
            )
          case 3:
            return (
              <SalesTrainingStep
                data={stepData[3] || {}}
                onUpdate={(data: any) => handleStepComplete(3, data)}
                onNext={handleComplete}
                onPrevious={handlePrevious}
                isLoading={isLoading}
              />
            )
          default:
            return null
        }
      default:
        return null
    }
  }

  const getRoleTitle = () => {
    switch (role) {
      case 'baker':
        return 'Baker Onboarding'
      case 'cashier':
        return 'Cashier Onboarding'
      default:
        return 'Onboarding'
    }
  }

  const getRoleDescription = () => {
    switch (role) {
      case 'baker':
        return 'Set up your production workflow and recipe management preferences'
      case 'cashier':
        return 'Configure your POS system and complete sales training'
      default:
        return 'Complete your account setup'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">{getRoleTitle()}</h1>
            <p className="text-muted-foreground">{getRoleDescription()}</p>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel Setup
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{progress.progressPercentage}% Complete</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.id < currentStep 
                  ? 'bg-green-500 text-white' 
                  : step.id === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step.id < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <span className="text-xs mt-1 text-center max-w-20">
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Step {currentStep}</Badge>
            {steps[currentStep - 1]?.title}
          </CardTitle>
          <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {getStepComponent()}
        </CardContent>
      </Card>
    </div>
  )
}