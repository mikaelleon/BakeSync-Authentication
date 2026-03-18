"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useDataStore } from "@/lib/data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2, Save, X, Eye, Calculator } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Ingredient, RecipeCategory } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils"

export default function EditRecipePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { recipes, updateRecipe, loadDataOnDemand } = useDataStore()
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  
  // Extract slug from pathname
  const slug = pathname.split('/')[1] || 'demo'
  
  // Load currency from bakeshop
  useEffect(() => {
    const loadCurrency = async () => {
      if (user) {
        const bakeshopInfo = await getBakeshopInfo(user)
        if (bakeshopInfo?.currency) {
          setCurrency(bakeshopInfo.currency)
        }
      }
    }
    loadCurrency()
  }, [user])
  
  // Ensure recipes are loaded
  useEffect(() => {
    if (recipes.length === 0) {
      loadDataOnDemand('recipes')
    }
  }, [recipes.length, loadDataOnDemand])
  
  const recipe = recipes.find((r) => r.id === id)

  if (!recipe) {
    notFound()
  }

  const [name, setName] = useState(recipe.name)
  const [yieldAmount, setYieldAmount] = useState(recipe.yield.toString())
  const [yieldUnit, setYieldUnit] = useState(recipe.yieldUnit)
  const [price, setPrice] = useState(recipe.price?.toString() || "")
  const [category, setCategory] = useState<RecipeCategory>(recipe.category || 'other')
  const [instructions, setInstructions] = useState(recipe.instructions)
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients)
  const [showPreview, setShowPreview] = useState(false)
  const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    recipe.ingredients.forEach(ing => {
      initial[ing.id] = ing.quantity ? ing.quantity.toString() : ""
    })
    return initial
  })

  const addIngredient = () => {
    const newId = Date.now().toString()
    setIngredients([...ingredients, { id: newId, name: "", quantity: 0, unit: "" }])
    setIngredientQuantities(prev => ({ ...prev, [newId]: "" }))
  }

  const removeIngredient = (ingredientId: string) => {
    setIngredients(ingredients.filter((i) => i.id !== ingredientId))
    setIngredientQuantities(prev => {
      const updated = { ...prev }
      delete updated[ingredientId]
      return updated
    })
  }

  const updateIngredient = (ingredientId: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(ingredients.map((i) => (i.id === ingredientId ? { ...i, [field]: value } : i)))
  }

  const estimatedCost = ingredients.reduce((total, ing) => {
    const costPerUnit = 0.5
    return total + ing.quantity * costPerUnit
  }, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateRecipe(id, {
      name,
      yield: Number.parseFloat(yieldAmount),
      yieldUnit,
      ingredients,
      instructions,
      price: price ? Number.parseFloat(price) || undefined : undefined,
      category: category,
      tags: []
    })
      router.push(`/${slug}/recipes/${id}`)
  }

  return (
    <ProtectedRoute permission="editRecipe">
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/${slug}/recipes/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipe
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? "Edit Mode" : "Preview"}
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Recipe</h1>
          <p className="text-muted-foreground mt-1">Update recipe details, ingredients, and instructions.</p>
        </div>

        <Tabs defaultValue="edit" className="space-y-6">
          <TabsList>
            <TabsTrigger value="edit">Edit Recipe</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="costing">Cost Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Recipe name and yield details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Recipe Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Chocolate Chip Cookies"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="yield">Yield Amount</Label>
                      <Input
                        id="yield"
                        type="number"
                        placeholder="24"
                        value={yieldAmount}
                        onChange={(e) => setYieldAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yieldUnit">Yield Unit</Label>
                      <Input
                        id="yieldUnit"
                        placeholder="pieces, kg, etc."
                        value={yieldUnit}
                        onChange={(e) => setYieldUnit(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={category}
                        onValueChange={(value) => setCategory(value as RecipeCategory)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cake">Cake</SelectItem>
                          <SelectItem value="pastries">Pastries</SelectItem>
                          <SelectItem value="bread">Bread</SelectItem>
                          <SelectItem value="cookies">Cookies</SelectItem>
                          <SelectItem value="drinks">Drinks</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price per Piece</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setPrice(value)
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Price for POS products created from this recipe</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Ingredients</CardTitle>
                      <CardDescription>List all required ingredients and quantities</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ingredient
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ingredients.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No ingredients added yet. Click "Add Ingredient" to get started.</p>
                    </div>
                  ) : (
                    ingredients.map((ingredient, index) => (
                      <div key={ingredient.id} className="flex gap-2 items-start">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-medium shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Ingredient name (e.g., All-purpose flour)"
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                            required
                          />
                        </div>
                        <div className="w-28 space-y-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Quantity"
                            value={ingredientQuantities[ingredient.id] ?? (ingredient.quantity || "")}
                            onChange={(e) => {
                              const value = e.target.value
                              // Allow empty string and numbers with optional decimal point
                              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                setIngredientQuantities(prev => ({ ...prev, [ingredient.id]: value }))
                                updateIngredient(ingredient.id, "quantity", value === '' ? 0 : Number.parseFloat(value) || 0)
                              }
                            }}
                            onBlur={(e) => {
                              // Ensure valid number on blur
                              const value = e.target.value
                              const numValue = value === '' ? 0 : Number.parseFloat(value) || 0
                              updateIngredient(ingredient.id, "quantity", numValue)
                            }}
                            required
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Select
                            value={ingredient.unit || undefined}
                            onValueChange={(value) => updateIngredient(ingredient.id, "unit", value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Solid Measurements</SelectLabel>
                                <SelectItem value="g">g (grams)</SelectItem>
                                <SelectItem value="kg">kg (kilograms)</SelectItem>
                                <SelectItem value="oz">oz (ounces)</SelectItem>
                                <SelectItem value="lb">lb (pounds)</SelectItem>
                                <SelectItem value="cups">cups</SelectItem>
                                <SelectItem value="tbsp">tbsp (tablespoons)</SelectItem>
                                <SelectItem value="tsp">tsp (teaspoons)</SelectItem>
                                <SelectItem value="pieces">pieces</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Liquid Measurements</SelectLabel>
                                <SelectItem value="ml">ml (milliliters)</SelectItem>
                                <SelectItem value="l">l (liters)</SelectItem>
                                <SelectItem value="fl oz">fl oz (fluid ounces)</SelectItem>
                                <SelectItem value="cups (liquid)">cups (liquid)</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeIngredient(ingredient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                  <CardDescription>Step-by-step preparation guide</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="1. Mix dry ingredients...&#10;2. Add wet ingredients...&#10;3. Bake at 180°C for 12-15 minutes..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Write clear, numbered steps for easy following.
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/${slug}/recipes/${id}`}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{name || "Recipe Name"}</CardTitle>
                <CardDescription>
                  Yields {yieldAmount || "0"} {yieldUnit || "units"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {ingredients.map((ing, index) => (
                      <div key={ing.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{index + 1}.</span>
                          <span>{ing.name || "Unnamed ingredient"}</span>
                        </div>
                        <Badge variant="secondary">
                          {ing.quantity} {ing.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Instructions</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {instructions || "No instructions provided yet."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="costing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Cost Analysis
                </CardTitle>
                <CardDescription>Estimated production costs for this recipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                        <p className="text-3xl font-bold">{formatCurrency(estimatedCost, currency)}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Cost per Unit</p>
                        <p className="text-3xl font-bold">
                          {yieldAmount ? formatCurrency(estimatedCost / Number.parseFloat(yieldAmount), currency) : formatCurrency(0, currency)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Ingredients</p>
                        <p className="text-3xl font-bold">{ingredients.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Ingredient Breakdown</h3>
                  <div className="space-y-2">
                    {ingredients.map((ing) => {
                      const ingCost = ing.quantity * 0.5
                      return (
                        <div key={ing.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{ing.name || "Unnamed"}</p>
                            <p className="text-sm text-muted-foreground">
                              {ing.quantity} {ing.unit}
                            </p>
                          </div>
                          <Badge variant="outline">{formatCurrency(ingCost, currency)}</Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Note: Cost estimates are based on average ingredient prices and may vary based on supplier and
                    market conditions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}
