"use client"

import React, { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, FileText, Package } from "lucide-react"
import { SupplierCard } from "@/components/supplier-card"
import type { Supplier, PurchaseOrder, PurchaseOrderItem } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils"
import { hasPermission } from "@/lib/permissions"
import { toast } from "sonner"

export default function SupplyChainPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const slug = pathname.split('/')[1] || 'demo'
  const { user } = useAuth()
  const { suppliers, purchaseOrders, inventory, addSupplier, addPurchaseOrder, updatePurchaseOrder, addInventoryItem, updateInventoryItem, loadDataOnDemand } = useDataStore()
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(searchParams.get("action") === "create-po")
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // Form states for Add Supplier
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    products: ""
  })
  
  // Form states for Create PO
  const [poForm, setPoForm] = useState({
    expectedDeliveryDate: "",
    notes: "",
    items: [] as Array<{ itemName: string; quantity: number; unit: string; unitPrice: number }>
  })
  const [poItemQuantities, setPoItemQuantities] = useState<Record<number, string>>({})
  const [poItemPrices, setPoItemPrices] = useState<Record<number, string>>({})
  
  // Ensure arrays are always arrays
  const suppliersArray = Array.isArray(suppliers) ? suppliers : []
  const purchaseOrdersArray = Array.isArray(purchaseOrders) ? purchaseOrders : []
  
  // Load data when component mounts (non-blocking - render immediately)
  // Only load once when user is available
  useEffect(() => {
    if (!user) return
    
    // Load in parallel in background - don't block rendering
    // loadDataOnDemand will check if data is already loaded
    Promise.all([
      loadDataOnDemand('suppliers').catch(() => {}),
      loadDataOnDemand('purchaseOrders').catch(() => {})
    ])
  }, [user?.id, loadDataOnDemand]) // Only depend on user.id to prevent unnecessary reloads
  
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

  const filteredSuppliers = suppliersArray.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pendingOrders = purchaseOrdersArray.filter((po) => po.status === "pending" || po.status === "draft")
  const receivedOrders = purchaseOrdersArray.filter((po) => po.status === "received")
  
  const canReceiveDelivery = user ? hasPermission(user.role, "receiveDelivery") : false

  const getStatusVariant = (status: PurchaseOrder["status"]) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "received":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleCreateOrder = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setIsCreatePOOpen(true)
  }
  
  const handleAddSupplier = async () => {
    try {
      // Validate required fields
      if (!supplierForm.name.trim()) {
        alert('Please enter a supplier name')
        return
      }
      if (!supplierForm.contactPerson.trim()) {
        alert('Please enter a contact person')
        return
      }
      if (!supplierForm.email.trim()) {
        alert('Please enter an email address')
        return
      }
      
      const productsArray = supplierForm.products
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)
      
      await addSupplier({
        name: supplierForm.name.trim(),
        contactPerson: supplierForm.contactPerson.trim(),
        email: supplierForm.email.trim(),
        phone: supplierForm.phone.trim(),
        address: supplierForm.address.trim(),
        products: productsArray
      })
      
      // Reset form
      setSupplierForm({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        products: ""
      })
      
      // Close modal and show success message
      setIsAddSupplierOpen(false)
      toast.success("Supplier added successfully")
    } catch (error: any) {
      console.error('Error adding supplier:', error)
      const errorMessage = error?.message || 'Failed to add supplier. Please try again.'
      toast.error(errorMessage)
      // Don't close modal on error so user can fix and retry
    }
  }
  
  const handleAddPOItem = () => {
    const itemsArray = Array.isArray(poForm.items) ? poForm.items : []
    const newIndex = itemsArray.length
    setPoForm({
      ...poForm,
      items: [...itemsArray, { itemName: "", quantity: 1, unit: "kg", unitPrice: 0 }]
    })
    setPoItemQuantities(prev => ({ ...prev, [newIndex]: "1" }))
    setPoItemPrices(prev => ({ ...prev, [newIndex]: "" }))
  }
  
  const handleUpdatePOItem = (index: number, field: string, value: string | number) => {
    const itemsArray = Array.isArray(poForm.items) ? poForm.items : []
    const newItems = [...itemsArray]
    newItems[index] = { ...newItems[index], [field]: value }
    setPoForm({ ...poForm, items: newItems })
  }
  
  const handleRemovePOItem = (index: number) => {
    const itemsArray = Array.isArray(poForm.items) ? poForm.items : []
    setPoForm({
      ...poForm,
      items: itemsArray.filter((_, i) => i !== index)
    })
    // Reindex quantities and prices after removal
    const newQuantities: Record<number, string> = {}
    const newPrices: Record<number, string> = {}
    itemsArray.forEach((_, i) => {
      if (i < index) {
        newQuantities[i] = poItemQuantities[i] || poForm.items[i]?.quantity?.toString() || "1"
        newPrices[i] = poItemPrices[i] || poForm.items[i]?.unitPrice?.toString() || ""
      } else if (i > index) {
        newQuantities[i - 1] = poItemQuantities[i] || poForm.items[i]?.quantity?.toString() || "1"
        newPrices[i - 1] = poItemPrices[i] || poForm.items[i]?.unitPrice?.toString() || ""
      }
    })
    setPoItemQuantities(newQuantities)
    setPoItemPrices(newPrices)
  }
  
  const handleCreatePurchaseOrder = async () => {
    if (!selectedSupplier) {
      alert('Please select a supplier')
      return
    }
    
    if (poForm.items.length === 0) {
      alert('Please add at least one item to the purchase order')
      return
    }
    
    try {
      const orderItems: PurchaseOrderItem[] = poForm.items.map((item, index) => ({
        id: `temp-${index}`,
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      }))
      
      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const orderNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrdersArray.length + 1).padStart(4, '0')}`
      
      await addPurchaseOrder({
        orderNumber,
        supplierId: selectedSupplier.id,
        supplierName: selectedSupplier.name,
        items: orderItems,
        totalAmount,
        status: "draft",
        orderDate: new Date(),
        expectedDeliveryDate: poForm.expectedDeliveryDate ? new Date(poForm.expectedDeliveryDate) : undefined,
        notes: poForm.notes || undefined
      })
      
      // Reset form
      setPoForm({
        expectedDeliveryDate: "",
        notes: "",
        items: []
      })
      setSelectedSupplier(null)
      setIsCreatePOOpen(false)
      toast.success('Purchase order created successfully')
    } catch (error) {
      console.error('Error creating purchase order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create purchase order. Please try again.'
      toast.error(errorMessage)
    }
  }

  // Helper function to find inventory item by name
  const findInventoryItemByName = (name: string) => {
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    return inventoryArray.find(item => 
      item.name.toLowerCase() === name.toLowerCase()
    ) || null
  }

  const handleReceiveDelivery = async (orderId: string) => {
    try {
      const order = purchaseOrdersArray.find(po => po.id === orderId)
      if (!order) {
        toast.error('Order not found')
        return
      }

      // Validate order status - can only receive pending/draft orders
      if (order.status === "received") {
        toast.error('This order has already been received')
        return
      }
      
      if (order.status === "cancelled") {
        toast.error('Cannot receive a cancelled order')
        return
      }

      // Validate order has items
      if (!order.items || order.items.length === 0) {
        toast.error('Cannot receive an order with no items')
        return
      }

      // Update purchase order status to received
      await updatePurchaseOrder(orderId, {
        status: "received",
        actualDeliveryDate: new Date()
      })

      // Reload inventory to get latest state before adding items
      await loadDataOnDemand('inventory', true)
      await new Promise(resolve => setTimeout(resolve, 300))

      const inventoryArray = Array.isArray(inventory) ? inventory : []
      const addedItems: string[] = []
      const updatedItems: string[] = []
      const errors: string[] = []

      // Automatically add items to inventory
      for (const item of order.items) {
        try {
          // Validate item data
          if (!item.itemName || !item.quantity || item.quantity <= 0) {
            errors.push(`Invalid item: ${item.itemName || 'Unknown'}`)
            continue
          }

          // Check if item already exists in inventory (case-insensitive)
          const existingItem = inventoryArray.find(invItem => 
            invItem.name.toLowerCase().trim() === item.itemName.toLowerCase().trim()
          )
          
          if (existingItem) {
            // Update existing inventory item
            await updateInventoryItem(existingItem.id, {
              quantity: existingItem.quantity + item.quantity
            })
            updatedItems.push(`${item.itemName} (+${item.quantity} ${item.unit})`)
          } else {
            // Create new inventory item (assume raw material)
            await addInventoryItem({
              name: item.itemName.trim(),
              type: "raw",
              quantity: item.quantity,
              unit: item.unit || "pieces",
              minStock: 0
            })
            addedItems.push(`${item.itemName} (${item.quantity} ${item.unit || "pieces"})`)
          }
        } catch (itemError) {
          const errorMsg = itemError instanceof Error ? itemError.message : 'Unknown error'
          console.error(`Error adding ${item.itemName} to inventory:`, itemError)
          errors.push(`${item.itemName}: ${errorMsg}`)
          // Continue with other items even if one fails
        }
      }

      // Reload inventory to update UI
      await loadDataOnDemand('inventory', true)
      await loadDataOnDemand('purchaseOrders', true)

      // Show success message with details
      if (errors.length > 0) {
        toast.warning(
          `Order received with some errors:\n${addedItems.length > 0 ? `Added: ${addedItems.join(', ')}\n` : ''}${updatedItems.length > 0 ? `Updated: ${updatedItems.join(', ')}\n` : ''}Errors: ${errors.join(', ')}`,
          { duration: 5000 }
        )
      } else {
        const successMsg = [
          addedItems.length > 0 && `Added: ${addedItems.join(', ')}`,
          updatedItems.length > 0 && `Updated: ${updatedItems.join(', ')}`
        ].filter(Boolean).join('\n')
        
        toast.success(
          `Purchase order marked as received.${successMsg ? `\n${successMsg}` : ''}`,
          { duration: 4000 }
        )
      }
    } catch (error) {
      console.error('Error receiving delivery:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark order as received. Please try again.'
      toast.error(errorMessage)
    }
  }

  return (
    <ProtectedRoute permission="viewSuppliers">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Supply Chain</h1>
            <p className="text-muted-foreground mt-1">Manage suppliers and purchase orders.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsAddSupplierOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suppliersArray.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active suppliers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting delivery</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrdersArray.length}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="suppliers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suppliers">Suppliers ({suppliersArray.length})</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders ({purchaseOrdersArray.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No suppliers found.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSuppliers.map((supplier) => (
                  <SupplierCard
                    key={supplier.id}
                    supplier={supplier}
                    canEdit={true}
                    onCreateOrder={handleCreateOrder}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Purchase Orders</CardTitle>
                <CardDescription>Track your orders and deliveries</CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseOrdersArray.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No purchase orders found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchaseOrdersArray.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-medium">{order.orderNumber}</p>
                            <Badge variant={getStatusVariant(order.status)} className="capitalize">
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{order.supplierName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""} • {formatCurrency(order.totalAmount, currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {order.status === "received"
                              ? order.actualDeliveryDate?.toLocaleDateString()
                              : order.expectedDeliveryDate?.toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.status === "received" ? "Delivered" : "Expected"}
                          </p>
                          <Button variant="ghost" size="sm" className="mt-2" asChild>
                            <Link href={`/${slug}/supply-chain/orders/${order.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isCreatePOOpen} onOpenChange={setIsCreatePOOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>Create a new purchase order for raw materials</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="poSupplier">Supplier</Label>
                <Input 
                  id="poSupplier" 
                  value={selectedSupplier?.name || ""} 
                  placeholder="Select a supplier" 
                  readOnly 
                />
                {!selectedSupplier && (
                  <p className="text-sm text-muted-foreground">Please select a supplier from the suppliers tab first</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddPOItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                {poForm.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items added yet. Click "Add Item" to add items to this purchase order.</p>
                ) : (
                  <div className="space-y-4 border rounded-lg p-4">
                    {poForm.items.map((item, index) => {
                      // Get supplier products for dropdown
                      const supplierProducts = selectedSupplier?.products || []
                      const hasProducts = supplierProducts.length > 0
                      
                      return (
                        <div key={index} className="space-y-3 p-3 border rounded-md bg-muted/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Item Name</Label>
                              {hasProducts ? (
                                <Select
                                  value={item.itemName}
                                  onValueChange={(value) => handleUpdatePOItem(index, 'itemName', value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select item from supplier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {supplierProducts.map((product) => (
                                      <SelectItem key={product} value={product}>
                                        {product}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleUpdatePOItem(index, 'itemName', e.target.value)}
                                  placeholder="e.g., Flour"
                                  disabled={!selectedSupplier}
                                />
                              )}
                              {!hasProducts && selectedSupplier && (
                                <p className="text-xs text-muted-foreground">No products listed for this supplier. Add products when creating the supplier.</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={poItemQuantities[index] ?? (item.quantity?.toString() || "1")}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Allow empty string and numbers
                                  if (value === '' || /^\d+\.?\d*$/.test(value)) {
                                    setPoItemQuantities(prev => ({ ...prev, [index]: value }))
                                    handleUpdatePOItem(index, 'quantity', value === '' ? 1 : Number.parseFloat(value) || 1)
                                  }
                                }}
                                onBlur={(e) => {
                                  // Ensure valid number on blur
                                  const value = e.target.value
                                  const numValue = value === '' ? 1 : Number.parseFloat(value) || 1
                                  handleUpdatePOItem(index, 'quantity', numValue)
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Unit</Label>
                              <Input
                                value={item.unit}
                                onChange={(e) => handleUpdatePOItem(index, 'unit', e.target.value)}
                                placeholder="kg"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Unit Price</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={poItemPrices[index] ?? (item.unitPrice?.toString() || "")}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Allow empty string and numbers with optional decimal point
                                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                    setPoItemPrices(prev => ({ ...prev, [index]: value }))
                                    handleUpdatePOItem(index, 'unitPrice', value === '' ? 0 : Number.parseFloat(value) || 0)
                                  }
                                }}
                                onBlur={(e) => {
                                  // Ensure valid number on blur
                                  const value = e.target.value
                                  const numValue = value === '' ? 0 : Number.parseFloat(value) || 0
                                  handleUpdatePOItem(index, 'unitPrice', numValue)
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Total</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={formatCurrency(item.quantity * item.unitPrice, currency)}
                                  readOnly
                                  className="flex-1 font-semibold"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemovePOItem(index)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDelivery">Expected Delivery Date</Label>
                <Input 
                  id="expectedDelivery" 
                  type="date" 
                  value={poForm.expectedDeliveryDate}
                  onChange={(e) => setPoForm({ ...poForm, expectedDeliveryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Additional notes or instructions" 
                  rows={3}
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePOOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePurchaseOrder}
                disabled={!selectedSupplier || poForm.items.length === 0}
              >
                Create Purchase Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Supplier Dialog */}
        <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Supplier</DialogTitle>
              <DialogDescription>Enter supplier information and contact details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplierName">Supplier Name</Label>
                  <Input 
                    id="supplierName" 
                    placeholder="e.g., ABC Supplies Inc." 
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input 
                    id="contactPerson" 
                    placeholder="e.g., John Doe"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="contact@supplier.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+63 2 1234 5678"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  placeholder="123 Street, City"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="products">Products (comma-separated)</Label>
                <Textarea 
                  id="products" 
                  placeholder="Flour, Sugar, Eggs" 
                  rows={3}
                  value={supplierForm.products}
                  onChange={(e) => setSupplierForm({ ...supplierForm, products: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSupplier}
                disabled={!supplierForm.name || !supplierForm.contactPerson || !supplierForm.email}
              >
                Add Supplier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
