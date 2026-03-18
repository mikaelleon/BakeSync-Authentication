"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Phone, Globe, Building } from "lucide-react"

const businessDetailsSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.string().min(1, "Please select a business type"),
  address: z.string().min(5, "Please enter a complete address"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  taxId: z.string().min(9, "Tax ID must be at least 9 characters").optional().or(z.literal("")),
  description: z.string().max(500, "Description must be less than 500 characters").optional()
})

type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>

interface BusinessDetailsFormProps {
  initialData?: Partial<BusinessDetailsFormData>
  onSubmit: (data: BusinessDetailsFormData) => void
  onBack?: () => void
  isLoading?: boolean
}

const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

export function BusinessDetailsForm({ 
  initialData, 
  onSubmit, 
  onBack, 
  isLoading = false 
}: BusinessDetailsFormProps) {
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<BusinessDetailsFormData>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      businessName: initialData?.businessName || "",
      businessType: initialData?.businessType || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      website: initialData?.website || "",
      taxId: initialData?.taxId || "",
      description: initialData?.description || ""
    }
  })

  const businessName = watch("businessName")

  const handleFormSubmit = async (data: BusinessDetailsFormData) => {
    setIsGeneratingSlug(true)
    try {
      // Generate business slug
      const slug = await generateBusinessSlug(data.businessName)
      onSubmit({ ...data, businessName: data.businessName })
    } catch (error) {
      console.error("Error generating business slug:", error)
      onSubmit(data)
    } finally {
      setIsGeneratingSlug(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Business Details</CardTitle>
        <p className="text-center text-gray-600">
          Tell us about your business to get started
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="businessName"
                {...register("businessName")}
                className="pl-10"
                placeholder="Enter your business name"
              />
            </div>
            {errors.businessName && (
              <p className="text-sm text-red-600">{errors.businessName.message}</p>
            )}
          </div>

          {/* Business Type */}
          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type *</Label>
            <Select onValueChange={(value) => setValue("businessType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="cafe">Cafe</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="catering">Catering</SelectItem>
                <SelectItem value="food_truck">Food Truck</SelectItem>
                <SelectItem value="wholesale">Wholesale</SelectItem>
              </SelectContent>
            </Select>
            {errors.businessType && (
              <p className="text-sm text-red-600">{errors.businessType.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="address"
                {...register("address")}
                className="pl-10"
                placeholder="123 Main Street"
              />
            </div>
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="City"
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select onValueChange={(value) => setValue("state", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-sm text-red-600">{errors.state.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                {...register("zipCode")}
                placeholder="12345"
              />
              {errors.zipCode && (
                <p className="text-sm text-red-600">{errors.zipCode.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  {...register("phone")}
                  className="pl-10"
                  placeholder="(555) 123-4567"
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="business@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website (Optional)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="website"
                {...register("website")}
                className="pl-10"
                placeholder="https://www.yourbusiness.com"
              />
            </div>
            {errors.website && (
              <p className="text-sm text-red-600">{errors.website.message}</p>
            )}
          </div>

          {/* Tax ID */}
          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID / EIN (Optional)</Label>
            <Input
              id="taxId"
              {...register("taxId")}
              placeholder="12-3456789"
            />
            {errors.taxId && (
              <p className="text-sm text-red-600">{errors.taxId.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Business Description (Optional)</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Tell us about your business..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-6">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isLoading || isGeneratingSlug}
              className="ml-auto"
            >
              {isGeneratingSlug ? "Generating..." : isLoading ? "Creating..." : "Continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Helper function to generate business slug
async function generateBusinessSlug(businessName: string): Promise<string> {
  // This would call your backend API to generate a unique slug
  // For now, we'll create a simple slug
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
