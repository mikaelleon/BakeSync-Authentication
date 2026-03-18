"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

import { ArrowRight, ArrowLeft, SkipForward, Plus, Trash2 } from "lucide-react"

interface Step3Props {
  data: any
  onUpdate: (data: any) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

interface Supplier {
  name: string
  contactPerson: string
  email: string
  phone: string
}

export function OnboardingStep3({ data, onUpdate, onNext, onBack, onSkip }: Step3Props) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(
    data.suppliers || []
  )

  const [newSupplier, setNewSupplier] = useState<Supplier>({
    name: "",
    contactPerson: "",
    email: "",
    phone: ""
  })

  const addSupplier = () => {
    if (newSupplier.name.trim() && newSupplier.contactPerson.trim()) {
      setSuppliers([...suppliers, { ...newSupplier }])
      setNewSupplier({
        name: "",
        contactPerson: "",
        email: "",
        phone: ""
      })
    }
  }

  const removeSupplier = (index: number) => {
    setSuppliers(suppliers.filter((_, i) => i !== index))
  }

  const updateSupplier = (index: number, field: keyof Supplier, value: string) => {
    const updated = [...suppliers]
    updated[index] = { ...updated[index], [field]: value }
    setSuppliers(updated)
  }

  const handleNext = () => {
    onUpdate({ suppliers })
    onNext()
  }

  const isFormValid = newSupplier.name.trim() && newSupplier.contactPerson.trim()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Add your preferred suppliers</h1>
        <p className="text-muted-foreground mb-4">
          Set up your supplier network to streamline purchasing and inventory management
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Step 3 of 5</span>
          <Progress value={60} className="w-32" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
          <CardDescription>
            Add at least one supplier to get started with purchase order management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new supplier form */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-medium mb-4">Add New Supplier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierName">Supplier Name *</Label>
                <Input
                  id="supplierName"
                  placeholder="e.g., ABC Flour Company"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  placeholder="e.g., John Smith"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@abcflour.com"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+63 912 345 6789"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={addSupplier}
              disabled={!isFormValid}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          {/* Existing suppliers */}
          {suppliers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Added Suppliers ({suppliers.length})</h3>
              <div className="space-y-3">
                {suppliers.map((supplier, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupplier(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Contact: {supplier.contactPerson}</div>
                      {supplier.email && <div>Email: {supplier.email}</div>}
                      {supplier.phone && <div>Phone: {supplier.phone}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No suppliers added yet. Add at least one supplier to get started.</p>
            </div>
          )}

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onSkip}
                className="flex items-center space-x-2"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip</span>
              </Button>
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
