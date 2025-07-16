

import * as React from "react"
import { Search, Clock, ArrowRight, Hash, User, File, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: React.ReactNode
  category: string
  keywords?: string[]
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CommandItem[]
  placeholder?: string
  recentItems?: string[]
  className?: string
}

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = "Type a command or search...",
  recentItems = [],
  className,
}: CommandPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!search) {
      // Show recent items first when no search
      const recent = items.filter((item) => recentItems.includes(item.id))
      const others = items.filter((item) => !recentItems.includes(item.id))
      return [...recent, ...others]
    }

    return items.filter((item) => {
      const searchLower = search.toLowerCase()
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))
      )
    })
  }, [items, search, recentItems])

  // Group items by category
  const groupedItems = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredItems.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = []
      }
      groups[item.category].push(item)
    })
    return groups
  }, [filteredItems])

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case "Enter":
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action()
            onOpenChange(false)
          }
          break
        case "Escape":
          onOpenChange(false)
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, selectedIndex, filteredItems, onOpenChange])

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSearch("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Update selected index when filtered items change
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "navigation":
        return <Hash className="h-4 w-4" />
      case "users":
        return <User className="h-4 w-4" />
      case "files":
        return <File className="h-4 w-4" />
      case "settings":
        return <Settings className="h-4 w-4" />
      default:
        return <Hash className="h-4 w-4" />
    }
  }

  let currentIndex = 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl p-0", className)}>
        <div className="border-2 border-black rounded-lg bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Search Input */}
          <div className="flex items-center border-b-2 border-black p-4">
            <Search className="h-5 w-5 text-gray-500 mr-3" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="border-none shadow-none p-0 focus-visible:ring-0 text-lg"
            />
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {Object.keys(groupedItems).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No results found</p>
                <p className="text-sm mt-1">Try searching for something else</p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                    {!search && recentItems.some((id) => categoryItems.some((item) => item.id === id)) && (
                      <Badge variant="secondary" className="ml-auto">
                        Recent
                      </Badge>
                    )}
                  </div>
                  {categoryItems.map((item) => {
                    const isSelected = currentIndex === selectedIndex
                    const itemIndex = currentIndex++

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0",
                          isSelected && "bg-orange-100 border-orange-200",
                        )}
                        onClick={() => {
                          item.action()
                          onOpenChange(false)
                        }}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                      >
                        {item.icon && <div className="flex-shrink-0 text-gray-500">{item.icon}</div>}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          {item.description && <div className="text-sm text-gray-500 truncate">{item.description}</div>}
                        </div>
                        {recentItems.includes(item.id) && !search && <Clock className="h-4 w-4 text-gray-400" />}
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t-2 border-black bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <div>
              {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
