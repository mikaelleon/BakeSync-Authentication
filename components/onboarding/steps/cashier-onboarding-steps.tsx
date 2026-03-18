"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, CreditCard, DollarSign, CheckCircle } from "lucide-react"

interface CashierOnboardingStepsProps {
  currentStep: number
  data: any
  onComplete: (data: any) => void
  onBack?: () => void
  isLoading?: boolean
}

const cashierSteps = [
  {
    id: 1,
    title: "POS Setup",
    component: POSSetupStep
  },
  {
    id: 2,
    title: "Product Knowledge",
    component: ProductKnowledgeStep
  },
  {
    id: 3,
    title: "Sales Training",
    component: SalesTrainingStep
  }
]

export function CashierOnboardingSteps({ 
  currentStep, 
  data, 
  onComplete, 
  onBack, 
  isLoading = false 
}: CashierOnboardingStepsProps) {
  const StepComponent = cashierSteps.find(step => step.id === currentStep)?.component

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

// POS Setup Step
function POSSetupStep({ data, onComplete, onBack, isLoading }: any) {
  const [formData, setFormData] = useState({
    posSettings: data?.posSettings || {
      defaultPaymentMethod: "cash",
      autoCalculateTax: true,
      requireCustomerInfo: false,
      printReceipts: true
    },
    cashDrawer: data?.cashDrawer || {
      startingAmount: 100,
      denominationBreakdown: {
        twenties: 0,
        tens: 0,
        fives: 0,
        ones: 0,
        quarters: 0,
        dimes: 0,
        nickels: 0,
        pennies: 0
      }
    }
  })

  const handleSubmit = () => {
    onComplete({ posSetup: formData })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5" />
          <span>POS Setup</span>
        </CardTitle>
        <p className="text-gray-600">
          Configure your point of sale system preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>POS Settings</Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
                <Select 
                  value={formData.posSettings.defaultPaymentMethod}
                  onValueChange={(value) => 
                    setFormData(prev => ({
                      ...prev,
                      posSettings: { ...prev.posSettings, defaultPaymentMethod: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile">Mobile Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoCalculateTax"
                    checked={formData.posSettings.autoCalculateTax}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        posSettings: { ...prev.posSettings, autoCalculateTax: checked }
                      }))
                    }
                  />
                  <Label htmlFor="autoCalculateTax">Auto-calculate tax</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requireCustomerInfo"
                    checked={formData.posSettings.requireCustomerInfo}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        posSettings: { ...prev.posSettings, requireCustomerInfo: checked }
                      }))
                    }
                  />
                  <Label htmlFor="requireCustomerInfo">Require customer information</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="printReceipts"
                    checked={formData.posSettings.printReceipts}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        posSettings: { ...prev.posSettings, printReceipts: checked }
                      }))
                    }
                  />
                  <Label htmlFor="printReceipts">Print receipts automatically</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingAmount">Starting Cash Drawer Amount ($)</Label>
            <Input
              id="startingAmount"
              type="number"
              value={formData.cashDrawer.startingAmount}
              onChange={(e) => 
                setFormData(prev => ({
                  ...prev,
                  cashDrawer: { ...prev.cashDrawer, startingAmount: parseFloat(e.target.value) }
                }))
              }
            />
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

// Product Knowledge Step
function ProductKnowledgeStep({ data, onComplete, onBack, isLoading }: any) {
  const [formData, setFormData] = useState({
    productKnowledge: data?.productKnowledge || {
      categories: [],
      allergens: [],
      pricing: "memorized"
    },
    customerService: data?.customerService || {
      greetingStyle: "friendly",
      upselling: true,
      recommendations: true
    }
  })

  const categories = [
    "Breads", "Pastries", "Cakes", "Cookies", "Pies", "Muffins", "Bagels", "Coffee", "Beverages"
  ]

  const allergens = [
    "Gluten", "Dairy", "Eggs", "Nuts", "Soy", "Sesame", "Sulfites"
  ]

  const handleCategoryChange = (category: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productKnowledge: {
        ...prev.productKnowledge,
        categories: checked 
          ? [...prev.productKnowledge.categories, category]
          : prev.productKnowledge.categories.filter((c: string) => c !== category)
      }
    }))
  }

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      productKnowledge: {
        ...prev.productKnowledge,
        allergens: checked 
          ? [...prev.productKnowledge.allergens, allergen]
          : prev.productKnowledge.allergens.filter((a: string) => a !== allergen)
      }
    }))
  }

  const handleSubmit = () => {
    onComplete({ productKnowledge: formData })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-5 w-5" />
          <span>Product Knowledge</span>
        </CardTitle>
        <p className="text-gray-600">
          Tell us about your product knowledge and customer service preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Product Categories You're Familiar With</Label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={formData.productKnowledge.categories.includes(category)}
                    onCheckedChange={(checked) => handleCategoryChange(category, checked as boolean)}
                  />
                  <Label htmlFor={category}>{category}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allergens You're Knowledgeable About</Label>
            <div className="grid grid-cols-2 gap-3">
              {allergens.map(allergen => (
                <div key={allergen} className="flex items-center space-x-2">
                  <Checkbox
                    id={allergen}
                    checked={formData.productKnowledge.allergens.includes(allergen)}
                    onCheckedChange={(checked) => handleAllergenChange(allergen, checked as boolean)}
                  />
                  <Label htmlFor={allergen}>{allergen}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing">Pricing Knowledge</Label>
            <Select 
              value={formData.productKnowledge.pricing}
              onValueChange={(value) => 
                setFormData(prev => ({
                  ...prev,
                  productKnowledge: { ...prev.productKnowledge, pricing: value }
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="memorized">I have prices memorized</SelectItem>
                <SelectItem value="reference">I need to reference a price list</SelectItem>
                <SelectItem value="learning">I'm still learning the prices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Customer Service Preferences</Label>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="greetingStyle">Greeting Style</Label>
                <Select 
                  value={formData.customerService.greetingStyle}
                  onValueChange={(value) => 
                    setFormData(prev => ({
                      ...prev,
                      customerService: { ...prev.customerService, greetingStyle: value }
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal and professional</SelectItem>
                    <SelectItem value="friendly">Friendly and casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic and energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="upselling"
                    checked={formData.customerService.upselling}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        customerService: { ...prev.customerService, upselling: checked }
                      }))
                    }
                  />
                  <Label htmlFor="upselling">I'm comfortable with upselling</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recommendations"
                    checked={formData.customerService.recommendations}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        customerService: { ...prev.customerService, recommendations: checked }
                      }))
                    }
                  />
                  <Label htmlFor="recommendations">I like making product recommendations</Label>
                </div>
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

// Sales Training Step
function SalesTrainingStep({ data, onComplete, onBack, isLoading }: any) {
  const [formData, setFormData] = useState({
    salesExperience: data?.salesExperience || "",
    trainingCompleted: data?.trainingCompleted || {
      posSystem: false,
      paymentProcessing: false,
      customerService: false,
      productKnowledge: false
    }
  })

  const trainingModules = [
    { id: "posSystem", title: "POS System Operation", description: "Learn to use the point of sale system" },
    { id: "paymentProcessing", title: "Payment Processing", description: "Handle cash, card, and mobile payments" },
    { id: "customerService", title: "Customer Service", description: "Best practices for customer interactions" },
    { id: "productKnowledge", title: "Product Knowledge", description: "Understanding our products and pricing" }
  ]

  const handleTrainingChange = (moduleId: string, completed: boolean) => {
    setFormData(prev => ({
      ...prev,
      trainingCompleted: {
        ...prev.trainingCompleted,
        [moduleId]: completed
      }
    }))
  }

  const handleSubmit = () => {
    onComplete({ salesTraining: formData })
  }

  const completedCount = Object.values(formData.trainingCompleted).filter(Boolean).length

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Sales Training</span>
        </CardTitle>
        <p className="text-gray-600">
          Complete your sales training modules ({completedCount}/{trainingModules.length})
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salesExperience">Previous Sales Experience</Label>
            <Textarea
              id="salesExperience"
              value={formData.salesExperience}
              onChange={(e) => setFormData(prev => ({ ...prev, salesExperience: e.target.value }))}
              placeholder="Tell us about your previous sales experience..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Training Modules</Label>
            <div className="space-y-3">
              {trainingModules.map(module => (
                <div key={module.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={module.id}
                    checked={formData.trainingCompleted[module.id as keyof typeof formData.trainingCompleted]}
                    onCheckedChange={(checked) => handleTrainingChange(module.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={module.id} className="font-medium">{module.title}</Label>
                      {formData.trainingCompleted[module.id as keyof typeof formData.trainingCompleted] && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {completedCount === trainingModules.length && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Training Complete!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                You've completed all required training modules. You're ready to start!
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-6">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || completedCount < trainingModules.length} 
            className="ml-auto"
          >
            {isLoading ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
