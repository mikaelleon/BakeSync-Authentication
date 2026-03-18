export interface Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
}

export type RecipeCategory = 
  | "cake"
  | "pastries"
  | "bread"
  | "cookies"
  | "drinks"
  | "desserts"
  | "other"

export type RecipeTag = 
  | "sweet"
  | "sugar-free"
  | "gluten-free"
  | "vegan"
  | "vegetarian"
  | "dairy-free"
  | "nut-free"
  | "low-carb"
  | "high-protein"
  | "organic"
  | "seasonal"
  | "custom"

export interface Recipe {
  id: string
  name: string
  yield: number
  yieldUnit: string
  ingredients: Ingredient[]
  instructions: string
  price?: number // Price per piece/unit for POS products created from this recipe
  category: RecipeCategory // Recipe category
  tags: RecipeTag[] // Recipe tags (multiple selections)
  createdAt: Date
  updatedAt: Date
}

export type InventoryType = "raw" | "finished"

export interface InventoryItem {
  id: string
  name: string
  type: InventoryType
  quantity: number
  unit: string
  minStock: number
  price?: number // Selling price per unit (for finished goods)
  expirationDate?: Date
  deliveryDate?: Date
  lastUpdated: Date
}

export interface ProductionLog {
  id: string
  recipeId: string
  recipeName: string
  quantityProduced: number
  productionDate: Date
  bakerName: string
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  products: string[]
  createdAt: Date
}

export type PurchaseOrderStatus = "draft" | "pending" | "received" | "cancelled"

export interface PurchaseOrderItem {
  id: string
  itemName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: string
  supplierName: string
  items: PurchaseOrderItem[]
  totalAmount: number
  status: PurchaseOrderStatus
  orderDate: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  notes?: string
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  imageUrl?: string
  inStock: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Sale {
  id: string
  orderNumber: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: "cash" | "card" | "gcash"
  amountPaid: number
  change: number
  cashierName: string
  saleDate: Date
}

export type ExpenseCategory =
  | "raw_materials"
  | "rent"
  | "utilities"
  | "salaries"
  | "marketing"
  | "maintenance"
  | "other"

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: Date
  isAutomated: boolean // true for PO expenses, false for manual entries
  referenceId?: string // PO ID if automated
  createdBy: string
}

export type RevenueCategory =
  | "sales"
  | "catering"
  | "custom_orders"
  | "events"
  | "wholesale"
  | "other"

export interface Revenue {
  id: string
  category: RevenueCategory
  description: string
  amount: number
  date: Date
  isAutomated: boolean // true for POS sales, false for manual entries
  referenceId?: string // Sale ID if automated
  createdBy: string
}
