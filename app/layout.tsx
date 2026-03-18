import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { AuthProvider } from "@/lib/auth-context"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

// Lazy load heavy components
const Toaster = dynamic(() => import("@/components/ui/sonner").then(mod => ({ default: mod.Toaster })), {
  ssr: false,
})
const Analytics = dynamic(() => import("@vercel/analytics/next").then(mod => ({ default: mod.Analytics })), {
  ssr: false,
})

export const metadata: Metadata = {
  title: "BakeSync - Bakery ERP System",
  description: "Integrated ERP system for bakeshops",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              {children}
            </Suspense>
          </AuthProvider>
          <Toaster />
          <Analytics />
        </ErrorBoundary>
      </body>
    </html>
  )
}
