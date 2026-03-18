import React from 'react'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  children?: React.ReactNode
}

/**
 * Reusable empty state component
 * Displays when there's no data to show with optional call-to-action buttons
 *
 * @example
 * <EmptyState
 *   icon={Package}
 *   title="No recipes yet"
 *   description="Create your first recipe to get started"
 *   actionLabel="Create Recipe"
 *   onAction={handleCreate}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12 px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="p-3 bg-muted rounded-lg">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">{description}</p>

        {/* Custom content */}
        {children}

        {/* Action buttons */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex gap-2 justify-center">
            {actionLabel && (
              <Button
                onClick={onAction}
                variant="default"
              >
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && (
              <Button
                onClick={onSecondaryAction}
                variant="outline"
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
