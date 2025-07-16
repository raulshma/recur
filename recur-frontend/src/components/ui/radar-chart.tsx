

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadarDataPoint {
  axis: string
  value: number
  fullMark?: number
}

interface RadarDataset {
  name: string
  data: RadarDataPoint[]
  color?: string
  fillOpacity?: number
}

interface RadarChartProps {
  datasets: RadarDataset[]
  size?: number
  className?: string
  showGrid?: boolean
  showLabels?: boolean
  showLegend?: boolean
  gridLevels?: number
}

export const RadarChart = React.forwardRef<HTMLDivElement, RadarChartProps>(
  (
    {
      datasets,
      size = 400,
      className,
      showGrid = true,
      showLabels = true,
      showLegend = true,
      gridLevels = 5,
      ...props
    },
    ref,
  ) => {
    if (!datasets || datasets.length === 0) return null

    const center = size / 2
    const radius = (size - 80) / 2
    const axes = datasets[0]?.data || []
    const angleStep = (2 * Math.PI) / axes.length

    const getPointPosition = (axisIndex: number, value: number, maxValue: number) => {
      const angle = angleStep * axisIndex - Math.PI / 2
      const distance = (value / maxValue) * radius
      return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance,
      }
    }

    const getAxisLabelPosition = (axisIndex: number) => {
      const angle = angleStep * axisIndex - Math.PI / 2
      const distance = radius + 30
      return {
        x: center + Math.cos(angle) * distance,
        y: center + Math.sin(angle) * distance,
      }
    }

    const maxValue = Math.max(
      ...datasets.flatMap((dataset) => dataset.data.map((point) => point.fullMark || point.value)),
    )
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
        <svg width={size} height={size + (showLegend ? 60 : 0)} className="overflow-visible">
          {/* Grid */}
          {showGrid && (
            <g>
              {Array.from({ length: gridLevels }, (_, i) => {
                const levelRadius = ((i + 1) / gridLevels) * radius
                const points = axes
                  .map((_, axisIndex) => {
                    const angle = angleStep * axisIndex - Math.PI / 2
                    return `${center + Math.cos(angle) * levelRadius},${center + Math.sin(angle) * levelRadius}`
                  })
                  .join(" ")

                return (
                  <polygon
                    key={i}
                    points={points}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={1}
                    strokeDasharray={i === gridLevels - 1 ? "none" : "2,2"}
                  />
                )
              })}
              {/* Axis lines */}
              {axes.map((_, axisIndex) => {
                const angle = angleStep * axisIndex - Math.PI / 2
                return (
                  <line
                    key={axisIndex}
                    x1={center}
                    y1={center}
                    x2={center + Math.cos(angle) * radius}
                    y2={center + Math.sin(angle) * radius}
                    stroke="#E5E7EB"
                    strokeWidth={1}
                  />
                )
              })}
            </g>
          )}

          {/* Data */}
          {datasets.map((dataset, datasetIndex) => {
            const color = dataset.color || colors[datasetIndex % colors.length]
            const points = dataset.data
              .map((point, axisIndex) => {
                const pos = getPointPosition(axisIndex, point.value, maxValue)
                return `${pos.x},${pos.y}`
              })
              .join(" ")

            return (
              <g key={datasetIndex}>
                {/* Fill area */}
                <polygon
                  points={points}
                  fill={color}
                  fillOpacity={dataset.fillOpacity || 0.2}
                  stroke={color}
                  strokeWidth={2}
                  className="transition-all hover:fill-opacity-30"
                />
                {/* Data points */}
                {dataset.data.map((point, axisIndex) => {
                  const pos = getPointPosition(axisIndex, point.value, maxValue)
                  return (
                    <circle
                      key={axisIndex}
                      cx={pos.x}
                      cy={pos.y}
                      r={4}
                      fill={color}
                      stroke="#fff"
                      strokeWidth={2}
                      className="transition-all hover:r-6"
                    />
                  )
                })}
              </g>
            )
          })}

          {/* Axis labels */}
          {showLabels &&
            axes.map((axis, axisIndex) => {
              const pos = getAxisLabelPosition(axisIndex)
              return (
                <text
                  key={axisIndex}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dy="0.35em"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#000"
                >
                  {axis.axis}
                </text>
              )
            })}

          {/* Legend */}
          {showLegend && (
            <g transform={`translate(20, ${size + 20})`}>
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
RadarChart.displayName = "RadarChart"
