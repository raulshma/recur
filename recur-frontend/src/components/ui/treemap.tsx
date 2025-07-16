

import * as React from "react"
import { cn } from "@/lib/utils"

interface TreemapItem {
  name: string
  value: number
  color?: string
  children?: TreemapItem[]
}

interface TreemapRect {
  x: number
  y: number
  width: number
  height: number
  item: TreemapItem
  depth: number
}

interface TreemapProps {
  data: TreemapItem[]
  width?: number
  height?: number
  className?: string
  showLabels?: boolean
  showValues?: boolean
  minLabelSize?: number
}

export const Treemap = React.forwardRef<HTMLDivElement, TreemapProps>(
  (
    { data, width = 600, height = 400, className, showLabels = true, showValues = true, minLabelSize = 30, ...props },
    ref,
  ) => {
    const [rects, setRects] = React.useState<TreemapRect[]>([])

    React.useEffect(() => {
      const squarify = (items: TreemapItem[], x: number, y: number, w: number, h: number, depth = 0): TreemapRect[] => {
        if (items.length === 0) return []

        const totalValue = items.reduce((sum, item) => sum + item.value, 0)
        const results: TreemapRect[] = []

        let currentX = x
        let currentY = y
        const remainingWidth = w
        const remainingHeight = h

        items.forEach((item, index) => {
          const ratio = item.value / totalValue
          let rectWidth: number
          let rectHeight: number

          if (w > h) {
            // Horizontal layout
            rectWidth = w * ratio
            rectHeight = h
            currentX = x + (w * items.slice(0, index).reduce((sum, prev) => sum + prev.value, 0)) / totalValue
            currentY = y
          } else {
            // Vertical layout
            rectWidth = w
            rectHeight = h * ratio
            currentX = x
            currentY = y + (h * items.slice(0, index).reduce((sum, prev) => sum + prev.value, 0)) / totalValue
          }

          results.push({
            x: currentX,
            y: currentY,
            width: rectWidth,
            height: rectHeight,
            item,
            depth,
          })

          // Recursively handle children
          if (item.children && item.children.length > 0) {
            const childRects = squarify(
              item.children,
              currentX + 2,
              currentY + 2,
              rectWidth - 4,
              rectHeight - 4,
              depth + 1,
            )
            results.push(...childRects)
          }
        })

        return results
      }

      const calculatedRects = squarify(data, 0, 0, width, height)
      setRects(calculatedRects)
    }, [data, width, height])

    const colors = ["#FF6B35", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        {...props}
      >
        <svg width={width} height={height} className="overflow-visible">
          {rects.map((rect, index) => {
            const color = rect.item.color || colors[index % colors.length]
            const textColor = rect.depth > 0 ? "#000" : "#fff"
            const showText = rect.width > minLabelSize && rect.height > minLabelSize

            return (
              <g key={`${rect.item.name}-${index}`}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={color}
                  stroke="#000"
                  strokeWidth={rect.depth === 0 ? 2 : 1}
                  opacity={rect.depth === 0 ? 1 : 0.7}
                  className="transition-all hover:opacity-100 hover:stroke-width-2"
                />
                {showText && showLabels && (
                  <text
                    x={rect.x + rect.width / 2}
                    y={rect.y + rect.height / 2 - (showValues ? 8 : 0)}
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={Math.min(14, rect.width / 8, rect.height / 4)}
                    fontWeight="bold"
                    fill={textColor}
                    className="pointer-events-none"
                  >
                    {rect.item.name}
                  </text>
                )}
                {showText && showValues && (
                  <text
                    x={rect.x + rect.width / 2}
                    y={rect.y + rect.height / 2 + 8}
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={Math.min(12, rect.width / 10, rect.height / 6)}
                    fill={textColor}
                    opacity={0.9}
                    className="pointer-events-none"
                  >
                    {rect.item.value.toLocaleString()}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    )
  },
)
Treemap.displayName = "Treemap"
