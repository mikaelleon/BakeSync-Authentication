"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowLeft, ArrowRight, Building2, Package, Users, Settings } from "lucide-react"
import { formatCurrency, getCurrencyInfo, DEFAULT_CURRENCY } from "@/lib/currency-utils"

interface ReviewStepProps {
  data: Record<number, any>
  onComplete: () => void
  onPrevious?: () => void
  isLoading?: boolean
}

export function ReviewStep({ data, onComplete, onPrevious, isLoading }: ReviewStepProps) {
  const businessDetails = data[2] || {}
  const inventory = data[3] || {}
  const team = data[4] || {}
  const systemConfig = data[5] || {}
  const currencyCode = systemConfig.currency || DEFAULT_CURRENCY
  const currencyInfo = getCurrencyInfo(currencyCode)

  const handleComplete = () => {
    onComplete()
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Review Your Setup</h3>
        <p className="text-muted-foreground">
          Please review your business setup before completing the process
        </p>
      </div>

      {/* Business Details Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Business Details
            <Badge variant="outline" className="ml-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Name</p>
              <p className="text-lg font-semibold">{businessDetails.businessName || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Business Type</p>
              <p className="text-lg font-semibold capitalize">{businessDetails.businessType || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p className="text-sm">
                {businessDetails.address ? 
                  `${businessDetails.address}, ${businessDetails.city}, ${businessDetails.state} ${businessDetails.zipCode}` : 
                  'Not provided'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contact</p>
              <p className="text-sm">
                {businessDetails.phone && businessDetails.email ? 
                  `${businessDetails.phone} • ${businessDetails.email}` : 
                  'Not provided'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Initial Inventory
            <Badge variant="outline" className="ml-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Raw Materials</p>
              {inventory.rawMaterials && inventory.rawMaterials.length > 0 ? (
                <div className="space-y-1">
                  {inventory.rawMaterials.slice(0, 3).map((material: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{material.name}</span>
                      <span className="text-muted-foreground">{material.currentStock} {material.unit}</span>
                    </div>
                  ))}
                  {inventory.rawMaterials.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{inventory.rawMaterials.length - 3} more materials
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No materials added</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Products</p>
              {inventory.products && inventory.products.length > 0 ? (
                <div className="space-y-1">
                  {inventory.products.slice(0, 3).map((product: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{product.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(product.price, currencyCode)}</span>
                    </div>
                  ))}
                  {inventory.products.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{inventory.products.length - 3} more products
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No products added</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Setup
            <Badge variant="outline" className="ml-auto">
              {team.invitations && team.invitations.length > 0 ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Complete
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Skipped
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {team.invitations && team.invitations.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Invitations Sent</p>
              <div className="space-y-1">
                {team.invitations.slice(0, 3).map((invitation: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{invitation.email}</span>
                    <Badge variant="secondary" className="text-xs">
                      {invitation.role}
                    </Badge>
                  </div>
                ))}
                {team.invitations.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{team.invitations.length - 3} more invitations
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No team invitations sent</p>
          )}
        </CardContent>
      </Card>

      {/* System Configuration Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Configuration
            <Badge variant="outline" className="ml-auto">
              <CheckCircle className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timezone</p>
              <p className="text-sm">{systemConfig.timezone || 'UTC'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Currency</p>
              <p className="text-sm">{currencyInfo.symbol} {currencyInfo.name} ({currencyInfo.code})</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Language</p>
              <p className="text-sm">{systemConfig.language || 'English'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Notifications</p>
            <div className="flex flex-wrap gap-2">
              {systemConfig.emailNotifications && <Badge variant="secondary" className="text-xs">Email</Badge>}
              {systemConfig.lowStockAlerts && <Badge variant="secondary" className="text-xs">Low Stock</Badge>}
              {systemConfig.productionReminders && <Badge variant="secondary" className="text-xs">Production</Badge>}
              {systemConfig.teamUpdates && <Badge variant="secondary" className="text-xs">Team Updates</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold text-green-800">Setup Complete!</h3>
            <p className="text-sm text-green-600">
              Your bakeshop is ready to go. You can always update these settings later from your dashboard.
            </p>
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
            onClick={handleComplete}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Completing...' : 'Complete Setup'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}