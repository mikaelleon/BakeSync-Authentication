"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("Testing...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testSupabase = async () => {
      try {
        console.log('Testing Supabase connection...')
        const supabase = createClient()
        
        console.log('Supabase client created, testing auth...')
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error('Auth error:', authError)
          setError(`Auth error: ${authError.message}`)
          setStatus("Auth Error")
          return
        }
        
        console.log('Auth test passed, testing database...')
        const { data, error: dbError } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (dbError) {
          console.error('Database error:', dbError)
          setError(`Database error: ${dbError.message}`)
          setStatus("Database Error")
          return
        }
        
        console.log('All tests passed!')
        setStatus("✅ Supabase connection successful!")
        setError(null)
        
      } catch (err) {
        console.error('Test error:', err)
        setError(`Test error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setStatus("❌ Test failed")
      }
    }

    testSupabase()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      <div className="space-y-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Check the browser console for detailed logs.
        </p>
      </div>
    </div>
  )
}
