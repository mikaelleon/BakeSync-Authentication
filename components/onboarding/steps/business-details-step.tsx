"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, ArrowLeft } from "lucide-react"

interface BusinessDetailsStepProps {
  data: any
  onUpdate: (data: any) => void
  onNext?: () => void
  onPrevious?: () => void
  isLoading?: boolean
}

export function BusinessDetailsStep({ data, onUpdate, onNext, onPrevious, isLoading }: BusinessDetailsStepProps) {
  const [formData, setFormData] = useState({
    businessName: data.businessName || '',
    businessType: data.businessType || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    zipCode: data.zipCode || '',
    phone: data.phone || '',
    email: data.email || '',
    website: data.website || '',
    taxId: data.taxId || '',
    description: data.description || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const businessTypes = [
    { value: 'bakery', label: 'Bakery', description: 'Traditional bakery with breads and pastries' },
    { value: 'cafe', label: 'Cafe', description: 'Coffee shop with baked goods' },
    { value: 'restaurant', label: 'Restaurant', description: 'Full-service restaurant with bakery' },
    { value: 'food_truck', label: 'Food Truck', description: 'Mobile food service with baked goods' },
    { value: 'other', label: 'Other', description: 'Other type of food business' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required'
    }
    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onUpdate(formData)
      if (onNext) {
        onNext()
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            placeholder="Enter your business name"
            className={errors.businessName ? 'border-destructive' : ''}
          />
          {errors.businessName && (
            <p className="text-sm text-destructive">{errors.businessName}</p>
          )}
        </div>

        {/* Business Type */}
        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type *</Label>
          <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
            <SelectTrigger className={errors.businessType ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.businessType && (
            <p className="text-sm text-destructive">{errors.businessType}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Street address"
            className={errors.address ? 'border-destructive' : ''}
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address}</p>
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="City"
            className={errors.city ? 'border-destructive' : ''}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city}</p>
          )}
        </div>

        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="State"
            className={errors.state ? 'border-destructive' : ''}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state}</p>
          )}
        </div>

        {/* ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="ZIP code"
            className={errors.zipCode ? 'border-destructive' : ''}
          />
          {errors.zipCode && (
            <p className="text-sm text-destructive">{errors.zipCode}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(555) 123-4567"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="business@example.com"
            className={errors.email ? 'border-destructive' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.example.com"
          />
        </div>

        {/* Tax ID */}
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID (Optional)</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => handleInputChange('taxId', e.target.value)}
            placeholder="Tax identification number"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Business Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Tell us about your business..."
          rows={3}
        />
      </div>

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