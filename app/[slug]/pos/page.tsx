"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Minus, Plus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, Printer, X, RefreshCw } from "lucide-react"
import type { Product, CartItem, Sale } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

export default function POSPage() {
  return (
    <ProtectedRoute permission="accessPOS">
      <POSPageContent />
    </ProtectedRoute>
  )
}

function POSPageContent() {
  const { user } = useAuth()
  const { products, inventory, recipes, sales, addSale, updateProduct, addProduct, loadDataOnDemand } = useDataStore()
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  const [isSyncing, setIsSyncing] = useState(false)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const periodicSyncRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncHashRef = useRef<string>('')
  const isSyncingRef = useRef(false)

  // Ensure products and inventory are always arrays
  const productsArray = Array.isArray(products) ? products : []
  const inventoryArray = Array.isArray(inventory) ? inventory : []

  // Load initial data with proper error handling
  useEffect(() => {
    if (!user) return

    const loadInitialData = async () => {
      try {
        const [bakeshopInfo] = await Promise.all([
          getBakeshopInfo(user, true).catch((err) => {
            console.error('Error loading bakeshop info:', err)
            return null
          }),
          loadDataOnDemand('products', true).catch((err) => {
            console.error('Error loading products:', err)
            toast.error('Failed to load products. Please refresh the page.')
          }),
          loadDataOnDemand('inventory', true).catch((err) => {
            console.error('Error loading inventory:', err)
            toast.error('Failed to load inventory. Please refresh the page.')
          }),
          loadDataOnDemand('recipes', true).catch((err) => {
            console.error('Error loading recipes:', err)
            // Recipes loading failure is less critical, don't show error
          }),
          loadDataOnDemand('sales', true).catch((err) => {
            console.error('Error loading sales:', err)
            // Sales loading failure is less critical, don't show error
          })
        ])

        if (bakeshopInfo?.currency) {
          setCurrency(bakeshopInfo.currency)
        }

        // Trigger initial sync after data loads
        setTimeout(() => {
          lastSyncHashRef.current = ''
        }, 500)
      } catch (error) {
        console.error('Error loading initial POS data:', error)
        toast.error('Failed to initialize POS. Please refresh the page.')
      }
    }

    loadInitialData()
  }, [user?.id, loadDataOnDemand])

  // Real-time synchronization: Sync products with finished goods inventory
  // Optimized with better error handling and performance
  useEffect(() => {
    if (inventoryArray.length === 0 || isSyncingRef.current) return

    const finishedGoods = inventoryArray.filter(item => item.type === 'finished')
    if (finishedGoods.length === 0) return

    // Create a hash of current inventory state (include price for better change detection)
    const inventoryHash = finishedGoods
      .map(item => `${item.id}:${item.name}:${item.quantity}:${item.price || 0}`)
      .sort()
      .join('|')

    // Skip if nothing changed
    if (lastSyncHashRef.current === inventoryHash && lastSyncHashRef.current !== '') {
      return
    }

    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Debounce sync to avoid rapid-fire updates
    syncTimeoutRef.current = setTimeout(async () => {
      if (isSyncingRef.current) return

      isSyncingRef.current = true
      setIsSyncing(true)

      try {
        console.log('[POS Sync] Starting synchronization...')

        // Reload products to get latest state
        await loadDataOnDemand('products', true)
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 200))

        // Get fresh products array after reload
        const currentProducts = Array.isArray(products) ? products : []
        const recipesArray = Array.isArray(recipes) ? recipes : []
        const syncOperations: Array<Promise<void>> = []
        const errors: string[] = []

        // Sync each finished good with products
        for (const item of finishedGoods) {
          const normalizedName = item.name.toLowerCase().trim()
          const existingProduct = currentProducts.find(
            p => p.name.toLowerCase().trim() === normalizedName
          )

          // Try to find matching recipe to get price if inventory doesn't have it
          const matchingRecipe = recipesArray.find(
            r => r.name.toLowerCase().trim() === normalizedName
          )
          const recipePrice = matchingRecipe?.price
          
          // Use inventory price if available, otherwise use recipe price, otherwise 0
          const finalPrice = item.price !== undefined && item.price !== null && item.price > 0 
            ? item.price 
            : (recipePrice !== undefined && recipePrice !== null && recipePrice > 0 
              ? recipePrice 
              : 0)

          if (existingProduct) {
            // Update existing product if stock or price changed
            const needsUpdate = 
              existingProduct.inStock !== item.quantity ||
              (finalPrice > 0 && existingProduct.price !== finalPrice)

            if (needsUpdate) {
              const updateData: Partial<Product> = {}
              if (existingProduct.inStock !== item.quantity) {
                updateData.inStock = item.quantity
              }
              // Update price if we have a valid price (from inventory or recipe)
              if (finalPrice > 0 && existingProduct.price !== finalPrice) {
                updateData.price = finalPrice
              }

              syncOperations.push(
                updateProduct(existingProduct.id, updateData)
                  .then(() => {
                    console.log(`[POS Sync] Updated product: ${item.name} (stock: ${item.quantity}, price: ${finalPrice})`)
                  })
                  .catch(err => {
                    const errorMsg = `Failed to update ${item.name}`
                    console.error(`[POS Sync] ${errorMsg}:`, err)
                    errors.push(errorMsg)
                  })
              )
            }
          } else {
            // Create new product for finished good
            const itemNameLower = item.name.toLowerCase()
            let category = "uncategorized"
            
            if (itemNameLower.includes("bread") || itemNameLower.includes("loaf") || itemNameLower.includes("roll") || itemNameLower.includes("pandesal")) {
              category = "bread"
            } else if (itemNameLower.includes("cake") || itemNameLower.includes("cupcake") || itemNameLower.includes("muffin")) {
              category = "cake"
            } else if (itemNameLower.includes("cookie") || itemNameLower.includes("biscuit")) {
              category = "cookie"
            } else if (itemNameLower.includes("pastry") || itemNameLower.includes("croissant") || itemNameLower.includes("danish") || itemNameLower.includes("ensaymada") || itemNameLower.includes("donut")) {
              category = "pastry"
            } else if (itemNameLower.includes("dessert") || itemNameLower.includes("pudding") || itemNameLower.includes("pie")) {
              category = "dessert"
            }

            syncOperations.push(
              addProduct({
                name: item.name,
                price: finalPrice, // Use price from inventory or recipe
                category,
                inStock: item.quantity
              })
                .then(() => {
                  console.log(`[POS Sync] Created product: ${item.name} (stock: ${item.quantity}, price: ${finalPrice}, category: ${category})`)
                })
                .catch(err => {
                  // Ignore duplicate errors (product already exists)
                  if (!(err instanceof Error && (
                    err.message.includes('duplicate') ||
                    err.message.includes('unique') ||
                    err.message.includes('23505')
                  ))) {
                    const errorMsg = `Failed to create ${item.name}`
                    console.error(`[POS Sync] ${errorMsg}:`, err)
                    errors.push(errorMsg)
                  }
                })
            )
          }
        }

        // Wait for all sync operations to complete
        await Promise.allSettled(syncOperations)

        // Reload products to update UI
        await loadDataOnDemand('products', true)
        await new Promise(resolve => setTimeout(resolve, 300))

        // Update sync hash
        lastSyncHashRef.current = inventoryHash

        const successCount = syncOperations.length - errors.length
        console.log(`[POS Sync] Synchronization complete. Products synced: ${successCount}/${syncOperations.length}`)
        
        if (errors.length > 0) {
          console.warn(`[POS Sync] ${errors.length} errors occurred during sync`)
          // Don't show toast for individual errors to avoid spam
        }
      } catch (error) {
        console.error('[POS Sync] Error during synchronization:', error)
        toast.error('Failed to sync products. Please try again.')
      } finally {
        isSyncingRef.current = false
        setIsSyncing(false)
      }
    }, 500) // 500ms debounce

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [inventoryArray, products, updateProduct, addProduct, loadDataOnDemand])

  // Periodic sync every 10 seconds to catch production log updates
  // Optimized to reduce unnecessary API calls
  useEffect(() => {
    if (!user) return

    periodicSyncRef.current = setInterval(async () => {
      if (isSyncingRef.current) return

      try {
        await loadDataOnDemand('inventory', true)
        // Reset hash to force sync check
        setTimeout(() => {
          lastSyncHashRef.current = ''
        }, 100)
      } catch (error) {
        console.error('Error in periodic sync:', error)
        // Don't show error toast for background sync failures
      }
    }, 10000) // Every 10 seconds (reduced frequency for better performance)

    // Sync when page becomes visible (user returns to tab)
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isSyncingRef.current) {
        try {
          await loadDataOnDemand('inventory', true)
          setTimeout(() => {
            lastSyncHashRef.current = ''
          }, 200)
        } catch (error) {
          console.error('Error syncing on visibility change:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (periodicSyncRef.current) {
        clearInterval(periodicSyncRef.current)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, loadDataOnDemand])

  // Manual sync function with improved error handling
  const handleManualSync = useCallback(async () => {
    if (isSyncingRef.current || isSyncing) {
      toast.info('Sync already in progress...')
      return
    }

    isSyncingRef.current = true
    setIsSyncing(true)

    try {
      lastSyncHashRef.current = ''
      
      // Load data in parallel with proper error handling
      const results = await Promise.allSettled([
        loadDataOnDemand('inventory', true),
        loadDataOnDemand('products', true)
      ])

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected')
      if (failures.length > 0) {
        console.error('Sync failures:', failures)
        toast.error('Some data failed to sync. Please try again.')
        return
      }

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Get updated product count
      const updatedProducts = Array.isArray(products) ? products : []
      toast.success(`Successfully synced ${updatedProducts.length} products`)
    } catch (error) {
      console.error('Manual sync error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Sync failed: ${errorMessage}`)
    } finally {
      isSyncingRef.current = false
      setIsSyncing(false)
    }
  }, [isSyncing, products, loadDataOnDemand])

  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "gcash">("cash")
  const [amountPaid, setAmountPaid] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Categories
  const categories = useMemo(() => 
    ["All", ...Array.from(new Set(productsArray.map((p) => p.category)))],
    [productsArray]
  )

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productsArray.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [productsArray, searchQuery, selectedCategory])

  // Get current product stock
  const getCurrentProduct = useCallback((productId: string): Product | undefined => {
    return productsArray.find(p => p.id === productId)
  }, [productsArray])

  // Add to cart
  const addToCart = useCallback((product: Product) => {
    if (product.inStock <= 0) {
      toast.error(`${product.name} is out of stock`)
      return
    }

    setCart(prevCart => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        if (existingItem.quantity < product.inStock) {
          return prevCart.map((item) => 
            item.product.id === product.id 
              ? { ...item, product: product, quantity: item.quantity + 1 } 
              : item
          )
        } else {
          toast.error(`Cannot add more ${product.name}. Only ${product.inStock} in stock.`)
          return prevCart
        }
      } else {
        return [...prevCart, { product: product, quantity: 1 }]
      }
    })
  }, [])

  // Update quantity
  const updateQuantity = useCallback((productId: string, delta: number) => {
    const currentProduct = getCurrentProduct(productId)
    if (!currentProduct) return

    setCart(prevCart =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) return null

            if (newQuantity > currentProduct.inStock) {
              toast.error(`Cannot add more ${currentProduct.name}. Only ${currentProduct.inStock} in stock.`)
              return item
            }

            return { ...item, product: currentProduct, quantity: newQuantity }
          }
          return item
        })
        .filter((item): item is CartItem => item !== null),
    )
  }, [getCurrentProduct])

  // Update cart with latest product data when products change
  useEffect(() => {
    if (cart.length === 0 || productsArray.length === 0) return

    const updatedCart = cart.map(cartItem => {
      const currentProduct = getCurrentProduct(cartItem.product.id)
      if (currentProduct) {
        if (cartItem.quantity > currentProduct.inStock) {
          return { ...cartItem, product: currentProduct, quantity: currentProduct.inStock }
        }
        return { ...cartItem, product: currentProduct }
      }
      return cartItem
    })

    const hasChanges = updatedCart.some((item, index) => 
      item.product.inStock !== cart[index].product.inStock ||
      item.quantity !== cart[index].quantity
    )

    if (hasChanges) {
      setCart(updatedCart)
    }
  }, [productsArray, getCurrentProduct, cart])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter((item) => item.product.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  // Calculations
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  )
  const tax = 0
  const total = useMemo(() => subtotal + tax, [subtotal])
  const change = useMemo(() => 
    paymentMethod === "cash" ? Math.max(0, Number.parseFloat(amountPaid || "0") - total) : 0,
    [paymentMethod, amountPaid, total]
  )

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Please add items before checkout.")
      return
    }
    setIsCheckoutOpen(true)
  }, [cart.length])

  const handleCompletePayment = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Please add items before checkout.")
      return
    }
    if (isProcessing) return

    // Validate payment amount for cash payments
    if (paymentMethod === "cash") {
      const paidAmount = Number.parseFloat(amountPaid || "0")
      if (isNaN(paidAmount) || paidAmount <= 0) {
        toast.error("Please enter a valid payment amount")
        return
      }
      if (paidAmount < total) {
        toast.error(`Insufficient payment. Total is ${formatCurrency(total, currency)}, but only ${formatCurrency(paidAmount, currency)} was paid.`)
        return
      }
    }

    setIsProcessing(true)

    try {
      // Validate stock availability before processing payment
      await loadDataOnDemand('products', true)
      await new Promise(resolve => setTimeout(resolve, 300))

      const currentProducts = Array.isArray(products) ? products : []
      const stockIssues: string[] = []

      for (const cartItem of cart) {
        const currentProduct = currentProducts.find(p => p.id === cartItem.product.id)
        if (!currentProduct) {
          stockIssues.push(`${cartItem.product.name} is no longer available`)
          continue
        }
        if (currentProduct.inStock < cartItem.quantity) {
          stockIssues.push(`${cartItem.product.name}: Only ${currentProduct.inStock} in stock, but ${cartItem.quantity} requested`)
        }
      }

      if (stockIssues.length > 0) {
        const updatedCart = cart.map(cartItem => {
          const currentProduct = currentProducts.find(p => p.id === cartItem.product.id)
          if (currentProduct && cartItem.quantity > currentProduct.inStock) {
            return { ...cartItem, product: currentProduct, quantity: Math.min(cartItem.quantity, currentProduct.inStock) }
          }
          return cartItem
        }).filter(item => {
          const currentProduct = currentProducts.find(p => p.id === item.product.id)
          return currentProduct && currentProduct.inStock > 0
        })

        setCart(updatedCart)
        toast.error(`Stock issues detected:\n${stockIssues.join('\n')}\n\nCart has been updated. Please review and try again.`)
        setIsProcessing(false)
        return
      }

      // Create sale record
      const saleData = {
        orderNumber: `ORD-${Date.now()}`,
        items: cart,
        subtotal,
        tax: 0,
        total,
        paymentMethod,
        amountPaid: paymentMethod === "cash" ? Number.parseFloat(amountPaid || "0") : total,
        change,
        cashierName: user?.name || "Unknown",
        saleDate: new Date(),
      }

      await addSale(saleData)

      // Reload products, inventory, and sales after sale with proper error handling
      const reloadResults = await Promise.allSettled([
        loadDataOnDemand('products', true),
        loadDataOnDemand('inventory', true),
        loadDataOnDemand('sales', true) // Reload sales to show in Recent Transactions
      ])

      // Log any reload failures but don't block success
      reloadResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const dataType = index === 0 ? 'products' : 'inventory'
          console.error(`Failed to reload ${dataType} after sale:`, result.reason)
        }
      })

      // Reset sync hash to trigger sync
      lastSyncHashRef.current = ''

      const tempSale: Sale = {
        id: `temp-${Date.now()}`,
        ...saleData
      }
      setLastSale(tempSale)

      // Reset
      clearCart()
      setIsCheckoutOpen(false)
      setAmountPaid("")
      setPaymentMethod("cash")

      setIsReceiptOpen(true)
      toast.success("Transaction completed successfully!")
    } catch (error) {
      console.error('Error processing payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const canCompletePayment =
    paymentMethod === "cash" ? Number.parseFloat(amountPaid || "0") >= total : true

  // Recent transactions - ensure saleDate is a Date object
  const salesArray = Array.isArray(sales) ? sales : []
  const recentTransactions = salesArray
    .map(sale => {
      // Ensure saleDate is a Date object, fallback to current time if missing
      let saleDate: Date
      if (sale.saleDate instanceof Date) {
        saleDate = sale.saleDate
      } else if (sale.saleDate) {
        saleDate = new Date(sale.saleDate)
      } else {
        saleDate = new Date() // Fallback to current time
      }
      
      return {
        ...sale,
        saleDate
      }
    })
    .sort((a, b) => {
      const dateA = a.saleDate instanceof Date ? a.saleDate.getTime() : new Date(a.saleDate).getTime()
      const dateB = b.saleDate instanceof Date ? b.saleDate.getTime() : new Date(b.saleDate).getTime()
      return dateB - dateA
    })
    .slice(0, 10)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Products Section */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
              <p className="text-muted-foreground mt-1">Process customer transactions</p>
            </div>
            <Button
              variant="outline"
              onClick={handleManualSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Products
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <ScrollArea className="flex-1 min-h-0">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No products available</p>
                <p className="text-sm mt-2">
                  {productsArray.length === 0 
                    ? "Products will appear here once inventory is synced"
                    : "No products match your search or category filter"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow active:scale-95 select-none"
                    onClick={() => addToCart(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        addToCart(product)
                      }
                    }}
                  >
                    <CardContent className="p-4 pointer-events-none">
                      <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-primary">{formatCurrency(product.price, currency)}</p>
                        <Badge 
                          variant={product.inStock > 10 ? "secondary" : product.inStock > 0 ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {product.inStock > 0 ? product.inStock : "Out"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Cart Section */}
        <Card className="w-full lg:w-96 xl:w-[28rem] flex flex-col h-[calc(100vh-12rem)] lg:h-auto">
          <CardHeader className="flex-shrink-0">
            <CardTitle>Current Order</CardTitle>
            <CardDescription>
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="pr-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 py-3 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.product.price, currency)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(item.product.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="w-20 text-right font-medium flex-shrink-0">
                          {formatCurrency(item.product.price * item.quantity, currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="space-y-3 pt-4 border-t mt-4 flex-shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(tax, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total, currency)}</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Clear
                </Button>
                <Button className="flex-1" onClick={handleCheckout} disabled={cart.length === 0}>
                  Checkout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>Select payment method and complete the transaction</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total, currency)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="gcash" id="gcash" />
                  <Label htmlFor="gcash" className="flex-1 cursor-pointer flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    GCash
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  autoFocus
                />
                {Number.parseFloat(amountPaid || "0") >= total && (
                  <div className="rounded-lg bg-success/10 p-3 text-success">
                    <div className="flex justify-between font-medium">
                      <span>Change</span>
                      <span>{formatCurrency(change, currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompletePayment} disabled={!canCompletePayment || isProcessing}>
              {isProcessing ? "Processing..." : "Complete Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>

          {lastSale && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">BAKESYNC</h3>
                  <p className="text-sm text-muted-foreground">Receipt</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order #</span>
                    <span className="font-medium">{lastSale.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{lastSale.saleDate.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cashier</span>
                    <span>{lastSale.cashierName}</span>
                  </div>
                  <Separator className="my-2" />

                  {lastSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.quantity}x {item.product.name}</p>
                        <p className="text-muted-foreground text-xs">{formatCurrency(item.product.price, currency)} each</p>
                      </div>
                      <p className="font-medium">{formatCurrency(item.product.price * item.quantity, currency)}</p>
                    </div>
                  ))}

                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(lastSale.subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(lastSale.tax, currency)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(lastSale.total, currency)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <Badge variant="outline" className="capitalize">
                      {lastSale.paymentMethod}
                    </Badge>
                  </div>
                  {lastSale.paymentMethod === "cash" && (
                    <>
                      <div className="flex justify-between">
                        <span>Amount Paid</span>
                        <span>{formatCurrency(lastSale.amountPaid, currency)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Change</span>
                        <span>{formatCurrency(lastSale.change, currency)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-center mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">Thank you for your purchase!</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsReceiptOpen(false)
                setLastSale(null)
              }}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.print()
              }}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recent Transactions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest customer transactions processed</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No transactions yet.</p>
                  <p className="text-sm">Transactions will appear here after checkout.</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-start justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => {
                      setLastSale(transaction)
                      setIsReceiptOpen(true)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{transaction.orderNumber}</p>
                        <Badge
                          variant={
                            transaction.paymentMethod === "cash" ? "default" :
                            transaction.paymentMethod === "card" ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {transaction.paymentMethod === "cash" ? "Cash" :
                           transaction.paymentMethod === "card" ? "Card" : "GCash"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {transaction.items.map((item: CartItem, idx: number) => (
                          <p key={idx} className="text-sm text-muted-foreground">
                            {item.quantity}x {item.product.name} - {formatCurrency(item.product.price * item.quantity, currency)}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        by {transaction.cashierName} • {transaction.saleDate.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-bold text-lg text-primary">{formatCurrency(transaction.total, currency)}</p>
                      {transaction.paymentMethod === "cash" && transaction.change > 0 && (
                        <p className="text-xs text-muted-foreground">Change: {formatCurrency(transaction.change, currency)}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Click to view receipt</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
