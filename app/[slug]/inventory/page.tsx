"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { hasPermission } from "@/lib/permissions"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Package, AlertTriangle, Clock, Edit, Save, X, TrendingUp, TrendingDown, Trash2 } from "lucide-react"
import { InventoryTable } from "@/components/inventory-table"
import type { InventoryItem } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { differenceInDays } from "date-fns"

export default function InventoryPage() {
  return (
    <ProtectedRoute permission="viewInventory">
      <InventoryPageContent />
    </ProtectedRoute>
  )
}

function InventoryPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { 
    inventory, 
    addInventoryItem, 
    updateInventoryItem,
    deleteInventoryItem,
    bulkUpdateInventory,
    loadDataOnDemand
  } = useDataStore()
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  // Load inventory data when component mounts (non-blocking)
  useEffect(() => {
    // Only load if inventory is empty, we have a user, and we haven't loaded yet
    // Load in background - don't block rendering
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    if (inventoryArray.length === 0 && user && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      // Load in background without blocking
      loadDataOnDemand('inventory').catch(() => {}).finally(() => {
        hasLoadedRef.current = false
      })
    }
  }, [inventory, user, loadDataOnDemand])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(searchParams.get("action") === "add")
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<"adjust" | "set">("adjust")
  const [bulkValue, setBulkValue] = useState("")
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [editMinStock, setEditMinStock] = useState("")
  
  // Add item form state
  const [newItem, setNewItem] = useState({
    name: "",
    type: "raw" as "raw" | "finished",
    quantity: "",
    unit: "",
    minStock: "",
    price: "", // Price per unit (for finished goods)
  })

  const canEdit = user ? hasPermission(user.role, "editInventory") : false
  const canAdd = user ? hasPermission(user.role, "addInventory") : false
  const canDelete = user ? hasPermission(user.role, "deleteInventory") : false
  const isBaker = user?.role === "baker"

  // Ensure inventory is always an array
  const inventoryArray = Array.isArray(inventory) ? inventory : []
  
  // Memoize filtered inventory
  const filteredInventory = useMemo(() => {
    return inventoryArray.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = isBaker ? item.type === "raw" : true
      return matchesSearch && matchesRole
    })
  }, [inventoryArray, searchQuery, isBaker])

  const rawMaterials = useMemo(() => 
    filteredInventory.filter((item) => item.type === "raw"),
    [filteredInventory]
  )
  
  const finishedGoods = useMemo(() => 
    filteredInventory.filter((item) => item.type === "finished"),
    [filteredInventory]
  )

  // Memoize stats calculations
  const lowStockCount = useMemo(() => 
    inventoryArray.filter((item) => item.minStock !== undefined && item.quantity <= item.minStock).length,
    [inventoryArray]
  )
  
  const criticalStockCount = useMemo(() => 
    inventoryArray.filter((item) => item.minStock !== undefined && item.quantity <= item.minStock * 0.5).length,
    [inventoryArray]
  )
  
  const expiringCount = useMemo(() => 
    inventoryArray.filter(
      (item) => item.expirationDate && differenceInDays(item.expirationDate, new Date()) <= 7,
    ).length,
    [inventoryArray]
  )

  const handleEdit = useCallback((item: InventoryItem) => {
    setEditingItem(item)
    setEditQuantity(item.quantity.toString())
    setEditMinStock(item.minStock?.toString() ?? "0")
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingItem) {
      updateInventoryItem(editingItem.id, editingItem)
      setEditingItem(null)
    }
  }, [editingItem, updateInventoryItem])

  const handleDelete = useCallback(async (item: InventoryItem) => {
    try {
      await deleteInventoryItem(item.id)
      setItemToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete inventory item")
    }
  }, [deleteInventoryItem])

  const handleBulkEdit = async () => {
    if (selectedItems.length === 0) {
      setError("Please select at least one item")
      return
    }
    
    if (!bulkValue || bulkValue.trim() === "") {
      setError("Please enter a value")
      return
    }

    const value = Number.parseFloat(bulkValue)
    if (isNaN(value)) {
      setError("Please enter a valid number")
      return
    }

    // Validate that setting quantities won't result in negative values
    if (bulkAction === "set" && value < 0) {
      setError("Quantity cannot be negative")
      return
    }

    try {
      const updates = selectedItems.map(itemId => {
        const item = inventoryArray.find(i => i.id === itemId)
        if (!item) {
          throw new Error(`Item with ID ${itemId} not found`)
        }
        
        const newQuantity = bulkAction === "adjust" 
          ? Math.max(0, item.quantity + value)
          : value
        
        return { id: itemId, quantity: newQuantity }
      })

      await bulkUpdateInventory(updates)
      setSelectedItems([])
      setBulkValue("")
      setIsBulkEditOpen(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update inventory items")
    }
  }

  const handleAddItem = async () => {
    // Validate required fields
    if (!newItem.name.trim()) {
      setError("Item name is required")
      return
    }
    
    if (!newItem.unit.trim()) {
      setError("Unit is required")
      return
    }
    
    const quantity = Number.parseFloat(newItem.quantity)
    if (isNaN(quantity) || quantity < 0) {
      setError("Quantity must be a valid number")
      return
    }
    
    const minStock = Number.parseFloat(newItem.minStock)
    if (isNaN(minStock) || minStock < 0) {
      setError("Minimum stock must be a valid number")
      return
    }
    
    // Validate price for finished goods
    if (newItem.type === "finished") {
      const price = Number.parseFloat(newItem.price)
      if (isNaN(price) || price < 0) {
        setError("Price must be a valid number (0 or greater)")
        return
      }
    }
    
    try {
      await addInventoryItem({
        name: newItem.name.trim(),
        type: newItem.type,
        quantity: Number.parseFloat(newItem.quantity) || 0,
        unit: newItem.unit.trim(),
        minStock: Math.floor(Number.parseFloat(newItem.minStock) || 0),
        price: newItem.type === "finished" ? Number.parseFloat(newItem.price) : undefined,
      })
    
    setNewItem({
      name: "",
      type: "raw",
      quantity: "",
      unit: "",
      minStock: "",
      price: "",
    })
    setIsAddDialogOpen(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add inventory item")
    }
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAllItems = () => {
    setSelectedItems(filteredInventory.map(item => item.id))
  }

  const clearSelection = () => {
    setSelectedItems([])
  }


  return (
      <div className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="text-muted-foreground mt-1">
              {isBaker ? "View raw materials inventory" : "Track raw materials and finished goods"}
            </p>
          </div>
          <div className="flex gap-2">
            {canEdit && selectedItems.length > 0 && (
              <Button variant="outline" onClick={() => setIsBulkEditOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Bulk Edit ({selectedItems.length})
              </Button>
            )}
            {canAdd && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{isBaker ? "Raw Materials" : "Total Items"}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isBaker ? rawMaterials.length : inventoryArray.length}</div>
              {!isBaker && (
                <p className="text-xs text-muted-foreground mt-1">
                  {rawMaterials.length} raw, {finishedGoods.length} finished
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {criticalStockCount > 0 && <span className="text-destructive">{criticalStockCount} critical</span>}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Within 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Inventory Tables */}
        {isBaker ? (
          <Card>
            <CardHeader>
              <CardTitle>Raw Materials</CardTitle>
              <CardDescription>Current stock levels for production planning</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable items={rawMaterials} canEdit={false} canDelete={false} />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Items ({filteredInventory.length})</TabsTrigger>
              <TabsTrigger value="raw">Raw Materials ({rawMaterials.length})</TabsTrigger>
              <TabsTrigger value="finished">Finished Goods ({finishedGoods.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <InventoryTable 
                items={filteredInventory} 
                canEdit={canEdit} 
                onEdit={handleEdit}
                onDelete={(item) => setItemToDelete(item)}
                canDelete={canDelete}
                selectedItems={selectedItems}
                onToggleSelection={toggleItemSelection}
                onSelectAll={selectAllItems}
                onClearSelection={clearSelection}
              />
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <InventoryTable 
                items={rawMaterials} 
                canEdit={canEdit} 
                onEdit={handleEdit}
                onDelete={(item) => setItemToDelete(item)}
                canDelete={canDelete}
                selectedItems={selectedItems}
                onToggleSelection={toggleItemSelection}
                onSelectAll={selectAllItems}
                onClearSelection={clearSelection}
              />
            </TabsContent>

            <TabsContent value="finished" className="space-y-4">
              <InventoryTable 
                items={finishedGoods} 
                canEdit={canEdit} 
                onEdit={handleEdit}
                onDelete={(item) => setItemToDelete(item)}
                canDelete={canDelete}
                selectedItems={selectedItems}
                onToggleSelection={toggleItemSelection}
                onSelectAll={selectAllItems}
                onClearSelection={clearSelection}
              />
            </TabsContent>
          </Tabs>
        )}


        {/* Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={() => {
          setEditingItem(null)
          setEditQuantity("")
          setEditMinStock("")
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>Update quantity and stock levels for {editingItem?.name}</DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Current Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editQuantity}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setEditQuantity(value)
                          const numValue = value === '' ? 0 : Number.parseFloat(value) || 0
                          setEditingItem({ ...editingItem, quantity: numValue })
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure a valid number on blur, or set to 0 if empty
                        const value = e.target.value
                        if (value === '' || isNaN(Number.parseFloat(value))) {
                          setEditQuantity("0")
                          setEditingItem({ ...editingItem, quantity: 0 })
                        } else {
                          const numValue = Number.parseFloat(value) || 0
                          setEditQuantity(numValue.toString())
                          setEditingItem({ ...editingItem, quantity: numValue })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                    />
                    <Input value={editingItem.unit} disabled className="w-24" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock">Minimum Stock Level</Label>
                  <div className="flex gap-2">
                    <Input
                      id="minStock"
                      type="number"
                      step="1"
                      min="0"
                      value={editMinStock}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow whole numbers (integers)
                        if (value === '' || /^\d+$/.test(value)) {
                          setEditMinStock(value)
                          const numValue = value === '' ? 0 : Math.floor(Number.parseFloat(value) || 0)
                          setEditingItem({ ...editingItem, minStock: numValue })
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure a valid integer on blur, or set to 0 if empty
                        const value = e.target.value
                        if (value === '' || isNaN(Number.parseFloat(value))) {
                          setEditMinStock("0")
                          setEditingItem({ ...editingItem, minStock: 0 })
                        } else {
                          const numValue = Math.floor(Number.parseFloat(value))
                          setEditMinStock(numValue.toString())
                          setEditingItem({ ...editingItem, minStock: numValue })
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent non-numeric characters except backspace, delete, arrow keys
                        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                    />
                    <Input value={editingItem.unit} disabled className="w-24" />
                  </div>
                </div>

                {editingItem.type === "finished" && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Unit</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingItem.price || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setEditingItem({
                            ...editingItem,
                            price: value === '' ? undefined : Number.parseFloat(value) || 0
                          })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                    />
                  </div>
                )}

                {editingItem.type === "raw" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="delivery">Delivery Date</Label>
                      <Input
                        id="delivery"
                        type="date"
                        value={editingItem.deliveryDate?.toISOString().split("T")[0] || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            deliveryDate: e.target.value ? new Date(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiration">Expiration Date</Label>
                      <Input
                        id="expiration"
                        type="date"
                        value={editingItem.expirationDate?.toISOString().split("T")[0] || ""}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            expirationDate: e.target.value ? new Date(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) setError(null) // Clear error when dialog closes
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>Add a new item to your inventory</DialogDescription>
            </DialogHeader>
            {error && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newName">Item Name</Label>
                <Input 
                  id="newName" 
                  placeholder="e.g., Vanilla Extract"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newType">Type</Label>
                <Select 
                  value={newItem.type} 
                  onValueChange={(value: "raw" | "finished") => setNewItem(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger id="newType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw Material</SelectItem>
                    <SelectItem value="finished">Finished Good</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newQuantity">Quantity</Label>
                  <Input 
                    id="newQuantity" 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={newItem.quantity}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow empty string and numbers with optional decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setNewItem(prev => ({ ...prev, quantity: value }))
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent non-numeric characters except decimal point, backspace, delete, arrow keys
                      if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newUnit">Unit</Label>
                  <Input 
                    id="newUnit" 
                    placeholder="g, ml, pieces"
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newMinStock">Minimum Stock</Label>
                <Input 
                  id="newMinStock" 
                  type="number" 
                  step="1"
                  min="0"
                  placeholder="0"
                  value={newItem.minStock}
                  onChange={(e) => {
                    const value = e.target.value
                    // Only allow whole numbers (integers)
                    if (value === '' || /^\d+$/.test(value)) {
                      setNewItem(prev => ({ ...prev, minStock: value }))
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent non-numeric characters except backspace, delete, arrow keys
                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      e.preventDefault()
                    }
                  }}
                />
              </div>

              {newItem.type === "finished" && (
                <div className="space-y-2">
                  <Label htmlFor="newPrice">Price per Unit</Label>
                  <Input 
                    id="newPrice" 
                    type="number" 
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newItem.price}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow numbers and decimal point
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setNewItem(prev => ({ ...prev, price: value === '' ? '' : value }))
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent non-numeric characters except decimal point, backspace, delete, arrow keys
                      if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault()
                      }
                    }}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddItem}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Edit Dialog */}
        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit Inventory</DialogTitle>
              <DialogDescription>
                Update quantities for {selectedItems.length} selected items
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={bulkAction} onValueChange={(value: "adjust" | "set") => setBulkAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adjust">Adjust Quantity (+/-)</SelectItem>
                    <SelectItem value="set">Set Quantity (=)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkValue">
                  {bulkAction === "adjust" ? "Adjustment Amount" : "New Quantity"}
                </Label>
                <Input
                  id="bulkValue"
                  type="number"
                  placeholder={bulkAction === "adjust" ? "e.g., +10 or -5" : "e.g., 100"}
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {bulkAction === "adjust" 
                    ? "Use positive numbers to add, negative to subtract"
                    : "This will set the exact quantity for all selected items"
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label>Selected Items</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedItems.map(itemId => {
                    const item = inventoryArray.find(i => i.id === itemId)
                    return item ? (
                      <div key={itemId} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">{item.quantity} {item.unit}</span>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkEdit} disabled={!bulkValue}>
                <Save className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Inventory Item</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => itemToDelete && handleDelete(itemToDelete)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
