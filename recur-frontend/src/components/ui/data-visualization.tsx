
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataPoint {
  label: string
  value: number
  color?: string
}

interface SparklineProps {
  data: DataPoint[]
  width?: number
  height?: number
  color?: string
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  width = 200,
  height = 50,
  color = "#FF6B35",
  strokeWidth = 2,
  className,
}: SparklineProps) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  const points = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((point.value - minValue) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface MiniBarChartProps {
  data: DataPoint[]
  width?: number
  height?: number
  className?: string
}

export function MiniBarChart({ data, width = 200, height = 50, className }: MiniBarChartProps) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.map((d) => d.value))
  const barWidth = width / data.length
  const padding = barWidth * 0.1

  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)}>
      {data.map((point, index) => {
        const barHeight = (point.value / maxValue) * height
        const x = index * barWidth + padding
        const y = height - barHeight

        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth - padding * 2}
            height={barHeight}
            fill={point.color || "#FF6B35"}
            rx={1}
          />
        )
      })}
    </svg>
  )
}

interface TrendIndicatorProps {
  value: number
  previousValue: number
  showIcon?: boolean
  showPercentage?: boolean
  className?: string
}

export function TrendIndicator({
  value,
  previousValue,
  showIcon = true,
  showPercentage = true,
  className,
}: TrendIndicatorProps) {
  const change = value - previousValue
  const percentageChange = previousValue !== 0 ? (change / previousValue) * 100 : 0

  const isPositive = change > 0
  const isNegative = change < 0
  const isNeutral = change === 0

  const getIcon = () => {
    if (isPositive) return <TrendingUp className="h-4 w-4" />
    if (isNegative) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getColor = () => {
    if (isPositive) return "text-green-600"
    if (isNegative) return "text-red-600"
          return "text-gray-500 dark:text-gray-400"
  }

  return (
    <div className={cn("flex items-center gap-1", getColor(), className)}>
      {showIcon && getIcon()}
      <span className="text-sm font-medium">
        {showPercentage ? `${Math.abs(percentageChange).toFixed(1)}%` : Math.abs(change)}
      </span>
    </div>
  )
}

interface GaugeProps {
  value: number
  min?: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showValue?: boolean
  className?: string
}

export function Gauge({
  value,
  min = 0,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = "#FF6B35",
  backgroundColor = "#E5E7EB",
  showValue = true,
  className,
}: GaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * Math.PI // Half circle
  const normalizedValue = Math.min(Math.max(value, min), max)
  const percentage = (normalizedValue - min) / (max - min)
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - percentage * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size / 2 + strokeWidth} className="transform rotate-180">
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showValue && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{normalizedValue}</span>
          <span className="text-sm text-gray-500 ml-1">/ {max}</span>
        </div>
      )}
    </div>
  )
}

interface HeatmapCellProps {
  value: number
  maxValue: number
  size?: number
  className?: string
}

export function HeatmapCell({ value, maxValue, size = 12, className }: HeatmapCellProps) {
  const intensity = maxValue > 0 ? value / maxValue : 0
  const opacity = Math.max(0.1, intensity)

  return (
    <div
      className={cn("rounded-sm border border-gray-200", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: `rgba(255, 107, 53, ${opacity})`,
      }}
      title={`Value: ${value}`}
    />
  )
}
