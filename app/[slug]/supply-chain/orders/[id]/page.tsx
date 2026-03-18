"use client"

import { use } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { MOCK_PURCHASE_ORDERS } from "@/lib/mock-data"
import { notFound } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency-utils"

export default function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  const order = MOCK_PURCHASE_ORDERS.find((po) => po.id === id)
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false)
  
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

  if (!order) {
    notFound()
  }

  const getStatusVariant = (status: typeof order.status) => {
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

  return (
    <ProtectedRoute permission="viewSuppliers">
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/supply-chain">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Supply Chain
            </Link>
          </Button>
          {order.status === "pending" && (
            <Button onClick={() => setIsReceiveDialogOpen(true)}>
              <Package className="h-4 w-4 mr-2" />
              Mark as Received
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{order.orderNumber}</h1>
            <p className="text-muted-foreground mt-1">{order.supplierName}</p>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="capitalize text-base px-4 py-2">
            {order.status}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Order Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{order.orderDate.toLocaleDateString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {order.status === "received" ? "Delivered" : "Expected Delivery"}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {order.status === "received"
                  ? order.actualDeliveryDate?.toLocaleDateString()
                  : order.expectedDeliveryDate?.toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatCurrency(order.totalAmount, currency)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>Items included in this purchase order</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity} {item.unit}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice, currency)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalPrice, currency)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total Amount
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(order.totalAmount, currency)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Receive Delivery Dialog */}
        <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Receive Delivery</DialogTitle>
              <DialogDescription>
                Mark this purchase order as received and log expiration dates for perishable items
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Actual Delivery Date</Label>
                <Input id="deliveryDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>

              <div className="space-y-3">
                <Label>Expiration Dates (for perishable items)</Label>
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Label htmlFor={`exp-${item.id}`} className="flex-1 text-sm">
                      {item.itemName}
                    </Label>
                    <Input id={`exp-${item.id}`} type="date" className="w-48" />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsReceiveDialogOpen(false)}>Confirm Receipt</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
