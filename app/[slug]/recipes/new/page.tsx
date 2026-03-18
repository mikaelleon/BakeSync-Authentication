"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useDataStore } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils"
import type { Ingredient, RecipeCategory } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"

export default function NewRecipePage() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { addRecipe } = useDataStore()
  const [name, setName] = useState("")
  const [yieldAmount, setYieldAmount] = useState("")
  const [yieldUnit, setYieldUnit] = useState("pieces")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState<RecipeCategory>("other")
  const [instructionSteps, setInstructionSteps] = useState<string[]>([""])
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: "1", name: "", quantity: 0, unit: "" }])
  const [ingredientQuantities, setIngredientQuantities] = useState<Record<string, string>>({ "1": "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  
  // Extract slug from pathname
  const slug = pathname.split('/')[1] || 'demo'
  
  // Load currency
  useEffect(() => {
    const loadCurrency = async () => {
      if (user) {
        const bakeshopInfo = await getBakeshopInfo(user, true)
        if (bakeshopInfo?.currency) {
          setCurrency(bakeshopInfo.currency)
        }
      }
    }
    loadCurrency()
  }, [user])

  const addIngredient = () => {
    const newId = Date.now().toString()
    setIngredients([...ingredients, { id: newId, name: "", quantity: 0, unit: "" }])
    setIngredientQuantities(prev => ({ ...prev, [newId]: "" }))
  }

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter((i) => i.id !== id))
    setIngredientQuantities(prev => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients(ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }

  const addInstructionStep = () => {
    setInstructionSteps([...instructionSteps, ""])
  }

  const removeInstructionStep = (index: number) => {
    if (instructionSteps.length > 1) {
      setInstructionSteps(instructionSteps.filter((_, i) => i !== index))
    }
  }

  const updateInstructionStep = (index: number, value: string) => {
    const updated = [...instructionSteps]
    updated[index] = value
    setInstructionSteps(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Validate recipe name
      if (!name || name.trim() === "") {
        setError("Please enter a recipe name")
        setIsSubmitting(false)
        return
      }

      // Validate yield amount
      const yieldNum = Number(yieldAmount)
      if (!yieldAmount || isNaN(yieldNum) || yieldNum <= 0) {
        setError("Please enter a valid yield amount (greater than 0)")
        setIsSubmitting(false)
        return
      }

      // Validate yield unit
      if (!yieldUnit || yieldUnit.trim() === "") {
        setError("Please enter a yield unit")
        setIsSubmitting(false)
        return
      }

      // Filter out empty ingredients
      const validIngredients = ingredients.filter(ingredient => 
        ingredient.name.trim() !== "" && ingredient.quantity > 0 && ingredient.unit.trim() !== ""
      )

      if (validIngredients.length === 0) {
        setError("Please add at least one ingredient with name, quantity, and unit")
        setIsSubmitting(false)
        return
      }

      // Check for ingredients with missing units
      const ingredientsWithMissingUnits = ingredients.filter(ingredient => 
        ingredient.name.trim() !== "" && ingredient.quantity > 0 && ingredient.unit.trim() === ""
      )
      
      if (ingredientsWithMissingUnits.length > 0) {
        setError("Please select a unit for all ingredients")
        setIsSubmitting(false)
        return
      }

      // Format instructions with automatic numbering
      const formattedInstructions = instructionSteps
        .filter(step => step.trim() !== "")
        .map((step, index) => `${index + 1}. ${step.trim()}`)
        .join("\n")

      if (formattedInstructions.trim() === "") {
        setError("Please add at least one instruction step")
        setIsSubmitting(false)
        return
      }

      await addRecipe({
        name: name.trim(),
        yield: yieldNum,
        yieldUnit: yieldUnit.trim(),
        instructions: formattedInstructions,
        ingredients: validIngredients,
        price: price ? Number.parseFloat(price) || undefined : undefined,
        category: category,
        tags: []
      })

      router.push(`/${slug}/recipes`)
    } catch (err) {
      console.error('Recipe creation error:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : (typeof err === 'string' ? err : "Failed to create recipe")
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute permission="createRecipe">
      <div className="space-y-6 max-w-4xl">
        <div>
          <Button variant="ghost" asChild>
            <Link href={`/${slug}/recipes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Recipe</h1>
          <p className="text-muted-foreground mt-1">Add a new recipe to your bakery collection.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}
          
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
                  disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={category}
                    onValueChange={(value) => setCategory(value as RecipeCategory)}
                    disabled={isSubmitting}
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
                      // Allow empty string and numbers with optional decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setPrice(value)
                      }
                    }}
                    disabled={isSubmitting}
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
                <Button type="button" variant="outline" size="sm" onClick={addIngredient} disabled={isSubmitting}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ingredients.map((ingredient, index) => (
                <div key={ingredient.id} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Qty"
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
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Select
                      value={ingredient.unit || undefined}
                      onValueChange={(value) => updateIngredient(ingredient.id, "unit", value)}
                      disabled={isSubmitting}
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
                  {ingredients.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeIngredient(ingredient.id)} disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
              <CardTitle>Instructions</CardTitle>
                  <CardDescription>Step-by-step preparation guide (numbered automatically)</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addInstructionStep} disabled={isSubmitting}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {instructionSteps.map((step, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-sm font-medium text-muted-foreground">
                    {index + 1}.
                  </div>
              <Textarea
                    placeholder={`Step ${index + 1}...`}
                    value={step}
                    onChange={(e) => updateInstructionStep(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                disabled={isSubmitting}
              />
                  {instructionSteps.length > 1 && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => removeInstructionStep(index)} 
                      disabled={isSubmitting}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Creating Recipe..." : "Create Recipe"}
            </Button>
            <Button type="button" variant="outline" asChild disabled={isSubmitting}>
              <Link href={`/${slug}/recipes`}>Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  )
}
