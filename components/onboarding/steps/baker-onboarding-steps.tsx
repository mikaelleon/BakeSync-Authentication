"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Shield, BookOpen, Package, Clock, CheckCircle } from "lucide-react"

interface BakerOnboardingStepsProps {
  currentStep: number
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  isLoading?: boolean
}

const bakerSteps = [
  {
    id: 1,
    title: "Production Setup",
    component: ProductionSetupStep
  },
  {
    id: 2,
    title: "Recipe Management",
    component: RecipeManagementStep
  },
  {
    id: 3,
    title: "Inventory Access",
    component: InventoryAccessStep
  }
]

export function BakerOnboardingSteps({ 
  currentStep, 
  data, 
  onComplete, 
  onBack, 
  isLoading = false 
}: BakerOnboardingStepsProps) {
  const StepComponent = bakerSteps.find(step => step.id === currentStep)?.component

  if (!StepComponent) {
    return null
  }

  return (
    <StepComponent
      data={data}
      onComplete={onComplete}
      onBack={onBack}
      isLoading={isLoading}
    />
  )
}

// Production Setup Step
function ProductionSetupStep({ data, onComplete, onBack, isLoading }: any) {
  const [formData, setFormData] = useState({
    workSchedule: data?.workSchedule || "",
    productionGoals: data?.productionGoals || "",
    preferredUnits: data?.preferredUnits || "imperial",
    notifications: data?.notifications || {
      lowStock: true,
      productionReminders: true,
      recipeUpdates: true
    }
  })

  const handleSubmit = () => {
    onComplete({ productionSetup: formData })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Production Setup</span>
        </CardTitle>
        <p className="text-gray-600">
          Configure your production workspace and preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workSchedule">Work Schedule</Label>
            <Textarea
              id="workSchedule"
              value={formData.workSchedule}
              onChange={(e) => setFormData(prev => ({ ...prev, workSchedule: e.target.value }))}
              placeholder="e.g., Monday-Friday 6AM-2PM, Weekend prep 4AM-10AM"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productionGoals">Daily Production Goals</Label>
            <Textarea
              id="productionGoals"
              value={formData.productionGoals}
              onChange={(e) => setFormData(prev => ({ ...prev, productionGoals: e.target.value }))}
              placeholder="e.g., 50 loaves of bread, 30 pastries, 20 cakes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Notification Preferences</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowStock"
                  checked={formData.notifications.lowStock}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, lowStock: checked }
                    }))
                  }
                />
                <Label htmlFor="lowStock">Low stock alerts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="productionReminders"
                  checked={formData.notifications.productionReminders}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, productionReminders: checked }
                    }))
                  }
                />
                <Label htmlFor="productionReminders">Production reminders</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recipeUpdates"
                  checked={formData.notifications.recipeUpdates}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, recipeUpdates: checked }
                    }))
                  }
                />
                <Label htmlFor="recipeUpdates">Recipe updates</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading} className="ml-auto">
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Recipe Management Step
export function RecipeManagementStep({ data, onComplete, onBack, isLoading }: any) {
  const [formData, setFormData] = useState({
    experience: data?.experience || "",
    specialties: data?.specialties || [],
    recipePreferences: data?.recipePreferences || {
      metricUnits: false,
      detailedInstructions: true,
      photoReferences: true
    }
  })

  const specialties = [
    "Bread Making", "Pastries", "Cakes", "Cookies", "Pies", "Bagels", "Croissants", "Donuts"
  ]

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: checked 
        ? [...prev.specialties, specialty]
        : prev.specialties.filter((s: string) => s !== specialty)
    }))
  }

  const handleSubmit = () => {
    onComplete({ recipeManagement: formData })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>Recipe Management</span>
        </CardTitle>
        <p className="text-gray-600">
          Tell us about your baking experience and preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="experience">Baking Experience</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              placeholder="Tell us about your baking background and experience..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Baking Specialties</Label>
            <div className="grid grid-cols-2 gap-3">
              {specialties.map(specialty => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={specialty}
                    checked={formData.specialties.includes(specialty)}
                    onCheckedChange={(checked) => handleSpecialtyChange(specialty, checked as boolean)}
                  />
                  <Label htmlFor={specialty}>{specialty}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recipe Preferences</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metricUnits"
                  checked={formData.recipePreferences.metricUnits}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      recipePreferences: { ...prev.recipePreferences, metricUnits: checked }
                    }))
                  }
                />
                <Label htmlFor="metricUnits">Prefer metric units (grams, liters)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detailedInstructions"
                  checked={formData.recipePreferences.detailedInstructions}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      recipePreferences: { ...prev.recipePreferences, detailedInstructions: checked }
                    }))
                  }
                />
                <Label htmlFor="detailedInstructions">Detailed step-by-step instructions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="photoReferences"
                  checked={formData.recipePreferences.photoReferences}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      recipePreferences: { ...prev.recipePreferences, photoReferences: checked }
                    }))
                  }
                />
                <Label htmlFor="photoReferences">Photo references for each step</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading} className="ml-auto">
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Inventory Access Step
export function InventoryAccessStep({ data, onComplete, onBack, isLoading }: any) {
  const [formData, setFormData] = useState({
    inventoryAccess: data?.inventoryAccess || {
      viewInventory: true,
      updateStock: true,
      receiveDeliveries: false,
      manageSuppliers: false
    },
    stockAlerts: data?.stockAlerts || {
      lowStockThreshold: 10,
      criticalStockThreshold: 5,
      emailAlerts: true
    }
  })

  const handleSubmit = () => {
    onComplete({ inventoryAccess: formData })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Inventory Access</span>
        </CardTitle>
        <p className="text-gray-600">
          Configure your inventory access and alert preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Inventory Permissions</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="viewInventory"
                  checked={formData.inventoryAccess.viewInventory}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      inventoryAccess: { ...prev.inventoryAccess, viewInventory: checked }
                    }))
                  }
                />
                <Label htmlFor="viewInventory">View inventory levels</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="updateStock"
                  checked={formData.inventoryAccess.updateStock}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      inventoryAccess: { ...prev.inventoryAccess, updateStock: checked }
                    }))
                  }
                />
                <Label htmlFor="updateStock">Update stock levels</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receiveDeliveries"
                  checked={formData.inventoryAccess.receiveDeliveries}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      inventoryAccess: { ...prev.inventoryAccess, receiveDeliveries: checked }
                    }))
                  }
                />
                <Label htmlFor="receiveDeliveries">Receive deliveries</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Stock Alert Settings</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  value={formData.stockAlerts.lowStockThreshold}
                  onChange={(e) => 
                    setFormData(prev => ({
                      ...prev,
                      stockAlerts: { ...prev.stockAlerts, lowStockThreshold: parseInt(e.target.value) }
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criticalStockThreshold">Critical Stock Threshold</Label>
                <Input
                  id="criticalStockThreshold"
                  type="number"
                  value={formData.stockAlerts.criticalStockThreshold}
                  onChange={(e) => 
                    setFormData(prev => ({
                      ...prev,
                      stockAlerts: { ...prev.stockAlerts, criticalStockThreshold: parseInt(e.target.value) }
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emailAlerts"
                checked={formData.stockAlerts.emailAlerts}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({
                    ...prev,
                    stockAlerts: { ...prev.stockAlerts, emailAlerts: checked }
                  }))
                }
              />
              <Label htmlFor="emailAlerts">Receive email alerts for low stock</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-6">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading} className="ml-auto">
            {isLoading ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
