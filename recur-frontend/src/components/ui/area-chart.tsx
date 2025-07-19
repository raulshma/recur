

import * as React from "react"
import { cn } from "@/lib/utils"

interface AreaDataPoint {
  name: string
  value: number
}

interface AreaDataset {
  name: string
  data: AreaDataPoint[]
  color?: string
  fillOpacity?: number
  strokeWidth?: number
}

interface AreaChartProps {
  datasets: AreaDataset[]
  width?: number
  height?: number
  className?: string
  showGrid?: boolean
  showAxes?: boolean
  showLegend?: boolean
  showDots?: boolean
  stacked?: boolean
  smooth?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
}

export const AreaChart = React.forwardRef<HTMLDivElement, AreaChartProps>(
  (
    {
      datasets,
      width = 600,
      height = 400,
      className,
      showGrid = true,
      showAxes = true,
      showLegend = true,
      showDots = true,
      stacked = false,
      smooth = true,
      xAxisLabel,
      yAxisLabel,
      ...props
    },
    ref,
  ) => {
    if (!datasets || datasets.length === 0) return null

    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Calculate domains
    const allDataPoints = datasets.flatMap((dataset) => dataset.data)
    const xLabels = [...new Set(allDataPoints.map((point) => point.name))]
    const maxValue = stacked
      ? Math.max(
          ...xLabels.map((label) =>
            datasets.reduce((sum, dataset) => {
              const point = dataset.data.find((p) => p.name === label)
              return sum + (point?.value || 0)
            }, 0),
          ),
        )
      : Math.max(...allDataPoints.map((point) => point.value))

    const xScale = (index: number) => (index / Math.max(xLabels.length - 1, 1)) * chartWidth
    const yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight

    const colors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]

    const createPath = (points: { x: number; y: number }[], smooth: boolean) => {
      if (points.length === 0) return ""

      let path = `M ${points[0].x} ${points[0].y}`

      if (smooth && points.length > 1) {
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1]
          const curr = points[i]
          const controlX = prev.x + (curr.x - prev.x) / 2
          path += ` Q ${controlX} ${prev.y} ${curr.x} ${curr.y}`
        }
      } else {
        points.slice(1).forEach((point) => {
          path += ` L ${point.x} ${point.y}`
        })
      }

      return path
    }

    const createAreaPath = (
      points: { x: number; y: number }[],
      baselinePoints: { x: number; y: number }[],
      smooth: boolean,
    ) => {
      const topPath = createPath(points, smooth)
      const bottomPath = createPath([...baselinePoints].reverse(), smooth)
      return `${topPath} L ${points[points.length - 1].x} ${baselinePoints[baselinePoints.length - 1].y} ${bottomPath} Z`
    }

    // Calculate stacked values
    const stackedData = stacked
      ? datasets.map((dataset, datasetIndex) => ({
          ...dataset,
          stackedData: xLabels.map((label, labelIndex) => {
            const currentValue = dataset.data.find((p) => p.name === label)?.value || 0
            const previousSum = datasets.slice(0, datasetIndex).reduce((sum, prevDataset) => {
              const prevValue = prevDataset.data.find((p) => p.name === label)?.value || 0
              return sum + prevValue
            }, 0)
            return {
              name: label,
              value: currentValue,
              stackedValue: previousSum + currentValue,
              baseValue: previousSum,
            }
          }),
        }))
      : datasets

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white dark:bg-gray-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        {...props}
      >
        <svg width={width} height={height + (showLegend ? 40 : 0)} className="overflow-visible">
          <defs>
            {datasets.map((dataset, index) => {
              const color = dataset.color || colors[index % colors.length]
              return (
                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity={dataset.fillOpacity || 0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.1} />
                </linearGradient>
              )
            })}
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid */}
            {showGrid && (
              <g>
                {/* Vertical grid lines */}
                {xLabels.map((_, i) => {
                  const x = xScale(i)
                  return (
                    <line
                      key={`v-${i}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={chartHeight}
                      stroke="#E5E7EB"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                    />
                  )
                })}
                {/* Horizontal grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const y = (i / 5) * chartHeight
                  return (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth={1}
                      strokeDasharray="2,2"
                    />
                  )
                })}
              </g>
            )}

            {/* Areas */}
            {(stacked ? stackedData : datasets).map((dataset, datasetIndex) => {
              const color = dataset.color || colors[datasetIndex % colors.length]
              const data = stacked ? (dataset as any).stackedData : dataset.data

              const points = data.map((point: any, pointIndex: number) => ({
                x: xScale(pointIndex),
                y: yScale(stacked ? point.stackedValue : point.value),
              }))

              const baselinePoints = stacked
                ? data.map((point: any, pointIndex: number) => ({
                    x: xScale(pointIndex),
                    y: yScale(point.baseValue),
                  }))
                : data.map((_: any, pointIndex: number) => ({
                    x: xScale(pointIndex),
                    y: chartHeight,
                  }))

              const areaPath = createAreaPath(points, baselinePoints, smooth)
              const linePath = createPath(points, smooth)

              return (
                <g key={datasetIndex}>
                  {/* Area fill */}
                  <path
                    d={areaPath}
                    fill={`url(#gradient-${datasetIndex})`}
                    className="transition-all hover:opacity-80"
                  />
                  {/* Line stroke */}
                  <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={dataset.strokeWidth || 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all hover:stroke-width-3"
                  />
                  {/* Data points */}
                  {showDots &&
                    points.map((point: any, pointIndex: number) => (
                      <circle
                        key={pointIndex}
                        cx={point.x}
                        cy={point.y}
                        r={3}
                        fill={color}
                        stroke="#fff"
                        strokeWidth={2}
                        className="transition-all hover:r-5"
                      />
                    ))}
                </g>
              )
            })}

            {/* Axes */}
            {showAxes && (
              <g>
                {/* X-axis */}
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#000" strokeWidth={2} />
                {/* Y-axis */}
                <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#000" strokeWidth={2} />

                {/* X-axis labels */}
                {xLabels.map((label, i) => {
                  const x = xScale(i)
                  return (
                    <text key={i} x={x} y={chartHeight + 20} textAnchor="middle" fontSize="10" fill="#000">
                      {label}
                    </text>
                  )
                })}

                {/* Y-axis labels */}
                {Array.from({ length: 6 }, (_, i) => {
                  const y = (i / 5) * chartHeight
                  const value = ((5 - i) / 5) * maxValue
                  return (
                    <text key={i} x={-10} y={y} textAnchor="end" dy="0.35em" fontSize="10" fill="#000">
                      {value.toFixed(0)}
                    </text>
                  )
                })}
              </g>
            )}

            {/* Axis labels */}
            {xAxisLabel && (
              <text
                x={chartWidth / 2}
                y={chartHeight + 45}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#000"
              >
                {xAxisLabel}
              </text>
            )}
            {yAxisLabel && (
              <text
                x={-35}
                y={chartHeight / 2}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#000"
                transform={`rotate(-90, -35, ${chartHeight / 2})`}
              >
                {yAxisLabel}
              </text>
            )}
          </g>

          {/* Legend */}
          {showLegend && (
            <g transform={`translate(20, ${height + 10})`}>
              {datasets.map((dataset, index) => {
                const color = dataset.color || colors[index % colors.length]
                return (
                  <g key={index} transform={`translate(${index * 120}, 0)`}>
                    <rect x={0} y={0} width={12} height={12} fill={color} stroke="#000" strokeWidth={1} />
                    <text x={18} y={6} dy="0.35em" fontSize="12" fontWeight="bold" fill="#000">
                      {dataset.name}
                    </text>
                  </g>
                )
              })}
            </g>
          )}
        </svg>
      </div>
    )
  },
)
AreaChart.displayName = "AreaChart"
