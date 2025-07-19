

import * as React from "react"
import { cn } from "@/lib/utils"

interface SankeyNode {
  id: string
  name: string
  value: number
  color?: string
  x?: number
  y?: number
  height?: number
}

interface SankeyLink {
  source: string
  target: string
  value: number
  color?: string
}

interface SankeyDiagramProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  width?: number
  height?: number
  className?: string
  nodeWidth?: number
  nodePadding?: number
}

export const SankeyDiagram = React.forwardRef<HTMLDivElement, SankeyDiagramProps>(
  ({ nodes, links, width = 800, height = 400, className, nodeWidth = 20, nodePadding = 10, ...props }, ref) => {
    const [processedData, setProcessedData] = React.useState<{
      nodes: SankeyNode[]
      links: SankeyLink[]
    }>({ nodes: [], links: [] })

    React.useEffect(() => {
      // Simple layout algorithm for Sankey diagram
      const processedNodes = [...nodes]
      const processedLinks = [...links]

      // Calculate node positions
      const columns = new Map<string, number>()
      const nodesByColumn = new Map<number, SankeyNode[]>()

      // Assign columns based on dependencies
      processedNodes.forEach((node) => {
        const incomingLinks = processedLinks.filter((link) => link.target === node.id)
        const column =
          incomingLinks.length === 0 ? 0 : Math.max(...incomingLinks.map((link) => columns.get(link.source) || 0)) + 1
        columns.set(node.id, column)

        if (!nodesByColumn.has(column)) {
          nodesByColumn.set(column, [])
        }
        nodesByColumn.get(column)!.push(node)
      })

      const maxColumn = Math.max(...columns.values())
      const columnWidth = (width - nodeWidth) / Math.max(maxColumn, 1)

      // Position nodes
      nodesByColumn.forEach((columnNodes, column) => {
        const totalValue = columnNodes.reduce((sum, node) => sum + node.value, 0)
        const availableHeight = height - (columnNodes.length - 1) * nodePadding
        let currentY = 0

        columnNodes.forEach((node) => {
          const nodeHeight = (node.value / totalValue) * availableHeight
          node.x = column * columnWidth
          node.y = currentY
          node.height = nodeHeight
          currentY += nodeHeight + nodePadding
        })
      })

      setProcessedData({ nodes: processedNodes, links: processedLinks })
    }, [nodes, links, width, height, nodeWidth, nodePadding])

    const getNodeById = (id: string) => processedData.nodes.find((node) => node.id === id)

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-md border-2 border-black bg-white dark:bg-gray-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          className,
        )}
        {...props}
      >
        <svg width={width} height={height} className="overflow-visible">
          {/* Links */}
          {processedData.links.map((link, index) => {
            const sourceNode = getNodeById(link.source)
            const targetNode = getNodeById(link.target)

            if (!sourceNode || !targetNode) return null

            const sourceX = (sourceNode.x || 0) + nodeWidth
            const sourceY = (sourceNode.y || 0) + (sourceNode.height || 0) / 2
            const targetX = targetNode.x || 0
            const targetY = (targetNode.y || 0) + (targetNode.height || 0) / 2

            const controlPoint1X = sourceX + (targetX - sourceX) / 2
            const controlPoint2X = sourceX + (targetX - sourceX) / 2

            const pathD = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${sourceY} ${controlPoint2X} ${targetY} ${targetX} ${targetY}`

            return (
              <path
                key={index}
                d={pathD}
                stroke={link.color || "#FF6B35"}
                strokeWidth={Math.max(2, (link.value / Math.max(...processedData.links.map((l) => l.value))) * 20)}
                fill="none"
                opacity={0.6}
                className="transition-opacity hover:opacity-100"
              />
            )
          })}

          {/* Nodes */}
          {processedData.nodes.map((node, index) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={nodeWidth}
                height={node.height}
                fill={node.color || "#4ECDC4"}
                stroke="#000"
                strokeWidth={2}
                className="transition-all hover:stroke-width-3"
              />
              <text
                x={(node.x || 0) + nodeWidth + 8}
                y={(node.y || 0) + (node.height || 0) / 2}
                dy="0.35em"
                fontSize="12"
                fontWeight="bold"
                fill="#000"
              >
                {node.name}
              </text>
              <text
                x={(node.x || 0) + nodeWidth + 8}
                y={(node.y || 0) + (node.height || 0) / 2 + 16}
                dy="0.35em"
                fontSize="10"
                fill="#666"
              >
                {node.value.toLocaleString()}
              </text>
            </g>
          ))}
        </svg>
      </div>
    )
  },
)
SankeyDiagram.displayName = "SankeyDiagram"
