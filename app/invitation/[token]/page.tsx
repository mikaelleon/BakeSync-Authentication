"use client"

import { InvitationAcceptance } from "@/components/team/invitation-acceptance"
import { useRouter } from "next/navigation"

interface InvitationPageProps {
  params: {
    token: string
  }
}

export default function InvitationPage({ params }: InvitationPageProps) {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to onboarding after successful invitation acceptance
    router.push("/onboarding")
  }

  return (
    <InvitationAcceptance 
      token={params.token} 
      onSuccess={handleSuccess}
    />
  )
}
