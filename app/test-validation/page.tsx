"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const testSchema = z.object({
  code: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.length === 0) {
        return false
      }
      return val.length === 6 && /^\d{6}$/.test(val)
    }, "Please enter a 6-digit verification code")
})

type TestData = z.infer<typeof testSchema>

export default function TestValidationPage() {
  const [hasInteracted, setHasInteracted] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<TestData>({
    resolver: zodResolver(testSchema),
    mode: "onBlur",
    defaultValues: {
      code: ""
    }
  })

  const watchedCode = watch("code")

  const onSubmit = (data: TestData) => {
    console.log("Form submitted:", data)
    alert(`Code: ${data.code}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Validation Test</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              {...register("code", {
                onChange: () => setHasInteracted(true)
              })}
              placeholder="123456"
              className={`text-center text-lg tracking-widest ${
                watchedCode && watchedCode.length === 6 && /^\d{6}$/.test(watchedCode)
                  ? 'border-green-500 bg-green-50'
                  : errors.code && hasInteracted
                  ? 'border-red-500'
                  : ''
              }`}
              maxLength={6}
            />
            {errors.code && hasInteracted && (
              <p className="text-sm text-red-600">{errors.code.message}</p>
            )}
            {watchedCode && watchedCode.length === 6 && /^\d{6}$/.test(watchedCode) && !errors.code && (
              <p className="text-sm text-green-600">✓ Valid verification code</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Test Submit
          </Button>
        </form>

        <div className="text-xs text-gray-500">
          <p>Watched code: {watchedCode || "empty"}</p>
          <p>Has interacted: {hasInteracted ? "yes" : "no"}</p>
          <p>Errors: {JSON.stringify(errors)}</p>
        </div>
      </div>
    </div>
  )
}
