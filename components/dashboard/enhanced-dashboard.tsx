"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useDataStore } from "@/lib/data-store"
import { enhancedUserManager } from "@/lib/user-management-enhanced"
import { teamManager } from "@/lib/team-management"
import { notificationManager } from "@/lib/notification-system"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bell, 
  Users, 
  Package, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  BarChart3,
  Activity,
  Truck,
  DollarSign,
  Trash2,
  ShoppingCart,
  UserPlus,
  Factory
} from "lucide-react"
import { QuickActions } from "./quick-actions"
import { RecentActivity } from "./recent-activity"
import { PerformanceMetrics } from "./performance-metrics"
import { formatCurrency, getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currency-utils"

interface DashboardData {
  unreadNotifications: number
  recentActivity: any[]
  teamStats: {
    totalMembers: number
    activeMembers: number
    pendingInvitations: number
    roleDistribution: Record<string, number>
  }
  inventoryAlerts: number
  productionStatus: any
  quickStats: {
    todaySales: number
    todayProduction: number
    lowStockItems: number
    pendingOrders: number
  }
}

export function EnhancedDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { sales, productionLogs, inventory, purchaseOrders, loadDataOnDemand } = useDataStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bakeshopInfo, setBakeshopInfo] = useState<{ currency?: string } | null>(null)
  const hasLoadedRef = useRef(false)
  const loadingUserIdRef = useRef<string | null>(null)
  const hasInitialThemeLoaded = useRef(false)
  const hasAppliedDefaultView = useRef(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    defaultView: 'overview' as 'overview' | 'production' | 'sales' | 'inventory',
    refreshInterval: 30,
    theme: 'system' as 'light' | 'dark' | 'system'
  })
  const [userPreferences, setUserPreferences] = useState<any>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'baker' as 'baker' | 'cashier',
    message: ''
  })

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('loadDashboardData: No user, returning early')
      hasLoadedRef.current = false
      loadingUserIdRef.current = null
      return
    }

    // If force refresh, reset the loaded flag
    if (forceRefresh) {
      hasLoadedRef.current = false
      loadingUserIdRef.current = null
    }

    // Prevent reloading if we're already loading for this user or have already loaded (unless forcing refresh)
    if (!forceRefresh && loadingUserIdRef.current === user.id && hasLoadedRef.current) {
      console.log('loadDashboardData: Already loaded for this user, skipping')
      return
    }

    console.log('loadDashboardData: Starting load for user:', user.id, user.email, forceRefresh ? '(forced refresh)' : '')
    loadingUserIdRef.current = user.id
    hasLoadedRef.current = false // Reset loaded flag when starting new load

    try {
      setIsLoading(true)
      setError(null)

      // Load user profile with enhanced data
      let userProfile = null
      try {
        userProfile = await enhancedUserManager.getUserProfile(user.id)
      } catch (profileError) {
        console.warn('Error loading user profile, will try fallback:', profileError)
        // Continue to fallback logic
      }
      
      // For demo users, use mock data instead of requiring bakeshopId
      const isDemoUser = user.email.endsWith('@bakesync.com')
      
      // Load bakeshop info for currency
      const { getBakeshopInfo } = await import('@/lib/environment-data-loader')
      let fetchedBakeshopInfo = await getBakeshopInfo(user)
      if (fetchedBakeshopInfo) {
        setBakeshopInfo(fetchedBakeshopInfo)
      }
      
      // If getUserProfile fails (no membership or error), try to get bakeshop info directly
      if (!userProfile?.bakeshopId && !isDemoUser) {
        try {
          if (!fetchedBakeshopInfo) {
            fetchedBakeshopInfo = await getBakeshopInfo(user)
            if (fetchedBakeshopInfo) {
              setBakeshopInfo(fetchedBakeshopInfo)
            }
          }
          
          if (fetchedBakeshopInfo) {
            // Create a minimal user profile object with bakeshop info
            userProfile = {
              id: user.id,
              email: user.email,
              name: user.name || 'User',
              role: user.role,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              bakeshopId: fetchedBakeshopInfo.id,
              bakeshopName: fetchedBakeshopInfo.name,
              permissions: [],
              preferences: {
                theme: 'system',
                language: 'en',
                timezone: 'Asia/Manila',
                notifications: {
                  email: true,
                  push: true,
                  lowStock: true,
                  productionReminders: true,
                  teamUpdates: true,
                  systemAlerts: true
                },
                dashboard: {
                  defaultView: 'overview',
                  widgets: [],
                  refreshInterval: 30
                }
              },
              activityLog: []
            } as any
          } else {
            setError("No bakeshop found. Please complete your setup.")
            setIsLoading(false)
            return
          }
        } catch (err) {
          console.error('Error getting bakeshop info:', err)
        setError("No bakeshop found. Please complete your setup.")
          setIsLoading(false)
        return
      }
      }

      // Load team stats with error handling
      // Use user.bakeshopId if available, otherwise fall back to userProfile.bakeshopId
      const bakeshopId = user?.bakeshopId || userProfile?.bakeshopId
      
      let teamStats
      try {
        if (isDemoUser) {
          teamStats = {
        totalMembers: 3,
        activeMembers: 3,
        pendingInvitations: 0,
        roleDistribution: { owner: 1, baker: 2, cashier: 0 }
          }
        } else if (bakeshopId) {
          console.log('Loading team stats for bakeshopId:', bakeshopId)
          // Add timeout to prevent hanging (reduced to 5 seconds for faster failure)
          const statsPromise = teamManager.getTeamStats(bakeshopId)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Team stats loading timeout')), 5000)
          )
          teamStats = await Promise.race([statsPromise, timeoutPromise])
          console.log('Team stats loaded successfully:', teamStats)
        } else {
          console.warn('No bakeshopId found, using fallback stats')
          // Fallback if no bakeshopId
          teamStats = {
            totalMembers: 1,
            activeMembers: 1,
            pendingInvitations: 0,
            roleDistribution: { owner: 1, baker: 0, cashier: 0 }
          }
        }
      } catch (err) {
        console.error('Error loading team stats:', err)
        // Use default stats if loading fails
        teamStats = {
          totalMembers: 1,
          activeMembers: 1,
          pendingInvitations: 0,
          roleDistribution: { owner: 1, baker: 0, cashier: 0 }
        }
      }

      // Load recent activity with error handling and timeout
      // Note: getTeamStats already includes recentActivity, so we can skip this if we got stats
      // But we'll still load it separately for now to be safe
      let recentActivity
      try {
        if (isDemoUser) {
          recentActivity = [
            { id: '1', description: "Baked 50 pandesal", userName: "Demo Baker", timestamp: new Date().toISOString() },
            { id: '2', description: "Updated inventory", userName: "Demo Owner", timestamp: new Date(Date.now() - 3600000).toISOString() }
          ]
        } else if (bakeshopId) {
          console.log('Loading team activity for bakeshopId:', bakeshopId)
          // Use activity from teamStats if available, otherwise load separately
          if (teamStats && typeof teamStats === 'object' && 'recentActivity' in teamStats && Array.isArray(teamStats.recentActivity)) {
            recentActivity = teamStats.recentActivity
            console.log('Using activity from teamStats')
          } else {
            // Add timeout to prevent hanging (reduced to 5 seconds)
            const activityPromise = teamManager.getTeamActivity(bakeshopId, 10)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Team activity loading timeout')), 5000)
            )
            recentActivity = await Promise.race([activityPromise, timeoutPromise])
            console.log('Team activity loaded separately')
          }
        } else {
          console.warn('No bakeshopId found, using empty activity')
          // Fallback if no bakeshopId
          recentActivity = []
        }
      } catch (err) {
        console.error('Error loading recent activity:', err)
        // Use empty array if loading fails
        recentActivity = []
      }

      // Load unread notifications count with error handling
      let unreadCount = 0
      try {
        unreadCount = isDemoUser ? 0 : await notificationManager.getUnreadCount(user.id)
      } catch (err) {
        console.error('Error loading unread count:', err)
        // Default to 0 if loading fails
        unreadCount = 0
      }

      // Load data needed for metrics calculation (incrementally, non-blocking)
      if (!isDemoUser) {
        // Load critical data first (sales and production for quick stats)
        Promise.all([
          loadDataOnDemand('sales').catch(() => {}),
          loadDataOnDemand('productionLogs').catch(() => {})
        ]).then(() => {
          // Load secondary data after critical data is loaded
          Promise.all([
            loadDataOnDemand('inventory').catch(() => {}),
            loadDataOnDemand('purchaseOrders').catch(() => {})
          ])
        })
      }

      // Calculate quick stats from actual data (will be recalculated via useMemo when data updates)
      // Get today's date range (start of day to end of day)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Calculate today's sales
      const salesArray = Array.isArray(sales) ? sales : []
      const todaySales = salesArray
        .filter(sale => {
          const saleDate = sale.saleDate ? new Date(sale.saleDate) : null
          return saleDate && saleDate >= today && saleDate < tomorrow
        })
        .reduce((sum, sale) => sum + (sale.total || 0), 0)

      // Calculate today's production
      const productionLogsArray = Array.isArray(productionLogs) ? productionLogs : []
      const todayProduction = productionLogsArray
        .filter(log => {
          const prodDate = log.productionDate ? new Date(log.productionDate) : null
          return prodDate && prodDate >= today && prodDate < tomorrow
        })
        .reduce((sum, log) => sum + (log.quantityProduced || 0), 0)

      // Calculate low stock items
      const inventoryArray = Array.isArray(inventory) ? inventory : []
      const lowStockItems = inventoryArray.filter(item => {
        if (item.type === 'raw' && item.minStock !== undefined) {
          return item.quantity < item.minStock
        }
        return false
      }).length

      // Calculate pending orders
      const purchaseOrdersArray = Array.isArray(purchaseOrders) ? purchaseOrders : []
      const pendingOrders = purchaseOrdersArray.filter(po => 
        po.status === 'pending' || po.status === 'draft'
      ).length

      const quickStats = {
        todaySales,
        todayProduction,
        lowStockItems,
        pendingOrders
      }

      setDashboardData({
        unreadNotifications: unreadCount,
        recentActivity: (recentActivity || []) as any[],
        teamStats: (teamStats || {}) as any,
        inventoryAlerts: quickStats.lowStockItems,
        productionStatus: { status: 'active', items: 12 },
        quickStats
      })

      console.log('loadDashboardData: Successfully loaded dashboard data')
      hasLoadedRef.current = true

    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      hasLoadedRef.current = false
    } finally {
      console.log('loadDashboardData: Setting isLoading to false')
      setIsLoading(false)
    }
  }, [user?.id, loadDataOnDemand]) // Include loadDataOnDemand to prevent stale closures

  const loadNotifications = useCallback(async () => {
    if (!user) return

    try {
      const isDemoUser = user.email.endsWith('@bakesync.com')
      
      if (isDemoUser) {
        // Create mock notifications for demo users
        const mockNotifications = [
          {
            id: 'demo-1',
            userId: user.id,
            type: 'inventory_low_stock' as const,
            title: 'Low Stock Alert',
            message: 'Flour is running low. Current: 5kg, Minimum: 10kg',
            isRead: false,
            priority: 'medium' as const,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            data: { itemName: 'Flour', currentStock: 5, minStock: 10 }
          },
          {
            id: 'demo-2',
            userId: user.id,
            type: 'purchase_order_received' as const,
            title: 'Purchase Order Received',
            message: 'New purchase order #PO-2024-001 has been received from Supplier ABC',
            isRead: false,
            priority: 'low' as const,
            createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            data: { orderId: 'PO-2024-001', supplierName: 'Supplier ABC' }
          }
        ]
        setNotifications(mockNotifications)
      } else {
      const userNotifications = await notificationManager.getUserNotifications(user.id, 20)
      setNotifications(userNotifications)
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
      // On error, set empty array to avoid showing stale data
      setNotifications([])
    }
  }, [user])

  useEffect(() => {
    if (user && user.id) {
      // Reset loading state when user changes
      if (loadingUserIdRef.current !== user.id) {
        hasLoadedRef.current = false
        loadingUserIdRef.current = null
        setIsLoading(true) // Set loading to true when user changes
      }
      // Only load if not already loaded to prevent infinite loops
      if (!hasLoadedRef.current || loadingUserIdRef.current !== user.id) {
        loadDashboardData()
        loadNotifications()
      }
    } else if (!user) {
      // If no user, make sure loading is false
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only depend on user.id - callbacks are stable from useCallback

  // Helper function to apply theme
  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System theme - check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  // Load user preferences on mount
  useEffect(() => {
    if (!user?.id) return
    
    let isMounted = true
    
    const loadUserPreferences = async () => {
      try {
        const preferences = await enhancedUserManager.getUserPreferences(user.id)
        
        if (!isMounted) return
        
        setUserPreferences(preferences)
        
        // Apply theme immediately on load
        const theme = preferences.theme || 'system'
        applyTheme(theme)
        
        // Set initial theme in form
        setSettingsForm(prev => ({
          ...prev,
          theme: theme,
          defaultView: preferences.dashboard?.defaultView || prev.defaultView,
          refreshInterval: preferences.dashboard?.refreshInterval || prev.refreshInterval
        }))
        
        // Set active tab based on default view (only on initial load, if not already set)
        if (!hasAppliedDefaultView.current && preferences.dashboard?.defaultView) {
          setActiveTab(preferences.dashboard.defaultView)
          hasAppliedDefaultView.current = true
        }
        
        hasInitialThemeLoaded.current = true
      } catch (error) {
        console.error('Error loading user preferences:', error)
        if (isMounted) {
          // Use defaults if loading fails
          applyTheme('system')
          hasInitialThemeLoaded.current = true
        }
      }
    }
    
    loadUserPreferences()
    
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only depend on user.id to prevent loops

  // Load preferences into form when settings dialog opens
  useEffect(() => {
    if (!isSettingsDialogOpen || !user?.id) return
    
    let isMounted = true
    
    const loadPreferencesIntoForm = async () => {
      try {
        const preferences = await enhancedUserManager.getUserPreferences(user.id)
        
        if (!isMounted) return
        
        setSettingsForm({
          defaultView: preferences.dashboard?.defaultView || 'overview',
          refreshInterval: preferences.dashboard?.refreshInterval || 30,
          theme: preferences.theme || 'system'
        })
      } catch (error) {
        console.error('Error loading preferences for form:', error)
      }
    }
    
    loadPreferencesIntoForm()
    
    return () => {
      isMounted = false
    }
  }, [isSettingsDialogOpen, user?.id])

  // Apply theme when settings form changes (only after initial load)
  useEffect(() => {
    if (hasInitialThemeLoaded.current && settingsForm?.theme) {
      try {
        applyTheme(settingsForm.theme)
      } catch (error) {
        console.error('Error applying theme:', error)
      }
    }
  }, [settingsForm?.theme, applyTheme])

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (settingsForm.theme === 'system' && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [settingsForm.theme, applyTheme])

  const handleSaveSettings = async () => {
    if (!user || isSavingSettings) return

    setIsSavingSettings(true)
    try {
      const updatedPreferences = {
        theme: settingsForm.theme || 'system',
        dashboard: {
          defaultView: settingsForm.defaultView || 'overview',
          refreshInterval: settingsForm.refreshInterval || 30,
          widgets: userPreferences?.dashboard?.widgets || ['recent_activity', 'inventory_alerts', 'production_status']
        }
      }
      
      await enhancedUserManager.updateUserPreferences(user.id, updatedPreferences)
      
      // Update local preferences state
      setUserPreferences((prev: any) => ({
        ...prev,
        ...updatedPreferences
      }))
      
      // Apply theme immediately
      applyTheme(updatedPreferences.theme)
      
      // Always switch to the saved default view
      setActiveTab(updatedPreferences.dashboard.defaultView)
      
      setIsSettingsDialogOpen(false)
      
      // Show success message
      const { toast } = await import('sonner')
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      const { toast } = await import('sonner')
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const isDemoUser = user?.email.endsWith('@bakesync.com')
      
      if (isDemoUser) {
        // For demo users, just update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      } else {
      await notificationManager.markAsRead(notificationId)
      await loadNotifications()
      }
      // No need to reload dashboard data - unread count is calculated from notifications array
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const isDemoUser = user?.email.endsWith('@bakesync.com')
      
      if (isDemoUser) {
        // For demo users, just update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } else {
      await notificationManager.markAllAsRead(user!.id)
      await loadNotifications()
      }
      // No need to reload dashboard data - unread count is calculated from notifications array
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const isDemoUser = user?.email.endsWith('@bakesync.com')
      
      if (isDemoUser) {
        // For demo users, just remove from local state
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      } else {
        await notificationManager.deleteNotification(notificationId)
        await loadNotifications()
      }
      // No need to reload dashboard data - unread count is calculated from notifications array
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  // Calculate unread count from actual notifications
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length
  }, [notifications])

  // Recalculate quick stats when data changes
  const quickStats = useMemo(() => {
    // Get today's date range (start of day to end of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Calculate today's sales
    const salesArray = Array.isArray(sales) ? sales : []
    const todaySales = salesArray
      .filter(sale => {
        const saleDate = sale.saleDate ? new Date(sale.saleDate) : null
        return saleDate && saleDate >= today && saleDate < tomorrow
      })
      .reduce((sum, sale) => sum + (sale.total || 0), 0)

    // Calculate today's production
    const productionLogsArray = Array.isArray(productionLogs) ? productionLogs : []
    const todayProduction = productionLogsArray
      .filter(log => {
        const prodDate = log.productionDate ? new Date(log.productionDate) : null
        return prodDate && prodDate >= today && prodDate < tomorrow
      })
      .reduce((sum, log) => sum + (log.quantityProduced || 0), 0)

    // Calculate low stock items
    const inventoryArray = Array.isArray(inventory) ? inventory : []
    const lowStockItems = inventoryArray.filter(item => {
      if (item.type === 'raw' && item.minStock !== undefined) {
        return item.quantity < item.minStock
      }
      return false
    }).length

    // Calculate pending orders
    const purchaseOrdersArray = Array.isArray(purchaseOrders) ? purchaseOrders : []
    const pendingOrders = purchaseOrdersArray.filter(po => 
      po.status === 'pending' || po.status === 'draft'
    ).length

    return {
      todaySales,
      todayProduction,
      lowStockItems,
      pendingOrders
    }
  }, [sales, productionLogs, inventory, purchaseOrders])

  // Update dashboard data when quick stats change (only if dashboardData already exists)
  useEffect(() => {
    if (dashboardData && quickStats) {
      setDashboardData(prev => {
        // Only update if stats actually changed to prevent infinite loops
        if (prev && (
          prev.quickStats?.todaySales !== quickStats.todaySales ||
          prev.quickStats?.todayProduction !== quickStats.todayProduction ||
          prev.quickStats?.lowStockItems !== quickStats.lowStockItems ||
          prev.quickStats?.pendingOrders !== quickStats.pendingOrders
        )) {
          return {
            ...prev,
            quickStats,
            inventoryAlerts: quickStats.lowStockItems
          }
        }
        return prev
      })
    }
  }, [quickStats])

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inventory_low_stock':
      case 'inventory_critical_stock':
        return <Package className="h-5 w-5 text-orange-500" />
      case 'purchase_order_received':
      case 'purchase_order_delayed':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'team_invitation':
      case 'team_member_joined':
      case 'team_member_left':
        return <Users className="h-5 w-5 text-purple-500" />
      case 'production_reminder':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'security_alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'system_alert':
        return <Bell className="h-5 w-5 text-gray-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get bakeshop slug for navigation
  const getBakeshopSlug = () => {
    if (!user) return 'demo'
    const isDemoUser = user.email.endsWith('@bakesync.com')
    return isDemoUser ? 'demo' : (user.bakeshopSlug || 'demo')
  }

  // Handle invite team member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.bakeshopId) {
      // For demo users, show success message
      const isDemoUser = user?.email.endsWith('@bakesync.com')
      if (isDemoUser) {
        alert('Demo mode: Invitation would be sent to ' + inviteForm.email)
        setInviteForm({ email: '', role: 'baker', message: '' })
        setIsInviteDialogOpen(false)
        return
      }
      setError('No bakeshop found. Please complete your setup.')
      return
    }

    try {
      setIsInviting(true)
      setError(null)

      await teamManager.inviteTeamMember(
        user.bakeshopId,
        user.id,
        inviteForm.email,
        inviteForm.role,
        inviteForm.message || undefined
      )

      // Reset form and close dialog
      setInviteForm({ email: '', role: 'baker', message: '' })
      setIsInviteDialogOpen(false)

      // Reload dashboard data to update team stats
      await loadDashboardData()
    } catch (err) {
      console.error('Error inviting team member:', err)
      setError(err instanceof Error ? err.message : 'Failed to invite team member')
    } finally {
      setIsInviting(false)
    }
  }

  // Handle navigation to team page
  const handleNavigateToTeam = () => {
    const slug = getBakeshopSlug()
    router.push(`/${slug}/team`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    const isSetupError = error.includes("No bakeshop found") || error.includes("Please complete your setup")
    
    return (
      <div className="space-y-4">
        <Alert className={isSetupError ? "border-orange-200 bg-orange-50" : ""}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
        {isSetupError && (
          <div className="flex justify-center">
            <Button 
              onClick={() => router.push('/onboarding')}
              variant="default"
              size="lg"
              className="min-w-[200px]"
            >
              Complete Setup
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No dashboard data available</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Settings Dialog - Must be at root level */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>
              Customize your dashboard preferences and view settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  value={String(settingsForm?.theme || 'system')} 
                  onValueChange={(value: string) => {
                    if (value && ['light', 'dark', 'system'].includes(value)) {
                      const newTheme = value as 'light' | 'dark' | 'system'
                      setSettingsForm(prev => ({ ...prev, theme: newTheme }))
                    }
                  }}
                  disabled={isSavingSettings}
                >
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System (Follow OS)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color theme. System will follow your operating system preference.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultView">Default Dashboard View</Label>
                <Select 
                  value={String(settingsForm?.defaultView || 'overview')}
                  onValueChange={(value: string) => {
                    if (value && ['overview', 'production', 'sales', 'inventory'].includes(value)) {
                      setSettingsForm(prev => ({ ...prev, defaultView: value as 'overview' | 'production' | 'sales' | 'inventory' }))
                    }
                  }}
                  disabled={isSavingSettings}
                >
                  <SelectTrigger id="defaultView" className="w-full">
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose the default view when you open the dashboard
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Auto-refresh Interval (seconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  value={settingsForm.refreshInterval}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) || 30 }))}
                  min={10}
                  max={300}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  How often the dashboard should automatically refresh data (10-300 seconds)
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsDialogOpen(false)}
                disabled={isSavingSettings}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
              >
                {isSavingSettings ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            {user?.role === 'owner' && 'Welcome back! Here\'s your comprehensive business overview.'}
            {user?.role === 'baker' && 'Welcome back! Here\'s your production schedule and tasks.'}
            {user?.role === 'cashier' && 'Welcome back! Here\'s your sales dashboard and daily targets.'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => loadDashboardData(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardData.quickStats.todaySales, bakeshopInfo?.currency || DEFAULT_CURRENCY)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Production Today</p>
                <p className="text-2xl font-bold">{dashboardData.quickStats.todayProduction}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">{dashboardData.quickStats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold">{dashboardData.quickStats.pendingOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <QuickActions 
            userRole={user?.role || 'baker'}
            bakeshopSlug={getBakeshopSlug()}
            stats={{
              lowStockItems: dashboardData.quickStats.lowStockItems,
              pendingOrders: dashboardData.quickStats.pendingOrders,
              todaySales: dashboardData.quickStats.todaySales,
              activeProduction: dashboardData.quickStats.todayProduction
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <RecentActivity 
              activities={dashboardData.recentActivity.map(activity => ({
                id: activity.id,
                type: 'production' as const,
                title: activity.description,
                description: `by ${activity.userName}`,
                user: activity.userName,
                timestamp: new Date(activity.timestamp)
              }))}
              maxItems={5}
            />

            {/* Team Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Members</span>
                    <span className="text-sm">{dashboardData.teamStats.totalMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Active Members</span>
                    <span className="text-sm text-green-600">{dashboardData.teamStats.activeMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Pending Invitations</span>
                    <span className="text-sm text-orange-600">{dashboardData.teamStats.pendingInvitations}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Role Distribution</p>
                    {Object.entries(dashboardData.teamStats.roleDistribution).map(([role, count]) => (
                      <div key={role} className="flex justify-between text-sm">
                        <span className="capitalize">{role}s</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <PerformanceMetrics 
            metrics={[
              {
                id: 'sales',
                title: 'Today\'s Sales',
                value: dashboardData.quickStats.todaySales,
                target: 2000,
                unit: getCurrencySymbol(bakeshopInfo?.currency || DEFAULT_CURRENCY),
                trend: 'up',
                trendValue: 12,
                icon: TrendingUp,
                color: 'green'
              },
              {
                id: 'production',
                title: 'Production Today',
                value: dashboardData.quickStats.todayProduction,
                target: 50,
                unit: 'items',
                trend: 'up',
                trendValue: 8,
                icon: Package,
                color: 'blue'
              },
              {
                id: 'efficiency',
                title: 'Production Efficiency',
                value: 85,
                target: 90,
                unit: '%',
                trend: 'down',
                trendValue: 2,
                icon: Clock,
                color: 'orange'
              }
            ]}
            period="today"
          />
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Production Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
                  <Factory className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.quickStats.todayProduction}</div>
                  <p className="text-xs text-muted-foreground mt-1">Items produced today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Production Efficiency</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-xs text-muted-foreground mt-1">Target: 90%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Bakers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.teamStats.activeMembers}</div>
                  <p className="text-xs text-muted-foreground mt-1">Currently working</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6">
              <RecentActivity 
                activities={dashboardData.recentActivity
                  .filter(activity => activity.type === 'production' || activity.description.toLowerCase().includes('production'))
                  .map(activity => ({
                    id: activity.id,
                    type: 'production' as const,
                    title: activity.description,
                    description: `by ${activity.userName}`,
                    user: activity.userName,
                    timestamp: new Date(activity.timestamp)
                  }))}
                maxItems={10}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(dashboardData.quickStats.todaySales, bakeshopInfo?.currency || DEFAULT_CURRENCY)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Revenue today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.quickStats.todaySales > 0 
                      ? formatCurrency(dashboardData.quickStats.todaySales / Math.max(dashboardData.quickStats.todayProduction, 1), bakeshopInfo?.currency || DEFAULT_CURRENCY)
                      : formatCurrency(0, bakeshopInfo?.currency || DEFAULT_CURRENCY)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.quickStats.todayProduction || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Today</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6">
              <PerformanceMetrics 
                metrics={[
                  {
                    id: 'sales',
                    title: 'Today\'s Sales',
                    value: dashboardData.quickStats.todaySales,
                    target: 2000,
                    unit: getCurrencySymbol(bakeshopInfo?.currency || DEFAULT_CURRENCY),
                    trend: 'up',
                    trendValue: 12,
                    icon: TrendingUp,
                    color: 'green'
                  }
                ]}
                period="today"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Inventory Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{dashboardData.quickStats.lowStockItems}</div>
                  <p className="text-xs text-muted-foreground mt-1">Need restocking</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.quickStats.pendingOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting delivery</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Inventory Alerts</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardData.inventoryAlerts}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active alerts</p>
                </CardContent>
              </Card>
            </div>
            {dashboardData.quickStats.lowStockItems > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                    Low Stock Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You have {dashboardData.quickStats.lowStockItems} item{dashboardData.quickStats.lowStockItems !== 1 ? 's' : ''} with low stock. 
                    Consider creating a purchase order to restock.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount > 0 
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">No notifications yet</p>
                  <p className="text-sm text-gray-500">
                    You're all caught up! New notifications will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md cursor-pointer ${
                    notification.isRead 
                      ? 'opacity-70 bg-gray-50' 
                      : 'border-l-4 border-l-blue-500 bg-white'
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!notification.isRead) {
                      markNotificationAsRead(notification.id)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                          {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></div>
                          )}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(notification.priority)}`}
                            >
                            {notification.priority}
                          </Badge>
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-2 ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {new Date(notification.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                        </p>
                          
                          <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markNotificationAsRead(notification.id)
                                }}
                                title="Mark as read"
                        >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              title="Delete notification"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <h2 className="text-xl font-semibold">Team Activity</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{activity.userName}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <h2 className="text-xl font-semibold">Team Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Members</span>
                    <span className="font-semibold">{dashboardData.teamStats.totalMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Members</span>
                    <span className="font-semibold text-green-600">{dashboardData.teamStats.activeMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Invitations</span>
                    <span className="font-semibold text-orange-600">{dashboardData.teamStats.pendingInvitations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your bakery team.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteMember} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address *</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteForm.email}
                          onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="teammate@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Role *</Label>
                        <Select
                          value={inviteForm.role}
                          onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value as 'baker' | 'cashier' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baker">Baker</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                        <Textarea
                          id="invite-message"
                          value={inviteForm.message}
                          onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Welcome to our team! Looking forward to working with you."
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsInviteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isInviting}>
                          {isInviting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
                
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleNavigateToTeam}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleNavigateToTeam}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Team Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
