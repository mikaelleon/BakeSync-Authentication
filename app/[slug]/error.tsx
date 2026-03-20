"use client"

import { usePathname } from "next/navigation"
import { AppErrorView } from "@/components/errors/app-error-view"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const pathname = usePathname()
  const slug = pathname?.split("/")[1] || "demo"

  return (
    <AppErrorView
      error={error}
      reset={reset}
      secondaryHref={`/${slug}/dashboard`}
      secondaryLabel="Go to Dashboard"
    />
  )
}
