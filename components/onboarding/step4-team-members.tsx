"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { ArrowRight, ArrowLeft, SkipForward, Plus, Trash2, Mail } from "lucide-react"

interface Step4Props {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

interface TeamMember {
  email: string
  role: string
  status: 'pending' | 'accepted'
}

export function OnboardingStep4({ data, onUpdate, onNext, onBack, onSkip }: Step4Props) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    data.teamMembers || []
  )

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [newMember, setNewMember] = useState({
    email: "",
    role: "baker"
  })

  const addTeamMember = () => {
    if (newMember.email.trim()) {
      const member: TeamMember = {
        email: newMember.email.trim(),
        role: newMember.role,
        status: 'pending'
      }
      setTeamMembers([...teamMembers, member])
      setNewMember({ email: "", role: "baker" })
      setIsInviteModalOpen(false)
    }
  }

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    onUpdate({ teamMembers })
    onNext()
  }

  const isEmailValid = newMember.email.includes('@') && newMember.email.includes('.')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Invite your team members</h1>
        <p className="text-muted-foreground mb-4">
          Add your bakers and cashiers to collaborate on BakeSync
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Step 4 of 5</span>
          <Progress value={80} className="w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Invite team members to join your bakery management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Team Members ({teamMembers.length})</h3>
              <p className="text-sm text-muted-foreground">
                Invite bakers and cashiers to help manage your bakery
              </p>
            </div>
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to a new team member
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">Email Address *</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="member@example.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberRole">Role *</Label>
                    <Select
                      value={newMember.role}
                      onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baker">Baker</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addTeamMember}
                      disabled={!isEmailValid}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Team members table */}
          {teamMembers.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={member.status === 'pending' ? 'outline' : 'default'}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTeamMember(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members invited yet.</p>
              <p className="text-sm">Click "Invite Member" to get started.</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">How invitations work</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Invited members will receive an email with instructions to create their account. 
                  They'll automatically be added to your bakery with the assigned role.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex items-center space-x-2"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip for now</span>
              </Button>
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
