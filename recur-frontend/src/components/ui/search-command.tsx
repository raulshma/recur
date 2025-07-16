

import * as React from "react"
import { Search, Clock, Hash, User, File } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

interface SearchResult {
  id: string
  title: string
  description?: string
  type: "page" | "user" | "file" | "command"
  url?: string
  icon?: React.ReactNode
  category?: string
}

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: SearchResult[]
  recentSearches?: string[]
  onSelect: (result: SearchResult) => void
  placeholder?: string
}

const getTypeIcon = (type: SearchResult["type"]) => {
  switch (type) {
    case "user":
      return <User className="h-4 w-4" />
    case "file":
      return <File className="h-4 w-4" />
    case "command":
      return <Hash className="h-4 w-4" />
    default:
      return <Search className="h-4 w-4" />
  }
}

const getTypeBadge = (type: SearchResult["type"]) => {
  const variants = {
    page: "default",
    user: "secondary",
    file: "outline",
    command: "destructive",
  } as const

  return (
    <Badge variant={variants[type]} className="text-xs">
      {type}
    </Badge>
  )
}

export function SearchCommand({
  open,
  onOpenChange,
  results,
  recentSearches = [],
  onSelect,
  placeholder = "Search everything...",
}: SearchCommandProps) {
  const [query, setQuery] = React.useState("")

  const filteredResults = React.useMemo(() => {
    if (!query) return results.slice(0, 10)
    return results.filter(
      (result) =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.toLowerCase()) ||
        result.category?.toLowerCase().includes(query.toLowerCase()),
    )
  }, [results, query])

  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    filteredResults.forEach((result) => {
      const category = result.category || result.type
      if (!groups[category]) groups[category] = []
      groups[category].push(result)
    })
    return groups
  }, [filteredResults])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!query && recentSearches.length > 0 && (
          <>
            <CommandGroup heading="Recent Searches">
              {recentSearches.slice(0, 5).map((search, index) => (
                <CommandItem key={index} onSelect={() => setQuery(search)}>
                  <Clock className="mr-2 h-4 w-4 text-gray-400" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {Object.entries(groupedResults).map(([category, items]) => (
          <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
            {items.map((result) => (
              <CommandItem key={result.id} onSelect={() => onSelect(result)} className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 flex-1">
                  {result.icon || getTypeIcon(result.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">{result.title}</span>
                      {getTypeBadge(result.type)}
                    </div>
                    {result.description && <p className="text-sm text-gray-500 truncate">{result.description}</p>}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
