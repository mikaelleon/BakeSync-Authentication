import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonLoaderProps {
  count?: number
  rows?: number
  type?: 'card' | 'list' | 'table' | 'text'
  height?: string
}

/**
 * Reusable skeleton loader component
 * Shows placeholder loading state while data is being fetched
 *
 * @example
 * {isLoading ? (
 *   <SkeletonLoader type="table" rows={5} />
 * ) : (
 *   <DataTable data={data} />
 * )}
 */
export function SkeletonLoader({
  count = 1,
  rows = 5,
  type = 'list',
  height = 'h-12'
}: SkeletonLoaderProps) {
  switch (type) {
    case 'card':
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-3 p-4 border rounded-lg">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      )

    case 'table':
      return (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-muted p-4 flex gap-4 border-b">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4 border-b">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      )

    case 'text':
      return (
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton
              key={i}
              className={`w-full ${height} ${i === rows - 1 ? 'w-2/3' : ''}`}
            />
          ))}
        </div>
      )

    case 'list':
    default:
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="space-y-2 p-3 border rounded-lg">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )
  }
}
