"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase-client"
import { useAuth } from "@/lib/auth-context"
import { createDataLoader, getBakeshopInfo } from "@/lib/environment-data-loader"
import { isDemoAccount } from "@/lib/account-detection"
import { hasPermission } from "@/lib/permissions"
import { convertUnit, normalizeUnit, areUnitsCompatible } from "@/lib/unit-conversion"
import { toast } from "sonner"
import type { Recipe, InventoryItem, Supplier, PurchaseOrder, Product, Sale, Ingredient, ProductionLog } from "./types"

interface DataStoreContextType {
  // Recipes
  recipes: Recipe[]
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<void>
  deleteRecipe: (id: string, deleteProductionLogs?: boolean) => Promise<void>
  checkRecipeHasProductionLogs: (recipeId: string) => Promise<boolean>
  
  // Inventory
  inventory: InventoryItem[]
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => Promise<void>
  deleteInventoryItem: (id: string) => Promise<void>
  bulkUpdateInventory: (updates: Array<{ id: string; quantity: number }>) => Promise<void>
  
  // Suppliers
  suppliers: Supplier[]
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  
  // Purchase Orders
  purchaseOrders: PurchaseOrder[]
  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id'>) => Promise<void>
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => Promise<void>
  deletePurchaseOrder: (id: string) => Promise<void>
  
  // Products
  products: Product[]
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  
  // Sales
  sales: Sale[]
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>
  updateSale: (id: string, sale: Partial<Sale>) => Promise<void>
  deleteSale: (id: string) => Promise<void>

  // Production Logs
  productionLogs: ProductionLog[]
  addProductionLog: (logData: {
    recipeId: string
    recipeName: string
    batchNumber?: string
    quantityProduced: number
    productionDate: Date
    notes?: string
    qualityRating?: number
  }) => Promise<void>
  loadProductionLogs: () => Promise<void>

  // Loading states
  isLoading: boolean
  error: string | null
  
  // Data loading functions
  loadDataOnDemand: (dataType: string, forceReload?: boolean) => Promise<void>
  loadAllData: () => Promise<void>
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined)

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bakeshopInfo, setBakeshopInfo] = useState<any>(null)
  const [environment, setEnvironment] = useState<'demo' | 'production'>('production')

  // Refs to prevent duplicate loading
  const loadingRefs = {
    recipes: useRef(false),
    inventory: useRef(false),
    suppliers: useRef(false),
    purchaseOrders: useRef(false),
    products: useRef(false),
    sales: useRef(false),
    productionLogs: useRef(false)
  }
  
  // Track which data types have been loaded at least once
  const loadedDataTypes = useRef<Set<string>>(new Set())

  const supabase = createClient()
  const { user } = useAuth()

  // Load bakeshop info and determine environment when user changes (memoized)
  useEffect(() => {
    if (!user) {
      setBakeshopInfo(null)
      setEnvironment('production')
      return
    }

    // Use cached version if available
    const loadBakeshopInfo = async () => {
      const info = await getBakeshopInfo(user, true) // Use cache
      setBakeshopInfo(info)
      setEnvironment(isDemoAccount(user) ? 'demo' : 'production')
    }
    
    loadBakeshopInfo()
  }, [user?.id]) // Only depend on user.id to prevent unnecessary reloads

  // Create data loader instance with environment context
  // Use useMemo to recreate when user or bakeshopInfo changes
  const dataLoader = useMemo(() => {
    return createDataLoader(user, bakeshopInfo?.id)
  }, [user, bakeshopInfo?.id])

  // Load initial data lazily - only load when needed
  useEffect(() => {
    // Don't load all data upfront - this was causing slow sign-in
    // Data will be loaded on-demand when components request it
    setIsLoading(false)
  }, [])

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Load data with individual error handling
      const loadPromises = [
        loadRecipes().catch(err => console.warn('Failed to load recipes:', err)),
        loadInventory().catch(err => console.warn('Failed to load inventory:', err)),
        loadSuppliers().catch(err => console.warn('Failed to load suppliers:', err)),
        loadPurchaseOrders().catch(err => console.warn('Failed to load purchase orders:', err)),
        loadProducts().catch(err => console.warn('Failed to load products:', err)),
        loadSales().catch(err => console.warn('Failed to load sales:', err))
      ]
      
      await Promise.allSettled(loadPromises)
    } catch (err) {
      console.error('Error in loadAllData:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Load data on-demand for better performance (optimized for instant tab switching)
  const loadDataOnDemand = useCallback(async (dataType: string, forceReload = false) => {
    // Check if data is already loaded and we're not forcing a reload
    if (!forceReload) {
      // If already loaded (tracked in Set), skip
      if (loadedDataTypes.current.has(dataType)) {
        return
      }
      
      // If currently loading, skip to avoid duplicate requests
      switch (dataType) {
        case 'recipes':
          if (loadingRefs.recipes.current) return
          break
        case 'inventory':
          if (loadingRefs.inventory.current) return
          break
        case 'suppliers':
          if (loadingRefs.suppliers.current) return
          break
        case 'purchaseOrders':
          if (loadingRefs.purchaseOrders.current) return
          break
        case 'products':
          if (loadingRefs.products.current) return
          break
        case 'sales':
          if (loadingRefs.sales.current) return
          break
        case 'productionLogs':
          if (loadingRefs.productionLogs.current) return
          break
      }
    } else {
      // Force reload - remove from loaded set AND clear loading flag
      loadedDataTypes.current.delete(dataType)
      // Clear loading flag to allow immediate reload
      switch (dataType) {
        case 'recipes':
          loadingRefs.recipes.current = false
          break
        case 'inventory':
          loadingRefs.inventory.current = false
          break
        case 'suppliers':
          loadingRefs.suppliers.current = false
          break
        case 'purchaseOrders':
          loadingRefs.purchaseOrders.current = false
          break
        case 'products':
          loadingRefs.products.current = false // CRITICAL: Clear loading flag for products
          break
        case 'sales':
          loadingRefs.sales.current = false
          break
        case 'productionLogs':
          loadingRefs.productionLogs.current = false
          break
      }
    }

    try {
      // Don't set global loading state - allow pages to render immediately
      // Only set loading for the specific data type
      setError(null)
      
      // Non-blocking: Don't wait for bakeshopInfo if it's not ready
      // Pages can render with empty data while loading happens in background
      if (user && !isDemoAccount(user) && !bakeshopInfo) {
        // Try to get bakeshopInfo but don't block
        getBakeshopInfo(user, true).then(info => {
          if (info) {
            setBakeshopInfo(info)
          }
        }).catch(() => {})
      }
      
      // Determine environment based on user if not set yet
      const currentEnvironment = environment === 'production' && user && isDemoAccount(user) ? 'demo' : environment
      
      // Use environment-specific data loading
      if (currentEnvironment === 'demo') {
        // For demo environment, load mock data
        await loadDemoData(dataType)
      } else {
        // For production environment, load real data
        switch (dataType) {
          case 'recipes':
            await loadRecipes()
            break
          case 'inventory':
            await loadInventory()
            break
          case 'suppliers':
            await loadSuppliers()
            break
          case 'purchaseOrders':
            await loadPurchaseOrders()
            break
          case 'products':
            await loadProducts()
            break
          case 'sales':
            await loadSales()
            break
          case 'productionLogs':
            await loadProductionLogs()
            break
          default:
            await loadAllData()
        }
      }
    } catch (err) {
      console.error(`Error loading ${dataType}:`, err)
      setError(err instanceof Error ? err.message : `Failed to load ${dataType}`)
    }
  }, [user, bakeshopInfo?.id, environment, dataLoader])

  // Load demo data for demo environment
  const loadDemoData = async (dataType: string) => {
    try {
      // Import mock data
      const { MOCK_RECIPES, MOCK_INVENTORY, MOCK_SUPPLIERS, MOCK_PURCHASE_ORDERS, MOCK_PRODUCTS, MOCK_SALES, MOCK_PRODUCTION_LOGS } = await import('./mock-data')
      
      switch (dataType) {
        case 'recipes':
          setRecipes(MOCK_RECIPES)
          break
        case 'inventory':
          setInventory(MOCK_INVENTORY)
          break
        case 'suppliers':
          setSuppliers(MOCK_SUPPLIERS)
          break
        case 'purchaseOrders':
          setPurchaseOrders(MOCK_PURCHASE_ORDERS)
          break
        case 'products':
          setProducts(MOCK_PRODUCTS)
          break
        case 'sales':
          setSales(MOCK_SALES)
          break
        case 'productionLogs':
          setProductionLogs(MOCK_PRODUCTION_LOGS)
          break
        default:
          // Load all demo data
          setRecipes(MOCK_RECIPES)
          setInventory(MOCK_INVENTORY)
          setSuppliers(MOCK_SUPPLIERS)
          setPurchaseOrders(MOCK_PURCHASE_ORDERS)
          setProducts(MOCK_PRODUCTS)
          setSales(MOCK_SALES)
          setProductionLogs(MOCK_PRODUCTION_LOGS)
      }
    } catch (error) {
      console.error('Error loading demo data:', error)
      throw error
    }
  }

  // Recipe operations
  const loadRecipes = async () => {
    if (!user || !dataLoader) {
      // Set empty array if user or dataLoader is not available to prevent infinite loading
      setRecipes([])
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.recipes.current) {
      return
    }
    
    try {
      loadingRefs.recipes.current = true
      const result = await dataLoader.loadRecipes()
      // loadRecipes returns DataLoadingResult with a data property
      let recipesData = result?.data || []
      
      // Role-based filtering: Cashiers cannot see recipes
      if (user.role === 'cashier') {
        recipesData = []
      }
      
      // Ensure it's always an array
      setRecipes(Array.isArray(recipesData) ? recipesData : [])
      // Mark as loaded
      loadedDataTypes.current.add('recipes')
    } catch (error) {
      console.error('Error loading recipes:', error)
      // On error, ensure recipes is still an array
      setRecipes([])
      // Still mark as loaded (even if empty) to prevent infinite retries
      loadedDataTypes.current.add('recipes')
      throw error
    } finally {
      loadingRefs.recipes.current = false
    }
  }

  const addRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'createRecipe')) {
      throw new Error('You do not have permission to create recipes')
    }
    
    // Ensure bakeshopInfo is loaded before creating recipe
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Convert instructions string to array format (split by newlines)
    // The database expects TEXT[] but we receive a string from the form
    const instructionsArray = typeof recipeData.instructions === 'string'
      ? recipeData.instructions
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line.replace(/^\d+\.\s*/, ''))
      : recipeData.instructions

    // Ensure tags is a valid array and filter out any invalid values
    const validTags = Array.isArray(recipeData.tags) 
      ? recipeData.tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
      : []

    // Validate category
    const validCategory = recipeData.category || 'other'

    // Optimistic update - create temporary recipe
    const tempId = `temp-${Date.now()}`
    const optimisticRecipe: Recipe = {
      id: tempId,
      name: recipeData.name,
      yield: recipeData.yield,
      yieldUnit: recipeData.yieldUnit,
      ingredients: recipeData.ingredients,
      instructions: typeof recipeData.instructions === 'string' 
        ? recipeData.instructions 
        : (Array.isArray(recipeData.instructions) 
          ? (recipeData.instructions as string[]).join('\n') 
          : ''),
      price: recipeData.price,
      category: validCategory,
      tags: validTags,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setRecipes(prev => [...(Array.isArray(prev) ? prev : []), optimisticRecipe])

    try {
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name: recipeData.name.trim(),
          yield_amount: recipeData.yield,
          yield_unit: recipeData.yieldUnit.trim(),
          instructions: instructionsArray, // Send as array
          price: recipeData.price || null,
          category: validCategory,
          tags: validTags, // Ensure tags is always an array (Supabase will convert to JSONB)
          created_by: user.id,
          bakeshop_id: currentBakeshopInfo.id
        })
        .select()
        .single()

      if (recipeError) {
        // Rollback optimistic update
        setRecipes(prev => (Array.isArray(prev) ? prev.filter(r => r.id !== tempId) : []))
        console.error('Recipe insert error:', recipeError)
        console.error('Recipe data being inserted:', {
          name: recipeData.name,
          yield_amount: recipeData.yield,
          yield_unit: recipeData.yieldUnit,
          category: validCategory,
          tags: validTags,
          instructions_count: instructionsArray.length,
          ingredients_count: recipeData.ingredients.length
        })
        const errorMessage = recipeError.message || 'Failed to create recipe'
        throw new Error(errorMessage)
      }

      // Insert ingredients into recipe_ingredients table
      if (recipeData.ingredients.length > 0) {
        const ingredientsData = recipeData.ingredients.map(ingredient => ({
          recipe_id: recipe.id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        }))

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData)

        if (ingredientsError) {
          // Rollback recipe creation
          await supabase.from('recipes').delete().eq('id', recipe.id)
          setRecipes(prev => (Array.isArray(prev) ? prev.filter(r => r.id !== tempId) : []))
          throw ingredientsError
        }
      }

      // Replace optimistic update with real data
      await loadRecipes()
      toast.success("Recipe created successfully")
    } catch (error) {
      // Ensure optimistic update is rolled back
      setRecipes(prev => (Array.isArray(prev) ? prev.filter(r => r.id !== tempId) : []))
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' ? error : "Failed to create recipe")
      console.error('Recipe creation failed:', error)
      toast.error(errorMessage)
      throw error
    }
  }

  const updateRecipe = async (id: string, recipeData: Partial<Recipe>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'editRecipe')) {
      throw new Error('You do not have permission to edit recipes')
    }
    
    // Convert instructions string to array format if provided
    const updateData: any = {
      name: recipeData.name,
      yield_amount: recipeData.yield,
      yield_unit: recipeData.yieldUnit
    }
    
    // Include price if provided
    if (recipeData.price !== undefined) {
      updateData.price = recipeData.price || null
    }
    
    // Include category if provided
    if (recipeData.category !== undefined) {
      updateData.category = recipeData.category
    }
    
    // Include tags if provided - ensure it's a valid array
    if (recipeData.tags !== undefined) {
      updateData.tags = Array.isArray(recipeData.tags) 
        ? recipeData.tags.filter(tag => tag && typeof tag === 'string' && tag.trim() !== '')
        : []
    }
    
    if (recipeData.instructions) {
      // If instructions is a string, convert to array
      if (typeof recipeData.instructions === 'string') {
        updateData.instructions = recipeData.instructions
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .map(line => line.replace(/^\d+\.\s*/, ''))
      } else {
        updateData.instructions = recipeData.instructions
      }
    }
    
    const { error } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    // Update ingredients if provided
    if (recipeData.ingredients) {
      // Delete existing ingredients
      await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id)

      // Insert new ingredients
      if (recipeData.ingredients.length > 0) {
        const ingredientsData = recipeData.ingredients.map(ingredient => ({
          recipe_id: id,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit
        }))

        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData)

        if (ingredientsError) throw ingredientsError
      }
    }

    await loadRecipes()
  }

  const deleteRecipe = async (id: string, deleteProductionLogs: boolean = false) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'deleteRecipe')) {
      throw new Error('You do not have permission to delete recipes')
    }
    
    try {
      // Step 1: Check if recipe is used in production logs
      const { data: productionLogs, error: logsCheckError } = await supabase
        .from('production_logs')
        .select('id')
        .eq('recipe_id', id)
      
      if (logsCheckError) {
        console.error('Error checking production logs:', logsCheckError)
        // Continue anyway - might be a permission issue
      }
      
      const hasProductionLogs = productionLogs && productionLogs.length > 0
      
      if (hasProductionLogs && !deleteProductionLogs) {
        // Recipe is used in production logs - cannot delete without user confirmation
        const errorMessage = 'Cannot delete recipe: It is being used in production logs. Please delete the production logs first or confirm deletion of both.'
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
      
      // Step 2: Delete production logs first if they exist and user confirmed
      if (hasProductionLogs && deleteProductionLogs) {
        console.log(`Deleting ${productionLogs.length} production log(s) for recipe:`, id)
        
        const { error: logsDeleteError, data: deletedLogs } = await supabase
          .from('production_logs')
          .delete()
          .eq('recipe_id', id)
          .select()
        
        if (logsDeleteError) {
          console.error('Error deleting production logs:', logsDeleteError)
          const errorMessage = `Failed to delete production logs: ${logsDeleteError.message}`
          toast.error(errorMessage)
          throw new Error(errorMessage)
        }
        
        console.log(`Successfully deleted ${deletedLogs?.length || productionLogs.length} production log(s)`)
        
        // Verify deletion - check again to ensure all logs are gone
        await new Promise(resolve => setTimeout(resolve, 300)) // Small delay for DB consistency
        
        const { data: remainingLogs, error: verifyError } = await supabase
          .from('production_logs')
          .select('id')
          .eq('recipe_id', id)
        
        if (verifyError) {
          console.warn('Error verifying production logs deletion:', verifyError)
          // Continue anyway
        } else if (remainingLogs && remainingLogs.length > 0) {
          console.warn(`Warning: ${remainingLogs.length} production log(s) still exist after deletion attempt`)
          // Try deleting again
          const { error: retryError } = await supabase
            .from('production_logs')
            .delete()
            .eq('recipe_id', id)
          
          if (retryError) {
            console.error('Error retrying production logs deletion:', retryError)
            const errorMessage = `Failed to delete all production logs: ${retryError.message}`
            toast.error(errorMessage)
            throw new Error(errorMessage)
          }
        }
        
        // Reload production logs to update UI
        await loadProductionLogs()
      }
      
      // Step 3: Delete related recipe_ingredients (cascade delete)
      const { error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', id)
      
      if (ingredientsError) {
        console.error('Error deleting recipe ingredients:', ingredientsError)
        // Continue anyway - ingredients might not exist or might be handled by cascade
      }
      
      // Step 4: Final check - verify no production logs remain before deleting recipe
      if (deleteProductionLogs) {
        const { data: finalCheckLogs, error: finalCheckError } = await supabase
          .from('production_logs')
          .select('id')
          .eq('recipe_id', id)
          .limit(1)
        
        if (!finalCheckError && finalCheckLogs && finalCheckLogs.length > 0) {
          const errorMessage = 'Cannot delete recipe: Production logs still exist. Please try again or contact support.'
          console.error(errorMessage)
          toast.error(errorMessage)
          throw new Error(errorMessage)
        }
      }
      
      // Step 5: Delete the recipe
      // Add a small delay to ensure all previous deletions are committed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const { error, data } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error deleting recipe:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', JSON.stringify(error, null, 2))
        
        // Check if recipe still exists (might have been deleted by another process)
        const { data: recipeCheck } = await supabase
          .from('recipes')
          .select('id')
          .eq('id', id)
          .single()
        
        if (!recipeCheck) {
          // Recipe was already deleted, consider it success
          console.log('Recipe was already deleted, considering deletion successful')
          await loadRecipes()
          toast.success("Recipe deleted successfully")
          return
        }
        
        // Provide more specific error messages
        let errorMessage = "Failed to delete recipe"
        if (error.code === '23503') {
          // Foreign key constraint violation - check what's still referencing it
          const { data: remainingLogs } = await supabase
            .from('production_logs')
            .select('id')
            .eq('recipe_id', id)
            .limit(1)
          
          if (remainingLogs && remainingLogs.length > 0) {
            errorMessage = `Cannot delete recipe: ${remainingLogs.length} production log(s) still reference this recipe. The deletion may have failed. Please try again.`
          } else {
            errorMessage = "Cannot delete recipe: It is still being referenced by other records. This may be due to database constraints. Please contact support if the issue persists."
          }
        } else if (error.code === '42501') {
          errorMessage = "Permission denied: You do not have permission to delete this recipe."
        } else if (error.code === '23505') {
          errorMessage = "Cannot delete recipe: Duplicate key violation."
        } else if (error.message) {
          errorMessage = `Failed to delete recipe: ${error.message}`
        }
        
        toast.error(errorMessage)
        throw new Error(errorMessage)
      }
      
      // Verify deletion succeeded
      if (!data || data.length === 0) {
        // Check if recipe still exists
        const { data: recipeCheck } = await supabase
          .from('recipes')
          .select('id')
          .eq('id', id)
          .single()
        
        if (recipeCheck) {
          const errorMessage = "Recipe deletion appeared to succeed but recipe still exists. Please try again."
          console.error(errorMessage)
          toast.error(errorMessage)
          throw new Error(errorMessage)
        }
      }
      
      // Step 5: Reload recipes to update UI
      await loadRecipes()
      
      // Show success message
      if (hasProductionLogs && deleteProductionLogs) {
        toast.success(`Recipe and ${productionLogs.length} production log(s) deleted successfully`)
      } else {
        toast.success("Recipe deleted successfully")
      }
    } catch (error) {
      // Re-throw to let caller handle it, but ensure toast is shown
      if (error instanceof Error && !error.message.includes('Cannot delete recipe')) {
        toast.error(error.message || "Failed to delete recipe")
      }
      throw error
    }
  }
  
  // Helper function to check if recipe has production logs
  const checkRecipeHasProductionLogs = async (recipeId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .select('id')
        .eq('recipe_id', recipeId)
        .limit(1)
      
      if (error) {
        console.error('Error checking production logs:', error)
        return false
      }
      
      return (data && data.length > 0) || false
    } catch (error) {
      console.error('Error checking production logs:', error)
      return false
    }
  }

  // Inventory operations
  const loadInventory = async () => {
    if (!user || !dataLoader) {
      // Set empty array if user or dataLoader is not available to prevent infinite loading
      setInventory([])
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.inventory.current) {
      return
    }
    
    try {
      loadingRefs.inventory.current = true
      const result = await dataLoader.loadInventory()
      // loadInventory returns DataLoadingResult with a data property
      let inventoryData = result?.data || []
      
      // Role-based filtering: Bakers can only see raw materials
      if (user.role === 'baker') {
        inventoryData = inventoryData.filter((item: InventoryItem) => item.type === 'raw')
      }
      
      // Ensure it's always an array
      setInventory(Array.isArray(inventoryData) ? inventoryData : [])
      loadedDataTypes.current.add('inventory')
    } catch (error) {
      console.error('Error loading inventory:', error)
      // On error, ensure inventory is still an array
      setInventory([])
      loadedDataTypes.current.add('inventory')
      throw error
    } finally {
      loadingRefs.inventory.current = false
    }
  }

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'addInventory')) {
      throw new Error('You do not have permission to add inventory items')
    }
    
    // Ensure bakeshopInfo is loaded
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Check if an item with the same name and type already exists
    // Use exact name matching to prevent duplicates
    const existingItem = findInventoryItemByExactName(itemData.name, itemData.type)
    
    if (existingItem) {
      // Item already exists - update quantity instead of creating duplicate
      const newQuantity = existingItem.quantity + itemData.quantity
      await updateInventoryItem(existingItem.id, {
        quantity: newQuantity
      })
      toast.success(`${itemData.name} quantity updated: ${existingItem.quantity} + ${itemData.quantity} = ${newQuantity}`)
      return
    }
    
    // No existing item found - create new one
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticItem: InventoryItem = {
      id: tempId,
      ...itemData,
      lastUpdated: new Date()
    }
    setInventory(prev => [...(Array.isArray(prev) ? prev : []), optimisticItem])
    
    try {
      // Convert type from frontend format to database format
      // Frontend: 'raw' | 'finished'
      // Database: 'raw_material' | 'finished_good'
      const dbType = itemData.type === 'raw' ? 'raw_material' : 'finished_good'
      
      const insertData: any = {
        name: itemData.name,
        type: dbType,
        quantity: itemData.quantity,
        unit: itemData.unit,
        min_stock: itemData.minStock,
        bakeshop_id: currentBakeshopInfo.id
      }
      
      // Only include optional fields if they're provided
      // expiration_date exists in the schema
      if (itemData.expirationDate) {
        insertData.expiration_date = itemData.expirationDate.toISOString().split('T')[0]
      }
      
      // price column might not exist in older databases
      if (itemData.price !== undefined && itemData.price !== null) {
        insertData.price = itemData.price
      }
      
      // delivery_date column does NOT exist in the schema - don't include it
      // Note: delivery_date is not part of the inventory table schema
      
      console.log('Inserting inventory item:', insertData)
      
      const { data: insertedData, error } = await supabase
        .from('inventory')
        .insert(insertData)
        .select()

      if (error) {
        // Rollback optimistic update
        setInventory(prev => (Array.isArray(prev) ? prev.filter(item => item.id !== tempId) : []))
        
        // Check if error is due to missing columns (price, delivery_date, etc.)
        if (error.message?.includes('price') || error.message?.includes('delivery_date') || error.message?.includes('schema cache')) {
          // Try again without optional columns that might not exist
          console.warn('Some columns not found in inventory table, retrying without them...')
          delete insertData.price
          delete insertData.delivery_date // This column doesn't exist in the schema
          
          const { error: fallbackError } = await supabase
            .from('inventory')
            .insert(insertData)
            .select()
          
          if (fallbackError) {
            console.error('Inventory insert error details:', {
              code: fallbackError.code,
              message: fallbackError.message,
              details: fallbackError.details,
              hint: fallbackError.hint
            })
            throw new Error(`Failed to add inventory item: ${fallbackError.message}. Please check the database schema.`)
          }
        } else {
          // Log detailed error information
          console.error('Inventory insert error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            insertData
          })
          
          // Provide more helpful error messages
          if (error.code === '23503') {
            throw new Error(`Failed to add inventory item: Invalid bakeshop reference. Please ensure you're logged in correctly.`)
          } else if (error.code === '23505') {
            throw new Error(`Failed to add inventory item: An item with this name already exists.`)
          } else if (error.code === '23514') {
            throw new Error(`Failed to add inventory item: Invalid data. Please check quantity and other values.`)
          } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
            throw new Error(`Failed to add inventory item: Permission denied. Please check your role and bakeshop membership.`)
          } else {
            throw new Error(`Failed to add inventory item: ${error.message || 'Unknown error'}. Error code: ${error.code || 'N/A'}`)
          }
        }
      }
      
      // Log successful insert
      if (insertedData && insertedData.length > 0) {
        console.log('Successfully inserted inventory item:', insertedData[0])
      }
      
      // Sync product stock if this is a finished goods item
      if (itemData.type === "finished") {
        await syncProductStockWithInventory(itemData.name, itemData.quantity)
      }
      
      // Replace optimistic update with real data
      await loadInventory()
      toast.success("Inventory item added successfully")
    } catch (error) {
      // Ensure optimistic update is rolled back
      setInventory(prev => (Array.isArray(prev) ? prev.filter(item => item.id !== tempId) : []))
      toast.error(error instanceof Error ? error.message : "Failed to add inventory item")
      throw error
    }
  }

  const updateInventoryItem = async (id: string, itemData: Partial<InventoryItem>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'editInventory')) {
      throw new Error('You do not have permission to edit inventory items')
    }
    
    // Get the current inventory item to check if it's finished goods
    const currentItem = inventory.find(item => item.id === id)
    const isFinishedGoods = currentItem?.type === "finished" || itemData.type === "finished"
    const itemName = itemData.name || currentItem?.name || ""
    const newQuantity = itemData.quantity !== undefined ? itemData.quantity : currentItem?.quantity || 0
    
    // Convert type from frontend format to database format if type is being updated
    const updateData: any = {}
    if (itemData.name !== undefined) updateData.name = itemData.name
    if (itemData.type !== undefined) {
      updateData.type = itemData.type === 'raw' ? 'raw_material' : 'finished_good'
    }
    if (itemData.quantity !== undefined) updateData.quantity = itemData.quantity
    if (itemData.unit !== undefined) updateData.unit = itemData.unit
    if (itemData.minStock !== undefined) updateData.min_stock = itemData.minStock
    if (itemData.expirationDate !== undefined) {
      updateData.expiration_date = itemData.expirationDate ? itemData.expirationDate.toISOString().split('T')[0] : null
    }
    // Note: delivery_date column does NOT exist in the inventory table schema
    // Do not include it in updates
    
    // Only update price if it's provided (for finished goods)
    // The column might not exist in older databases
    if (itemData.price !== undefined) {
      updateData.price = itemData.price
    }
    
    const { error } = await supabase
      .from('inventory')
      .update(updateData)
      .eq('id', id)

    if (error) {
      // Check if error is due to missing columns (price, delivery_date, etc.)
      if (error.message?.includes('price') || error.message?.includes('delivery_date') || error.message?.includes('schema cache')) {
        // Try again without optional columns that might not exist
        console.warn('Some columns not found in inventory table, retrying without them...')
        delete updateData.price
        delete updateData.delivery_date // This column doesn't exist in the schema
        
        const { error: fallbackError } = await supabase
          .from('inventory')
          .update(updateData)
          .eq('id', id)
        
        if (fallbackError) {
          console.error('Inventory update error details:', {
            code: fallbackError.code,
            message: fallbackError.message,
            details: fallbackError.details,
            hint: fallbackError.hint
          })
          toast.error("Failed to update inventory item")
          throw new Error(`Failed to update inventory item: ${fallbackError.message}. Please check the database schema.`)
        }
      } else {
        console.error('Inventory update error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        toast.error("Failed to update inventory item")
        throw error
      }
    }
    
    // Auto-delete if quantity reaches 0
    if (itemData.quantity !== undefined && itemData.quantity <= 0) {
      // Check if user has permission to delete
      if (hasPermission(user.role, 'deleteInventory')) {
        const { error: deleteError } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id)

        if (deleteError) {
          toast.error("Failed to delete inventory item with zero quantity")
          throw deleteError
        }
        await loadInventory()
        toast.success("Inventory item deleted (quantity reached 0)")
        return
      }
    }
    
    // Sync product stock if this is a finished goods item and quantity was updated
    if (isFinishedGoods && itemData.quantity !== undefined && itemName) {
      await syncProductStockWithInventory(itemName, newQuantity)
    }
    
    await loadInventory()
    toast.success("Inventory item updated successfully")
  }

  const deleteInventoryItem = async (id: string) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'deleteInventory')) {
      throw new Error('You do not have permission to delete inventory items')
    }
    
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error("Failed to delete inventory item")
      throw error
    }
    await loadInventory()
    toast.success("Inventory item deleted successfully")
  }

  const bulkUpdateInventory = async (updates: Array<{ id: string; quantity: number }>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'editInventory')) {
      throw new Error('You do not have permission to edit inventory items')
    }
    
    const itemsToDelete: string[] = []
    
    for (const update of updates) {
      // Auto-delete if quantity reaches 0
      if (update.quantity <= 0) {
        // Check if user has permission to delete
        if (hasPermission(user.role, 'deleteInventory')) {
          itemsToDelete.push(update.id)
          continue
        }
      }
      
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: update.quantity })
        .eq('id', update.id)

      if (error) throw error
      
      // Sync product stock if this is a finished goods item
      const currentItem = inventory.find(item => item.id === update.id)
      if (currentItem?.type === "finished") {
        await syncProductStockWithInventory(currentItem.name, update.quantity)
      }
    }
    
    // Delete items with zero quantity
    if (itemsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .in('id', itemsToDelete)

      if (deleteError) {
        toast.error("Failed to delete some inventory items with zero quantity")
        throw deleteError
      }
    }
    
    await loadInventory()
    
    if (itemsToDelete.length > 0) {
      toast.success(`Updated inventory. ${itemsToDelete.length} item(s) deleted (quantity reached 0)`)
    } else {
      toast.success("Inventory updated successfully")
    }
  }

  // Supplier operations
  const loadSuppliers = async () => {
    if (!user || !dataLoader) return
    
    // Role-based filtering: Only owners can see suppliers
    if (user.role !== 'owner') {
      setSuppliers([])
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.suppliers.current) {
      return
    }
    
    try {
      loadingRefs.suppliers.current = true
      const result = await dataLoader.loadSuppliers()
      setSuppliers(Array.isArray(result.data) ? result.data : [])
      loadedDataTypes.current.add('suppliers')
    } catch (error) {
      console.error('Error loading suppliers:', error)
      loadedDataTypes.current.add('suppliers')
      throw error
    } finally {
      loadingRefs.suppliers.current = false
    }
  }

  const addSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'addSupplier')) {
      throw new Error('You do not have permission to add suppliers')
    }
    
    // Optimized: Ensure bakeshopInfo is loaded before creating supplier
    // Use cached value if available, otherwise fetch once
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticSupplier: Supplier = {
      id: tempId,
      ...supplierData,
      createdAt: new Date()
    }
    setSuppliers(prev => [...(Array.isArray(prev) ? prev : []), optimisticSupplier])
    
    try {
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert({
          bakeshop_id: currentBakeshopInfo.id,
          name: supplierData.name,
          contact_person: supplierData.contactPerson,
          email: supplierData.email,
          phone: supplierData.phone,
          address: supplierData.address,
          products: supplierData.products
        })
        .select()
        .single()

      if (error) {
        // Rollback optimistic update
        setSuppliers(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
        throw error
      }
      
      // Optimized: Update state directly with the new supplier instead of reloading all suppliers
      // This avoids a full database query and improves performance
      if (newSupplier) {
        const formattedSupplier: Supplier = {
          id: newSupplier.id,
          name: newSupplier.name,
          contactPerson: newSupplier.contact_person,
          email: newSupplier.email,
          phone: newSupplier.phone || '',
          address: newSupplier.address || '',
          products: newSupplier.products || [],
          createdAt: newSupplier.created_at ? new Date(newSupplier.created_at) : new Date()
        }
        
        setSuppliers(prev => {
          const filtered = Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []
          return [...filtered, formattedSupplier]
        })
      }
      
      toast.success("Supplier added successfully")
    } catch (error) {
      // Ensure optimistic update is rolled back
      setSuppliers(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
      toast.error(error instanceof Error ? error.message : "Failed to add supplier")
      throw error
    }
  }

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'editSupplier')) {
      throw new Error('You do not have permission to edit suppliers')
    }
    
    const { error } = await supabase
      .from('suppliers')
      .update({
        name: supplierData.name,
        contact_person: supplierData.contactPerson,
        email: supplierData.email,
        phone: supplierData.phone,
        address: supplierData.address,
        products: supplierData.products
      })
      .eq('id', id)

    if (error) throw error
    await loadSuppliers()
  }

  const deleteSupplier = async (id: string) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'deleteSupplier')) {
      throw new Error('You do not have permission to delete suppliers')
    }
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) throw error
    await loadSuppliers()
  }

  // Purchase Order operations
  const loadPurchaseOrders = async () => {
    if (!user || !dataLoader) return
    
    // Role-based filtering: Only owners can see purchase orders
    if (user.role !== 'owner') {
      setPurchaseOrders([])
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.purchaseOrders.current) {
      return
    }
    
    try {
      loadingRefs.purchaseOrders.current = true
      // Optimized: Use JOIN to fetch supplier names in a single query instead of N+1 queries
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (
            id,
            name
          )
        `)
        .eq('bakeshop_id', bakeshopInfo?.id || '')
        .order('created_at', { ascending: false })
      
      if (error) {
        // Fallback: If JOIN fails, use optimized two-query approach
        console.warn('JOIN query failed, falling back to optimized two-query approach:', error)
        const { data: ordersData, error: ordersError } = await supabase
          .from('purchase_orders')
          .select('*')
          .eq('bakeshop_id', bakeshopInfo?.id || '')
          .order('created_at', { ascending: false })
        
        if (ordersError) throw ordersError
        
        // Fetch all unique supplier IDs and get their names in one query
        const supplierIds = [...new Set(ordersData?.map((o: any) => o.supplier_id).filter(Boolean) || [])]
        const supplierMap = new Map()
        
        if (supplierIds.length > 0) {
          const { data: suppliersData } = await supabase
            .from('suppliers')
            .select('id, name')
            .in('id', supplierIds)
          
          suppliersData?.forEach((s: any) => {
            supplierMap.set(s.id, s.name)
          })
        }
        
        const formattedOrders = ordersData?.map((order: any) => ({
          ...order,
          id: order.id,
          orderNumber: order.order_number,
          supplierId: order.supplier_id,
          supplierName: supplierMap.get(order.supplier_id) || 'Unknown Supplier',
          items: Array.isArray(order.items) ? order.items : (order.items ? [order.items] : []),
          totalAmount: parseFloat(order.total_amount) || 0,
          status: order.status,
          orderDate: order.order_date ? new Date(order.order_date) : new Date(),
          expectedDeliveryDate: order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined,
          receivedDate: order.received_date ? new Date(order.received_date) : undefined,
          actualDeliveryDate: order.received_date ? new Date(order.received_date) : undefined,
          notes: order.notes || undefined,
          createdAt: order.created_at ? new Date(order.created_at) : new Date(),
          updatedAt: order.updated_at ? new Date(order.updated_at) : new Date()
        })) || []
        
        setPurchaseOrders(formattedOrders)
        return
      }
      
      const formattedOrders = data?.map((order: any) => ({
        ...order,
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplierName: (order.suppliers && Array.isArray(order.suppliers) ? order.suppliers[0]?.name : order.suppliers?.name) || 'Unknown Supplier',
        items: Array.isArray(order.items) ? order.items : (order.items ? [order.items] : []),
        totalAmount: parseFloat(order.total_amount) || 0,
        status: order.status,
        orderDate: order.order_date ? new Date(order.order_date) : new Date(),
        expectedDeliveryDate: order.expected_delivery_date ? new Date(order.expected_delivery_date) : undefined,
        receivedDate: order.received_date ? new Date(order.received_date) : undefined,
        actualDeliveryDate: order.received_date ? new Date(order.received_date) : undefined,
        notes: order.notes || undefined,
        createdAt: order.created_at ? new Date(order.created_at) : new Date(),
        updatedAt: order.updated_at ? new Date(order.updated_at) : new Date()
      })) || []
      
      setPurchaseOrders(formattedOrders)
      loadedDataTypes.current.add('purchaseOrders')
    } catch (error) {
      console.error('Error loading purchase orders:', error)
      loadedDataTypes.current.add('purchaseOrders')
      throw error
    } finally {
      loadingRefs.purchaseOrders.current = false
    }
  }

  const addPurchaseOrder = async (orderData: Omit<PurchaseOrder, 'id'>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'createPurchaseOrder')) {
      throw new Error('You do not have permission to create purchase orders')
    }
    
    // Optimized: Ensure bakeshopInfo is loaded before creating purchase order
    // Use cached value if available, otherwise fetch once
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticOrder: PurchaseOrder = {
      id: tempId,
      ...orderData
    }
    setPurchaseOrders(prev => [...(Array.isArray(prev) ? prev : []), optimisticOrder])
    
    try {
      // Validate required fields
      if (!orderData.orderNumber || !orderData.orderNumber.trim()) {
        throw new Error('Order number is required')
      }
      if (!orderData.supplierId || !orderData.supplierId.trim()) {
        throw new Error('Supplier is required')
      }
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('At least one item is required')
      }
      if (!orderData.totalAmount || orderData.totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero')
      }
      
      // Map status: 'draft' -> 'pending' (schema only allows: 'pending', 'ordered', 'received', 'cancelled')
      const dbStatus = orderData.status === 'draft' ? 'pending' : orderData.status
      
      // Format items for JSONB storage
      const itemsJson = orderData.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
      
      // Convert date to DATE format (not ISO string with time)
      const orderDate = orderData.orderDate instanceof Date 
        ? orderData.orderDate.toISOString().split('T')[0] 
        : new Date(orderData.orderDate).toISOString().split('T')[0]
      
      const expectedDeliveryDate = orderData.expectedDeliveryDate instanceof Date
        ? orderData.expectedDeliveryDate.toISOString().split('T')[0]
        : orderData.expectedDeliveryDate 
          ? new Date(orderData.expectedDeliveryDate).toISOString().split('T')[0]
          : null
      
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          bakeshop_id: currentBakeshopInfo.id,
          order_number: orderData.orderNumber,
          supplier_id: orderData.supplierId,
          items: itemsJson, // Store items as JSONB
          total_amount: orderData.totalAmount,
          status: dbStatus,
          order_date: orderDate,
          expected_delivery_date: expectedDeliveryDate,
          // notes field removed - column doesn't exist in database schema
          // notes can be stored in items JSON if needed
          created_by: user.id
        })
        .select()
        .single()

      if (orderError) {
        // Rollback optimistic update
        setPurchaseOrders(prev => (Array.isArray(prev) ? prev.filter(po => po.id !== tempId) : []))
        console.error('Purchase order creation error:', orderError)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to create purchase order'
        if (orderError.code === '23503') {
          errorMessage = 'Invalid supplier. Please select a valid supplier.'
        } else if (orderError.code === '23505') {
          errorMessage = 'Order number already exists. Please try again.'
        } else if (orderError.code === '23502') {
          errorMessage = 'Missing required field. Please check all fields are filled.'
        } else if (orderError.message) {
          errorMessage = `Failed to create purchase order: ${orderError.message}`
        }
        
        throw new Error(errorMessage)
      }

      // Also insert items into normalized table for easier querying
      if (orderData.items.length > 0 && order?.id) {
        const itemsData = orderData.items.map(item => ({
          purchase_order_id: order.id,
          item_name: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }))

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsData)

        if (itemsError) {
          console.warn('Warning: Failed to insert into purchase_order_items (non-critical):', itemsError)
          // Don't rollback - items are already in JSONB field
        }
      }

      // Optimized: Update state directly with the new order instead of reloading all orders
      // This avoids a full database query and improves performance
      const newOrder: PurchaseOrder = {
        id: order.id,
        orderNumber: order.order_number,
        supplierId: order.supplier_id,
        supplierName: orderData.supplierName, // We already have this from the form
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: orderData.status,
        orderDate: orderData.orderDate,
        expectedDeliveryDate: orderData.expectedDeliveryDate,
        notes: orderData.notes,
      }
      
      // Replace optimistic update with real data
      setPurchaseOrders(prev => {
        const filtered = Array.isArray(prev) ? prev.filter(po => po.id !== tempId) : []
        return [newOrder, ...filtered]
      })
      
      toast.success("Purchase order created successfully")
    } catch (error) {
      // Ensure optimistic update is rolled back
      setPurchaseOrders(prev => (Array.isArray(prev) ? prev.filter(po => po.id !== tempId) : []))
      const errorMessage = error instanceof Error ? error.message : "Failed to create purchase order"
      console.error('Purchase order creation failed:', error)
      toast.error(errorMessage)
      throw error
    }
  }

  const updatePurchaseOrder = async (id: string, orderData: Partial<PurchaseOrder>) => {
    const updateFields: any = {}
    
    if (orderData.orderNumber) updateFields.order_number = orderData.orderNumber
    if (orderData.supplierId) updateFields.supplier_id = orderData.supplierId
    if (orderData.totalAmount !== undefined) updateFields.total_amount = orderData.totalAmount
    if (orderData.status) {
      // Map status: 'draft' -> 'pending'
      updateFields.status = orderData.status === 'draft' ? 'pending' : orderData.status
    }
    if (orderData.orderDate) {
      updateFields.order_date = orderData.orderDate instanceof Date 
        ? orderData.orderDate.toISOString().split('T')[0]
        : new Date(orderData.orderDate).toISOString().split('T')[0]
    }
    if (orderData.expectedDeliveryDate) {
      updateFields.expected_delivery_date = orderData.expectedDeliveryDate instanceof Date
        ? orderData.expectedDeliveryDate.toISOString().split('T')[0]
        : new Date(orderData.expectedDeliveryDate).toISOString().split('T')[0]
    }
    if (orderData.actualDeliveryDate) {
      updateFields.received_date = orderData.actualDeliveryDate instanceof Date
        ? orderData.actualDeliveryDate.toISOString().split('T')[0]
        : new Date(orderData.actualDeliveryDate).toISOString().split('T')[0]
    }
    if (orderData.items) {
      updateFields.items = orderData.items.map(item => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    }
    
    const { error } = await supabase
      .from('purchase_orders')
      .update(updateFields)
      .eq('id', id)

    if (error) throw error

    // Update items if provided
    if (orderData.items) {
      // Delete existing items
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id)

      // Insert new items
      if (orderData.items.length > 0) {
        const itemsData = orderData.items.map(item => ({
          purchase_order_id: id,
          item_name: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unitPrice,
          total_price: item.totalPrice
        }))

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsData)

        if (itemsError) throw itemsError
      }
    }

    await loadPurchaseOrders()
  }

  const deletePurchaseOrder = async (id: string) => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id)

    if (error) throw error
    await loadPurchaseOrders()
  }

  // Product operations
  const loadProducts = async () => {
    if (!user) {
      console.warn('⚠️ Cannot load products: user not available')
      // Don't clear products if user is not available - might be temporary
      return
    }
    
    if (!dataLoader) {
      console.warn('⚠️ Cannot load products: dataLoader not available')
      // Don't clear products if dataLoader is not available - might be temporary
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.products.current) {
      console.log('⏸️ Products already loading, skipping...')
      return
    }
    
    try {
      loadingRefs.products.current = true
      console.log('📥 Loading products from database...')
      const result = await dataLoader.loadProducts()
      // loadProducts returns DataLoadingResult with a data property
      const productsData = result?.data || []
      // Ensure it's always an array
      const formattedProducts = Array.isArray(productsData) ? productsData : []
      console.log(`✅ Loaded ${formattedProducts.length} products from database`)
      if (formattedProducts.length > 0) {
        console.log('   Products:', formattedProducts.map((p: any) => p.name).join(', '))
      } else {
        console.warn('⚠️ No products loaded from database')
      }
      // CRITICAL: Always update state to trigger re-render
      // Use functional update to ensure we're working with latest state
      setProducts(prev => {
        // Only update if data actually changed to prevent unnecessary re-renders
        const prevString = JSON.stringify(prev.map(p => ({ id: p.id, name: p.name, inStock: p.inStock })))
        const newString = JSON.stringify(formattedProducts.map(p => ({ id: p.id, name: p.name, inStock: p.inStock })))
        if (prevString !== newString) {
          return formattedProducts
        }
        return prev // Return same reference if unchanged to prevent re-render
      })
      loadedDataTypes.current.add('products')
    } catch (error) {
      console.error('❌ Error loading products:', error)
      // On error, DON'T clear products - keep existing products
      // Only clear if we're sure there's a critical error
      console.warn('⚠️ Keeping existing products despite load error')
      loadedDataTypes.current.add('products')
      throw error
    } finally {
      loadingRefs.products.current = false
    }
  }

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Ensure bakeshopInfo is loaded before creating product
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticProduct: Product = {
      id: tempId,
      ...productData
    }
    setProducts(prev => [...(Array.isArray(prev) ? prev : []), optimisticProduct])
    
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          bakeshop_id: currentBakeshopInfo.id,
          name: productData.name,
          price: productData.price,
          category: productData.category,
          image_url: productData.imageUrl,
          in_stock: productData.inStock
        })

      if (error) {
        // Rollback optimistic update
        setProducts(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== tempId) : []))
        throw error
      }
      
      // Replace optimistic update with real data
      await loadProducts()
    } catch (error) {
      // Ensure optimistic update is rolled back
      setProducts(prev => (Array.isArray(prev) ? prev.filter(p => p.id !== tempId) : []))
      throw error
    }
  }

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: productData.name,
        price: productData.price,
        category: productData.category,
        image_url: productData.imageUrl,
        in_stock: productData.inStock
      })
      .eq('id', id)

    if (error) throw error
    await loadProducts()
  }

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    await loadProducts()
  }

  // Helper function to find inventory item by name (case-insensitive, partial matching)
  const findInventoryItemByName = (name: string, type?: "raw" | "finished"): InventoryItem | null => {
    const searchName = name.toLowerCase().trim()
    return inventory.find(item => {
      const itemName = item.name.toLowerCase().trim()
      const nameMatch = itemName === searchName || 
                       itemName.includes(searchName) || 
                       searchName.includes(itemName)
      const typeMatch = type ? item.type === type : true
      return nameMatch && typeMatch
    }) || null
  }
  
  // Helper function to find inventory item by exact name match (for duplicate prevention)
  const findInventoryItemByExactName = (name: string, type?: "raw" | "finished"): InventoryItem | null => {
    const searchName = name.toLowerCase().trim()
    return inventory.find(item => {
      const itemName = item.name.toLowerCase().trim()
      const nameMatch = itemName === searchName // Exact match only
      const typeMatch = type ? item.type === type : true
      return nameMatch && typeMatch
    }) || null
  }

  // Helper function to sync product stock with finished goods inventory
  const syncProductStockWithInventory = async (inventoryItemName: string, inventoryQuantity: number) => {
    try {
      // Use EXACT name matching only (case-insensitive) to prevent syncing wrong products
      const normalizedInventoryName = inventoryItemName.toLowerCase().trim()
      const matchingProduct = products.find(p => {
        const productName = p.name.toLowerCase().trim()
        return productName === normalizedInventoryName
      })
      
      if (matchingProduct) {
        // Only update if stock differs to avoid unnecessary updates
        if (matchingProduct.inStock !== inventoryQuantity) {
          await updateProduct(matchingProduct.id, {
            inStock: inventoryQuantity
          })
          console.log(`Synced product stock for ${matchingProduct.name}: ${matchingProduct.inStock} -> ${inventoryQuantity}`)
        }
      } else {
        console.warn(`No matching product found for inventory item "${inventoryItemName}"`)
      }
    } catch (error) {
      // Don't fail inventory update if product sync fails
      console.error(`Error syncing product stock for ${inventoryItemName}:`, error)
    }
  }

  // Production Log operations
  const loadProductionLogs = async () => {
    if (!user || !dataLoader) {
      setProductionLogs([])
      return
    }
    
    // Role-based filtering: Cashiers cannot see production logs
    if (user.role === 'cashier') {
      setProductionLogs([])
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.productionLogs.current) {
      return
    }
    
    try {
      loadingRefs.productionLogs.current = true
      const result = await dataLoader.loadProductionLogs()
      const logsData = result?.data || []
      
      // Format the logs to match ProductionLog interface
      const formattedLogs = logsData.map((log: any) => ({
        id: log.id,
        recipeId: log.recipe_id,
        recipeName: log.recipe_name || log.recipes?.name || 'Unknown Recipe',
        quantityProduced: Number(log.quantity_produced),
        productionDate: log.productionDate || new Date(log.production_date),
        bakerName: log.baker_name || log.profiles?.name || user.name || 'Unknown Baker'
      }))
      
      setProductionLogs(Array.isArray(formattedLogs) ? formattedLogs : [])
      loadedDataTypes.current.add('productionLogs')
    } catch (error) {
      console.error('Error loading production logs:', error)
      setProductionLogs([])
      loadedDataTypes.current.add('productionLogs')
      throw error
    } finally {
      loadingRefs.productionLogs.current = false
    }
  }

  const addProductionLog = async (logData: {
    recipeId: string
    recipeName: string
    batchNumber?: string
    quantityProduced: number
    productionDate: Date
    notes?: string
    qualityRating?: number
  }) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'createProductionLog')) {
      throw new Error('You do not have permission to log production')
    }
    
    // Ensure bakeshopInfo is loaded before creating production log
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Format production date to YYYY-MM-DD for DATE column
    const productionDateStr = logData.productionDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('production_logs')
      .insert({
        bakeshop_id: currentBakeshopInfo.id,
        recipe_id: logData.recipeId,
        quantity_produced: logData.quantityProduced,
        production_date: productionDateStr,
        baker_id: user.id,
        notes: logData.notes
      })
      .select()
      .single()

    if (error) {
      console.error('Production log insert error:', error)
      throw error
    }

    // Update inventory and product stock based on production
    try {
      // Get the recipe with ingredients to calculate raw materials needed
      const recipe = recipes.find(r => r.id === logData.recipeId)
      if (recipe) {
        // Calculate total quantity produced: batches * recipe yield
        const totalQuantityProduced = logData.quantityProduced * recipe.yield
        
        // 1. Deduct raw materials from inventory based on recipe ingredients
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          for (const ingredient of recipe.ingredients) {
            try {
              // Find matching raw material in inventory
              const inventoryItem = findInventoryItemByName(ingredient.name, "raw")
              
              if (inventoryItem) {
                // Calculate quantity needed: ingredient.quantity * quantityProduced (number of batches)
                // Example: If recipe needs 500g per batch and we produce 2 batches, we need 1000g total
                const quantityNeeded = ingredient.quantity * logData.quantityProduced
                
                // Normalize units for comparison
                const normalizedIngredientUnit = normalizeUnit(ingredient.unit)
                const normalizedInventoryUnit = normalizeUnit(inventoryItem.unit)
                
                // Check if units are compatible and convert if needed
                if (areUnitsCompatible(normalizedIngredientUnit, normalizedInventoryUnit)) {
                  // Convert quantity needed to inventory unit
                  const convertedQuantityNeeded = convertUnit(
                    quantityNeeded,
                    normalizedIngredientUnit,
                    normalizedInventoryUnit
                  )
                  
                  if (convertedQuantityNeeded !== null) {
                    // Check if we have enough inventory
                    if (inventoryItem.quantity >= convertedQuantityNeeded) {
                      const newQuantity = inventoryItem.quantity - convertedQuantityNeeded
                      await updateInventoryItem(inventoryItem.id, {
                        quantity: Math.max(0, newQuantity)
                      })
                      console.log(`Deducted ${convertedQuantityNeeded.toFixed(2)} ${inventoryItem.unit} (${quantityNeeded} ${ingredient.unit}) of ${ingredient.name} from inventory`)
                    } else {
                      console.warn(`Insufficient ${ingredient.name} in inventory. Need ${convertedQuantityNeeded.toFixed(2)} ${inventoryItem.unit}, have ${inventoryItem.quantity} ${inventoryItem.unit}`)
                      // Still deduct what we have (set to 0)
                      await updateInventoryItem(inventoryItem.id, {
                        quantity: 0
                      })
                    }
                  } else {
                    console.warn(`Unit conversion failed for ${ingredient.name}: ${ingredient.unit} to ${inventoryItem.unit}`)
                  }
                } else {
                  console.warn(`Unit mismatch for ${ingredient.name}: recipe uses ${ingredient.unit} (${normalizedIngredientUnit}), inventory has ${inventoryItem.unit} (${normalizedInventoryUnit}) - incompatible units`)
                }
              } else {
                console.warn(`Raw material "${ingredient.name}" not found in inventory. Please add it to inventory.`)
              }
            } catch (ingredientError) {
              console.error(`Error updating inventory for ingredient ${ingredient.name}:`, ingredientError)
            }
          }
        }
        
        // 2. Add finished goods to inventory
        try {
          // First try exact match to prevent duplicates
          let finishedGoodsItem = findInventoryItemByExactName(logData.recipeName, "finished")
          
          // If no exact match, try fuzzy matching (for slight name variations)
          if (!finishedGoodsItem) {
            finishedGoodsItem = findInventoryItemByName(logData.recipeName, "finished")
          }
          
          if (finishedGoodsItem) {
            // Update existing finished goods inventory item
            const newQuantity = finishedGoodsItem.quantity + totalQuantityProduced
            const recipePrice = recipe?.price || undefined
            
            // Update quantity and price (if recipe has price and inventory doesn't)
            const updateData: any = { quantity: newQuantity }
            if (recipePrice !== undefined && recipePrice !== null && recipePrice > 0) {
              // Only update price if inventory doesn't have one or it's 0
              if (!finishedGoodsItem.price || finishedGoodsItem.price === 0) {
                updateData.price = recipePrice
              }
            }
            
            await updateInventoryItem(finishedGoodsItem.id, updateData)
            console.log(`Added ${totalQuantityProduced} pieces of ${logData.recipeName} to inventory (now: ${newQuantity}, price: ${updateData.price || finishedGoodsItem.price || 'not set'})`)
          } else {
            // Create new finished goods inventory item if it doesn't exist
            // addInventoryItem will now check for duplicates before creating
            // Ensure bakeshopInfo is available
            if (currentBakeshopInfo?.id) {
              // Include recipe price when creating finished goods inventory item
              const recipePrice = recipe?.price || undefined
              await addInventoryItem({
                name: logData.recipeName,
                type: "finished",
                quantity: totalQuantityProduced,
                unit: recipe.yieldUnit || "pieces",
                minStock: 0,
                price: recipePrice // Include price from recipe
              })
              console.log(`Created new finished goods inventory item: ${logData.recipeName} with ${totalQuantityProduced} pieces, price: ${recipePrice || 'not set'}`)
            } else {
              console.warn(`Cannot create inventory item: bakeshop info not available`)
            }
          }
        } catch (finishedGoodsError) {
          console.error(`Error updating finished goods inventory for ${logData.recipeName}:`, finishedGoodsError)
        }
        
        // 3. Update product stock for POS
        // Ensure products are loaded before matching
        if (products.length === 0) {
          await loadProducts()
        }
        
        // Use the recipe already found above to get its price
        const recipePrice = recipe?.price || 0 // Use recipe price if available, otherwise 0
        
        // Find matching product with improved matching logic (prioritize exact matches)
        let matchingProduct = products.find(p => 
          p.name.toLowerCase().trim() === logData.recipeName.toLowerCase().trim()
        )
        
        // If no exact match, try fuzzy matching
        if (!matchingProduct) {
          matchingProduct = products.find(p => {
            const productName = p.name.toLowerCase().trim()
            const recipeName = logData.recipeName.toLowerCase().trim()
            return productName.includes(recipeName) || recipeName.includes(productName)
          })
        }
        
        if (matchingProduct) {
          // Update existing product stock (preserve existing price)
          const oldStock = matchingProduct.inStock
          const newStock = oldStock + totalQuantityProduced
          // Only update stock, preserve price
          await updateProduct(matchingProduct.id, {
            inStock: newStock
          })
          console.log(`Updated ${matchingProduct.name} product stock: ${oldStock} -> ${newStock} (+${totalQuantityProduced})`)
          
          // If product has no price but recipe has price, update it
          if (matchingProduct.price === 0 && recipePrice > 0) {
            await updateProduct(matchingProduct.id, {
              price: recipePrice
            })
            console.log(`Updated ${matchingProduct.name} price from recipe: ${recipePrice}`)
          }
        } else {
          // Automatically create product if it doesn't exist
          try {
            // Infer category from recipe name (basic categorization)
            const recipeNameLower = logData.recipeName.toLowerCase()
            let inferredCategory = "uncategorized"
            
            // Simple category inference based on common bakery terms
            if (recipeNameLower.includes("bread") || recipeNameLower.includes("loaf") || recipeNameLower.includes("roll")) {
              inferredCategory = "bread"
            } else if (recipeNameLower.includes("cake") || recipeNameLower.includes("cupcake") || recipeNameLower.includes("muffin")) {
              inferredCategory = "cake"
            } else if (recipeNameLower.includes("cookie") || recipeNameLower.includes("biscuit")) {
              inferredCategory = "cookie"
            } else if (recipeNameLower.includes("pastry") || recipeNameLower.includes("croissant") || recipeNameLower.includes("danish")) {
              inferredCategory = "pastry"
            } else if (recipeNameLower.includes("dessert") || recipeNameLower.includes("pudding") || recipeNameLower.includes("pie")) {
              inferredCategory = "dessert"
            }
            
            await addProduct({
              name: logData.recipeName,
              price: recipePrice, // Use recipe price if available
              category: inferredCategory,
              inStock: totalQuantityProduced
            })
            console.log(`Created new product "${logData.recipeName}" in POS with stock: ${totalQuantityProduced}, price: ${recipePrice} (category: ${inferredCategory})`)
          } catch (productError) {
            console.error(`Failed to create product for recipe "${logData.recipeName}":`, productError)
            // Don't fail the production log if product creation fails, just log it
          }
        }
        
        // Always reload products to ensure POS sees the latest updates
        await loadProducts()
      }
    } catch (inventoryError) {
      // Don't fail the production log if inventory update fails, just log it
      console.error('Error updating inventory after production:', inventoryError)
    }

    // Reload production logs and inventory to update the UI
    // Force reload to ensure POS sync effect triggers by updating inventory state
    await Promise.all([
      loadProductionLogs(),
      loadInventory(),
      loadProducts() // Also reload products to ensure POS has latest data
    ])
    
    // Small delay to ensure state updates propagate before showing success message
    // This gives POS sync effect time to detect inventory changes
    await new Promise(resolve => setTimeout(resolve, 500))
    
    toast.success("Production batch logged successfully. Inventory and POS products updated.")
  }

  // Sale operations
  const loadSales = async () => {
    if (!user || !dataLoader) return
    
    // Role-based filtering: Bakers cannot see sales
    if (user.role === 'baker') {
      setSales([])
      return
    }
    
    // Prevent duplicate loads
    if (loadingRefs.sales.current) {
      return
    }
    
    try {
      loadingRefs.sales.current = true
      const result = await dataLoader.loadSales()
      setSales(Array.isArray(result.data) ? result.data : [])
      loadedDataTypes.current.add('sales')
    } catch (error) {
      console.error('Error loading sales:', error)
      loadedDataTypes.current.add('sales')
      throw error
    } finally {
      loadingRefs.sales.current = false
    }
  }

  const addSale = async (saleData: Omit<Sale, 'id'>) => {
    if (!user) throw new Error('User not authenticated')
    
    // Check permission
    if (!hasPermission(user.role, 'processSale')) {
      throw new Error('You do not have permission to process sales')
    }
    
    // Ensure bakeshopInfo is loaded before creating sale
    let currentBakeshopInfo = bakeshopInfo
    if (!currentBakeshopInfo && user) {
      currentBakeshopInfo = await getBakeshopInfo(user)
      if (currentBakeshopInfo) {
        setBakeshopInfo(currentBakeshopInfo)
      }
    }
    
    if (!currentBakeshopInfo?.id) throw new Error('Bakeshop not found. Please complete your setup.')
    
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimisticSale: Sale = {
      id: tempId,
      ...saleData
    }
    setSales(prev => [...(Array.isArray(prev) ? prev : []), optimisticSale])
    
    try {
      // Build insert data object, only including amount_paid and change_amount if they exist
      // This handles cases where the database schema might not have these columns yet
      // Format items for JSONB storage on the sales row (some schemas store a denormalized copy)
      const itemsJson = Array.isArray(saleData.items)
        ? saleData.items.map((item) => ({
            productName: item.product?.name,
            quantity: item.quantity,
            unitPrice: item.product?.price,
            totalPrice: item.quantity * (item.product?.price || 0)
          }))
        : []

      const insertData: any = {
        bakeshop_id: currentBakeshopInfo.id,
        order_number: saleData.orderNumber,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total: saleData.total,
        payment_method: saleData.paymentMethod,
        items: itemsJson,
        cashier_id: user.id,
        cashier_name: user.name || saleData.cashierName,
        sale_date: saleData.saleDate.toISOString()
      }
      
      // Only include amount_paid and change_amount if the columns exist
      // Try to include them - if they don't exist, the error will be caught
      insertData.amount_paid = saleData.amountPaid
      insertData.change_amount = saleData.change
      
      let sale: any = null
      let saleError: any = null
      
      const { data: saleData_result, error: saleError_result } = await supabase
        .from('sales')
        .insert(insertData)
        .select()
        .single()
      
      sale = saleData_result
      saleError = saleError_result

      if (saleError) {
        // Check if error is due to missing columns (amount_paid, change_amount, or cashier_name)
        const isSchemaError = saleError.message?.includes('amount_paid') || 
                             saleError.message?.includes('change_amount') || 
                             saleError.message?.includes('cashier_name') || 
                             saleError.message?.includes('schema cache')
        
        if (isSchemaError) {
          // Try again without potentially missing columns
          console.warn('Some columns not found in sales table, retrying without them...')
          const fallbackInsertData: any = {
            bakeshop_id: currentBakeshopInfo.id,
            order_number: saleData.orderNumber,
            subtotal: saleData.subtotal,
            tax: saleData.tax,
            total: saleData.total,
            payment_method: saleData.paymentMethod,
            // Include items in the fallback as well to satisfy NOT NULL constraints when present
            items: itemsJson,
            cashier_id: user.id,
            sale_date: saleData.saleDate.toISOString()
          }
          
          // Only include columns if they're not causing the error
          // We'll try without cashier_name, amount_paid, and change_amount
          
          const { data: fallbackSale, error: fallbackError } = await supabase
            .from('sales')
            .insert(fallbackInsertData)
            .select()
            .single()
          
          if (fallbackError) {
            // Rollback optimistic update
            setSales(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
            console.error('Error creating sale (fallback):', fallbackError)
            throw new Error(`Failed to create sale: ${fallbackError.message || 'Unknown error'}. Please run the migration script: docs/database/add-sales-amount-paid-column.sql`)
          }
          
          // Use fallback sale data
          sale = fallbackSale
        } else {
          // Rollback optimistic update
          setSales(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
          console.error('Error creating sale:', saleError)
          throw new Error(`Failed to create sale: ${saleError.message || 'Unknown error'}`)
        }
      }
      
      // Continue with sale creation if we got here
      if (!sale) {
        // This shouldn't happen, but handle it just in case
        setSales(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
        throw new Error('Failed to create sale: No sale data returned')
      }

      // Insert cart items
      if (saleData.items.length > 0) {
        // First, ensure all products exist in the database
        // If a product ID looks like a temp ID or doesn't exist, find or create the product
        const itemsData = await Promise.all(saleData.items.map(async (item) => {
          let productId: string | null = item.product.id || null
          
          // Check if product ID is a temporary ID, invalid, or doesn't exist
          // Check null/undefined first, then verify it's a string before calling startsWith
          const isInvalidProductId = !productId || (typeof productId === 'string' && productId.startsWith('temp-'))
          if (isInvalidProductId) {
            // Find the product by name in the database
            const { data: existingProduct, error: findError } = await supabase
              .from('products')
              .select('id')
              .eq('name', item.product.name)
              .eq('bakeshop_id', currentBakeshopInfo.id)
              .maybeSingle()
            
            if (existingProduct && !findError) {
              productId = existingProduct.id
            } else {
              // Product doesn't exist, create it
              const { data: newProduct, error: createError } = await supabase
                .from('products')
                .insert({
                  bakeshop_id: currentBakeshopInfo.id,
                  name: item.product.name,
                  price: item.product.price,
                  category: item.product.category || 'uncategorized',
                  in_stock: item.product.inStock || 0
                })
                .select()
                .single()
              
              if (createError || !newProduct) {
                console.error(`Error creating product ${item.product.name}:`, createError)
                // Use null product_id if creation fails - the sale_item will still be created with product_name
                productId = null
              } else {
                productId = newProduct.id
              }
            }
          } else {
            // Verify the product exists in the database
            const { data: verifyProduct, error: verifyError } = await supabase
              .from('products')
              .select('id')
              .eq('id', productId)
              .eq('bakeshop_id', currentBakeshopInfo.id)
              .maybeSingle()
            
            if (verifyError || !verifyProduct) {
              // Product ID doesn't exist, try to find by name
              const { data: existingProduct } = await supabase
                .from('products')
                .select('id')
                .eq('name', item.product.name)
                .eq('bakeshop_id', currentBakeshopInfo.id)
                .maybeSingle()
              
              if (existingProduct) {
                productId = existingProduct.id
              } else {
                // Create new product
                const { data: newProduct, error: createError } = await supabase
                  .from('products')
                  .insert({
                    bakeshop_id: currentBakeshopInfo.id,
                    name: item.product.name,
                    price: item.product.price,
                    category: item.product.category || 'uncategorized',
                    in_stock: item.product.inStock || 0
                  })
                  .select()
                  .single()
                
                if (createError || !newProduct) {
                  console.error(`Error creating product ${item.product.name}:`, createError)
                  productId = null
                } else {
                  productId = newProduct.id
                }
              }
            }
          }
          
          return {
            sale_id: sale.id,
            product_id: productId, // Can be null if product doesn't exist
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: item.quantity * item.product.price
          }
        }))

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(itemsData)

        if (itemsError) {
          // Detect missing table / schema cache issues and treat them as non-fatal
          const msg = itemsError?.message || ''
          const code = itemsError?.code || ''
          const isMissingTable = code === '42P01' || // Postgres undefined_table
            msg.includes('could not find the table') ||
            msg.includes("relation \"sale_items\" does not exist") ||
            msg.includes('schema cache') ||
            msg.includes('does not exist')

          if (isMissingTable) {
            console.warn('sale_items table not found, skipping normalized items insert:', itemsError)
            // Do NOT rollback the sale; we've stored `items` JSON on the `sales` row already.
          } else {
            console.error('Error inserting sale items:', itemsError)
            // Rollback sale creation on unexpected errors
            await supabase.from('sales').delete().eq('id', sale.id)
            setSales(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
            throw new Error(`Failed to save sale items: ${itemsError.message}`)
          }
        }
      }

      // Deduct finished goods from inventory for each sold item
      try {
        // Reload inventory first to get latest quantities
        await loadInventory()
        
        for (const item of saleData.items) {
          try {
            // Use exact name matching to find inventory item
            const normalizedProductName = item.product.name.toLowerCase().trim()
            const inventoryItem = inventory.find(item => 
              item.type === 'finished' && 
              item.name.toLowerCase().trim() === normalizedProductName
            )
            
            if (inventoryItem) {
              // Check if we have enough inventory
              if (inventoryItem.quantity >= item.quantity) {
                const newQuantity = inventoryItem.quantity - item.quantity
                await updateInventoryItem(inventoryItem.id, {
                  quantity: Math.max(0, newQuantity)
                })
                console.log(`Deducted ${item.quantity} ${item.product.name} from inventory (now: ${newQuantity})`)
                
                // Sync product stock immediately after inventory update
                await syncProductStockWithInventory(item.product.name, newQuantity)
              } else {
                console.warn(`Insufficient ${item.product.name} in inventory. Need ${item.quantity}, have ${inventoryItem.quantity}`)
                // Still deduct what we have (set to 0)
                await updateInventoryItem(inventoryItem.id, {
                  quantity: 0
                })
                // Sync product stock to 0
                await syncProductStockWithInventory(item.product.name, 0)
              }
            } else {
              console.warn(`Finished goods "${item.product.name}" not found in inventory. Sale recorded but inventory not updated.`)
            }
          } catch (itemError) {
            console.error(`Error updating inventory for ${item.product.name}:`, itemError)
            // Continue with other items even if one fails
          }
        }
        
        // Reload inventory and products to update the UI
        await Promise.all([
          loadInventory(),
          loadProducts()
        ])
      } catch (inventoryError) {
        // Don't fail the sale if inventory update fails, just log it
        console.error('Error updating inventory after sale:', inventoryError)
        // Still reload to ensure UI is updated
        await Promise.all([
          loadInventory().catch(() => {}),
          loadProducts().catch(() => {})
        ])
      }

      // Replace optimistic update with real data
      await loadSales()
      // Reload products to ensure POS sees updated stock
      await loadProducts()
      toast.success("Sale processed successfully")
    } catch (error) {
      // Ensure optimistic update is rolled back
      setSales(prev => (Array.isArray(prev) ? prev.filter(s => s.id !== tempId) : []))
      const errorMessage = error instanceof Error ? error.message : "Failed to process sale"
      console.error('Error in addSale:', error)
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateSale = async (id: string, saleData: Partial<Sale>) => {
    const { error } = await supabase
      .from('sales')
      .update({
        order_number: saleData.orderNumber,
        subtotal: saleData.subtotal,
        tax: saleData.tax,
        total: saleData.total,
        payment_method: saleData.paymentMethod,
        amount_paid: saleData.amountPaid,
        change_amount: saleData.change,
        cashier_name: saleData.cashierName,
        sale_date: saleData.saleDate?.toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // Update items if provided
    if (saleData.items) {
      // Delete existing items
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id)

      // Insert new items
      if (saleData.items.length > 0) {
        const itemsData = saleData.items.map(item => ({
          sale_id: id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.quantity * item.product.price
        }))

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(itemsData)

        if (itemsError) throw itemsError
      }
    }

    await loadSales()
  }

  const deleteSale = async (id: string) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)

    if (error) throw error
    await loadSales()
  }

  // Memoize context value to prevent unnecessary re-renders
  const value: DataStoreContextType = useMemo(() => ({
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    checkRecipeHasProductionLogs,
    inventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkUpdateInventory,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    sales,
    addSale,
    updateSale,
    deleteSale,
    productionLogs,
    addProductionLog,
    loadProductionLogs,
    isLoading,
    error,
    loadDataOnDemand,
    loadAllData
  }), [
    recipes,
    inventory,
    suppliers,
    purchaseOrders,
    products,
    sales,
    productionLogs,
    isLoading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    checkRecipeHasProductionLogs,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    bulkUpdateInventory,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    updateSale,
    deleteSale,
    addProductionLog,
    loadProductionLogs,
    loadDataOnDemand,
    loadAllData
  ])

  return (
    <DataStoreContext.Provider value={value}>
      {children}
    </DataStoreContext.Provider>
  )
}

export function useDataStore() {
  const context = useContext(DataStoreContext)
  if (context === undefined) {
    throw new Error('useDataStore must be used within a DataStoreProvider')
  }
  return context
}
