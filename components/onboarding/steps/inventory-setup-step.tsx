"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowRight, ArrowLeft } from "lucide-react"

interface InventorySetupStepProps {
  data: any
  onUpdate: (data: any) => Promise<void>
  onNext?: () => void
  onPrevious?: () => void
  isLoading?: boolean
}

interface RawMaterial {
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
}

interface Product {
  name: string
  category: string
  price: number
  description: string
}

export function InventorySetupStep({ data, onUpdate, onNext, onPrevious, isLoading }: InventorySetupStepProps) {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(
    data.rawMaterials || [
      { name: '', category: '', unit: '', currentStock: 0, minStock: 0 }
    ]
  )
  const [products, setProducts] = useState<Product[]>(
    data.products || [
      { name: '', category: '', price: 0, description: '' }
    ]
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const materialCategories = [
    'Flour & Grains',
    'Dairy & Eggs',
    'Sweeteners',
    'Fats & Oils',
    'Leavening Agents',
    'Flavorings',
    'Fruits & Nuts',
    'Chocolate & Cocoa',
    'Other'
  ]

  const productCategories = [
    'Breads',
    'Pastries',
    'Cakes',
    'Cookies',
    'Pies',
    'Muffins',
    'Bagels',
    'Donuts',
    'Other'
  ]

  const units = [
    'lbs', 'kg', 'oz', 'g',
    'cups', 'ml', 'l', 'fl oz',
    'pieces', 'dozen', 'each'
  ]

  const addRawMaterial = () => {
    setRawMaterials(prev => [...prev, { name: '', category: '', unit: '', currentStock: 0, minStock: 0 }])
  }

  const removeRawMaterial = (index: number) => {
    if (rawMaterials.length > 1) {
      setRawMaterials(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateRawMaterial = (index: number, field: keyof RawMaterial, value: string | number) => {
    setRawMaterials(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const addProduct = () => {
    setProducts(prev => [...prev, { name: '', category: '', price: 0, description: '' }])
  }

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateProduct = (index: number, field: keyof Product, value: string | number) => {
    setProducts(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate raw materials
    const validMaterials = rawMaterials.filter(m => m.name.trim() && m.category && m.unit)
    if (validMaterials.length === 0) {
      newErrors.rawMaterials = 'At least one raw material is required'
    }

    // Validate products
    const validProducts = products.filter(p => p.name.trim() && p.category && p.price > 0)
    if (validProducts.length === 0) {
      newErrors.products = 'At least one product is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      const formData = {
        rawMaterials: rawMaterials.filter(m => m.name.trim() && m.category && m.unit),
        products: products.filter(p => p.name.trim() && p.category && p.price > 0)
      }
      
      await onUpdate(formData)
      if (onNext) {
        onNext()
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Raw Materials Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Raw Materials
            <Button type="button" variant="outline" size="sm" onClick={addRawMaterial}>
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </CardTitle>
          <CardDescription>
            Add the raw materials you use in your baking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rawMaterials.map((material, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={material.name}
                  onChange={(e) => updateRawMaterial(index, 'name', e.target.value)}
                  placeholder="e.g., All-purpose flour"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={material.category} onValueChange={(value) => updateRawMaterial(index, 'category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit *</Label>
                <Select value={material.unit} onValueChange={(value) => updateRawMaterial(index, 'unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  value={material.currentStock}
                  onChange={(e) => updateRawMaterial(index, 'currentStock', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Stock</Label>
                <Input
                  type="number"
                  value={material.minStock}
                  onChange={(e) => updateRawMaterial(index, 'minStock', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              {rawMaterials.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeRawMaterial(index)}
                  className="md:col-span-5"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          ))}
          {errors.rawMaterials && (
            <p className="text-sm text-destructive">{errors.rawMaterials}</p>
          )}
        </CardContent>
      </Card>

      {/* Products Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Products
            <Button type="button" variant="outline" size="sm" onClick={addProduct}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardTitle>
          <CardDescription>
            Add the products you sell to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.map((product, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  placeholder="e.g., Chocolate Chip Cookies"
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={product.category} onValueChange={(value) => updateProduct(index, 'category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  placeholder="Product description..."
                  rows={2}
                />
              </div>
              {products.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="md:col-span-4"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          ))}
          {errors.products && (
            <p className="text-sm text-destructive">{errors.products}</p>
          )}
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
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </form>
  )
}