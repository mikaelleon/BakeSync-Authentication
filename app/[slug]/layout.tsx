import type React from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DataStoreProvider } from "@/lib/data-store"
import { ProtectedRoute } from "@/components/protected-route"
import { SlugRouteHandler } from "@/components/slug-route-handler"

interface SlugLayoutProps {
  children: React.ReactNode
  params: {
    slug: string
  }
}

export default function SlugLayout({ children, params }: SlugLayoutProps) {
  return (
    <ProtectedRoute>
      <SlugRouteHandler slug={params.slug}>
        <DataStoreProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-6" />
              </header>
              <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </DataStoreProvider>
      </SlugRouteHandler>
    </ProtectedRoute>
  )
}