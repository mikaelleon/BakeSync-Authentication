import { Skeleton } from "@/components/ui/skeleton"

type DashboardLoadingHeaderProps = {
  showAction?: boolean
}

export function DashboardLoadingHeader({ showAction = true }: DashboardLoadingHeaderProps) {
  const titleBlock = (
    <div>
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-2 h-5 w-96" />
    </div>
  )

  if (!showAction) {
    return titleBlock
  }

  return (
    <div className="flex items-center justify-between">
      {titleBlock}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}
