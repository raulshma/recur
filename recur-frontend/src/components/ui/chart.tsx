

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"

interface ChartData {
  name: string
  value: number
  color?: string
  currency?: string
}

interface BarChartProps {
  data: ChartData[]
  className?: string
  height?: number
  showValues?: boolean
  currency?: string
}

const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  ({ data, className, height = 200, showValues = false, currency, ...props }, ref) => {
    const maxValue = Math.max(...data.map((item) => item.value))

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white dark:bg-gray-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        style={{ height }}
        {...props}
      >
        <div className="flex h-full items-end justify-between gap-2">
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 80)
            const color = item.color || "#FF6B35"
            const displayValue = showValues ? (
              currency ? formatCurrency(item.value, currency) : item.value.toString()
            ) : null

            return (
              <div key={index} className="flex flex-col items-center gap-2 flex-1">
                <div className="flex flex-col items-center">
                  {showValues && (
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {displayValue}
                    </span>
                  )}
                  <div
                    className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: color,
                      minHeight: "4px",
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 text-center">{item.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
BarChart.displayName = "BarChart"

interface LineChartProps {
  data: ChartData[]
  className?: string
  height?: number
  strokeColor?: string
  fillColor?: string
}

const LineChart = React.forwardRef<HTMLDivElement, LineChartProps>(
  ({ data, className, height = 200, strokeColor = "#FF6B35", fillColor = "#FF6B35", ...props }, ref) => {
    const maxValue = Math.max(...data.map((item) => item.value))
    const minValue = Math.min(...data.map((item) => item.value))
    const range = maxValue - minValue || 1

    const points = data
      .map((item, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = 100 - ((item.value - minValue) / range) * 80
        return `${x},${y}`
      })
      .join(" ")

    const pathD = `M ${points
      .split(" ")
      .map((point) => point.replace(",", " "))
      .join(" L ")}`
    const areaD = `${pathD} L 100 100 L 0 100 Z`

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white dark:bg-gray-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        style={{ height }}
        {...props}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#gradient)" stroke="none" />
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100
            const y = 100 - ((item.value - minValue) / range) * 80
            return <circle key={index} cx={x} cy={y} r="2" fill={strokeColor} stroke="white" strokeWidth="1" />
          })}
        </svg>
      </div>
    )
  },
)
LineChart.displayName = "LineChart"

interface DonutChartProps {
  data: ChartData[]
  className?: string
  size?: number
  innerRadius?: number
}

const DonutChart = React.forwardRef<HTMLDivElement, DonutChartProps>(
  ({ data, className, size = 200, innerRadius = 60, ...props }, ref) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    const radius = (size - 40) / 2
    const circumference = 2 * Math.PI * radius

    let cumulativePercentage = 0

    const colors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"]

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center rounded-md border-2 border-black bg-white dark:bg-gray-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg width={size - 40} height={size - 40} className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
            const strokeDashoffset = -((cumulativePercentage / 100) * circumference)
            const color = item.color || colors[index % colors.length]

            cumulativePercentage += percentage

            return (
              <circle
                key={index}
                cx={(size - 40) / 2}
                cy={(size - 40) / 2}
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth="20"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 hover:stroke-width-[24]"
              />
            )
          })}
          <circle
            cx={(size - 40) / 2}
            cy={(size - 40) / 2}
            r={innerRadius}
            fill="white"
            stroke="#000"
            className="dark:fill-gray-800 dark:stroke-gray-300"
            strokeWidth="2"
          />
        </svg>
      </div>
    )
  },
)
DonutChart.displayName = "DonutChart"

export { BarChart, LineChart, DonutChart }
