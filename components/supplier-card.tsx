"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin, Edit } from "lucide-react"
import type { Supplier } from "@/lib/types"

interface SupplierCardProps {
  supplier: Supplier
  canEdit: boolean
  onEdit?: (supplier: Supplier) => void
  onCreateOrder?: (supplier: Supplier) => void
}

export function SupplierCard({ supplier, canEdit, onEdit, onCreateOrder }: SupplierCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{supplier.name}</CardTitle>
              <CardDescription>{supplier.contactPerson}</CardDescription>
            </div>
          </div>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(supplier)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{supplier.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{supplier.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{supplier.address}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Products:</p>
          <div className="flex flex-wrap gap-1">
            {supplier.products.map((product) => (
              <Badge key={product} variant="secondary" className="text-xs">
                {product}
              </Badge>
            ))}
          </div>
        </div>

        <Button variant="outline" className="w-full bg-transparent" onClick={() => onCreateOrder?.(supplier)}>
          Create Purchase Order
        </Button>
      </CardContent>
    </Card>
  )
}
