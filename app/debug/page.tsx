"use client"

import { useAuth } from "@/lib/auth-context"

export default function DebugPage() {
  const auth = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Auth Status:</h2>
          <p>Loading: {auth.isLoading ? 'Yes' : 'No'}</p>
          <p>User: {auth.user ? JSON.stringify(auth.user, null, 2) : 'None'}</p>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold">Note:</h2>
          <p>Data store information is not available on this page as it's outside the app layout.</p>
        </div>
      </div>
    </div>
  )
}
