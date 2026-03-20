"use client"

import { AppErrorView } from "@/components/errors/app-error-view"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AppErrorView
      error={error}
      reset={reset}
      secondaryHref="/"
      secondaryLabel="Go home"
    />
  )
}
