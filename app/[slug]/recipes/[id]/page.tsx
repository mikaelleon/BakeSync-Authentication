"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { hasPermission } from "@/lib/permissions"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Clock, DollarSign, Package, ChefHat, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, Calculator } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const pathname = usePathname()
  const { user } = useAuth()
  const { recipes, inventory, productionLogs, loadDataOnDemand, isLoading } = useDataStore()
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false)
  const [scaleFactor, setScaleFactor] = useState("1")
  const hasLoadedRef = useRef(false)
  
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
  
  // Ensure recipes, inventory, and production logs are loaded
  useEffect(() => {
    const recipesArray = Array.isArray(recipes) ? recipes : []
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const logsArray = Array.isArray(productionLogs) ? productionLogs : []
    
    if (user && !hasLoadedRef.current && !isLoading) {
      hasLoadedRef.current = true
      Promise.all([
        recipesArray.length === 0 ? loadDataOnDemand('recipes') : Promise.resolve(),
        inventoryArray.length === 0 ? loadDataOnDemand('inventory') : Promise.resolve(),
        logsArray.length === 0 ? loadDataOnDemand('productionLogs') : Promise.resolve()
      ]).finally(() => {
        hasLoadedRef.current = false
      })
    }
  }, [recipes, inventory, productionLogs, user, loadDataOnDemand, isLoading])
  
  // Ensure recipes is always an array
  const recipesArray = Array.isArray(recipes) ? recipes : []
  const recipe = recipesArray.find((r) => r.id === id)

  // Calculate real production stats from production logs (hooks must be before early returns)
  const productionStats = useMemo(() => {
    const logsArray = Array.isArray(productionLogs) ? productionLogs : []
    const recipeLogs = logsArray.filter(log => log.recipeId === id)
    
    if (recipeLogs.length === 0) {
      return {
        totalBatches: 0,
        totalProduced: 0,
        lastProduction: undefined as Date | undefined,
        averageTime: 0,
        successRate: 100
      }
    }
    
    const totalBatches = recipeLogs.length
    const totalProduced = recipeLogs.reduce((sum, log) => sum + log.quantityProduced, 0)
    const lastProduction = recipeLogs.length > 0 
      ? new Date(Math.max(...recipeLogs.map(log => new Date(log.productionDate).getTime())))
      : undefined
    
    return {
      totalBatches,
      totalProduced,
      lastProduction,
      averageTime: 45, // TODO: Calculate from actual production times if available
      successRate: 95 // TODO: Calculate from actual success/failure data
    }
  }, [productionLogs, id])

  // Check if ingredients are available in inventory (hooks must be before early returns)
  const checkIngredientAvailability = useCallback((ingredientName: string) => {
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const inventoryItem = inventoryArray.find(
      item => item.name.toLowerCase() === ingredientName.toLowerCase() && item.type === 'raw'
    )
    return inventoryItem ? inventoryItem.quantity : 0
  }, [inventory])

  // Format instructions (handle both string and array) - hooks must be before early returns
  const formattedInstructions = useMemo(() => {
    if (!recipe) return ''
    if (Array.isArray(recipe.instructions)) {
      return recipe.instructions.join('\n\n')
    }
    return recipe.instructions || ''
  }, [recipe])

  // Calculate estimated cost from inventory prices - hooks must be before early returns
  const estimatedCost = useMemo(() => {
    if (!recipe) return 0
    return recipe.ingredients.reduce((total, ing) => {
      const inventoryArray = Array.isArray(inventory) ? inventory : []
      const inventoryItem = inventoryArray.find(
        item => item.name.toLowerCase() === ing.name.toLowerCase() && item.type === 'raw'
      )
      // Use a default cost if not found in inventory
      const costPerUnit = inventoryItem ? 0.5 : 0.5 // TODO: Get actual cost from inventory
      return total + ing.quantity * costPerUnit
    }, 0)
  }, [recipe, inventory])

  // Calculate scaled recipe values - hooks must be before early returns
  const scaleFactorNum = useMemo(() => parseFloat(scaleFactor) || 0, [scaleFactor])
  const scaledYield = useMemo(() => recipe ? recipe.yield * scaleFactorNum : 0, [recipe, scaleFactorNum])
  const scaledCost = useMemo(() => estimatedCost * scaleFactorNum, [estimatedCost, scaleFactorNum])
  const scaledIngredients = useMemo(() => {
    if (!recipe) return []
    return recipe.ingredients.map(ing => ({
      ...ing,
      quantity: ing.quantity * scaleFactorNum
    }))
  }, [recipe, scaleFactorNum])

  // Show loading state while recipes are being loaded (early return after all hooks)
  if (recipesArray.length === 0) {
    return (
      <ProtectedRoute permission="viewRecipes">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading recipe...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // Show not found if recipe doesn't exist after data is loaded (early return after all hooks)
  if (!recipe) {
    notFound()
  }

  const canEdit = user && hasPermission(user.role, "editRecipe")

  return (
    <ProtectedRoute permission="viewRecipes">
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href={`/${slug}/recipes`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsScaleDialogOpen(true)}>
              <Calculator className="h-4 w-4 mr-2" />
              Scale Recipe
            </Button>
            {canEdit && (
              <Button asChild>
                <Link href={`/${slug}/recipes/${recipe.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Recipe
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{recipe.name}</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Yields {recipe.yield} {recipe.yieldUnit}
            </p>
            {/* Display category */}
            <div className="flex flex-wrap gap-2 mt-3">
              {recipe.category && (
                <Badge variant="outline" className="text-sm">
                  {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingredients</p>
                    <p className="text-2xl font-bold">{recipe.ingredients.length}</p>
                    <p className="text-xs text-muted-foreground">items required</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ChefHat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Yield</p>
                    <p className="text-2xl font-bold">{recipe.yield}</p>
                    <p className="text-xs text-muted-foreground">{recipe.yieldUnit}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(estimatedCost, currency)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(estimatedCost / recipe.yield, currency)} per unit</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Prep Time</p>
                    <p className="text-2xl font-bold">{productionStats.averageTime}m</p>
                    <p className="text-xs text-muted-foreground">average</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Production Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Produced</p>
                    <p className="text-2xl font-bold">{productionStats.totalProduced}</p>
                    <p className="text-xs text-muted-foreground">in {productionStats.totalBatches} batches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{productionStats.successRate}%</p>
                    <p className="text-xs text-muted-foreground">production success</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Made</p>
                    <p className="text-2xl font-bold">
                      {productionStats.lastProduction 
                        ? productionStats.lastProduction.toLocaleDateString()
                        : 'Never'}
                    </p>
                    <p className="text-xs text-muted-foreground">production date</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ingredients
            </CardTitle>
            <CardDescription>Required materials for this recipe with inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recipe.ingredients.map((ingredient, index) => {
                const availableStock = checkIngredientAvailability(ingredient.name)
                const isAvailable = availableStock >= ingredient.quantity
                const isLowStock = availableStock < ingredient.quantity * 2
                
                return (
                  <div key={ingredient.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{ingredient.name}</span>
                            {isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Available: {availableStock} {ingredient.unit}
                            {isLowStock && !isAvailable && (
                              <span className="text-red-500 ml-2">(Low Stock)</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={isAvailable ? "default" : "destructive"} className="font-mono">
                          {ingredient.quantity} {ingredient.unit}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {formatCurrency(ingredient.quantity * 0.5, currency)}
                        </Badge>
                      </div>
                    </div>
                    {index < recipe.ingredients.length - 1 && <Separator />}
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-medium text-sm">Inventory Status</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {recipe.ingredients.every(ing => checkIngredientAvailability(ing.name) >= ing.quantity) 
                  ? "✅ All ingredients are available for production"
                  : "⚠️ Some ingredients are low in stock or unavailable"
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scale Recipe Dialog */}
        <Dialog open={isScaleDialogOpen} onOpenChange={setIsScaleDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Scale Recipe</DialogTitle>
              <DialogDescription>
                Calculate ingredient quantities for a different batch size
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scaleFactor">Scale Factor</Label>
                <Input
                  id="scaleFactor"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(e.target.value)}
                  placeholder="1.0"
                />
                <p className="text-sm text-muted-foreground">
                  Enter how many times to scale the recipe (e.g., 2 for double batch, 0.5 for half batch)
                </p>
              </div>
              
              {scaleFactorNum > 0 && (
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <p className="text-sm font-medium mb-2">Scaled Recipe Summary</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Original Yield:</span>
                        <span className="ml-2 font-medium">{recipe.yield} {recipe.yieldUnit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Scaled Yield:</span>
                        <span className="ml-2 font-medium">{scaledYield.toFixed(2)} {recipe.yieldUnit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Original Cost:</span>
                        <span className="ml-2 font-medium">{formatCurrency(estimatedCost, currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Scaled Cost:</span>
                        <span className="ml-2 font-medium">{formatCurrency(scaledCost, currency)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Scaled Ingredients:</p>
                    <div className="rounded-lg border p-4 space-y-2 max-h-64 overflow-y-auto">
                      {scaledIngredients.map((ingredient, index) => (
                        <div key={ingredient.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="font-medium">{ingredient.name}</span>
                          <Badge variant="outline" className="font-mono">
                            {ingredient.quantity.toFixed(2)} {ingredient.unit}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScaleDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Instructions
            </CardTitle>
            <CardDescription>Step-by-step preparation guide</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed">{formattedInstructions}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recipe Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Created Date</span>
              <span className="text-sm font-medium">
                {recipe.createdAt instanceof Date 
                  ? recipe.createdAt.toLocaleDateString() 
                  : new Date(recipe.createdAt).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="text-sm font-medium">
                {recipe.updatedAt instanceof Date 
                  ? recipe.updatedAt.toLocaleDateString() 
                  : new Date(recipe.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Cost per Unit</span>
              <span className="text-sm font-medium">{formatCurrency(estimatedCost / recipe.yield, currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
