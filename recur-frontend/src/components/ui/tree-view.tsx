

import * as React from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen, File } from "lucide-react"
import { cn } from "@/lib/utils"

interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  icon?: React.ReactNode
  data?: any
}

interface TreeViewProps {
  data: TreeNode[]
  onSelect?: (node: TreeNode) => void
  selectedId?: string
  className?: string
  defaultExpanded?: string[]
}

interface TreeNodeProps {
  node: TreeNode
  level: number
  onSelect?: (node: TreeNode) => void
  selectedId?: string
  expanded: Set<string>
  onToggle: (id: string) => void
}

function TreeNodeComponent({ node, level, onSelect, selectedId, expanded, onToggle }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onToggle(node.id)
    }
  }

  const handleSelect = () => {
    onSelect?.(node)
  }

  const getDefaultIcon = () => {
    if (hasChildren) {
      return isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-gray-100 transition-colors",
          isSelected && "bg-orange-100 border-2 border-orange-500",
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
      >
        {hasChildren ? (
          <button onClick={handleToggle} className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {node.icon || getDefaultIcon()}
          <span className="text-sm font-medium truncate">{node.label}</span>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({ data, onSelect, selectedId, className, defaultExpanded = [] }: TreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set(defaultExpanded))

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  return (
    <div
      className={cn("border-2 border-black rounded-lg bg-white dark:bg-gray-800 p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]", className)}
    >
      {data.map((node) => (
        <TreeNodeComponent
          key={node.id}
          node={node}
          level={0}
          onSelect={onSelect}
          selectedId={selectedId}
          expanded={expanded}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
