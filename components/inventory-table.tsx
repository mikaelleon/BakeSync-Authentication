"use client"

import { useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InventoryItem } from "@/lib/types"
import { AlertTriangle, Clock, Edit, Package, Trash2 } from "lucide-react"
import { differenceInDays } from "date-fns"
import { formatCurrency } from "@/lib/currency-utils"

interface InventoryTableProps {
  items: InventoryItem[]
  canEdit: boolean
  onEdit?: (item: InventoryItem) => void
  onDelete?: (item: InventoryItem) => void
  canDelete?: boolean
  selectedItems?: string[]
  onToggleSelection?: (itemId: string) => void
  onSelectAll?: () => void
  onClearSelection?: () => void
}

export function InventoryTable({ 
  items, 
  canEdit, 
  onEdit, 
  onDelete,
  canDelete = false,
  selectedItems = [], 
  onToggleSelection, 
  onSelectAll, 
  onClearSelection 
}: InventoryTableProps) {
  const getStockStatus = (item: InventoryItem) => {
    if (item.minStock === undefined || item.minStock === null) {
      return { label: "Good", variant: "default" as const, icon: Package }
    }
    if (item.quantity <= item.minStock * 0.5) {
      return { label: "Critical", variant: "destructive" as const, icon: AlertTriangle }
    }
    if (item.quantity <= item.minStock) {
      return { label: "Low", variant: "secondary" as const, icon: Package }
    }
    return { label: "Good", variant: "default" as const, icon: Package }
  }

  const getExpirationStatus = (expirationDate?: Date) => {
    if (!expirationDate) return null

    const daysUntilExpiry = differenceInDays(expirationDate, new Date())

    if (daysUntilExpiry < 0) {
      return { label: "Expired", variant: "destructive" as const, days: daysUntilExpiry }
    }
    if (daysUntilExpiry <= 3) {
      return { label: "Expires Soon", variant: "destructive" as const, days: daysUntilExpiry }
    }
    if (daysUntilExpiry <= 7) {
      return { label: "Expiring", variant: "secondary" as const, days: daysUntilExpiry }
    }
    return null
  }

  const allSelected = items.length > 0 && selectedItems.length === items.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length
  const selectAllCheckboxRef = useRef<HTMLButtonElement>(null)

  // Set indeterminate state on the checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      // Access the underlying button element and set indeterminate
      const button = selectAllCheckboxRef.current
      // Radix UI Checkbox renders a button, we need to check if it has an indeterminate property
      // or find the actual input element if it exists
      if ('indeterminate' in button) {
        ;(button as any).indeterminate = someSelected
      } else {
        // Try to find an input element within the button
        const input = button.querySelector('input')
        if (input) {
          input.indeterminate = someSelected
        }
      }
    }
  }, [someSelected])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {canEdit && onToggleSelection && (
              <TableHead className="w-[50px]">
                <Checkbox
                  ref={selectAllCheckboxRef}
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectAll?.()
                    } else {
                      onClearSelection?.()
                    }
                  }}
                />
              </TableHead>
            )}
            <TableHead>Item Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Min Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expiration</TableHead>
            {canEdit && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit && onToggleSelection ? 8 : canEdit ? 7 : 6} className="text-center text-muted-foreground">
                No inventory items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const stockStatus = getStockStatus(item)
              const expirationStatus = getExpirationStatus(item.expirationDate)
              const StatusIcon = stockStatus.icon
              const isSelected = selectedItems.includes(item.id)

              return (
                <TableRow key={item.id} className={isSelected ? "bg-muted/50" : ""}>
                  {canEdit && onToggleSelection && (
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(item.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {typeof item.price === 'number' ? (
                      <span>{formatCurrency(item.price)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {typeof item.price === 'number' ? (
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.minStock !== undefined && item.minStock !== null ? `${item.minStock} ${item.unit}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={stockStatus.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expirationStatus ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={expirationStatus.variant} className="gap-1">
                          <Clock className="h-3 w-3" />
                          {expirationStatus.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {expirationStatus.days > 0 ? `${expirationStatus.days}d` : "Expired"}
                        </span>
                      </div>
                    ) : item.expirationDate ? (
                      <span className="text-sm text-muted-foreground">{item.expirationDate.toLocaleDateString()}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEdit?.(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canDelete && onDelete && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onDelete(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
