"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign, 
  Package, 
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react"

interface Metric {
  id: string
  title: string
  value: number
  target?: number
  unit: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: number
  icon: React.ComponentType<{ className?: string }>
  color: 'green' | 'red' | 'blue' | 'orange' | 'purple'
}

interface PerformanceMetricsProps {
  metrics: Metric[]
  period: 'today' | 'week' | 'month' | 'year'
}

export function PerformanceMetrics({ metrics, period }: PerformanceMetricsProps) {
  const getColorClasses = (color: Metric['color']) => {
    switch (color) {
      case 'green':
        return {
          text: 'text-green-600',
          bg: 'bg-green-100',
          progress: 'bg-green-500'
        }
      case 'red':
        return {
          text: 'text-red-600',
          bg: 'bg-red-100',
          progress: 'bg-red-500'
        }
      case 'blue':
        return {
          text: 'text-blue-600',
          bg: 'bg-blue-100',
          progress: 'bg-blue-500'
        }
      case 'orange':
        return {
          text: 'text-orange-600',
          bg: 'bg-orange-100',
          progress: 'bg-orange-500'
        }
      case 'purple':
        return {
          text: 'text-purple-600',
          bg: 'bg-purple-100',
          progress: 'bg-purple-500'
        }
      default:
        return {
          text: 'text-gray-600',
          bg: 'bg-gray-100',
          progress: 'bg-gray-500'
        }
    }
  }

  const getTrendIcon = (trend?: Metric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendText = (trend?: Metric['trend'], trendValue?: number) => {
    if (!trend || !trendValue) return null
    
    const sign = trend === 'up' ? '+' : trend === 'down' ? '-' : ''
    const color = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
    
    return (
      <span className={`text-sm ${color}`}>
        {sign}{trendValue}% from last {period}
      </span>
    )
  }

  const getPerformanceStatus = (value: number, target?: number) => {
    if (!target) return null
    
    const percentage = (value / target) * 100
    
    if (percentage >= 100) {
      return (
        <div className="flex items-center space-x-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-600">Target achieved</span>
        </div>
      )
    } else if (percentage >= 80) {
      return (
        <div className="flex items-center space-x-1">
          <Target className="h-4 w-4 text-orange-600" />
          <span className="text-sm text-orange-600">On track</span>
        </div>
      )
    } else {
      return (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-600">Below target</span>
        </div>
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Performance Metrics
        </CardTitle>
        <CardDescription>
          Key performance indicators for {period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => {
            const colorClasses = getColorClasses(metric.color)
            const Icon = metric.icon
            const percentage = metric.target ? (metric.value / metric.target) * 100 : 0
            
            return (
              <div key={metric.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses.bg}`}>
                      <Icon className={`h-4 w-4 ${colorClasses.text}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{metric.title}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">{metric.value.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">{metric.unit}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getTrendIcon(metric.trend)}
                    {getTrendText(metric.trend, metric.trendValue)}
                  </div>
                </div>
                
                {metric.target && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target: {metric.target.toLocaleString()} {metric.unit}</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2"
                    />
                    {getPerformanceStatus(metric.value, metric.target)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
