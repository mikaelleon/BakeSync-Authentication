"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  ChefHat, 
  Package, 
  Truck, 
  CreditCard, 
  Factory, 
  DollarSign, 
  Users,
  Clock,
  ArrowRight
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: 'recipe' | 'inventory' | 'order' | 'sale' | 'production' | 'expense' | 'team'
  title: string
  description: string
  user: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface RecentActivityProps {
  activities: ActivityItem[]
  maxItems?: number
}

export function RecentActivity({ activities, maxItems = 10 }: RecentActivityProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'recipe':
        return ChefHat
      case 'inventory':
        return Package
      case 'order':
        return Truck
      case 'sale':
        return CreditCard
      case 'production':
        return Factory
      case 'expense':
        return DollarSign
      case 'team':
        return Users
      default:
        return Activity
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'recipe':
        return 'text-blue-600 bg-blue-100'
      case 'inventory':
        return 'text-orange-600 bg-orange-100'
      case 'order':
        return 'text-purple-600 bg-purple-100'
      case 'sale':
        return 'text-green-600 bg-green-100'
      case 'production':
        return 'text-indigo-600 bg-indigo-100'
      case 'expense':
        return 'text-red-600 bg-red-100'
      case 'team':
        return 'text-pink-600 bg-pink-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getActivityBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'recipe':
        return 'Recipe'
      case 'inventory':
        return 'Inventory'
      case 'order':
        return 'Order'
      case 'sale':
        return 'Sale'
      case 'production':
        return 'Production'
      case 'expense':
        return 'Expense'
      case 'team':
        return 'Team'
      default:
        return 'Activity'
    }
  }

  const displayedActivities = activities.slice(0, maxItems)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Latest actions and updates in your bakery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">Start by adding recipes or inventory items</p>
            </div>
          ) : (
            displayedActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              const colorClass = getActivityColor(activity.type)
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {getActivityBadge(activity.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>by {activity.user}</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                    </div>
                    {activity.metadata && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(activity.metadata).map(([key, value]) => (
                          <span key={key} className="mr-4">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {activities.length > maxItems && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="ghost" className="w-full">
              View All Activity
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
