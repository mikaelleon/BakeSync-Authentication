"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { hasPermission } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Search, X } from "lucide-react"
import Link from "next/link"
import { RecipeCard } from "@/components/recipe-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { RecipeCategory } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function RecipesPage() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { recipes, deleteRecipe, checkRecipeHasProductionLogs, loadDataOnDemand } = useDataStore()
  const hasLoadedRef = useRef(false)
  
  // Extract slug from pathname
  const slug = pathname.split('/')[1] || 'demo'

  // Load recipes data when component mounts (non-blocking)
  useEffect(() => {
    const recipesArray = Array.isArray(recipes) ? recipes : []
    if (recipesArray.length === 0 && user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      // Load in background - don't block rendering
      loadDataOnDemand('recipes').catch(() => {}).finally(() => {
        hasLoadedRef.current = false
      })
    }
  }, [recipes.length, user?.id, loadDataOnDemand]) // Only depend on length and user.id
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | "all">("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [hasProductionLogs, setHasProductionLogs] = useState(false)
  const [deleteWithLogs, setDeleteWithLogs] = useState(false)
  const [isCheckingLogs, setIsCheckingLogs] = useState(false)

  const canCreate = user ? hasPermission(user.role, "createRecipe") : false
  const canView = user ? hasPermission(user.role, "viewRecipes") : false
  const isBaker = user?.role === "baker"

  // Ensure recipes is always an array
  const recipesArray = Array.isArray(recipes) ? recipes : []
  
  // Get unique categories from recipes
  const availableCategories = useMemo(() => {
    const categories = new Set<RecipeCategory>()
    recipesArray.forEach(recipe => {
      if (recipe.category) {
        categories.add(recipe.category)
      }
    })
    return Array.from(categories).sort()
  }, [recipesArray])

  // Memoize filtered recipes with category and search
  const filteredRecipes = useMemo(() => {
    return recipesArray.filter((recipe) => {
      // Search filter
      const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [recipesArray, searchQuery, selectedCategory])

  // Check for production logs when delete dialog opens
  useEffect(() => {
    if (!deleteId || !checkRecipeHasProductionLogs) {
      setHasProductionLogs(false)
      setDeleteWithLogs(false)
      return
    }

    const checkLogs = async () => {
      setIsCheckingLogs(true)
      try {
        const hasLogs = await checkRecipeHasProductionLogs(deleteId)
        setHasProductionLogs(hasLogs)
        setDeleteWithLogs(false) // Reset to default
      } catch (error) {
        console.error('Error checking production logs:', error)
        setHasProductionLogs(false)
      } finally {
        setIsCheckingLogs(false)
      }
    }

    checkLogs()
  }, [deleteId, checkRecipeHasProductionLogs])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteRecipe(id, deleteWithLogs)
      setDeleteId(null)
      setHasProductionLogs(false)
      setDeleteWithLogs(false)
    } catch (error) {
      // Error is already handled in deleteRecipe with toast notification
      // Just close the dialog
      setDeleteId(null)
      setHasProductionLogs(false)
      setDeleteWithLogs(false)
      console.error('Error deleting recipe:', error)
    }
  }, [deleteRecipe, deleteWithLogs])

  return (
    <ProtectedRoute permission="viewRecipes">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground mt-1">
              {isBaker ? "View recipe instructions and formulations" : "Manage your bakery recipes and formulations"}
            </p>
          </div>
          {canCreate && (
            <Button asChild>
              <Link href={`/${slug}/recipes/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Recipe
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipes by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="category-filter" className="text-sm font-medium whitespace-nowrap">Category:</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as RecipeCategory | "all")}
              >
                <SelectTrigger id="category-filter" className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== "all" || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Category: {selectedCategory}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSelectedCategory("all")}
                  />
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all")
                  setSearchQuery("")
                }}
                className="h-7 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {!recipesArray || recipesArray.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading recipes...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No recipes found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} canEdit={canCreate} onDelete={canCreate ? (id) => setDeleteId(id) : undefined} slug={slug} />
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null)
            setHasProductionLogs(false)
            setDeleteWithLogs(false)
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
              <AlertDialogDescription>
                {isCheckingLogs ? (
                  "Checking for production logs..."
                ) : hasProductionLogs ? (
                  <>
                    This recipe is being used in production logs. Deleting it will also remove all associated production logs.
                    <br /><br />
                    <strong>This action cannot be undone.</strong>
                  </>
                ) : (
                  "Are you sure you want to delete this recipe? This action cannot be undone."
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {hasProductionLogs && !isCheckingLogs && (
              <div className="flex items-center space-x-2 py-4">
                <input
                  type="checkbox"
                  id="deleteWithLogs"
                  checked={deleteWithLogs}
                  onChange={(e) => setDeleteWithLogs(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="deleteWithLogs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Also delete all production logs for this recipe
                </label>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteId(null)
                setHasProductionLogs(false)
                setDeleteWithLogs(false)
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteId && handleDelete(deleteId)}
                disabled={isCheckingLogs || (hasProductionLogs && !deleteWithLogs)}
                className={hasProductionLogs && !deleteWithLogs ? "opacity-50 cursor-not-allowed" : ""}
              >
                {hasProductionLogs && !deleteWithLogs ? "Select option to delete" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  )
}
