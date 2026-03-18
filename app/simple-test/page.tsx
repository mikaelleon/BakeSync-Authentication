"use client"

import { useEffect, useState } from "react"

export default function SimpleTestPage() {
  const [status, setStatus] = useState("Testing...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testBasic = async () => {
      try {
        console.log('Testing basic async...')
        setStatus("Testing basic async...")
        
        // Test 1: Basic async
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Basic async test passed')
        setStatus("Basic async test passed")
        
        // Test 2: Environment variables
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('URL:', url)
        console.log('Key:', key ? `${key.substring(0, 20)}...` : 'undefined')
        
        if (!url || !key) {
          setError("Environment variables not found")
          setStatus("❌ Environment variables missing")
          return
        }
        
        setStatus("✅ Environment variables found")
        
        // Test 3: Simple fetch
        console.log('Testing fetch...')
        const response = await fetch(`${url}/rest/v1/`, {
          headers: {
            'apikey': key,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        console.log('Fetch test passed')
        setStatus("✅ All tests passed!")
        setError(null)
        
      } catch (err) {
        console.error('Test error:', err)
        setError(`Test error: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setStatus("❌ Test failed")
      }
    }

    testBasic()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Connection Test</h1>
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
