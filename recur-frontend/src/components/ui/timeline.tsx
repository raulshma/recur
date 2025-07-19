

import type * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  title: string
  description?: string
  timestamp: Date
  icon?: React.ReactNode
  status?: "completed" | "current" | "upcoming"
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  const formatTimestamp = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: TimelineItem["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500 border-green-600"
      case "current":
        return "bg-orange-500 border-orange-600"
      case "upcoming":
        return "bg-gray-300 border-gray-400"
      default:
        return "bg-blue-500 border-blue-600"
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex items-start space-x-4">
          {/* Timeline line */}
          {index < items.length - 1 && (
            <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-300 dark:bg-gray-600 -translate-x-1/2" />
          )}

          {/* Timeline dot */}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
              getStatusColor(item.status),
            )}
          >
            {item.icon || <div className="h-2 w-2 rounded-full bg-white dark:bg-gray-200" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{item.title}</h3>
              <time className="text-sm text-gray-500 dark:text-gray-400 font-medium">{formatTimestamp(item.timestamp)}</time>
            </div>
            {item.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
