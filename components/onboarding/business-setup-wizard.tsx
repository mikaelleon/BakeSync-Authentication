"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from "lucide-react"
import { businessSetupAPI } from "@/lib/api/business-setup"
import { onboardingStateManager } from "@/lib/onboarding-state-manager"
import { BusinessDetailsStep } from "./steps/business-details-step"
import { InventorySetupStep } from "./steps/inventory-setup-step"
import { TeamSetupStep } from "./steps/team-setup-step"
import { SystemConfigStep } from "./steps/system-config-step"
import { ReviewStep } from "./steps/review-step"
import type { UserRole } from "@/lib/auth-context"

interface BusinessSetupWizardProps {
  userId: string
  bakeshopId: string
  role: UserRole
  onComplete: () => void
  onCancel?: () => void
}

export function BusinessSetupWizard({ userId, bakeshopId, role, onComplete, onCancel }: BusinessSetupWizardProps) {
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
    totalSteps: 5,
    progressPercentage: 0,
    isCompleted: false
  })

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
        setCurrentStep(prev => Math.min(prev + 1, 5))
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
      
      // Save final business setup data
      const businessData = {
        businessDetails: stepData[2],
        inventory: stepData[3],
        team: stepData[4]
      }

      const result = await businessSetupAPI.saveBusinessSetupData(
        bakeshopId,
        'business_details',
        1,
        businessData
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      // Mark onboarding as completed
      await onboardingStateManager.completeStep(userId, bakeshopId, role, 5, { completed: true })
      
      onComplete()
    } catch (error) {
      console.error('Error completing setup:', error)
      setError(error instanceof Error ? error.message : 'Failed to complete setup')
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
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const getStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessDetailsStep
            data={stepData[1] || {}}
            onUpdate={(data) => handleStepComplete(1, data)}
            onNext={() => setCurrentStep(2)}
            isLoading={isLoading}
          />
        )
      case 2:
        return (
          <BusinessDetailsStep
            data={stepData[2] || {}}
            onUpdate={(data) => handleStepComplete(2, data)}
            onNext={() => setCurrentStep(3)}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        )
      case 3:
        return (
          <InventorySetupStep
            data={stepData[3] || {}}
            onUpdate={(data) => handleStepComplete(3, data)}
            onNext={() => setCurrentStep(4)}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        )
      case 4:
        return (
          <TeamSetupStep
            data={stepData[4] || {}}
            onUpdate={(data) => handleStepComplete(4, data)}
            onNext={() => setCurrentStep(5)}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            bakeshopId={bakeshopId}
          />
        )
      case 5:
        return (
          <ReviewStep
            data={stepData}
            onComplete={handleComplete}
            onPrevious={handlePrevious}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Welcome & Setup"
      case 2:
        return "Business Details"
      case 3:
        return "Initial Inventory"
      case 4:
        return "Team Setup"
      case 5:
        return "Review & Complete"
      default:
        return "Setup"
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Complete your account setup and preferences"
      case 2:
        return "Set up your business information and location"
      case 3:
        return "Add your raw materials and products"
      case 4:
        return "Invite team members and assign roles"
      case 5:
        return "Review your setup and complete the process"
      default:
        return ""
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Business Setup</h1>
            <p className="text-muted-foreground">Complete your bakeshop setup in a few easy steps</p>
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
            <span>Step {currentStep} of {progress.totalSteps}</span>
            <span>{progress.progressPercentage}% Complete</span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mt-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step < currentStep 
                  ? 'bg-green-500 text-white' 
                  : step === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step}</span>
                )}
              </div>
              <span className="text-xs mt-1 text-center max-w-20">
                {step === 1 && 'Welcome'}
                {step === 2 && 'Business'}
                {step === 3 && 'Inventory'}
                {step === 4 && 'Team'}
                {step === 5 && 'Review'}
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
            {getStepTitle()}
          </CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
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