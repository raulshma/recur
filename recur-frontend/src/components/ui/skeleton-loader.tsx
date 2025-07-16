

import type * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean
}

export function SkeletonLoader({ className, animate = true, ...props }: SkeletonLoaderProps) {
  return <div className={cn("bg-gray-200 rounded-md", animate && "animate-pulse", className)} {...props} />
}

// Predefined skeleton components for common use cases
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLoader key={i} className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 border-2 border-gray-200 rounded-lg", className)}>
      <div className="flex items-center space-x-4 mb-4">
        <SkeletonLoader className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonLoader className="h-4 w-1/2" />
          <SkeletonLoader className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={i} className="h-6" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  )
}
