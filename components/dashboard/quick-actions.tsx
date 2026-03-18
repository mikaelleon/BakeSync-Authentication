"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getIconButtonLabel } from "@/lib/accessibility"
import { 
  Plus, 
  Package, 
  ChefHat, 
  Truck, 
  CreditCard, 
  Factory, 
  DollarSign, 
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Eye
} from "lucide-react"
import Link from "next/link"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
}

interface QuickActionsProps {
  userRole: string
  bakeshopSlug: string
  stats?: {
    lowStockItems: number
    pendingOrders: number
    todaySales: number
    activeProduction: number
  }
}

export function QuickActions({ userRole, bakeshopSlug, stats }: QuickActionsProps) {
  // Role-specific actions
  const getRoleSpecificActions = (): QuickAction[] => {
    switch (userRole) {
      case 'owner':
        return [
          {
            id: "add-recipe",
            title: "New Recipe",
            description: "Create a new recipe",
            icon: ChefHat,
            href: `/${bakeshopSlug}/recipes/new`
          },
          {
            id: "add-inventory",
            title: "Add Inventory",
            description: "Add new inventory items",
            icon: Package,
            href: `/${bakeshopSlug}/inventory?action=add`
          },
          {
            id: "create-po",
            title: "Create Purchase Order",
            description: "Order supplies from suppliers",
            icon: Truck,
            href: `/${bakeshopSlug}/supply-chain?action=create-po`
          },
          {
            id: "log-production",
            title: "Log Production",
            description: "Record completed production",
            icon: Factory,
            href: `/${bakeshopSlug}/production`
          },
          {
            id: "record-expense",
            title: "Record Expense",
            description: "Add business expense",
            icon: DollarSign,
            href: `/${bakeshopSlug}/financials?action=add-expense`
          },
          {
            id: "invite-member",
            title: "Invite Member",
            description: "Add team member",
            icon: Users,
            href: `/${bakeshopSlug}/team`
          }
        ]
      
      case 'baker':
        return [
          {
            id: "log-production",
            title: "Log Production",
            description: "Record completed production batch",
            icon: Factory,
            href: `/${bakeshopSlug}/production`
          },
          {
            id: "view-recipes",
            title: "View Recipes",
            description: "Check recipe instructions",
            icon: ChefHat,
            href: `/${bakeshopSlug}/recipes`
          },
          {
            id: "check-inventory",
            title: "Check Raw Materials",
            description: "View available ingredients",
            icon: Package,
            href: `/${bakeshopSlug}/inventory`
          }
        ]
      
      case 'cashier':
        return [
          {
            id: "new-sale",
            title: "New Sale",
            description: "Process customer purchase",
            icon: CreditCard,
            href: `/${bakeshopSlug}/pos`
          },
          {
            id: "view-products",
            title: "View Products",
            description: "Check product availability",
            icon: Package,
            href: `/${bakeshopSlug}/pos`
          }
        ]
      
      default:
        return []
    }
  }

  const actions = getRoleSpecificActions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" aria-hidden="true" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          {userRole === 'owner' && 'Manage your business operations'}
          {userRole === 'baker' && 'Access your production tools'}
          {userRole === 'cashier' && 'Process sales and check inventory'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="navigation" aria-label="Quick actions">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              prefetch={true}
              className="block"
            >
              <div
                className="h-auto w-full p-4 flex flex-col items-start space-y-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors cursor-pointer"
                aria-label={`${action.title}: ${action.description}`}
              >
                <action.icon className="h-5 w-5" aria-hidden="true" />
                <div className="text-left w-full">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
                {action.badge && (
                  <Badge variant={action.badgeVariant || "default"} className="ml-auto mt-auto">
                    {action.badge}
                  </Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}