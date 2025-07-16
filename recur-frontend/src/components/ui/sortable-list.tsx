

import * as React from "react"
import { GripVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SortableItem {
  id: string
  content: React.ReactNode
  data?: any
}

interface SortableListProps {
  items: SortableItem[]
  onReorder: (items: SortableItem[]) => void
  onRemove?: (id: string) => void
  className?: string
  itemClassName?: string
  showRemoveButton?: boolean
}

export function SortableList({
  items,
  onReorder,
  onRemove,
  className,
  itemClassName,
  showRemoveButton = false,
}: SortableListProps) {
  const [draggedItem, setDraggedItem] = React.useState<string | null>(null)
  const [dragOverItem, setDragOverItem] = React.useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverItem(itemId)
  }

  const handleDragLeave = () => {
    setDragOverItem(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()

    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null)
      setDragOverItem(null)
      return
    }

    const draggedIndex = items.findIndex((item) => item.id === draggedItem)
    const targetIndex = items.findIndex((item) => item.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newItems = [...items]
    const [removed] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, removed)

    onReorder(newItems)
    setDraggedItem(null)
    setDragOverItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          draggable
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={(e) => handleDragOver(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
          onDragEnd={handleDragEnd}
          className={cn(
            "flex items-center space-x-3 p-3 border-2 border-black rounded-lg bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-move",
            draggedItem === item.id && "opacity-50 rotate-2",
            dragOverItem === item.id && "border-orange-500 bg-orange-50",
            "hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]",
            itemClassName,
          )}
        >
          <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">{item.content}</div>
          {showRemoveButton && onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
