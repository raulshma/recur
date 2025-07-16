

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScatterPoint {
  x: number
  y: number
  size?: number
  color?: string
  label?: string
}

interface ScatterDataset {
  name: string
  data: ScatterPoint[]
  color?: string
  shape?: "circle" | "square" | "triangle"
}

interface ScatterPlotProps {
  datasets: ScatterDataset[]
  width?: number
  height?: number
  className?: string
  showGrid?: boolean
  showAxes?: boolean
  showLegend?: boolean
  xAxisLabel?: string
  yAxisLabel?: string
  xDomain?: [number, number]
  yDomain?: [number, number]
}

export const ScatterPlot = React.forwardRef<HTMLDivElement, ScatterPlotProps>(
  (
    {
      datasets,
      width = 600,
      height = 400,
      className,
      showGrid = true,
      showAxes = true,
      showLegend = true,
      xAxisLabel,
      yAxisLabel,
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

    const xScale = (value: number) => ((value - xMin) / (xMax - xMin)) * chartWidth
    const yScale = (value: number) => chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight

    const colors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]

    const renderShape = (shape: string, x: number, y: number, size: number, color: string) => {
      switch (shape) {
        case "square":
          return (
            <rect
              x={x - size / 2}
              y={y - size / 2}
              width={size}
              height={size}
              fill={color}
              stroke="#000"
              strokeWidth={1}
            />
          )
        case "triangle":
          const points = `${x},${y - size / 2} ${x - size / 2},${y + size / 2} ${x + size / 2},${y + size / 2}`
          return <polygon points={points} fill={color} stroke="#000" strokeWidth={1} />
        default:
          return <circle cx={x} cy={y} r={size / 2} fill={color} stroke="#000" strokeWidth={1} />
      }
    }

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

            {/* Data points */}
            {datasets.map((dataset, datasetIndex) => {
              const color = dataset.color || colors[datasetIndex % colors.length]
              return (
                <g key={datasetIndex}>
                  {dataset.data.map((point, pointIndex) => {
                    const x = xScale(point.x)
                    const y = yScale(point.y)
                    const size = point.size || 8
                    const pointColor = point.color || color

                    return (
                      <g key={pointIndex} className="transition-all hover:opacity-80">
                        {renderShape(dataset.shape || "circle", x, y, size, pointColor)}
                        {point.label && (
                          <text
                            x={x}
                            y={y - size / 2 - 5}
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
                    {renderShape(dataset.shape || "circle", 6, 6, 12, color)}
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
ScatterPlot.displayName = "ScatterPlot"
