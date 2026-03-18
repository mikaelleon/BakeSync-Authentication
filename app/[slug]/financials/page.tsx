"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, TrendingDown, Receipt, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Expense, ExpenseCategory, Revenue, RevenueCategory } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { getBakeshopInfo } from "@/lib/environment-data-loader"
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency-utils"

export default function FinancialsPage() {
  const { user } = useAuth()
  const { sales, purchaseOrders, loadDataOnDemand } = useDataStore()
  const searchParams = useSearchParams()
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(searchParams.get("action") === "add-expense")
  const [isAddRevenueOpen, setIsAddRevenueOpen] = useState(searchParams.get("action") === "add-revenue")
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  
  // Load sales, purchase orders, and currency in parallel (non-blocking)
  // Only load once when user is available
  useEffect(() => {
    if (!user) return
    
    // Load in background - don't block rendering
    // loadDataOnDemand will check if data is already loaded
    const loadData = async () => {
      // Load data in parallel
      const [bakeshopInfo] = await Promise.all([
        getBakeshopInfo(user, true).catch(() => null), // Use cache
        loadDataOnDemand('sales').catch(() => {}),
        loadDataOnDemand('purchaseOrders').catch(() => {})
      ])
      
      if (bakeshopInfo?.currency) {
        setCurrency(bakeshopInfo.currency)
      }
    }
    
    loadData()
  }, [user?.id]) // Only depend on user.id to prevent unnecessary reloads
  
  // Load manual expenses and revenue from localStorage
  const loadFromStorage = <T,>(key: string): T[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      // Convert date strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }))
    } catch {
      return []
    }
  }

  const saveToStorage = <T,>(key: string, data: T[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }

  const [manualExpenses, setManualExpenses] = useState<Expense[]>(() => 
    loadFromStorage<Expense>('bakesync_manual_expenses')
  )
  const [manualRevenue, setManualRevenue] = useState<Revenue[]>(() => 
    loadFromStorage<Revenue>('bakesync_manual_revenue')
  )

  // Save to localStorage whenever expenses or revenue change
  useEffect(() => {
    saveToStorage('bakesync_manual_expenses', manualExpenses)
  }, [manualExpenses])

  useEffect(() => {
    saveToStorage('bakesync_manual_revenue', manualRevenue)
  }, [manualRevenue])

  // Memoize financial metrics calculations
  const financialMetrics = useMemo(() => {
    const salesArray = Array.isArray(sales) ? sales : []
    const purchaseOrdersArray = Array.isArray(purchaseOrders) ? purchaseOrders : []
    
    // Revenue from POS sales
    const salesRevenue = salesArray.reduce((sum, sale) => sum + (sale.total || 0), 0)
    // Manual revenue entries
    const manualRevenueTotal = manualRevenue.reduce((sum, rev) => sum + (rev.amount || 0), 0)
    // Total revenue
    const totalRevenue = salesRevenue + manualRevenueTotal
    
    // Expenses from purchase orders (only received orders)
    const purchaseOrderExpenses = purchaseOrdersArray
      .filter((po) => po.status === "received")
      .reduce((sum, po) => sum + (po.totalAmount || 0), 0)
    // Manual expense entries
    const manualExpensesTotal = manualExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    // Total expenses (excluding COGS)
    const totalExpenses = purchaseOrderExpenses + manualExpensesTotal
    
    // Cost of Goods Sold (COGS) - approximate based on purchase orders for raw materials
    const cogs = purchaseOrderExpenses * 0.6
    
    // Gross profit = Revenue - COGS
    const grossProfit = totalRevenue - cogs
    // Net profit = Revenue - Total Expenses (including COGS)
    const netProfit = totalRevenue - totalExpenses - cogs
    // Profit margin percentage
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    const expensesByCategory = manualExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0)
        return acc
      },
      {} as Record<ExpenseCategory, number>,
    )

    return {
      salesRevenue,
      manualRevenueTotal,
      totalRevenue,
      purchaseOrderExpenses,
      manualExpensesTotal,
      totalExpenses,
      cogs,
      grossProfit,
      netProfit,
      profitMargin,
      expensesByCategory
    }
  }, [sales, purchaseOrders, manualRevenue, manualExpenses])

  const {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    expensesByCategory,
    manualRevenueTotal,
    manualExpensesTotal
  } = financialMetrics

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newExpense: Expense = {
      id: `exp${Date.now()}`,
      category: formData.get("category") as ExpenseCategory,
      description: formData.get("description") as string,
      amount: Number.parseFloat(formData.get("amount") as string),
      date: new Date(formData.get("date") as string),
      isAutomated: false,
      createdBy: user?.name || "Unknown",
    }
    setManualExpenses([newExpense, ...manualExpenses])
    setIsAddExpenseOpen(false)
  }

  const handleAddRevenue = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newRevenue: Revenue = {
      id: `rev${Date.now()}`,
      category: formData.get("category") as RevenueCategory,
      description: formData.get("description") as string,
      amount: Number.parseFloat(formData.get("amount") as string),
      date: new Date(formData.get("date") as string),
      isAutomated: false,
      createdBy: user?.name || "Unknown",
    }
    setManualRevenue([newRevenue, ...manualRevenue])
    setIsAddRevenueOpen(false)
  }

  return (
    <ProtectedRoute permission="viewFinancials">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
            <p className="text-muted-foreground mt-1">Track revenue, expenses, and profitability.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsAddRevenueOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Revenue
            </Button>
          <Button onClick={() => setIsAddExpenseOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Expense
          </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue, currency)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {manualRevenue.length > 0 
                  ? `${formatCurrency(manualRevenueTotal, currency)} from ${manualRevenue.length} manual entry${manualRevenue.length !== 1 ? 'ies' : 'y'}`
                  : 'No revenue recorded yet'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses, currency)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {manualExpenses.length > 0
                  ? `${formatCurrency(manualExpensesTotal, currency)} from ${manualExpenses.length} expense${manualExpenses.length !== 1 ? 's' : ''}`
                  : 'No expenses recorded yet'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(netProfit, currency)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue - Expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitMargin >= 0 ? "text-success" : "text-destructive"}`}>
                {profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Net profit / Revenue</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manual Revenue</CardTitle>
                <CardDescription>Manually recorded revenue entries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {manualRevenue.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No manual revenue recorded yet.</p>
                      <p className="text-sm mt-2">Click "Record Revenue" to add an entry.</p>
                    </div>
                  ) : (
                    manualRevenue.map((revenue) => (
                      <div key={revenue.id} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{revenue.description}</p>
                            <Badge variant="outline" className="capitalize">
                              {revenue.category.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Recorded by {revenue.createdBy}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-success">{formatCurrency(revenue.amount, currency)}</p>
                          <p className="text-xs text-muted-foreground">{revenue.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* POS Sales section removed - using only manual revenue for testing */}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Operational Expenses</CardTitle>
                <CardDescription>Manually recorded business expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {manualExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{expense.description}</p>
                          <Badge variant="outline" className="capitalize">
                            {expense.category.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Recorded by {expense.createdBy}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-destructive">{formatCurrency(expense.amount, currency)}</p>
                        <p className="text-xs text-muted-foreground">{expense.date.toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Purchase Orders section removed - using only manual expenses for testing */}
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown by Category</CardTitle>
                  <CardDescription>Operational expenses by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(expensesByCategory).map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-primary" />
                          <span className="text-sm capitalize">{category.replace("_", " ")}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(amount, currency)}</span>
                      </div>
                    ))}
                    {Object.keys(expensesByCategory).length > 0 && (
                      <div className="flex items-center justify-between pt-2 border-t font-bold">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(totalExpenses, currency)}</span>
                      </div>
                    )}
                    {Object.keys(expensesByCategory).length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        No expenses recorded yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profitability Analysis</CardTitle>
                  <CardDescription>Revenue vs expenses breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Revenue</span>
                        <span className="font-medium text-success">{formatCurrency(totalRevenue, currency)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Expenses</span>
                        <span className="font-medium text-destructive">{formatCurrency(totalExpenses, currency)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-destructive"
                          style={{ width: `${(totalExpenses / totalRevenue) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Net Profit</span>
                        <span className={`font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(netProfit, currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Profit Margin</span>
                        <span className={`font-medium ${profitMargin >= 0 ? "text-success" : "text-destructive"}`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Expense</DialogTitle>
              <DialogDescription>Add a new operational expense to your financial records</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="other" required>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="salaries">Salaries</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="e.g., Monthly electricity bill"
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ({getCurrencySymbol(currency)})</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddExpenseOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Expense</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddRevenueOpen} onOpenChange={setIsAddRevenueOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Revenue</DialogTitle>
              <DialogDescription>Add a new revenue entry to your financial records</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddRevenue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revenue-category">Category</Label>
                <Select name="category" defaultValue="other" required>
                  <SelectTrigger id="revenue-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="custom_orders">Custom Orders</SelectItem>
                    <SelectItem value="events">Events</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue-description">Description</Label>
                <Textarea
                  id="revenue-description"
                  name="description"
                  placeholder="e.g., Custom wedding cake order"
                  required
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue-amount">Amount ({getCurrencySymbol(currency)})</Label>
                  <Input id="revenue-amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue-date">Date</Label>
                  <Input
                    id="revenue-date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddRevenueOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Revenue</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}