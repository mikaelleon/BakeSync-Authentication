"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowRight, ArrowLeft, Mail, User } from "lucide-react"
import { teamInvitationAPI } from "@/lib/api/team-invitations"
import { toast } from "@/hooks/use-toast"

interface TeamSetupStepProps {
  data: any
  onUpdate: (data: any) => Promise<void>
  onNext?: () => void
  onPrevious?: () => void
  isLoading?: boolean
  bakeshopId: string
}

interface TeamInvitation {
  email: string
  role: 'baker' | 'cashier'
  message: string
}

export function TeamSetupStep({ data, onUpdate, onNext, onPrevious, isLoading, bakeshopId }: TeamSetupStepProps) {
  const [invitations, setInvitations] = useState<TeamInvitation[]>(
    data.invitations || [
      { email: '', role: 'baker', message: '' }
    ]
  )

  const [isSending, setIsSending] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const roles = [
    { value: 'baker', label: 'Baker', description: 'Manages recipes, production, and inventory' },
    { value: 'cashier', label: 'Cashier', description: 'Handles sales, POS, and customer service' }
  ]

  const addInvitation = () => {
    setInvitations(prev => [...prev, { email: '', role: 'baker', message: '' }])
  }

  const removeInvitation = (index: number) => {
    if (invitations.length > 1) {
      setInvitations(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateInvitation = (index: number, field: keyof TeamInvitation, value: string) => {
    setInvitations(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate invitations
    const validInvitations = invitations.filter(inv => inv.email.trim() && inv.role)
    if (validInvitations.length === 0) {
      newErrors.invitations = 'At least one team invitation is required'
    }

    // Validate email addresses
    invitations.forEach((invitation, index) => {
      if (invitation.email.trim() && !/\S+@\S+\.\S+/.test(invitation.email)) {
        newErrors[`email_${index}`] = 'Please enter a valid email address'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSending(true)
      
      // Send invitations
      const validInvitations = invitations.filter(inv => inv.email.trim() && inv.role)
      const sentInvitations = []

      for (const invitation of validInvitations) {
        const result = await teamInvitationAPI.createInvitation(bakeshopId, {
          email: invitation.email,
          role: invitation.role,
          message: invitation.message
        })

        if (result.success && result.data) {
          sentInvitations.push({
            ...invitation,
            invitationId: result.data.invitationId,
            token: result.data.token,
            expiresAt: result.data.expiresAt
          })
        } else {
          throw new Error(result.error || 'Failed to create invitation')
        }
      }

      // Update data with sent invitations
      await onUpdate({
        invitations: sentInvitations,
        sentAt: new Date().toISOString()
      })

      toast({
        title: "Invitations Sent",
        description: `Successfully sent ${sentInvitations.length} team invitation(s)`,
      })

      if (onNext) {
        onNext()
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send invitations',
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSkip = async () => {
    await onUpdate({ invitations: [], skipped: true })
    if (onNext) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Invite Your Team</h3>
        <p className="text-muted-foreground">
          Invite team members to help manage your bakeshop. You can always add more later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Team Invitations
            <Button type="button" variant="outline" size="sm" onClick={addInvitation}>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </CardTitle>
          <CardDescription>
            Invite team members by email. They'll receive an invitation link to join your bakeshop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitations.map((invitation, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address *
                </Label>
                <Input
                  type="email"
                  value={invitation.email}
                  onChange={(e) => updateInvitation(index, 'email', e.target.value)}
                  placeholder="team@example.com"
                  className={errors[`email_${index}`] ? 'border-destructive' : ''}
                />
                {errors[`email_${index}`] && (
                  <p className="text-sm text-destructive">{errors[`email_${index}`]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Role *
                </Label>
                <Select value={invitation.role} onValueChange={(value) => updateInvitation(index, 'role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Personal Message (Optional)</Label>
                <Textarea
                  value={invitation.message}
                  onChange={(e) => updateInvitation(index, 'message', e.target.value)}
                  placeholder="Welcome to our team!"
                  rows={2}
                />
              </div>
              {invitations.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeInvitation(index)}
                  className="md:col-span-3"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          ))}
          {errors.invitations && (
            <p className="text-sm text-destructive">{errors.invitations}</p>
          )}
        </CardContent>
      </Card>

      {/* Role Information */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Here's what each role can do in your bakeshop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div key={role.value} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{role.label}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{role.description}</p>
                <div className="text-xs text-muted-foreground">
                  <strong>Can:</strong> View dashboard, manage recipes, update inventory, log production
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <div className="flex gap-2">
          {onPrevious && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading || isSending}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isLoading || isSending}
          >
            Skip for Now
          </Button>
        </div>
        <div>
          <Button
            type="submit"
            disabled={isLoading || isSending}
          >
            {isSending ? 'Sending Invitations...' : 'Send Invitations'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  )
}