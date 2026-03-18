"use client"

import { EmailVerification } from "@/components/auth/email-verification"
import { useState } from "react"

export default function DebugVerificationPage() {
  const [email, setEmail] = useState("test@example.com")

  const handleVerified = () => {
    console.log("Email verified successfully!")
    alert("Email verified! Check console for details.")
  }

  const handleResend = () => {
    console.log("Resend requested")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Debug Email Verification</h1>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Test Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="test@example.com"
            />
          </div>
        </div>
        
        <EmailVerification 
          email={email}
          onVerified={handleVerified}
          onResend={handleResend}
        />
        
        <div className="text-xs text-gray-500 text-center">
          <p>Check browser console for debug logs</p>
          <p>Use the debug button to skip to code input for testing</p>
        </div>
      </div>
    </div>
  )
}
