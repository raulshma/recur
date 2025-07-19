

import * as React from "react"
import { cn } from "@/lib/utils"

interface FunnelStep {
  name: string
  value: number
  color?: string
  dropoffRate?: number
}

interface FunnelChartProps {
  data: FunnelStep[]
  className?: string
  height?: number
  showValues?: boolean
  showDropoffRates?: boolean
  animated?: boolean
}

export const FunnelChart = React.forwardRef<HTMLDivElement, FunnelChartProps>(
  ({ data, className, height = 400, showValues = true, showDropoffRates = true, animated = true, ...props }, ref) => {
    if (!data || data.length === 0) return null

    const maxValue = Math.max(...data.map((step) => step.value))
    const colors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"]

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white dark:bg-gray-800 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        style={{ height }}
        {...props}
      >
        <div className="flex flex-col justify-center h-full space-y-2">
          {data.map((step, index) => {
            const width = (step.value / maxValue) * 100
            const color = step.color || colors[index % colors.length]
            const previousValue = index > 0 ? data[index - 1].value : step.value
            const dropoffRate = index > 0 ? ((previousValue - step.value) / previousValue) * 100 : 0

            return (
              <div key={index} className="relative">
                {/* Step Bar */}
                <div
                  className={cn(
                    "relative border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-500 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
                    animated && "animate-in slide-in-from-left duration-700",
                  )}
                  style={{
                    width: `${width}%`,
                    backgroundColor: color,
                    height: "60px",
                    animationDelay: animated ? `${index * 200}ms` : "0ms",
                  }}
                >
                  {/* Step Content */}
                  <div className="flex items-center justify-between h-full px-4">
                    <div className="flex-1">
                      <div className="font-bold text-black text-sm">{step.name}</div>
                      {showValues && (
                        <div className="text-xs text-black opacity-80">{step.value.toLocaleString()} users</div>
                      )}
                    </div>
                    {showValues && <div className="text-lg font-black text-black">{step.value.toLocaleString()}</div>}
                  </div>
                </div>

                {/* Dropoff Rate */}
                {showDropoffRates && index > 0 && (
                  <div className="absolute -right-20 top-1/2 transform -translate-y-1/2">
                    <div className="bg-red-100 border-2 border-red-500 rounded px-2 py-1 text-xs font-bold text-red-700">
                      -{dropoffRate.toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
FunnelChart.displayName = "FunnelChart"
