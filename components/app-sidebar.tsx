"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { hasPermission } from "@/lib/permissions"
import { generateUrlPath, parseUrlPath } from "@/lib/account-detection"
import { useMemo, useCallback, memo } from "react"
import type React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  BookOpen,
  Package,
  Truck,
  ShoppingCart,
  DollarSign,
  Croissant,
  LogOut,
  ClipboardList,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: "viewDashboard" as const,
    category: "general",
  },
  {
    title: "Production Log",
    href: "/production",
    icon: ClipboardList,
    permission: "logProduction" as const,
    category: "production",
  },
  {
    title: "Recipes",
    href: "/recipes",
    icon: BookOpen,
    permission: "viewRecipes" as const,
    category: "production",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    permission: "viewInventory" as const,
    category: "production",
  },
  {
    title: "Supply Chain",
    href: "/supply-chain",
    icon: Truck,
    permission: "viewSuppliers" as const,
    category: "management",
  },
  {
    title: "Point of Sale",
    href: "/pos",
    icon: ShoppingCart,
    permission: "accessPOS" as const,
    category: "sales",
  },
  {
    title: "Financials",
    href: "/financials",
    icon: DollarSign,
    permission: "viewFinancials" as const,
    category: "management",
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
    permission: "manageTeam" as const,
    category: "management",
  },
]

// Map routes to their required data types for prefetching
const routeDataMap: Record<string, string[]> = {
  '/dashboard': ['recipes', 'inventory', 'sales', 'productionLogs'],
  '/inventory': ['inventory'],
  '/recipes': ['recipes'],
  '/production': ['recipes', 'productionLogs'],
  '/supply-chain': ['suppliers', 'purchaseOrders', 'inventory'],
  '/pos': ['products'],
  '/financials': ['sales'],
  '/team': []
}

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { loadDataOnDemand } = useDataStore()

  if (!user) return null

  // Prefetch data on link hover (non-blocking, fire and forget)
  const handleLinkHover = useCallback((href: string) => {
    // Extract the path from the full href (remove slug)
    const path = href.split('/').slice(2).join('/') || '/dashboard'
    const dataTypes = routeDataMap[path] || []
    
    // Prefetch all required data types in parallel (non-blocking)
    // Don't await - let it happen in background
    if (dataTypes.length > 0) {
      // Fire and forget - don't block navigation
      Promise.all(dataTypes.map(type => loadDataOnDemand(type).catch(() => {}))).catch(() => {})
    }
  }, [loadDataOnDemand])
  
  // Handle click for instant navigation
  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Allow default navigation to proceed immediately
    // Don't block on data loading - pages will load data themselves
    const path = href.split('/').slice(2).join('/') || '/dashboard'
    const dataTypes = routeDataMap[path] || []
    
    // Start loading in background (non-blocking)
    if (dataTypes.length > 0) {
      Promise.all(dataTypes.map(type => loadDataOnDemand(type).catch(() => {}))).catch(() => {})
    }
  }, [loadDataOnDemand])

  // Memoize visible items to prevent unnecessary recalculations
  const visibleItems = useMemo(() => {
    return navigationItems.filter((item) => hasPermission(user.role, item.permission))
  }, [user.role])
  
  // Extract current slug from pathname as fallback
  const currentSlug = useMemo(() => {
    const { slug } = parseUrlPath(pathname)
    return slug || 'demo'
  }, [pathname])

  // Memoize items with URLs to prevent unnecessary URL generation
  const itemsWithUrls = useMemo(() => {
    // If user doesn't have bakeshopSlug, use current slug from pathname
    const userWithSlug = user.bakeshopSlug ? user : { ...user, bakeshopSlug: currentSlug }
    return visibleItems.map(item => ({
      ...item,
      href: generateUrlPath(item.href, userWithSlug)
    }))
  }, [visibleItems, user, currentSlug])
  
  // Memoize grouped items to prevent unnecessary grouping
  const groupedItems = useMemo(() => {
    return itemsWithUrls.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, typeof itemsWithUrls>)
  }, [itemsWithUrls])

  // Memoize category label function
  const getCategoryLabel = useCallback((category: string) => {
    switch (category) {
      case "general":
        return "General"
      case "production":
        return "Production"
      case "sales":
        return "Sales"
      case "management":
        return "Management"
      default:
        return "Other"
    }
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Croissant className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">BakeSync</h2>
            <p className="text-xs text-sidebar-foreground/60">Bakery ERP</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedItems).map(([category, items]) => (
          <SidebarGroup key={category}>
            <SidebarGroupLabel>{getCategoryLabel(category)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link 
                          href={item.href}
                          prefetch={true}
                          onMouseEnter={() => handleLinkHover(item.href)}
                          onClick={(e) => handleLinkClick(e, item.href)}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name || "User"}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</span>
              <div className={`h-2 w-2 rounded-full ${
                user.role === 'owner' ? 'bg-green-500' : 
                user.role === 'baker' ? 'bg-blue-500' : 
                'bg-orange-500'
              }`} />
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start bg-transparent" 
          onClick={() => logout().catch(console.error)}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
})
