// Environment-Based Data Loading
// Phase 1: Critical Foundation - BakeSync ERP

import { createClient } from "./supabase-client"
import type { User } from "./auth-context"
import { isDemoAccount, getDataLoadingStrategy } from "./account-detection"

export interface DataLoadingOptions {
  useDemoData?: boolean
  bakeshopId?: string
  forceRefresh?: boolean
}

export interface DataLoadingResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  source: 'demo' | 'production' | 'mixed'
}

const supabase = createClient()

/**
 * Demo bakeshop ID constant - used for demo account data isolation
 */
export const DEMO_BAKESHOP_ID = '550e8400-e29b-41d4-a716-446655440000'

/**
 * Base data loader class with environment detection
 */
export class EnvironmentDataLoader {
  private user: User | null = null
  private bakeshopId: string | null = null

  constructor(user: User | null, bakeshopId?: string) {
    this.user = user
    this.bakeshopId = bakeshopId || null
  }

  /**
   * Get the appropriate data loading strategy
   */
  private getStrategy(): 'demo' | 'production' | 'mixed' {
    if (!this.user) return 'mixed'
    return getDataLoadingStrategy(this.user)
  }

  /**
   * Get bakeshop filter for queries
   */
  private getBakeshopFilter(): { bakeshop_id: string } | {} {
    if (this.bakeshopId) {
      return { bakeshop_id: this.bakeshopId }
    }
    return {}
  }

  /**
   * Load recipes with environment-aware filtering
   */
  async loadRecipes(options: DataLoadingOptions = {}): Promise<DataLoadingResult<any>> {
    const strategy = this.getStrategy()
    
    try {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (*)
        `)
        .order('created_at', { ascending: false })

      // Apply bakeshop filtering for production data
      if (strategy === 'production' && this.bakeshopId) {
        query = query.eq('bakeshop_id', this.bakeshopId)
      }

      // For demo accounts, load demo bakeshop data
      if (strategy === 'demo') {
        query = query.eq('bakeshop_id', DEMO_BAKESHOP_ID)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedRecipes = data?.map(recipe => ({
        ...recipe,
        createdAt: new Date(recipe.created_at),
        updatedAt: new Date(recipe.updated_at),
        yield: recipe.yield_amount,
        yieldUnit: recipe.yield_unit,
        price: recipe.price || undefined, // Include price if available
        category: recipe.category || 'other', // Default to 'other' if not set
        tags: Array.isArray(recipe.tags) 
          ? recipe.tags.filter((tag: any) => tag && typeof tag === 'string' && tag.trim() !== '')
          : (recipe.tags && typeof recipe.tags === 'string' && recipe.tags.trim() !== '' ? [recipe.tags] : []), // Ensure tags is always an array and filter empty values
        // Convert instructions array back to string for display
        instructions: Array.isArray(recipe.instructions) 
          ? recipe.instructions.join('\n')
          : recipe.instructions || '',
        ingredients: recipe.recipe_ingredients || []
      })) || []

      return {
        data: formattedRecipes,
        isLoading: false,
        error: null,
        source: strategy
      }
    } catch (error) {
      return {
        data: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load recipes',
        source: strategy
      }
    }
  }

  /**
   * Load inventory with environment-aware filtering
   */
  async loadInventory(options: DataLoadingOptions = {}): Promise<DataLoadingResult<any>> {
    const strategy = this.getStrategy()
    
    try {
      let query = supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply bakeshop filtering for production data
      if (strategy === 'production' && this.bakeshopId) {
        query = query.eq('bakeshop_id', this.bakeshopId)
      }

      // For demo accounts, load demo bakeshop data
      if (strategy === 'demo') {
        query = query.eq('bakeshop_id', DEMO_BAKESHOP_ID)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedInventory = data?.map(item => {
        // Convert database type format to frontend format
        // Database: 'raw_material' | 'finished_good'
        // Frontend: 'raw' | 'finished'
        let type: 'raw' | 'finished' = 'raw'
        if (item.type === 'finished_good') {
          type = 'finished'
        } else if (item.type === 'raw_material') {
          type = 'raw'
        } else if (item.type === 'finished') {
          // Handle legacy data that might already be in frontend format
          type = 'finished'
        } else if (item.type === 'raw') {
          // Handle legacy data that might already be in frontend format
          type = 'raw'
        }
        
        return {
          id: item.id,
          name: item.name,
          type: type,
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit,
          minStock: parseFloat(item.min_stock) || 0,
          price: item.price || null,
          expirationDate: item.expiration_date ? new Date(item.expiration_date) : undefined,
          // Note: delivery_date column does NOT exist in the inventory table schema
          // Set to undefined since the column doesn't exist
          deliveryDate: undefined,
          lastUpdated: new Date(item.updated_at)
        }
      }) || []

      return {
        data: formattedInventory,
        isLoading: false,
        error: null,
        source: strategy
      }
    } catch (error) {
      return {
        data: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load inventory',
        source: strategy
      }
    }
  }

  /**
   * Load suppliers with environment-aware filtering
   */
  async loadSuppliers(options: DataLoadingOptions = {}): Promise<DataLoadingResult<any>> {
    const strategy = this.getStrategy()
    
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply bakeshop filtering for production data
      if (strategy === 'production' && this.bakeshopId) {
        query = query.eq('bakeshop_id', this.bakeshopId)
      }

      // For demo accounts, load demo bakeshop data
      if (strategy === 'demo') {
        query = query.eq('bakeshop_id', DEMO_BAKESHOP_ID)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedSuppliers = data?.map(supplier => ({
        ...supplier,
        createdAt: new Date(supplier.created_at),
        updatedAt: new Date(supplier.updated_at)
      })) || []

      return {
        data: formattedSuppliers,
        isLoading: false,
        error: null,
        source: strategy
      }
    } catch (error) {
      return {
        data: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load suppliers',
        source: strategy
      }
    }
  }

  /**
   * Load products with environment-aware filtering
   */
  async loadProducts(options: DataLoadingOptions = {}): Promise<DataLoadingResult<any>> {
    const strategy = this.getStrategy()
    
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply bakeshop filtering for production data
      if (strategy === 'production' && this.bakeshopId) {
        query = query.eq('bakeshop_id', this.bakeshopId)
      }

      // For demo accounts, load demo bakeshop data
      if (strategy === 'demo') {
        query = query.eq('bakeshop_id', DEMO_BAKESHOP_ID)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedProducts = data?.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        imageUrl: product.image_url,
        inStock: product.in_stock ?? 0, // Map in_stock to inStock, default to 0 if null
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at)
      })) || []

      return {
        data: formattedProducts,
        isLoading: false,
        error: null,
        source: strategy
      }
    } catch (error) {
      return {
        data: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load products',
        source: strategy
      }
    }
  }

  /**
   * Load sales with environment-aware filtering
   */
  async loadSales(options: DataLoadingOptions = {}): Promise<DataLoadingResult<any>> {
    const strategy = this.getStrategy()
    
    try {
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items (*)
        `)
        .order('created_at', { ascending: false })

      // Apply bakeshop filtering for production data
      if (strategy === 'production' && this.bakeshopId) {
        query = query.eq('bakeshop_id', this.bakeshopId)
      }

      // For demo accounts, load demo bakeshop data
      if (strategy === 'demo') {
        query = query.eq('bakeshop_id', DEMO_BAKESHOP_ID)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedSales = data?.map(sale => {
        // Transform sale_items to CartItem[] format
        let items: any[] = []
        
        // First try to use sale_items table data if available
        if (sale.sale_items && Array.isArray(sale.sale_items) && sale.sale_items.length > 0) {
          items = sale.sale_items.map((item: any) => ({
            product: {
              id: item.product_id || '',
              name: item.product_name || '',
              price: item.unit_price || 0,
              category: '',
              inStock: 0
            },
            quantity: item.quantity || 0
          }))
        } 
        // Fallback to items JSONB column if sale_items table doesn't exist
        else if (sale.items) {
          // Handle both array format and object format
          const itemsData = Array.isArray(sale.items) ? sale.items : []
          items = itemsData.map((item: any) => ({
            product: {
              id: item.productId || item.product_id || '',
              name: item.productName || item.product_name || item.name || '',
              price: item.unitPrice || item.unit_price || item.price || 0,
              category: item.category || '',
              inStock: 0
            },
            quantity: item.quantity || 0
          }))
        }
        
        return {
          id: sale.id,
          orderNumber: sale.order_number || sale.orderNumber || '',
          items: items,
          subtotal: sale.subtotal || 0,
          tax: sale.tax || 0,
          total: sale.total || 0,
          paymentMethod: sale.payment_method || sale.paymentMethod || 'cash',
          amountPaid: sale.amount_paid ?? sale.amountPaid ?? 0,
          change: sale.change_amount ?? sale.change ?? 0,
          cashierName: sale.cashier_name || sale.cashierName || sale.cashier_name || 'Unknown',
          saleDate: new Date(sale.sale_date || sale.saleDate || sale.created_at),
          createdAt: new Date(sale.created_at),
          updatedAt: new Date(sale.updated_at)
        }
      }) || []

      return {
        data: formattedSales,
        isLoading: false,
        error: null,
        source: strategy
      }
    } catch (error) {
      return {
        data: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load sales',
        source: strategy
      }
    }
  }

  /**
   * Load production logs with environment-aware filtering
   */
  async loadProductionLogs(options: DataLoadingOptions = {}): Promise<DataLoadingResult<any>> {
    const strategy = this.getStrategy()
    
    try {
      let query = supabase
        .from('production_logs')
        .select(`
          *,
          recipes:recipe_id (
            name
          ),
          profiles:baker_id (
            name
          )
        `)
        .order('created_at', { ascending: false })

      // Apply bakeshop filtering for production data
      if (strategy === 'production' && this.bakeshopId) {
        query = query.eq('bakeshop_id', this.bakeshopId)
      }

      // For demo accounts, load demo bakeshop data
      if (strategy === 'demo') {
        query = query.eq('bakeshop_id', DEMO_BAKESHOP_ID)
      }

      const { data, error } = await query

      if (error) throw error

      const formattedLogs = data?.map((log: any) => ({
        ...log,
        createdAt: new Date(log.created_at),
        updatedAt: new Date(log.updated_at),
        productionDate: new Date(log.production_date),
        recipe_name: log.recipes?.name || 'Unknown Recipe',
        baker_name: log.profiles?.name || 'Unknown Baker'
      })) || []

      return {
        data: formattedLogs,
        isLoading: false,
        error: null,
        source: strategy
      }
    } catch (error) {
      return {
        data: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load production logs',
        source: strategy
      }
    }
  }
}

/**
 * Create a data loader instance for a user
 */
export function createDataLoader(user: User | null, bakeshopId?: string): EnvironmentDataLoader {
  return new EnvironmentDataLoader(user, bakeshopId)
}

/**
 * Get bakeshop information for a user (with caching)
 */
export async function getBakeshopInfo(user: User, useCache = true): Promise<{
  id: string
  name: string
  slug: string
  isDemo: boolean
  currency?: string
} | null> {
  try {
    if (isDemoAccount(user)) {
      return {
        id: DEMO_BAKESHOP_ID,
        name: 'Demo Bakery',
        slug: 'demo',
        isDemo: true,
        currency: 'PHP'
      }
    }

    // Check cache first
    if (useCache) {
      const { getCachedBakeshopInfo, setCachedBakeshopInfo } = await import('./bakeshop-cache')
      const cached = getCachedBakeshopInfo(user.id)
      if (cached !== undefined) {
        return cached
      }
    }

    // For production accounts, get their bakeshop info
    // First try to get it from bakeshop_memberships
    let membershipData = null
    let membershipError = null
    try {
      const result = await supabase
      .from('bakeshop_memberships')
      .select(`
        bakeshop_id,
        bakeshops (
          id,
          name,
          slug,
          is_demo,
          currency
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully
      
      membershipData = result.data
      membershipError = result.error

      // Check if we got data and it's not an error about 0 rows
      if (!membershipError && membershipData?.bakeshops) {
        const shop = Array.isArray(membershipData.bakeshops)
          ? membershipData.bakeshops[0]
          : membershipData.bakeshops

        if (shop) {
          const result = {
            id: shop.id,
            name: shop.name,
            slug: shop.slug,
            isDemo: shop.is_demo,
            currency: shop.currency || 'PHP'
          }
          // Cache the result
          if (useCache) {
            const { setCachedBakeshopInfo } = await import('./bakeshop-cache')
            setCachedBakeshopInfo(user.id, result)
          }
          return result
        }
      }
      
      // If error is about 0 rows (PGRST116), that's expected - continue to fallback
      if (membershipError) {
        if (membershipError.code === 'PGRST116') {
          console.log('No membership found (expected if membership not created yet)')
        } else {
          console.warn('Error fetching membership:', membershipError)
        }
      }
    } catch (fetchError: any) {
      // Handle network/CORS errors gracefully
      console.warn('Network error fetching membership:', fetchError)
      // Continue to fallback
    }

    // Fallback: If membership doesn't exist, try to get bakeshop by created_by
    // This handles cases where the user created the bakeshop but membership wasn't created yet
    console.log('Membership not found, trying to get bakeshop by created_by...')
    try {
      const { data: bakeshopData, error: bakeshopError } = await supabase
        .from('bakeshops')
        .select('id, name, slug, is_demo, currency')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle() instead of single() to handle 0 rows gracefully

      // Check if we got data and it's not an error about 0 rows
      if (!bakeshopError && bakeshopData) {
        console.log('Found bakeshop by created_by:', bakeshopData)
        const result = {
          id: bakeshopData.id,
          name: bakeshopData.name,
          slug: bakeshopData.slug,
          isDemo: bakeshopData.is_demo,
          currency: bakeshopData.currency || 'PHP'
        }
        // Cache the result
        if (useCache) {
          const { setCachedBakeshopInfo } = await import('./bakeshop-cache')
          setCachedBakeshopInfo(user.id, result)
        }
        return result
      }
      
      // If error is about 0 rows (PGRST116), that's expected - return null
      if (bakeshopError) {
        if (bakeshopError.code === 'PGRST116') {
          console.log('No bakeshop found by created_by (expected if bakeshop not created yet)')
        } else {
          console.warn('Error fetching bakeshop:', bakeshopError)
        }
      }
    } catch (fetchError: any) {
      // Handle network/CORS errors gracefully
      console.warn('Network error fetching bakeshop by created_by:', fetchError)
      // Continue to return null
    }

    console.log('No bakeshop info found for user:', user.id)
    const result = null
    // Cache null result to avoid repeated queries
    if (useCache) {
      const { setCachedBakeshopInfo } = await import('./bakeshop-cache')
      setCachedBakeshopInfo(user.id, result)
    }
    return result
  } catch (error) {
    console.error('Error getting bakeshop info:', error)
    return null
  }
}
