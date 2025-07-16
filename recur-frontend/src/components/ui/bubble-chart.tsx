

import * as React from "react"
import { cn } from "@/lib/utils"

interface BubbleDataPoint {
  x: number
  y: number
  size: number
  label?: string
  color?: string
}

interface BubbleDataset {
  name: string
  data: BubbleDataPoint[]
  color?: string
}

interface BubbleChartProps {
  datasets: BubbleDataset[]
  width?: number
  height?: number
  className?: string
  showGrid?: boolean
  showAxes?: boolean
  showLegend?: boolean
  showLabels?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  sizeRange?: [number, number]
  xDomain?: [number, number]
  yDomain?: [number, number]
}

export const BubbleChart = React.forwardRef<HTMLDivElement, BubbleChartProps>(
  (
    {
      datasets,
      width = 600,
      height = 400,
      className,
      showGrid = true,
      showAxes = true,
      showLegend = true,
      showLabels = false,
      xAxisLabel,
      yAxisLabel,
      sizeRange = [5, 30],
      xDomain,
      yDomain,
      ...props
    },
    ref,
  ) => {
    if (!datasets || datasets.length === 0) return null

    const margin = { top: 20, right: 20, bottom: 60, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Calculate domains
    const allPoints = datasets.flatMap((dataset) => dataset.data)
    const xMin = xDomain?.[0] ?? Math.min(...allPoints.map((p) => p.x))
    const xMax = xDomain?.[1] ?? Math.max(...allPoints.map((p) => p.x))
    const yMin = yDomain?.[0] ?? Math.min(...allPoints.map((p) => p.y))
    const yMax = yDomain?.[1] ?? Math.max(...allPoints.map((p) => p.y))
    const sizeMin = Math.min(...allPoints.map((p) => p.size))
    const sizeMax = Math.max(...allPoints.map((p) => p.size))

    const xScale = (value: number) => ((value - xMin) / (xMax - xMin)) * chartWidth
    const yScale = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight
    const sizeScale = (value: number) => {
      const normalized = (value - sizeMin) / (sizeMax - sizeMin)
      return sizeRange[0] + normalized * (sizeRange[1] - sizeRange[0])
    }

    const colors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        {...props}
      >
        <svg width={width} height={height + (showLegend ? 40 : 0)} className="overflow-visible">
          <defs>
            {datasets.map((dataset, index) => {
              const color = dataset.color || colors[index % colors.length]
              return (
                <radialGradient key={index} id={`bubble-gradient-${index}`} cx="30%" cy="30%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                </radialGradient>
              )
            })}
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid */}
            {showGrid && (
              <g>
                {/* Vertical grid lines */}
                {Array.from({ length: 6 }, (_, i) => {
                  const x = (i / 5) * chartWidth
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

            {/* Axes */}
            {showAxes && (
              <g>
                {/* X-axis */}
                <line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#000" strokeWidth={2} />
                {/* Y-axis */}
                <line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#000" strokeWidth={2} />

                {/* X-axis ticks and labels */}
                {Array.from({ length: 6 }, (_, i) => {
                  const x = (i / 5) * chartWidth
                  const value = xMin + (i / 5) * (xMax - xMin)
                  return (
                    <g key={`x-tick-${i}`}>
                      <line x1={x} y1={chartHeight} x2={x} y2={chartHeight + 5} stroke="#000" strokeWidth={1} />
                      <text x={x} y={chartHeight + 20} textAnchor="middle" fontSize="10" fill="#000">
                        {value.toFixed(1)}
                      </text>
                    </g>
                  )
                })}

                {/* Y-axis ticks and labels */}
                {Array.from({ length: 6 }, (_, i) => {
                  const y = (i / 5) * chartHeight
                  const value = yMin + ((5 - i) / 5) * (yMax - yMin)
                  return (
                    <g key={`y-tick-${i}`}>
                      <line x1={-5} y1={y} x2={0} y2={y} stroke="#000" strokeWidth={1} />
                      <text x={-10} y={y} textAnchor="end" dy="0.35em" fontSize="10" fill="#000">
                        {value.toFixed(1)}
                      </text>
                    </g>
                  )
                })}
              </g>
            )}

            {/* Bubbles */}
            {datasets.map((dataset, datasetIndex) => {
              const color = dataset.color || colors[datasetIndex % colors.length]
              return (
                <g key={datasetIndex}>
                  {dataset.data.map((point, pointIndex) => {
                    const x = xScale(point.x)
                    const y = yScale(point.y)
                    const radius = sizeScale(point.size)
                    const bubbleColor = point.color || color

                    return (
                      <g key={pointIndex} className="transition-all hover:opacity-80">
                        <circle
                          cx={x}
                          cy={y}
                          r={radius}
                          fill={`url(#bubble-gradient-${datasetIndex})`}
                          stroke={bubbleColor}
                          strokeWidth={2}
                          className="transition-all hover:stroke-width-3"
                        />
                        {showLabels && point.label && (
                          <text
                            x={x}
                            y={y - radius - 5}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#000"
                          >
                            {point.label}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}

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
                    <circle cx={6} cy={6} r={6} fill={color} stroke="#000" strokeWidth={1} />
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
BubbleChart.displayName = "BubbleChart"
