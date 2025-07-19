

import type * as React from "react"
import { TrendingUp, TrendingDown, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart } from "@/components/ui/chart"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
  }
  trend?: "up" | "down" | "neutral"
  sparklineData?: Array<{ name: string; value: number }>
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, change, trend, sparklineData, icon, className }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600 dark:text-gray-400"
    }
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
        {icon && <div className="text-gray-400 dark:text-gray-500">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {change && (
              <div className="flex items-center mt-1">
                {getTrendIcon()}
                <span className={cn("text-xs ml-1", getTrendColor())}>
                  {change.value > 0 ? "+" : ""}
                  {change.value}% {change.period}
                </span>
              </div>
            )}
          </div>
          {sparklineData && (
            <div className="w-20 h-12">
              <LineChart data={sparklineData} height={48} strokeColor={trend === "up" ? "#16a34a" : "#dc2626"} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
