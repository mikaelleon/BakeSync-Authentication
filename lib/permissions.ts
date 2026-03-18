import type { UserRole } from "./auth-context"

export const PERMISSIONS = {
  // Dashboard
  viewDashboard: ["owner", "baker", "cashier"],

  // Recipes
  viewRecipes: ["owner", "baker"],
  createRecipe: ["owner"],
  editRecipe: ["owner"],
  deleteRecipe: ["owner"],

  // Inventory
  viewInventory: ["owner", "baker", "cashier"],
  viewRawMaterialsOnly: ["baker"],
  addInventory: ["owner"],
  editInventory: ["owner"],
  deleteInventory: ["owner"],
  logProduction: ["owner", "baker"],

  // Production
  viewProductionLogs: ["owner", "baker"],
  createProductionLog: ["owner", "baker"],

  // Supply Chain
  viewSuppliers: ["owner"],
  addSupplier: ["owner"],
  editSupplier: ["owner"],
  deleteSupplier: ["owner"],
  managePurchaseOrders: ["owner"],
  createPurchaseOrder: ["owner"],
  receiveDelivery: ["owner"],

  // POS
  accessPOS: ["owner", "cashier"],
  viewSalesHistory: ["owner", "cashier"],
  processSale: ["owner", "cashier"],

  // Financial
  viewFinancials: ["owner"],
  manageExpenses: ["owner"],
  manageRevenue: ["owner"],
  generateReports: ["owner"],

  // Team Management
  manageTeam: ["owner"],
  viewTeam: ["owner"],
  inviteMembers: ["owner"],
  manageMemberRoles: ["owner"],
  removeMembers: ["owner"],
} as const

export function hasPermission(userRole: UserRole, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(userRole)
}
