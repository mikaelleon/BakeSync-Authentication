"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, Clock, Target, Bell } from "lucide-react"

interface ProductionSetupStepProps {
  data: any
  onUpdate: (data: any) => Promise<void>
  onNext?: () => void
  onPrevious?: () => void
  isLoading?: boolean
}

export function ProductionSetupStep({ data, onUpdate, onNext, onPrevious, isLoading }: ProductionSetupStepProps) {
  const [formData, setFormData] = useState({
    workSchedule: data.workSchedule || '',
    productionGoals: data.productionGoals || '',
    preferredUnits: data.preferredUnits || 'metric',
    experience: data.experience || '',
    specialties: data.specialties || [],
    notifications: {
      lowStock: data.notifications?.lowStock ?? true,
      productionReminders: data.notifications?.productionReminders ?? true,
      recipeUpdates: data.notifications?.recipeUpdates ?? true
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newSpecialty, setNewSpecialty] = useState('')

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to professional baking' },
    { value: 'intermediate', label: 'Intermediate', description: '1-3 years experience' },
    { value: 'advanced', label: 'Advanced', description: '3-5 years experience' },
    { value: 'expert', label: 'Expert', description: '5+ years experience' }
  ]

  const unitSystems = [
    { value: 'metric', label: 'Metric', description: 'Grams, liters, Celsius' },
    { value: 'imperial', label: 'Imperial', description: 'Pounds, cups, Fahrenheit' },
    { value: 'mixed', label: 'Mixed', description: 'Use both systems as needed' }
  ]

  const commonSpecialties = [
    'Bread Making', 'Pastry', 'Cakes', 'Cookies', 'Pies', 'Tarts',
    'Croissants', 'Bagels', 'Donuts', 'Muffins', 'Scones', 'Tarts'
  ]

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }))
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((s: string) => s !== specialty)
    }))
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.workSchedule.trim()) {
      newErrors.workSchedule = 'Work schedule is required'
    }
    if (!formData.productionGoals.trim()) {
      newErrors.productionGoals = 'Production goals are required'
    }
    if (!formData.experience) {
      newErrors.experience = 'Experience level is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      await onUpdate(formData)
      if (onNext) {
        onNext()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Work Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Work Schedule
          </CardTitle>
          <CardDescription>
            Tell us about your typical work schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workSchedule">Work Schedule *</Label>
            <Textarea
              id="workSchedule"
              value={formData.workSchedule}
              onChange={(e) => handleInputChange('workSchedule', e.target.value)}
              placeholder="e.g., Monday-Friday 6AM-2PM, Weekend prep work"
              className={errors.workSchedule ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.workSchedule && (
              <p className="text-sm text-destructive">{errors.workSchedule}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Production Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Production Goals
          </CardTitle>
          <CardDescription>
            What are your main production goals and priorities?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="productionGoals">Production Goals *</Label>
            <Textarea
              id="productionGoals"
              value={formData.productionGoals}
              onChange={(e) => handleInputChange('productionGoals', e.target.value)}
              placeholder="e.g., Focus on artisan breads, maintain consistent quality, increase efficiency"
              className={errors.productionGoals ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.productionGoals && (
              <p className="text-sm text-destructive">{errors.productionGoals}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Experience & Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Experience & Preferences</CardTitle>
          <CardDescription>
            Help us customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Experience Level *</Label>
              <Select value={formData.experience} onValueChange={(value) => handleInputChange('experience', value)}>
                <SelectTrigger className={errors.experience ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.experience && (
                <p className="text-sm text-destructive">{errors.experience}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredUnits">Preferred Units</Label>
              <Select value={formData.preferredUnits} onValueChange={(value) => handleInputChange('preferredUnits', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit system" />
                </SelectTrigger>
                <SelectContent>
                  {unitSystems.map((system) => (
                    <SelectItem key={system.value} value={system.value}>
                      <div>
                        <div className="font-medium">{system.label}</div>
                        <div className="text-sm text-muted-foreground">{system.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <Label>Baking Specialties</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.specialties.map((specialty: string) => (
                <span
                  key={specialty}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Select value={newSpecialty} onValueChange={setNewSpecialty}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Add a specialty" />
                </SelectTrigger>
                <SelectContent>
                  {commonSpecialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addSpecialty} disabled={!newSpecialty.trim()}>
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when ingredients are running low</p>
              </div>
              <Switch
                checked={formData.notifications.lowStock}
                onCheckedChange={(checked) => handleNotificationChange('lowStock', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Production Reminders</Label>
                <p className="text-sm text-muted-foreground">Reminders for production schedules and deadlines</p>
              </div>
              <Switch
                checked={formData.notifications.productionReminders}
                onCheckedChange={(checked) => handleNotificationChange('productionReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Recipe Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications when recipes are updated or modified</p>
              </div>
              <Switch
                checked={formData.notifications.recipeUpdates}
                onCheckedChange={(checked) => handleNotificationChange('recipeUpdates', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6">
        <div>
          {onPrevious && (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>
        <div>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  )
}



