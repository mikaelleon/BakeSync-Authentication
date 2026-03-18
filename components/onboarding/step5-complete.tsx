"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, CheckCircle, Building2, Package, Users, Truck } from "lucide-react"

interface Step5Props {
  data: any
  onComplete: () => void
  onBack: () => void
}

export function OnboardingStep5({ data, onComplete, onBack }: Step5Props) {
  const totalInventoryItems = data.inventoryCategories?.reduce((sum: number, cat: any) => sum + (cat.items?.length || 0), 0) || 0
  const totalSuppliers = data.suppliers?.length || 0
  const totalMembers = data.teamMembers?.length || 0

  const summaryItems = [
    {
      icon: Building2,
      label: "Business Name",
      value: data.businessName || "Not set"
    },
    {
      icon: Package,
      label: "Inventory Items",
      value: `${totalInventoryItems} items`
    },
    {
      icon: Truck,
      label: "Suppliers",
      value: `${totalSuppliers} suppliers`
    },
    {
      icon: Users,
      label: "Team Members",
      value: `${totalMembers} invited`
    }
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Your BakeSync Setup is Complete!</h1>
        <p className="text-muted-foreground mb-4">
          You're all set to start managing your bakery with BakeSync
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Step 5 of 5</span>
          <Progress value={100} className="w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Setup Summary</CardTitle>
          <CardDescription>
            Here's what you've configured for your bakery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaryItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-900">Ready to get started!</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your bakery management system is now configured. You can always add more inventory items, 
                  suppliers, and team members from your dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">What's next?</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Start adding your actual inventory items</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Create your first recipe</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Set up your point of sale system</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Invite team members to join</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <Button
              onClick={onComplete}
              size="lg"
              className="flex items-center space-x-2"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
