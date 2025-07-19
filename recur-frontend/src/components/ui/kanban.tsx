

import * as React from "react"
import { Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface KanbanTask {
  id: string
  title: string
  description?: string
  assignee?: string
  priority: "low" | "medium" | "high"
  tags?: string[]
}

interface KanbanColumn {
  id: string
  title: string
  tasks: KanbanTask[]
  color?: string
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void
  onTaskAdd?: (columnId: string) => void
  className?: string
}

const getPriorityColor = (priority: KanbanTask["priority"]) => {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "warning"
    case "low":
      return "secondary"
    default:
      return "default"
  }
}

export function KanbanBoard({ columns, onTaskMove, onTaskAdd, className }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = React.useState<string | null>(null)
  const [draggedFrom, setDraggedFrom] = React.useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: string, columnId: string) => {
    setDraggedTask(taskId)
    setDraggedFrom(columnId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    if (draggedTask && draggedFrom && draggedFrom !== columnId) {
      onTaskMove?.(draggedTask, draggedFrom, columnId)
    }
    setDraggedTask(null)
    setDraggedFrom(null)
  }

  return (
    <div className={cn("flex space-x-6 overflow-x-auto pb-4", className)}>
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{column.title}</CardTitle>
                  <Badge variant="outline">{column.tasks.length}</Badge>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => onTaskAdd?.(column.id)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Edit Column</DropdownMenuItem>
                      <DropdownMenuItem>Clear All</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete Column</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {column.tasks.map((task) => (
                    <Card
                      key={task.id}
                      className={cn(
                        "cursor-move transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]",
                        draggedTask === task.id && "opacity-50",
                      )}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id, column.id)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-bold text-sm mb-2">{task.title}</h4>
                        {task.description && <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>}
                        <div className="flex items-center justify-between">
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority}
                          </Badge>
                          {task.assignee && (
                            <div className="h-6 w-6 rounded-full bg-orange-500 border-2 border-black flex items-center justify-center text-xs font-bold text-white">
                              {task.assignee.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
