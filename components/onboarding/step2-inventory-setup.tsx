"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, ArrowLeft, SkipForward, Plus, Trash2, Package } from "lucide-react"

interface Step2Props {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

interface InventoryCategory {
  name: string
  items: Array<{
    name: string
    quantity: number
    unit: string
  }>
}

export function OnboardingStep2({ data, onUpdate, onNext, onBack, onSkip }: Step2Props) {
  const [categories, setCategories] = useState<InventoryCategory[]>(
    data.inventoryCategories || []
  )

  const [newCategoryName, setNewCategoryName] = useState("")
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    if (data.inventoryCategories) {
      data.inventoryCategories.forEach((cat: any, catIdx: number) => {
        cat.items.forEach((item: any, itemIdx: number) => {
          const key = `${catIdx}-${itemIdx}`
          initial[key] = item.quantity ? item.quantity.toString() : ""
        })
      })
    }
    return initial
  })

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: InventoryCategory = {
        name: newCategoryName.trim(),
        items: [{ name: "", quantity: 0, unit: "kg" }]
      }
      setCategories([...categories, newCategory])
      setNewCategoryName("")
    }
  }

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
  }

  const updateCategoryName = (index: number, name: string) => {
    const updated = [...categories]
    updated[index].name = name
    setCategories(updated)
  }

  const addItemToCategory = (categoryIndex: number) => {
    const updated = [...categories]
    const itemIndex = updated[categoryIndex].items.length
    updated[categoryIndex].items.push({ name: "", quantity: 0, unit: "kg" })
    setCategories(updated)
    const key = `${categoryIndex}-${itemIndex}`
    setItemQuantities(prev => ({ ...prev, [key]: "" }))
  }

  const updateItem = (categoryIndex: number, itemIndex: number, field: string, value: string | number) => {
    const updated = [...categories]
    updated[categoryIndex].items[itemIndex] = {
      ...updated[categoryIndex].items[itemIndex],
      [field]: value
    }
    setCategories(updated)
  }

  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const updated = [...categories]
    updated[categoryIndex].items = updated[categoryIndex].items.filter((_, i) => i !== itemIndex)
    setCategories(updated)
    // Remove quantity from state and reindex
    const newQuantities: Record<string, string> = {}
    Object.keys(itemQuantities).forEach(key => {
      const [catIdx, itemIdx] = key.split('-').map(Number)
      if (catIdx === categoryIndex) {
        if (itemIdx < itemIndex) {
          newQuantities[key] = itemQuantities[key]
        } else if (itemIdx > itemIndex) {
          newQuantities[`${catIdx}-${itemIdx - 1}`] = itemQuantities[key]
        }
        // Skip itemIdx === itemIndex (the removed one)
      } else {
        newQuantities[key] = itemQuantities[key]
      }
    })
    setItemQuantities(newQuantities)
  }

  const handleNext = () => {
    onUpdate({ inventoryCategories: categories })
    onNext()
  }

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Set up your initial inventory</h1>
        <p className="text-muted-foreground mb-4">
          Create categories and add items to get started with inventory management
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Step 2 of 5</span>
          <Progress value={40} className="w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Categories</CardTitle>
          <CardDescription>
            Start by creating categories and adding your first items. You can always add more later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new category */}
          <div className="flex space-x-2">
            <Input
              placeholder="Add a new category (e.g., Spices, Nuts)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
            />
            <Button onClick={addCategory} disabled={!newCategoryName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No categories created yet.</p>
                <p className="text-sm">Add your first category above to get started.</p>
              </div>
            ) : (
              categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <Input
                    value={category.name}
                    onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                    className="text-lg font-medium border-none p-0 h-auto"
                    placeholder="Category name"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCategory(categoryIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex space-x-2 items-center">
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="0"
                        value={itemQuantities[`${categoryIndex}-${itemIndex}`] ?? (item.quantity?.toString() || "")}
                        onChange={(e) => {
                          const value = e.target.value
                          const key = `${categoryIndex}-${itemIndex}`
                          // Allow empty string and numbers with optional decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setItemQuantities(prev => ({ ...prev, [key]: value }))
                            updateItem(categoryIndex, itemIndex, 'quantity', value === '' ? 0 : parseFloat(value) || 0)
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure valid number on blur
                          const value = e.target.value
                          const numValue = value === '' ? 0 : parseFloat(value) || 0
                          updateItem(categoryIndex, itemIndex, 'quantity', numValue)
                        }}
                        className="w-20"
                      />
                      <Input
                        placeholder="unit"
                        value={item.unit}
                        onChange={(e) => updateItem(categoryIndex, itemIndex, 'unit', e.target.value)}
                        className="w-24"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(categoryIndex, itemIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addItemToCategory(categoryIndex)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Total items: {totalItems}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex items-center space-x-2"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip</span>
              </Button>
              <Button
                onClick={handleNext}
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
