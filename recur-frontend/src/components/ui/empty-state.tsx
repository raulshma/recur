import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center p-8 text-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800",
          className,
        )}
        {...props}
      >
        {icon && <div className="mb-4 text-gray-400">{icon}</div>}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-gray-600 mb-4 max-w-sm">{description}</p>}
        {action && action}
      </div>
    )
  },
)
EmptyState.displayName = "EmptyState"

export { EmptyState }
