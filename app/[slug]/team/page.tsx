"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { teamManager } from "@/lib/team-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Users, 
  UserPlus, 
  Mail, 
  Clock, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  AlertTriangle,
  Copy,
  Key,
  RotateCw
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { createRoleInviteCode, getRoleInviteCodes, deactivateRoleInviteCode } from "@/lib/invite-code-utils"

interface TeamMember {
  id: string
  email: string
  name: string
  role: 'owner' | 'baker' | 'cashier'
  isActive: boolean
  joinedAt: Date
  lastActiveAt?: Date
  permissions: string[]
  status: 'active' | 'inactive' | 'pending' | 'suspended'
}

interface TeamInvitation {
  id: string
  email: string
  role: 'baker' | 'cashier'
  invitedBy: string
  invitedByName: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expiresAt: Date
  createdAt: Date
  message?: string
}

export default function TeamPage() {
  return (
    <ProtectedRoute permission="manageTeam">
      <TeamPageContent />
    </ProtectedRoute>
  )
}

function TeamPageContent() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [memberToUpdateRole, setMemberToUpdateRole] = useState<TeamMember | null>(null)
  const [newRole, setNewRole] = useState<'baker' | 'cashier'>('baker')
  const [roleInviteCodes, setRoleInviteCodes] = useState<Array<{
    role: 'baker' | 'cashier'
    inviteCode: string
    expiresAt?: string
    maxUses?: number
    usageCount: number
    createdAt: string
  }>>([])
  const [isGeneratingCode, setIsGeneratingCode] = useState<string | null>(null)

  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'baker' as 'baker' | 'cashier',
    message: ''
  })

  useEffect(() => {
    if (user) {
      loadTeamData()
      loadRoleInviteCodes()
    }
  }, [user])

  const loadTeamData = async () => {
    if (!user) {
      console.warn('loadTeamData: user is not available')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Try to get bakeshopId if it's not available
      let bakeshopId = user.bakeshopId
      
      if (!bakeshopId) {
        console.log('loadTeamData: bakeshopId not found, attempting to fetch it...')
        try {
          const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
          const bakeshopInfo = await getBakeshopInfo(user)
          
          if (bakeshopInfo?.id) {
            bakeshopId = bakeshopInfo.id
            console.log('loadTeamData: bakeshopId fetched:', bakeshopId)
          } else {
            console.warn('loadTeamData: bakeshop not found')
            setTeamMembers([])
            setInvitations([])
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.error('Error fetching bakeshop info:', err)
          setTeamMembers([])
          setInvitations([])
          setIsLoading(false)
          return
        }
      }

      if (!bakeshopId) {
        console.warn('loadTeamData: bakeshopId is still undefined after fetch attempt')
        setTeamMembers([])
        setInvitations([])
        setIsLoading(false)
        return
      }

      // For demo users, use mock data
      const isDemoUser = user.email.endsWith('@bakesync.com')
      
      if (isDemoUser) {
        const mockMembers = [
          {
            id: '1',
            email: 'owner@bakesync.com',
            name: 'Demo Owner',
            role: 'owner' as const,
            isActive: true,
            joinedAt: new Date('2024-01-01'),
            lastActiveAt: new Date(),
            permissions: ['all'],
            status: 'active' as const
          },
          {
            id: '2',
            email: 'baker@bakesync.com',
            name: 'Demo Baker',
            role: 'baker' as const,
            isActive: true,
            joinedAt: new Date('2024-01-02'),
            lastActiveAt: new Date(Date.now() - 3600000),
            permissions: ['viewRecipes', 'logProduction'],
            status: 'active' as const
          }
        ]
        const mockInvitations: any[] = []
        
        setTeamMembers(mockMembers)
        setInvitations(mockInvitations)
      } else {
        console.log('loadTeamData: Fetching team members and invitations for bakeshopId:', bakeshopId)
        const [members, pendingInvitations] = await Promise.all([
          teamManager.getTeamMembers(bakeshopId),
          teamManager.getPendingInvitations(bakeshopId)
        ])

        console.log('loadTeamData: Loaded members:', members.length, 'invitations:', pendingInvitations.length)
        console.log('loadTeamData: Members details:', members)
        
        setTeamMembers(members)
        setInvitations(pendingInvitations as TeamInvitation[])
      }
    } catch (err) {
      console.error('Error loading team data:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to load team data'
      setError(errorMessage)
      // Still set empty arrays to prevent UI from hanging
      setTeamMembers([])
      setInvitations([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoleInviteCodes = async () => {
    if (!user || user.role !== 'owner') return

    // Try to get bakeshopId if it's not available
    let bakeshopId = user.bakeshopId
    
    if (!bakeshopId) {
      try {
        const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
        const bakeshopInfo = await getBakeshopInfo(user)
        if (bakeshopInfo?.id) {
          bakeshopId = bakeshopInfo.id
        } else {
          return // Can't load codes without bakeshopId
        }
      } catch (err) {
        console.error('Error fetching bakeshop info for role invite codes:', err)
        return
      }
    }

    if (!bakeshopId) return

    try {
      const result = await getRoleInviteCodes(bakeshopId)
      if (result.success && result.codes) {
        setRoleInviteCodes(result.codes)
      }
    } catch (err) {
      console.error('Error loading role invite codes:', err)
    }
  }

  const handleGenerateInviteCode = async (role: 'baker' | 'cashier') => {
    if (!user) {
      toast.error('User not found. Please log in again.')
      return
    }

    if (user.role !== 'owner') {
      toast.error('Only owners can generate invite codes')
      return
    }

    // Try to get bakeshopId if it's not available
    let bakeshopId = user.bakeshopId
    
    if (!bakeshopId) {
      try {
        console.log('BakeshopId not found, attempting to fetch it...')
        const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
        const bakeshopInfo = await getBakeshopInfo(user)
        
        if (bakeshopInfo?.id) {
          bakeshopId = bakeshopInfo.id
          console.log('BakeshopId fetched:', bakeshopId)
          // Update the user context with the bakeshopId (optional, but helpful)
          // Note: This would require exposing an update function from auth context
        } else {
          toast.error('Bakeshop not found. Please complete your setup first.')
          return
        }
      } catch (err) {
        console.error('Error fetching bakeshop info:', err)
        toast.error('Unable to find your bakeshop. Please refresh the page or contact support.')
        return
      }
    }

    if (!bakeshopId) {
      toast.error('Bakeshop ID not found. Please refresh the page.')
      return
    }

    try {
      setIsGeneratingCode(role)
      console.log('Generating invite code for role:', role, 'bakeshopId:', bakeshopId)
      
      const result = await createRoleInviteCode(bakeshopId, role)
      
      console.log('Invite code generation result:', result)
      
      if (result.success && result.inviteCode) {
        toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} invite code generated!`)
        await loadRoleInviteCodes()
      } else {
        const errorMsg = result.error || 'Failed to generate invite code'
        console.error('Failed to generate invite code:', errorMsg)
        toast.error(errorMsg, { duration: 5000 })
      }
    } catch (err) {
      console.error('Error generating invite code:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate invite code'
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setIsGeneratingCode(null)
    }
  }

  const handleCopyInviteCode = (code: string, role: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`${role} invite code copied to clipboard!`)
  }

  const handleRegenerateInviteCode = async (role: 'baker' | 'cashier') => {
    if (!user) {
      toast.error('User not found. Please log in again.')
      return
    }

    // Try to get bakeshopId if it's not available
    let bakeshopId = user.bakeshopId
    
    if (!bakeshopId) {
      try {
        const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
        const bakeshopInfo = await getBakeshopInfo(user)
        if (bakeshopInfo?.id) {
          bakeshopId = bakeshopInfo.id
        } else {
          toast.error('Bakeshop not found. Please complete your setup first.')
          return
        }
      } catch (err) {
        console.error('Error fetching bakeshop info:', err)
        toast.error('Unable to find your bakeshop. Please refresh the page.')
        return
      }
    }

    if (!bakeshopId) return

    try {
      setIsGeneratingCode(role)
      // Deactivate old code first
      await deactivateRoleInviteCode(bakeshopId, role)
      // Generate new code
      const result = await createRoleInviteCode(bakeshopId, role)
      
      if (result.success && result.inviteCode) {
        toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} invite code regenerated!`)
        await loadRoleInviteCodes()
      } else {
        toast.error(result.error || 'Failed to regenerate invite code')
      }
    } catch (err) {
      console.error('Error regenerating invite code:', err)
      toast.error('Failed to regenerate invite code')
    } finally {
      setIsGeneratingCode(null)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('User not found. Please log in again.')
      return
    }

    // Validate form
    if (!inviteForm.email || !inviteForm.email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    if (!inviteForm.role || !['baker', 'cashier'].includes(inviteForm.role)) {
      toast.error('Please select a valid role')
      return
    }

    // Try to get bakeshopId if it's not available
    let bakeshopId = user.bakeshopId
    
    if (!bakeshopId) {
      try {
        console.log('BakeshopId not found, attempting to fetch it...')
        const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
        const bakeshopInfo = await getBakeshopInfo(user)
        
        if (bakeshopInfo?.id) {
          bakeshopId = bakeshopInfo.id
          console.log('BakeshopId fetched:', bakeshopId)
        } else {
          toast.error('Bakeshop not found. Please complete your setup first.')
          return
        }
      } catch (err) {
        console.error('Error fetching bakeshop info:', err)
        toast.error('Unable to find your bakeshop. Please refresh the page.')
        return
      }
    }

    if (!bakeshopId) {
      toast.error('Bakeshop ID not found. Please refresh the page.')
      return
    }

    try {
      setIsInviting(true)
      setError(null)

      console.log('Sending invitation:', {
        bakeshopId,
        email: inviteForm.email,
        role: inviteForm.role
      })

      await teamManager.inviteTeamMember(
        bakeshopId,
        user.id,
        inviteForm.email.trim(),
        inviteForm.role,
        inviteForm.message?.trim() || undefined
      )

      // Reset form and close dialog
      setInviteForm({ email: '', role: 'baker', message: '' })
      setIsInviteDialogOpen(false)
      toast.success(`Invitation sent to ${inviteForm.email}`)

      // Reload team data
      await loadTeamData()
    } catch (err) {
      console.error('Error inviting team member:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite team member'
      toast.error(errorMessage, { duration: 5000 })
      setError(errorMessage)
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await teamManager.cancelInvitation(invitationId)
      toast.success('Invitation cancelled')
      await loadTeamData()
    } catch (err) {
      console.error('Error cancelling invitation:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation'
      toast.error(errorMessage)
      setError(errorMessage)
    }
  }

  const handleUpdateRole = async () => {
    if (!user?.bakeshopId || !memberToUpdateRole) return

    try {
      await teamManager.updateTeamMemberRole(user.bakeshopId, memberToUpdateRole.id, newRole)
      toast.success(`Role updated to ${newRole}`)
      setMemberToUpdateRole(null)
      await loadTeamData()
    } catch (err) {
      console.error('Error updating role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role'
      toast.error(errorMessage)
      setError(errorMessage)
    }
  }

  const handleRemoveMember = async () => {
    if (!user?.bakeshopId || !memberToRemove) return

    try {
      await teamManager.removeTeamMember(user.bakeshopId, memberToRemove.id)
      toast.success(`${memberToRemove.name} has been removed from the team`)
      setMemberToRemove(null)
      await loadTeamData()
    } catch (err) {
      console.error('Error removing member:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member'
      toast.error(errorMessage)
      setError(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading team...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-gray-600">Manage your team members and invitations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={loadTeamData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your bakery team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="teammate@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as 'baker' | 'cashier' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baker">Baker</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Welcome to our team! Looking forward to working with you."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Members ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No team members found</p>
              </div>
            ) : (
              teamMembers.map((member) => {
                const isOwner = member.role?.toLowerCase() === 'owner'
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="capitalize">{member.role}</Badge>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {!isOwner ? (
                            <>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setMemberToUpdateRole(member)
                                  setNewRole(member.role === 'baker' ? 'cashier' : 'baker')
                                }}
                              >
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  setMemberToRemove(member)
                                }}
                                variant="destructive"
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                Remove Member
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem 
                              disabled 
                              className="text-muted-foreground"
                            >
                              Owner permissions cannot be changed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Invite Codes - Only for owners */}
      {user?.role === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Role Invite Codes
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Generate invite codes for specific roles. Share these codes with team members to allow them to sign up with the correct role.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['baker', 'cashier'] as const).map((role) => {
                const codeData = roleInviteCodes.find(c => c.role === role)
                const isGenerating = isGeneratingCode === role
                
                return (
                  <div key={role} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold capitalize">{role}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role === 'baker' 
                            ? 'For production and inventory management'
                            : 'For sales and point of sale operations'}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{role}</Badge>
                    </div>
                    
                    {codeData ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-muted p-3 rounded-md font-mono text-lg font-bold text-center">
                            {codeData.inviteCode}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (codeData?.inviteCode && role) {
                                handleCopyInviteCode(codeData.inviteCode, role)
                              }
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (role && !isGenerating) {
                                handleRegenerateInviteCode(role)
                              }
                            }}
                            disabled={isGenerating}
                          >
                            <RotateCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Used: {codeData.usageCount} {codeData.maxUses ? `of ${codeData.maxUses}` : 'times'}</p>
                          {codeData.expiresAt && (
                            <p>Expires: {new Date(codeData.expiresAt).toLocaleDateString()}</p>
                          )}
                          <p>Created: {new Date(codeData.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">No invite code generated yet</p>
                        <Button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (role && !isGenerating) {
                              handleGenerateInviteCode(role)
                            }
                          }}
                          disabled={isGenerating || !role || user?.role !== 'owner'}
                          className="w-full"
                          type="button"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Generate Invite Code
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-gray-600">
                        Invited by {invitation.invitedByName} as {invitation.role}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{invitation.role}</Badge>
                        <Badge variant="secondary">Pending</Badge>
                        <span className="text-xs text-gray-500">
                          Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> ({memberToRemove?.email}) from your team? 
              This action cannot be undone and they will lose access to this bakeshop.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-red-600 hover:bg-red-700">
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Role Dialog */}
      <Dialog open={!!memberToUpdateRole} onOpenChange={(open) => !open && setMemberToUpdateRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change the role for <strong>{memberToUpdateRole?.name}</strong> ({memberToUpdateRole?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as 'baker' | 'cashier')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baker">Baker - Can view recipes, log production, and manage inventory</SelectItem>
                  <SelectItem value="cashier">Cashier - Can process sales and view inventory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Current role:</strong> {memberToUpdateRole?.role}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setMemberToUpdateRole(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>
              Update Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
