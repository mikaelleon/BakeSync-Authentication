"use client"

import React, { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
// Removed mock data import - using real data from data store
import { ClipboardList, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"

export default function ProductionPage() {
  const { user } = useAuth()
  const { recipes, productionLogs, addProductionLog, loadDataOnDemand } = useDataStore()
  const [selectedRecipe, setSelectedRecipe] = useState("")
  const [quantity, setQuantity] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)

  // Ensure recipes is always an array and filter out invalid recipes
  const recipesArray = React.useMemo(() => {
    if (!Array.isArray(recipes)) return []
    // Filter to ensure all recipes have valid id and name
    return recipes.filter(recipe => recipe && recipe.id && recipe.name && typeof recipe.id === 'string' && typeof recipe.name === 'string')
  }, [recipes])

  // Load recipes and production logs when component mounts (non-blocking)
  // Only load once when user is available
  React.useEffect(() => {
    if (!user) return
    
    setIsLoadingRecipes(true)
    // Load in parallel in background - don't block rendering
    // loadDataOnDemand will check if data is already loaded
    Promise.all([
      loadDataOnDemand('recipes').catch(() => {}),
      loadDataOnDemand('productionLogs').catch(() => {})
    ]).finally(() => {
      setIsLoadingRecipes(false)
    })
  }, [user?.id, loadDataOnDemand]) // Only depend on user.id to prevent unnecessary reloads

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecipe || !quantity) return
    
    setIsSubmitting(true)

    try {
      const selectedRecipeData = recipesArray.find((r) => r.id === selectedRecipe)
      if (!selectedRecipeData) throw new Error('Recipe not found')

      await addProductionLog({
        recipeId: selectedRecipeData.id,
        recipeName: selectedRecipeData.name,
        quantityProduced: parseFloat(quantity),
        productionDate: new Date(),
        notes: `Production batch by ${user?.name || 'Unknown'}`
      })

      setShowSuccess(true)
      setSelectedRecipe("")
      setQuantity("")
    } catch (error) {
      console.error('Failed to log production:', error)
      // Handle error appropriately
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setShowSuccess(false), 3000)
    }
  }

  const selectedRecipeData = recipesArray.find((r) => r.id === selectedRecipe)

  return (
    <ProtectedRoute permission="logProduction">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Log</h1>
          <p className="text-muted-foreground mt-1">Record production batches and track inventory updates</p>
        </div>

        {showSuccess && (
          <div className="bg-success/10 border border-success rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="font-medium text-success">Production batch logged successfully!</p>
              <p className="text-sm text-success/80">Inventory has been automatically updated.</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Log Production Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log New Production Batch</CardTitle>
              <CardDescription>Select a recipe and enter the quantity produced</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipe">Recipe</Label>
                  {isLoadingRecipes ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Loading recipes...
                    </div>
                  ) : recipesArray.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                      <p>No recipes available.</p>
                      <p className="text-xs mt-1">Create a recipe first to log production.</p>
                    </div>
                  ) : (
                    <Select 
                      value={selectedRecipe} 
                      onValueChange={setSelectedRecipe}
                      disabled={isLoadingRecipes || recipesArray.length === 0}
                    >
                      <SelectTrigger id="recipe" className="w-full">
                        <SelectValue placeholder="Select a recipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipesArray.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedRecipeData && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-medium">Recipe Yield</p>
                    <p className="text-2xl font-bold">
                      {selectedRecipeData.yield} {selectedRecipeData.yieldUnit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedRecipeData.ingredients.length} ingredients required
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Produced</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  {selectedRecipeData && quantity && (
                    <p className="text-sm text-muted-foreground">
                      This will produce {Number(quantity) * selectedRecipeData.yield} {selectedRecipeData.yieldUnit}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!selectedRecipe || !quantity || isSubmitting || recipesArray.length === 0 || isLoadingRecipes}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Logging..." : "Log Production Batch"}
                </Button>

                {selectedRecipeData && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium">Automatic Inventory Updates</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Raw materials will be deducted based on recipe</li>
                      <li>✓ Finished goods will be added to inventory</li>
                      <li>✓ Production log will be recorded with timestamp</li>
                    </ul>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Recent Production Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Production Logs</CardTitle>
              <CardDescription>Latest production batches recorded</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No production logs yet.</p>
                    <p className="text-sm">Start by logging your first production batch above.</p>
                  </div>
                ) : (
                  productionLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div className="space-y-1">
                        <p className="font-medium">{log.recipeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.quantityProduced} batches by {log.bakerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(log.productionDate, "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Production History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Production History</CardTitle>
            <CardDescription>Complete log of all production batches</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Recipe</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Baker</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center space-y-2">
                        <ClipboardList className="h-8 w-8 opacity-50" />
                        <p>No production logs recorded yet.</p>
                        <p className="text-sm">Start by logging your first production batch above.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  productionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(log.productionDate, "MMM d, yyyy h:mm a")}</TableCell>
                      <TableCell className="font-medium">{log.recipeName}</TableCell>
                      <TableCell>{log.quantityProduced}</TableCell>
                      <TableCell>{log.bakerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
