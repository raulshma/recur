

import * as React from "react"
import { cn } from "@/lib/utils"

interface HeatmapData {
  date: string
  value: number
}

interface HeatmapProps {
  data: HeatmapData[]
  startDate: Date
  endDate: Date
  className?: string
  cellSize?: number
  gap?: number
  levels?: number
}

export function Heatmap({ data, startDate, endDate, className, cellSize = 12, gap = 2, levels = 5 }: HeatmapProps) {
  const dataMap = React.useMemo(() => {
    const map = new Map<string, number>()
    data.forEach((item) => {
      map.set(item.date, item.value)
    })
    return map
  }, [data])

  const maxValue = React.useMemo(() => {
    return Math.max(...data.map((item) => item.value), 1)
  }, [data])

  const getIntensity = (value: number) => {
    if (value === 0) return 0
    return Math.ceil((value / maxValue) * levels)
  }

  const getColor = (intensity: number) => {
    const colors = [
              "bg-gray-100 dark:bg-gray-800", // 0
      "bg-orange-200", // 1
      "bg-orange-300", // 2
      "bg-orange-400", // 3
      "bg-orange-500", // 4
      "bg-orange-600", // 5
    ]
    return colors[intensity] || colors[0]
  }

  const generateDates = () => {
    const dates = []
    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const dates = generateDates()
  const weeks = Math.ceil(dates.length / 7)

  const getDateString = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const formatTooltip = (date: Date, value: number) => {
    return `${date.toLocaleDateString()}: ${value} contributions`
  }

  return (
    <div className={cn("p-4", className)}>
      <div className="flex flex-col space-y-2">
        {/* Month labels */}
        <div className="flex space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          {Array.from({ length: weeks }, (_, weekIndex) => {
            const weekStart = dates[weekIndex * 7]
            if (!weekStart || weekIndex % 4 !== 0) return <div key={weekIndex} style={{ width: cellSize }} />
            return (
              <div key={weekIndex} style={{ width: cellSize }} className="text-center">
                {weekStart.toLocaleDateString("en-US", { month: "short" })}
              </div>
            )
          })}
        </div>

        {/* Heatmap grid */}
        <div className="flex space-x-1">
          {/* Day labels */}
          <div className="flex flex-col space-y-1 text-xs text-gray-500 mr-2">
            {["", "Mon", "", "Wed", "", "Fri", ""].map((day, index) => (
              <div key={index} style={{ height: cellSize }} className="flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1" style={{ gridTemplateRows: `repeat(7, ${cellSize}px)` }}>
            {Array.from({ length: weeks * 7 }, (_, index) => {
              const date = dates[index]
              if (!date) return <div key={index} />

              const dateString = getDateString(date)
              const value = dataMap.get(dateString) || 0
              const intensity = getIntensity(value)

              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-sm border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer",
                    getColor(intensity),
                  )}
                  style={{ width: cellSize, height: cellSize }}
                  title={formatTooltip(date, value)}
                />
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
          <span>Less</span>
          <div className="flex space-x-1">
            {Array.from({ length: levels + 1 }, (_, index) => (
              <div
                key={index}
                className={cn("rounded-sm border border-gray-200", getColor(index))}
                style={{ width: cellSize, height: cellSize }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
