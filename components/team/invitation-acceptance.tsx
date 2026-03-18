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
import { CheckCircle, XCircle, Clock, Building, User, Mail } from "lucide-react"

const invitationAcceptanceSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type InvitationAcceptanceData = z.infer<typeof invitationAcceptanceSchema>

interface Invitation {
  id: string
  email: string
  role: "baker" | "cashier"
  bakeshopName: string
  bakeshopId: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: "pending" | "accepted" | "expired"
  message?: string
}

interface InvitationAcceptanceProps {
  token: string
  onSuccess: () => void
}

export function InvitationAcceptance({ token, onSuccess }: InvitationAcceptanceProps) {
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAccepting, setIsAccepting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<InvitationAcceptanceData>({
    resolver: zodResolver(invitationAcceptanceSchema)
  })

  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      setLoading(true)
      // This would call your API to load the invitation
      const invitationData = await getInvitationByToken(token)
      setInvitation(invitationData)
    } catch (err) {
      setError("Invalid or expired invitation link")
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (data: InvitationAcceptanceData) => {
    if (!invitation) return

    try {
      setIsAccepting(true)
      
      // Create user account
      const user = await createUserAccount({
        email: invitation.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName
      })

      // Accept invitation
      await acceptInvitation(token, user.id)

      // Redirect to onboarding
      onSuccess()
    } catch (err) {
      setError("Failed to accept invitation. Please try again.")
    } finally {
      setIsAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h2>
              <p className="text-gray-600 mb-4">
                {error || "This invitation link is invalid or has expired."}
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()
  const roleLabels = {
    baker: "Baker",
    cashier: "Cashier"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <p className="text-gray-600">
              Join {invitation.bakeshopName} as a {roleLabels[invitation.role]}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {isExpired ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  This invitation has expired. Please contact the business owner for a new invitation.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Invitation Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{invitation.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{invitation.bakeshopName}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <Badge variant="secondary">
                      {roleLabels[invitation.role]}
                    </Badge>
                  </div>
                </div>

                {invitation.message && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Message:</strong> {invitation.message}
                    </p>
                  </div>
                )}

                {/* Account Setup Form */}
                <form onSubmit={handleSubmit(handleAcceptInvitation)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...register("firstName")}
                        placeholder="John"
                      />
                      {errors.firstName && (
                        <p className="text-sm text-red-600">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...register("lastName")}
                        placeholder="Doe"
                      />
                      {errors.lastName && (
                        <p className="text-sm text-red-600">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("password")}
                      placeholder="Create a secure password"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...register("confirmPassword")}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  {error && (
                    <Alert>
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isAccepting}
                  >
                    {isAccepting ? "Creating Account..." : "Accept Invitation & Create Account"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Mock API functions - these would be replaced with actual API calls
async function getInvitationByToken(token: string): Promise<Invitation> {
  // This would call your backend API
  return {
    id: "inv_123",
    email: "john@example.com",
    role: "baker",
    bakeshopName: "Sweet Dreams Bakery",
    bakeshopId: "bakeshop_123",
    invitedBy: "owner_123",
    invitedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: "pending",
    message: "Welcome to our team! We're excited to have you join us."
  }
}

async function createUserAccount(data: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<{ id: string }> {
  // This would call your backend API to create the user account
  return { id: "user_123" }
}

async function acceptInvitation(token: string, userId: string): Promise<void> {
  // This would call your backend API to accept the invitation
  console.log("Accepting invitation:", { token, userId })
}
