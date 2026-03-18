"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ArrowLeft, Settings, Bell, Monitor } from "lucide-react"

interface SystemConfigStepProps {
  data: any
  onUpdate: (data: any) => Promise<void>
  onNext?: () => void
  onPrevious?: () => void
  isLoading?: boolean
}

export function SystemConfigStep({ data, onUpdate, onNext, onPrevious, isLoading }: SystemConfigStepProps) {
  const [formData, setFormData] = useState({
    // General Settings
    timezone: data.timezone || 'UTC',
    currency: data.currency || 'PHP', // Default to Philippine Peso
    language: data.language || 'en',
    
    // Notification Settings
    emailNotifications: data.emailNotifications ?? true,
    lowStockAlerts: data.lowStockAlerts ?? true,
    productionReminders: data.productionReminders ?? true,
    teamUpdates: data.teamUpdates ?? true,
    systemAlerts: data.systemAlerts ?? true,
    
    // Dashboard Settings
    defaultView: data.defaultView || 'overview',
    refreshInterval: data.refreshInterval || 30,
    
    // Business Hours
    businessHours: data.businessHours || {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: false }
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const timezones = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai'
  ]

  // Import currency utilities
  const { getAvailableCurrencies } = require('@/lib/currency-utils')
  const currencies = getAvailableCurrencies()

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' }
  ]

  const dashboardViews = [
    { value: 'overview', label: 'Overview', description: 'General business overview' },
    { value: 'production', label: 'Production', description: 'Production-focused view' },
    { value: 'sales', label: 'Sales', description: 'Sales and revenue focused' },
    { value: 'inventory', label: 'Inventory', description: 'Inventory management view' }
  ]

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ]

  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.timezone) {
      newErrors.timezone = 'Timezone is required'
    }
    if (!formData.currency) {
      newErrors.currency = 'Currency is required'
    }
    if (!formData.language) {
      newErrors.language = 'Language is required'
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
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure your basic system preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger className={errors.timezone ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timezone && (
                <p className="text-sm text-destructive">{errors.timezone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger className={errors.currency ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency: any) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language *</Label>
              <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
                <SelectTrigger className={errors.language ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-sm text-destructive">{errors.language}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
              <Switch
                checked={formData.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when inventory is running low</p>
              </div>
              <Switch
                checked={formData.lowStockAlerts}
                onCheckedChange={(checked) => handleInputChange('lowStockAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Production Reminders</Label>
                <p className="text-sm text-muted-foreground">Reminders for production schedules</p>
              </div>
              <Switch
                checked={formData.productionReminders}
                onCheckedChange={(checked) => handleInputChange('productionReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Team Updates</Label>
                <p className="text-sm text-muted-foreground">Notifications about team changes</p>
              </div>
              <Switch
                checked={formData.teamUpdates}
                onCheckedChange={(checked) => handleInputChange('teamUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>System Alerts</Label>
                <p className="text-sm text-muted-foreground">Important system notifications</p>
              </div>
              <Switch
                checked={formData.systemAlerts}
                onCheckedChange={(checked) => handleInputChange('systemAlerts', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Dashboard Settings
          </CardTitle>
          <CardDescription>
            Customize your dashboard experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select value={formData.defaultView} onValueChange={(value) => handleInputChange('defaultView', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  {dashboardViews.map((view) => (
                    <SelectItem key={view.value} value={view.value}>
                      <div>
                        <div className="font-medium">{view.label}</div>
                        <div className="text-sm text-muted-foreground">{view.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Refresh Interval (seconds)</Label>
              <Input
                type="number"
                value={formData.refreshInterval}
                onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value) || 30)}
                placeholder="30"
                min="10"
                max="300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
          <CardDescription>
            Set your operating hours for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-24">
                <Label>{dayLabels[day as keyof typeof dayLabels]}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={!formData.businessHours[day as keyof typeof formData.businessHours].closed}
                  onCheckedChange={(checked) => handleBusinessHoursChange(day, 'closed', !checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {formData.businessHours[day as keyof typeof formData.businessHours].closed ? 'Closed' : 'Open'}
                </span>
              </div>
              {!formData.businessHours[day as keyof typeof formData.businessHours].closed && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={formData.businessHours[day as keyof typeof formData.businessHours].open}
                    onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={formData.businessHours[day as keyof typeof formData.businessHours].close}
                    onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          ))}
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



