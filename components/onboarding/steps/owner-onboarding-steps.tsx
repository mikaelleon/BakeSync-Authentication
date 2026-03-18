"use client"

import { BusinessSetupWizard } from "../business-setup-wizard"

interface OwnerOnboardingStepsProps {
  currentStep: number
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  isLoading?: boolean
}

export function OwnerOnboardingSteps({ 
  currentStep, 
  data, 
  onComplete, 
  onBack, 
  isLoading = false 
}: OwnerOnboardingStepsProps) {
  // For owners, we use the full business setup wizard
  const userId = data?.userId || ''
  const bakeshopId = data?.bakeshopId || ''
  const role: any = 'owner'

  return (
    <BusinessSetupWizard userId={userId} bakeshopId={bakeshopId} role={role} onComplete={() => onComplete(data)} />
  )
}