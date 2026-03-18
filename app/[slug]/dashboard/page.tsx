"use client"

import { ProtectedRoute } from "@/components/protected-route"
import dynamic from "next/dynamic"

// Lazy load dashboard component for better initial load
const EnhancedDashboard = dynamic(
  () => import("@/components/dashboard/enhanced-dashboard").then(mod => ({ default: mod.EnhancedDashboard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
)

export default function DashboardPage() {
  return (
    <ProtectedRoute permission="viewDashboard">
      <EnhancedDashboard />
    </ProtectedRoute>
  )
}