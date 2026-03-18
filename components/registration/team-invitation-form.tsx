"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Mail, User, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const invitationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["baker", "cashier"], {
    required_error: "Please select a role"
  }),
  message: z.string().max(200, "Message must be less than 200 characters").optional()
})

type InvitationData = z.infer<typeof invitationSchema>

interface TeamInvitation {
  id: string
  email: string
  role: "baker" | "cashier"
  message?: string
  status: "pending" | "sent" | "accepted" | "expired"
  invitedAt: Date
}

interface TeamInvitationFormProps {
  onInvite: (invitations: TeamInvitation[]) => void
  onSkip?: () => void
  isLoading?: boolean
}

const roleDescriptions = {
  baker: {
    title: "Baker",
    description: "Can manage recipes, inventory, and production logs",
    permissions: ["View recipes", "Manage inventory", "Log production", "View dashboard"]
  },
  cashier: {
    title: "Cashier", 
    description: "Can process sales and manage POS operations",
    permissions: ["Access POS", "Process sales", "View dashboard"]
  }
}

export function TeamInvitationForm({ onInvite, onSkip, isLoading = false }: TeamInvitationFormProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [currentInvitation, setCurrentInvitation] = useState<Partial<InvitationData>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<InvitationData>({
    resolver: zodResolver(invitationSchema)
  })

  const selectedRole = watch("role")

  const addInvitation = (data: InvitationData) => {
    // Check if email already exists
    if (invitations.some(inv => inv.email === data.email)) {
      return
    }

    const newInvitation: TeamInvitation = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      role: data.role,
      message: data.message,
      status: "pending",
      invitedAt: new Date()
    }

    setInvitations(prev => [...prev, newInvitation])
    reset()
  }

  const removeInvitation = (id: string) => {
    setInvitations(prev => prev.filter(inv => inv.id !== id))
  }

  const handleSendInvitations = () => {
    onInvite(invitations)
  }

  const canAddMore = invitations.length < 10 // Limit to 10 invitations

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Invite Your Team</h2>
        <p className="text-gray-600 mt-2">
          Add team members to help manage your bakery. You can always invite more later.
        </p>
      </div>

      {/* Current Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {roleDescriptions[invitation.role].title}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {invitation.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInvitation(invitation.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Invitation Form */}
      {canAddMore && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(addInvitation)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="colleague@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(value) => setValue("role", value as "baker" | "cashier")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baker">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Baker</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cashier">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>Cashier</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>
              </div>

              {/* Role Description */}
              {selectedRole && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{roleDescriptions[selectedRole].title}:</strong>{" "}
                    {roleDescriptions[selectedRole].description}
                    <br />
                    <span className="text-sm text-gray-600">
                      Permissions: {roleDescriptions[selectedRole].permissions.join(", ")}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Input
                  id="message"
                  {...register("message")}
                  placeholder="Add a personal note to the invitation..."
                />
                {errors.message && (
                  <p className="text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add to Invitation List
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        {onSkip && (
          <Button variant="outline" onClick={onSkip}>
            Skip for Now
          </Button>
        )}
        <div className="flex space-x-3 ml-auto">
          {invitations.length > 0 && (
            <Button
              onClick={handleSendInvitations}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? "Sending..." : `Send ${invitations.length} Invitation${invitations.length !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Team members will receive an email invitation to join your bakery.
          They can accept the invitation and set up their accounts.
        </p>
      </div>
    </div>
  )
}
