"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, SkipForward } from "lucide-react"

interface Step1Props {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onSkip: () => void
}

export function OnboardingStep1({ data, onUpdate, onNext }: Step1Props) {
  const [formData, setFormData] = useState({
    businessName: data.businessName || "",
    bakeshopType: data.bakeshopType || "",
    location: data.location || ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    onUpdate({ [field]: value })
  }

  const handleNext = () => {
    if (formData.businessName.trim()) {
      onNext()
    }
  }

  const bakeshopTypes = [
    { value: "retail", label: "Retail Bakery" },
    { value: "cafe", label: "Cafe & Bakery" },
    { value: "home", label: "Home Bakery" },
    { value: "wholesale", label: "Wholesale Bakery" },
    { value: "restaurant", label: "Restaurant with Bakery" },
    { value: "other", label: "Other" }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Tell us about your bakeshop</h1>
        <p className="text-muted-foreground mb-4">
          Help us customize BakeSync for your business needs
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Step 1 of 5</span>
          <Progress value={20} className="w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            This information will help us personalize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              type="text"
              placeholder="e.g., Maria's Artisan Bakery"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bakeshopType">Bakeshop Type</Label>
            <Select
              value={formData.bakeshopType}
              onValueChange={(value) => handleInputChange('bakeshopType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your bakeshop type" />
              </SelectTrigger>
              <SelectContent>
                {bakeshopTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              placeholder="e.g., Manila, Philippines"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </div>

          <div className="flex justify-between pt-6">
            <div></div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onNext}
                className="flex items-center space-x-2"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip</span>
              </Button>
              <Button
                onClick={handleNext}
                disabled={!formData.businessName.trim()}
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
