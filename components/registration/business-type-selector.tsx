"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

interface BusinessType {
  id: string
  name: string
  description: string
  icon: string
}

const businessTypes: BusinessType[] = [
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'Traditional bakery with breads, pastries, and desserts',
    icon: '🥖'
  },
  {
    id: 'cafe',
    name: 'Cafe',
    description: 'Coffee shop with baked goods and light meals',
    icon: '☕'
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Full-service restaurant with bakery section',
    icon: '🍽️'
  },
  {
    id: 'catering',
    name: 'Catering',
    description: 'Event catering specializing in baked goods',
    icon: '🎉'
  },
  {
    id: 'food_truck',
    name: 'Food Truck',
    description: 'Mobile food service with baked goods',
    icon: '🚚'
  },
  {
    id: 'wholesale',
    name: 'Wholesale',
    description: 'B2B bakery supplying other businesses',
    icon: '📦'
  }
]

interface BusinessTypeSelectorProps {
  selectedType?: string
  onSelect: (type: string) => void
}

export function BusinessTypeSelector({ selectedType, onSelect }: BusinessTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">What type of business are you starting?</h2>
        <p className="text-gray-600 mt-2">This helps us customize your BakeSync experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businessTypes.map((type) => (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedType === type.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:shadow-sm'
            }`}
            onClick={() => onSelect(type.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{type.icon}</span>
                {selectedType === type.id && (
                  <Check className="h-5 w-5 text-blue-500" />
                )}
              </div>
              <CardTitle className="text-lg">{type.name}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm">
                {type.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
