

import type * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: "increase" | "decrease" | "neutral"
    period?: string
  }
  icon?: React.ReactNode
  className?: string
}

export function StatsCard({ title, value, change, icon, className }: StatsCardProps) {
  const getTrendIcon = () => {
    if (!change) return null

    switch (change.type) {
      case "increase":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "decrease":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTrendColor = () => {
    if (!change) return ""

    switch (change.type) {
      case "increase":
        return "text-green-600"
      case "decrease":
        return "text-red-600"
      case "neutral":
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{value}</p>
            {change && (
              <div className="flex items-center mt-2 space-x-1">
                {getTrendIcon()}
                <span className={cn("text-sm font-medium", getTrendColor())}>
                  {Math.abs(change.value)}%{change.period && ` ${change.period}`}
                </span>
              </div>
            )}
          </div>
          {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
