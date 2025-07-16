

import type React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "./skeleton"

interface LoadingStateProps {
  loading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

export function LoadingState({ loading, children, fallback, className }: LoadingStateProps) {
  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        {fallback || (
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        )}
      </div>
    )
  }

  return <>{children}</>
}

export function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex space-x-4">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[80px]" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

export function CardLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  )
}

export function ChartLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
      <Skeleton className="h-[200px] w-full" />
      <div className="flex justify-center space-x-4">
        <Skeleton className="h-3 w-[60px]" />
        <Skeleton className="h-3 w-[60px]" />
        <Skeleton className="h-3 w-[60px]" />
      </div>
    </div>
  )
}

export function ButtonLoadingState({ loading, children, ...props }: any) {
  return (
    <button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
